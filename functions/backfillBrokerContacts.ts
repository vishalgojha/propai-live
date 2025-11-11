import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BACKFILL BROKER CONTACTS
 * 
 * Syncs cached broker_contact on properties with the latest normalized
 * phone numbers from the Broker entity.
 * 
 * Modes:
 * - dry_run: Analyze what needs syncing
 * - live: Apply the updates
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { mode = 'dry_run' } = await req.json();

    console.log(`📞 Running broker contact sync in ${mode} mode...`);

    // Fetch all properties and brokers
    const properties = await base44.asServiceRole.entities.Property.list();
    const brokers = await base44.asServiceRole.entities.Broker.list();

    // Create broker lookup map
    const brokerMap = {};
    brokers.forEach(broker => {
      brokerMap[broker.id] = broker.phone;
    });

    // Find properties needing contact sync
    const needsUpdate = [];
    const propertiesWithBrokerId = properties.filter(p => p.broker_id);

    for (const property of propertiesWithBrokerId) {
      const correctPhone = brokerMap[property.broker_id];
      
      if (!correctPhone) continue;

      // Check if broker_contact is missing or different
      if (property.broker_contact !== correctPhone) {
        needsUpdate.push({
          property_id: property.id,
          custom_id: property.custom_id,
          broker_name: property.broker_name,
          old_contact: property.broker_contact,
          new_contact: correctPhone
        });
      }
    }

    console.log(`Found ${needsUpdate.length} properties needing contact sync`);

    const summary = {
      total_properties: properties.length,
      properties_with_broker_id: propertiesWithBrokerId.length,
      properties_to_update: needsUpdate.length,
      already_correct: propertiesWithBrokerId.length - needsUpdate.length
    };

    if (mode === 'dry_run') {
      return Response.json({
        success: true,
        mode: 'dry_run',
        summary,
        examples: needsUpdate.slice(0, 10)
      });
    }

    // LIVE MODE: Apply updates
    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (const item of needsUpdate) {
      try {
        await base44.asServiceRole.entities.Property.update(item.property_id, {
          broker_contact: item.new_contact
        });
        updated++;
        console.log(`✓ Updated ${item.custom_id}: ${item.old_contact || '(missing)'} → ${item.new_contact}`);
      } catch (error) {
        console.error(`Failed to update ${item.property_id}:`, error);
        errors++;
      }
    }

    unchanged = propertiesWithBrokerId.length - needsUpdate.length;

    return Response.json({
      success: true,
      mode: 'live',
      summary: {
        ...summary,
        updated,
        unchanged,
        errors
      }
    });

  } catch (error) {
    console.error('Broker contact sync error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});