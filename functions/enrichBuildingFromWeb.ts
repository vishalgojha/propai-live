import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Web Intelligence Enrichment for Buildings
 * 
 * Uses LLM with web search to gather:
 * - Developer info and reputation
 * - Year built, floors, amenities
 * - Building reviews and sentiment
 * - Market context
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin-only authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 });
    }

    const { building_name, location } = await req.json();
    
    if (!building_name || !location) {
      return Response.json({ 
        success: false,
        error: 'building_name and location are required' 
      }, { status: 400 });
    }

    console.log(`🌐 Web enrichment for: ${building_name}, ${location}`);

    // Use LLM with web context to gather intelligence
    const prompt = `Research this Mumbai building and provide detailed, verified information:

Building: ${building_name}
Location: ${location}

Provide a comprehensive JSON report with ONLY verified information:

{
  "developer_name": "string or null (e.g., Lodha, Oberoi, Godrej)",
  "developer_reputation": "brief 1-line summary or null",
  "year_built": number or null (e.g., 2015),
  "building_type": "High-Rise Tower|Mid-Rise|Low-Rise|Society Complex|Commercial Building|Mixed-Use or null",
  "total_floors": number or null (e.g., 42),
  "total_units": number or null (approximate count),
  "amenities": ["Gym", "Pool", "Club House", "Garden", "Security", "Power Backup"] or [] (list actual amenities),
  "vibe_keywords": ["modern", "luxury", "family-oriented", "prime-location"] or [] (3-5 descriptive tags),
  "expat_friendly": true/false (is it popular with expats?),
  "pet_friendly": true/false (are pets allowed?),
  "veg_only": true/false (is it a vegetarian-only building?),
  "management_quality": "Excellent|Good|Average|Poor|Unknown",
  "building_summary": "2-3 sentence summary highlighting key features, reputation, and what makes it special",
  "verification_source": "where this information came from (e.g., 'Official website + MagicBricks reviews' or 'Housing.com + NoBroker data')"
}

CRITICAL RULES:
1. Only include information you can verify from web sources
2. Set fields to null if information is not available or not confident
3. Be honest about data quality
4. Focus on factual information from reliable real estate sources
5. For amenities, only list what you can verify
6. building_summary should be specific to THIS building, not generic`;

    let enrichmentData;
    try {
      enrichmentData = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            developer_name: { type: ["string", "null"] },
            developer_reputation: { type: ["string", "null"] },
            year_built: { type: ["number", "null"] },
            building_type: { type: ["string", "null"] },
            total_floors: { type: ["number", "null"] },
            total_units: { type: ["number", "null"] },
            amenities: { type: "array", items: { type: "string" } },
            vibe_keywords: { type: "array", items: { type: "string" } },
            expat_friendly: { type: "boolean" },
            pet_friendly: { type: "boolean" },
            veg_only: { type: "boolean" },
            management_quality: { type: "string" },
            building_summary: { type: "string" },
            verification_source: { type: "string" }
          }
        }
      });
    } catch (llmError) {
      console.error('LLM enrichment failed:', llmError);
      return Response.json({ 
        success: false,
        error: `Web intelligence failed: ${llmError.message}`,
        building_name,
        location
      }, { status: 500 });
    }

    console.log(`✅ Web enrichment complete for ${building_name}`);

    return Response.json({
      success: true,
      building_name,
      location,
      enrichment: enrichmentData
    });

  } catch (error) {
    console.error('Web enrichment error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});