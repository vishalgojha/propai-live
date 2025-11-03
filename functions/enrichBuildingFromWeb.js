import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Enrich Building with Web Intelligence
 * 
 * Uses AI + internet search to fetch contextual info about buildings:
 * - Developer reputation
 * - Nearby amenities (schools, hospitals, malls)
 * - Transit connectivity
 * - Market sentiment
 * - Notable features
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_name, location, developer_name } = await req.json();
    
    if (!building_name || !location) {
      return Response.json({ 
        error: 'building_name and location are required' 
      }, { status: 400 });
    }

    // Construct comprehensive search prompt
    const prompt = `You are researching a residential/commercial building in Mumbai, India for a real estate database.

BUILDING: ${building_name}
LOCATION: ${location}, Mumbai
${developer_name ? `DEVELOPER: ${developer_name}` : ''}

Research and provide the following information in JSON format:

{
  "developer_reputation": "Brief assessment of the developer's reputation and track record (2-3 sentences)",
  "building_age_estimate": "Approximate year built or age estimate",
  "total_floors_estimate": "Estimated number of floors if available",
  "nearby_amenities": {
    "schools": ["array of nearby schools within 2km"],
    "hospitals": ["array of nearby hospitals/clinics"],
    "malls": ["array of nearby shopping centers/malls"],
    "restaurants": ["array of notable restaurants/cafes in vicinity"],
    "transport": ["nearest metro station, railway station, or major transport hubs"]
  },
  "connectivity_summary": "1-2 sentences on transport connectivity and commute advantages",
  "neighborhood_vibe": "2-3 sentences describing the neighborhood character and lifestyle",
  "notable_features": ["array of standout building features or unique selling points"],
  "market_sentiment": "Overall market perception (e.g., 'Premium address with strong appreciation', 'Mid-market family-oriented', etc.)",
  "price_bracket": "General price range or market positioning (e.g., 'Premium', 'Upper Mid-Market', 'Mid-Market', 'Budget-Friendly')",
  "tenant_demographics": "Typical resident profile (e.g., 'Corporate professionals and expat families', 'Traditional Gujarati families', etc.)",
  "building_quality": "Assessment of construction quality and maintenance (if available)",
  "resale_liquidity": "How easy it is to resell properties in this building (if known)",
  "contextual_notes": "Any other relevant information that would help a buyer/renter make a decision"
}

IMPORTANT:
- Use ONLY verifiable information from search results
- If data is unavailable, use "Not available" or empty array
- Be factual, not promotional
- Focus on Mumbai-specific context
- Mention specific landmarks by name`;

    // Call AI with internet search
    const enrichmentData = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          developer_reputation: { type: "string" },
          building_age_estimate: { type: "string" },
          total_floors_estimate: { type: "string" },
          nearby_amenities: {
            type: "object",
            properties: {
              schools: { type: "array", items: { type: "string" } },
              hospitals: { type: "array", items: { type: "string" } },
              malls: { type: "array", items: { type: "string" } },
              restaurants: { type: "array", items: { type: "string" } },
              transport: { type: "array", items: { type: "string" } }
            }
          },
          connectivity_summary: { type: "string" },
          neighborhood_vibe: { type: "string" },
          notable_features: { type: "array", items: { type: "string" } },
          market_sentiment: { type: "string" },
          price_bracket: { type: "string" },
          tenant_demographics: { type: "string" },
          building_quality: { type: "string" },
          resale_liquidity: { type: "string" },
          contextual_notes: { type: "string" }
        }
      }
    });

    // Parse year from building_age_estimate if possible
    let yearBuilt = null;
    if (enrichmentData.building_age_estimate && enrichmentData.building_age_estimate !== "Not available") {
      const yearMatch = enrichmentData.building_age_estimate.match(/\d{4}/);
      if (yearMatch) {
        yearBuilt = parseInt(yearMatch[0]);
      }
    }

    // Parse total floors
    let totalFloorsNum = null;
    if (enrichmentData.total_floors_estimate && enrichmentData.total_floors_estimate !== "Not available") {
      const floorsMatch = enrichmentData.total_floors_estimate.match(/\d+/);
      if (floorsMatch) {
        totalFloorsNum = parseInt(floorsMatch[0]);
      }
    }

    // Consolidate amenities into a flat array for Building.amenities
    const allAmenities = [
      ...(enrichmentData.nearby_amenities?.schools?.slice(0, 3) || []),
      ...(enrichmentData.nearby_amenities?.hospitals?.slice(0, 2) || []),
      ...(enrichmentData.nearby_amenities?.malls?.slice(0, 2) || []),
      ...(enrichmentData.nearby_amenities?.transport?.slice(0, 2) || [])
    ].filter(a => a && a !== "Not available");

    // Generate tags from enrichment data
    const tags = [];
    if (enrichmentData.price_bracket && enrichmentData.price_bracket !== "Not available") {
      tags.push(enrichmentData.price_bracket);
    }
    if (enrichmentData.tenant_demographics && enrichmentData.tenant_demographics.toLowerCase().includes('expat')) {
      tags.push('Expat Friendly');
    }
    if (enrichmentData.tenant_demographics && enrichmentData.tenant_demographics.toLowerCase().includes('family')) {
      tags.push('Family Building');
    }
    if (enrichmentData.building_quality && (
      enrichmentData.building_quality.toLowerCase().includes('excellent') ||
      enrichmentData.building_quality.toLowerCase().includes('premium')
    )) {
      tags.push('Premium Quality');
    }

    // Prepare enriched building data
    const enrichedBuildingData = {
      // Core data from enrichment
      developer_reputation: enrichmentData.developer_reputation,
      year_built: yearBuilt,
      total_floors: totalFloorsNum,
      amenities: allAmenities.slice(0, 10), // Limit to 10 amenities
      tags: tags,
      
      // Context fields
      building_summary: `${enrichmentData.neighborhood_vibe} ${enrichmentData.market_sentiment}`.trim(),
      
      // Store full enrichment in admin notes for reference
      admin_notes: `
🌐 Web Intelligence:

Developer: ${enrichmentData.developer_reputation || 'N/A'}

Connectivity: ${enrichmentData.connectivity_summary || 'N/A'}

Vibe: ${enrichmentData.neighborhood_vibe || 'N/A'}

Market: ${enrichmentData.market_sentiment || 'N/A'}

Demographics: ${enrichmentData.tenant_demographics || 'N/A'}

Quality: ${enrichmentData.building_quality || 'N/A'}

Liquidity: ${enrichmentData.resale_liquidity || 'N/A'}

Notable: ${enrichmentData.notable_features?.join(', ') || 'N/A'}

Notes: ${enrichmentData.contextual_notes || 'N/A'}

Last enriched: ${new Date().toISOString()}
      `.trim(),
      
      // Metadata
      last_intelligence_update: new Date().toISOString(),
      verification_source: 'web_intelligence'
    };

    return Response.json({
      success: true,
      enrichedData: enrichedBuildingData,
      fullEnrichment: enrichmentData
    });

  } catch (error) {
    console.error('Error enriching building from web:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});