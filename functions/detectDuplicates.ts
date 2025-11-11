import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * PROPERTY DUPLICATE DETECTION
 * 
 * Identifies duplicate property listings using fingerprinting:
 * - Exact matches: Same BHK, price, area, building, location, floor
 * - Near matches: Similar properties (for manual review)
 * 
 * Modes:
 * - dry_run: Analyze and report duplicates
 * - live: Mark duplicates in database
 */

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

    console.log(`🔍 Running duplicate detection in ${mode} mode...`);

    // Fetch all active properties
    const properties = await base44.asServiceRole.entities.Property.list();
    const activeProperties = properties.filter(p => p.status === 'Active');

    // Generate fingerprints
    const generateFingerprint = (property) => {
      const parts = [
        property.bhk?.toLowerCase().replace(/\s+/g, ''),
        Math.round(property.price * 100) / 100, // Round to 2 decimals
        property.price_unit,
        Math.round(property.carpet_area || 0),
        property.building_name?.toLowerCase().replace(/\s+/g, ''),
        property.location?.toLowerCase().replace(/\s+/g, ''),
        property.floor?.toLowerCase().replace(/\s+/g, '')
      ];
      return parts.filter(p => p).join('|');
    };

    // Group properties by fingerprint
    const fingerprintGroups = {};
    
    for (const property of activeProperties) {
      const fingerprint = generateFingerprint(property);
      
      if (!fingerprintGroups[fingerprint]) {
        fingerprintGroups[fingerprint] = [];
      }
      
      fingerprintGroups[fingerprint].push(property);
    }

    // Find duplicate groups (groups with more than 1 property)
    const duplicateGroups = Object.values(fingerprintGroups).filter(group => group.length > 1);

    console.log(`Found ${duplicateGroups.length} duplicate groups`);

    let totalDuplicates = 0;
    const duplicatesToMark = [];

    for (const group of duplicateGroups) {
      // Sort by created_date (oldest first)
      group.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      // First property is the "original", rest are duplicates
      const original = group[0];
      const duplicates = group.slice(1);
      
      totalDuplicates += duplicates.length;

      for (const duplicate of duplicates) {
        duplicatesToMark.push({
          id: duplicate.id,
          custom_id: duplicate.custom_id,
          original_id: original.id,
          original_custom_id: original.custom_id,
          fingerprint: generateFingerprint(duplicate)
        });
      }
    }

    // Apply fixes if in live mode
    let marked = 0;
    let errors = 0;

    if (mode === 'live' && duplicatesToMark.length > 0) {
      console.log(`🔧 Marking ${duplicatesToMark.length} duplicates...`);
      
      for (const dup of duplicatesToMark) {
        try {
          await base44.asServiceRole.entities.Property.update(dup.id, {
            is_duplicate: true,
            duplicate_of: dup.original_id,
            duplicate_fingerprint: dup.fingerprint
          });
          marked++;
        } catch (error) {
          console.error(`Failed to mark duplicate ${dup.id}:`, error.message);
          errors++;
        }
      }
      
      console.log(`✅ Marked ${marked} duplicates (${errors} errors)`);
    }

    return Response.json({
      success: true,
      mode,
      summary: {
        total_properties_scanned: activeProperties.length,
        duplicate_groups_found: duplicateGroups.length,
        total_duplicates: totalDuplicates,
        duplicates_marked: mode === 'live' ? marked : 0,
        errors: mode === 'live' ? errors : 0
      },
      duplicate_groups: mode === 'dry_run' ? duplicateGroups.map(group => ({
        count: group.length,
        original: {
          id: group[0].id,
          custom_id: group[0].custom_id,
          title: group[0].ai_title || `${group[0].bhk} in ${group[0].location}`
        },
        duplicates: group.slice(1).map(d => ({
          id: d.id,
          custom_id: d.custom_id,
          created_date: d.created_date
        }))
      })) : undefined
    });

  } catch (error) {
    console.error('Duplicate detection error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});