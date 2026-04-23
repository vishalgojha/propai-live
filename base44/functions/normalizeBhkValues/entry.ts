import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * NORMALIZE BHK VALUES ACROSS ALL PROPERTIES
 * 
 * Standardizes inconsistent BHK values to proper format:
 * - "1 BHK", "2 BHK", "3 BHK", "4 BHK", etc.
 * - "1.5 BHK", "2.5 BHK", "3.5 BHK", "4.5 BHK"
 * - "2 BHK + 2 BHK Jodi"
 * - "4+ BHK"
 * - "3 BHK Duplex"
 * - Commercial: "Office Space", "Commercial Shop", "Commercial Space", "Studio"
 */

// BHK normalization map
const BHK_NORMALIZATION = {
  // 1 BHK variations
  '1bhk': '1 BHK',
  '1 bhk': '1 BHK',
  '1Bhk': '1 BHK',
  '1BHK': '1 BHK',
  
  // 1.5 BHK variations
  '1.5bhk': '1.5 BHK',
  '1.5 bhk': '1.5 BHK',
  '1.5BHK': '1.5 BHK',
  
  // 2 BHK variations
  '2bhk': '2 BHK',
  '2 bhk': '2 BHK',
  '2Bhk': '2 BHK',
  '2BHK': '2 BHK',
  
  // 2.5 BHK variations
  '2.5bhk': '2.5 BHK',
  '2.5 bhk': '2.5 BHK',
  '2.5BHK': '2.5 BHK',
  
  // 3 BHK variations
  '3bhk': '3 BHK',
  '3 bhk': '3 BHK',
  '3Bhk': '3 BHK',
  '3BHK': '3 BHK',
  
  // 3.5 BHK variations
  '3.5bhk': '3.5 BHK',
  '3.5 bhk': '3.5 BHK',
  '3.5BHK': '3.5 BHK',
  
  // 4 BHK variations
  '4bhk': '4 BHK',
  '4 bhk': '4 BHK',
  '4Bhk': '4 BHK',
  '4BHK': '4 BHK',
  
  // 4.5 BHK variations
  '4.5bhk': '4.5 BHK',
  '4.5 bhk': '4.5 BHK',
  '4.5BHK': '4.5 BHK',
  
  // 5 BHK variations
  '5bhk': '5 BHK',
  '5 bhk': '5 BHK',
  '5BHK': '5 BHK',
  
  // 6 BHK variations
  '6bhk': '6 BHK',
  '6 bhk': '6 BHK',
  '6BHK': '6 BHK',
  
  // Jodi variations
  '2Bhk + 2Bhk Jodi': '2 BHK + 2 BHK Jodi',
  '2bhk + 2bhk jodi': '2 BHK + 2 BHK Jodi',
  
  // Duplex variations
  '3BHK /Duplex flat': '3 BHK Duplex',
  '3bhk duplex': '3 BHK Duplex',
  '4bhk duplex': '4 BHK Duplex',
  
  // Mixed variations (choose larger)
  '4bhk / 3bhk': '4 BHK',
  
  // 4+ variations
  '4+ bhk': '4+ BHK',
  '4+bhk': '4+ BHK',
  
  // Commercial
  'commercial office': 'Office Space',
  'COMMERCIAL OFFICE': 'Office Space',
  'office': 'Office Space',
  'Office': 'Office Space',
  'commercial shop': 'Commercial Shop',
  'commercial space': 'Commercial Space',
  'studio': 'Studio',
  'Studio': 'Studio'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized - admin access required' 
      }, { status: 401 });
    }

    const { dryRun = false } = await req.json().catch(() => ({ dryRun: false }));

    console.log(`🔧 Starting BHK normalization (${dryRun ? 'DRY RUN' : 'LIVE RUN'})...`);

    // Fetch all properties
    const allProperties = await base44.asServiceRole.entities.Property.list();
    console.log(`📊 Found ${allProperties.length} total properties`);

    const updates = [];
    const stats = {
      total: allProperties.length,
      normalized: 0,
      unchanged: 0,
      errors: 0
    };

    for (const property of allProperties) {
      const originalBhk = property.bhk;
      if (!originalBhk) {
        stats.unchanged++;
        continue;
      }

      let normalizedBhk = originalBhk;

      // Check direct mapping first
      if (BHK_NORMALIZATION[originalBhk]) {
        normalizedBhk = BHK_NORMALIZATION[originalBhk];
      } else {
        // Try case-insensitive match
        const lowerBhk = originalBhk.toLowerCase().trim();
        const mappingKey = Object.keys(BHK_NORMALIZATION).find(key => 
          key.toLowerCase() === lowerBhk
        );
        
        if (mappingKey) {
          normalizedBhk = BHK_NORMALIZATION[mappingKey];
        } else {
          // Try to extract number and standardize format
          const numberMatch = originalBhk.match(/(\d+\.?\d*)/);
          if (numberMatch) {
            const number = numberMatch[1];
            
            // Check for special keywords
            if (/jodi/i.test(originalBhk)) {
              normalizedBhk = `${number} BHK + ${number} BHK Jodi`;
            } else if (/duplex/i.test(originalBhk)) {
              normalizedBhk = `${number} BHK Duplex`;
            } else if (/\+/.test(originalBhk)) {
              normalizedBhk = `${number}+ BHK`;
            } else if (/study/i.test(originalBhk)) {
              normalizedBhk = `${number} BHK + Study`;
            } else {
              normalizedBhk = `${number} BHK`;
            }
          }
        }
      }

      // Check if changed
      if (normalizedBhk !== originalBhk) {
        updates.push({
          id: property.id,
          custom_id: property.custom_id,
          original: originalBhk,
          normalized: normalizedBhk
        });

        if (!dryRun) {
          try {
            await base44.asServiceRole.entities.Property.update(property.id, {
              bhk: normalizedBhk
            });
            stats.normalized++;
            console.log(`✓ ${property.custom_id}: "${originalBhk}" → "${normalizedBhk}"`);
          } catch (error) {
            stats.errors++;
            console.error(`✗ ${property.custom_id}: ${error.message}`);
          }
        } else {
          stats.normalized++;
        }
      } else {
        stats.unchanged++;
      }
    }

    console.log(`✅ BHK normalization complete!`);
    console.log(`📊 Normalized: ${stats.normalized}, Unchanged: ${stats.unchanged}, Errors: ${stats.errors}`);

    return Response.json({
      success: true,
      dry_run: dryRun,
      stats: stats,
      updates: updates.slice(0, 50), // Return first 50 examples
      total_updates: updates.length,
      message: dryRun 
        ? `DRY RUN: Would normalize ${updates.length} properties` 
        : `Successfully normalized ${stats.normalized} properties`
    });

  } catch (error) {
    console.error('❌ BHK normalization failed:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});