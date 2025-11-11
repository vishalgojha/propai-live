import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * COMPREHENSIVE DATA CLEANUP FUNCTION
 * 
 * Fixes common data quality issues:
 * 1. Missing custom_ids
 * 2. Missing slugs
 * 3. Incorrect price units
 * 4. Unnormalized locations
 * 5. Unnormalized BHK values
 * 6. Unnormalized parking values
 * 7. Missing broker_name cache
 * 8. Missing broker_contact cache
 * 
 * Modes:
 * - dry_run: Analyze and report issues without making changes
 * - fix: Actually fix the issues
 */

// Location codes for custom IDs
const LOCATION_CODES = {
  'bandra west': 'BND', 'bandra east': 'BND', 'bandra': 'BND',
  'khar west': 'KHR', 'khar east': 'KHR', 'khar': 'KHR',
  'santacruz west': 'SNT', 'santacruz east': 'SNT', 'santacruz': 'SNT',
  'juhu': 'JUH', 'pali hill': 'PNL', 'carter road': 'CTR',
  'andheri west': 'AND', 'andheri east': 'AND', 'andheri': 'AND',
  'versova': 'VRS', 'worli': 'WRL', 'lower parel': 'LPR',
  'dadar': 'DDR', 'mahim': 'MHM', 'prabhadevi': 'PRB',
  'bandra kurla complex': 'BKC', 'bkc': 'BKC', 'powai': 'POW',
  'goregaon': 'GOR', 'malad': 'MLD', 'borivali': 'BOR',
  'kandivali': 'KND', 'chembur': 'CHM', 'mumbai': 'MUM'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check authorization
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { mode = 'dry_run' } = await req.json();

    console.log(`🔍 Running data cleanup in ${mode} mode...`);

    // Fetch all data
    const properties = await base44.asServiceRole.entities.Property.list();
    const brokers = await base44.asServiceRole.entities.Broker.list();

    const issues = {
      missing_custom_id: 0,
      missing_slug: 0,
      incorrect_price_unit: 0,
      unnormalized_location: 0,
      unnormalized_bhk: 0,
      unnormalized_parking: 0,
      missing_broker_name: 0,
      missing_broker_contact: 0,
    };

    const fixes = [];

    // ISSUE 1: Missing custom_id
    for (const property of properties) {
      if (!property.custom_id) {
        issues.missing_custom_id++;
        
        if (mode === 'fix') {
          const locationCode = LOCATION_CODES[property.location?.toLowerCase()] || 'MUM';
          const idHash = property.id.slice(-8);
          const sequence = parseInt(idHash, 16) % 10000;
          const customId = `CHT-${locationCode}-${String(sequence).padStart(4, '0')}`;
          
          fixes.push({
            type: 'custom_id',
            property_id: property.id,
            update: { custom_id: customId }
          });
        }
      }
    }

    // ISSUE 2: Missing slug
    for (const property of properties) {
      if (!property.slug) {
        issues.missing_slug++;
        
        if (mode === 'fix') {
          let slugParts = [];
          if (property.bhk) slugParts.push(property.bhk.toLowerCase().replace(/\s+/g, ''));
          if (property.building_name) {
            slugParts.push(property.building_name
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 30));
          }
          if (property.location) {
            slugParts.push(property.location
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .replace(/\s+/g, '-'));
          }
          
          let slug = slugParts.join('-').substring(0, 60).replace(/-+$/, '');
          
          // Check for duplicates
          const existingWithSlug = properties.find(p => p.slug === slug && p.id !== property.id);
          if (existingWithSlug) {
            const idHash = property.id.slice(-4);
            slug = `${slug}-${idHash}`;
          }
          
          fixes.push({
            type: 'slug',
            property_id: property.id,
            update: { slug }
          });
        }
      }
    }

    // ISSUE 3: Incorrect price units (e.g., Rent in crores instead of lakhs)
    for (const property of properties) {
      let needsFixing = false;
      let newPriceUnit = property.price_unit;
      let newPrice = property.price;

      // For Rent/Lease: Should be in lakhs
      if ((property.listing_type === 'Rent' || property.listing_type === 'Lease') && property.price_unit === 'crores') {
        needsFixing = true;
        newPriceUnit = 'lakhs';
        newPrice = property.price * 100; // Convert crores to lakhs
      }

      // For Sale/Pre Leased: Should be in crores (if >= 1 crore)
      if ((property.listing_type === 'Sale' || property.listing_type === 'Pre Leased') && property.price_unit === 'lakhs' && property.price >= 100) {
        needsFixing = true;
        newPriceUnit = 'crores';
        newPrice = property.price / 100; // Convert lakhs to crores
      }

      if (needsFixing) {
        issues.incorrect_price_unit++;
        
        if (mode === 'fix') {
          fixes.push({
            type: 'price_unit',
            property_id: property.id,
            update: { 
              price: newPrice,
              price_unit: newPriceUnit 
            }
          });
        }
      }
    }

    // ISSUE 4: Unnormalized locations
    const locationMapping = {
      'bandra': 'Bandra West',
      'khar': 'Khar West',
      'santacruz': 'Santacruz West',
      'andheri': 'Andheri West',
    };

    for (const property of properties) {
      const normalizedLocation = locationMapping[property.location?.toLowerCase()];
      if (normalizedLocation && property.location !== normalizedLocation) {
        issues.unnormalized_location++;
        
        if (mode === 'fix') {
          fixes.push({
            type: 'location',
            property_id: property.id,
            update: { location: normalizedLocation }
          });
        }
      }
    }

    // ISSUE 5: Unnormalized BHK values
    for (const property of properties) {
      if (property.bhk) {
        const normalized = property.bhk
          .replace(/bhk/gi, 'BHK')
          .replace(/\s*bhk\s*/gi, ' BHK ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (normalized !== property.bhk) {
          issues.unnormalized_bhk++;
          
          if (mode === 'fix') {
            fixes.push({
              type: 'bhk',
              property_id: property.id,
              update: { bhk: normalized }
            });
          }
        }
      }
    }

    // ISSUE 6: Unnormalized parking values
    for (const property of properties) {
      if (property.parking) {
        const parking = property.parking.trim();
        let normalized = parking;

        // Normalize common patterns
        if (/^\d+\s*cp$/i.test(parking)) {
          const num = parking.match(/\d+/)[0];
          normalized = `${num} Covered`;
        } else if (/^\d+\s*op$/i.test(parking)) {
          const num = parking.match(/\d+/)[0];
          normalized = `${num} Open`;
        } else if (/^no\s*parking$/i.test(parking)) {
          normalized = 'No Parking';
        }

        if (normalized !== property.parking) {
          issues.unnormalized_parking++;
          
          if (mode === 'fix') {
            fixes.push({
              type: 'parking',
              property_id: property.id,
              update: { parking: normalized }
            });
          }
        }
      }
    }

    // ISSUE 7 & 8: Missing broker_name and broker_contact cache
    for (const property of properties) {
      if (property.broker_id) {
        const broker = brokers.find(b => b.id === property.broker_id);
        
        if (broker) {
          if (!property.broker_name && broker.name) {
            issues.missing_broker_name++;
            
            if (mode === 'fix') {
              fixes.push({
                type: 'broker_name',
                property_id: property.id,
                update: { broker_name: broker.name }
              });
            }
          }

          if (!property.broker_contact && broker.phone) {
            issues.missing_broker_contact++;
            
            if (mode === 'fix') {
              fixes.push({
                type: 'broker_contact',
                property_id: property.id,
                update: { broker_contact: broker.phone }
              });
            }
          }
        }
      }
    }

    // Apply fixes if in fix mode
    let fixed = 0;
    let errors = 0;

    if (mode === 'fix' && fixes.length > 0) {
      console.log(`🔧 Applying ${fixes.length} fixes...`);
      
      for (const fix of fixes) {
        try {
          await base44.asServiceRole.entities.Property.update(fix.property_id, fix.update);
          fixed++;
        } catch (error) {
          console.error(`Failed to fix ${fix.property_id}:`, error.message);
          errors++;
        }
      }
      
      console.log(`✅ Fixed ${fixed} issues (${errors} errors)`);
    }

    return Response.json({
      success: true,
      mode,
      issues,
      total_issues: Object.values(issues).reduce((sum, count) => sum + count, 0),
      fixes_applied: mode === 'fix' ? fixed : 0,
      errors: mode === 'fix' ? errors : 0,
      summary: mode === 'dry_run' 
        ? `Found ${Object.values(issues).reduce((sum, count) => sum + count, 0)} issues`
        : `Fixed ${fixed} issues (${errors} errors)`
    });

  } catch (error) {
    console.error('Data cleanup error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});