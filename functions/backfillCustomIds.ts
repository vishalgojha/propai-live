import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * BACKFILL CUSTOM IDs
 * 
 * Generates custom_id for all entities that are missing them:
 * - Properties: CHT-{LOCATION}-{SEQUENCE}
 * - Brokers: CHR-BRK-{SEQUENCE}
 * - Requirements: CHR-REQ-{SEQUENCE}
 * - Buildings: CHR-BLD-{SEQUENCE}
 * 
 * Modes:
 * - dry_run: Analyze what needs custom_id
 * - fix: Generate and assign custom_ids
 */

const LOCATION_CODES = {
  'bandra west': 'BND', 'bandra east': 'BND', 'bandra': 'BND',
  'khar west': 'KHR', 'khar east': 'KHR', 'khar': 'KHR',
  'santacruz west': 'SNT', 'santacruz east': 'SNT', 'santacruz': 'SNT',
  'juhu': 'JUH', 'worli': 'WRL', 'bkc': 'BKC', 'andheri west': 'AND',
  'mumbai': 'MUM'
};

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

    console.log(`🔍 Running custom ID backfill in ${mode} mode...`);

    // Fetch entities
    const properties = await base44.asServiceRole.entities.Property.list();
    const brokers = await base44.asServiceRole.entities.Broker.list();
    const requirements = await base44.asServiceRole.entities.Requirement.list();
    const buildings = await base44.asServiceRole.entities.Building.list();

    const analysis = {
      properties: {
        total: properties.length,
        missing: properties.filter(p => !p.custom_id).length
      },
      brokers: {
        total: brokers.length,
        missing: brokers.filter(b => !b.custom_id).length
      },
      requirements: {
        total: requirements.length,
        missing: requirements.filter(r => !r.custom_id).length
      },
      buildings: {
        total: buildings.length,
        missing: buildings.filter(b => !b.custom_id).length
      }
    };

    analysis.total_missing = 
      analysis.properties.missing + 
      analysis.brokers.missing + 
      analysis.requirements.missing + 
      analysis.buildings.missing;

    if (mode === 'dry_run') {
      return Response.json({
        success: true,
        mode: 'dry_run',
        analysis
      });
    }

    // FIX MODE: Generate custom IDs
    let generated = 0;
    let errors = 0;

    // Properties
    for (const property of properties.filter(p => !p.custom_id)) {
      try {
        const locationCode = LOCATION_CODES[property.location?.toLowerCase()] || 'MUM';
        const idHash = property.id.slice(-8);
        const sequence = parseInt(idHash, 16) % 10000;
        const customId = `CHT-${locationCode}-${String(sequence).padStart(4, '0')}`;
        
        await base44.asServiceRole.entities.Property.update(property.id, { 
          custom_id: customId 
        });
        generated++;
      } catch (error) {
        console.error(`Failed to generate custom_id for property ${property.id}:`, error);
        errors++;
      }
    }

    // Brokers
    for (const broker of brokers.filter(b => !b.custom_id)) {
      try {
        const idHash = broker.id.slice(-8);
        const sequence = parseInt(idHash, 16) % 10000;
        const customId = `CHR-BRK-${String(sequence).padStart(4, '0')}`;
        
        await base44.asServiceRole.entities.Broker.update(broker.id, { 
          custom_id: customId 
        });
        generated++;
      } catch (error) {
        console.error(`Failed to generate custom_id for broker ${broker.id}:`, error);
        errors++;
      }
    }

    // Requirements
    for (const requirement of requirements.filter(r => !r.custom_id)) {
      try {
        const idHash = requirement.id.slice(-8);
        const sequence = parseInt(idHash, 16) % 10000;
        const customId = `CHR-REQ-${String(sequence).padStart(4, '0')}`;
        
        await base44.asServiceRole.entities.Requirement.update(requirement.id, { 
          custom_id: customId 
        });
        generated++;
      } catch (error) {
        console.error(`Failed to generate custom_id for requirement ${requirement.id}:`, error);
        errors++;
      }
    }

    // Buildings
    for (const building of buildings.filter(b => !b.custom_id)) {
      try {
        const idHash = building.id.slice(-8);
        const sequence = parseInt(idHash, 16) % 10000;
        const customId = `CHR-BLD-${String(sequence).padStart(4, '0')}`;
        
        await base44.asServiceRole.entities.Building.update(building.id, { 
          custom_id: customId 
        });
        generated++;
      } catch (error) {
        console.error(`Failed to generate custom_id for building ${building.id}:`, error);
        errors++;
      }
    }

    return Response.json({
      success: true,
      mode: 'fix',
      analysis,
      results: {
        generated,
        errors
      }
    });

  } catch (error) {
    console.error('Custom ID backfill error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});