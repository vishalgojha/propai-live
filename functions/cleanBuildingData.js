import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Clean Building Data
 * 
 * Removes MagicBricks references and fixes listing counts
 * 
 * Two modes:
 * - dry_run: Shows what will be cleaned (default)
 * - live: Actually cleans the data
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { mode = 'dry_run' } = await req.json().catch(() => ({}));
    
    console.log(`🧹 Building Cleanup - Mode: ${mode}`);

    // Get all buildings and properties
    const allBuildings = await base44.asServiceRole.entities.Building.list();
    const allProperties = await base44.asServiceRole.entities.Property.list();

    console.log(`Found ${allBuildings.length} buildings, ${allProperties.length} properties`);

    const issues = {
      magicbricks_references: [],
      incorrect_counts: [],
      missing_summaries: []
    };

    // Analyze each building
    for (const building of allBuildings) {
      // 1. Check for MagicBricks references
      const hasMagicBricks = 
        building.verification_source?.toLowerCase().includes('magicbricks') ||
        building.building_summary?.toLowerCase().includes('magicbricks') ||
        building.developer_reputation?.toLowerCase().includes('magicbricks');

      if (hasMagicBricks) {
        issues.magicbricks_references.push({
          id: building.id,
          custom_id: building.custom_id,
          name: building.name,
          verification_source: building.verification_source
        });
      }

      // 2. Check listing counts
      const buildingProperties = allProperties.filter(p => p.building_id === building.id);
      const activeProperties = buildingProperties.filter(p => p.status === 'Active' && !p.is_duplicate);
      
      const correctTotal = buildingProperties.length;
      const correctActive = activeProperties.length;

      if (building.total_listings !== correctTotal || building.active_listings !== correctActive) {
        issues.incorrect_counts.push({
          id: building.id,
          custom_id: building.custom_id,
          name: building.name,
          current_total: building.total_listings || 0,
          correct_total: correctTotal,
          current_active: building.active_listings || 0,
          correct_active: correctActive
        });
      }

      // 3. Check for missing summaries
      if (!building.building_summary || building.building_summary.trim() === '') {
        issues.missing_summaries.push({
          id: building.id,
          custom_id: building.custom_id,
          name: building.name
        });
      }
    }

    // DRY RUN - just report
    if (mode === 'dry_run') {
      return Response.json({
        mode: 'dry_run',
        summary: {
          total_buildings: allBuildings.length,
          magicbricks_references: issues.magicbricks_references.length,
          incorrect_counts: issues.incorrect_counts.length,
          missing_summaries: issues.missing_summaries.length
        },
        issues: {
          magicbricks_sample: issues.magicbricks_references.slice(0, 10),
          count_issues_sample: issues.incorrect_counts.slice(0, 10),
          missing_summaries_sample: issues.missing_summaries.slice(0, 10)
        },
        message: 'Run with mode="live" to apply fixes'
      });
    }

    // LIVE MODE - apply fixes
    const fixes = {
      magicbricks_cleaned: 0,
      counts_fixed: 0,
      errors: 0
    };

    // Fix MagicBricks references
    for (const issue of issues.magicbricks_references) {
      try {
        const building = allBuildings.find(b => b.id === issue.id);
        const updates = {};

        // Clean verification_source
        if (building.verification_source?.toLowerCase().includes('magicbricks')) {
          const sources = building.verification_source.split(',').map(s => s.trim());
          const cleanedSources = sources.filter(s => !s.toLowerCase().includes('magicbricks'));
          updates.verification_source = cleanedSources.length > 0 
            ? cleanedSources.join(', ') 
            : 'PropAI Live verified';
        }

        // Clean building_summary
        if (building.building_summary?.toLowerCase().includes('magicbricks')) {
          updates.building_summary = building.building_summary
            .replace(/magicbricks/gi, 'verified sources')
            .replace(/MagicBricks/g, 'verified sources');
        }

        // Clean developer_reputation
        if (building.developer_reputation?.toLowerCase().includes('magicbricks')) {
          updates.developer_reputation = building.developer_reputation
            .replace(/magicbricks/gi, 'industry sources')
            .replace(/MagicBricks/g, 'industry sources');
        }

        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Building.update(building.id, updates);
          fixes.magicbricks_cleaned++;
          console.log(`✓ Cleaned MagicBricks from ${building.name}`);
        }
      } catch (error) {
        console.error(`Failed to clean ${issue.name}:`, error);
        fixes.errors++;
      }
    }

    // Fix listing counts
    for (const issue of issues.incorrect_counts) {
      try {
        await base44.asServiceRole.entities.Building.update(issue.id, {
          total_listings: issue.correct_total,
          active_listings: issue.correct_active
        });
        fixes.counts_fixed++;
        console.log(`✓ Fixed counts for ${issue.name}: ${issue.correct_total} total, ${issue.correct_active} active`);
      } catch (error) {
        console.error(`Failed to fix counts for ${issue.name}:`, error);
        fixes.errors++;
      }
    }

    return Response.json({
      success: true,
      mode: 'live',
      summary: {
        total_buildings: allBuildings.length,
        magicbricks_cleaned: fixes.magicbricks_cleaned,
        counts_fixed: fixes.counts_fixed,
        errors: fixes.errors
      },
      message: `Cleaned ${fixes.magicbricks_cleaned} MagicBricks references, fixed ${fixes.counts_fixed} listing counts`
    });

  } catch (error) {
    console.error('Building cleanup error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});