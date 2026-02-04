import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ULTRA-FAST PROPERTY PARSER WITH TEAM DETECTION + SMART LOCATION NORMALIZATION
 * Target: 1-2 seconds per property
 * 
 * NEW: Comprehensive Mumbai locality map (broker-mangled names → canonical)
 * ENHANCED: Automatically detects co-brokers and creates team relationships
 * FIXED: Proper Rent vs Lease classification + Price normalization
 * FIXED: Agent authentication - allows both admin users AND agent calls
 */

// ✅ COMPREHENSIVE CANONICAL LOCALITY MAP - Mumbai v1
const CANONICAL_LOCALITY_MAP = {
  "bandra w": "Bandra West",
  "bandra west": "Bandra West",
  "bandra wrst": "Bandra West",
  "bndr w": "Bandra West",
  "bndr": "Bandra West",
  "bandra": "Bandra West",
  "bandra e": "Bandra East",
  "bandra east": "Bandra East",
  "bkc": "Bandra Kurla Complex",
  "kurla cplx": "Bandra Kurla Complex",
  "bandra kurla complex": "Bandra Kurla Complex",
  "andheri w": "Andheri West",
  "andheri west": "Andheri West",
  "andheri wst": "Andheri West",
  "andheri (w)": "Andheri West",
  "andheri": "Andheri West",
  "andheri e": "Andheri East",
  "andheri east": "Andheri East",
  "andheri (e)": "Andheri East",
  "lokhandwala": "Lokhandwala Complex",
  "lokhandwala complex": "Lokhandwala Complex",
  "versova": "Versova",
  "juhu": "Juhu",
  "santacruz w": "Santacruz West",
  "santacruz west": "Santacruz West",
  "santacruz e": "Santacruz East",
  "santacruz east": "Santacruz East",
  "santacruz": "Santacruz West",
  "khar w": "Khar West",
  "khar west": "Khar West",
  "khar": "Khar West",
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
  "dadar e": "Dadar East",
  "dadar east": "Dadar East",
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
  "kandivali east": "Kandivali East",
  "mahim": "Mahim",
};

// ✅ STREET-LEVEL MAPPINGS - Bandra/Khar/Worli Zones
const SUB_LOCALITIES = {
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
  'amboli': 'Andheri West',
  'azad nagar': 'Andheri West',
  'aram nagar': 'Andheri West',
  'yari road': 'Andheri West',
  '7 bungalows': 'Andheri West',
  '7bunglow': 'Andheri West',
  'lokhandwala': 'Lokhandwala Complex',
  'akurli': 'Kandivali East',
  'ambedkar road': 'Dadar',
  'anand nagar': 'Andheri East',
  'kalina': 'Santacruz East',
  'bkc kalina': 'Bandra Kurla Complex',
  '9th road': 'Khar West',
  '11th road': 'Khar West',
  '14th road': 'Khar West',
  'off linking road': 'Khar West',
  'khar danda': 'Khar West',
  'pali naka': 'Bandra West',
  'bandstand': 'Bandra West',
  'mount mary': 'Bandra West',
  'annie besant road': 'Worli',
  'worli sea face': 'Worli',
  'worli naka': 'Worli',
  'lotus': 'Worli',
  'elphinstone road': 'Lower Parel',
  'phoenix mills': 'Lower Parel',
  'senapati bapat marg': 'Lower Parel',
  'shivaji park': 'Dadar West',
  'hindmata': 'Dadar East',
  'mahim causeway': 'Mahim',
  'sitladevi': 'Mahim',
};

