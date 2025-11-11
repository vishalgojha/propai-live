import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BUILDING DUPLICATE DETECTION
 * 
 * Identifies duplicate building records:
 * - Similar name + same location
 * 
 * Merges duplicates:
 * - Keeps oldest building as original
 * - Marks duplicates
 * - Reassigns all properties to original
 * 
 * Modes:
 * - dry_run: Analyze duplicates
 * - live: Merge duplicates
 */

function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  str1 = str1.toLowerCase().replace(/\s+/g, '');
  str2 = str2.toLowerCase().replace(/\s+/g, '');
  
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

    console.log(`🏢 Running building duplicate detection in ${mode} mode...`);

    const buildings = await base44.asServiceRole.entities.Building.list();
    const properties = await base44.asServiceRole.entities.Property.list();

    // Group buildings by location
    const locationGroups = {};
    
    for (const building of buildings) {
      const location = building.location?.toLowerCase() || 'unknown';
      
      if (!locationGroups[location]) {
        locationGroups[location] = [];
      }
      
      locationGroups[location].push(building);
    }

    // Find duplicates within each location
    const duplicateGroups = [];
    
    for (const group of Object.values(locationGroups)) {
      if (group.length < 2) continue;
      
      // Compare each building with others in the same location
      for (let i = 0; i < group.length; i++) {
        const matches = [group[i]];
        
        for (let j = i + 1; j < group.length; j++) {
          const similarity = stringSimilarity(group[i].name, group[j].name);
          
          // If names are very similar (>80%), consider duplicates
          if (similarity > 0.8) {
            matches.push(group[j]);
          }
        }
        
        if (matches.length > 1) {
          // Check if we already added this group
          const alreadyAdded = duplicateGroups.some(dg => 
            dg.some(b => matches.some(m => m.id === b.id))
          );
          
          if (!alreadyAdded) {
            duplicateGroups.push(matches);
          }
        }
      }
    }

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
        const duplicateProperties = properties.filter(p => p.building_id === duplicate.id);
        
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
      console.log(`🔧 Merging ${mergeActions.length} duplicate buildings...`);
      
      for (const action of mergeActions) {
        try {
          // ✅ FIXED: Only update duplicate_of field
          await base44.asServiceRole.entities.Building.update(action.duplicate_id, {
            duplicate_of: action.original_id
          });
          
          // Reassign properties
          const duplicateProperties = properties.filter(p => p.building_id === action.duplicate_id);
          
          for (const property of duplicateProperties) {
            try {
              // ✅ FIXED: Only update building fields
              const propertyUpdate = {
                building_id: action.original_id,
                building_name: action.original_name
              };
              
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
        } catch (buildingError) {
          console.error(`Failed to merge building ${action.duplicate_id}:`, buildingError.message);
          errors++;
          errorDetails.push({
            type: 'building_merge',
            building_id: action.duplicate_id,
            error: buildingError.message
          });
        }
      }
      
      console.log(`✅ Merged ${duplicatesMerged} buildings, reassigned ${propertiesReassigned} properties (${errors} errors)`);
    }

    return Response.json({
      success: true,
      mode,
      summary: {
        total_buildings_scanned: buildings.length,
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
    console.error('Building duplicate detection error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});