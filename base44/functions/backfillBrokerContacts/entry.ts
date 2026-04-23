import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode = 'dry_run' } = await req.json();

    // Fetch all brokers and properties
    const brokers = await base44.asServiceRole.entities.Broker.list();
    const properties = await base44.asServiceRole.entities.Property.list();

    // Create broker phone lookup
    const brokerPhoneMap = {};
    brokers.forEach(broker => {
      if (broker.id && broker.phone) {
        brokerPhoneMap[broker.id] = broker.phone;
      }
    });

    // Find properties with outdated broker_contact
    const toUpdate = [];
    properties.forEach(prop => {
      if (!prop.broker_id) return;
      
      const correctPhone = brokerPhoneMap[prop.broker_id];
      if (!correctPhone) return;
      
      // Check if broker_contact is outdated or missing
      if (prop.broker_contact !== correctPhone) {
        toUpdate.push({
          id: prop.id,
          custom_id: prop.custom_id,
          old_contact: prop.broker_contact || 'missing',
          new_contact: correctPhone,
          broker_name: prop.broker_name
        });
      }
    });

    // Dry run - just report
    if (mode === 'dry_run') {
      return Response.json({
        mode: 'dry_run',
        summary: {
          total_properties: properties.length,
          properties_to_update: toUpdate.length,
          already_correct: properties.length - toUpdate.length
        },
        examples: toUpdate.slice(0, 10),
        message: toUpdate.length > 0 
          ? `Found ${toUpdate.length} properties with outdated broker_contact. Run in 'live' mode to fix.`
          : 'All broker contacts are up to date!'
      });
    }

    // Live mode - update properties
    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    for (const item of toUpdate) {
      try {
        await base44.asServiceRole.entities.Property.update(item.id, {
          broker_contact: item.new_contact
        });
        updated++;
      } catch (error) {
        errors++;
        errorDetails.push({
          property_id: item.id,
          error: error.message
        });
      }
    }

    return Response.json({
      mode: 'live',
      summary: {
        total_properties: properties.length,
        updated,
        unchanged: properties.length - toUpdate.length,
        errors
      },
      error_details: errorDetails.slice(0, 5),
      message: `✅ Updated ${updated} properties. ${errors > 0 ? `⚠️ ${errors} errors.` : ''}`
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});