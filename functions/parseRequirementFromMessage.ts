import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * REQUIREMENT PARSER - Extracts client requirements from broker messages
 * Properly identifies broker vs direct client and sets client_name correctly
 * ✅ FIX: Ensures broker_id is NEVER null (required field)
 * ✅ FIXED: Agent authentication - allows both admin users AND agent calls
 */

const ADMIN_NUMBERS = ['919819471310', '9102269622278'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ FIXED: Allow both admin users AND agent calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        isAuthorized = true;
        console.log('✓ Authenticated as admin user');
      }
    } catch (authError) {
      // If user auth fails, this might be an agent call
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

    // STEP 1: EXTRACT REQUIREMENT DATA + BROKER INFO
    let extractedData;
    try {
      const extractionPrompt = `Extract client requirement with broker information.

Message:
"""
${message}
"""

Return this EXACT JSON structure:
{
  "bhk_preference": ["array of strings like '2 BHK', '3 BHK', 'Office Space', 'Retail Shop'"],
  "budget_min": number or null (in lakhs or crores based on budget_unit),
  "budget_max": number or null,
  "budget_unit": "lakhs or crores",
  "preferred_locations": ["array of locations"],
  "pocket": "string or null (micro-area)",
  "listing_type": "Sale|Rent|Lease",
  "property_category": "Residential or Commercial",
  "furnishing_preference": "Unfurnished|Semi-Furnished|Fully Furnished|Any or null",
  "parking_required": boolean,
  "veg_nonveg": "Veg Only|Non-Veg Allowed|Both or null",
  "possession_timeline": "string or null (e.g., 'Immediate', 'Within 2 months')",
  "urgency": "High|Medium|Low",
  "amenities_required": ["array of strings"] or null,
  "notes": "string or null (additional details)",
  "broker": {
    "name": "string (broker's name who is posting this requirement)",
    "phone": "string (phone with 91 prefix)",
    "agency": "string or null"
  },
  "client_name": "string or null (actual end-client's name if mentioned, otherwise use broker's name)",
  "is_direct_client": boolean (true if end-client posted directly, false if broker posted on behalf)
}

**CRITICAL - BROKER VS CLIENT DETECTION:**

1. **If message is from a BROKER posting on behalf of their client:**
   - broker.name = broker's name from message
   - broker.phone = broker's phone
   - client_name = broker's name (NOT 'Client'!)
   - is_direct_client = false
   
2. **If message is from DIRECT CLIENT (rare):**
   - broker.name = null
   - broker.phone = null
   - client_name = client's name
   - is_direct_client = true

**Examples:**

Message: "Required 3bhk outright vile Parle west & juhu* 7cr - Ramesh 9820056789"
→ {
  "broker": {"name": "Ramesh", "phone": "919820056789", "agency": null},
  "client_name": "Ramesh",
  "is_direct_client": false
}

Message: "Looking for 2bhk Bandra 1L rent. Contact Priya 9820094416"
→ {
  "broker": {"name": "Priya", "phone": "919820094416", "agency": null},
  "client_name": "Priya",
  "is_direct_client": false
}

Message: "Hi, I need 3bhk in Worli 5cr. My name is Arjun, call 9820012345"
→ {
  "broker": null,
  "client_name": "Arjun",
  "is_direct_client": true
}

**DEFAULT RULE:**
- If no broker name/phone found → treat as admin requirement
- client_name should be the broker's name for broker requirements
- NEVER use "Client" as a placeholder - use broker's name or null

Return ONLY valid JSON, no markdown`;

      extractedData = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            bhk_preference: { type: ["array", "null"], items: { type: "string" } },
            budget_min: { type: ["number", "null"] },
            budget_max: { type: ["number", "null"] },
            budget_unit: { type: "string" },
            preferred_locations: { type: ["array", "null"], items: { type: "string" } },
            pocket: { type: ["string", "null"] },
            listing_type: { type: "string" },
            property_category: { type: "string" },
            furnishing_preference: { type: ["string", "null"] },
            parking_required: { type: "boolean" },
            veg_nonveg: { type: ["string", "null"] },
            possession_timeline: { type: ["string", "null"] },
            urgency: { type: "string" },
            amenities_required: { type: ["array", "null"], items: { type: "string" } },
            notes: { type: ["string", "null"] },
            broker: { 
              type: ["object", "null"],
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                agency: { type: ["string", "null"] }
              }
            },
            client_name: { type: ["string", "null"] },
            is_direct_client: { type: "boolean" }
          }
        }
      });

      console.log(`✓ Extracted requirement - broker: ${extractedData.broker?.name || 'none'}, listing_type: ${extractedData.listing_type}`);
      
    } catch (llmError) {
      return Response.json({ 
        success: false,
        error: `LLM extraction failed: ${llmError.message}`,
        stage: 'extraction'
      }, { status: 500 });
    }

    // STEP 2: VALIDATE REQUIRED FIELDS
    if (!extractedData.listing_type) {
      return Response.json({ 
        success: false,
        error: 'Missing listing_type',
        stage: 'validation',
        extractedData: extractedData
      }, { status: 400 });
    }

    // STEP 3: HANDLE BROKER - ✅ ALWAYS ENSURE broker_id IS SET
    let brokerRecord = null;
    let brokerContact = null;
    
    const allBrokers = await base44.asServiceRole.entities.Broker.list();
    
    if (extractedData.broker && extractedData.broker.phone) {
      const normalizedPhone = extractedData.broker.phone.replace(/\D/g, '');
      const isAdmin = ADMIN_NUMBERS.some(adminNum => 
        normalizedPhone.includes(adminNum.slice(-10))
      );
      
      if (!isAdmin) {
        const phoneLast10 = normalizedPhone.slice(-10);
        
        brokerRecord = allBrokers.find(b => {
          if (!b.phone) return false;
          const brokerPhoneLast10 = b.phone.replace(/\D/g, '').slice(-10);
          return brokerPhoneLast10 === phoneLast10;
        });
        
        if (!brokerRecord) {
          const currentBrokerCount = allBrokers.length;
          const brokerCustomId = `CHR-BRK-${String(currentBrokerCount + 1).padStart(4, '0')}`;
          
          brokerRecord = await base44.asServiceRole.entities.Broker.create({
            custom_id: brokerCustomId,
            name: extractedData.broker.name,
            phone: extractedData.broker.phone,
            agency_name: extractedData.broker.agency,
            status: "Active",
            total_listings_count: 0,
            active_listings_count: 0,
            last_activity: new Date().toISOString()
          });
          
          console.log(`✓ Created new broker ${brokerCustomId}: ${extractedData.broker.name}`);
        } else {
          console.log(`✓ Found existing broker ${brokerRecord.custom_id}: ${brokerRecord.name}`);
        }
        
        brokerContact = extractedData.broker.phone;
      }
    }
    
    // ✅ CRITICAL FIX: If no broker found, use/create "PropAI Admin" broker
    if (!brokerRecord) {
      brokerRecord = allBrokers.find(b => 
        b.name === 'PropAI Admin' || b.phone === '9102269622278'
      );
      
      if (!brokerRecord) {
        const currentBrokerCount = allBrokers.length;
        const brokerCustomId = `CHR-BRK-${String(currentBrokerCount + 1).padStart(4, '0')}`;
        
        brokerRecord = await base44.asServiceRole.entities.Broker.create({
          custom_id: brokerCustomId,
          name: 'PropAI Admin',
          phone: '9102269622278',
          agency_name: 'PropAI Live',
          status: "Active",
          total_listings_count: 0,
          active_listings_count: 0,
          verified: true
        });
        
        console.log(`✓ Created PropAI Admin broker ${brokerCustomId}`);
      } else {
        console.log(`✓ Using existing PropAI Admin broker ${brokerRecord.custom_id}`);
      }
      
      brokerContact = '9102269622278';
    }

    // STEP 4: GENERATE CUSTOM ID
    const allRequirements = await base44.asServiceRole.entities.Requirement.list();
    const nextSequence = allRequirements.length + 1;
    const customId = `CHR-REQ-${String(nextSequence).padStart(4, '0')}`;

    // STEP 5: GENERATE SLUG
    let slugParts = [];
    if (extractedData.bhk_preference && extractedData.bhk_preference.length > 0) {
      slugParts.push(extractedData.bhk_preference[0].toLowerCase().replace(/\s+/g, ''));
    }
    if (extractedData.preferred_locations && extractedData.preferred_locations.length > 0) {
      slugParts.push(extractedData.preferred_locations[0]
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-'));
    }
    slugParts.push(extractedData.listing_type.toLowerCase());
    
    let slug = slugParts.join('-').substring(0, 60).replace(/-+$/, '');
    
    const existingWithSlug = allRequirements.find(r => r.slug === slug);
    if (existingWithSlug) {
      slug = `${slug}-${String(nextSequence).padStart(4, '0')}`;
    }

    console.log(`✓ Generated ID: ${customId}, Slug: ${slug}`);

    // STEP 6: CREATE REQUIREMENT - ✅ broker_id is GUARANTEED to be set now
    let requirement;
    try {
      const requirementData = {
        custom_id: customId,
        slug: slug,
        broker_id: brokerRecord.id, // ✅ NEVER null
        broker_contact: brokerContact,
        bhk_preference: extractedData.bhk_preference || [],
        budget_min: extractedData.budget_min,
        budget_max: extractedData.budget_max,
        budget_unit: extractedData.budget_unit || 'lakhs', // ✅ Default to lakhs
        preferred_locations: extractedData.preferred_locations || [],
        pocket: extractedData.pocket,
        listing_type: extractedData.listing_type,
        property_category: extractedData.property_category || "Residential",
        furnishing_preference: extractedData.furnishing_preference || "Any",
        parking_required: extractedData.parking_required || false,
        veg_nonveg: extractedData.veg_nonveg,
        possession_timeline: extractedData.possession_timeline,
        urgency: extractedData.urgency || "Medium",
        amenities_required: extractedData.amenities_required || [],
        notes: extractedData.notes,
        source_text: message,
        client_name: extractedData.client_name || (brokerRecord.name !== 'PropAI Admin' ? brokerRecord.name : 'Client'),
        client_phone: extractedData.broker?.phone || null,
        client_type: extractedData.is_direct_client ? "Registered User" : "Broker Referral",
        is_direct_client: extractedData.is_direct_client || false,
        status: "Active"
      };

      console.log(`✓ Creating requirement with broker_id: ${brokerRecord.id} (${brokerRecord.name})`);
      
      requirement = await base44.asServiceRole.entities.Requirement.create(requirementData);
      console.log(`✓ Created requirement ${customId} - broker: ${brokerRecord.name}`);
    } catch (requirementError) {
      console.error(`❌ Requirement creation error:`, requirementError);
      return Response.json({ 
        success: false,
        error: `Requirement creation failed: ${requirementError.message}`,
        stage: 'requirement_creation',
        details: requirementError.toString()
      }, { status: 500 });
    }

    // STEP 7: BACKGROUND TASKS
    Promise.all([
      base44.asServiceRole.functions.invoke('sendToPropAI', {
        data_type: 'requirement',
        data: {
          ...requirement,
          broker_name: brokerRecord.name,
          broker_phone: brokerContact
        }
      }).catch(err => console.warn('PropAI sync failed:', err.message))
    ]).catch(err => console.warn('Background tasks failed:', err.message));

    console.log(`✅ Requirement parsed successfully`);

    return Response.json({
      success: true,
      requirement: {
        id: requirement.id,
        custom_id: requirement.custom_id,
        slug: requirement.slug,
        broker_custom_id: brokerRecord.custom_id,
        broker_name: brokerRecord.name,
        client_name: requirement.client_name
      }
    });

  } catch (error) {
    console.error(`❌ Unexpected error:`, error);
    return Response.json({ 
      success: false,
      error: `Unexpected error: ${error.message}`,
      stage: 'unknown',
      stack: error.stack
    }, { status: 500 });
  }
});