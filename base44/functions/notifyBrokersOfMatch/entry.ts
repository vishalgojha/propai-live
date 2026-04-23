import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BROKER MATCH NOTIFICATION SYSTEM
 * 
 * When a requirement is created, this function:
 * 1. Finds brokers with matching properties (75%+ match score)
 * 2. Groups matches by broker
 * 3. Generates personalized WhatsApp messages for each broker
 * 4. Returns notifications ready to send
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 });
    }

    const { requirementId, autoSend = false } = await req.json();
    
    if (!requirementId) {
      return Response.json({ 
        success: false,
        error: 'requirementId is required' 
      }, { status: 400 });
    }

    // Get the requirement
    const requirements = await base44.asServiceRole.entities.Requirement.list();
    const requirement = requirements.find(r => r.id === requirementId);
    
    if (!requirement) {
      return Response.json({ 
        success: false,
        error: 'Requirement not found' 
      }, { status: 404 });
    }

    // Get all active properties
    const properties = await base44.asServiceRole.entities.Property.filter({
      status: 'Active'
    });

    // Get all brokers for lookup
    const brokers = await base44.asServiceRole.entities.Broker.list();
    const brokerMap = new Map(brokers.map(b => [b.id, b]));

    // Match properties to requirement
    const matches = [];
    
    for (const property of properties) {
      let score = 0;
      const reasons = [];
      
      // BHK matching (30 points)
      if (requirement.bhk_preference?.includes(property.bhk)) {
        score += 30;
        reasons.push(`✅ ${property.bhk} matches preference`);
      }
      
      // Location matching (25 points)
      if (requirement.preferred_locations?.includes(property.location)) {
        score += 25;
        reasons.push(`📍 Located in ${property.location}`);
      }
      
      // Budget matching (25 points)
      const propPriceLakhs = property.price_unit === 'crores' ? property.price * 100 : property.price;
      const budgetMin = requirement.budget_min || 0;
      const budgetMax = requirement.budget_max || Infinity;
      
      if (propPriceLakhs >= budgetMin && propPriceLakhs <= budgetMax) {
        score += 25;
        reasons.push(`💰 Within budget (₹${property.price}${property.price_unit === 'crores' ? 'Cr' : 'L'})`);
      }
      
      // Furnishing matching (10 points)
      if (requirement.furnishing_preference && 
          (requirement.furnishing_preference === 'Any' || 
           requirement.furnishing_preference === property.furnishing)) {
        score += 10;
        reasons.push(`🪑 ${property.furnishing || 'Unfurnished'}`);
      }
      
      // Listing type matching (10 points)
      if (requirement.listing_type === property.listing_type) {
        score += 10;
        reasons.push(`📋 ${property.listing_type}`);
      }
      
      // Only include 75%+ matches
      if (score >= 75) {
        const broker = brokerMap.get(property.broker_id);
        if (broker && broker.phone) {
          matches.push({
            property,
            broker,
            score,
            reasons
          });
        }
      }
    }

    // Group matches by broker
    const brokerMatches = new Map();
    
    for (const match of matches) {
      const brokerId = match.broker.id;
      
      if (!brokerMatches.has(brokerId)) {
        brokerMatches.set(brokerId, {
          broker: match.broker,
          properties: []
        });
      }
      
      brokerMatches.get(brokerId).properties.push({
        property: match.property,
        score: match.score,
        reasons: match.reasons
      });
    }

    // Generate notifications for each broker
    const notifications = [];
    
    for (const [brokerId, data] of brokerMatches.entries()) {
      const { broker, properties } = data;
      
      // Sort by match score
      properties.sort((a, b) => b.score - a.score);
      
      // Get top 3 matches for message
      const topMatches = properties.slice(0, 3);
      
      // Generate personalized message
      let message = `🔔 *New Client Requirement Alert*\n\n`;
      message += `Hi ${broker.name}, we have a client looking for:\n\n`;
      message += `🏠 *${requirement.bhk_preference?.join('/') || 'Property'}*\n`;
      message += `📍 ${requirement.preferred_locations?.join(', ') || 'Flexible location'}\n`;
      message += `💰 Budget: ₹${requirement.budget_min || 0}-${requirement.budget_max || '∞'}${requirement.budget_unit === 'crores' ? 'Cr' : 'L'}\n`;
      message += `📋 ${requirement.listing_type}\n\n`;
      
      message += `We found *${properties.length} matching ${properties.length === 1 ? 'property' : 'properties'}* from your portfolio:\n\n`;
      
      topMatches.forEach((match, idx) => {
        const p = match.property;
        message += `${idx + 1}. *${p.bhk}* - ${p.location}\n`;
        message += `   ₹${p.price}${p.price_unit === 'crores' ? 'Cr' : 'L'} | ${p.carpet_area ? p.carpet_area + ' sqft' : 'Area NA'}\n`;
        message += `   Match: ${match.score}% - ${match.reasons[0]}\n\n`;
      });
      
      if (properties.length > 3) {
        message += `...and ${properties.length - 3} more matches.\n\n`;
      }
      
      message += `📞 *Can you confirm availability & arrange viewing?*\n\n`;
      message += `_Chariot Realty Team_`;
      
      // WhatsApp URL
      const whatsappUrl = `https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      notifications.push({
        broker: {
          id: broker.id,
          name: broker.name,
          phone: broker.phone,
          custom_id: broker.custom_id
        },
        matchCount: properties.length,
        topMatch: {
          property_id: topMatches[0].property.id,
          property_custom_id: topMatches[0].property.custom_id,
          score: topMatches[0].score
        },
        message,
        whatsappUrl
      });
    }

    // Sort notifications by match count (descending)
    notifications.sort((a, b) => b.matchCount - a.matchCount);

    // Calculate summary stats
    const totalMatches = matches.length;
    const avgMatchScore = matches.length > 0 
      ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length)
      : 0;

    return Response.json({
      success: true,
      requirement: {
        id: requirement.id,
        custom_id: requirement.custom_id,
        client_name: requirement.client_name,
        bhk_preference: requirement.bhk_preference,
        locations: requirement.preferred_locations
      },
      notifications,
      summary: {
        total_brokers: notifications.length,
        total_matches: totalMatches,
        avg_match_score: avgMatchScore
      }
    });

  } catch (error) {
    console.error('Broker notification error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});