
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ULTRA-FAST PROPERTY PARSER WITH DEDUPLICATION
 * Target: 1-2 seconds per property
 * 
 * NEW: Checks for duplicates BEFORE creating property
 * Skips creation if duplicate found
 * 
 * BROKER LOGIC:
 * - ALWAYS extracts broker from message content (name + phone)
 * - Creates broker record UNLESS phone matches admin numbers (Vishal/Office)
 * - Kapil (+919773757759) is treated as regular broker, NOT admin
 */

// Location codes for custom IDs
const LOCATION_CODES = {
  'bandra west': 'BND', 'bandra east': 'BND', 'bandra': 'BND',
  'khar west': 'KHR', 'khar east': 'KHR', 'khar': 'KHR',
  'santacruz west': 'SNT', 'santacruz east': 'SNT', 'santacruz': 'SNT',
  'juhu': 'JUH', 'pali hill': 'PNL', 'carter road': 'CTR',
  'andheri west': 'AND', 'andheri east': 'AND', 'andheri': 'AND',
  'versova': 'VRS', 'worli': 'WRL', 'lower parel': 'LPR',
  'dadar': 'DDR', 'mahim': 'MHM', 'prabhadevi': 'PRB',
  'bandra kurla complex': 'BKC', 'bkc': 'BKC', 'powai': 'POW',
  'goregaon': 'GOR', 'malad': 'MLD', 'borivali': 'BOR',
  'kandivali': 'KND', 'chembur': 'CHM', 'mumbai': 'MUM'
};

