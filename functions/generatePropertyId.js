import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Location code mapping
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { location } = await req.json();
    
    if (!location) {
      return Response.json({ error: 'Location is required' }, { status: 400 });
    }

    // Get location code
    const locationLower = location.toLowerCase().trim();
    const locationCode = LOCATION_CODES[locationLower] || 'MUM';

    // Get total property count to generate next sequence
    const properties = await base44.asServiceRole.entities.Property.list();
    const nextSequence = properties.length + 1;

    // Format sequence as 4-digit number
    const sequenceStr = String(nextSequence).padStart(4, '0');

    // Generate custom ID
    const customId = `CHT-${locationCode}-${sequenceStr}`;

    return Response.json({
      customId,
      locationCode,
      sequence: nextSequence
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});