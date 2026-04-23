import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * AI Deals Radar - Internal Intelligence Dashboard
 * 
 * Finds:
 * 1. Underpriced listings (below avg for building)
 * 2. Price drops (broker reduced rent/price)
 * 3. Hidden matches (draft properties matching active requirements)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active properties
    const properties = await base44.asServiceRole.entities.Property.filter({
      status: "Active",
      is_duplicate: false
    }, '-created_date');

    // Get all buildings with pricing data
    const buildings = await base44.asServiceRole.entities.Building.list();

    // Get all active requirements
    const requirements = await base44.asServiceRole.entities.Requirement.filter({
      status: "Active"
    });

    // 1. Find underpriced listings
    const underpricedDeals = [];

    for (const property of properties) {
      if (!property.building_name || !property.carpet_area) continue;

      // Find matching building
      const building = buildings.find(b => 
        b.name.toLowerCase() === property.building_name.toLowerCase()
      );

      if (!building) continue;

      // Calculate expected price based on building averages
      let expectedPrice = null;
      let expectedUnit = 'lakhs';

      if (property.listing_type === 'Rent') {
        if (property.bhk === '2 BHK' && building.avg_rent_2bhk) {
          expectedPrice = building.avg_rent_2bhk;
        } else if (property.bhk === '3 BHK' && building.avg_rent_3bhk) {
          expectedPrice = building.avg_rent_3bhk;
        }
      } else if (property.listing_type === 'Sale') {
        if (property.bhk === '2 BHK' && building.avg_sale_2bhk) {
          expectedPrice = building.avg_sale_2bhk;
          expectedUnit = 'crores';
        } else if (property.bhk === '3 BHK' && building.avg_sale_3bhk) {
          expectedPrice = building.avg_sale_3bhk;
          expectedUnit = 'crores';
        }
      }

      if (!expectedPrice) continue;

      // Normalize to lakhs for comparison
      const expectedInLakhs = expectedUnit === 'crores' ? expectedPrice * 100 : expectedPrice;
      const actualInLakhs = property.price_unit === 'crores' ? property.price * 100 : property.price;

      // If actual price is 15%+ below expected, it's a deal
      const discount = ((expectedInLakhs - actualInLakhs) / expectedInLakhs) * 100;

      if (discount >= 15) {
        underpricedDeals.push({
          propertyId: property.id,
          customId: property.custom_id,
          title: property.ai_title || `${property.bhk} in ${property.location}`,
          building: property.building_name,
          location: property.location,
          actualPrice: `₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}`,
          expectedPrice: `₹${expectedPrice}${expectedUnit === 'crores' ? ' Cr' : 'L'}`,
          discount: `${Math.round(discount)}%`,
          discountAmount: `₹${((expectedInLakhs - actualInLakhs) / 100).toFixed(2)}L`,
          bhk: property.bhk,
          listingType: property.listing_type,
          brokerTrustScore: property.broker_trust_score || 'Unknown'
        });
      }
    }

    // 2. Find price drops (would need price_change_history)
    const priceDrops = properties.filter(p => 
      p.price_change_history && p.price_change_history.length > 0
    ).map(p => ({
      propertyId: p.id,
      customId: p.custom_id,
      title: p.ai_title || `${p.bhk} in ${p.location}`,
      building: p.building_name,
      oldPrice: p.price_change_history[0].old_price,
      newPrice: p.price,
      priceUnit: p.price_unit,
      dropAmount: p.price_change_history[0].old_price - p.price,
      dropDate: p.price_change_history[0].date
    }));

    // 3. Find hidden matches (draft properties matching requirements)
    const draftProperties = await base44.asServiceRole.entities.Property.filter({
      status: "Draft"
    });

    const hiddenMatches = [];

    for (const req of requirements) {
      for (const draft of draftProperties) {
        let isMatch = true;

        // Check BHK
        if (req.bhk_preference && req.bhk_preference.length > 0) {
          if (!req.bhk_preference.includes(draft.bhk)) {
            isMatch = false;
            continue;
          }
        }

        // Check listing type
        if (req.listing_type !== draft.listing_type) {
          isMatch = false;
          continue;
        }

        // Check budget
        const priceInLakhs = draft.price_unit === 'crores' ? draft.price * 100 : draft.price;
        if (req.budget_min && priceInLakhs < req.budget_min) {
          isMatch = false;
          continue;
        }
        if (req.budget_max && priceInLakhs > req.budget_max) {
          isMatch = false;
          continue;
        }

        // Check location
        if (req.preferred_locations && req.preferred_locations.length > 0) {
          const locationMatch = req.preferred_locations.some(loc =>
            draft.location?.toLowerCase().includes(loc.toLowerCase()) ||
            draft.pocket?.toLowerCase().includes(loc.toLowerCase())
          );
          if (!locationMatch) {
            isMatch = false;
            continue;
          }
        }

        if (isMatch) {
          hiddenMatches.push({
            requirementId: req.id,
            clientName: req.client_name,
            clientPhone: req.client_phone,
            propertyId: draft.id,
            customId: draft.custom_id,
            title: draft.ai_title || `${draft.bhk} in ${draft.location}`,
            price: `₹${draft.price}${draft.price_unit === 'crores' ? ' Cr' : 'L'}`,
            location: draft.location,
            matchReason: `${draft.bhk} ${draft.listing_type} in ${draft.location} matching budget`
          });
        }
      }
    }

    // Sort by discount/value
    underpricedDeals.sort((a, b) => {
      const discountA = parseInt(a.discount);
      const discountB = parseInt(b.discount);
      return discountB - discountA;
    });

    return Response.json({
      success: true,
      generatedAt: new Date().toISOString(),
      summary: {
        underpricedDeals: underpricedDeals.length,
        priceDrops: priceDrops.length,
        hiddenMatches: hiddenMatches.length,
        totalOpportunities: underpricedDeals.length + priceDrops.length + hiddenMatches.length
      },
      deals: {
        underpriced: underpricedDeals.slice(0, 20), // Top 20
        priceDrops: priceDrops.slice(0, 10),
        hiddenMatches: hiddenMatches.slice(0, 15)
      }
    });

  } catch (error) {
    console.error('Error generating deals radar:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});