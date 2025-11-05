import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

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

    // STEP 1: EXTRACT DATA (with detailed error messages)
    let extractedData;
    try {
      const extractionPrompt = `Extract property listing details from this broker message. Return ONLY valid JSON.

Message:
"""
${message}
"""

Extract and return this exact JSON structure:
{
  "bhk": "string (e.g., '2 BHK', '3 BHK', 'Office Space') - REQUIRED",
  "property_category": "Residential or Commercial - REQUIRED",
  "price": number (in lakhs) - REQUIRED,
  "price_unit": "lakhs or crores" - REQUIRED,
  "carpet_area": number or null,
  "built_up_area": number or null,
  "floor": "string or null",
  "furnishing": "Unfurnished|Semi-Furnished|Fully Furnished|Bare Shell|Warm Shell or null",
  "parking": "string or null",
  "possession": "string or null",
  "location": "string (e.g., 'Bandra West', 'BKC') - REQUIRED",
  "pocket": "string or null (micro-area)",
  "building_name": "string or null",
  "listing_type": "Sale|Rent|Lease - REQUIRED",
  "amenities": ["array of strings"] or null,
  "description": "string or null",
  "broker_name": "string (broker's name from message) - REQUIRED",
  "broker_phone": "string (phone number with country code, e.g., '919820094416') - REQUIRED",
  "broker_agency": "string or null"
}

Important: 
- If price is in crores, set price_unit to "crores"
- Extract ALL phone numbers mentioned
- Return ONLY the JSON, no markdown, no explanations
- If ANY required field is missing, set it to null but include it`;

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
            broker_agency: { type: ["string", "null"] }
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

    // STEP 3: HANDLE BROKER (fast - no extra calls)
    let broker = null;
    try {
      const allBrokers = await base44.asServiceRole.entities.Broker.list();
      const normalizedPhone = extractedData.broker_phone.replace(/\D/g, '');
      
      broker = allBrokers.find(b => 
        b.phone && b.phone.replace(/\D/g, '').includes(normalizedPhone.slice(-10))
      );

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
      } else {
        const updatedAreasSet = new Set(broker.areas_covered || []);
        if (extractedData.location) updatedAreasSet.add(extractedData.location);
        
        await base44.asServiceRole.entities.Broker.update(broker.id, {
          total_listings_count: (broker.total_listings_count || 0) + 1,
          active_listings_count: (broker.active_listings_count || 0) + 1,
          last_activity: new Date().toISOString(),
          areas_covered: Array.from(updatedAreasSet)
        });
      }
    } catch (brokerError) {
      return Response.json({ 
        success: false,
        error: `Broker creation failed: ${brokerError.message}`,
        stage: 'broker',
        extractedData: extractedData
      }, { status: 500 });
    }

    // STEP 4: HANDLE BUILDING (fast - minimal logic)
    let buildingId = null;
    if (extractedData.building_name) {
      try {
        const allBuildings = await base44.asServiceRole.entities.Building.list();
        const building = allBuildings.find(b => 
          b.name.toLowerCase() === extractedData.building_name.toLowerCase() &&
          b.location === extractedData.location
        );
        
        if (building) {
          buildingId = building.id;
          await base44.asServiceRole.entities.Building.update(building.id, {
            total_listings: (building.total_listings || 0) + 1,
            active_listings: (building.active_listings || 0) + 1
          });
        } else {
          const buildingCount = allBuildings.length + 1;
          const buildingCustomId = `CHR-BLD-${String(buildingCount).padStart(4, '0')}`;
          
          const newBuilding = await base44.asServiceRole.entities.Building.create({
            custom_id: buildingCustomId,
            name: extractedData.building_name,
            location: extractedData.location,
            pocket: extractedData.pocket,
            total_listings: 1,
            active_listings: 1
          });
          buildingId = newBuilding.id;
        }
      } catch (buildingError) {
        console.warn('Building link failed (non-blocking):', buildingError.message);
        // Continue without building link
      }
    }

    // STEP 5: GENERATE CUSTOM ID & SLUG (fast)
    let customId, slug;
    try {
      const idResponse = await base44.asServiceRole.functions.invoke('generatePropertyId', {
        location: extractedData.location,
        property: {
          bhk: extractedData.bhk,
          location: extractedData.location,
          pocket: extractedData.pocket,
          building_name: extractedData.building_name
        }
      });
      customId = idResponse.data.customId;
      slug = idResponse.data.slug;
    } catch (idError) {
      return Response.json({ 
        success: false,
        error: `ID generation failed: ${idError.message}`,
        stage: 'id_generation',
        extractedData: extractedData
      }, { status: 500 });
    }

    // STEP 6: GENERATE AI CONTENT (fast - simplified prompt)
    let aiContent;
    try {
      const aiPrompt = `Create property listing content.

Property: ${extractedData.bhk} in ${extractedData.location}
${extractedData.building_name ? `Building: ${extractedData.building_name}` : ''}
Price: ₹${extractedData.price} ${extractedData.price_unit}
Furnishing: ${extractedData.furnishing || 'Not specified'}
Area: ${extractedData.carpet_area ? extractedData.carpet_area + ' sq.ft' : 'Not specified'}

Generate:
1. Natural title (12-18 words)
2. Compelling description (40-60 words, natural tone, no fluff)

Return JSON:
{
  "title": "string",
  "description": "string"
}`;

      aiContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" }
          }
        }
      });
    } catch (aiError) {
      // Fallback to basic title/description
      aiContent = {
        title: `${extractedData.bhk} ${extractedData.building_name ? `in ${extractedData.building_name}` : ''} ${extractedData.location}`,
        description: `${extractedData.bhk} available for ${extractedData.listing_type.toLowerCase()} in ${extractedData.location}. ${extractedData.furnishing || 'Unfurnished'}. Price: ₹${extractedData.price}${extractedData.price_unit === 'crores' ? ' Cr' : 'L'}.`
      };
    }

    // STEP 7: CREATE PROPERTY
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
        ai_title: aiContent.title,
        ai_description: aiContent.description,
        broker_id: broker.id,
        broker_contact: broker.phone,
        broker_trust_score: broker.trust_score || 50,
        status: "Active",
        assigned_agent_name: "Vishal"
      };

      property = await base44.asServiceRole.entities.Property.create(propertyData);
    } catch (propertyError) {
      return Response.json({ 
        success: false,
        error: `Property creation failed: ${propertyError.message}`,
        stage: 'property_creation',
        extractedData: extractedData
      }, { status: 500 });
    }

    // STEP 8: BACKGROUND TASKS (non-blocking)
    // PropAI sync - fire and forget
    base44.asServiceRole.functions.invoke('sendToPropAI', {
      data_type: 'property',
      data: {
        ...property,
        broker_name: broker.name,
        broker_phone: broker.phone,
        broker_agency: broker.agency_name
      }
    }).catch(err => console.warn('PropAI sync failed (non-blocking):', err.message));

    return Response.json({
      success: true,
      property: {
        id: property.id,
        custom_id: property.custom_id,
        slug: property.slug,
        ai_title: property.ai_title,
        broker_custom_id: broker.custom_id,
        broker_name: broker.name
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