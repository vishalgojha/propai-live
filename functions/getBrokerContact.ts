import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { property_id } = await req.json();

    if (!property_id) {
      return Response.json({ error: 'property_id required' }, { status: 400 });
    }

    // Fetch the property
    const properties = await base44.entities.Property.filter({ id: property_id });
    const property = properties[0];

    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    // If broker_contact already exists and is valid, return it
    if (property.broker_contact) {
      return Response.json({ 
        contact: property.broker_contact,
        source: 'cached'
      });
    }

    // Otherwise, fetch from Broker entity
    if (!property.broker_id) {
      return Response.json({ 
        error: 'No broker linked to this property',
        contact: null 
      }, { status: 404 });
    }

    const brokers = await base44.asServiceRole.entities.Broker.filter({ id: property.broker_id });
    const broker = brokers[0];

    if (!broker || !broker.phone) {
      return Response.json({ 
        error: 'Broker contact not found',
        contact: null 
      }, { status: 404 });
    }

    // Backfill the property's broker_contact field for future use
    await base44.asServiceRole.entities.Property.update(property_id, {
      broker_contact: broker.phone,
      broker_name: broker.name
    });

    return Response.json({ 
      contact: broker.phone,
      broker_name: broker.name,
      source: 'fetched_and_cached'
    });

  } catch (error) {
    console.error('Error fetching broker contact:', error);
    return Response.json({ 
      error: error.message,
      contact: null 
    }, { status: 500 });
  }
});