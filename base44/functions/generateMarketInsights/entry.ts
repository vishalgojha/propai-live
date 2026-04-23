import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Generate Market Insights using Entity Data + LLM Analysis
 * Creates natural language summaries of market trends
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { location, timeframe = '30d' } = await req.json();
    
    // Calculate date range
    const now = new Date();
    const daysAgo = parseInt(timeframe) || 30;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    // Fetch all relevant data (no LLM)
    const properties = await base44.asServiceRole.entities.Property.filter(
      location ? { location: location } : {}
    );
    
    const recentProperties = properties.filter(p => 
      p.created_date && new Date(p.created_date) >= startDate
    );
    
    // Calculate market metrics (pure data operations)
    const metrics = {
      total_listings: properties.length,
      new_listings: recentProperties.length,
      active_listings: properties.filter(p => p.status === 'Active').length,
      
      // Price analysis
      avg_price_2bhk: calculateAvgPrice(properties.filter(p => p.bhk === '2 BHK')),
      avg_price_3bhk: calculateAvgPrice(properties.filter(p => p.bhk === '3 BHK')),
      
      // Category breakdown
      residential_count: properties.filter(p => p.property_category === 'Residential').length,
      commercial_count: properties.filter(p => p.property_category === 'Commercial').length,
      
      // Listing type breakdown
      sale_count: properties.filter(p => p.listing_type === 'Sale').length,
      rent_count: properties.filter(p => p.listing_type === 'Rent').length,
      
      // Top buildings by activity
      top_buildings: getTopBuildings(properties),
      
      // Price trends
      price_trend: analyzePriceTrend(properties, daysAgo)
    };
    
    // Use LLM to generate natural language insights
    const insightPrompt = `Analyze this Mumbai real estate market data and provide insights:

LOCATION: ${location || 'All Mumbai'}
TIMEFRAME: Last ${daysAgo} days

METRICS:
- Total Listings: ${metrics.total_listings}
- New in Period: ${metrics.new_listings}
- Active Now: ${metrics.active_listings}

PRICING:
- 2 BHK Average: ${metrics.avg_price_2bhk ? '₹' + metrics.avg_price_2bhk.toFixed(2) + 'L' : 'N/A'}
- 3 BHK Average: ${metrics.avg_price_3bhk ? '₹' + metrics.avg_price_3bhk.toFixed(2) + 'L' : 'N/A'}

BREAKDOWN:
- Residential: ${metrics.residential_count} (${((metrics.residential_count/metrics.total_listings)*100).toFixed(1)}%)
- Commercial: ${metrics.commercial_count} (${((metrics.commercial_count/metrics.total_listings)*100).toFixed(1)}%)
- For Sale: ${metrics.sale_count}
- For Rent: ${metrics.rent_count}

TOP BUILDINGS:
${metrics.top_buildings.map(b => `- ${b.name}: ${b.count} listings`).join('\n')}

PRICE TREND: ${metrics.price_trend}

Provide 3 key insights in natural language (each 1-2 sentences). Focus on actionable intelligence for buyers/renters.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: insightPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: { type: "string" }
          },
          summary: { type: "string" },
          recommendation: { type: "string" }
        }
      }
    });
    
    return Response.json({
      success: true,
      location: location || 'All Mumbai',
      timeframe: `${daysAgo} days`,
      metrics: metrics,
      ai_insights: llmResponse.insights,
      summary: llmResponse.summary,
      recommendation: llmResponse.recommendation,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Market insights error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

// Helper functions
function calculateAvgPrice(properties) {
  if (properties.length === 0) return null;
  
  const prices = properties.map(p => {
    const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
    return priceInLakhs;
  }).filter(p => p > 0);
  
  if (prices.length === 0) return null;
  
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

function getTopBuildings(properties) {
  const buildingCounts = {};
  
  properties.forEach(p => {
    if (p.building_name) {
      buildingCounts[p.building_name] = (buildingCounts[p.building_name] || 0) + 1;
    }
  });
  
  return Object.entries(buildingCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function analyzePriceTrend(properties, daysAgo) {
  // Group by weeks and calculate average
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  
  const recentAvg = calculateAvgPrice(properties.filter(p => 
    p.created_date && new Date(p.created_date) >= oneWeekAgo
  ));
  
  const olderAvg = calculateAvgPrice(properties.filter(p => 
    p.created_date && new Date(p.created_date) >= twoWeeksAgo && new Date(p.created_date) < oneWeekAgo
  ));
  
  if (!recentAvg || !olderAvg) return 'Insufficient data';
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 5) return 'Rising';
  if (change < -5) return 'Falling';
  return 'Stable';
}