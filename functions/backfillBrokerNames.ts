import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BACKFILL BROKER NAMES
 * 
 * Caches broker names on properties for faster display on property cards.
 * Updates property.broker_name from the linked Broker entity.
 * 
 * Modes:
 * - dry_run: Analyze what needs updating
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

    console.log(`📛 Running broker name backfill in ${mode} mode...`);

    // Fetch all properties and brokers
    const properties = await base44.asServiceRole.entities.Property.list();
    const brokers = await base44.asServiceRole.entities.Broker.list();

    // Create broker lookup map
    const brokerMap = {};
    brokers.forEach(broker => {
      brokerMap[broker.id] = broker.name;
    });

    // Find properties needing broker names
    const needsUpdate = [];
    const propertiesWithBrokerId = properties.filter(p => p.broker_id);
    let brokerNotFound = 0;

    for (const property of propertiesWithBrokerId) {
      const brokerName = brokerMap[property.broker_id];
      
      if (!brokerName) {
        brokerNotFound++;
        continue;
      }

      // Check if broker_name is missing or different
      if (!property.broker_name || property.broker_name !== brokerName) {
        needsUpdate.push({
          property_id: property.id,
          custom_id: property.custom_id,
          current_broker_name: property.broker_name,
          correct_broker_name: brokerName
        });
      }
    }

    console.log(`Found ${needsUpdate.length} properties needing broker name cache`);

    const summary = {
      total_properties: properties.length,
      properties_with_broker_id: propertiesWithBrokerId.length,
      missing_broker_name: needsUpdate.length,
      broker_not_found: brokerNotFound
    };

    if (mode === 'dry_run') {
      return Response.json({
        success: true,
        mode: 'dry_run',
        summary,
        examples: needsUpdate.slice(0, 10).map(p => ({
          custom_id: p.custom_id,
          current: p.current_broker_name || '(missing)',
          correct: p.correct_broker_name
        }))
      });
    }

    // LIVE MODE: Apply updates
    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (const item of needsUpdate) {
      try {
        await base44.asServiceRole.entities.Property.update(item.property_id, {
          broker_name: item.correct_broker_name
        });
        updated++;
        console.log(`✓ Updated ${item.custom_id}: "${item.current_broker_name}" → "${item.correct_broker_name}"`);
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
    console.error('Broker name backfill error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});