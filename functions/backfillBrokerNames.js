import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Backfills missing broker_name on all properties
 * Reads from Broker entity and caches the name on Property entity
 * 
 * Usage: 
 * - dry_run mode: analyze what needs updating
 * - live mode: actually update the properties
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'dry_run'; // 'dry_run' or 'live'

    console.log(`🔄 Backfill Broker Names - Mode: ${mode}`);

    // Fetch all properties and brokers using service role
    const properties = await base44.asServiceRole.entities.Property.list();
    const brokers = await base44.asServiceRole.entities.Broker.list();

    // Create broker lookup map
    const brokerMap = {};
    brokers.forEach(broker => {
      brokerMap[broker.id] = broker.name;
    });

    // Track statistics
    const stats = {
      total_properties: properties.length,
      properties_with_broker_id: 0,
      missing_broker_name: 0,
      broker_not_found: 0,
      updated: 0,
      unchanged: 0,
      errors: 0
    };

    const updates = [];
    const errors = [];

    // Process each property
    for (const property of properties) {
      try {
        // Skip if no broker_id
        if (!property.broker_id) {
          continue;
        }

        stats.properties_with_broker_id++;

        // Check if broker_name is missing or empty
        const needsUpdate = !property.broker_name || property.broker_name.trim() === '';

        if (!needsUpdate) {
          stats.unchanged++;
          continue;
        }

        stats.missing_broker_name++;

        // Look up broker name
        const brokerName = brokerMap[property.broker_id];

        if (!brokerName) {
          stats.broker_not_found++;
          errors.push({
            property_id: property.id,
            custom_id: property.custom_id,
            broker_id: property.broker_id,
            error: 'Broker not found'
          });
          continue;
        }

        // Prepare update
        updates.push({
          property_id: property.id,
          custom_id: property.custom_id,
          broker_id: property.broker_id,
          broker_name: brokerName
        });

        // In live mode, actually update the property
        if (mode === 'live') {
          await base44.asServiceRole.entities.Property.update(property.id, {
            broker_name: brokerName
          });
          stats.updated++;
        }

      } catch (error) {
        stats.errors++;
        errors.push({
          property_id: property.id,
          custom_id: property.custom_id,
          error: error.message
        });
      }
    }

    // Summary
    const summary = {
      mode,
      ...stats,
      ...(mode === 'dry_run' && { 
        will_update: updates.length,
        sample_updates: updates.slice(0, 10)
      })
    };

    if (errors.length > 0) {
      summary.sample_errors = errors.slice(0, 5);
    }

    console.log('✅ Backfill Complete:', summary);

    return Response.json({
      success: true,
      summary,
      ...(mode === 'dry_run' && { 
        message: `Found ${updates.length} properties needing broker_name. Run with mode: 'live' to update.` 
      }),
      ...(mode === 'live' && { 
        message: `Successfully updated ${stats.updated} properties with broker names` 
      })
    });

  } catch (error) {
    console.error('❌ Backfill Error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});