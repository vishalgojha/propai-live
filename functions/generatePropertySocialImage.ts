import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { property_id, generate_description = true } = body;
    
    if (!property_id) {
      return Response.json({ success: false, error: 'property_id required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await base44.asServiceRole.entities.Property.list();
    const property = properties.find(p => p.id === property_id);
    
    if (!property) {
      return Response.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    // Get building and developer data for context
    let building = null;
    let developer = null;
    
    if (property.building_id) {
      const buildings = await base44.asServiceRole.entities.Building.list();
      building = buildings.find(b => b.id === property.building_id);
      
      if (building?.developer_id) {
        const developers = await base44.asServiceRole.entities.Developer.list();
        developer = developers.find(d => d.id === building.developer_id);
      }
    }

    // ✅ NEW: AI-Powered Social Media Description
    let socialDescription = property.ai_description; // Default to existing
    
    if (generate_description) {
      const prompt = `You are a Mumbai real estate marketing expert. Create a COMPELLING, SHAREABLE social media post description for this property.

PROPERTY DETAILS:
- Title: ${property.ai_title || `${property.bhk} in ${property.location}`}
- Type: ${property.bhk} ${property.property_type || 'Apartment'}
- Listing: ${property.listing_type}
- Location: ${property.location}${property.pocket ? ` (${property.pocket})` : ''}
- Building: ${property.building_name || 'N/A'}
- Developer: ${developer?.name || 'N/A'}${developer?.tier ? ` (${developer.tier})` : ''}
- Price: ₹${property.price_unit === 'crores' ? `${property.price} Cr` : `${property.price} Lakhs`}
- Carpet Area: ${property.carpet_area || 'N/A'} sq.ft
- Furnishing: ${property.furnishing || 'N/A'}
- Amenities: ${property.amenities?.slice(0, 5).join(', ') || 'N/A'}
- View: ${property.view || 'N/A'}
- Floor: ${property.floor || 'N/A'}${property.total_floors ? ` of ${property.total_floors}` : ''}
- Parking: ${property.parking || 'N/A'}

RULES:
1. Write 3 crisp sentences (max 60 words total)
2. Start with an attention-grabbing hook (e.g., "🌟 Dream home alert!", "💎 Luxury redefined", "🏡 Your perfect space awaits")
3. Highlight 2-3 STANDOUT features (view, location, amenities, developer reputation)
4. Use emojis strategically (max 3-4 total)
5. End with a subtle FOMO trigger (e.g., "Won't last long", "Rare find", "Limited availability")
6. Avoid generic phrases like "beautiful", "amazing" - be SPECIFIC
7. Match the tone to the property type (luxury = sophisticated, mid-segment = practical value)

Examples:
- Luxury: "🌅 Wake up to Arabian Sea views from this Lodha masterpiece in Worli. 4 BHK | 2,800 sq.ft | Sky deck & infinity pool. This doesn't come around often."
- Premium: "💎 Pali Hill's best-kept secret. 3 BHK | Fully furnished | Walk to Bandra linking road. Perfect for executives who refuse to compromise."
- Value: "🏡 Smart investment in Andheri East. 2 BHK | Near metro | Gated society. Location + Price = Sold fast."

Write ONLY the description, no extra text:`;

      try {
        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false
        });

        socialDescription = aiResponse.trim();
      } catch (error) {
        console.error('AI description generation failed:', error);
        // Fallback to existing description
      }
    }

    // Generate screenshot with the (potentially new) AI description
    const appUrl = req.headers.get('origin') || 'https://propai.live';
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}`;

    const apiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!apiKey) {
      return Response.json({ success: false, error: 'BROWSERLESS_API_KEY missing' }, { status: 500 });
    }

    const endpoint = `https://production-sfo.browserless.io/screenshot?token=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageUrl,
        options: {
          fullPage: false,
          type: 'png',
          clip: { x: 0, y: 0, width: 1200, height: 630 }
        },
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 30000
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ 
        success: false, 
        error: `Screenshot failed: ${error}`,
        social_description: socialDescription // Return description even if screenshot fails
      }, { status: 500 });
    }

    const imageBytes = await response.arrayBuffer();
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });
    const imageFile = new File([imageBlob], `social-${property_id}.png`, { type: 'image/png' });

    const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: imageFile });

    // ✅ OPTIONAL: Update property with new social description
    if (generate_description && socialDescription !== property.ai_description) {
      await base44.asServiceRole.entities.Property.update(property_id, {
        social_media_description: socialDescription
      });
    }

    return Response.json({
      success: true,
      image_url: upload.file_url,
      social_description: socialDescription,
      property_id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});