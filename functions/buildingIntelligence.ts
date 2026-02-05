import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Building Intelligence System (BIS) with Auto-Enrichment
 * 
 * Automatically enriches building data when:
 * 1. New building is created from property parsing
 * 2. Building hasn't been enriched in last 30 days
 * 3. Building is missing key fields (developer, year_built, amenities)
 * 
 * Enrichment includes:
 * - Market metrics (avg prices, activity, trends)
 * - Web intelligence (developer, amenities, reputation)
 * - Auto-calculated stats from linked properties
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, building_name, location } = await req.json();
    
    // Must provide either building_id OR (building_name + location)
    if (!building_id && (!building_name || !location)) {
      return Response.json({ 
        error: 'Must provide either building_id OR (building_name + location)' 
      }, { status: 400 });
    }

    console.log('🏗️ Building Intelligence triggered...');

    // 1. Get or find building
    let building;
    
    if (building_id) {
      const buildings = await base44.asServiceRole.entities.Building.list();
      building = buildings.find(b => b.id === building_id);
      
      if (!building) {
        return Response.json({ 
          error: 'Building not found with provided ID' 
        }, { status: 404 });
      }
      
      console.log(`✓ Found building by ID: ${building.custom_id} - ${building.name}`);
    } else {
      // Find by name + location
      const buildings = await base44.asServiceRole.entities.Building.list();
      building = buildings.find(b => 
        b.name.toLowerCase() === building_name.toLowerCase() &&
        b.location === location
      );

      // Create if not exists
      if (!building) {
        const buildingCount = buildings.length + 1;
        const buildingCustomId = `CHR-BLD-${String(buildingCount).padStart(4, '0')}`;

        building = await base44.asServiceRole.entities.Building.create({
          custom_id: buildingCustomId,
          name: building_name,
          location: location,
          verified: false
        });

        console.log(`✓ Created new building ${buildingCustomId}: ${building_name}`);
      } else {
        console.log(`✓ Found existing building ${building.custom_id}: ${building.name}`);
      }
    }

    // 2. Check if enrichment is needed
    const needsEnrichment = shouldEnrichBuilding(building);
    
    if (!needsEnrichment.required) {
      console.log(`⏭️ Skipping enrichment: ${needsEnrichment.reason}`);
      
      // Still update basic stats even if we skip web enrichment
      await updateBasicStats(base44, building);
      
      return Response.json({
        success: true,
        skipped: true,
        reason: needsEnrichment.reason,
        building: {
          id: building.id,
          custom_id: building.custom_id,
          name: building.name,
          location: building.location
        }
      });
    }

    console.log(`✅ Enrichment required: ${needsEnrichment.reason}`);

    // 3. Get all properties in this building
    const allProperties = await base44.asServiceRole.entities.Property.list();
    const buildingProperties = allProperties.filter(p => 
      p.building_id === building.id || 
      (p.building_name && p.building_name.toLowerCase() === building.name.toLowerCase() && p.location === building.location)
    );

    console.log(`Found ${buildingProperties.length} properties in ${building.name}`);

    // 4. Calculate market metrics
    const marketMetrics = calculateMarketMetrics(buildingProperties);

    // 5. Enrich with web intelligence
    let webEnrichment = null;
    try {
      console.log('🌐 Fetching web intelligence...');
      const enrichResponse = await base44.asServiceRole.functions.invoke('enrichBuildingFromWeb', {
        building_name: building.name,
        location: building.location
      });
      
      if (enrichResponse.data?.success) {
        webEnrichment = enrichResponse.data.enrichment;
        console.log('✅ Web enrichment successful');
      }
    } catch (error) {
      console.warn('⚠️ Web enrichment failed (non-blocking):', error.message);
    }

    // 6. Prepare intelligence update
    const intelligenceUpdate = {
      // Market metrics
      total_listings: marketMetrics.totalListings,
      active_listings: marketMetrics.activeListings,
      avg_rent_2bhk: marketMetrics.avgRent2BHK,
      avg_rent_3bhk: marketMetrics.avgRent3BHK,
      avg_sale_2bhk: marketMetrics.avgSale2BHK,
      avg_sale_3bhk: marketMetrics.avgSale3BHK,
      market_activity: marketMetrics.activityLevel,
      
      // Web enrichment (if available)
      ...(webEnrichment ? {
        developer_name: webEnrichment.developer_name || building.developer_name,
        developer_reputation: webEnrichment.developer_reputation,
        year_built: webEnrichment.year_built || building.year_built,
        building_type: webEnrichment.building_type || building.building_type,
        total_floors: webEnrichment.total_floors || building.total_floors,
        amenities: webEnrichment.amenities?.length > 0 ? webEnrichment.amenities : building.amenities,
        vibe_keywords: webEnrichment.vibe_keywords || building.vibe_keywords,
        expat_friendly: webEnrichment.expat_friendly ?? building.expat_friendly,
        pet_friendly: webEnrichment.pet_friendly ?? building.pet_friendly,
        veg_only: webEnrichment.veg_only ?? building.veg_only,
        management_quality: webEnrichment.management_quality !== 'Unknown' ? webEnrichment.management_quality : building.management_quality,
        building_summary: webEnrichment.building_summary || building.building_summary,
        verification_source: webEnrichment.verification_source,
        verified: true // Mark as verified after web enrichment
      } : {}),
      
      // Metadata
      last_intelligence_update: new Date().toISOString()
    };

    // 7. Update building
    await base44.asServiceRole.entities.Building.update(building.id, intelligenceUpdate);

    console.log(`✅ Building intelligence updated for ${building.custom_id}`);

    return Response.json({
      success: true,
      enriched: true,
      building: {
        id: building.id,
        custom_id: building.custom_id,
        name: building.name,
        location: building.location
      },
      intelligence: intelligenceUpdate,
      properties_analyzed: buildingProperties.length,
      web_enrichment_success: !!webEnrichment
    });

  } catch (error) {
    console.error('Building intelligence error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});

// Helper: Determine if building needs enrichment
function shouldEnrichBuilding(building) {
  // Always enrich if never enriched before
  if (!building.last_intelligence_update) {
    return { required: true, reason: 'Never enriched before' };
  }

  // Check if last enrichment was more than 30 days ago
  const lastUpdate = new Date(building.last_intelligence_update);
  const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > 30) {
    return { required: true, reason: `Last enriched ${Math.floor(daysSinceUpdate)} days ago (stale)` };
  }

  // Check if missing critical fields
  const missingFields = [];
  if (!building.developer_name) missingFields.push('developer');
  if (!building.year_built) missingFields.push('year_built');
  if (!building.amenities || building.amenities.length === 0) missingFields.push('amenities');
  if (!building.building_type) missingFields.push('building_type');
  
  if (missingFields.length > 0) {
    return { required: true, reason: `Missing fields: ${missingFields.join(', ')}` };
  }

  // Skip enrichment - recently updated and has all data
  return { 
    required: false, 
    reason: `Recently enriched (${Math.floor(daysSinceUpdate)} days ago) with complete data` 
  };
}

// Helper: Calculate market metrics from properties
function calculateMarketMetrics(properties) {
  const activeProperties = properties.filter(p => p.status === 'Active');
  const rentals = properties.filter(p => p.listing_type === 'Rent');
  const sales = properties.filter(p => p.listing_type === 'Sale');

  const calculateAvg = (props, bhk) => {
    const filtered = props.filter(p => p.bhk === bhk && p.price);
    if (filtered.length === 0) return null;
    const sum = filtered.reduce((acc, p) => {
      const price = p.price_unit === 'crores' ? p.price * 100 : p.price;
      return acc + price;
    }, 0);
    return Math.round(sum / filtered.length);
  };

  const avgRent2BHK = calculateAvg(rentals, '2 BHK');
  const avgRent3BHK = calculateAvg(rentals, '3 BHK');
  const avgSale2BHK = calculateAvg(sales, '2 BHK');
  const avgSale3BHK = calculateAvg(sales, '3 BHK');

  // Determine activity level
  let activityLevel = 'Unknown';
  if (properties.length >= 20) activityLevel = 'High Activity';
  else if (properties.length >= 10) activityLevel = 'Moderate';
  else if (properties.length > 0) activityLevel = 'Low Activity';

  return {
    totalListings: properties.length,
    activeListings: activeProperties.length,
    avgRent2BHK,
    avgRent3BHK,
    avgSale2BHK: avgSale2BHK ? parseFloat((avgSale2BHK / 100).toFixed(2)) : null,
    avgSale3BHK: avgSale3BHK ? parseFloat((avgSale3BHK / 100).toFixed(2)) : null,
    activityLevel
  };
}

// Helper: Update only basic stats (when skipping full enrichment)
async function updateBasicStats(base44, building) {
  const allProperties = await base44.asServiceRole.entities.Property.list();
  const buildingProperties = allProperties.filter(p => 
    p.building_id === building.id || 
    (p.building_name && p.building_name.toLowerCase() === building.name.toLowerCase() && p.location === building.location)
  );

  const marketMetrics = calculateMarketMetrics(buildingProperties);

  await base44.asServiceRole.entities.Building.update(building.id, {
    total_listings: marketMetrics.totalListings,
    active_listings: marketMetrics.activeListings,
    avg_rent_2bhk: marketMetrics.avgRent2BHK,
    avg_rent_3bhk: marketMetrics.avgRent3BHK,
    avg_sale_2bhk: marketMetrics.avgSale2BHK,
    avg_sale_3bhk: marketMetrics.avgSale3BHK,
    market_activity: marketMetrics.activityLevel
  });

  console.log('✓ Updated basic stats (counts & pricing)');
}