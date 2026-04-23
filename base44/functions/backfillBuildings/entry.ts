import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Building Backfill System
 * 
 * Scans all properties with building_name and:
 * 1. Creates Building entities (with custom_id)
 * 2. Uses fuzzy matching to avoid duplicates
 * 3. Links properties to buildings via building_id
 * 4. Updates building stats (total_listings, active_listings)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🏗️ Starting Building Backfill...');

    // Get all properties and buildings
    const properties = await base44.asServiceRole.entities.Property.list();
    const existingBuildings = await base44.asServiceRole.entities.Building.list();

    console.log(`Found ${properties.length} properties, ${existingBuildings.length} existing buildings`);

    // Filter properties that have building_name but no building_id
    const propertiesNeedingBuilding = properties.filter(p => 
      p.building_name && !p.building_id
    );

    console.log(`${propertiesNeedingBuilding.length} properties need building linkage`);

    if (propertiesNeedingBuilding.length === 0) {
      return Response.json({
        message: 'All properties already linked to buildings',
        results: {
          properties_processed: 0,
          buildings_created: 0,
          buildings_linked: 0,
          total_properties: properties.filter(p => p.building_name).length
        }
      });
    }

    let buildingsCreated = 0;
    let buildingsLinked = 0;
    let propertiesProcessed = 0;

    // Process each property
    for (const property of propertiesNeedingBuilding) {
      try {
        const buildingName = property.building_name.trim();
        const location = property.location;

        // Fuzzy match: find existing building with same name in same location
        const matchingBuilding = existingBuildings.find(b => 
          b.name.toLowerCase() === buildingName.toLowerCase() &&
          b.location === location
        );

        let buildingId;

        if (matchingBuilding) {
          // Link to existing building
          buildingId = matchingBuilding.id;
          buildingsLinked++;
          
          // Update building stats
          await base44.asServiceRole.entities.Building.update(matchingBuilding.id, {
            total_listings: (matchingBuilding.total_listings || 0) + 1,
            active_listings: property.status === 'Active' 
              ? (matchingBuilding.active_listings || 0) + 1 
              : matchingBuilding.active_listings
          });

          console.log(`✓ Linked property ${property.custom_id} to existing building ${matchingBuilding.custom_id}`);
        } else {
          // Create new building with custom_id
          const buildingCount = existingBuildings.length + buildingsCreated + 1;
          const buildingCustomId = `CHR-BLD-${String(buildingCount).padStart(4, '0')}`;

          const newBuilding = await base44.asServiceRole.entities.Building.create({
            custom_id: buildingCustomId,
            name: buildingName,
            location: location,
            pocket: property.pocket,
            total_listings: 1,
            active_listings: property.status === 'Active' ? 1 : 0,
            verified: false
          });

          buildingId = newBuilding.id;
          existingBuildings.push(newBuilding); // Add to cache
          buildingsCreated++;

          console.log(`✓ Created new building ${buildingCustomId}: ${buildingName} in ${location}`);
        }

        // Link property to building
        await base44.asServiceRole.entities.Property.update(property.id, {
          building_id: buildingId
        });

        propertiesProcessed++;

      } catch (error) {
        console.error(`Error processing property ${property.custom_id}:`, error.message);
      }
    }

    const summary = {
      properties_processed: propertiesProcessed,
      buildings_created: buildingsCreated,
      buildings_linked: buildingsLinked
    };

    console.log('✅ Backfill complete:', summary);

    return Response.json({
      success: true,
      message: `Processed ${propertiesProcessed} properties, created ${buildingsCreated} buildings, linked ${buildingsLinked} to existing`,
      results: summary
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});