import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Parse Property From Broker Message - MUMBAI STREET SMARTS EDITION
 * 
 * CRITICAL RULES:
 * 1. BHK = Residential (unless explicitly "office space" / "shop")
 * 2. "On Lease" / "Lease" for BHK = RENT (not Pre-Leased)
 * 3. "Pre-Leased" only if explicitly states tenant exists
 * 4. Commercial only if "office" / "shop" / "showroom" / "warehouse" mentioned
 */

// Mumbai location mapping (EXPANDED)
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
  // South Mumbai
  'cuffe parade': 'Cuffe Parade',
  'cuff parade': 'Cuffe Parade',
  'colaba': 'Colaba',
  'nariman point': 'Nariman Point',
  'marine drive': 'Marine Drive',
  'malabar hill': 'Malabar Hill',
  'breach candy': 'Breach Candy',
  'tardeo': 'Tardeo',
  'kemps corner': 'Kemps Corner',
  // Central
  'dadar': 'Dadar',
  'matunga': 'Matunga',
  'sion': 'Sion',
  'wadala': 'Wadala',
  // Suburbs
  'goregaon': 'Goregaon',
  'malad': 'Malad',
  'borivali': 'Borivali',
  'kandivali': 'Kandivali',
  'chembur': 'Chembur',
  'ghatkopar': 'Ghatkopar',
  'mulund': 'Mulund',
  'thane': 'Thane',
  'mumbai': 'Mumbai'
};

function extractBHK(text) {
  // Handle "Large 2 BHK", "Spacious 3 BHK", "Compact 1 BHK"
  const bhkMatch = text.match(/(?:large|spacious|compact)?\s*(\d+)\s*(?:bhk|bedroom|bed|br)/i);
  if (bhkMatch) {
    return `${bhkMatch[1]} BHK`;
  }
  
  // Handle "Studio"
  if (/\bstudio\b/i.test(text)) {
    return 'Studio';
  }
  
  return null;
}

