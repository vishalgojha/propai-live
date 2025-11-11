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

    // Update properties
    for (const property of properties) {
      if (property.location) {
        const normalized = LOCATION_MAPPING[property.location.toLowerCase()];
        if (normalized && normalized !== property.location) {
          try {
            await base44.asServiceRole.entities.Property.update(property.id, {
              location: normalized
            });
            propertiesUpdated++;
          } catch (error) {
            console.error(`Failed to update property ${property.id}:`, error);
            errors++;
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
            await base44.asServiceRole.entities.Building.update(building.id, {
              location: normalized
            });
            buildingsUpdated++;
          } catch (error) {
            console.error(`Failed to update building ${building.id}:`, error);
            errors++;
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
            await base44.asServiceRole.entities.Requirement.update(requirement.id, {
              preferred_locations: normalizedLocations
            });
            requirementsUpdated++;
          } catch (error) {
            console.error(`Failed to update requirement ${requirement.id}:`, error);
            errors++;
          }
        }
      }
    }

    summary.properties_updated = propertiesUpdated;
    summary.buildings_updated = buildingsUpdated;
    summary.requirements_updated = requirementsUpdated;
    summary.errors = errors;

    return Response.json({
      success: true,
      mode: 'live',
      summary
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