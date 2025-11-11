import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ENHANCED LOCATION NORMALIZATION V3 - Mumbai Canonical Map
 * 
 * Comprehensive normalization using broker-tested locality mappings:
 * - Handles all broker-mangled variations ("bndr w", "bandra wrst", etc.)
 * - Maps street names to parent areas ("Pali Hill" → "Bandra West")
 * - Extracts main location from compound strings
 * - Case-insensitive with aggressive cleaning
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

// ✅ COMPREHENSIVE CANONICAL LOCALITY MAP - Mumbai v1
const CANONICAL_LOCALITY_MAP = {
  "bandra w": "Bandra West",
  "bandra west": "Bandra West",
  "bandra wrst": "Bandra West",
  "bndr w": "Bandra West",
  "bndr": "Bandra West",
  "bandra": "Bandra West",
  "bandra (w)": "Bandra West",
  "bandra-west": "Bandra West",
  "bandra e": "Bandra East",
  "bandra east": "Bandra East",
  "bandra (e)": "Bandra East",
  "bkc": "Bandra Kurla Complex",
  "kurla cplx": "Bandra Kurla Complex",
  "bandra kurla complex": "Bandra Kurla Complex",
  "andheri w": "Andheri West",
  "andheri west": "Andheri West",
  "andheri wst": "Andheri West",
  "andheri (w)": "Andheri West",
  "andheri": "Andheri West",
  "andheri-west": "Andheri West",
  "andheri e": "Andheri East",
  "andheri east": "Andheri East",
  "andheri (e)": "Andheri East",
  "andheri-east": "Andheri East",
  "lokhandwala": "Lokhandwala Complex",
  "lokhandwala complex": "Lokhandwala Complex",
  "versova": "Versova",
  "juhu": "Juhu",
  "santacruz w": "Santacruz West",
  "santacruz west": "Santacruz West",
  "santacruz (w)": "Santacruz West",
  "santacruz": "Santacruz West",
  "santacruz e": "Santacruz East",
  "santacruz east": "Santacruz East",
  "santacruz (e)": "Santacruz East",
  "khar w": "Khar West",
  "khar west": "Khar West",
  "khar": "Khar West",
  "khar (w)": "Khar West",
  "khar e": "Khar East",
  "khar east": "Khar East",
  "worli": "Worli",
  "lower parel": "Lower Parel",
  "upper worli": "Worli",
  "mah": "Mahalaxmi",
  "mahalaxmi": "Mahalaxmi",
  "parel": "Parel",
  "parel east": "Parel",
  "parel west": "Parel",
  "dadar w": "Dadar West",
  "dadar west": "Dadar West",
  "dadar (w)": "Dadar West",
  "dadar e": "Dadar East",
  "dadar east": "Dadar East",
  "dadar (e)": "Dadar East",
  "dadar": "Dadar West",
  "matunga": "Matunga",
  "shivaji park": "Dadar West",
  "bpt colony": "Worli",
  "prabhadevi": "Prabhadevi",
  "powai": "Powai",
  "vikhroli": "Vikhroli",
  "vikhroli west": "Vikhroli West",
  "vikhroli east": "Vikhroli East",
  "ghatkopar": "Ghatkopar",
  "ghatkopar west": "Ghatkopar West",
  "ghatkopar east": "Ghatkopar East",
  "mulund": "Mulund",
  "mulund west": "Mulund West",
  "mulund east": "Mulund East",
  "thane w": "Thane West",
  "thane west": "Thane West",
  "thane": "Thane",
  "thane east": "Thane East",
  "chembur": "Chembur",
  "wadala": "Wadala",
  "wadala east": "Wadala East",
  "wadala west": "Wadala West",
  "sion": "Sion",
  "colaba": "Colaba",
  "cuffe parade": "Cuffe Parade",
  "churchgate": "Churchgate",
  "marine drive": "Marine Drive",
  "walkeshwar": "Walkeshwar",
  "malabar hill": "Malabar Hill",
  "altamount road": "Altamount Road",
  "tardeo": "Tardeo",
  "grant road": "Grant Road",
  "girgaon": "Girgaon",
  "charni road": "Charni Road",
  "byculla": "Byculla",
  "kamathipura": "Kamathipura",
  "mazgaon": "Mazgaon",
  "mumbai central": "Mumbai Central",
  "sewri": "Sewri",
  "vile parle": "Vile Parle West",
  "vile parle west": "Vile Parle West",
  "vile parle east": "Vile Parle East",
  "goregaon": "Goregaon West",
  "goregaon west": "Goregaon West",
  "goregaon east": "Goregaon East",
  "malad": "Malad West",
  "malad west": "Malad West",
  "malad east": "Malad East",
  "borivali": "Borivali West",
  "borivali west": "Borivali West",
  "borivali (w)": "Borivali West",
  "borivali east": "Borivali East",
  "borivali (e)": "Borivali East",
  "kandivali": "Kandivali West",
  "kandivali west": "Kandivali West",
  "kandivali east": "Kadivali East",
  "mahim": "Mahim",
};

