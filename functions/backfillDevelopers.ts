import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Backfills Building entities with developer_id and developer_tier
 * Matches developer_name to Developer entity using fuzzy logic
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Fetch all developers and buildings
    const developers = await base44.asServiceRole.entities.Developer.list();
    const buildings = await base44.asServiceRole.entities.Building.list();

    if (developers.length === 0) {
      return Response.json({ 
        error: 'No developers found in database',
        stats: { total: 0, matched: 0, unmatched: 0 }
      });
    }

    let matched = 0;
    let unmatched = 0;
    const updates = [];
    const unmatchedBuildings = [];

    // Helper function for fuzzy matching
    const fuzzyMatch = (buildingDev, developer) => {
      if (!buildingDev) return false;
      
      const normalized = buildingDev.toLowerCase().trim();
      const devName = developer.name.toLowerCase();
      
      // Exact match
      if (normalized === devName) return true;
      
      // Check known variants
      if (developer.known_variants) {
        for (const variant of developer.known_variants) {
          if (normalized === variant.toLowerCase()) return true;
          if (normalized.includes(variant.toLowerCase()) || variant.toLowerCase().includes(normalized)) {
            return true;
          }
        }
      }
      
      // Partial match (contains)
      if (normalized.includes(devName) || devName.includes(normalized)) {
        return true;
      }
      
      return false;
    };

    // Match buildings to developers
    for (const building of buildings) {
      if (!building.developer_name) {
        unmatched++;
        continue;
      }

      // Skip if already linked
      if (building.developer_id) {
        matched++;
        continue;
      }

      // Find matching developer
      const matchedDev = developers.find(dev => fuzzyMatch(building.developer_name, dev));

      if (matchedDev) {
        updates.push({
          id: building.id,
          data: {
            developer_id: matchedDev.id,
            developer_tier: matchedDev.tier,
            developer_reputation: matchedDev.reputation_score 
              ? `${matchedDev.tier} Developer - Reputation: ${matchedDev.reputation_score}/100`
              : matchedDev.tier
          }
        });
        matched++;
      } else {
        unmatched++;
        unmatchedBuildings.push({
          id: building.id,
          name: building.name,
          developer_name: building.developer_name
        });
      }
    }

    // Perform bulk updates
    const updateResults = [];
    for (const update of updates) {
      try {
        await base44.asServiceRole.entities.Building.update(update.id, update.data);
        updateResults.push({ id: update.id, status: 'success' });
      } catch (error) {
        updateResults.push({ id: update.id, status: 'error', error: error.message });
      }
    }

    // Update developer stats
    const developerStats = {};
    for (const developer of developers) {
      const linkedBuildings = buildings.filter(b => b.developer_id === developer.id);
      developerStats[developer.name] = linkedBuildings.length;
      
      // Update developer's total_buildings_tracked
      await base44.asServiceRole.entities.Developer.update(developer.id, {
        total_buildings_tracked: linkedBuildings.length
      });
    }

    return Response.json({
      success: true,
      stats: {
        total_buildings: buildings.length,
        matched,
        unmatched,
        updated: updateResults.filter(r => r.status === 'success').length,
        errors: updateResults.filter(r => r.status === 'error').length
      },
      developer_stats: developerStats,
      unmatched_buildings: unmatchedBuildings.slice(0, 50), // Return first 50 for review
      update_results: updateResults
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});