function extractPrice(text) {
  // Match patterns like "80L", "1.5Cr", "50 lakhs", "2 crores", "3.50 Lacs"
  const priceMatch = text.match(/₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|lacs|cr|crore|crores|k)/i);
  
  if (priceMatch) {
    const amount = parseFloat(priceMatch[1]);
    const unit = priceMatch[2].toLowerCase();
    
    if (unit.startsWith('cr')) {
      return { price: amount, price_unit: 'crores' };
    } else if (unit.startsWith('l') || unit === 'lacs') {
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
      const pocketAreas = ['pali hill', 'carter road', 'jvpd', 'lokhandwala', 'versova', 'cuffe parade', 'colaba'];
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
  
  // CRITICAL: Check for BHK first - if BHK exists, it's 99% residential
  const hasBHK = /\d+\s*bhk|bedroom|studio/i.test(text);
  
  // COMMERCIAL KEYWORDS - explicit commercial mentions
  const isCommercialExplicit = /\b(office|shop|showroom|warehouse|commercial|retail|co-?working)\b/i.test(text);
  
  // RESIDENTIAL LEASE/RENT DETECTION
  // "On Lease" for BHK = Residential Rent, NOT Commercial Pre-Leased
  if (textLower.includes('rent') || textLower.includes('rental')) {
    return { listing_type: 'Rent', property_category: 'Residential' };
  }
  
  // "Lease" or "On Lease" with BHK = Residential Rent
  if ((textLower.includes('lease') || textLower.includes('on lease')) && hasBHK && !isCommercialExplicit) {
    return { listing_type: 'Rent', property_category: 'Residential' };
  }
  
  // PRE-LEASED - Only if explicitly mentions "pre leased" or "preleased" + commercial context
  if ((textLower.includes('pre leased') || textLower.includes('preleased')) && isCommercialExplicit) {
    return { listing_type: 'Pre Leased', property_category: 'Commercial' };
  }
  
  // COMMERCIAL LEASE (explicit commercial + lease, no BHK)
  if (textLower.includes('lease') && isCommercialExplicit && !hasBHK) {
    return { listing_type: 'Lease', property_category: 'Commercial' };
  }
  
  // SALE
  if (textLower.includes('sale') || textLower.includes('buy') || textLower.includes('sell')) {
    // Check if commercial or residential
    if (isCommercialExplicit) {
      return { listing_type: 'Sale', property_category: 'Commercial' };
    }
    return { listing_type: 'Sale', property_category: 'Residential' };
  }
  
  // DEFAULT: If BHK present → Residential Rent, else Residential Rent
  return { listing_type: 'Rent', property_category: 'Residential' };
}

function extractBuildingName(text) {
  // Common patterns for building names
  const buildingPatterns = [
    /(?:in|at)\s+([A-Z][a-zA-Z\s]+(?:Heights|Tower|Residency|Apartments|Society|Complex|Building|Towers))/,
    /([A-Z][a-zA-Z\s]+(?:Heights|Tower|Residency|Apartments|Society|Complex|Building|Towers))/,
    // Standalone building names like "Maker Tower", "Lodha Paradise"
    /\n([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\n/,
  ];
  
  for (const pattern of buildingPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractBrokers(text) {
  // Extract broker names and phone numbers
  // Pattern: Name: Phone or Name - Phone or just Name Phone
  const brokerPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[:−-]?\s*(\+?\d{10,})/g;
  const brokers = [];
  let match;
  
  while ((match = brokerPattern.exec(text)) !== null) {
    const name = match[1].trim();
    let phone = match[2].trim();
    
    // Ensure phone has +91 prefix
    if (!phone.startsWith('+')) {
      phone = `+91${phone.replace(/\D/g, '')}`;
    }
    
    brokers.push({ name, phone });
  }
  
  return brokers;
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
    // STEP 1: FIND OR CREATE BROKERS (MULTIPLE)
    // ═══════════════════════════════════════════
    let brokerIds = [];
    let primaryBrokerId = null;

    // Try to extract brokers from message
    const extractedBrokers = extractBrokers(message_text);
    
    // If brokers extracted from message, process them
    if (extractedBrokers.length > 0) {
      for (const brokerData of extractedBrokers) {
        const existingBrokers = await base44.asServiceRole.entities.Broker.filter({
          phone: brokerData.phone
        });

        let brokerId;
        if (existingBrokers.length > 0) {
          brokerId = existingBrokers[0].id;
        } else {
          // Create new broker
          const newBroker = await base44.asServiceRole.entities.Broker.create({
            name: brokerData.name,
            phone: brokerData.phone,
            status: 'Active',
            total_listings_count: 0,
            active_listings_count: 0,
          });
          brokerId = newBroker.id;
        }
        
        brokerIds.push(brokerId);
        if (!primaryBrokerId) primaryBrokerId = brokerId; // First broker is primary
      }
    } 
    // Fallback to provided broker_phone/broker_name
    else if (broker_phone) {
      const existingBrokers = await base44.asServiceRole.entities.Broker.filter({
        phone: broker_phone
      });

      if (existingBrokers.length > 0) {
        primaryBrokerId = existingBrokers[0].id;
      } else if (broker_name) {
        const newBroker = await base44.asServiceRole.entities.Broker.create({
          name: broker_name,
          phone: broker_phone,
          status: 'Active',
          total_listings_count: 0,
          active_listings_count: 0,
        });
        primaryBrokerId = newBroker.id;
      }
      brokerIds.push(primaryBrokerId);
    }

    if (!primaryBrokerId) {
      return Response.json({
        error: 'Could not find or create broker. broker_phone and broker_name required or brokers must be in message.'
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
    const { listing_type, property_category } = extractListingType(message_text);
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
            broker_id: primaryBrokerId,
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
      broker_id: primaryBrokerId,
      broker_contact: extractedBrokers.length > 0 ? extractedBrokers[0].phone : broker_phone,
      
      // MANDATORY FIELDS - ALWAYS SET
      city: 'Mumbai',
      location: location || 'Mumbai',
      pocket,
      
      bhk,
      price,
      price_unit,
      listing_type,
      property_category,
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

    // Update all linked brokers
    for (const brokerId of brokerIds) {
      const broker = await base44.asServiceRole.entities.Broker.filter({ id: brokerId });
      if (broker.length > 0) {
        await base44.asServiceRole.entities.Broker.update(brokerId, {
          total_listings_count: (broker[0].total_listings_count || 0) + 1,
          active_listings_count: (broker[0].active_listings_count || 0) + 1,
          last_activity: new Date().toISOString(),
        });
      }
    }

    return Response.json({
      success: true,
      property,
      brokers: extractedBrokers.length > 0 ? extractedBrokers : [{ name: broker_name, phone: broker_phone }],
      extracted_data: {
        bhk,
        price,
        price_unit,
        location: location || 'Mumbai (default)',
        pocket,
        property_category,
        building_name,
        building_linked: !!building_id,
        furnishing,
        carpet_area,
        parking,
        listing_type,
        brokers_found: extractedBrokers.length
      }
    });

  } catch (error) {
    console.error('Property parsing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});