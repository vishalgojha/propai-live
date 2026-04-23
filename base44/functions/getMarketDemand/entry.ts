import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch last 30 days of search intent data
    const searches = await base44.asServiceRole.entities.SearchIntent.list('-created_date', 1000);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSearches = searches.filter(s => 
      new Date(s.created_date) > thirtyDaysAgo
    );

    // Aggregate search patterns
    const locationDemand = {};
    const bhkDemand = {};
    const listingTypeDemand = {};
    const priceRanges = [];

    recentSearches.forEach(search => {
      const filters = search.filters_applied || {};
      
      // Location demand
      if (filters.location_multi) {
        filters.location_multi.forEach(loc => {
          locationDemand[loc] = (locationDemand[loc] || 0) + 1;
        });
      }
      
      // BHK demand
      if (filters.bhk_multi) {
        filters.bhk_multi.forEach(bhk => {
          bhkDemand[bhk] = (bhkDemand[bhk] || 0) + 1;
        });
      }
      
      // Listing type demand
      if (filters.listingType && filters.listingType !== 'all') {
        listingTypeDemand[filters.listingType] = (listingTypeDemand[filters.listingType] || 0) + 1;
      }
      
      // Price ranges
      if (filters.minPrice || filters.maxPrice) {
        priceRanges.push({
          min: filters.minPrice || 0,
          max: filters.maxPrice || Infinity,
          listingType: filters.listingType
        });
      }
    });

    // Get top locations
    const topLocations = Object.entries(locationDemand)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, searches: count }));

    // Get top BHK types
    const topBHKs = Object.entries(bhkDemand)
      .sort((a, b) => b[1] - a[1])
      .map(([bhk, count]) => ({ bhk, searches: count }));

    // Get Google Trends data for top locations
    const trendPromises = topLocations.slice(0, 5).map(async ({ location }) => {
      try {
        const prompt = `Get current Google Trends data for property searches in "${location}, Mumbai" over the last 30 days. 
        
Focus on:
1. Search volume trend (rising/stable/falling)
2. Related popular searches
3. Interest level (0-100 score)

Return JSON only.`;

        const trendsData = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              location: { type: "string" },
              trend: { type: "string", enum: ["rising", "stable", "falling"] },
              interest_score: { type: "number" },
              related_searches: { 
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });

        return trendsData;
      } catch (error) {
        return {
          location,
          trend: "stable",
          interest_score: 50,
          related_searches: [],
          error: true
        };
      }
    });

    const googleTrends = await Promise.all(trendPromises);

    // Generate AI insights
    const insightsPrompt = `Analyze this Mumbai real estate search data and provide 3-5 actionable broker insights.

Internal Search Data (Last 30 days):
- Total searches: ${recentSearches.length}
- Top locations: ${topLocations.map(l => `${l.location} (${l.searches} searches)`).join(', ')}
- Top BHK types: ${topBHKs.map(b => `${b.bhk} (${b.searches} searches)`).join(', ')}

Google Trends Data:
${googleTrends.map(t => `${t.location}: ${t.trend} trend, interest score ${t.interest_score}/100`).join('\n')}

Provide specific recommendations about:
1. High-demand areas with rising interest
2. BHK/price combinations in demand
3. Supply gaps (high searches, low listings)

Format as JSON array of insights.`;

    const aiInsights = await base44.integrations.Core.InvokeLLM({
      prompt: insightsPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                category: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      summary: {
        total_searches: recentSearches.length,
        period_days: 30
      },
      top_locations: topLocations,
      top_bhks: topBHKs,
      listing_type_demand: listingTypeDemand,
      google_trends: googleTrends,
      ai_insights: aiInsights.insights || []
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});