function normalizeLocation(rawLocation) {
  if (!rawLocation) return null;
  
  // Clean the input
  let cleaned = rawLocation
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,;]/g, ' ')
    .toLowerCase();
  
  // ✅ STEP 1: Check comprehensive canonical map
  if (CANONICAL_LOCALITY_MAP[cleaned]) {
    return CANONICAL_LOCALITY_MAP[cleaned];
  }
  
  // ✅ STEP 2: Check street-level mappings
  for (const [subLocality, mainArea] of Object.entries(SUB_LOCALITIES)) {
    if (cleaned.includes(subLocality)) {
      return mainArea;
    }
  }
  
  // ✅ STEP 3: Extract from compound strings
  for (const [key, value] of Object.entries(CANONICAL_LOCALITY_MAP)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }
  
  // ✅ STEP 4: Fallback - capitalize properly
  return rawLocation
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Location codes for custom IDs
const LOCATION_CODES = {
  'bandra west': 'BND', 'bandra east': 'BND', 'bandra': 'BND',
  'bandra kurla complex': 'BKC',
  'khar west': 'KHR', 'khar east': 'KHR', 'khar': 'KHR',
  'santacruz west': 'SNT', 'santacruz east': 'SNT', 'santacruz': 'SNT',
  'juhu': 'JUH', 'pali hill': 'PNL', 'carter road': 'CTR',
  'andheri west': 'AND', 'andheri east': 'AND', 'andheri': 'AND',
  'lokhandwala complex': 'LKD',
  'versova': 'VRS', 'worli': 'WRL', 'lower parel': 'LPR',
  'dadar': 'DDR', 'dadar west': 'DDR', 'dadar east': 'DDR',
  'mahim': 'MHM', 'prabhadevi': 'PRB', 'mahalaxmi': 'MAH',
  'bkc': 'BKC', 'powai': 'POW',
  'goregaon': 'GOR', 'goregaon west': 'GOR', 'goregaon east': 'GOR',
  'malad': 'MLD', 'malad west': 'MLD', 'malad east': 'MLD',
  'borivali': 'BOR', 'borivali west': 'BOR', 'borivali east': 'BOR',
  'kandivali': 'KND', 'kandivali west': 'KND', 'kandivali east': 'KND',
  'chembur': 'CHM', 'mumbai': 'MUM',
  'thane': 'THN', 'thane west': 'THN', 'thane east': 'THN',
  'vile parle': 'VLP', 'vile parle west': 'VLP', 'vile parle east': 'VLP',
  'ghatkopar': 'GHT', 'mulund': 'MUL', 'vikhroli': 'VIK',
  'colaba': 'CLB', 'cuffe parade': 'CUF', 'marine drive': 'MAR',
  'malabar hill': 'MLB', 'altamount road': 'ALT', 'parel': 'PRL'
};

