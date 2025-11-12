import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Listing Optimization AI - Analyzes property listing and suggests improvements
 * Checks title, description, pricing, photos, and provides actionable recommendations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { property_id, auto_apply = false } = await req.json();
    
    if (!property_id) {
      return Response.json({ error: 'property_id required' }, { status: 400 });
    }
    
    // Fetch property and market data
    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const allProperties = await base44.asServiceRole.entities.Property.list();
    
    // Find top-performing similar properties
    const similarProperties = allProperties.filter(p => 
      p.id !== property_id &&
      p.location === property.location &&
      p.bhk === property.bhk &&
      p.views_count > 0
    ).sort((a, b) => b.views_count - a.views_count).slice(0, 5);
    
    // Calculate optimization score (entity operations)
    const optimizationScore = {
      title_quality: property.ai_title ? 100 : 0,
      description_quality: property.ai_description ? 100 : property.description ? 50 : 0,
      photo_quality: (property.images?.length || 0) >= 3 ? 100 : (property.images?.length || 0) * 33,
      price_competitiveness: 50, // Will be calculated by LLM
      seo_slug: property.slug ? 100 : 0,
      amenities_listed: property.amenities?.length > 0 ? 100 : 0,
      building_linked: property.building_id ? 100 : 0,
      social_ready: property.social_media_description ? 100 : 0
    };
    
    const overallScore = Math.round(
      Object.values(optimizationScore).reduce((sum, s) => sum + s, 0) / 
      Object.keys(optimizationScore).length
    );
    
    // Get building context if available
    let buildingData = null;
    if (property.building_id) {
      try {
        buildingData = await base44.asServiceRole.entities.Building.get(property.building_id);
      } catch (error) {
        console.log('Building not found');
      }
    }
    
    // Use LLM to analyze and suggest improvements
    const optimizationPrompt = `You are a PropAI listing optimization expert. Analyze this property and suggest improvements:

CURRENT LISTING:
- Title: ${property.ai_title || property.description?.substring(0, 100) || 'NO TITLE'}
- Description: ${property.ai_description || property.description || 'NO DESCRIPTION'}
- Price: ₹${property.price} ${property.price_unit} (${property.listing_type})
- Photos: ${property.images?.length || 0}
- Amenities: ${property.amenities?.length || 0} listed
- Building: ${property.building_name || 'Not specified'}
- Area: ${property.carpet_area || 'N/A'} sq.ft
- Furnishing: ${property.furnishing || 'N/A'}

CURRENT PERFORMANCE:
- Views: ${property.views_count || 0}
- Days Listed: ${property.created_date ? Math.floor((new Date() - new Date(property.created_date)) / (1000*60*60*24)) : 0}
- Views per Day: ${property.views_count && property.created_date ? ((property.views_count) / Math.max(1, Math.floor((new Date() - new Date(property.created_date)) / (1000*60*60*24)))).toFixed(1) : 0}

TOP PERFORMING SIMILAR PROPERTIES:
${similarProperties.map((p, idx) => `
${idx + 1}. ${p.ai_title || `${p.bhk} in ${p.location}`}
   Views: ${p.views_count} | Price: ₹${p.price} ${p.price_unit}
   Title: "${p.ai_title?.substring(0, 80) || 'N/A'}"
`).join('\n')}

${buildingData ? `
BUILDING CONTEXT:
- ${buildingData.name}
- Average 2BHK: ${buildingData.avg_rent_2bhk ? '₹' + buildingData.avg_rent_2bhk + 'L' : 'N/A'}
- Market Activity: ${buildingData.market_activity || 'Unknown'}
- Total Listings: ${buildingData.total_listings || 0}
` : ''}

OPTIMIZATION SCORE: ${overallScore}/100

Provide specific, actionable recommendations:
1. Title optimization (rewrite if needed)
2. Description improvements (enhance key selling points)
3. Price adjustment (if overpriced vs market)
4. Photo strategy (how many needed, what to show)
5. Missing information (what fields to add)
6. Urgency tactics (if slow-moving)

Return structured JSON with improvements.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: optimizationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          optimized_title: { type: "string" },
          optimized_description: { type: "string" },
          price_recommendation: {
            type: "object",
            properties: {
              suggested_price: { type: "string" },
              reasoning: { type: "string" },
              price_competitive: { type: "boolean" }
            }
          },
          photo_strategy: { type: "string" },
          missing_fields: { type: "array", items: { type: "string" } },
          urgency_tactics: { type: "array", items: { type: "string" } },
          priority_actions: { type: "array", items: { type: "string" } },
          estimated_impact: { type: "string" }
        }
      }
    });
    
    // Auto-apply improvements if requested
    if (auto_apply) {
      const updates = {};
      
      if (llmResponse.optimized_title && !property.ai_title) {
        updates.ai_title = llmResponse.optimized_title;
      }
      
      if (llmResponse.optimized_description && !property.ai_description) {
        updates.ai_description = llmResponse.optimized_description;
      }
      
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Property.update(property_id, updates);
      }
    }
    
    return Response.json({
      success: true,
      property_id: property.id,
      property_title: property.ai_title || `${property.bhk} in ${property.location}`,
      current_performance: {
        optimization_score: overallScore,
        views: property.views_count || 0,
        days_on_market: daysOnMarket,
        views_per_day: property.views_count && daysOnMarket > 0 ? 
          (property.views_count / daysOnMarket).toFixed(1) : 0
      },
      market_position: {
        vs_average: marketAvg ? `${((propertyPrice - marketAvg) / marketAvg * 100).toFixed(1)}%` : null,
        comparables_count: comparables.length
      },
      recommendations: llmResponse,
      auto_applied: auto_apply,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Listing optimization error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});