import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ ROBUST Data Cleanup - Micro-batch processing
 * Processes 10 properties at a time to avoid timeouts
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mode = 'dry_run', skip = 0, limit = 10 } = body;

    // Fetch properties with pagination
    const properties = await base44.asServiceRole.entities.Property.list('-created_date');
    
    // Get current batch
    const currentBatch = properties.slice(skip, skip + limit);
    
    if (currentBatch.length === 0) {
      return Response.json({
        success: true,
        done: true,
        mode,
        progress: {
          processed: skip,
          total: properties.length,
          remaining: 0
        },
        message: '✅ Data cleanup complete!'
      });
    }

    const issues = {
      missing_custom_id: 0,
      missing_building_id: 0,
      missing_broker_id: 0,
      invalid_price: 0,
      invalid_bhk: 0
    };

    const fixes = [];

    for (const property of currentBatch) {
      const propertyFixes = {};

      // Check custom_id
      if (!property.custom_id) {
        issues.missing_custom_id++;
        if (mode === 'fix') {
          propertyFixes.custom_id = `CHR-PROP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        }
      }

      // Check building_id
      if (!property.building_id && property.building_name) {
        issues.missing_building_id++;
      }

      // Check broker_id
      if (!property.broker_id) {
        issues.missing_broker_id++;
      }

      // Check price
      if (!property.price || property.price <= 0) {
        issues.invalid_price++;
      }

      // Check BHK
      if (!property.bhk || property.bhk.trim() === '') {
        issues.invalid_bhk++;
      }

      // Apply fixes if in fix mode
      if (mode === 'fix' && Object.keys(propertyFixes).length > 0) {
        try {
          await base44.asServiceRole.entities.Property.update(property.id, propertyFixes);
          fixes.push({ property_id: property.id, fixes: propertyFixes });
        } catch (error) {
          console.error(`Failed to fix property ${property.id}:`, error);
        }
      }
    }

    const processed = skip + currentBatch.length;
    const remaining = properties.length - processed;
    const percentage = Math.round((processed / properties.length) * 100);

    return Response.json({
      success: true,
      done: remaining === 0,
      mode,
      progress: {
        processed,
        total: properties.length,
        remaining: Math.max(0, remaining),
        percentage,
        current_batch: currentBatch.length
      },
      issues,
      fixes: mode === 'fix' ? fixes : undefined,
      next_skip: remaining > 0 ? processed : null,
      message: remaining > 0 
        ? `Scanned ${processed}/${properties.length} (${percentage}%)`
        : `✅ Cleanup complete!`
    });

  } catch (error) {
    console.error('Data cleanup error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});