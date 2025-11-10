import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ULTRA-FAST PROPERTY PARSER WITH TEAM DETECTION
 * Target: 1-2 seconds per property
 * 
 * NEW: Automatically detects co-brokers and creates team relationships
 * ENHANCED: Extracts primary + secondary brokers from listings
 * 
 * TEAM LOGIC:
 * - Primary broker = first name/phone found (gets assigned to property)
 * - Secondary broker(s) = additional names/phones (become team members)
 * - Automatically links them in team_members array
 * - Updates co_listing_count for team members
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
  "location": "string (e.g., 'Bandra West', 'BKC')",
  "pocket": "string or null (micro-area)",
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

**CRITICAL - MULTIPLE BROKER DETECTION:**

Look for ALL names and phone numbers in the message. If you find 2+ brokers:
- FIRST broker found = "primary" role (main contact)
- ADDITIONAL brokers = "secondary" role (team members)

**Common Co-Broker Patterns:**

1. **Two names with phones:**
   - "Contact Ramesh 9820056789 or Priya 9820094416"
   - "Ramesh 9820056789 / Priya 9820094416"
   
2. **Names separated by 'and':**
   - "Listed by Ramesh and Priya"
   - "Contact: Ramesh & Priya Kumar"
   
3. **Multiple signatures:**
   - "Thanks, Ramesh (9820056789) & Priya (9820094416)"
   - "Regards, Ramesh - Priya"
   
4. **Agency + Multiple contacts:**
   - "Lacasaa Real Estate - Ramesh 98200... / Priya 98201..."
   - "From: Ramesh & Priya | Lacasaa"

**Extraction Rules:**
- Extract EVERY unique name + phone combination
- If only one name but multiple phones → create entry for each phone with same name
- If multiple names but one phone → only primary broker
- Mark the FIRST broker as "primary", rest as "secondary"
- Always include 91 country code prefix
- Agency name should be same for all brokers if mentioned once

**EXAMPLES:**

Message: "2bhk Bandra, contact Ramesh 9820056789 or Priya 9820094416"
→ brokers: [
  {"name": "Ramesh", "phone": "919820056789", "agency": null, "role": "primary"},
  {"name": "Priya", "phone": "919820094416", "agency": null, "role": "secondary"}
]

Message: "3bhk available. Lacasaa Real Estate - Ramesh 98200xxx / Priya 98201xxx"
→ brokers: [
  {"name": "Ramesh", "phone": "9198200xxx", "agency": "Lacasaa Real Estate", "role": "primary"},
  {"name": "Priya", "phone": "9198201xxx", "agency": "Lacasaa Real Estate", "role": "secondary"}
]

Message: "Office space BKC. Call Kapil 9773757759"
→ brokers: [
  {"name": "Kapil", "phone": "919773757759", "agency": null, "role": "primary"}
]

**IF NO BROKERS FOUND:**
- Return empty brokers array: []
- We'll handle this as admin listing

**For ai_title and ai_description:** Same rules as before - descriptive title, 4-5 sentences, 60-80 words, no marketing fluff.

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

      console.log(`✓ Extracted ${extractedData.brokers?.length || 0} broker(s) from message`);
      
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
      const newPriceInLakhs = extractedData.price_unit === 'crores' ? extractedData.price * 100 : extractedData.price;
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
    
    try {
      if (!extractedData.brokers || extractedData.brokers.length === 0) {
        console.log('⚠️ No brokers extracted - admin listing');
      } else {
        // Filter out admin numbers
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
          // Get or create all brokers
          const brokerRecords = [];
          
          for (const brokerData of validBrokers) {
            const normalizedPhone = brokerData.phone.replace(/\D/g, '');
            
            // Try to find existing broker
            let broker = allBrokers.find(b => 
              b.phone && b.phone.replace(/\D/g, '').includes(normalizedPhone.slice(-10))
            );

            if (!broker) {
              // Create new broker
              const brokerCount = allBrokers.length + brokerRecords.length + 1;
              const brokerCustomId = `CHR-BRK-${String(brokerCount).padStart(4, '0')}`;
              
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
              console.log(`✓ Created new broker ${brokerCustomId}: ${brokerData.name}`);
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
              console.log(`✓ Updated existing broker ${broker.custom_id}: ${broker.name}`);
            }
            
            brokerRecords.push({
              broker: broker,
              role: brokerData.role,
              originalData: brokerData
            });
          }

          // Set primary broker (first one)
          if (brokerRecords.length > 0) {
            const primaryRecord = brokerRecords.find(b => b.role === 'primary') || brokerRecords[0];
            primaryBroker = primaryRecord.broker;
            primaryBrokerName = primaryBroker.name;
            primaryBrokerPhone = primaryRecord.originalData.phone;
            
            console.log(`✓ Primary broker: ${primaryBrokerName} (${primaryBroker.custom_id})`);
          }

          // Link secondary brokers as team members
          if (brokerRecords.length > 1) {
            const secondaryBrokers = brokerRecords.filter(b => b.role === 'secondary');
            
            for (const secondaryRecord of secondaryBrokers) {
              const secondaryBroker = secondaryRecord.broker;
              
              // Update primary broker's team_members
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
                // Increment co-listing count
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
              
              // Update secondary broker's reports_to
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
        broker_id: primaryBroker ? primaryBroker.id : null,
        broker_contact: primaryBrokerPhone || null,
        broker_name: primaryBrokerName,
        broker_trust_score: primaryBroker ? (primaryBroker.trust_score || 50) : null,
        status: "Active",
        assigned_agent_name: "Vishal"
      };

      property = await base44.asServiceRole.entities.Property.create(propertyData);
      console.log(`✓ Created property ${customId} with primary broker: ${primaryBrokerName}`);
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

    console.log(`✅ Property parsed successfully`);

    return Response.json({
      success: true,
      property: {
        id: property.id,
        custom_id: property.custom_id,
        slug: property.slug,
        ai_title: property.ai_title,
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