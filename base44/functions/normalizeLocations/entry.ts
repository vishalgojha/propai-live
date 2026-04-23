import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Location Normalization System
 * 
 * Fixes inconsistent location data across entities:
 * - Properties, Buildings, Requirements
 * - Standardizes "Bandra" → "Bandra West"
 * - Fixes "Khar" → "Khar West"
 * - Handles "Pali Hill" → "Bandra West" (with pocket)
 * - Removes duplicates and variations
 */

const LOCATION_NORMALIZATION_MAP = {
  // Bandra variations
  'bandra': 'Bandra West',
  'bandra west': 'Bandra West',
  'bandra east': 'Bandra East',
  'bandra reclamation': 'Bandra West',
  'bandra bandstand': 'Bandra West',
  
  // Pali Hill is a pocket in Bandra West, not a location
  'pali hill': 'Bandra West',
  'pali': 'Bandra West',
  
  // Carter Road is also Bandra West
  'carter road': 'Bandra West',
  
  // Khar variations
  'khar': 'Khar West',
  'khar west': 'Khar West',
  'khar east': 'Khar East',
  
  // Santacruz variations
  'santacruz': 'Santacruz West',
  'santa cruz': 'Santacruz West',
  'santacruz west': 'Santacruz West',
  'santa cruz west': 'Santacruz West',
  'santacruz east': 'Santacruz East',
  'santa cruz east': 'Santacruz East',
  
  // Andheri variations
  'andheri': 'Andheri West',
  'andheri west': 'Andheri West',
  'andheri east': 'Andheri East',
  
  // Juhu variations
  'juhu': 'Juhu',
  'juhu beach': 'Juhu',
  
  // BKC
  'bkc': 'Bandra Kurla Complex',
  'bandra kurla complex': 'Bandra Kurla Complex',
  
  // Lower Parel
  'lower parel': 'Lower Parel',
  'lower parle': 'Lower Parel',
  
  // Worli
  'worli': 'Worli',
  
  // Prabhadevi
  'prabhadevi': 'Prabhadevi',
  'prabha devi': 'Prabhadevi',
  
  // Dadar
  'dadar': 'Dadar',
  'dadar west': 'Dadar West',
  'dadar east': 'Dadar East',
  
  // Mahim
  'mahim': 'Mahim',
  
  // Powai
  'powai': 'Powai',
  
  // Goregaon
  'goregaon': 'Goregaon West',
  'goregaon west': 'Goregaon West',
  'goregaon east': 'Goregaon East',
  
  // Malad
  'malad': 'Malad West',
  'malad west': 'Malad West',
  'malad east': 'Malad East',
  
  // Versova
  'versova': 'Versova',
  
  // Borivali
  'borivali': 'Borivali West',
  'borivali west': 'Borivali West',
  'borivali east': 'Borivali East',
  
  // Kandivali
  'kandivali': 'Kandivali West',
  'kandivali west': 'Kandivali West',
  'kandivali east': 'Kandivali East',
  
  // Chembur
  'chembur': 'Chembur',
  
  // Ville Parle
  'vile parle': 'Vile Parle West',
  'vile parle west': 'Vile Parle West',
  'vile parle east': 'Vile Parle East',
  'ville parle': 'Vile Parle West',
  'ville parle west': 'Vile Parle West',
  'ville parle east': 'Vile Parle East',
};

// Pockets that should be preserved (moved to pocket field, not location)
const POCKET_INDICATORS = [
  'pali hill',
  'carter road',
  'union park',
  'hill road',
  'linking road',
  'sv road',
  's v road',
  'nepeansea road',
  'nepean sea road',
  'pedder road',
  'carmichael road',
  'altamount road',
  'malabar hill',
  'breach candy',
  'cuffe parade',
  'colaba causeway',
  'nariman point',
  'marine drive',
];

