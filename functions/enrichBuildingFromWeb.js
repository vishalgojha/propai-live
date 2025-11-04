import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Web Intelligence Enrichment for Buildings
 * 
 * ADMIN ONLY - Performs web scraping to gather:
 * - Developer info and reputation
 * - Building reviews and sentiment
 * - Nearby amenities and landmarks
 * - Market context
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ CRITICAL: Admin-only authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized - Admin access required for web scraping' 
      }, { status: 401 });
    }

    const { building_name, location } = await req.json();
    
    if (!building_name || !location) {
      return Response.json({ 
        error: 'building_name and location are required' 
      }, { status: 400 });
    }

    console.log(`🌐 Web enrichment for: ${building_name}, ${location}`);

    // Use LLM with web context to gather intelligence
    const prompt = `Research and provide detailed information about this Mumbai building:

Building: ${building_name}
Location: ${location}

Provide a comprehensive JSON report with:
{
  "developer_name": "string or null",
  "developer_reputation": "brief summary or null",
  "year_built": number or null,
  "building_type": "High-Rise Tower|Mid-Rise|Low-Rise|Standalone|Society Complex|Commercial Building|Mixed-Use or null",
  "total_floors": number or null,
  "amenities": ["array of amenities"] or [],
  "vibe_keywords": ["modern", "family-oriented", etc.] or [],
  "expat_friendly": boolean,
  "pet_friendly": boolean,
  "veg_only": boolean,
  "management_quality": "Excellent|Good|Average|Poor|Unknown",
  "building_summary": "2-3 sentence summary highlighting key features and reputation",
  "verification_source": "where this information came from"
}

Important:
- Only return verified/reliable information
- Set fields to null if information is not available
- Be honest about data quality
- Focus on factual information, not opinions`;

    const enrichmentData = await base44.asServiceRole.integrations.Core.InvokeLLM({
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