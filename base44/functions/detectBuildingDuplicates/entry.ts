import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Building Duplicate Detection System
 * 
 * Scans all buildings and detects duplicates based on:
 * - Same name (fuzzy match with Levenshtein distance)
 * - Same location
 * 
 * Marks duplicates and keeps the oldest building as the original.
 * Reassigns all properties from duplicates to the original building.
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

    console.log(`🔍 Starting building duplicate detection (${isDryRun ? 'DRY RUN' : 'LIVE MODE'})...`);

    // Get all buildings (excluding already marked duplicates)
    const allBuildings = await base44.asServiceRole.entities.Building.list('-created_date');
    const activeBuildings = allBuildings.filter(b => !b.duplicate_of);

    console.log(`Found ${activeBuildings.length} buildings to scan`);

    // Group buildings by potential duplicate sets
    const duplicateGroups = new Map();
    const processedIds = new Set();

    for (let i = 0; i < activeBuildings.length; i++) {
      const building1 = activeBuildings[i];
      
      // Skip if already processed
      if (processedIds.has(building1.id)) continue;

      const matchGroup = [building1];

      // Find all potential duplicates
      for (let j = i + 1; j < activeBuildings.length; j++) {
        const building2 = activeBuildings[j];

        if (processedIds.has(building2.id)) continue;

        // Match criteria
        const sameLocation = building1.location === building2.location;
        const nameSimilarity = checkNameSimilarity(building1.name, building2.name);

        // Duplicate if:
        // - Same location AND
        // - Very similar name (> 85% similarity)
        if (sameLocation && nameSimilarity > 85) {
          matchGroup.push(building2);
          processedIds.add(building2.id);
        }
      }

      // If we found duplicates (2+ buildings in group)
      if (matchGroup.length > 1) {
        // Sort by created_date (oldest first)
        matchGroup.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        
        const originalId = matchGroup[0].id; // Keep oldest as original
        duplicateGroups.set(originalId, matchGroup);
      }

      processedIds.add(building1.id);
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
          location: original.location,
          total_listings: original.total_listings || 0,
          active_listings: original.active_listings || 0,
          created_date: original.created_date
        },
        duplicates: duplicates.map(dup => ({
          id: dup.id,
          custom_id: dup.custom_id,
          name: dup.name,
          location: dup.location,
          total_listings: dup.total_listings || 0,
          active_listings: dup.active_listings || 0,
          created_date: dup.created_date,
          match_similarity: checkNameSimilarity(original.name, dup.name)
        }))
      });
    }

    // If live mode, merge duplicates
    let mergedCount = 0;
    const errors = [];

    if (!isDryRun) {
      console.log('🔧 Merging duplicate buildings...');

      for (const set of duplicateSets) {
        const originalId = set.original.id;
        const duplicateIds = set.duplicates.map(d => d.id);

        try {
          // Get all properties
          const allProperties = await base44.asServiceRole.entities.Property.list();
          
          for (const duplicate of set.duplicates) {
            // Reassign properties from duplicate to original
            const duplicateProperties = allProperties.filter(p => p.building_id === duplicate.id);
            
            for (const prop of duplicateProperties) {
              await base44.asServiceRole.entities.Property.update(prop.id, {
                building_id: originalId,
                building_name: set.original.name // Update name to canonical
              });
            }

            // Mark duplicate building
            await base44.asServiceRole.entities.Building.update(duplicate.id, {
              duplicate_of: originalId,
              verified: false // Unverify duplicates
            });

            mergedCount++;
          }

          // Recalculate stats for original building
          const originalProperties = allProperties.filter(p => p.building_id === originalId);
          const totalListings = originalProperties.length;
          const activeListings = originalProperties.filter(p => p.status === 'Active').length;

          // Merge known_variants
          const allVariants = new Set(set.original.known_variants || []);
          for (const dup of set.duplicates) {
            allVariants.add(dup.name);
            if (dup.known_variants) {
              dup.known_variants.forEach(v => allVariants.add(v));
            }
          }

          await base44.asServiceRole.entities.Building.update(originalId, {
            total_listings: totalListings,
            active_listings: activeListings,
            known_variants: Array.from(allVariants),
            verified: true // Mark original as verified after merge
          });

        } catch (error) {
          console.error(`Error merging duplicates for ${originalId}:`, error);
          errors.push({
            original_id: originalId,
            error: error.message
          });
        }
      }

      console.log(`✅ Merged ${mergedCount} duplicate buildings`);
    }

    return Response.json({
      success: true,
      mode: isDryRun ? 'dry_run' : 'live',
      summary: {
        total_buildings_scanned: activeBuildings.length,
        duplicate_groups_found: duplicateGroups.size,
        total_duplicates: totalDuplicatesFound,
        duplicates_merged: mergedCount,
        errors: errors.length
      },
      duplicate_sets: duplicateSets.slice(0, 50), // Return top 50 for preview
      errors: errors
    });

  } catch (error) {
    console.error('Building duplicate detection error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});

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