function normalizeLocation(location) {
  if (!location || typeof location !== 'string') {
    return { location: null, pocket: null };
  }

  const locationLower = location.trim().toLowerCase();
  
  // Check if it's a pocket indicator
  const isPocket = POCKET_INDICATORS.some(pocket => locationLower.includes(pocket));
  
  if (isPocket) {
    // Extract parent location
    let parentLocation = 'Bandra West'; // Default for most pockets
    
    // Special pocket → location mappings
    if (locationLower.includes('nepeansea') || locationLower.includes('nepean sea')) {
      parentLocation = 'Malabar Hill';
    } else if (locationLower.includes('pedder') || locationLower.includes('breach candy')) {
      parentLocation = 'Breach Candy';
    } else if (locationLower.includes('altamount')) {
      parentLocation = 'Malabar Hill';
    } else if (locationLower.includes('carmichael')) {
      parentLocation = 'Cumballa Hill';
    } else if (locationLower.includes('cuffe parade')) {
      parentLocation = 'Cuffe Parade';
    } else if (locationLower.includes('colaba')) {
      parentLocation = 'Colaba';
    } else if (locationLower.includes('nariman')) {
      parentLocation = 'Nariman Point';
    } else if (locationLower.includes('marine drive')) {
      parentLocation = 'Marine Drive';
    }
    
    return {
      location: parentLocation,
      pocket: location.trim() // Keep original case for pocket
    };
  }
  
  // Regular location normalization
  const normalizedLocation = LOCATION_NORMALIZATION_MAP[locationLower] || location.trim();
  
  return {
    location: normalizedLocation,
    pocket: null
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode = 'dry_run' } = await req.json();
    
    console.log(`🗺️ Location Normalization - Mode: ${mode}`);

    // Fetch all entities
    const [properties, buildings, requirements] = await Promise.all([
      base44.asServiceRole.entities.Property.list(),
      base44.asServiceRole.entities.Building.list(),
      base44.asServiceRole.entities.Requirement.list()
    ]);

    // Analyze what needs to be changed
    const propertyUpdates = [];
    const buildingUpdates = [];
    const requirementUpdates = [];

    // Analyze properties
    for (const property of properties) {
      if (!property.location) continue;
      
      const normalized = normalizeLocation(property.location);
      
      if (normalized.location !== property.location || 
          (normalized.pocket && normalized.pocket !== property.pocket)) {
        propertyUpdates.push({
          id: property.id,
          custom_id: property.custom_id,
          current: property.location,
          normalized: normalized.location,
          pocket: normalized.pocket
        });
      }
    }

    // Analyze buildings
    for (const building of buildings) {
      if (!building.location) continue;
      
      const normalized = normalizeLocation(building.location);
      
      if (normalized.location !== building.location ||
          (normalized.pocket && normalized.pocket !== building.pocket)) {
        buildingUpdates.push({
          id: building.id,
          custom_id: building.custom_id,
          current: building.location,
          normalized: normalized.location,
          pocket: normalized.pocket
        });
      }
    }

    // Analyze requirements (they have preferred_locations array)
    for (const req of requirements) {
      if (!req.preferred_locations || req.preferred_locations.length === 0) continue;
      
      const normalizedLocations = req.preferred_locations.map(loc => {
        const norm = normalizeLocation(loc);
        return norm.location; // For requirements, just normalize the location
      });
      
      const hasChanges = normalizedLocations.some((norm, idx) => 
        norm !== req.preferred_locations[idx]
      );
      
      if (hasChanges) {
        requirementUpdates.push({
          id: req.id,
          custom_id: req.custom_id,
          current: req.preferred_locations,
          normalized: normalizedLocations
        });
      }
    }

    // Calculate summary stats
    const uniqueLocationsBefore = new Set([
      ...properties.map(p => p.location).filter(Boolean),
      ...buildings.map(b => b.location).filter(Boolean)
    ]).size;

    const uniqueLocationsAfter = new Set([
      ...properties.map(p => {
        const update = propertyUpdates.find(u => u.id === p.id);
        return update ? update.normalized : p.location;
      }).filter(Boolean),
      ...buildings.map(b => {
        const update = buildingUpdates.find(u => u.id === b.id);
        return update ? update.normalized : b.location;
      }).filter(Boolean)
    ]).size;

    const summary = {
      unique_locations_before: uniqueLocationsBefore,
      unique_locations_after: uniqueLocationsAfter,
      reduction: uniqueLocationsBefore - uniqueLocationsAfter,
      properties_to_update: propertyUpdates.length,
      buildings_to_update: buildingUpdates.length,
      requirements_to_update: requirementUpdates.length
    };

    if (mode === 'dry_run') {
      console.log('📊 Dry Run Analysis:', summary);
      
      // Show sample updates
      console.log('\nSample Property Updates:');
      propertyUpdates.slice(0, 5).forEach(u => {
        console.log(`  ${u.custom_id}: "${u.current}" → "${u.normalized}"${u.pocket ? ` (pocket: ${u.pocket})` : ''}`);
      });
      
      return Response.json({
        mode: 'dry_run',
        summary,
        sample_updates: {
          properties: propertyUpdates.slice(0, 10),
          buildings: buildingUpdates.slice(0, 10),
          requirements: requirementUpdates.slice(0, 10)
        }
      });
    }

    // LIVE MODE - Apply updates
    console.log('🔧 Applying location normalization...');
    
    let propertiesUpdated = 0;
    let buildingsUpdated = 0;
    let requirementsUpdated = 0;
    let errors = 0;

    // Update properties
    for (const update of propertyUpdates) {
      try {
        const updateData = { location: update.normalized };
        if (update.pocket) {
          updateData.pocket = update.pocket;
        }
        
        await base44.asServiceRole.entities.Property.update(update.id, updateData);
        propertiesUpdated++;
        
        if (propertiesUpdated % 10 === 0) {
          console.log(`  Updated ${propertiesUpdated}/${propertyUpdates.length} properties...`);
        }
      } catch (error) {
        console.error(`Error updating property ${update.custom_id}:`, error.message);
        errors++;
      }
    }

    // Update buildings
    for (const update of buildingUpdates) {
      try {
        const updateData = { location: update.normalized };
        if (update.pocket) {
          updateData.pocket = update.pocket;
        }
        
        await base44.asServiceRole.entities.Building.update(update.id, updateData);
        buildingsUpdated++;
      } catch (error) {
        console.error(`Error updating building ${update.custom_id}:`, error.message);
        errors++;
      }
    }

    // Update requirements
    for (const update of requirementUpdates) {
      try {
        await base44.asServiceRole.entities.Requirement.update(update.id, {
          preferred_locations: update.normalized
        });
        requirementsUpdated++;
      } catch (error) {
        console.error(`Error updating requirement ${update.custom_id}:`, error.message);
        errors++;
      }
    }

    const results = {
      ...summary,
      properties_updated: propertiesUpdated,
      buildings_updated: buildingsUpdated,
      requirements_updated: requirementsUpdated,
      errors
    };

    console.log('✅ Location normalization complete:', results);

    return Response.json({
      success: true,
      mode: 'live',
      summary: results
    });

  } catch (error) {
    console.error('Location normalization error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});