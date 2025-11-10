import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Enhanced Broker Pattern Analysis
 * NOW INCLUDES: Developer affinity tracking
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { broker_id } = await req.json();

    // Fetch broker, their properties, buildings, and developers
    const broker = await base44.asServiceRole.entities.Broker.get(broker_id);
    if (!broker) {
      return Response.json({ error: 'Broker not found' }, { status: 404 });
    }

    const allProperties = await base44.asServiceRole.entities.Property.list();
    const brokerProperties = allProperties.filter(p => p.broker_id === broker_id);
    
    const buildings = await base44.asServiceRole.entities.Building.list();
    const developers = await base44.asServiceRole.entities.Developer.list();

    // ✅ NEW: Calculate developer affinity
    const developerCounts = {};
    let totalWithDeveloper = 0;

    brokerProperties.forEach(prop => {
      if (prop.building_id) {
        const building = buildings.find(b => b.id === prop.building_id);
        if (building?.developer_id) {
          developerCounts[building.developer_id] = (developerCounts[building.developer_id] || 0) + 1;
          totalWithDeveloper++;
        }
      }
    });

    const developerAffinity = Object.entries(developerCounts)
      .map(([devId, count]) => {
        const dev = developers.find(d => d.id === devId);
        return {
          developer_id: devId,
          developer_name: dev?.name || 'Unknown',
          developer_tier: dev?.tier,
          listing_count: count,
          percentage: totalWithDeveloper > 0 ? ((count / totalWithDeveloper) * 100).toFixed(1) : 0
        };
      })
      .sort((a, b) => b.listing_count - a.listing_count);

    const topDeveloper = developerAffinity[0] || null;

    // ✅ EXISTING: Location analysis
    const locationCounts = {};
    brokerProperties.forEach(p => {
      if (p.location) {
        locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
      }
    });

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([loc]) => loc);

    // ✅ EXISTING: BHK analysis
    const bhkCounts = {};
    brokerProperties.forEach(p => {
      if (p.bhk) {
        bhkCounts[p.bhk] = (bhkCounts[p.bhk] || 0) + 1;
      }
    });

    const preferredBhk = Object.entries(bhkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([bhk]) => bhk);

    // ✅ EXISTING: Listing type focus
    const rentCount = brokerProperties.filter(p => p.listing_type === 'Rent').length;
    const saleCount = brokerProperties.filter(p => p.listing_type === 'Sale').length;
    const listingTypeFocus = rentCount > saleCount * 1.5 ? 'Rent' :
                            saleCount > rentCount * 1.5 ? 'Sale' : 'Mixed';

    // ✅ EXISTING: Price analysis
    const prices = brokerProperties
      .filter(p => p.price)
      .map(p => p.price_unit === 'crores' ? p.price * 100 : p.price);

    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length
    } : null;

    // ✅ EXISTING: Building expertise
    const buildingCounts = {};
    brokerProperties.forEach(p => {
      if (p.building_name) {
        buildingCounts[p.building_name] = (buildingCounts[p.building_name] || 0) + 1;
      }
    });

    const buildingExpertise = Object.entries(buildingCounts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([building]) => building);

    // Update broker with enhanced specializations
    const specializationsUpdate = {
      primary_locations: topLocations,
      preferred_bhk: preferredBhk,
      listing_type_focus: listingTypeFocus,
      price_range: priceRange,
      building_expertise: buildingExpertise
    };

    const updateData = {
      specializations: specializationsUpdate
    };

    // ✅ NEW: Add developer focus if found
    if (topDeveloper) {
      updateData.preferred_developers = developerAffinity.slice(0, 5).map(d => d.developer_id);
      updateData.developer_focus = {
        top_developer_id: topDeveloper.developer_id,
        top_developer_name: topDeveloper.developer_name,
        listing_count: topDeveloper.listing_count,
        percentage: parseFloat(topDeveloper.percentage)
      };
    }

    await base44.asServiceRole.entities.Broker.update(broker_id, updateData);

    return Response.json({
      success: true,
      broker_name: broker.name,
      specializations: specializationsUpdate,
      developer_affinity: developerAffinity,
      top_developer: topDeveloper,
      analysis: {
        total_properties: brokerProperties.length,
        properties_with_developer: totalWithDeveloper,
        unique_developers: developerAffinity.length
      }
    });

  } catch (error) {
    console.error('Analyze broker patterns error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});