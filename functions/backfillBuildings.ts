import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BACKFILL BUILDINGS
 * 
 * Creates Building entities from properties that reference building names
 * but don't have a building_id yet.
 * 
 * This is the Building Intelligence System (BIS) that:
 * - Extracts unique building names from properties
 * - Creates Building entities
 * - Links properties to buildings via building_id
 * - Calculates initial building statistics
 * 
 * No parameters needed - runs full analysis and creation
 */

// Location codes for building IDs
const LOCATION_CODES = {
  'bandra west': 'BND', 'bandra east': 'BND', 'bandra': 'BND',
  'khar west': 'KHR', 'khar east': 'KHR', 'khar': 'KHR',
  'santacruz west': 'SNT', 'santacruz east': 'SNT', 'santacruz': 'SNT',
  'juhu': 'JUH', 'pali hill': 'PNL', 'carter road': 'CTR',
  'andheri west': 'AND', 'andheri east': 'AND', 'andheri': 'AND',
  'versova': 'VRS', 'worli': 'WRL', 'lower parel': 'LPR',
  'dadar': 'DDR', 'mahim': 'MHM', 'prabhadevi': 'PRB',
  'bandra kurla complex': 'BKC', 'bkc': 'BKC', 'powai': 'POW',
  'goregaon': 'GOR', 'malad': 'MLD', 'borivali': 'BOR',
  'kandivali': 'KND', 'chembur': 'CHM', 'mumbai': 'MUM'
};

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

    console.log('🏗️ Starting Building Intelligence System (BIS)...');

    // Fetch all properties and existing buildings
    const properties = await base44.asServiceRole.entities.Property.list();
    const existingBuildings = await base44.asServiceRole.entities.Building.list();

    // Create building lookup by name + location
    const buildingMap = {};
    existingBuildings.forEach(building => {
      const key = `${building.name.toLowerCase().trim()}|${building.location.toLowerCase()}`;
      buildingMap[key] = building;
    });

    // Find properties with building names but no building_id
    const buildingGroups = {};
    
    for (const property of properties) {
      if (!property.building_name) continue;
      if (property.building_id) continue; // Already linked
      
      const location = property.location || 'Mumbai';
      const key = `${property.building_name.toLowerCase().trim()}|${location.toLowerCase()}`;
      
      if (!buildingGroups[key]) {
        buildingGroups[key] = {
          name: property.building_name,
          location: location,
          pocket: property.pocket,
          properties: []
        };
      }
      
      buildingGroups[key].properties.push(property);
    }

    console.log(`Found ${Object.keys(buildingGroups).length} unique buildings needing creation`);

    let buildingsCreated = 0;
    let propertiesLinked = 0;
    let buildingsAlreadyExist = 0;
    let errors = 0;
    const errorDetails = [];

    // Create buildings and link properties
    for (const [key, group] of Object.entries(buildingGroups)) {
      try {
        // Check if building already exists
        let building = buildingMap[key];
        
        if (building) {
          buildingsAlreadyExist++;
        } else {
          // Create new building
          const locationCode = LOCATION_CODES[group.location.toLowerCase()] || 'MUM';
          const nextSequence = existingBuildings.length + buildingsCreated + 1;
          const customId = `CHR-BLD-${String(nextSequence).padStart(4, '0')}`;
          
          building = await base44.asServiceRole.entities.Building.create({
            custom_id: customId,
            name: group.name,
            known_variants: [group.name],
            location: group.location,
            pocket: group.pocket,
            total_listings: group.properties.length,
            active_listings: group.properties.filter(p => p.status === 'Active').length,
            verified: false
          });
          
          buildingMap[key] = building;
          buildingsCreated++;
          
          console.log(`✓ Created building ${customId}: ${group.name} in ${group.location}`);
        }
        
        // Link properties to building
        for (const property of group.properties) {
          try {
            await base44.asServiceRole.entities.Property.update(property.id, {
              building_id: building.id,
              building_name: building.name // Normalize building name
            });
            propertiesLinked++;
          } catch (linkError) {
            console.error(`Failed to link property ${property.id} to building ${building.id}:`, linkError.message);
            errors++;
            
            if (errorDetails.length < 20) {
              errorDetails.push({
                type: 'property_link',
                property_id: property.id,
                custom_id: property.custom_id,
                building_name: building.name,
                error: linkError.message
              });
            }
          }
        }
        
      } catch (buildingError) {
        console.error(`Failed to create building ${group.name}:`, buildingError.message);
        errors++;
        
        if (errorDetails.length < 20) {
          errorDetails.push({
            type: 'building_creation',
            building_name: group.name,
            location: group.location,
            properties_count: group.properties.length,
            error: buildingError.message
          });
        }
      }
    }

    const results = {
      buildings_created: buildingsCreated,
      buildings_already_exist: buildingsAlreadyExist,
      properties_linked: propertiesLinked,
      errors: errors,
      total_properties_scanned: properties.length,
      properties_with_buildings: properties.filter(p => p.building_name).length,
      properties_already_linked: properties.filter(p => p.building_id).length
    };

    return Response.json({
      success: errors === 0,
      results,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      message: errors === 0
        ? `✅ Successfully created ${buildingsCreated} buildings and linked ${propertiesLinked} properties`
        : `⚠️ Created ${buildingsCreated} buildings with ${errors} error(s) - check error_details`
    });

  } catch (error) {
    console.error('Building backfill error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});