import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Auto-Match Requirements to Properties with AI Scoring
 * Runs periodically to find matches and notify brokers
 * Combines entity filtering with LLM intelligence for match quality
 * ✅ UPDATED: Only matches scoring 80+ are saved (high-quality matches only)
 * ✅ NEW: Triggers WhatsApp notifications for brokers when matches found
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role needed for bulk operations
    const requirements = await base44.asServiceRole.entities.Requirement.filter({ status: 'Active' });
    const properties = await base44.asServiceRole.entities.Property.filter({ status: 'Active' });
    
    const matches = [];
    let processedCount = 0;
    let notificationsTriggered = 0;
    
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
      
      // Check if this is a NEW match (not previously saved)
      const existingMatchIds = requirement.matched_property_ids || [];
      const newMatches = highQualityMatches.filter(m => 
        !existingMatchIds.includes(topCandidates[m.index].id)
      );
      
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
        new_matches: newMatches.length,
        top_score: Math.max(...highQualityMatches.map(m => m.score))
      });
      
      // ✅ NEW: Trigger WhatsApp notification if there are NEW matches
      if (newMatches.length > 0) {
        try {
          const notificationPayload = {
            requirement_id: requirement.id,
            matches: newMatches.map(m => ({
              property_id: topCandidates[m.index].id,
              match_score: m.score,
              match_reasons: m.reasons
            }))
          };
          
          // Call notification function asynchronously (don't wait for response)
          base44.asServiceRole.functions.invoke('notifyBrokerMatch', notificationPayload)
            .then(() => console.log(`✅ Notification triggered for requirement ${requirement.custom_id}`))
            .catch(err => console.warn(`⚠️ Notification failed for ${requirement.custom_id}:`, err.message));
          
          notificationsTriggered++;
        } catch (notifError) {
          console.warn(`Failed to trigger notification for ${requirement.custom_id}:`, notifError.message);
        }
      }
      
      processedCount++;
    }
    
    return Response.json({
      success: true,
      processed: processedCount,
      matches_found: matches.length,
      notifications_triggered: notificationsTriggered,
      matches: matches,
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