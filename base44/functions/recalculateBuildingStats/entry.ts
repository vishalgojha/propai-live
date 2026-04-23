import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Recalculate Building Stats
 * 
 * Fixes building listing counts by:
 * 1. Counting all properties linked to each building
 * 2. Updating total_listings and active_listings
 * 3. Returns summary of updates
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 Recalculating building stats...');

    // Get all buildings and properties
    const allBuildings = await base44.asServiceRole.entities.Building.list();
    const allProperties = await base44.asServiceRole.entities.Property.list();

    console.log(`Found ${allBuildings.length} buildings, ${allProperties.length} properties`);

    const updates = [];
    let buildingsUpdated = 0;

    for (const building of allBuildings) {
      // Count properties for this building
      const buildingProperties = allProperties.filter(p => p.building_id === building.id);
      const activeProperties = buildingProperties.filter(p => p.status === 'Active');

      const totalListings = buildingProperties.length;
      const activeListings = activeProperties.length;

      // Only update if counts changed
      if (building.total_listings !== totalListings || building.active_listings !== activeListings) {
        await base44.asServiceRole.entities.Building.update(building.id, {
          total_listings: totalListings,
          active_listings: activeListings
        });

        updates.push({
          building_id: building.custom_id,
          name: building.name,
          old_total: building.total_listings || 0,
          new_total: totalListings,
          old_active: building.active_listings || 0,
          new_active: activeListings
        });

        buildingsUpdated++;
        console.log(`✓ Updated ${building.custom_id}: ${building.name} (${totalListings} total, ${activeListings} active)`);
      }
    }

    console.log(`✅ Recalculation complete: ${buildingsUpdated} buildings updated`);

    return Response.json({
      success: true,
      summary: {
        total_buildings: allBuildings.length,
        buildings_updated: buildingsUpdated,
        buildings_unchanged: allBuildings.length - buildingsUpdated
      },
      updates: updates.slice(0, 50) // Return first 50 for preview
    });

  } catch (error) {
    console.error('Recalculation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});