
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();
    
    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Extract structured data using LLM
    const extractionPrompt = `Extract property listing details from this broker message. Return ONLY valid JSON.

Message:
"""
${message}
"""

Extract and return this exact JSON structure:
{
  "bhk": "string (e.g., '2 BHK', '3 BHK', 'Office Space')",
  "property_category": "Residential or Commercial",
  "price": number (in lakhs),
  "price_unit": "lakhs or crores",
  "carpet_area": number or null,
  "built_up_area": number or null,
  "floor": "string or null",
  "furnishing": "Unfurnished|Semi-Furnished|Fully Furnished|Bare Shell|Warm Shell or null",
  "parking": "string or null",
  "possession": "string or null",
  "location": "string (e.g., 'Bandra West', 'BKC')",
  "pocket": "string or null (micro-area)",
  "building_name": "string or null",
  "listing_type": "Sale|Rent|Lease",
  "amenities": ["array of strings"] or null,
  "description": "string or null",
  "broker_name": "string (broker's name from message)",
  "broker_phone": "string (phone number with country code, e.g., '919820094416')",
  "broker_agency": "string or null"
}

Important: 
- If price is in crores, set price_unit to "crores"
- Extract ALL phone numbers mentioned - main broker and alternates
- Return ONLY the JSON, no markdown, no explanations`;

    const extractedData = await base44.asServiceRole.integrations.Core.InvokeLLM({
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

    console.log('Extracted data:', extractedData);

    // 1. HANDLE BROKER - Create or find existing
    let broker = null;
    const allBrokers = await base44.asServiceRole.entities.Broker.list();
    
    // Normalize phone for matching
    const normalizedPhone = extractedData.broker_phone.replace(/\D/g, '');
    
    // Try to find existing broker by phone
    broker = allBrokers.find(b => 
      b.phone && b.phone.replace(/\D/g, '').includes(normalizedPhone.slice(-10))
    );

    if (!broker) {
      // Generate broker custom_id
      const brokerCount = allBrokers.length + 1;
      const brokerCustomId = `CHR-BRK-${String(brokerCount).padStart(4, '0')}`;
      
      console.log(`Creating new broker: ${extractedData.broker_name} with ID ${brokerCustomId}`);
      
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
      
      console.log(`✅ Broker created: ${broker.id} (${brokerCustomId})`);
    } else {
      // Update existing broker
      console.log(`Found existing broker: ${broker.id} (${broker.custom_id})`);
      
      const updatedAreasSet = new Set(broker.areas_covered || []);
      if (extractedData.location) updatedAreasSet.add(extractedData.location);
      
      await base44.asServiceRole.entities.Broker.update(broker.id, {
        total_listings_count: (broker.total_listings_count || 0) + 1,
        active_listings_count: (broker.active_listings_count || 0) + 1,
        last_activity: new Date().toISOString(),
        areas_covered: Array.from(updatedAreasSet)
      });
    }

    // 2. HANDLE BUILDING - Link or create if needed
    let buildingId = null;
    if (extractedData.building_name) {
      const allBuildings = await base44.asServiceRole.entities.Building.list();
      const building = allBuildings.find(b => 
        b.name.toLowerCase() === extractedData.building_name.toLowerCase() &&
        b.location === extractedData.location
      );
      
      if (building) {
        buildingId = building.id;
        
        // Update building stats
        await base44.asServiceRole.entities.Building.update(building.id, {
          total_listings: (building.total_listings || 0) + 1,
          active_listings: (building.active_listings || 0) + 1
        });
      } else {
        // Generate building custom_id
        const buildingCount = allBuildings.length + 1;
        const buildingCustomId = `CHR-BLD-${String(buildingCount).padStart(4, '0')}`;
        
        // Create basic building record
        const newBuilding = await base44.asServiceRole.entities.Building.create({
          custom_id: buildingCustomId,
          name: extractedData.building_name,
          location: extractedData.location,
          pocket: extractedData.pocket,
          total_listings: 1,
          active_listings: 1
        });
        buildingId = newBuilding.id;
        console.log(`✅ Building created: ${buildingId} (${buildingCustomId})`);
      }
    }

    // 3. GENERATE PROPERTY CUSTOM ID AND SLUG
    const idResponse = await base44.asServiceRole.functions.invoke('generatePropertyId', {
      location: extractedData.location,
      property: {
        bhk: extractedData.bhk,
        location: extractedData.location,
        pocket: extractedData.pocket,
        building_name: extractedData.building_name
      }
    });

    const { customId, slug } = idResponse.data;

    // 4. GENERATE AI TITLE & DESCRIPTION
    const aiPrompt = `Create a compelling property listing title and description.

Property Details:
- ${extractedData.bhk} in ${extractedData.location}
${extractedData.building_name ? `- Building: ${extractedData.building_name}` : ''}
- Price: ₹${extractedData.price} ${extractedData.price_unit}
- Furnishing: ${extractedData.furnishing || 'Not specified'}
- Area: ${extractedData.carpet_area ? extractedData.carpet_area + ' sq.ft' : 'Not specified'}
${extractedData.amenities ? `- Amenities: ${extractedData.amenities.join(', ')}` : ''}

Generate:
1. A natural, engaging title (12-18 words) that highlights key features
2. A compelling description (40-60 words, 3-4 lines) that sells the property

**Description Guidelines:**
- Natural, conversational tone
- Highlight 2-3 key selling points
- Include practical details
- NO generic fluff ("world-class", "premium lifestyle")
- 3-4 lines that flow naturally

Return as JSON:
{
  "title": "string",
  "description": "string"
}`;

    const aiContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        }
      }
    });

    // 5. CREATE PROPERTY with proper broker_id linking
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

    const property = await base44.asServiceRole.entities.Property.create(propertyData);

    console.log(`✅ Property created: ${property.id} (${customId}) | Broker: ${broker.id} (${broker.custom_id})`);

    // 6. SEND TO PROPAI LIVE
    try {
      await base44.asServiceRole.functions.invoke('sendToPropAI', {
        data_type: 'property',
        data: {
          ...propertyData,
          id: property.id,
          broker_name: broker.name,
          broker_phone: broker.phone,
          broker_agency: broker.agency_name
        }
      });
      console.log('✅ Sent to PropAI Live');
    } catch (propaiError) {
      console.error('⚠️ PropAI sync failed (non-blocking):', propaiError.message);
    }

    return Response.json({
      success: true,
      property: {
        id: property.id,
        custom_id: property.custom_id,
        slug: property.slug,
        ai_title: property.ai_title,
        broker_id: broker.id,
        broker_custom_id: broker.custom_id,
        broker_name: broker.name,
        building_id: buildingId
      },
      broker: {
        id: broker.id,
        custom_id: broker.custom_id,
        name: broker.name,
        phone: broker.phone
      }
    });

  } catch (error) {
    console.error('Parse error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
