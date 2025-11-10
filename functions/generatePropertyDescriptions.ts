import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Smart Property Description Generator
 * BATCH PROCESSING: Process 25 properties at a time to avoid timeouts
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { force_regenerate = false, property_ids = null, batch_size = 25 } = await req.json();

    // Fetch properties
    const allProperties = await base44.asServiceRole.entities.Property.list();
    
    // ✅ SMART FILTERING: Only update properties that need it
    let propertiesToUpdate = allProperties;

    if (!force_regenerate && !property_ids) {
      // Filter to only properties that NEED descriptions
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      propertiesToUpdate = allProperties.filter(p => {
        // Skip if already has good descriptions and is recent
        if (p.ai_title && p.ai_description && 
            p.ai_description.length > 50 && 
            new Date(p.created_date) > sixtyDaysAgo) {
          return false;
        }

        // Include if:
        // 1. Missing ai_title or ai_description
        if (!p.ai_title || !p.ai_description) return true;
        
        // 2. Description is too short (low quality)
        if (p.ai_description.length < 50) return true;
        
        // 3. Property is old and context might be stale
        if (new Date(p.created_date) < sixtyDaysAgo) return true;

        return false;
      });
    } else if (property_ids) {
      // Specific properties requested
      propertiesToUpdate = allProperties.filter(p => property_ids.includes(p.id));
    }

    if (propertiesToUpdate.length === 0) {
      return Response.json({
        success: true,
        message: 'All properties already have quality AI descriptions!',
        skipped: allProperties.length,
        updated: 0,
        stats: {
          total_properties: allProperties.length,
          already_good: allProperties.filter(p => p.ai_title && p.ai_description && p.ai_description.length > 50).length,
          needs_update: 0
        }
      });
    }

    // ✅ BATCH PROCESSING: Process only batch_size properties to avoid timeout
    const batchToProcess = propertiesToUpdate.slice(0, batch_size);
    const remainingCount = propertiesToUpdate.length - batch_size;

    // Fetch buildings for context
    const buildings = await base44.asServiceRole.entities.Building.list();

    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    for (const property of batchToProcess) {
      try {
        // Get building context if available
        const building = buildings.find(b => b.id === property.building_id);
        
        // Build context-rich prompt
        const buildingContext = building ? `
Building: ${building.name}
Location: ${building.location}${building.pocket ? `, ${building.pocket}` : ''}
Developer: ${building.developer_name || 'N/A'}
Building Type: ${building.building_type || 'N/A'}
Management Quality: ${building.management_quality || 'N/A'}
Amenities: ${building.amenities?.slice(0, 5).join(', ') || 'N/A'}
Building Summary: ${building.building_summary || 'N/A'}
        `.trim() : 'No building context available';

        const prompt = `Generate a compelling property listing title and description.

Property Details:
- BHK: ${property.bhk}
- Price: ₹${property.price} ${property.price_unit}
- Listing Type: ${property.listing_type}
- Location: ${property.location}${property.pocket ? `, ${property.pocket}` : ''}
- Carpet Area: ${property.carpet_area || 'N/A'} sq.ft
- Furnishing: ${property.furnishing || 'N/A'}
- Floor: ${property.floor || 'N/A'}
- Parking: ${property.parking || 'N/A'}
- Possession: ${property.possession || 'N/A'}
- View: ${property.view || 'N/A'}
- Amenities: ${property.amenities?.join(', ') || 'N/A'}

${buildingContext}

Requirements:
1. Title: 12-18 words, natural, highlights key features (e.g., "Luxurious 3 BHK with Sea View in Oberoi Sky Heights, Bandra West")
2. Description: 40-80 words, engaging paragraph format, NO TRUNCATION, NO bullet points
3. Mention building name if available
4. Include unique selling points (view, amenities, developer reputation)
5. Use Mumbai real estate terminology
6. Make it sound premium but authentic

Return JSON with 'title' and 'description' keys.`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" }
            }
          }
        });

        // Update property with AI-generated content
        await base44.asServiceRole.entities.Property.update(property.id, {
          ai_title: aiResponse.title,
          ai_description: aiResponse.description
        });

        updated++;

      } catch (error) {
        console.error(`Error generating description for property ${property.id}:`, error);
        errors++;
        errorDetails.push({
          property_id: property.id,
          custom_id: property.custom_id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      batch_info: {
        processed: batchToProcess.length,
        remaining: Math.max(0, remainingCount),
        total_needed: propertiesToUpdate.length
      },
      stats: {
        total_properties: allProperties.length,
        already_good: allProperties.length - propertiesToUpdate.length,
        needs_update: propertiesToUpdate.length,
        updated,
        errors
      },
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      message: remainingCount > 0 
        ? `✅ Processed ${updated} properties. ${remainingCount} more remaining - run again to continue.`
        : `✅ Updated ${updated} properties. All done!`
    });

  } catch (error) {
    console.error('Generate property descriptions error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});