// ✅ STREET-LEVEL MAPPINGS - Bandra/Khar/Worli/Andheri Zones
const SUB_LOCALITIES = {
  // Bandra West streets
  'pali hill': 'Bandra West',
  'carter road': 'Bandra West',
  'linking road': 'Bandra West',
  'hill road': 'Bandra West',
  '15th road': 'Bandra West',
  '16th road': 'Bandra West',
  'perry cross road': 'Bandra West',
  'waterfield road': 'Bandra West',
  'turner road': 'Bandra West',
  'chapel road': 'Bandra West',
  'pali naka': 'Bandra West',
  'bandstand': 'Bandra West',
  'mount mary': 'Bandra West',
  
  // Khar West streets
  '9th road': 'Khar West',
  '11th road': 'Khar West',
  '14th road': 'Khar West',
  'off linking road': 'Khar West',
  'khar danda': 'Khar West',
  
  // Andheri West streets
  'amboli': 'Andheri West',
  'azad nagar': 'Andheri West',
  'aram nagar': 'Andheri West',
  'yari road': 'Andheri West',
  '7 bungalows': 'Andheri West',
  '7bunglow': 'Andheri West',
  'lokhandwala': 'Lokhandwala Complex',
  
  // Andheri East
  'anand nagar': 'Andheri East',
  
  // Worli
  'annie besant road': 'Worli',
  'worli sea face': 'Worli',
  'worli naka': 'Worli',
  'lotus': 'Worli',
  'bpt colony': 'Worli',
  
  // Lower Parel
  'elphinstone road': 'Lower Parel',
  'phoenix mills': 'Lower Parel',
  'senapati bapat marg': 'Lower Parel',
  
  // Dadar
  'shivaji park': 'Dadar West',
  'hindmata': 'Dadar East',
  
  // Mahim
  'mahim causeway': 'Mahim',
  'sitladevi': 'Mahim',
  
  // Santacruz East
  'kalina': 'Santacruz East',
  'bkc kalina': 'Bandra Kurla Complex',
  
  // Kandivali
  'akurli': 'Kandivali East',
  
  // Dadar
  'ambedkar road': 'Dadar',
};

/**
 * Smart location normalizer with comprehensive Mumbai locality map
 */
function normalizeLocation(rawLocation) {
  if (!rawLocation) return null;
  
  // Step 1: Clean up the string
  let cleaned = rawLocation
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[,;]/g, ' ') // Replace commas/semicolons with space
    .toLowerCase();
  
  // Step 2: Check comprehensive canonical map (EXACT MATCH)
  if (CANONICAL_LOCALITY_MAP[cleaned]) {
    return CANONICAL_LOCALITY_MAP[cleaned];
  }
  
  // Step 3: Check street-level mappings
  for (const [subLocality, mainArea] of Object.entries(SUB_LOCALITIES)) {
    if (cleaned.includes(subLocality)) {
      return mainArea;
    }
  }
  
  // Step 4: Extract main area from compound strings
  // e.g., "9th road Khar West, off Linking Road" → "Khar West"
  for (const [key, value] of Object.entries(CANONICAL_LOCALITY_MAP)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }
  
  // Step 5: Fallback - fix capitalization for unrecognized locations
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

    console.log(`🗺️ Running ENHANCED location normalization (Mumbai v1) in ${mode} mode...`);

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
          
          if (examples.length < 15) {
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
          
          if (examples.length < 15) {
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