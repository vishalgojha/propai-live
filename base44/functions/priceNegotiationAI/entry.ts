import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Price Negotiation AI - Suggests negotiation strategies based on market data
 * Analyzes property pricing vs market, days on market, broker patterns
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { property_id, buyer_budget } = await req.json();
    
    if (!property_id) {
      return Response.json({ error: 'property_id required' }, { status: 400 });
    }
    
    // Fetch property and market context
    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const allProperties = await base44.asServiceRole.entities.Property.list();
    
    // Find comparable properties (same location, BHK, category)
    const comparables = allProperties.filter(p => 
      p.id !== property_id &&
      p.location === property.location &&
      p.bhk === property.bhk &&
      p.property_category === property.property_category &&
      p.listing_type === property.listing_type
    );
    
    // Calculate market position
    const propertyPrice = property.price_unit === 'crores' ? property.price * 100 : property.price;
    
    const comparablePrices = comparables.map(p => {
      return p.price_unit === 'crores' ? p.price * 100 : p.price;
    }).filter(p => p > 0);
    
    const marketAvg = comparablePrices.length > 0 ? 
      comparablePrices.reduce((sum, p) => sum + p, 0) / comparablePrices.length : null;
    
    const marketMedian = comparablePrices.length > 0 ?
      comparablePrices.sort((a, b) => a - b)[Math.floor(comparablePrices.length / 2)] : null;
    
    // Calculate leverage factors
    const daysOnMarket = property.created_date ? 
      Math.floor((new Date() - new Date(property.created_date)) / (1000 * 60 * 60 * 24)) : 0;
    
    const hasPhotos = (property.images?.length || 0) > 0;
    const viewsPerDay = daysOnMarket > 0 ? (property.views_count || 0) / daysOnMarket : 0;
    
    // Fetch broker data
    let brokerTrust = 50;
    let brokerSpecialization = null;
    
    if (property.broker_id) {
      try {
        const broker = await base44.asServiceRole.entities.Broker.get(property.broker_id);
        brokerTrust = broker.trust_score || 50;
        
        const brokerProperties = await base44.asServiceRole.entities.Property.filter({ 
          broker_id: property.broker_id 
        });
        
        brokerSpecialization = {
          total_listings: brokerProperties.length,
          active_listings: brokerProperties.filter(p => p.status === 'Active').length,
          sold_count: brokerProperties.filter(p => p.status === 'Sold' || p.status === 'Rented').length
        };
      } catch (error) {
        console.log('Broker data not available');
      }
    }
    
    // Building context
    let buildingActivity = null;
    if (property.building_id) {
      try {
        const building = await base44.asServiceRole.entities.Building.get(property.building_id);
        buildingActivity = {
          total_listings: building.total_listings || 0,
          active_listings: building.active_listings || 0,
          market_activity: building.market_activity
        };
      } catch (error) {
        console.log('Building data not available');
      }
    }
    
    // Use LLM for negotiation strategy
    const negotiationPrompt = `You are a Mumbai real estate negotiation expert. Analyze this property and suggest a negotiation strategy:

PROPERTY:
- ${property.ai_title || `${property.bhk} in ${property.location}`}
- Listed Price: ₹${property.price} ${property.price_unit}
- Area: ${property.carpet_area || 'N/A'} sq.ft
- Furnishing: ${property.furnishing || 'N/A'}
- Building: ${property.building_name || 'N/A'}

MARKET CONTEXT:
- Market Average: ${marketAvg ? '₹' + marketAvg.toFixed(2) + 'L' : 'N/A'}
- Market Median: ${marketMedian ? '₹' + marketMedian.toFixed(2) + 'L' : 'N/A'}
- Property vs Avg: ${marketAvg ? ((propertyPrice - marketAvg) / marketAvg * 100).toFixed(1) + '%' : 'N/A'}
- Comparables Found: ${comparables.length}

LEVERAGE FACTORS:
- Days on Market: ${daysOnMarket} (${daysOnMarket > 30 ? 'STRONG leverage' : daysOnMarket > 14 ? 'Moderate leverage' : 'Low leverage'})
- Views per Day: ${viewsPerDay.toFixed(1)} (${viewsPerDay < 1 ? 'LOW interest' : viewsPerDay > 3 ? 'HIGH interest' : 'MODERATE interest'})
- Has Photos: ${hasPhotos ? 'Yes' : 'No (weaker listing)'}
- Broker Trust Score: ${brokerTrust}/100

${brokerSpecialization ? `
BROKER CONTEXT:
- Active Listings: ${brokerSpecialization.active_listings}
- Completed Deals: ${brokerSpecialization.sold_count}
- ${brokerSpecialization.active_listings > 10 ? 'High volume broker (more flexible)' : 'Low volume (may hold price)'}
` : ''}

${buildingActivity ? `
BUILDING ACTIVITY:
- Active Listings: ${buildingActivity.active_listings}/${buildingActivity.total_listings}
- Market Status: ${buildingActivity.market_activity || 'Unknown'}
` : ''}

${buyer_budget ? `
BUYER BUDGET: ₹${buyer_budget}
Gap: ${((propertyPrice - (buyer_budget.includes('Cr') ? parseFloat(buyer_budget) * 100 : parseFloat(buyer_budget))) / propertyPrice * 100).toFixed(1)}%
` : ''}

Provide:
1. Realistic negotiation range (min-max discount %)
2. Opening offer suggestion
3. Key talking points (3-5 leverage factors)
4. Negotiation strategy (aggressive/moderate/soft)
5. Success probability (0-100%)
6. Best time to negotiate (immediate/wait N days)

Be data-driven and Mumbai-market realistic.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: negotiationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          negotiation_range: {
            type: "object",
            properties: {
              min_discount_percent: { type: "number" },
              max_discount_percent: { type: "number" }
            }
          },
          opening_offer: { type: "string" },
          talking_points: { type: "array", items: { type: "string" } },
          strategy: { type: "string" },
          success_probability: { type: "number" },
          best_timing: { type: "string" },
          rationale: { type: "string" }
        }
      }
    });
    
    return Response.json({
      success: true,
      property: {
        id: property.id,
        title: property.ai_title || `${property.bhk} in ${property.location}`,
        listed_price: `₹${property.price} ${property.price_unit}`,
        price_in_lakhs: propertyPrice
      },
      market_context: {
        avg_price: marketAvg ? `₹${marketAvg.toFixed(2)}L` : null,
        median_price: marketMedian ? `₹${marketMedian.toFixed(2)}L` : null,
        comparables_count: comparables.length,
        position_vs_market: marketAvg ? 
          `${((propertyPrice - marketAvg) / marketAvg * 100).toFixed(1)}%` : null
      },
      leverage_factors: {
        days_on_market: daysOnMarket,
        views_per_day: parseFloat(viewsPerDay.toFixed(1)),
        interest_level: viewsPerDay < 1 ? 'Low' : viewsPerDay > 3 ? 'High' : 'Moderate',
        broker_trust: brokerTrust,
        broker_volume: brokerSpecialization?.active_listings
      },
      negotiation_advice: llmResponse,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Price negotiation AI error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});