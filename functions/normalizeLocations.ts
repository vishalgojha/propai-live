import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * LOCATION NORMALIZATION
 * 
 * Standardizes location names across the database:
 * - "Bandra" → "Bandra West"
 * - "Khar" → "Khar West"
 * - "Santacruz" → "Santacruz West"
 * - "Andheri" → "Andheri West"
 * 
 * Updates:
 * - Properties
 * - Buildings
 * - Requirements (preferred_locations)
 * 
 * Modes:
 * - dry_run: Analyze inconsistencies
 * - live: Apply normalization
 */

const LOCATION_MAPPING = {
  'bandra': 'Bandra West',
  'khar': 'Khar West',
  'santacruz': 'Santacruz West',
  'andheri': 'Andheri West',
  'versova': 'Versova',
  'juhu': 'Juhu',
  'worli': 'Worli',
  'lower parel': 'Lower Parel',
  'prabhadevi': 'Prabhadevi',
  'dadar': 'Dadar',
  'mahim': 'Mahim',
  'bandra kurla complex': 'BKC',
  'powai': 'Powai',
  'goregaon': 'Goregaon',
  'malad': 'Malad',
  'borivali': 'Borivali',
  'kandivali': 'Kandivali',
  'chembur': 'Chembur',
  'borivali (w)': 'Borivali West',
  'borivali (e)': 'Borivali East',
  'andheri (w)': 'Andheri West',
  'andheri (e)': 'Andheri East',
  'bandra (w)': 'Bandra West',
  'bandra (e)': 'Bandra East'
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

    const { mode = 'dry_run' } = await req.json();

    console.log(`🗺️ Running location normalization in ${mode} mode...`);

    // Fetch entities
    const properties = await base44.asServiceRole.entities.Property.list();
    const buildings = await base44.asServiceRole.entities.Building.list();
    const requirements = await base44.asServiceRole.entities.Requirement.list();

    // Count unique locations before
    const uniqueLocationsBefore = new Set(
      properties.map(p => p.location?.toLowerCase()).filter(Boolean)
    ).size;

    let propertiesToUpdate = 0;
    let buildingsToUpdate = 0;
    let requirementsToUpdate = 0;

    // Check properties
    for (const property of properties) {
      if (property.location) {
        const normalized = LOCATION_MAPPING[property.location.toLowerCase()];
        if (normalized && normalized !== property.location) {
          propertiesToUpdate++;
        }
      }
    }

    // Check buildings
    for (const building of buildings) {
      if (building.location) {
        const normalized = LOCATION_MAPPING[building.location.toLowerCase()];
        if (normalized && normalized !== building.location) {
          buildingsToUpdate++;
        }
      }
    }

    // Check requirements
    for (const requirement of requirements) {
      if (requirement.preferred_locations && Array.isArray(requirement.preferred_locations)) {
        const needsUpdate = requirement.preferred_locations.some(loc => {
          const normalized = LOCATION_MAPPING[loc.toLowerCase()];
          return normalized && normalized !== loc;
        });
        if (needsUpdate) {
          requirementsToUpdate++;
        }
      }
    }

    // Count unique locations after (simulated)
    const normalizedLocations = new Set();
    properties.forEach(p => {
      if (p.location) {
        const normalized = LOCATION_MAPPING[p.location.toLowerCase()] || p.location;
        normalizedLocations.add(normalized.toLowerCase());
      }
    });
    const uniqueLocationsAfter = normalizedLocations.size;

    const summary = {
      unique_locations_before: uniqueLocationsBefore,
      unique_locations_after: uniqueLocationsAfter,
      reduction: uniqueLocationsBefore - uniqueLocationsAfter,
      properties_to_update: propertiesToUpdate,
      buildings_to_update: buildingsToUpdate,
      requirements_to_update: requirementsToUpdate
    };

    if (mode === 'dry_run') {
      return Response.json({
        success: true,
        mode: 'dry_run',
        summary
      });
    }

    // LIVE MODE: Apply normalization
    let propertiesUpdated = 0;
    let buildingsUpdated = 0;
    let requirementsUpdated = 0;
    let errors = 0;
    const errorDetails = []; // ✅ NEW: Track error details

    // Update properties
    for (const property of properties) {
      if (property.location) {
        const normalized = LOCATION_MAPPING[property.location.toLowerCase()];
        if (normalized && normalized !== property.location) {
          try {
            // ✅ FIXED: Safer update - only location field
            await base44.asServiceRole.entities.Property.update(property.id, {
              location: normalized
            });
            propertiesUpdated++;
          } catch (error) {
            console.error(`Failed to update property ${property.id}:`, error.message);
            errors++;
            
            // ✅ NEW: Store error details
            if (errorDetails.length < 20) {
              errorDetails.push({
                type: 'property',
                id: property.id,
                custom_id: property.custom_id,
                old_location: property.location,
                new_location: normalized,
                error: error.message
              });
            }
          }
        }
      }
    }

    // Update buildings
    for (const building of buildings) {
      if (building.location) {
        const normalized = LOCATION_MAPPING[building.location.toLowerCase()];
        if (normalized && normalized !== building.location) {
          try {
            // ✅ FIXED: Safer update - only location field
            await base44.asServiceRole.entities.Building.update(building.id, {
              location: normalized
            });
            buildingsUpdated++;
          } catch (error) {
            console.error(`Failed to update building ${building.id}:`, error.message);
            errors++;
            
            // ✅ NEW: Store error details
            if (errorDetails.length < 20) {
              errorDetails.push({
                type: 'building',
                id: building.id,
                custom_id: building.custom_id,
                name: building.name,
                old_location: building.location,
                new_location: normalized,
                error: error.message
              });
            }
          }
        }
      }
    }

    // Update requirements
    for (const requirement of requirements) {
      if (requirement.preferred_locations && Array.isArray(requirement.preferred_locations)) {
        const normalizedLocations = requirement.preferred_locations.map(loc => {
          const normalized = LOCATION_MAPPING[loc.toLowerCase()];
          return normalized || loc;
        });
        
        // Check if any changed
        const hasChanges = normalizedLocations.some((loc, idx) => 
          loc !== requirement.preferred_locations[idx]
        );
        
        if (hasChanges) {
          try {
            // ✅ FIXED: Safer update - only preferred_locations field
            await base44.asServiceRole.entities.Requirement.update(requirement.id, {
              preferred_locations: normalizedLocations
            });
            requirementsUpdated++;
          } catch (error) {
            console.error(`Failed to update requirement ${requirement.id}:`, error.message);
            errors++;
            
            // ✅ NEW: Store error details
            if (errorDetails.length < 20) {
              errorDetails.push({
                type: 'requirement',
                id: requirement.id,
                custom_id: requirement.custom_id,
                client_name: requirement.client_name,
                old_locations: requirement.preferred_locations,
                new_locations: normalizedLocations,
                error: error.message
              });
            }
          }
        }
      }
    }

    summary.properties_updated = propertiesUpdated;
    summary.buildings_updated = buildingsUpdated;
    summary.requirements_updated = requirementsUpdated;
    summary.errors = errors;

    return Response.json({
      success: errors < (propertiesUpdated + buildingsUpdated + requirementsUpdated), // ✅ Success if more updates than errors
      mode: 'live',
      summary,
      error_details: errorDetails.length > 0 ? errorDetails : undefined, // ✅ NEW: Show error details
      message: errors === 0 
        ? `✅ Successfully normalized all locations`
        : `⚠️ Normalized with ${errors} error(s) - check error_details for specifics`
    });

  } catch (error) {
    console.error('Location normalization error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});