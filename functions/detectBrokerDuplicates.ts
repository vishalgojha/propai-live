import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BROKER DUPLICATE DETECTION
 * 
 * Identifies duplicate broker records:
 * - Exact phone match
 * - Similar name + same phone prefix
 * 
 * Merges duplicates:
 * - Keeps oldest broker as original
 * - Marks duplicates
 * - Reassigns all properties to original
 * 
 * Modes:
 * - dry_run: Analyze duplicates
 * - live: Merge duplicates
 */

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  
  if (str1 === str2) return 1;
  
  // Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(str1.length, str2.length);
  return 1 - matrix[str1.length][str2.length] / maxLen;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { mode = 'dry_run' } = await req.json();

    console.log(`👥 Running broker duplicate detection in ${mode} mode...`);

    const brokers = await base44.asServiceRole.entities.Broker.list();
    const properties = await base44.asServiceRole.entities.Property.list();

    // Group brokers by phone
    const phoneGroups = {};
    
    for (const broker of brokers) {
      const normalizedPhone = normalizePhone(broker.phone);
      
      if (!normalizedPhone) continue;
      
      if (!phoneGroups[normalizedPhone]) {
        phoneGroups[normalizedPhone] = [];
      }
      
      phoneGroups[normalizedPhone].push(broker);
    }

    // Find duplicate groups
    const duplicateGroups = Object.values(phoneGroups).filter(group => group.length > 1);

    console.log(`Found ${duplicateGroups.length} duplicate groups`);

    let totalDuplicates = 0;
    const mergeActions = [];

    for (const group of duplicateGroups) {
      // Sort by created_date (oldest first)
      group.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      const original = group[0];
      const duplicates = group.slice(1);
      
      totalDuplicates += duplicates.length;

      for (const duplicate of duplicates) {
        // Find properties assigned to duplicate
        const duplicateProperties = properties.filter(p => p.broker_id === duplicate.id);
        
        mergeActions.push({
          duplicate_id: duplicate.id,
          duplicate_name: duplicate.name,
          original_id: original.id,
          original_name: original.name,
          properties_to_reassign: duplicateProperties.length
        });
      }
    }

    // Apply merges if in live mode
    let duplicatesMerged = 0;
    let propertiesReassigned = 0;
    let errors = 0;
    const errorDetails = []; // ✅ NEW: Track error details

    if (mode === 'live' && mergeActions.length > 0) {
      console.log(`🔧 Merging ${mergeActions.length} duplicate brokers...`);
      
      for (const action of mergeActions) {
        try {
          // ✅ FIXED: Only update fields that exist in Broker schema
          const brokerUpdate = {
            duplicate_of: action.original_id,
            status: 'Dormant'
          };
          
          await base44.asServiceRole.entities.Broker.update(action.duplicate_id, brokerUpdate);
          
          // Reassign properties
          const duplicateProperties = properties.filter(p => p.broker_id === action.duplicate_id);
          
          for (const property of duplicateProperties) {
            try {
              // ✅ FIXED: Get original broker data for caching
              const originalBroker = brokers.find(b => b.id === action.original_id);
              
              const propertyUpdate = {
                broker_id: action.original_id
              };
              
              // Only add cached fields if they exist in original broker
              if (originalBroker) {
                if (originalBroker.name) propertyUpdate.broker_name = originalBroker.name;
                if (originalBroker.phone) propertyUpdate.broker_contact = originalBroker.phone;
                if (typeof originalBroker.trust_score === 'number') {
                  propertyUpdate.broker_trust_score = originalBroker.trust_score;
                }
              }
              
              await base44.asServiceRole.entities.Property.update(property.id, propertyUpdate);
              propertiesReassigned++;
            } catch (propertyError) {
              console.error(`Failed to reassign property ${property.id}:`, propertyError.message);
              errorDetails.push({
                type: 'property_reassign',
                property_id: property.id,
                error: propertyError.message
              });
            }
          }
          
          duplicatesMerged++;
        } catch (brokerError) {
          console.error(`Failed to merge broker ${action.duplicate_id}:`, brokerError.message);
          errors++;
          errorDetails.push({
            type: 'broker_merge',
            broker_id: action.duplicate_id,
            error: brokerError.message
          });
        }
      }
      
      console.log(`✅ Merged ${duplicatesMerged} brokers, reassigned ${propertiesReassigned} properties (${errors} errors)`);
    }

    return Response.json({
      success: true,
      mode,
      summary: {
        total_brokers_scanned: brokers.length,
        duplicate_groups_found: duplicateGroups.length,
        total_duplicates: totalDuplicates,
        duplicates_merged: mode === 'live' ? duplicatesMerged : 0,
        properties_reassigned: mode === 'live' ? propertiesReassigned : 0,
        errors: mode === 'live' ? errors : 0
      },
      error_details: mode === 'live' && errorDetails.length > 0 ? errorDetails.slice(0, 10) : undefined, // ✅ NEW: Show first 10 errors
      merge_actions: mode === 'dry_run' ? mergeActions : undefined
    });

  } catch (error) {
    console.error('Broker duplicate detection error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});