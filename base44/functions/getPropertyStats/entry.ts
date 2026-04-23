import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all active properties
    const properties = await base44.entities.Property.filter({ status: 'Active' });

    // Calculate stats
    const stats = {
      total: properties.length,
      residential: properties.filter(p => p.property_category === 'Residential').length,
      commercial: properties.filter(p => p.property_category === 'Commercial').length,
      rent: properties.filter(p => p.listing_type === 'Rent').length,
      sale: properties.filter(p => p.listing_type === 'Sale').length,
      lease: properties.filter(p => p.listing_type === 'Lease').length,
      today: properties.filter(p => {
        const created = new Date(p.created_date);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length
    };

    // Top locations
    const locationCounts = {};
    properties.forEach(p => {
      if (p.location) {
        locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
      }
    });
    
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));

    return Response.json({
      stats,
      topLocations
    });

  } catch (error) {
    console.error('Stats error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});