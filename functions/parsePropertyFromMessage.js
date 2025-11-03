import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Parse Property From Broker Message
 * 
 * Takes raw broker text and extracts structured property data
 * GUARANTEES: broker_id, location, city populated
 */

// Mumbai location mapping
const LOCATION_MAPPING = {
  'bandra': 'Bandra West',
  'bandra west': 'Bandra West',
  'bandra east': 'Bandra East',
  'khar': 'Khar West',
  'khar west': 'Khar West',
  'khar east': 'Khar East',
  'pali hill': 'Bandra West',
  'pali': 'Bandra West',
  'carter road': 'Bandra West',
  'santacruz': 'Santacruz West',
  'santacruz west': 'Santacruz West',
  'santa cruz': 'Santacruz West',
  'juhu': 'Juhu',
  'jvpd': 'Juhu',
  'andheri west': 'Andheri West',
  'andheri': 'Andheri West',
  'versova': 'Andheri West',
  'lokhandwala': 'Andheri West',
  'worli': 'Worli',
  'bkc': 'Bandra Kurla Complex',
  'bandra kurla': 'Bandra Kurla Complex',
  'powai': 'Powai',
  'lower parel': 'Lower Parel',
};

function extractBHK(text) {
  const bhkMatch = text.match(/(\d+)\s*(?:bhk|bedroom|bed|br)/i);
  if (bhkMatch) {
    return `${bhkMatch[1]} BHK`;
  }
  return null;
}

function extractPrice(text) {
  // Match patterns like "80L", "1.5Cr", "50 lakhs", "2 crores"
  const priceMatch = text.match(/₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|cr|crore|crores|k)/i);
  
  if (priceMatch) {
    const amount = parseFloat(priceMatch[1]);
    const unit = priceMatch[2].toLowerCase();
    
    if (unit.startsWith('cr')) {
      return { price: amount, price_unit: 'crores' };
    } else if (unit.startsWith('l')) {
      return { price: amount, price_unit: 'lakhs' };
    } else if (unit === 'k') {
      return { price: amount / 100, price_unit: 'lakhs' };
    }
  }
  
  return { price: null, price_unit: 'lakhs' };
}

function extractLocation(text) {
  const textLower = text.toLowerCase();
  
  // Check each location mapping
  for (const [key, value] of Object.entries(LOCATION_MAPPING)) {
    if (textLower.includes(key)) {
      // Extract pocket if it's a micro-area
      const pocketAreas = ['pali hill', 'carter road', 'jvpd', 'lokhandwala', 'versova'];
      const pocket = pocketAreas.find(p => textLower.includes(p)) || null;
      
      return {
        location: value,
        pocket: pocket ? pocket.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null
      };
    }
  }
  
  // Default to null if no match - will be set to Mumbai by caller
  return { location: null, pocket: null };
}

function extractFurnishing(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('ff') || textLower.includes('fully furnished')) {
    return 'Fully Furnished';
  }
  if (textLower.includes('sf') || textLower.includes('semi furnished') || textLower.includes('semi-furnished')) {
    return 'Semi-Furnished';
  }
  if (textLower.includes('uf') || textLower.includes('unfurnished')) {
    return 'Unfurnished';
  }
  
  return null;
}

function extractCarpetArea(text) {
  const areaMatch = text.match(/(\d+)\s*(?:sqft|sq\.ft|sq ft|carpet)/i);
  return areaMatch ? parseInt(areaMatch[1]) : null;
}

function extractParking(text) {
  const parkingMatch = text.match(/(\d+)\s*(?:cp|covered|parking|car)/i);
  return parkingMatch ? parkingMatch[1] : null;
}

function extractListingType(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('rent') || textLower.includes('rental')) {
    return 'Rent';
  }
  if (textLower.includes('sale') || textLower.includes('buy') || textLower.includes('sell')) {
    return 'Sale';
  }
  if (textLower.includes('lease') || textLower.includes('pre leased') || textLower.includes('preleased')) {
    return 'Lease';
  }
  
  return 'Rent'; // Default
}

