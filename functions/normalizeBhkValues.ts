import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BHK VALUE NORMALIZATION
 * 
 * Standardizes BHK formats:
 * - "1bhk" → "1 BHK"
 * - "2BHK" → "2 BHK"
 * - "3.5bhk" → "3.5 BHK"
 * - "studio" → "Studio"
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

    console.log(`🏠 Running BHK normalization (dryRun: ${dryRun})...`);

    const properties = await base44.asServiceRole.entities.Property.list();

    let normalized = 0;
    let unchanged = 0;
    let errors = 0;

    for (const property of properties) {
      if (!property.bhk) {
        unchanged++;
        continue;
      }

      // Normalize BHK value
      let normalizedBhk = property.bhk
        .replace(/bhk/gi, 'BHK')
        .replace(/\s*bhk\s*/gi, ' BHK ')
        .replace(/\s+/g, ' ')
        .trim();

      // Handle "studio" case
      if (normalizedBhk.toLowerCase() === 'studio') {
        normalizedBhk = 'Studio';
      }

      if (normalizedBhk === property.bhk) {
        unchanged++;
        continue;
      }

      normalized++;

      if (!dryRun) {
        try {
          await base44.asServiceRole.entities.Property.update(property.id, {
            bhk: normalizedBhk
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
        errors: dryRun ? 0 : errors
      }
    });

  } catch (error) {
    console.error('BHK normalization error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});