import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Generate Comprehensive Broker Performance Reports
 * Combines entity analytics with LLM narrative generation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { broker_id, timeframe = '30d' } = await req.json();
    
    if (!broker_id) {
      return Response.json({ error: 'broker_id required' }, { status: 400 });
    }
    
    // Fetch broker and related data
    const broker = await base44.asServiceRole.entities.Broker.get(broker_id);
    const properties = await base44.asServiceRole.entities.Property.filter({ broker_id });
    const interactions = await base44.asServiceRole.entities.BrokerInteraction.filter({ broker_id });
    
    // Calculate timeframe
    const now = new Date();
    const daysAgo = parseInt(timeframe) || 30;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const recentProperties = properties.filter(p => 
      p.created_date && new Date(p.created_date) >= startDate
    );
    
    // Performance Metrics (pure entity operations)
    const metrics = {
      // Activity metrics
      total_listings: properties.length,
      active_listings: properties.filter(p => p.status === 'Active').length,
      new_listings: recentProperties.length,
      
      // Quality metrics
      duplicate_count: properties.filter(p => p.is_duplicate).length,
      duplicate_rate: (properties.filter(p => p.is_duplicate).length / properties.length * 100).toFixed(1),
      
      // Engagement metrics
      total_views: properties.reduce((sum, p) => sum + (p.views_count || 0), 0),
      avg_views_per_listing: (properties.reduce((sum, p) => sum + (p.views_count || 0), 0) / properties.length).toFixed(1),
      
      // Specialization
      top_location: getTopValue(properties.map(p => p.location)),
      top_bhk: getTopValue(properties.map(p => p.bhk)),
      dominant_category: getTopValue(properties.map(p => p.property_category)),
      
      // Price analysis
      avg_listing_price: calculateAvgPrice(properties),
      price_range: getPriceRange(properties),
      
      // Response metrics
      interactions_count: interactions.length,
      avg_response_time: calculateAvgResponseTime(interactions),
      
      // Trust signals
      photos_shared_rate: (properties.filter(p => p.images?.length > 0).length / properties.length * 100).toFixed(1),
      ai_description_rate: (properties.filter(p => p.ai_description).length / properties.length * 100).toFixed(1)
    };
    
    // Use LLM to generate narrative report
    const reportPrompt = `Generate a professional broker performance report:

BROKER: ${broker.name}
TIMEFRAME: Last ${daysAgo} days
TRUST SCORE: ${broker.trust_score || 'N/A'}/100

ACTIVITY:
- Total Listings: ${metrics.total_listings}
- New in Period: ${metrics.new_listings}
- Active Now: ${metrics.active_listings}

QUALITY:
- Duplicate Rate: ${metrics.duplicate_rate}%
- Photos Shared: ${metrics.photos_shared_rate}%
- Average Views per Listing: ${metrics.avg_views_per_listing}

SPECIALIZATION:
- Primary Location: ${metrics.top_location}
- Focus BHK: ${metrics.top_bhk}
- Category: ${metrics.dominant_category}
- Avg Price: ₹${metrics.avg_listing_price?.toFixed(2) || 'N/A'}L

ENGAGEMENT:
- Total Views: ${metrics.total_views}
- Interactions: ${metrics.interactions_count}
- Response Time: ${metrics.avg_response_time}

Generate:
1. Performance summary (2-3 sentences)
2. Strengths (2-3 bullet points)
3. Areas for improvement (2-3 bullet points)
4. Recommendation (actionable advice)`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: reportPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
          overall_rating: { type: "string" }
        }
      }
    });
    
    return Response.json({
      success: true,
      broker: {
        id: broker.id,
        name: broker.name,
        phone: broker.phone,
        trust_score: broker.trust_score
      },
      timeframe: `${daysAgo} days`,
      metrics: metrics,
      ai_report: llmResponse,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Broker report error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

// Helper functions
function getTopValue(array) {
  if (array.length === 0) return null;
  
  const counts = {};
  array.forEach(val => {
    if (val) counts[val] = (counts[val] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function calculateAvgPrice(properties) {
  const prices = properties.map(p => {
    const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
    return priceInLakhs;
  }).filter(p => p > 0);
  
  if (prices.length === 0) return null;
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

function getPriceRange(properties) {
  const prices = properties.map(p => {
    const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
    return priceInLakhs;
  }).filter(p => p > 0);
  
  if (prices.length === 0) return null;
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

function calculateAvgResponseTime(interactions) {
  const responseTimes = interactions
    .filter(i => i.response_time_minutes)
    .map(i => i.response_time_minutes);
  
  if (responseTimes.length === 0) return 'N/A';
  
  const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
  
  if (avg < 60) return `${avg.toFixed(0)} minutes`;
  if (avg < 1440) return `${(avg / 60).toFixed(1)} hours`;
  return `${(avg / 1440).toFixed(1)} days`;
}