import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ENHANCED LOCATION NORMALIZATION V2
 * 
 * Aggressively standardizes messy location names:
 * - Removes extra details ("9th road Khar West, off..." → "Khar West")
 * - Fixes case issues ("ANDHERI WEST" → "Andheri West")
 * - Extracts main location from compound strings
 * - Handles variations like "Bandra - Pali Hill" → "Bandra West"
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

// Canonical location names (what we want in the database)
const CANONICAL_LOCATIONS = {
  'andheri west': 'Andheri West',
  'andheri east': 'Andheri East',
  'bandra west': 'Bandra West',
  'bandra east': 'Bandra East',
  'khar west': 'Khar West',
  'khar east': 'Khar East',
  'santacruz west': 'Santacruz West',
  'santacruz east': 'Santacruz East',
  'versova': 'Versova',
  'juhu': 'Juhu',
  'worli': 'Worli',
  'lower parel': 'Lower Parel',
  'prabhadevi': 'Prabhadevi',
  'dadar': 'Dadar',
  'dadar west': 'Dadar West',
  'dadar east': 'Dadar East',
  'mahim': 'Mahim',
  'bkc': 'BKC',
  'bandra kurla complex': 'BKC',
  'powai': 'Powai',
  'goregaon west': 'Goregaon West',
  'goregaon east': 'Goregaon East',
  'goregaon': 'Goregaon West',
  'malad west': 'Malad West',
  'malad east': 'Malad East',
  'malad': 'Malad West',
  'borivali west': 'Borivali West',
  'borivali east': 'Borivali East',
  'borivali': 'Borivali West',
  'kandivali west': 'Kandivali West',
  'kandivali east': 'Kandivali East',
  'kandivali': 'Kandivali West',
  'chembur': 'Chembur',
  'vile parle west': 'Vile Parle West',
  'vile parle east': 'Vile Parle East',
  'vile parle': 'Vile Parle West',
  'mumbai': 'Mumbai',
  'pali hill': 'Bandra West', // Pali Hill is in Bandra West
  'carter road': 'Bandra West', // Carter Road is in Bandra West
  'linking road': 'Bandra West', // Linking Road spans Bandra/Khar
  'amboli': 'Andheri West', // Amboli is in Andheri West
};

// Known sub-localities and their parent areas
const SUB_LOCALITIES = {
  'pali hill': 'Bandra West',
  'carter road': 'Bandra West',
  'linking road': 'Bandra West',
  'hill road': 'Bandra West',
  '15th road': 'Bandra West',
  '16th road': 'Bandra West',
  'perry cross road': 'Bandra West',
  'amboli': 'Andheri West',
  'azad nagar': 'Andheri West',
  'aram nagar': 'Andheri West',
  'yari road': 'Andheri West',
  '7 bungalows': 'Andheri West',
  '7bunglow': 'Andheri West',
  'lokhandwala': 'Andheri West',
  'akurli': 'Kandivali East',
  'ambedkar road': 'Dadar',
  'anand nagar': 'Andheri East',
  'kalina': 'Santacruz East',
  'bkc kalina': 'BKC',
};

/**
 * Smart location normalizer that handles messy inputs
 */
