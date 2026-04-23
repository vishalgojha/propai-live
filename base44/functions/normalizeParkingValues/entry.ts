import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const { dryRun = true } = await req.json();

    // Fetch all properties
    const properties = await base44.asServiceRole.entities.Property.list();

    // Normalization function
    const normalizeParking = (parkingValue) => {
      if (!parkingValue) return 'Not Available';
      
      const original = parkingValue;
      let normalized = parkingValue.trim();
      
      // Convert to lowercase for matching
      const lower = normalized.toLowerCase();
      
      // Handle "No Parking" / "None" / "Not Available" cases
      if (
        lower === 'no parking' ||
        lower === 'none' ||
        lower === 'not available' ||
        lower === 'na' ||
        lower === 'n/a' ||
        lower === '0' ||
        lower === 'nil'
      ) {
        return 'No Parking';
      }
      
      // Extract covered parking: 1CP, 1 CP, 1cp, 1 covered, 1c, etc.
      const coveredMatch = normalized.match(/(\d+)\s*(?:cp|c|covered|cvd)/i);
      // Extract open parking: 1OP, 1 OP, 1op, 1 open, 1o, 1 uncovered, etc.
      const openMatch = normalized.match(/(\d+)\s*(?:op|o|open|uncovered|uncover|opn)/i);
      
      // Build normalized string
      const parts = [];
      
      if (coveredMatch) {
        const count = parseInt(coveredMatch[1]);
        parts.push(`${count} Covered`);
      }
      
      if (openMatch) {
        const count = parseInt(openMatch[1]);
        parts.push(`${count} Open`);
      }
      
      // If we found parking info, join it
      if (parts.length > 0) {
        return parts.join(' + ');
      }
      
      // Handle simple number cases (assume covered if not specified)
      const numberMatch = normalized.match(/^(\d+)$/);
      if (numberMatch) {
        const count = parseInt(numberMatch[1]);
        if (count === 0) return 'No Parking';
        return `${count} Covered`;
      }
      
      // Handle "1 Car Park", "2 Car Parks", etc.
      const carParkMatch = normalized.match(/(\d+)\s*(?:car\s*park)/i);
      if (carParkMatch) {
        const count = parseInt(carParkMatch[1]);
        return `${count} Covered`;
      }
      
      // Handle "1 Parking", "2 Parkings", etc.
      const parkingMatch = normalized.match(/(\d+)\s*parking/i);
      if (parkingMatch) {
        const count = parseInt(parkingMatch[1]);
        return `${count} Covered`;
      }
      
      // If we couldn't normalize, return as-is
      return original;
    };

    // Process properties
    const updates = [];
    const unchanged = [];
    const examples = []; // Track examples of changes for reporting

    for (const property of properties) {
      const original = property.parking;
      const normalized = normalizeParking(original);
      
      if (original !== normalized) {
        updates.push({
          id: property.id,
          original,
          normalized
        });
        
        // Keep first 10 examples for reporting
        if (examples.length < 10) {
          examples.push({
            property_id: property.custom_id || property.id,
            location: property.location,
            original,
            normalized
          });
        }
      } else {
        unchanged.push(property.id);
      }
    }

    // Dry run - just return statistics
    if (dryRun) {
      return Response.json({
        success: true,
        mode: 'dry_run',
        stats: {
          total: properties.length,
          normalized: updates.length,
          unchanged: unchanged.length,
          examples: examples
        },
        message: `Found ${updates.length} parking values to normalize out of ${properties.length} properties`
      });
    }

    // Live mode - apply updates
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const update of updates) {
      try {
        await base44.asServiceRole.entities.Property.update(update.id, {
          parking: update.normalized
        });
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          property_id: update.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      mode: 'live',
      stats: {
        total: properties.length,
        normalized: successCount,
        unchanged: unchanged.length,
        errors: errorCount
      },
      examples: examples.slice(0, 5), // Show first 5 examples
      error_details: errors.slice(0, 5), // Show first 5 errors if any
      message: `Successfully normalized ${successCount} parking values. ${errorCount} errors.`
    });

  } catch (error) {
    console.error('Error normalizing parking values:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to normalize parking values'
    }, { status: 500 });
  }
});