import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Building Intelligence System (BIS)
 * 
 * When triggered:
 * 1. Finds/creates Building entity (with custom_id)
 * 2. Analyzes all properties in that building
 * 3. Calculates market metrics (avg prices, trends, activity)
 * 4. Enriches with web data (developer, amenities, reputation)
 * 5. Returns full intelligence report
 */

const MUMBAI_GEO_TRUTH = {
  'bandra west': { canonical: 'Bandra West', pockets: ['Pali Hill', 'Carter Road', 'Hill Road'] },
  'bandra east': { canonical: 'Bandra East', pockets: ['Kalanagar', 'BKC'] },
  'khar west': { canonical: 'Khar West', pockets: ['Linking Road', 'Khar Danda'] },
  'santacruz west': { canonical: 'Santacruz West', pockets: ['SV Road'] },
  'juhu': { canonical: 'Juhu', pockets: ['Juhu Beach', 'JVPD'] },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_name, location } = await req.json();
    
    if (!building_name || !location) {
      return Response.json({ 
        error: 'building_name and location are required' 
      }, { status: 400 });
    }

    console.log(`🏗️ Building Intelligence for: ${building_name}, ${location}`);

    // 1. Check if building exists
    const buildings = await base44.asServiceRole.entities.Building.list();
    let building = buildings.find(b => 
      b.name.toLowerCase() === building_name.toLowerCase() &&
      b.location === location
    );

    // 2. If not exists, create with custom_id
    if (!building) {
      const buildingCount = buildings.length + 1;
      const buildingCustomId = `CHR-BLD-${String(buildingCount).padStart(4, '0')}`;

      building = await base44.asServiceRole.entities.Building.create({
        custom_id: buildingCustomId,
        name: building_name,
        location: location,
        verified: false
      });

      console.log(`✓ Created building ${buildingCustomId}: ${building_name}`);
    } else {
      console.log(`✓ Found existing building ${building.custom_id}: ${building_name}`);
    }

    // 3. Get all properties in this building
    const allProperties = await base44.asServiceRole.entities.Property.list();
    const buildingProperties = allProperties.filter(p => 
      p.building_id === building.id || 
      (p.building_name && p.building_name.toLowerCase() === building_name.toLowerCase() && p.location === location)
    );

    console.log(`Found ${buildingProperties.length} properties in ${building_name}`);

    // 4. Calculate market metrics
    const activeProperties = buildingProperties.filter(p => p.status === 'Active');
    const rentals = buildingProperties.filter(p => p.listing_type === 'Rent');
    const sales = buildingProperties.filter(p => p.listing_type === 'Sale');

    // Average prices by BHK
    const bhk2Rentals = rentals.filter(p => p.bhk?.includes('2'));
    const bhk3Rentals = rentals.filter(p => p.bhk?.includes('3'));
    const bhk2Sales = sales.filter(p => p.bhk?.includes('2'));
    const bhk3Sales = sales.filter(p => p.bhk?.includes('3'));

    const avg2BhkRent = bhk2Rentals.length > 0
      ? bhk2Rentals.reduce((sum, p) => sum + (p.price_unit === 'crores' ? p.price * 100 : p.price), 0) / bhk2Rentals.length
      : null;

    const avg3BhkRent = bhk3Rentals.length > 0
      ? bhk3Rentals.reduce((sum, p) => sum + (p.price_unit === 'crores' ? p.price * 100 : p.price), 0) / bhk3Rentals.length
      : null;

    const avg2BhkSale = bhk2Sales.length > 0
      ? bhk2Sales.reduce((sum, p) => sum + (p.price_unit === 'crores' ? p.price : p.price / 100), 0) / bhk2Sales.length
      : null;

    const avg3BhkSale = bhk3Sales.length > 0
      ? bhk3Sales.reduce((sum, p) => sum + (p.price_unit === 'crores' ? p.price : p.price / 100), 0) / bhk3Sales.length
      : null;

    // 5. Enrich with web data
    let webEnrichment = null;
    try {
      const enrichResponse = await base44.asServiceRole.functions.invoke('enrichBuildingFromWeb', {
        building_name,
        location
      });
      webEnrichment = enrichResponse.data;
    } catch (error) {
      console.error('Web enrichment failed:', error.message);
    }

    // 6. Update building with intelligence
    const intelligenceUpdate = {
      total_listings: buildingProperties.length,
      active_listings: activeProperties.length,
      avg_rent_2bhk: avg2BhkRent ? Math.round(avg2BhkRent) : null,
      avg_rent_3bhk: avg3BhkRent ? Math.round(avg3BhkRent) : null,
      avg_sale_2bhk: avg2BhkSale ? parseFloat(avg2BhkSale.toFixed(2)) : null,
      avg_sale_3bhk: avg3BhkSale ? parseFloat(avg3BhkSale.toFixed(2)) : null,
      last_intelligence_update: new Date().toISOString(),
      ...(webEnrichment || {})
    };

    await base44.asServiceRole.entities.Building.update(building.id, intelligenceUpdate);

    console.log(`✅ Building intelligence updated for ${building.custom_id}`);

    return Response.json({
      success: true,
      building: {
        id: building.id,
        custom_id: building.custom_id,
        name: building.name,
        location: building.location
      },
      intelligence: intelligenceUpdate,
      properties_analyzed: buildingProperties.length
    });

  } catch (error) {
    console.error('Building intelligence error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});