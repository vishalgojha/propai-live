import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BACKFILL BROKER CONTACTS
 * 
 * Syncs cached broker_contact on properties with latest normalized phone numbers from Broker table
 * 
 * This ensures WhatsApp buttons always use the correct, normalized phone numbers
 * 
 * Modes:
 * - dry_run: Analyze which properties need sync
 * - live: Actually update property records
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

    // Fetch all data
    const properties = await base44.asServiceRole.entities.Property.list();
    const brokers = await base44.asServiceRole.entities.Broker.list();

    // Create broker lookup map
    const brokerMap = {};
    brokers.forEach(broker => {
      brokerMap[broker.id] = broker;
    });

    let propertiesToUpdate = 0;
    let alreadyCorrect = 0;
    let noBrokerId = 0;
    let brokerNotFound = 0;
    const examples = [];
    const updates = [];

    // Check each property
    for (const property of properties) {
      if (!property.broker_id) {
        noBrokerId++;
        continue;
      }

      const broker = brokerMap[property.broker_id];
      
      if (!broker) {
        brokerNotFound++;
        continue;
      }

      // Compare cached contact with broker's current phone
      const cachedContact = property.broker_contact || '';
      const currentBrokerPhone = broker.phone || '';

      if (cachedContact !== currentBrokerPhone) {
        propertiesToUpdate++;
        
        updates.push({
          property_id: property.id,
          custom_id: property.custom_id,
          broker_name: broker.name,
          old_contact: cachedContact || 'missing',
          new_contact: currentBrokerPhone
        });

        // Store first 10 examples
        if (examples.length < 10) {
          examples.push({
            custom_id: property.custom_id || property.id.slice(0, 8),
            broker_name: broker.name,
            old_contact: cachedContact || 'missing',
            new_contact: currentBrokerPhone
          });
        }
      } else {
        alreadyCorrect++;
      }
    }

    const summary = {
      total_properties: properties.length,
      properties_to_update: propertiesToUpdate,
      already_correct: alreadyCorrect,
      no_broker_id: noBrokerId,
      broker_not_found: brokerNotFound
    };

    if (mode === 'dry_run') {
      return Response.json({
        success: true,
        mode: 'dry_run',
        summary,
        examples
      });
    }

    // LIVE MODE: Apply updates
    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    const errorDetails = [];

    for (const update of updates) {
      try {
        await base44.asServiceRole.entities.Property.update(update.property_id, {
          broker_contact: update.new_contact
        });
        updated++;
      } catch (error) {
        console.error(`Failed to update property ${update.property_id}:`, error.message);
        errors++;
        
        if (errorDetails.length < 20) {
          errorDetails.push({
            property_id: update.property_id,
            custom_id: update.custom_id,
            broker_name: update.broker_name,
            old_contact: update.old_contact,
            new_contact: update.new_contact,
            error: error.message
          });
        }
      }
    }

    unchanged = alreadyCorrect;

    return Response.json({
      success: errors < updated,
      mode: 'live',
      summary: {
        total_properties: properties.length,
        updated,
        unchanged,
        errors,
        no_broker_id: noBrokerId,
        broker_not_found: brokerNotFound
      },
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      message: errors === 0
        ? `✅ Successfully synced ${updated} broker contacts`
        : `⚠️ Synced ${updated} of ${propertiesToUpdate} contacts (${errors} errors)`
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