import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { broker_id, limit = 50 } = await req.json();

    if (!broker_id) {
      return Response.json({ error: 'broker_id required' }, { status: 400 });
    }

    // Fetch properties for this broker
    const properties = await base44.entities.Property.filter(
      { broker_id, status: 'Active' },
      '-created_date',
      limit
    );

    // Group by listing type
    const byType = {
      rent: properties.filter(p => p.listing_type === 'Rent'),
      sale: properties.filter(p => p.listing_type === 'Sale'),
      lease: properties.filter(p => p.listing_type === 'Lease')
    };

    return Response.json({
      total: properties.length,
      properties,
      byType,
      rent_count: byType.rent.length,
      sale_count: byType.sale.length,
      lease_count: byType.lease.length
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      properties: []
    }, { status: 500 });
  }
});