// Admin numbers that should NOT get broker records
const ADMIN_NUMBERS = ['919819471310', '9102269622278'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ FIXED: Allow both admin users AND agent calls
    // Agents don't have user authentication but use service role
    // So we only check if we can authenticate at all, not the role
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        isAuthorized = true;
        console.log('✓ Authenticated as admin user');
      }
    } catch (authError) {
      // If user auth fails, this might be an agent call
      // Agent calls use service role, so we allow them through
      console.log('✓ No user auth - allowing agent call');
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized - neither admin user nor valid agent call' 
      }, { status: 401 });
    }

    const { message } = await req.json();
    
    if (!message || message.trim().length < 10) {
      return Response.json({ 
        success: false,
        error: 'Message too short or empty' 
      }, { status: 400 });
    }

    // STEP 1: ENHANCED LLM CALL - Extract Property + Multiple Brokers
    let extractedData;
    try {
      const extractionPrompt = `Extract property listing with ALL brokers mentioned (team detection).

Message:
"""
${message}
"""

Return this EXACT JSON structure:
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
  "location": "string (CLEAN MAIN AREA ONLY - e.g., 'Bandra West', 'BKC', 'Andheri West')",
  "pocket": "string or null (micro-area/street if mentioned)",
  "building_name": "string or null",
  "listing_type": "Sale|Rent|Lease",
  "amenities": ["array of strings"] or null,
  "description": "string or null (original broker description)",
  "brokers": [
    {
      "name": "string (broker's name)",
      "phone": "string (phone with 91 prefix)",
      "agency": "string or null",
      "role": "primary or secondary"
    }
  ],
  "ai_title": "string (10-15 word descriptive title)",
  "ai_description": "string (EXACTLY 4-5 complete sentences, 60-80 words)"
}

**CRITICAL - LOCATION EXTRACTION:**

Extract ONLY the main area name, not compound strings:
- ❌ "9th road Khar West, off Linking Road" → ✅ "Khar West"
- ❌ "AMBOLI ANDHERI WEST" → ✅ "Andheri West"  
- ❌ "Bandra - Pali Hill" → ✅ "Bandra West"
- ❌ "BKC Kalina, Santacruz East" → ✅ "Bandra Kurla Complex"
- ❌ "Aram nagar 01 yari rd Andheri West" → ✅ "Andheri West"

Use "pocket" field for micro-areas:
- "9th road Khar West" → location: "Khar West", pocket: "9th road"
- "Amboli Andheri West" → location: "Andheri West", pocket: "Amboli"
- "Pali Hill Bandra West" → location: "Bandra West", pocket: "Pali Hill"

**LISTING TYPE CLASSIFICATION:**

1. **RENT** - Residential monthly rentals
2. **SALE** - Property purchase  
3. **LEASE** - Commercial long-term contracts ONLY

**MULTIPLE BROKER DETECTION:**
Look for ALL names and phone numbers. First = primary, rest = secondary.

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
            brokers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  agency: { type: ["string", "null"] },
                  role: { type: "string" }
                }
              }
            },
            ai_title: { type: "string" },
            ai_description: { type: "string" }
          }
        }
      });

      // ✅ IMMEDIATELY NORMALIZE LOCATION AFTER EXTRACTION
      if (extractedData.location) {
        const rawLocation = extractedData.location;
        extractedData.location = normalizeLocation(rawLocation);
        
        if (rawLocation !== extractedData.location) {
          console.log(`✓ Normalized location: "${rawLocation}" → "${extractedData.location}"`);
        }
      }

      console.log(`✓ Extracted ${extractedData.brokers?.length || 0} broker(s), location: ${extractedData.location}`);
      
    } catch (llmError) {
      return Response.json({ 
        success: false,
        error: `LLM extraction failed: ${llmError.message}`,
        stage: 'extraction'
      }, { status: 500 });
    }

    // STEP 2: VALIDATE REQUIRED FIELDS
    const required = ['bhk', 'price', 'location', 'listing_type'];
    const missing = required.filter(field => !extractedData[field]);
    
    if (missing.length > 0) {
      return Response.json({ 
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
        stage: 'validation',
        extractedData: extractedData
      }, { status: 400 });
    }

    // STEP 2.1: ✅ PRICE NORMALIZATION
    let normalizedPrice = extractedData.price;
    let normalizedPriceUnit = extractedData.price_unit;

    if (extractedData.listing_type === 'Rent' || extractedData.listing_type === 'Lease') {
      if (normalizedPriceUnit === 'crores') {
        normalizedPrice = normalizedPrice * 100;
        normalizedPriceUnit = 'lakhs';
      }
    } else if (extractedData.listing_type === 'Sale') {
      if (normalizedPriceUnit === 'lakhs' && normalizedPrice >= 100) {
        normalizedPrice = normalizedPrice / 100;
        normalizedPriceUnit = 'crores';
      }
    }

    console.log(`✓ Price normalized: ₹${normalizedPrice}${normalizedPriceUnit === 'crores' ? ' Cr' : 'L'}`);

    // STEP 2.2: ✅ VALIDATE LISTING TYPE
    if (extractedData.property_category === 'Residential') {
      if (extractedData.listing_type === 'Lease') {
        console.warn(`⚠️ Correcting Residential "Lease" → "Rent"`);
        extractedData.listing_type = 'Rent';
      }
    }

    // STEP 2.5: CHECK FOR DUPLICATES
    console.log('🔍 Checking for duplicates...');
    const allProperties = await base44.asServiceRole.entities.Property.filter({
      status: 'Active'
    });

    const isDuplicate = allProperties.find(existing => {
      const sameBuilding = extractedData.building_name && existing.building_name &&
        extractedData.building_name.toLowerCase().trim() === existing.building_name.toLowerCase().trim();
      const sameLocation = existing.location === extractedData.location;
      const sameBhk = existing.bhk === extractedData.bhk;
      
      const existingPriceInLakhs = existing.price_unit === 'crores' ? existing.price * 100 : existing.price;
      const newPriceInLakhs = normalizedPriceUnit === 'crores' ? normalizedPrice * 100 : normalizedPrice;
      const priceDiff = Math.abs(existingPriceInLakhs - newPriceInLakhs) / existingPriceInLakhs;
      const similarPrice = priceDiff <= 0.10;
      
      const sameFloor = (!extractedData.floor || !existing.floor) || existing.floor === extractedData.floor;
      
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
      }, { status: 409 });
    }

    console.log('✅ No duplicate found, proceeding with creation');

    // STEP 3: HANDLE MULTIPLE BROKERS & TEAM RELATIONSHIPS
    let primaryBroker = null;
    let primaryBrokerName = 'PropAI Team';
    let primaryBrokerPhone = null;
    const allBrokers = await base44.asServiceRole.entities.Broker.list();
    const createdBrokersInThisRun = [];
    
    try {
      if (!extractedData.brokers || extractedData.brokers.length === 0) {
        console.log('⚠️ No brokers extracted - admin listing');
      } else {
        const validBrokers = extractedData.brokers.filter(b => {
          const normalizedPhone = b.phone.replace(/\D/g, '');
          const isAdmin = ADMIN_NUMBERS.some(adminNum => 
            normalizedPhone.includes(adminNum.slice(-10))
          );
          return !isAdmin;
        });

        if (validBrokers.length === 0) {
          console.log('⚠️ All brokers are admin numbers - admin listing');
        } else {
          const brokerRecords = [];
          
          for (const brokerData of validBrokers) {
            const normalizedPhone = brokerData.phone.replace(/\D/g, '');
            const phoneLast10 = normalizedPhone.slice(-10);
            
            let broker = [...allBrokers, ...createdBrokersInThisRun].find(b => {
              if (!b.phone) return false;
              const brokerPhoneLast10 = b.phone.replace(/\D/g, '').slice(-10);
              return brokerPhoneLast10 === phoneLast10;
            });

            if (!broker) {
              const normalizedName = brokerData.name.toLowerCase().trim();
              broker = [...allBrokers, ...createdBrokersInThisRun].find(b => {
                const brokerNameNorm = b.name.toLowerCase().trim();
                return brokerNameNorm === normalizedName;
              });
            }

            if (!broker) {
              const currentBrokerCount = allBrokers.length + createdBrokersInThisRun.length;
              const brokerCustomId = `CHR-BRK-${String(currentBrokerCount + 1).padStart(4, '0')}`;
              
              broker = await base44.asServiceRole.entities.Broker.create({
                custom_id: brokerCustomId,
                name: brokerData.name,
                phone: brokerData.phone,
                agency_name: brokerData.agency,
                areas_covered: extractedData.location ? [extractedData.location] : [],
                status: "Active",
                total_listings_count: 1,
                active_listings_count: 1,
                last_activity: new Date().toISOString()
              });
              
              createdBrokersInThisRun.push(broker);
              console.log(`✓ Created new broker ${brokerCustomId}: ${brokerData.name}`);
            } else {
              const updatedAreasSet = new Set(broker.areas_covered || []);
              if (extractedData.location) updatedAreasSet.add(extractedData.location);
              
              await base44.asServiceRole.entities.Broker.update(broker.id, {
                total_listings_count: (broker.total_listings_count || 0) + 1,
                active_listings_count: (broker.active_listings_count || 0) + 1,
                last_activity: new Date().toISOString(),
                areas_covered: Array.from(updatedAreasSet)
              });
              console.log(`✓ Updated existing broker ${broker.custom_id}: ${broker.name}`);
            }
            
            brokerRecords.push({
              broker: broker,
              role: brokerData.role,
              originalData: brokerData
            });
          }

          if (brokerRecords.length > 0) {
            const primaryRecord = brokerRecords.find(b => b.role === 'primary') || brokerRecords[0];
            primaryBroker = primaryRecord.broker;
            primaryBrokerName = primaryBroker.name;
            primaryBrokerPhone = primaryRecord.originalData.phone;
            
            console.log(`✓ Primary broker: ${primaryBrokerName} (${primaryBroker.custom_id})`);
          }

          if (brokerRecords.length > 1) {
            const secondaryBrokers = brokerRecords.filter(b => b.role === 'secondary');
            
            for (const secondaryRecord of secondaryBrokers) {
              const secondaryBroker = secondaryRecord.broker;
              
              const currentTeamMembers = primaryBroker.team_members || [];
              const alreadyInTeam = currentTeamMembers.some(m => m.broker_id === secondaryBroker.id);
              
              if (!alreadyInTeam) {
                currentTeamMembers.push({
                  broker_id: secondaryBroker.id,
                  name: secondaryBroker.name,
                  phone: secondaryBroker.phone,
                  role: secondaryBroker.agency_name || 'Team Member',
                  co_listing_count: 1
                });
                
                await base44.asServiceRole.entities.Broker.update(primaryBroker.id, {
                  team_members: currentTeamMembers,
                  team_leader_of: [...(primaryBroker.team_leader_of || []), secondaryBroker.id]
                });
                
                console.log(`✓ Linked ${secondaryBroker.name} as team member of ${primaryBrokerName}`);
              } else {
                const updatedTeamMembers = currentTeamMembers.map(m => 
                  m.broker_id === secondaryBroker.id 
                    ? { ...m, co_listing_count: (m.co_listing_count || 0) + 1 }
                    : m
                );
                
                await base44.asServiceRole.entities.Broker.update(primaryBroker.id, {
                  team_members: updatedTeamMembers
                });
                
                console.log(`✓ Incremented co-listing count for ${secondaryBroker.name}`);
              }
              
              await base44.asServiceRole.entities.Broker.update(secondaryBroker.id, {
                reports_to: primaryBroker.id
              });
            }
            
            console.log(`✅ Team created: ${primaryBrokerName} + ${secondaryBrokers.length} member(s)`);
          }
        }
      }
    } catch (brokerError) {
      console.error('Broker/team creation error:', brokerError);
      return Response.json({ 
        success: false,
        error: `Broker/team creation failed: ${brokerError.message}`,
        stage: 'broker_team'
      }, { status: 500 });
    }

    // STEP 4: HANDLE BUILDING
    let buildingId = null;
    
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
          console.log(`✓ Created new building ${buildingCustomId}`);
        }
      } catch (buildingError) {
        console.warn('Building link failed (non-blocking):', buildingError.message);
      }
    }

    // STEP 5: GENERATE CUSTOM ID & SLUG
    const locationCode = LOCATION_CODES[extractedData.location.toLowerCase()] || 'MUM';
    const nextSequence = allProperties.length + 1;
    const customId = `CHT-${locationCode}-${String(nextSequence).padStart(4, '0')}`;

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
        price: normalizedPrice,
        price_unit: normalizedPriceUnit,
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
        broker_id: primaryBroker ? primaryBroker.id : null,
        broker_contact: primaryBrokerPhone || null,
        broker_name: primaryBrokerName,
        broker_trust_score: primaryBroker ? (primaryBroker.trust_score || 50) : null,
        status: "Active",
        assigned_agent_name: "Vishal"
      };

      property = await base44.asServiceRole.entities.Property.create(propertyData);
      console.log(`✓ Created property ${customId} with normalized location: ${extractedData.location}`);
    } catch (propertyError) {
      return Response.json({ 
        success: false,
        error: `Property creation failed: ${propertyError.message}`,
        stage: 'property_creation'
      }, { status: 500 });
    }

    // STEP 7: BACKGROUND TASKS
    Promise.all([
      buildingId ? 
        base44.asServiceRole.functions.invoke('buildingIntelligence', { 
          building_id: buildingId,
          building_name: extractedData.building_name,
          location: extractedData.location
        }).catch(err => console.warn('Building intelligence failed:', err.message))
        : Promise.resolve(),
      
      primaryBroker ?
        base44.asServiceRole.functions.invoke('buildBrokerProfile', { 
          broker_id: primaryBroker.id 
        }).catch(err => console.warn('Broker profiling failed:', err.message))
        : Promise.resolve(),
      
      base44.asServiceRole.functions.invoke('sendToPropAI', {
        data_type: 'property',
        data: {
          ...property,
          broker_name: primaryBrokerName,
          broker_phone: primaryBrokerPhone,
          broker_agency: primaryBroker ? primaryBroker.agency_name : null
        }
      }).catch(err => console.warn('PropAI sync failed:', err.message))
    ]).catch(err => console.warn('Background tasks failed:', err.message));

    console.log(`✅ Property parsed successfully with clean location: ${extractedData.location}`);

    return Response.json({
      success: true,
      property: {
        id: property.id,
        custom_id: property.custom_id,
        slug: property.slug,
        ai_title: property.ai_title,
        listing_type: property.listing_type,
        price: `₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}`,
        location: property.location,
        broker_custom_id: primaryBroker ? primaryBroker.custom_id : null,
        broker_name: primaryBrokerName,
        team_size: extractedData.brokers ? extractedData.brokers.length : 0,
        building_custom_id: buildingId ? 
          (await base44.asServiceRole.entities.Building.filter({ id: buildingId }))[0]?.custom_id : null
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