function normalizeLocation(rawLocation) {
  if (!rawLocation) return null;
  
  // Step 1: Clean up the string
  let cleaned = rawLocation
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[,;]/g, ' ') // Replace commas/semicolons with space
    .toLowerCase();
  
  // Step 2: Check for exact match in canonical list
  if (CANONICAL_LOCATIONS[cleaned]) {
    return CANONICAL_LOCATIONS[cleaned];
  }
  
  // Step 3: Check for sub-locality matches
  for (const [subLocality, mainArea] of Object.entries(SUB_LOCALITIES)) {
    if (cleaned.includes(subLocality)) {
      return mainArea;
    }
  }
  
  // Step 4: Extract main area from compound strings
  // e.g., "9th road Khar West, off Linking Road" → "Khar West"
  for (const [key, value] of Object.entries(CANONICAL_LOCATIONS)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }
  
  // Step 5: Handle common variations
  // "bandra" alone → "Bandra West" (most listings are West)
  if (cleaned === 'bandra' || cleaned === 'bandra-west' || cleaned === 'bandra (w)') {
    return 'Bandra West';
  }
  if (cleaned === 'andheri' || cleaned === 'andheri-west' || cleaned === 'andheri (w)') {
    return 'Andheri West';
  }
  if (cleaned === 'khar' || cleaned === 'khar-west' || cleaned === 'khar (w)') {
    return 'Khar West';
  }
  if (cleaned === 'santacruz' || cleaned === 'santacruz-west' || cleaned === 'santacruz (w)') {
    return 'Santacruz West';
  }
  
  // Step 6: If no match found, return capitalized version
  // This preserves unique locations but fixes case
  return rawLocation
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

    console.log(`🗺️ Running ENHANCED location normalization in ${mode} mode...`);

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
    const examples = [];

    // Check properties
    for (const property of properties) {
      if (property.location) {
        const normalized = normalizeLocation(property.location);
        if (normalized && normalized !== property.location) {
          propertiesToUpdate++;
          
          if (examples.length < 10) {
            examples.push({
              entity: 'property',
              old: property.location,
              new: normalized,
              custom_id: property.custom_id
            });
          }
        }
      }
    }

    // Check buildings
    for (const building of buildings) {
      if (building.location) {
        const normalized = normalizeLocation(building.location);
        if (normalized && normalized !== building.location) {
          buildingsToUpdate++;
          
          if (examples.length < 10) {
            examples.push({
              entity: 'building',
              old: building.location,
              new: normalized,
              name: building.name
            });
          }
        }
      }
    }

    // Check requirements
    for (const requirement of requirements) {
      if (requirement.preferred_locations && Array.isArray(requirement.preferred_locations)) {
        const normalizedLocations = requirement.preferred_locations.map(loc => 
          normalizeLocation(loc) || loc
        );
        
        const hasChanges = normalizedLocations.some((loc, idx) => 
          loc !== requirement.preferred_locations[idx]
        );
        
        if (hasChanges) {
          requirementsToUpdate++;
        }
      }
    }

    // Count unique locations after (simulated)
    const normalizedLocations = new Set();
    properties.forEach(p => {
      if (p.location) {
        const normalized = normalizeLocation(p.location);
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
        summary,
        examples
      });
    }

    // LIVE MODE: Apply normalization
    let propertiesUpdated = 0;
    let buildingsUpdated = 0;
    let requirementsUpdated = 0;
    let errors = 0;
    const errorDetails = [];

    // Update properties
    for (const property of properties) {
      if (property.location) {
        const normalized = normalizeLocation(property.location);
        if (normalized && normalized !== property.location) {
          try {
            await base44.asServiceRole.entities.Property.update(property.id, {
              location: normalized
            });
            propertiesUpdated++;
          } catch (error) {
            console.error(`Failed to update property ${property.id}:`, error.message);
            errors++;
            
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
        const normalized = normalizeLocation(building.location);
        if (normalized && normalized !== building.location) {
          try {
            await base44.asServiceRole.entities.Building.update(building.id, {
              location: normalized
            });
            buildingsUpdated++;
          } catch (error) {
            console.error(`Failed to update building ${building.id}:`, error.message);
            errors++;
            
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
        const normalizedLocations = requirement.preferred_locations.map(loc => 
          normalizeLocation(loc) || loc
        );
        
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
            console.error(`Failed to update requirement ${requirement.id}:`, error.message);
            errors++;
            
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
      success: errors < (propertiesUpdated + buildingsUpdated + requirementsUpdated),
      mode: 'live',
      summary,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      message: errors === 0 
        ? `✅ Successfully normalized all locations (${uniqueLocationsBefore} → ${uniqueLocationsAfter} unique locations)`
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