import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🔧 BACKFILL ALL CUSTOM IDs
 * 
 * Generates custom_id for all entities that are missing it:
 * - Properties: CHT-{LOCATION_CODE}-{SEQUENCE}
 * - Brokers: CHR-BRK-{SEQUENCE}
 * - Requirements: CHR-REQ-{SEQUENCE}
 */

const LOCATION_CODES = {
  'bandra west': 'BND',
  'bandra east': 'BND',
  'bandra': 'BND',
  'khar west': 'KHR',
  'khar east': 'KHR',
  'khar': 'KHR',
  'santacruz west': 'SNT',
  'santacruz east': 'SNT',
  'santacruz': 'SNT',
  'juhu': 'JUH',
  'pali hill': 'PLH',
  'carter road': 'CTR',
  'andheri west': 'AND',
  'andheri east': 'AND',
  'andheri': 'AND',
  'versova': 'VRS',
  'worli': 'WRL',
  'lower parel': 'LPR',
  'dadar': 'DDR',
  'mahim': 'MHM',
  'prabhadevi': 'PRB',
  'bandra kurla complex': 'BKC',
  'bkc': 'BKC',
  'powai': 'POW',
  'goregaon': 'GOR',
  'malad': 'MLD',
  'borivali': 'BOR',
  'kandivali': 'KND',
  'chembur': 'CHM',
  'mumbai': 'MUM'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Parse request body safely
    let mode = 'dry_run';
    try {
      const body = await req.json();
      mode = body.mode || 'dry_run';
    } catch (e) {
      // If no body or invalid JSON, default to dry_run
      mode = 'dry_run';
    }

    // ============================================
    // ANALYZE PHASE
    // ============================================
    
    const allProperties = await base44.asServiceRole.entities.Property.list();
    const allBrokers = await base44.asServiceRole.entities.Broker.list();
    const allRequirements = await base44.asServiceRole.entities.Requirement.list();

    const missingIds = {
      properties: allProperties.filter(p => !p.custom_id),
      brokers: allBrokers.filter(b => !b.custom_id),
      requirements: allRequirements.filter(r => !r.custom_id)
    };

    const counts = {
      properties_missing: missingIds.properties.length,
      brokers_missing: missingIds.brokers.length,
      requirements_missing: missingIds.requirements.length,
      total_missing: missingIds.properties.length + missingIds.brokers.length + missingIds.requirements.length
    };

    if (mode === 'dry_run') {
      return Response.json({
        message: 'Dry run - no changes made',
        analysis: counts,
        details: {
          properties_need_ids: missingIds.properties.length,
          brokers_need_ids: missingIds.brokers.length,
          requirements_need_ids: missingIds.requirements.length
        }
      });
    }

    // ============================================
    // FIX MODE - Generate Custom IDs
    // ============================================

    const results = {
      properties_fixed: 0,
      brokers_fixed: 0,
      requirements_fixed: 0,
      errors: []
    };

    // Get current max sequences for each entity
    const existingPropertyIds = allProperties
      .filter(p => p.custom_id)
      .map(p => {
        const match = p.custom_id.match(/CHT-\w+-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    const existingBrokerIds = allBrokers
      .filter(b => b.custom_id)
      .map(b => {
        const match = b.custom_id.match(/CHR-BRK-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    const existingReqIds = allRequirements
      .filter(r => r.custom_id)
      .map(r => {
        const match = r.custom_id.match(/CHR-REQ-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

    let nextPropertySeq = existingPropertyIds.length > 0 ? Math.max(...existingPropertyIds) + 1 : 1;
    let nextBrokerSeq = existingBrokerIds.length > 0 ? Math.max(...existingBrokerIds) + 1 : 1;
    let nextReqSeq = existingReqIds.length > 0 ? Math.max(...existingReqIds) + 1 : 1;

    // ============================================
    // FIX PROPERTIES
    // ============================================
    for (const property of missingIds.properties) {
      try {
        const locationLower = (property.location || 'mumbai').toLowerCase().trim();
        const locationCode = LOCATION_CODES[locationLower] || 'MUM';
        const sequenceStr = String(nextPropertySeq).padStart(4, '0');
        const customId = `CHT-${locationCode}-${sequenceStr}`;

        await base44.asServiceRole.entities.Property.update(property.id, {
          custom_id: customId
        });

        results.properties_fixed++;
        nextPropertySeq++;
      } catch (error) {
        results.errors.push({
          entity: 'Property',
          id: property.id,
          error: error.message
        });
      }
    }

    // ============================================
    // FIX BROKERS
    // ============================================
    for (const broker of missingIds.brokers) {
      try {
        const sequenceStr = String(nextBrokerSeq).padStart(4, '0');
        const customId = `CHR-BRK-${sequenceStr}`;

        await base44.asServiceRole.entities.Broker.update(broker.id, {
          custom_id: customId
        });

        results.brokers_fixed++;
        nextBrokerSeq++;
      } catch (error) {
        results.errors.push({
          entity: 'Broker',
          id: broker.id,
          error: error.message
        });
      }
    }

    // ============================================
    // FIX REQUIREMENTS
    // ============================================
    for (const requirement of missingIds.requirements) {
      try {
        const sequenceStr = String(nextReqSeq).padStart(4, '0');
        const customId = `CHR-REQ-${sequenceStr}`;

        await base44.asServiceRole.entities.Requirement.update(requirement.id, {
          custom_id: customId
        });

        results.requirements_fixed++;
        nextReqSeq++;
      } catch (error) {
        results.errors.push({
          entity: 'Requirement',
          id: requirement.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: '✅ Custom ID Backfill Complete!',
      results,
      summary: {
        properties: `${results.properties_fixed} / ${counts.properties_missing} fixed`,
        brokers: `${results.brokers_fixed} / ${counts.brokers_missing} fixed`,
        requirements: `${results.requirements_fixed} / ${counts.requirements_missing} fixed`,
        total_fixed: results.properties_fixed + results.brokers_fixed + results.requirements_fixed,
        errors: results.errors.length
      }
    });

  } catch (error) {
    console.error('Backfill custom IDs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});