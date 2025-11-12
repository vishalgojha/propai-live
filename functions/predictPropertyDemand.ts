import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Predict Property Demand using Historical Data + LLM Reasoning
 * Analyzes patterns to forecast which properties will perform well
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { property_id } = await req.json();
    
    // Fetch property and similar properties
    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const allProperties = await base44.asServiceRole.entities.Property.list();
    
    // Find similar properties (same location, BHK, category)
    const similarProperties = allProperties.filter(p => 
      p.id !== property_id &&
      p.location === property.location &&
      p.bhk === property.bhk &&
      p.property_category === property.property_category
    );
    
    // Fetch building data if available
    let buildingContext = null;
    if (property.building_id) {
      const building = await base44.asServiceRole.entities.Building.get(property.building_id);
      buildingContext = {
        name: building.name,
        total_listings: building.total_listings,
        active_listings: building.active_listings,
        avg_rent_2bhk: building.avg_rent_2bhk,
        market_activity: building.market_activity,
        management_quality: building.management_quality
      };
    }
    
    // Calculate demand indicators (entity operations)
    const indicators = {
      // Price competitiveness
      price_percentile: calculatePricePercentile(property, similarProperties),
      
      // Building popularity
      building_activity_score: buildingContext ? 
        (buildingContext.active_listings / buildingContext.total_listings * 100).toFixed(1) : null,
      
      // Recency bonus
      days_since_listed: getDaysSince(property.created_date),
      
      // Quality signals
      has_photos: (property.images?.length || 0) > 0,
      has_ai_description: !!property.ai_description,
      broker_trust_score: property.broker_trust_score || 0,
      
      // Market context
      similar_properties_count: similarProperties.length,
      location_competition: similarProperties.filter(p => p.status === 'Active').length,
      
      // Historical performance
      views: property.views_count || 0,
      views_per_day: property.views_count && property.created_date ? 
        (property.views_count / getDaysSince(property.created_date)).toFixed(1) : 0
    };
    
    // Use LLM to predict demand and provide reasoning
    const predictionPrompt = `Predict demand for this property using data:

PROPERTY:
- ${property.ai_title || `${property.bhk} in ${property.location}`}
- Price: ₹${property.price} ${property.price_unit}
- Area: ${property.carpet_area || 'N/A'} sq.ft
- Furnishing: ${property.furnishing || 'N/A'}
- Building: ${property.building_name || 'N/A'}

DEMAND INDICATORS:
- Price Competitiveness: ${indicators.price_percentile}th percentile (lower = better deal)
- Days Listed: ${indicators.days_since_listed}
- Views per Day: ${indicators.views_per_day}
- Has Photos: ${indicators.has_photos ? 'Yes' : 'No'}
- Broker Trust: ${indicators.broker_trust_score}/100
- Competition: ${indicators.location_competition} similar active listings
${buildingContext ? `
BUILDING CONTEXT:
- ${buildingContext.name}
- Activity: ${buildingContext.market_activity || 'Unknown'}
- Management: ${buildingContext.management_quality || 'Unknown'}
` : ''}

Predict demand on 0-100 scale and provide:
1. Demand score
2. Demand category (Low/Medium/High/Very High)
3. Key factors (3-5 bullet points)
4. Recommendation for seller/landlord`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: predictionPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          demand_score: { type: "number" },
          demand_category: { type: "string" },
          key_factors: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
          expected_engagement: { type: "string" }
        }
      }
    });
    
    return Response.json({
      success: true,
      property_id: property.id,
      property_title: property.ai_title || `${property.bhk} in ${property.location}`,
      indicators: indicators,
      prediction: llmResponse,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Demand prediction error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

// Helper functions
function calculatePricePercentile(property, similarProperties) {
  if (similarProperties.length === 0) return 50;
  
  const targetPrice = property.price_unit === 'crores' ? property.price * 100 : property.price;
  
  const prices = similarProperties.map(p => {
    return p.price_unit === 'crores' ? p.price * 100 : p.price;
  }).filter(p => p > 0);
  
  if (prices.length === 0) return 50;
  
  prices.push(targetPrice);
  prices.sort((a, b) => a - b);
  
  const rank = prices.indexOf(targetPrice) + 1;
  return Math.round((rank / prices.length) * 100);
}

function getDaysSince(dateString) {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}