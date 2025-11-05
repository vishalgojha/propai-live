import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Broker Duplicate Detection System
 * 
 * Scans all brokers and detects duplicates based on:
 * - Same phone number (exact match)
 * - Similar names (fuzzy match with Levenshtein distance)
 * - Same agency name
 * 
 * Marks duplicates and keeps the oldest broker as the original.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode } = await req.json();
    const isDryRun = mode === 'dry_run';

    console.log(`🔍 Starting broker duplicate detection (${isDryRun ? 'DRY RUN' : 'LIVE MODE'})...`);

    // Get all brokers (excluding already merged)
    const allBrokers = await base44.asServiceRole.entities.Broker.list('-created_date');
    const activeBrokers = allBrokers.filter(b => !b.duplicate_of);

    console.log(`Found ${activeBrokers.length} brokers to scan`);

    // Group brokers by potential duplicate sets
    const duplicateGroups = new Map();
    const processedIds = new Set();

    for (let i = 0; i < activeBrokers.length; i++) {
      const broker1 = activeBrokers[i];
      
      // Skip if already processed
      if (processedIds.has(broker1.id)) continue;

      const matchGroup = [broker1];

      // Find all potential duplicates
      for (let j = i + 1; j < activeBrokers.length; j++) {
        const broker2 = activeBrokers[j];

        if (processedIds.has(broker2.id)) continue;

        // Match criteria
        const phoneMatch = checkPhoneMatch(broker1, broker2);
        const nameMatch = checkNameSimilarity(broker1.name, broker2.name);
        const agencyMatch = broker1.agency_name && broker2.agency_name && 
          broker1.agency_name.toLowerCase() === broker2.agency_name.toLowerCase();

        // Duplicate if:
        // - Same phone (exact match) OR
        // - Very similar name (> 85% similarity) + same agency
        if (phoneMatch || (nameMatch > 85 && agencyMatch)) {
          matchGroup.push(broker2);
          processedIds.add(broker2.id);
        }
      }

      // If we found duplicates (2+ brokers in group)
      if (matchGroup.length > 1) {
        // Sort by created_date (oldest first)
        matchGroup.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        
        const originalId = matchGroup[0].id; // Keep oldest as original
        duplicateGroups.set(originalId, matchGroup);
      }

      processedIds.add(broker1.id);
    }

    console.log(`Found ${duplicateGroups.size} duplicate groups`);

    // Build report
    const duplicateSets = [];
    let totalDuplicatesFound = 0;

    for (const [originalId, group] of duplicateGroups.entries()) {
      const original = group[0];
      const duplicates = group.slice(1);
      totalDuplicatesFound += duplicates.length;

      duplicateSets.push({
        original: {
          id: original.id,
          custom_id: original.custom_id,
          name: original.name,
          phone: original.phone,
          agency: original.agency_name,
          total_listings: original.total_listings_count || 0,
          created_date: original.created_date
        },
        duplicates: duplicates.map(dup => ({
          id: dup.id,
          custom_id: dup.custom_id,
          name: dup.name,
          phone: dup.phone,
          agency: dup.agency_name,
          total_listings: dup.total_listings_count || 0,
          created_date: dup.created_date,
          match_reason: determineMatchReason(original, dup)
        }))
      });
    }

    // If live mode, merge duplicates
    let mergedCount = 0;
    const errors = [];

    if (!isDryRun) {
      console.log('🔧 Merging duplicate brokers...');

      for (const set of duplicateSets) {
        const originalId = set.original.id;
        const duplicateIds = set.duplicates.map(d => d.id);

        try {
          // Get all properties from duplicate brokers
          const allProperties = await base44.asServiceRole.entities.Property.list();
          
          for (const duplicate of set.duplicates) {
            // Reassign properties from duplicate to original
            const duplicateProperties = allProperties.filter(p => p.broker_id === duplicate.id);
            
            for (const prop of duplicateProperties) {
              await base44.asServiceRole.entities.Property.update(prop.id, {
                broker_id: originalId,
                broker_contact: set.original.phone // Update contact too
              });
            }

            // Mark duplicate broker
            await base44.asServiceRole.entities.Broker.update(duplicate.id, {
              status: 'Dormant',
              duplicate_of: originalId
            });

            mergedCount++;
          }

          // Update original broker with merged info
          const currentOriginal = await base44.asServiceRole.entities.Broker.filter({ id: originalId });
          const original = currentOriginal[0];
          
          const mergedWith = original.merged_with || [];
          mergedWith.push(...duplicateIds);

          // Combine areas_covered
          const allAreas = new Set(original.areas_covered || []);
          for (const dup of set.duplicates) {
            const dupBroker = activeBrokers.find(b => b.id === dup.id);
            if (dupBroker?.areas_covered) {
              dupBroker.areas_covered.forEach(area => allAreas.add(area));
            }
          }

          // Recalculate total listings
          const originalProperties = allProperties.filter(p => p.broker_id === originalId);
          const totalListings = originalProperties.length;
          const activeListings = originalProperties.filter(p => p.status === 'Active').length;

          await base44.asServiceRole.entities.Broker.update(originalId, {
            merged_with: mergedWith,
            areas_covered: Array.from(allAreas),
            total_listings_count: totalListings,
            active_listings_count: activeListings
          });

        } catch (error) {
          console.error(`Error merging duplicates for ${originalId}:`, error);
          errors.push({
            original_id: originalId,
            error: error.message
          });
        }
      }

      console.log(`✅ Merged ${mergedCount} duplicate brokers`);
    }

    return Response.json({
      success: true,
      mode: isDryRun ? 'dry_run' : 'live',
      summary: {
        total_brokers_scanned: activeBrokers.length,
        duplicate_groups_found: duplicateGroups.size,
        total_duplicates: totalDuplicatesFound,
        duplicates_merged: mergedCount,
        errors: errors.length
      },
      duplicate_sets: duplicateSets.slice(0, 50), // Return top 50 for preview
      errors: errors
    });

  } catch (error) {
    console.error('Broker duplicate detection error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});

// Helper: Check if phone numbers match
function checkPhoneMatch(broker1, broker2) {
  const normalizePhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '').slice(-10); // Last 10 digits
  };

  const phone1 = normalizePhone(broker1.phone);
  const phone2 = normalizePhone(broker2.phone);

  if (!phone1 || !phone2) return false;
  
  // Exact match on last 10 digits
  if (phone1 === phone2) return true;

  // Check alternate phones
  if (broker1.alternate_phones) {
    for (const altPhone of broker1.alternate_phones) {
      if (normalizePhone(altPhone) === phone2) return true;
    }
  }

  if (broker2.alternate_phones) {
    for (const altPhone of broker2.alternate_phones) {
      if (normalizePhone(altPhone) === phone1) return true;
    }
  }

  return false;
}

// Helper: Calculate name similarity using Levenshtein distance
function checkNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const normalize = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const n1 = normalize(name1);
  const n2 = normalize(name2);

  if (n1 === n2) return 100;

  const distance = levenshteinDistance(n1, n2);
  const maxLength = Math.max(n1.length, n2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Helper: Determine why brokers matched
function determineMatchReason(broker1, broker2) {
  const phoneMatch = checkPhoneMatch(broker1, broker2);
  const nameSimilarity = checkNameSimilarity(broker1.name, broker2.name);
  const agencyMatch = broker1.agency_name && broker2.agency_name && 
    broker1.agency_name.toLowerCase() === broker2.agency_name.toLowerCase();

  if (phoneMatch) return 'Same phone number';
  if (nameSimilarity > 85 && agencyMatch) return `Similar name (${nameSimilarity}% match) + same agency`;
  return 'Unknown match';
}