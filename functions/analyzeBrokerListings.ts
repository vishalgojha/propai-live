import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.broker_id) {
      return Response.json({ error: 'No broker profile' }, { status: 400 });
    }

    // Fetch broker data
    const brokers = await base44.entities.Broker.list();
    const broker = brokers.find(b => b.id === user.broker_id);
    if (!broker) {
      return Response.json({ error: 'Broker not found' }, { status: 404 });
    }

    // Fetch all properties and requirements
    const [properties, requirements] = await Promise.all([
      base44.entities.Property.list(),
      base44.entities.Requirement.list()
    ]);

    // Filter broker's properties
    const brokerProps = properties.filter(p => p.broker_id === broker.id && p.status === 'Active');
    const activeReqs = requirements.filter(r => r.status === 'Active');

    // 1. FIND MATCHING REQUIREMENTS
    const matchedRequirements = [];
    activeReqs.forEach(req => {
      const matches = brokerProps.filter(prop => {
        const bhkMatch = req.bhk_preference?.some(bhk => bhk === prop.bhk) ?? true;
        const locMatch = req.preferred_locations?.some(loc => loc === prop.location) ?? true;
        
        if (!bhkMatch || !locMatch) return false;

        if (req.budget_min || req.budget_max) {
          const propPrice = prop.price_unit === 'crores' ? prop.price * 100 : prop.price;
          const minPrice = req.budget_min || 0;
          const maxPrice = req.budget_max || Infinity;
          if (propPrice < minPrice || propPrice > maxPrice) return false;
        }

        return true;
      });

      if (matches.length > 0) {
        matchedRequirements.push({
          requirement_id: req.id,
          client_name: req.client_name || 'Client',
          bhk: req.bhk_preference?.join(', '),
          location: req.preferred_locations?.join(', '),
          matched_properties: matches.length,
          properties: matches.slice(0, 3).map(p => ({
            id: p.id,
            title: p.ai_title || `${p.bhk} in ${p.location}`,
            price: `₹${p.price} ${p.price_unit === 'crores' ? 'Cr' : 'L'}`
          }))
        });
      }
    });

    // 2. DETECT SLOW-MOVING LISTINGS (no views in 7+ days)
    const slowMoving = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    brokerProps.forEach(prop => {
      const lastRefresh = prop.last_refreshed ? new Date(prop.last_refreshed) : new Date(prop.created_date);
      if (lastRefresh < sevenDaysAgo && (prop.views_count || 0) < 5) {
        slowMoving.push({
          id: prop.id,
          title: prop.ai_title || `${prop.bhk} in ${prop.location}`,
          price: `₹${prop.price} ${prop.price_unit}`,
          views: prop.views_count || 0,
          days_old: Math.floor((new Date() - new Date(prop.created_date)) / (1000 * 60 * 60 * 24)),
          location: prop.location
        });
      }
    });

    // 3. DETECT DUPLICATE LISTINGS
    const duplicates = [];
    const seen = new Map();

    brokerProps.forEach(prop => {
      const key = `${prop.bhk}|${prop.location}|${Math.round(prop.price / 10)}`;
      if (seen.has(key)) {
        const original = seen.get(key);
        duplicates.push({
          property_1: {
            id: original.id,
            title: original.ai_title || `${original.bhk} in ${original.location}`,
            created: new Date(original.created_date).toLocaleDateString()
          },
          property_2: {
            id: prop.id,
            title: prop.ai_title || `${prop.bhk} in ${prop.location}`,
            created: new Date(prop.created_date).toLocaleDateString()
          }
        });
      } else {
        seen.set(key, prop);
      }
    });

    // 4. GENERATE AI INSIGHTS
    const prompt = `You are a real estate consultant analyzing a broker's listing portfolio. Based on the following data, provide 3-5 specific, actionable suggestions to improve their business performance.

Broker: ${broker.name}
Total Active Listings: ${brokerProps.length}
Matched Requirements: ${matchedRequirements.length}
Slow-Moving Listings: ${slowMoving.length}
Potential Duplicates: ${duplicates.length}

Matched Requirements:
${matchedRequirements.map(m => `- ${m.matched_properties} properties match ${m.client_name}'s requirement for ${m.bhk} in ${m.location}`).join('\n')}

Slow-Moving Listings (no views in 7+ days):
${slowMoving.slice(0, 5).map(s => `- ${s.title} (${s.price}) - ${s.views} views, listed ${s.days_old} days ago`).join('\n')}

Provide specific recommendations for:
1. Matching properties with active client requirements
2. Pricing strategies for slow-moving listings
3. Duplicate review and consolidation

Format response as JSON with arrays of suggestions.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      broker: {
        name: broker.name,
        total_listings: brokerProps.length
      },
      insights: {
        matched_requirements: matchedRequirements,
        slow_moving_listings: slowMoving.slice(0, 5),
        potential_duplicates: duplicates.slice(0, 5),
        ai_suggestions: aiResponse.suggestions || []
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});