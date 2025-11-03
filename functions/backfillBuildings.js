import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Backfill Buildings from Properties
 * 
 * Goes through all properties and:
 * 1. Finds properties with building_name but no building_id
 * 2. Calls buildingIntelligence to create/link buildings
 * 3. Updates property with building_id
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL properties
    const allProperties = await base44.asServiceRole.entities.Property.list();
    
    // Filter: has building_name but no building_id
    const needsBuilding = allProperties.filter(p => 
      p.building_name && !p.building_id
    );

    console.log(`Found ${needsBuilding.length} properties needing building linkage`);

    const results = {
      total_properties: allProperties.length,
      properties_processed: 0,
      buildings_created: 0,
      buildings_linked: 0,
      errors: []
    };

    for (const property of needsBuilding) {
      try {
        // Call buildingIntelligence to create/match building
        const bisResponse = await base44.asServiceRole.functions.invoke(
          'buildingIntelligence',
          {
            building_name: property.building_name,
            location: property.location,
            pocket: property.pocket,
            broker_id: property.broker_id,
            property_data: property,
            action: 'enrich'
          }
        );

        if (bisResponse.data?.success) {
          const buildingId = bisResponse.data.building.id;
          
          // Update property with building_id
          await base44.asServiceRole.entities.Property.update(property.id, {
            building_id: buildingId
          });

          results.properties_processed++;
          
          if (bisResponse.data.action === 'created') {
            results.buildings_created++;
          } else {
            results.buildings_linked++;
          }
        }
      } catch (error) {
        console.error(`Error processing property ${property.custom_id}:`, error.message);
        results.errors.push({
          property_id: property.custom_id,
          building_name: property.building_name,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Backfill complete! Created ${results.buildings_created} buildings, linked ${results.buildings_linked} to existing buildings.`,
      results
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});