function extractBuildingName(text) {
  // Common patterns for building names
  const buildingPatterns = [
    /(?:in|at)\s+([A-Z][a-zA-Z\s]+(?:Heights|Tower|Residency|Apartments|Society|Complex|Building))/,
    /([A-Z][a-zA-Z\s]+(?:Heights|Tower|Residency|Apartments|Society|Complex|Building))/,
  ];
  
  for (const pattern of buildingPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      message_text,
      broker_name,
      broker_phone,
    } = body;

    if (!message_text) {
      return Response.json({ error: 'message_text required' }, { status: 400 });
    }

    // ═══════════════════════════════════════════
    // STEP 1: FIND OR CREATE BROKER
    // ═══════════════════════════════════════════
    let broker = null;
    let brokerId = null;

    if (broker_phone) {
      // Search for existing broker by phone
      const existingBrokers = await base44.asServiceRole.entities.Broker.filter({
        phone: broker_phone
      });

      if (existingBrokers.length > 0) {
        broker = existingBrokers[0];
        brokerId = broker.id;
      } else if (broker_name) {
        // Create new broker
        broker = await base44.asServiceRole.entities.Broker.create({
          name: broker_name,
          phone: broker_phone,
          status: 'Active',
          total_listings_count: 0,
          active_listings_count: 0,
        });
        brokerId = broker.id;
      }
    }

    if (!brokerId) {
      return Response.json({
        error: 'Could not find or create broker. broker_phone and broker_name required.'
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════
    // STEP 2: EXTRACT PROPERTY DATA
    // ═══════════════════════════════════════════
    const bhk = extractBHK(message_text);
    const { price, price_unit } = extractPrice(message_text);
    const { location, pocket } = extractLocation(message_text);
    const furnishing = extractFurnishing(message_text);
    const carpet_area = extractCarpetArea(message_text);
    const parking = extractParking(message_text);
    const listing_type = extractListingType(message_text);
    const building_name = extractBuildingName(message_text);

    // MANDATORY FIELDS CHECK
    if (!bhk || !price) {
      return Response.json({
        error: 'Could not extract mandatory fields (BHK, Price) from message',
        extracted: { bhk, price }
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════
    // STEP 3: LINK BUILDING (if building_name exists)
    // ═══════════════════════════════════════════
    let building_id = null;

    if (building_name) {
      try {
        const bisResponse = await base44.asServiceRole.functions.invoke(
          'buildingIntelligence',
          {
            building_name,
            location: location || 'Mumbai',
            pocket,
            broker_id: brokerId,
            action: 'enrich'
          }
        );

        if (bisResponse.data?.success) {
          building_id = bisResponse.data.building.id;
        }
      } catch (error) {
        console.log('Building Intelligence failed (non-critical):', error.message);
      }
    }

    // ═══════════════════════════════════════════
    // STEP 4: GENERATE CUSTOM ID
    // ═══════════════════════════════════════════
    const idResponse = await base44.asServiceRole.functions.invoke(
      'generatePropertyId',
      { location: location || 'Mumbai' }
    );

    const customId = idResponse.data.customId;
    const slug = idResponse.data.slug;

    // ═══════════════════════════════════════════
    // STEP 5: CREATE PROPERTY
    // ═══════════════════════════════════════════
    const propertyData = {
      custom_id: customId,
      slug,
      broker_id: brokerId,
      broker_contact: broker_phone,
      broker_trust_score: broker.trust_score || 50,
      
      // MANDATORY FIELDS - ALWAYS SET
      city: 'Mumbai',
      location: location || 'Mumbai',
      pocket,
      
      bhk,
      price,
      price_unit,
      listing_type,
      property_category: 'Residential',
      status: 'Active',
      
      // OPTIONAL FIELDS
      building_name,
      building_id,
      furnishing,
      carpet_area,
      parking,
      
      source_text: message_text,
    };

    const property = await base44.asServiceRole.entities.Property.create(propertyData);

    // Update broker stats
    await base44.asServiceRole.entities.Broker.update(brokerId, {
      total_listings_count: (broker.total_listings_count || 0) + 1,
      active_listings_count: (broker.active_listings_count || 0) + 1,
      last_activity: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      property,
      broker,
      extracted_data: {
        bhk,
        price,
        price_unit,
        location: location || 'Mumbai (default)',
        pocket,
        building_name,
        building_linked: !!building_id,
        furnishing,
        carpet_area,
        parking,
        listing_type,
      }
    });

  } catch (error) {
    console.error('Property parsing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});