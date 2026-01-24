import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Get real-time market intelligence for a building
 * 
 * Input: { building_id: "bldg_abc123" }
 * Output: { active_listings, avg_price_2bhk, avg_price_3bhk, demand_score, price_trend, inquiries_30d }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { building_id } = await req.json();
    
    if (!building_id) {
      return Response.json({ 
        error: 'building_id is required' 
      }, { status: 400 });
    }
    
    // Get building
    const buildings = await base44.entities.Building.list();
    const building = buildings.find(b => b.id === building_id);
    
    if (!building) {
      return Response.json({ 
        error: 'Building not found' 
      }, { status: 404 });
    }
    
    // Get all properties for this building
    const allProperties = await base44.entities.Property.list();
    const buildingProperties = allProperties.filter(p => p.building_id === building_id);
    const activeProperties = buildingProperties.filter(p => p.status === 'Active' && !p.is_duplicate);
    
    // Calculate 2 BHK average
    const bhk2Props = activeProperties.filter(p => p.bhk === '2 BHK');
    const avg_2bhk = bhk2Props.length > 0 
      ? bhk2Props.reduce((sum, p) => {
          const priceInCr = p.price_unit === 'crores' ? p.price : p.price / 100;
          return sum + priceInCr;
        }, 0) / bhk2Props.length
      : null;
    
    // Calculate 3 BHK average
    const bhk3Props = activeProperties.filter(p => p.bhk === '3 BHK');
    const avg_3bhk = bhk3Props.length > 0
      ? bhk3Props.reduce((sum, p) => {
          const priceInCr = p.price_unit === 'crores' ? p.price : p.price / 100;
          return sum + priceInCr;
        }, 0) / bhk3Props.length
      : null;
    
    // Calculate price per sqft
    const propsWithArea = activeProperties.filter(p => p.carpet_area && p.price);
    const avg_price_per_sqft = propsWithArea.length > 0
      ? propsWithArea.reduce((sum, p) => {
          const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
          const pricePerSqft = (priceInLakhs * 100000) / p.carpet_area;
          return sum + pricePerSqft;
        }, 0) / propsWithArea.length
      : null;
    
    // Calculate demand score (based on views and inquiries)
    const totalViews = activeProperties.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalInquiries = activeProperties.reduce((sum, p) => sum + (p.inquiries_count || 0), 0);
    const demand_score = activeProperties.length > 0
      ? Math.min(1, (totalViews / (activeProperties.length * 100)) + (totalInquiries / (activeProperties.length * 10)))
      : 0;
    
    // Calculate price trend (simplified - compare recent vs older listings)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentProps = buildingProperties.filter(p => new Date(p.created_date) > thirtyDaysAgo);
    const olderProps = buildingProperties.filter(p => new Date(p.created_date) <= thirtyDaysAgo);
    
    let price_trend = 'unknown';
    if (recentProps.length > 0 && olderProps.length > 0) {
      const recentAvg = recentProps.reduce((sum, p) => {
        const priceInCr = p.price_unit === 'crores' ? p.price : p.price / 100;
        return sum + priceInCr;
      }, 0) / recentProps.length;
      
      const olderAvg = olderProps.reduce((sum, p) => {
        const priceInCr = p.price_unit === 'crores' ? p.price : p.price / 100;
        return sum + priceInCr;
      }, 0) / olderProps.length;
      
      const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (diff > 5) price_trend = 'rising';
      else if (diff < -5) price_trend = 'falling';
      else price_trend = 'stable';
    }
    
    // Count recent inquiries (last 30 days)
    const inquiries_30d = recentProps.reduce((sum, p) => sum + (p.inquiries_count || 0), 0);
    
    // Update building stats
    await base44.asServiceRole.entities.Building.update(building_id, {
      stats: {
        active_listings: activeProperties.length,
        avg_price_2bhk: avg_2bhk ? Math.round(avg_2bhk * 100) / 100 : null,
        avg_price_3bhk: avg_3bhk ? Math.round(avg_3bhk * 100) / 100 : null,
        avg_price_unit: 'crores',
        price_trend: price_trend,
        demand_score: Math.round(demand_score * 100) / 100
      },
      last_intelligence_update: new Date().toISOString()
    });
    
    return Response.json({
      building_id: building_id,
      building_name: building.name,
      location: building.location,
      active_listings: activeProperties.length,
      total_listings: buildingProperties.length,
      avg_price_2bhk: avg_2bhk,
      avg_price_3bhk: avg_3bhk,
      avg_price_unit: 'crores',
      avg_price_per_sqft: avg_price_per_sqft ? Math.round(avg_price_per_sqft) : null,
      demand_score: Math.round(demand_score * 100) / 100,
      price_trend: price_trend,
      inquiries_30d: inquiries_30d,
      stats_calculated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('getBuildingStats error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});