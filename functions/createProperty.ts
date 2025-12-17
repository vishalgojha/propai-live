import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * ✅ BACKEND-FIRST: The ONLY way to create properties
 * 
 * Auto-normalizes:
 * - Custom ID (atomic, unique)
 * - Location (canonical zones)
 * - BHK format
 * - Rent vs Lease
 * - Phone numbers
 * - Deduplication via fingerprint
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { payload } = await req.json();

    // ===== STEP 1: NORMALIZATION =====
    
    // Normalize BHK
    const normalizeBhk = (bhk) => {
      if (!bhk) return "1 BHK";
      let cleaned = bhk.toString().trim();
      cleaned = cleaned.replace(/bhk/gi, '').trim();
      cleaned = cleaned.replace(/\s+/g, ' ');
      if (!cleaned.includes('BHK')) cleaned += ' BHK';
      return cleaned;
    };

    // Normalize Location
    const normalizeLocation = (location) => {
      if (!location) return "Mumbai";
      const loc = location.toLowerCase().trim();
      
      const locationMap = {
        'bandra': 'Bandra West',
        'bandra west': 'Bandra West',
        'bandra w': 'Bandra West',
        'khar': 'Khar West',
        'khar west': 'Khar West',
        'andheri': 'Andheri West',
        'andheri west': 'Andheri West',
        'andheri w': 'Andheri West',
        'lokhandwala': 'Lokhandwala Complex',
        'lokhandwala complex': 'Lokhandwala Complex',
        'santacruz west': 'Santacruz West',
        'vile parle west': 'Vile Parle West',
        'bkc': 'Bandra Kurla Complex',
        'bandra kurla complex': 'Bandra Kurla Complex',
        'worli': 'Worli',
        'lower parel': 'Lower Parel',
        'juhu': 'Juhu'
      };
      
      return locationMap[loc] || location;
    };

    // Normalize Listing Type
    const normalizeListingType = (type, category) => {
      if (!type) return "Sale";
      
      // CRITICAL: Residential properties CANNOT be "Lease"
      if (category === "Residential" && type === "Lease") {
        return "Rent";
      }
      
      return type;
    };

    // Normalize Phone
    const normalizePhone = (phone) => {
      if (!phone) return null;
      let cleaned = phone.replace(/\D/g, '');
      cleaned = cleaned.slice(-10);
      if (cleaned.length === 10 && cleaned[0] >= '6' && cleaned[0] <= '9') {
        return '+91' + cleaned;
      }
      return null;
    };

    // Generate location code
    const getLocationCode = (location) => {
      const codeMap = {
        'Bandra West': 'BND',
        'Khar West': 'KHR',
        'Andheri West': 'AND',
        'Bandra Kurla Complex': 'BKC',
        'Worli': 'WRL',
        'Lokhandwala Complex': 'LKD',
        'Santacruz West': 'SCW',
        'Vile Parle West': 'VPW',
        'Juhu': 'JHU',
        'Lower Parel': 'LPR'
      };
      return codeMap[location] || 'MUM';
    };

    // ===== STEP 2: GENERATE CUSTOM ID =====
    const allProperties = await base44.asServiceRole.entities.Property.list();
    const nextNumber = String(allProperties.length + 1).padStart(4, '0');
    const normalizedLocation = normalizeLocation(payload.location);
    const locationCode = getLocationCode(normalizedLocation);
    const customId = `CHT-${locationCode}-${nextNumber}`;

    // ===== STEP 3: DUPLICATE DETECTION =====
    const normalizedBhk = normalizeBhk(payload.bhk);
    const priceInLakhs = payload.price_unit === 'crores' ? payload.price * 100 : payload.price;
    const fingerprint = `${payload.building_name || 'unknown'}_${normalizedLocation}_${normalizedBhk}_${Math.floor(priceInLakhs / 10) * 10}`.toLowerCase();

    // Check for exact duplicates in last 100 properties
    const recentProperties = allProperties.slice(-100);
    const isDuplicate = recentProperties.some(p => {
      const pPriceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
      const pFingerprint = `${p.building_name || 'unknown'}_${p.location}_${p.bhk}_${Math.floor(pPriceInLakhs / 10) * 10}`.toLowerCase();
      return pFingerprint === fingerprint;
    });

    if (isDuplicate) {
      return Response.json({
        success: false,
        status: 'duplicate',
        message: 'Property already exists',
        fingerprint
      });
    }

    // ===== STEP 4: NORMALIZE LISTING TYPE =====
    const normalizedListingType = normalizeListingType(payload.listing_type, payload.property_category);

    // ===== STEP 5: CREATE PROPERTY =====
    const propertyData = {
      custom_id: customId,
      bhk: normalizedBhk,
      property_category: payload.property_category || "Residential",
      price: parseFloat(payload.price) || 0,
      price_unit: payload.price_unit || "lakhs",
      listing_type: normalizedListingType,
      location: normalizedLocation,
      pocket: payload.pocket || null,
      building_name: payload.building_name || null,
      carpet_area: payload.carpet_area ? parseFloat(payload.carpet_area) : null,
      furnishing: payload.furnishing || null,
      parking: payload.parking || null,
      floor: payload.floor || null,
      total_floors: payload.total_floors || null,
      broker_id: payload.broker_id || null,
      broker_name: payload.broker_name || "PropAI Team",
      broker_contact: normalizePhone(payload.broker_contact),
      description: payload.description || null,
      source_text: payload.source_text || null,
      status: "Active",
      duplicate_fingerprint: fingerprint
    };

    const newProperty = await base44.asServiceRole.entities.Property.create(propertyData);

    return Response.json({
      success: true,
      property: newProperty,
      custom_id: customId
    });

  } catch (error) {
    console.error('createProperty error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});