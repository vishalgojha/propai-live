import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ✅ ROBUST Property Description Generator
 * - Processes 5 properties at a time (fast, no timeout)
 * - Returns immediately with progress
 * - Frontend handles the loop
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { skip = 0, limit = 5 } = body; // Process 5 at a time

    // ✅ OPTIMIZATION: Fetch with pagination to avoid loading ALL properties
    const allProperties = await base44.asServiceRole.entities.Property.list('-created_date');
    
    // Filter to only properties that NEED descriptions
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const propertiesToUpdate = allProperties.filter(p => {
      // Skip if already has good descriptions and is recent
      if (p.ai_title && p.ai_description && 
          p.ai_description.length > 50 && 
          new Date(p.created_date) > sixtyDaysAgo) {
        return false;
      }

      // Include if missing or low quality
      if (!p.ai_title || !p.ai_description) return true;
      if (p.ai_description.length < 50) return true;
      if (new Date(p.created_date) < sixtyDaysAgo) return true;

      return false;
    });

    const totalNeedingUpdate = propertiesToUpdate.length;

    if (totalNeedingUpdate === 0) {
      return Response.json({
        success: true,
        done: true,
        progress: {
          processed: 0,
          total: allProperties.length,
          remaining: 0,
          percentage: 100
        },
        message: '✅ All properties already have quality AI descriptions!'
      });
    }

    // Get current batch
    const currentBatch = propertiesToUpdate.slice(skip, skip + limit);

    if (currentBatch.length === 0) {
      return Response.json({
        success: true,
        done: true,
        progress: {
          processed: skip,
          total: totalNeedingUpdate,
          remaining: 0,
          percentage: 100
        },
        message: '✅ All descriptions generated!'
      });
    }

    // Fetch buildings for context (only once per batch)
    const buildings = await base44.asServiceRole.entities.Building.list();

    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    // Process current batch
    for (const property of currentBatch) {
      try {
        const building = buildings.find(b => b.id === property.building_id);
        
        const buildingContext = building ? `
Building: ${building.name}
Location: ${building.location}${building.pocket ? `, ${building.pocket}` : ''}
Developer: ${building.developer_name || 'N/A'}
Building Type: ${building.building_type || 'N/A'}
Amenities: ${building.amenities?.slice(0, 5).join(', ') || 'N/A'}
        `.trim() : 'No building context available';

        const prompt = `Generate a compelling property listing title and description.

Property Details:
- BHK: ${property.bhk}
- Price: ₹${property.price} ${property.price_unit}
- Listing Type: ${property.listing_type}
- Location: ${property.location}${property.pocket ? `, ${property.pocket}` : ''}
- Carpet Area: ${property.carpet_area || 'N/A'} sq.ft
- Furnishing: ${property.furnishing || 'N/A'}
- Amenities: ${property.amenities?.join(', ') || 'N/A'}

${buildingContext}

Requirements:
1. Title: 12-18 words, natural, highlights key features
2. Description: 40-80 words, engaging paragraph, NO bullet points
3. Mention building name if available
4. Include unique selling points
5. Mumbai real estate terminology

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

        await base44.asServiceRole.entities.Property.update(property.id, {
          ai_title: aiResponse.title,
          ai_description: aiResponse.description
        });

        updated++;

      } catch (error) {
        console.error(`Error for property ${property.id}:`, error);
        errors++;
        errorDetails.push({
          property_id: property.id,
          custom_id: property.custom_id,
          error: error.message
        });
      }
    }

    const processed = skip + currentBatch.length;
    const remaining = totalNeedingUpdate - processed;
    const percentage = Math.round((processed / totalNeedingUpdate) * 100);

    return Response.json({
      success: true,
      done: remaining === 0,
      progress: {
        processed,
        total: totalNeedingUpdate,
        remaining: Math.max(0, remaining),
        percentage,
        current_batch: currentBatch.length,
        updated,
        errors
      },
      next_skip: remaining > 0 ? processed : null,
      error_details: errorDetails.length > 0 ? errorDetails.slice(0, 3) : undefined,
      message: remaining > 0 
        ? `Processed ${processed}/${totalNeedingUpdate} (${percentage}%)`
        : `✅ All ${totalNeedingUpdate} descriptions generated!`
    });

  } catch (error) {
    console.error('Generate property descriptions error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});