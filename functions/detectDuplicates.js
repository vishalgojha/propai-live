import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Smart Duplicate Detection System
 * 
 * Scans all properties and detects duplicates based on:
 * - Same building + location
 * - Same BHK
 * - Similar price (±10% tolerance)
 * - Same floor (if specified)
 * 
 * Marks duplicates and keeps the oldest listing as the original.
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

    console.log(`🔍 Starting duplicate detection (${isDryRun ? 'DRY RUN' : 'LIVE MODE'})...`);

    // Get all active properties (excluding already marked duplicates)
    const allProperties = await base44.asServiceRole.entities.Property.filter({
      status: 'Active'
    }, '-created_date');

    console.log(`Found ${allProperties.length} active properties to scan`);

    // Group properties by potential duplicate sets
    const duplicateGroups = new Map();
    const processedIds = new Set();

    for (let i = 0; i < allProperties.length; i++) {
      const prop1 = allProperties[i];
      
      // Skip if already processed
      if (processedIds.has(prop1.id)) continue;

      // Skip if no building name (can't match reliably)
      if (!prop1.building_name || !prop1.location) continue;

      const matchGroup = [prop1];

      // Find all potential duplicates
      for (let j = i + 1; j < allProperties.length; j++) {
        const prop2 = allProperties[j];

        if (processedIds.has(prop2.id)) continue;

        // Match criteria
        const sameBuilding = prop1.building_name?.toLowerCase() === prop2.building_name?.toLowerCase();
        const sameLocation = prop1.location === prop2.location;
        const sameBhk = prop1.bhk === prop2.bhk;
        
        // Price tolerance: ±10%
        const price1InLakhs = prop1.price_unit === 'crores' ? prop1.price * 100 : prop1.price;
        const price2InLakhs = prop2.price_unit === 'crores' ? prop2.price * 100 : prop2.price;
        const priceDiff = Math.abs(price1InLakhs - price2InLakhs) / price1InLakhs;
        const similarPrice = priceDiff <= 0.10; // 10% tolerance

        // Floor match (if both have floor info)
        const sameFloor = !prop1.floor || !prop2.floor || prop1.floor === prop2.floor;

        // Area match (if both have area info) - ±5% tolerance
        let similarArea = true;
        if (prop1.carpet_area && prop2.carpet_area) {
          const areaDiff = Math.abs(prop1.carpet_area - prop2.carpet_area) / prop1.carpet_area;
          similarArea = areaDiff <= 0.05;
        }

        if (sameBuilding && sameLocation && sameBhk && similarPrice && sameFloor && similarArea) {
          matchGroup.push(prop2);
          processedIds.add(prop2.id);
        }
      }

      // If we found duplicates (2+ properties in group)
      if (matchGroup.length > 1) {
        // Sort by created_date (oldest first)
        matchGroup.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        
        const originalId = matchGroup[0].id; // Keep oldest as original
        duplicateGroups.set(originalId, matchGroup);
      }

      processedIds.add(prop1.id);
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
          title: original.ai_title || `${original.bhk} in ${original.location}`,
          building: original.building_name,
          location: original.location,
          price: `₹${original.price}${original.price_unit === 'crores' ? ' Cr' : 'L'}`,
          broker_id: original.broker_id,
          broker_contact: original.broker_contact,
          created_date: original.created_date
        },
        duplicates: duplicates.map(dup => ({
          id: dup.id,
          custom_id: dup.custom_id,
          title: dup.ai_title || `${dup.bhk} in ${dup.location}`,
          price: `₹${dup.price}${dup.price_unit === 'crores' ? ' Cr' : 'L'}`,
          broker_id: dup.broker_id,
          broker_contact: dup.broker_contact,
          created_date: dup.created_date,
          price_diff: calculatePriceDiff(original, dup)
        }))
      });
    }

    // If live mode, mark duplicates
    let markedCount = 0;
    const errors = [];

    if (!isDryRun) {
      console.log('🔧 Marking duplicates in database...');

      for (const set of duplicateSets) {
        const originalId = set.original.id;
        const duplicateIds = set.duplicates.map(d => d.id);

        try {
          // Mark each duplicate
          for (const duplicate of set.duplicates) {
            await base44.asServiceRole.entities.Property.update(duplicate.id, {
              is_duplicate: true,
              duplicate_of: originalId
            });
            markedCount++;
          }

          // Update original with list of duplicates
          await base44.asServiceRole.entities.Property.update(originalId, {
            is_duplicate: false,
            duplicate_matches: duplicateIds
          });

        } catch (error) {
          console.error(`Error marking duplicates for ${originalId}:`, error);
          errors.push({
            original_id: originalId,
            error: error.message
          });
        }
      }

      console.log(`✅ Marked ${markedCount} properties as duplicates`);
    }

    return Response.json({
      success: true,
      mode: isDryRun ? 'dry_run' : 'live',
      summary: {
        total_properties_scanned: allProperties.length,
        duplicate_groups_found: duplicateGroups.size,
        total_duplicates: totalDuplicatesFound,
        duplicates_marked: markedCount,
        errors: errors.length
      },
      duplicate_sets: duplicateSets.slice(0, 50), // Return top 50 for preview
      errors: errors
    });

  } catch (error) {
    console.error('Duplicate detection error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});

// Helper function to calculate price difference
function calculatePriceDiff(prop1, prop2) {
  const price1 = prop1.price_unit === 'crores' ? prop1.price * 100 : prop1.price;
  const price2 = prop2.price_unit === 'crores' ? prop2.price * 100 : prop2.price;
  const diff = price2 - price1;
  const diffPercent = ((diff / price1) * 100).toFixed(1);
  
  if (diff === 0) return 'Same price';
  if (diff > 0) return `+₹${Math.abs(diff).toFixed(1)}L (+${diffPercent}%)`;
  return `-₹${Math.abs(diff).toFixed(1)}L (${diffPercent}%)`;
}