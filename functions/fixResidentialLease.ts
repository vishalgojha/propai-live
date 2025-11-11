import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * FIX RESIDENTIAL LEASE → RENT CONVERSION
 * 
 * Converts all residential properties with listing_type="Lease" to "Rent"
 * Also normalizes prices to proper format (K/Lakhs/Crores)
 * 
 * Modes:
 * - dry_run: Show what will be fixed
 * - fix: Apply corrections
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

    console.log(`🔧 Running Residential Lease→Rent fix in ${mode} mode...`);

    const properties = await base44.asServiceRole.entities.Property.list();

    // Find all residential properties with "Lease" type
    const residentialLeases = properties.filter(p => 
      p.property_category === 'Residential' && 
      p.listing_type === 'Lease' &&
      p.status === 'Active'
    );

    console.log(`Found ${residentialLeases.length} residential properties marked as "Lease"`);

    // Also find properties needing price normalization
    const priceNormalizationNeeded = properties.filter(p => {
      if (p.status !== 'Active') return false;

      let needsNormalization = false;

      // Rent/Lease should be in lakhs
      if ((p.listing_type === 'Rent' || p.listing_type === 'Lease') && p.price_unit === 'crores') {
        needsNormalization = true;
      }

      // Sale should be in crores if >= 1 crore (100 lakhs)
      if (p.listing_type === 'Sale' && p.price_unit === 'lakhs' && p.price >= 100) {
        needsNormalization = true;
      }

      return needsNormalization;
    });

    console.log(`Found ${priceNormalizationNeeded.length} properties needing price normalization`);

    const analysis = {
      total_properties: properties.length,
      active_properties: properties.filter(p => p.status === 'Active').length,
      residential_leases_to_fix: residentialLeases.length,
      prices_to_normalize: priceNormalizationNeeded.length,
      examples: residentialLeases.slice(0, 5).map(p => ({
        custom_id: p.custom_id,
        bhk: p.bhk,
        location: p.location,
        price: `₹${p.price}${p.price_unit === 'crores' ? ' Cr' : 'L'}`,
        listing_type: p.listing_type,
        category: p.property_category
      }))
    };

    if (mode === 'dry_run') {
      return Response.json({
        success: true,
        mode: 'dry_run',
        analysis
      });
    }

    // FIX MODE: Apply corrections
    let fixedLeaseType = 0;
    let fixedPrices = 0;
    let errors = 0;

    // Fix 1: Convert Residential Lease → Rent
    for (const property of residentialLeases) {
      try {
        await base44.asServiceRole.entities.Property.update(property.id, {
          listing_type: 'Rent'
        });
        fixedLeaseType++;
        console.log(`✓ Fixed ${property.custom_id}: Lease → Rent`);
      } catch (error) {
        console.error(`Failed to fix ${property.id}:`, error);
        errors++;
      }
    }

    // Fix 2: Normalize prices
    for (const property of priceNormalizationNeeded) {
      try {
        let newPrice = property.price;
        let newPriceUnit = property.price_unit;

        if ((property.listing_type === 'Rent' || property.listing_type === 'Lease') && property.price_unit === 'crores') {
          // Convert crores to lakhs for rent
          newPrice = property.price * 100;
          newPriceUnit = 'lakhs';
        } else if (property.listing_type === 'Sale' && property.price_unit === 'lakhs' && property.price >= 100) {
          // Convert lakhs to crores for sale
          newPrice = property.price / 100;
          newPriceUnit = 'crores';
        }

        await base44.asServiceRole.entities.Property.update(property.id, {
          price: newPrice,
          price_unit: newPriceUnit
        });
        fixedPrices++;
        console.log(`✓ Normalized ${property.custom_id}: ₹${property.price}${property.price_unit === 'crores' ? 'Cr' : 'L'} → ₹${newPrice}${newPriceUnit === 'crores' ? 'Cr' : 'L'}`);
      } catch (error) {
        console.error(`Failed to normalize price for ${property.id}:`, error);
        errors++;
      }
    }

    return Response.json({
      success: true,
      mode: 'fix',
      results: {
        residential_lease_fixed: fixedLeaseType,
        prices_normalized: fixedPrices,
        total_fixed: fixedLeaseType + fixedPrices,
        errors
      }
    });

  } catch (error) {
    console.error('Fix Residential Lease error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});