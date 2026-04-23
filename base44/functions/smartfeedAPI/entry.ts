import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SmartFeed API - Public endpoint for property listings
 * For ChatGPT Custom GPT integration
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    
    // Parse query parameters
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const bhk = url.searchParams.get('bhk');
    const location = url.searchParams.get('location');
    const listingType = url.searchParams.get('listing_type');
    const propertyCategory = url.searchParams.get('property_category');
    const minPrice = url.searchParams.get('min_price');
    const maxPrice = url.searchParams.get('max_price');

    // Fetch all active properties
    let properties = await base44.asServiceRole.entities.Property.list('-created_date');
    
    // Filter active non-duplicate properties
    properties = properties.filter(p => p.status === 'Active' && !p.is_duplicate);

    // Apply filters
    if (bhk) {
      properties = properties.filter(p => p.bhk === bhk);
    }

    if (location) {
      const locationLower = location.toLowerCase();
      properties = properties.filter(p => 
        p.location?.toLowerCase().includes(locationLower)
      );
    }

    if (listingType) {
      properties = properties.filter(p => p.listing_type === listingType);
    }

    if (propertyCategory) {
      properties = properties.filter(p => p.property_category === propertyCategory);
    }

    if (minPrice || maxPrice) {
      properties = properties.filter(p => {
        const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
        if (minPrice && priceInLakhs < parseFloat(minPrice)) return false;
        if (maxPrice && priceInLakhs > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Limit results
    properties = properties.slice(0, limit);

    // Format response for ChatGPT
    const formattedProperties = properties.map(p => ({
      id: p.id,
      custom_id: p.custom_id,
      title: p.ai_title || `${p.bhk} in ${p.location}`,
      bhk: p.bhk,
      location: p.location,
      building: p.building_name,
      price: `₹${p.price} ${p.price_unit}`,
      listing_type: p.listing_type,
      category: p.property_category,
      furnishing: p.furnishing,
      carpet_area: p.carpet_area ? `${p.carpet_area} sq ft` : null,
      floor: p.floor,
      description: p.ai_description || p.description,
      broker_name: p.broker_name,
      broker_contact: p.broker_contact,
      url: `https://propai.live/property/${p.slug || p.id}`
    }));

    return Response.json({
      success: true,
      count: formattedProperties.length,
      total_active_properties: properties.length,
      properties: formattedProperties,
      api_info: {
        filters: {
          bhk: bhk || 'all',
          location: location || 'all',
          listing_type: listingType || 'all',
          property_category: propertyCategory || 'all'
        },
        available_filters: {
          bhk: ['1 BHK', '2 BHK', '3 BHK', '4 BHK'],
          listing_type: ['Sale', 'Rent'],
          property_category: ['Residential', 'Commercial']
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('SmartFeed API error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});