// Admin numbers that should NOT get broker records
const ADMIN_NUMBERS = ['919819471310', '9102269622278'];

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

    const { message } = await req.json();
    
    if (!message || message.trim().length < 10) {
      return Response.json({ 
        success: false,
        error: 'Message too short or empty' 
      }, { status: 400 });
    }

    // STEP 1: SINGLE LLM CALL - Extract + Generate Content
    let extractedData;
    try {
      const extractionPrompt = `Extract property listing AND generate marketing content from this broker message.

Message:
"""
${message}
"""

Return this EXACT JSON structure with ALL fields:
{
  "bhk": "string (e.g., '2 BHK', '3 BHK', 'Office Space')",
  "property_category": "Residential or Commercial",
  "price": number (in lakhs),
  "price_unit": "lakhs or crores",
  "carpet_area": number or null,
  "built_up_area": number or null,
  "floor": "string or null",
  "furnishing": "Unfurnished|Semi-Furnished|Fully Furnished|Bare Shell|Warm Shell|Not Applicable or null",
  "parking": "string or null",
  "possession": "string or null",
  "location": "string (e.g., 'Bandra West', 'BKC')",
  "pocket": "string or null (micro-area)",
  "building_name": "string or null",
  "listing_type": "Sale|Rent|Lease",
  "amenities": ["array of strings"] or null,
  "description": "string or null (original broker description)",
  "broker_name": "string (broker's name from message)",
  "broker_phone": "string (phone with country code, e.g., '919820094416')",
  "broker_agency": "string or null",
  "ai_title": "string (10-15 word descriptive title)",
  "ai_description": "string (EXACTLY 4-5 complete sentences, 60-80 words minimum - MUST be full paragraph)"
}

**CRITICAL for ai_title:**
- Create 10-15 word descriptive title that's natural and informative
- Format: "{Furnishing} {BHK} in {Building Name/Pocket}, {Location}"
- Examples:
  * "Fully Furnished 2 BHK in Oberoi Sky Heights, Bandra West"
  * "Spacious 3 BHK Apartment in Juhu with Sea View"
  * "Premium Office Space in BKC with Parking"
- ALWAYS include building name if available
- Use proper capitalization and grammar
- NO abbreviations (write "2 BHK" not "2bhk")
- Make it search-friendly and matchable
- NO special characters or punctuation except commas

**CRITICAL for ai_description - READ CAREFULLY:**
- MUST write EXACTLY 4-5 complete sentences
- MINIMUM 60 words, TARGET 70-80 words
- Full paragraph format - NO bullet points, NO line breaks
- Plain, factual tone - state what exists, don't sell it
- Structure: 
  * Sentence 1: Location + size + configuration
  * Sentence 2: Furnishing + floor + view (if available)
  * Sentence 3: Parking + possession details
  * Sentence 4: Key amenities
  * Sentence 5: Additional selling points (if available)
- NO fancy marketing words like: premium, luxury, stunning, exquisite, world-class, magnificent
- Use simple direct language
- NEVER truncate or use "..." - write COMPLETE sentences

**GOOD EXAMPLE (80 words, 4 sentences):**
"Fully furnished 2 BHK apartment in Oberoi Sky Heights, Bandra West with 1000 sq ft carpet area. Located on the 18th floor offering clear city views with modern interiors and quality fittings. Two covered parking spots included with immediate possession available. Building amenities include gymnasium, swimming pool, landscaped gardens, children's play area, and 24/7 security with CCTV surveillance."

**BAD EXAMPLE (too short, incomplete):**
"2 BHK in Oberoi Sky Heights. Fully furnished with parking. Good amenities available."

**CRITICAL RULES:**
- NEVER write less than 60 words
- ALWAYS write 4-5 complete sentences
- NO abbreviations (write "square feet" not "sq ft" in description)
- NO bullet points or dashes
- Write ONE continuous paragraph
- Even if original message is short, CREATE A FULL DESCRIPTION from the available data

**CRITICAL for broker extraction:**
- ALWAYS extract broker name and phone from message content
- Look for patterns like "Ramesh 9820056789", "Contact Priya 98200xxxxx", "Kapil 9773757759"
- Phone must have country code (91...)

Return ONLY valid JSON, no markdown`;

      extractedData = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            bhk: { type: "string" },
            property_category: { type: "string" },
            price: { type: "number" },
            price_unit: { type: "string" },
            carpet_area: { type: ["number", "null"] },
            built_up_area: { type: ["number", "null"] },
            floor: { type: ["string", "null"] },
            furnishing: { type: ["string", "null"] },
            parking: { type: ["string", "null"] },
            possession: { type: ["string", "null"] },
            location: { type: "string" },
            pocket: { type: ["string", "null"] },
            building_name: { type: ["string", "null"] },
            listing_type: { type: "string" },
            amenities: { type: ["array", "null"], items: { type: "string" } },
            description: { type: ["string", "null"] },
            broker_name: { type: "string" },
            broker_phone: { type: "string" },
            broker_agency: { type: ["string", "null"] },
            ai_title: { type: "string" },
            ai_description: { type: "string" }
          }
        }
      });
    } catch (llmError) {
      return Response.json({ 
        success: false,
        error: `LLM extraction failed: ${llmError.message}`,
        stage: 'extraction'
      }, { status: 500 });
    }

    // STEP 2: VALIDATE REQUIRED FIELDS
    const required = ['bhk', 'price', 'location', 'listing_type', 'broker_name', 'broker_phone'];
    const missing = required.filter(field => !extractedData[field]);
    
    if (missing.length > 0) {
      return Response.json({ 
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
        stage: 'validation',
        extractedData: extractedData
      }, { status: 400 });
    }

    // STEP 2.5: CHECK FOR DUPLICATES BEFORE CREATING
    console.log('🔍 Checking for duplicates...');
    const allProperties = await base44.asServiceRole.entities.Property.filter({
      status: 'Active'
    });

    // Check if this property already exists
    const isDuplicate = allProperties.find(existing => {
      // Same building match
      const sameBuilding = extractedData.building_name && existing.building_name &&
        extractedData.building_name.toLowerCase().trim() === existing.building_name.toLowerCase().trim();
      
      // Same location
      const sameLocation = existing.location === extractedData.location;
      
      // Same BHK
      const sameBhk = existing.bhk === extractedData.bhk;
      
      // Similar price (±10%)
      const existingPriceInLakhs = existing.price_unit === 'crores' ? existing.price * 100 : existing.price;
      const newPriceInLakhs = extractedData.price_unit === 'crores' ? extractedData.price * 100 : extractedData.price;
      const priceDiff = Math.abs(existingPriceInLakhs - newPriceInLakhs) / existingPriceInLakhs;
      const similarPrice = priceDiff <= 0.10;
      
      // Same floor (if both have floor info)
      const sameFloor = (!extractedData.floor || !existing.floor) || existing.floor === extractedData.floor;
      
      // Similar area (if both have area info) - ±5%
      let similarArea = true;
      if (extractedData.carpet_area && existing.carpet_area) {
        const areaDiff = Math.abs(extractedData.carpet_area - existing.carpet_area) / existing.carpet_area;
        similarArea = areaDiff <= 0.05;
      }
      
      return sameBuilding && sameLocation && sameBhk && similarPrice && sameFloor && similarArea;
    });

    if (isDuplicate) {
      console.log(`⚠️ Duplicate found: ${isDuplicate.custom_id}`);
      return Response.json({
        success: false,
        error: 'Duplicate property detected',
        duplicate: true,
        existing_property: {
          id: isDuplicate.id,
          custom_id: isDuplicate.custom_id,
          title: isDuplicate.ai_title || `${isDuplicate.bhk} in ${isDuplicate.location}`,
          building: isDuplicate.building_name,
          location: isDuplicate.location,
          price: `₹${isDuplicate.price}${isDuplicate.price_unit === 'crores' ? ' Cr' : 'L'}`,
          created_date: isDuplicate.created_date
        }
      }, { status: 409 }); // 409 Conflict
    }

    console.log('✅ No duplicate found, proceeding with creation');

    // STEP 3: HANDLE BROKER - ALWAYS from message content
    let broker = null;
    try {
      const normalizedPhone = extractedData.broker_phone.replace(/\D/g, '');
      
      // Check if this is an admin number (Vishal or Office)
      const isAdminNumber = ADMIN_NUMBERS.some(adminNum => 
        normalizedPhone.includes(adminNum.slice(-10))
      );
      
      if (isAdminNumber) {
        console.log('⚠️ Admin number detected - not creating broker record');
        // Don't create broker, will assign directly to Vishal
      } else {
        // For ALL other numbers (including Kapil), create/find broker
        const allBrokers = await base44.asServiceRole.entities.Broker.list();
        const normalizedName = extractedData.broker_name.toLowerCase().trim();
        
        // Try to find existing broker by phone
        broker = allBrokers.find(b => 
          b.phone && b.phone.replace(/\D/g, '').includes(normalizedPhone.slice(-10))
        );

        // If not found by phone, try by name
        if (!broker) {
          broker = allBrokers.find(b => {
            const brokerNameNorm = b.name.toLowerCase().trim();
            if (brokerNameNorm === normalizedName) return true;
            if (brokerNameNorm.includes(normalizedName) || normalizedName.includes(brokerNameNorm)) return true;
            
            if (extractedData.broker_agency && b.agency_name) {
              const agencyMatch = b.agency_name.toLowerCase() === extractedData.broker_agency.toLowerCase();
              if (agencyMatch && (brokerNameNorm.includes(normalizedName) || normalizedName.includes(brokerNameNorm))) {
                return true;
              }
            }
            return false;
          });
        }

        // Create new broker if not found
        if (!broker) {
          const brokerCount = allBrokers.length + 1;
          const brokerCustomId = `CHR-BRK-${String(brokerCount).padStart(4, '0')}`;
          
          broker = await base44.asServiceRole.entities.Broker.create({
            custom_id: brokerCustomId,
            name: extractedData.broker_name,
            phone: extractedData.broker_phone,
            agency_name: extractedData.broker_agency,
            areas_covered: extractedData.location ? [extractedData.location] : [],
            status: "Active",
            total_listings_count: 1,
            active_listings_count: 1,
            last_activity: new Date().toISOString()
          });
          console.log(`✓ Created new broker ${brokerCustomId}: ${extractedData.broker_name}`);
        } else {
          // Update existing broker
          const updatedAreasSet = new Set(broker.areas_covered || []);
          if (extractedData.location) updatedAreasSet.add(extractedData.location);
          
          await base44.asServiceRole.entities.Broker.update(broker.id, {
            total_listings_count: (broker.total_listings_count || 0) + 1,
            active_listings_count: (broker.active_listings_count || 0) + 1,
            last_activity: new Date().toISOString(),
            areas_covered: Array.from(updatedAreasSet)
          });
          console.log(`✓ Linked to existing broker ${broker.custom_id}: ${broker.name}`);
        }
      }
    } catch (brokerError) {
      return Response.json({ 
        success: false,
        error: `Broker creation failed: ${brokerError.message}`,
        stage: 'broker'
      }, { status: 500 });
    }

    // STEP 4: HANDLE BUILDING WITH FUZZY MATCHING
    let buildingId = null;
    let createdNewBuilding = false;
    
    if (extractedData.building_name) {
      try {
        const allBuildings = await base44.asServiceRole.entities.Building.list();
        const normalizedBuildingName = extractedData.building_name.toLowerCase().trim();
        
        let building = allBuildings.find(b => 
          b.name.toLowerCase().trim() === normalizedBuildingName &&
          b.location === extractedData.location
        );
        
        if (!building) {
          building = allBuildings.find(b => {
            if (b.location !== extractedData.location) return false;
            
            const buildingNameNorm = b.name.toLowerCase().trim();
            
            if (b.known_variants && Array.isArray(b.known_variants)) {
              const variantMatch = b.known_variants.some(v => 
                v.toLowerCase().trim() === normalizedBuildingName
              );
              if (variantMatch) return true;
            }
            
            const cleanName1 = normalizedBuildingName
              .replace(/\s+(tower|building|apartments|residency|heights|complex|chs|society)$/i, '');
            const cleanName2 = buildingNameNorm
              .replace(/\s+(tower|building|apartments|residency|heights|complex|chs|society)$/i, '');
            
            if (cleanName1 === cleanName2) return true;
            
            const similarity = calculateSimilarity(normalizedBuildingName, buildingNameNorm);
            return similarity > 0.8;
          });
        }
        
        if (building) {
          buildingId = building.id;
          
          const knownVariants = building.known_variants || [];
          if (!knownVariants.some(v => v.toLowerCase().trim() === normalizedBuildingName)) {
            knownVariants.push(extractedData.building_name);
          }
          
          await base44.asServiceRole.entities.Building.update(building.id, {
            total_listings: (building.total_listings || 0) + 1,
            active_listings: (building.active_listings || 0) + 1,
            known_variants: knownVariants
          });
          console.log(`✓ Linked to existing building ${building.custom_id}`);
        } else {
          const buildingCount = allBuildings.length + 1;
          const buildingCustomId = `CHR-BLD-${String(buildingCount).padStart(4, '0')}`;
          
          const newBuilding = await base44.asServiceRole.entities.Building.create({
            custom_id: buildingCustomId,
            name: extractedData.building_name,
            known_variants: [extractedData.building_name],
            location: extractedData.location,
            pocket: extractedData.pocket,
            total_listings: 1,
            active_listings: 1,
            verified: false
          });
          buildingId = newBuilding.id;
          createdNewBuilding = true;
          console.log(`✓ Created new building ${buildingCustomId}`);
        }
      } catch (buildingError) {
        console.warn('Building link failed (non-blocking):', buildingError.message);
      }
    }

    // STEP 5: INLINE ID GENERATION
    const locationCode = LOCATION_CODES[extractedData.location.toLowerCase()] || 'MUM';
    const nextSequence = allProperties.length + 1;
    const customId = `CHT-${locationCode}-${String(nextSequence).padStart(4, '0')}`;

    // Generate slug
    let slugParts = [];
    if (extractedData.bhk) {
      slugParts.push(extractedData.bhk.toLowerCase().replace(/\s+/g, ''));
    }
    if (extractedData.building_name) {
      slugParts.push(extractedData.building_name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30));
    } else if (extractedData.pocket) {
      slugParts.push(extractedData.pocket
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-'));
    }
    if (extractedData.location) {
      slugParts.push(extractedData.location
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-'));
    }
    
    let slug = slugParts.join('-').substring(0, 60).replace(/-+$/, '');
    
    const existingWithSlug = allProperties.find(p => p.slug === slug);
    if (existingWithSlug) {
      slug = `${slug}-${String(nextSequence).padStart(4, '0')}`;
    }

    console.log(`✓ Generated ID: ${customId}, Slug: ${slug}`);

    // STEP 6: CREATE PROPERTY
    let property;
    try {
      const propertyData = {
        custom_id: customId,
        slug: slug,
        bhk: extractedData.bhk,
        property_category: extractedData.property_category || "Residential",
        price: extractedData.price,
        price_unit: extractedData.price_unit,
        carpet_area: extractedData.carpet_area,
        built_up_area: extractedData.built_up_area,
        floor: extractedData.floor,
        furnishing: extractedData.furnishing,
        parking: extractedData.parking,
        possession: extractedData.possession,
        location: extractedData.location,
        pocket: extractedData.pocket,
        building_name: extractedData.building_name,
        building_id: buildingId,
        listing_type: extractedData.listing_type,
        amenities: extractedData.amenities || [],
        description: extractedData.description,
        source_text: message,
        ai_title: extractedData.ai_title,
        ai_description: extractedData.ai_description,
        broker_id: broker ? broker.id : null,
        broker_contact: broker ? broker.phone : null,
        broker_trust_score: broker ? (broker.trust_score || 50) : null,
        status: "Active",
        assigned_agent_name: "Vishal"
      };

      property = await base44.asServiceRole.entities.Property.create(propertyData);
      console.log(`✓ Created property ${customId}`);
    } catch (propertyError) {
      return Response.json({ 
        success: false,
        error: `Property creation failed: ${propertyError.message}`,
        stage: 'property_creation'
      }, { status: 500 });
    }

    // STEP 7: BACKGROUND TASKS (non-blocking)
    Promise.all([
      buildingId ? 
        base44.asServiceRole.functions.invoke('buildingIntelligence', { 
          building_id: buildingId,
          building_name: extractedData.building_name,
          location: extractedData.location
        }).catch(err => console.warn('Building intelligence failed:', err.message))
        : Promise.resolve(),
      
      broker ?
        base44.asServiceRole.functions.invoke('buildBrokerProfile', { 
          broker_id: broker.id 
        }).catch(err => console.warn('Broker profiling failed:', err.message))
        : Promise.resolve(),
      
      base44.asServiceRole.functions.invoke('sendToPropAI', {
        data_type: 'property',
        data: {
          ...property,
          broker_name: broker ? broker.name : 'Chariot Direct',
          broker_phone: broker ? broker.phone : null,
          broker_agency: broker ? broker.agency_name : null
        }
      }).catch(err => console.warn('PropAI sync failed:', err.message))
    ]).catch(err => console.warn('Background tasks failed:', err.message));

    console.log(`✅ Property parsed successfully`);

    return Response.json({
      success: true,
      property: {
        id: property.id,
        custom_id: property.custom_id,
        slug: property.slug,
        ai_title: property.ai_title,
        broker_custom_id: broker ? broker.custom_id : null,
        broker_name: broker ? broker.name : 'Chariot Direct',
        building_custom_id: buildingId ? 
          (allBuildings.find(b => b.id === buildingId)?.custom_id) : null
      }
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: `Unexpected error: ${error.message}`,
      stage: 'unknown',
      stack: error.stack
    }, { status: 500 });
  }
});

// Helper: String similarity
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

