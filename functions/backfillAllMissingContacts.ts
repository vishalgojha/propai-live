import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all active properties
    const properties = await base44.asServiceRole.entities.Property.filter({ status: 'Active' });

    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const property of properties) {
      // Skip if already has contact
      if (property.broker_contact) continue;

      // Skip if no broker_id
      if (!property.broker_id) {
        failed++;
        errors.push(`Property ${property.id} has no broker_id`);
        continue;
      }

      try {
        // Fetch broker
        const brokers = await base44.asServiceRole.entities.Broker.filter({ id: property.broker_id });
        const broker = brokers[0];

        if (!broker || !broker.phone) {
          failed++;
          errors.push(`Property ${property.id}: Broker ${property.broker_id} has no phone`);
          continue;
        }

        // Update property
        await base44.asServiceRole.entities.Property.update(property.id, {
          broker_contact: broker.phone,
          broker_name: broker.name
        });

        updated++;
      } catch (error) {
        failed++;
        errors.push(`Property ${property.id}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      total_properties: properties.length,
      updated,
      failed,
      errors: errors.slice(0, 20) // Return first 20 errors only
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});