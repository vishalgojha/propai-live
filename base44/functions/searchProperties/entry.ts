import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { 
      bhk, 
      location, 
      min_price, 
      max_price, 
      listing_type,
      property_category,
      limit = 10 
    } = await req.json();

    // Build filter query
    const filter = { status: 'Active' };
    
    if (bhk) filter.bhk = bhk;
    if (location) filter.location = location;
    if (listing_type) filter.listing_type = listing_type;
    if (property_category) filter.property_category = property_category;

    // Fetch properties
    let properties = await base44.entities.Property.filter(filter, '-created_date', 100);

    // Price filtering (in-memory since it's complex)
    if (min_price || max_price) {
      properties = properties.filter(p => {
        const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
        if (min_price && priceInLakhs < min_price) return false;
        if (max_price && priceInLakhs > max_price) return false;
        return true;
      });
    }

    // Limit results
    const results = properties.slice(0, limit);

    return Response.json({
      count: properties.length,
      results,
      displayed: results.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ 
      error: error.message,
      count: 0,
      results: []
    }, { status: 500 });
  }
});