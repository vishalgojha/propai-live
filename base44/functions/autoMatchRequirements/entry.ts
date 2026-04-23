import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Auto-Match Requirements to Properties with AI Scoring
 * Runs periodically to find matches and notify brokers
 * Combines entity filtering with LLM intelligence for match quality
 * ✅ UPDATED: Only matches scoring 80+ are saved (high-quality matches only)
 * ✅ NEW: Triggers notifications after matching
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role needed for bulk operations
    const requirements = await base44.asServiceRole.entities.Requirement.filter({ status: 'Active' });
    const properties = await base44.asServiceRole.entities.Property.filter({ status: 'Active' });
    
    const matches = [];
    const matchedRequirementIds = [];
    let processedCount = 0;
    
    for (const requirement of requirements) {
      // Basic filtering using entity criteria
      const candidates = properties.filter(p => {
        // Match listing type
        if (p.listing_type !== requirement.listing_type) return false;
        
        // Match BHK if specified
        if (requirement.bhk_preference?.length > 0 && 
            !requirement.bhk_preference.includes(p.bhk)) return false;
        
        // Match location if specified
        if (requirement.preferred_locations?.length > 0 && 
            !requirement.preferred_locations.some(loc => p.location?.includes(loc))) return false;
        
        // Match budget
        const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
        const budgetMin = requirement.budget_unit === 'crores' ? requirement.budget_min * 100 : requirement.budget_min;
        const budgetMax = requirement.budget_unit === 'crores' ? requirement.budget_max * 100 : requirement.budget_max;
        
        if (requirement.budget_min && priceInLakhs < budgetMin) return false;
        if (requirement.budget_max && priceInLakhs > budgetMax) return false;
        
        return true;
      });
      
      if (candidates.length === 0) continue;
      
      // Use LLM to score top 10 candidates for match quality
      const topCandidates = candidates.slice(0, 10);
      
      const llmPrompt = `Score these properties against requirement on 0-100 scale:

REQUIREMENT:
${JSON.stringify({
  bhk: requirement.bhk_preference,
  budget: `${requirement.budget_min}-${requirement.budget_max} ${requirement.budget_unit}`,
  locations: requirement.preferred_locations,
  furnishing: requirement.furnishing_preference,
  parking: requirement.parking_required,
  amenities: requirement.amenities_required,
  notes: requirement.notes
}, null, 2)}

PROPERTIES:
${topCandidates.map((p, idx) => `
[${idx}] ${p.ai_title || p.bhk + ' in ' + p.location}
- Price: ₹${p.price} ${p.price_unit}
- Area: ${p.carpet_area || 'N/A'} sq.ft
- Furnishing: ${p.furnishing || 'N/A'}
- Parking: ${p.parking || 'N/A'}
- Building: ${p.building_name || 'N/A'}
`).join('\n')}

Return JSON: { "matches": [{"index": 0, "score": 85, "reasons": ["perfect location", "within budget"]}] }
Only include matches scoring 80+.`;

      const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  score: { type: "number" },
                  reasons: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
      
      // ✅ Filter to only include 80+ scores
      const highQualityMatches = llmResponse.matches.filter(m => m.score >= 80);
      
      if (highQualityMatches.length === 0) continue;
      
      // Update requirement with AI-matched properties (80+ only)
      const matchedPropertyIds = highQualityMatches.map(m => topCandidates[m.index].id);
      
      await base44.asServiceRole.entities.Requirement.update(requirement.id, {
        ai_matched_properties: highQualityMatches.map(m => ({
          property_id: topCandidates[m.index].id,
          match_score: m.score,
          match_reasons: m.reasons
        })),
        matched_property_ids: matchedPropertyIds
      });
      
      matches.push({
        requirement_id: requirement.id,
        broker_id: requirement.broker_id,
        match_count: matchedPropertyIds.length,
        top_score: Math.max(...highQualityMatches.map(m => m.score))
      });
      
      matchedRequirementIds.push(requirement.id);
      processedCount++;
    }
    
    // ✅ NEW: Trigger notifications for matched requirements
    if (matchedRequirementIds.length > 0) {
      try {
        await base44.asServiceRole.functions.invoke('notifyMatchedRequirements', {
          requirement_ids: matchedRequirementIds
        });
        console.log(`Notifications triggered for ${matchedRequirementIds.length} requirements`);
      } catch (notifyError) {
        console.error('Failed to trigger notifications:', notifyError);
        // Don't fail the whole operation if notifications fail
      }
    }
    
    return Response.json({
      success: true,
      processed: processedCount,
      matches_found: matches.length,
      matches: matches,
      notifications_triggered: matchedRequirementIds.length,
      threshold: 80
    });
    
  } catch (error) {
    console.error('Auto-match error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});