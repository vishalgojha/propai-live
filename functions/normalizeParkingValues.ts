import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * PARKING VALUE NORMALIZATION
 * 
 * Standardizes parking formats:
 * - "1CP" → "1 Covered"
 * - "2 cp" → "2 Covered"
 * - "1OP" → "1 Open"
 * - "No parking" → "No Parking"
 * 
 * Modes:
 * - dryRun: true → Analyze
 * - dryRun: false → Fix
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

    const { dryRun = true } = await req.json();

    console.log(`🚗 Running parking normalization (dryRun: ${dryRun})...`);

    const properties = await base44.asServiceRole.entities.Property.list();

    let normalized = 0;
    let unchanged = 0;
    let errors = 0;
    const examples = [];

    for (const property of properties) {
      if (!property.parking) {
        unchanged++;
        continue;
      }

      const original = property.parking;
      let normalizedParking = original.trim();

      // Pattern: "1CP", "2 cp", "3 CP" → "N Covered"
      if (/^\d+\s*cp$/i.test(normalizedParking)) {
        const num = normalizedParking.match(/\d+/)[0];
        normalizedParking = `${num} Covered`;
      }
      // Pattern: "1OP", "2 op", "3 OP" → "N Open"
      else if (/^\d+\s*op$/i.test(normalizedParking)) {
        const num = normalizedParking.match(/\d+/)[0];
        normalizedParking = `${num} Open`;
      }
      // Pattern: "no parking", "No Parking", "NO PARKING" → "No Parking"
      else if (/^no\s*parking$/i.test(normalizedParking)) {
        normalizedParking = 'No Parking';
      }
      // Pattern: "car park", "Car Park" → "Car Parking"
      else if (/^car\s*park$/i.test(normalizedParking)) {
        normalizedParking = 'Car Parking';
      }

      if (normalizedParking === original) {
        unchanged++;
        continue;
      }

      normalized++;

      // Collect examples for dry run
      if (dryRun && examples.length < 5) {
        examples.push({
          original,
          normalized: normalizedParking
        });
      }

      if (!dryRun) {
        try {
          await base44.asServiceRole.entities.Property.update(property.id, {
            parking: normalizedParking
          });
        } catch (error) {
          console.error(`Failed to update property ${property.id}:`, error);
          errors++;
        }
      }
    }

    return Response.json({
      success: true,
      mode: dryRun ? 'dry_run' : 'live',
      stats: {
        total: properties.length,
        normalized,
        unchanged,
        errors: dryRun ? 0 : errors,
        examples: dryRun ? examples : undefined
      }
    });

  } catch (error) {
    console.error('Parking normalization error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});