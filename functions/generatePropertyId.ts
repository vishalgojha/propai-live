import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const LOCATION_CODES = {
  'bandra west': 'BND',
  'bandra east': 'BND',
  'bandra': 'BND',
  'khar west': 'KHR',
  'khar east': 'KHR',
  'khar': 'KHR',
  'santacruz west': 'SNT',
  'santacruz east': 'SNT',
  'santacruz': 'SNT',
  'juhu': 'JUH',
  'pali hill': 'PNL',
  'carter road': 'CTR',
  'andheri west': 'AND',
  'andheri east': 'AND',
  'andheri': 'AND',
  'versova': 'VRS',
  'worli': 'WRL',
  'lower parel': 'LPR',
  'dadar': 'DDR',
  'mahim': 'MHM',
  'prabhadevi': 'PRB',
  'bandra kurla complex': 'BKC',
  'bkc': 'BKC',
  'powai': 'POW',
  'goregaon': 'GOR',
  'malad': 'MLD',
  'borivali': 'BOR',
  'kandivali': 'KND',
  'chembur': 'CHM',
  'mumbai': 'MUM'
};

// Helper function to generate slug
function generateSlug(property) {
  let parts = [];
  
  // Add BHK
  if (property.bhk) {
    const bhkPart = property.bhk.toLowerCase().replace(/\s+/g, '');
    parts.push(bhkPart);
  }
  
  // Add building name or pocket
  if (property.building_name) {
    const buildingPart = property.building_name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    parts.push(buildingPart);
  } else if (property.pocket) {
    const pocketPart = property.pocket
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    parts.push(pocketPart);
  }
  
  // Add location
  if (property.location) {
    const locationPart = property.location
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    parts.push(locationPart);
  }
  
  let slug = parts.join('-');
  
  // Ensure slug is not too long
  if (slug.length > 60) {
    slug = slug.substring(0, 60);
  }
  
  // Remove trailing hyphen if any
  slug = slug.replace(/-+$/, '');
  
  return slug;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { location, property } = await req.json();
    
    if (!location) {
      return Response.json({ error: 'Location is required' }, { status: 400 });
    }

    // Get location code
    const locationLower = location.toLowerCase().trim();
    const locationCode = LOCATION_CODES[locationLower] || 'MUM';

    // Get total property count
    const properties = await base44.asServiceRole.entities.Property.list();
    const nextSequence = properties.length + 1;

    // Format sequence as 4-digit number
    const sequenceStr = String(nextSequence).padStart(4, '0');

    // Generate custom ID
    const customId = `CHT-${locationCode}-${sequenceStr}`;
    
    // Generate slug if property object provided
    let slug = null;
    if (property) {
      slug = generateSlug(property);
      
      // Check if slug already exists, if so append sequence
      const existingWithSlug = properties.find(p => p.slug === slug);
      if (existingWithSlug) {
        slug = `${slug}-${sequenceStr}`;
      }
    }

    return Response.json({
      customId,
      locationCode,
      sequence: nextSequence,
      slug
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});