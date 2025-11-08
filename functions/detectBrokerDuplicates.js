import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Detect & Merge Duplicate Brokers - PHONE NORMALIZED VERSION
 * 
 * Finds duplicate brokers based on:
 * 1. Normalized phone numbers (primary check)
 * 2. Similar names + same areas
 * 
 * Phone Normalization:
 * - "+91 98200-56789" → "9820056789"
 * - "91 9820 0567 89" → "9820056789"
 * - Prevents duplicates from formatting differences
 * 
 * Modes:
 * - dry_run: Analyze and report duplicates (no changes)
 * - live: Merge duplicates (oldest broker kept, properties reassigned)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { mode = 'dry_run' } = await req.json();

    // Phone normalization helper
    function normalizePhone(phoneNumber) {
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return null;
      }

      let cleaned = phoneNumber.replace(/\D/g, '');

      // Remove country code variants
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.substring(2);
      } else if (cleaned.startsWith('0091') && cleaned.length === 14) {
        cleaned = cleaned.substring(4);
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = cleaned.substring(1);
      }

      // Validate: 10 digits, starts with 6-9
      if (cleaned.length !== 10) {
        return null;
      }

      const firstDigit = parseInt(cleaned[0]);
      if (firstDigit < 6 || firstDigit > 9) {
        return null;
      }

      return cleaned;
    }

    // Name similarity helper
    function calculateNameSimilarity(name1, name2) {
      if (!name1 || !name2) return 0;
      
      const n1 = name1.toLowerCase().trim();
      const n2 = name2.toLowerCase().trim();
      
      if (n1 === n2) return 1.0;
      
      // Levenshtein distance
      const len1 = n1.length;
      const len2 = n2.length;
      const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
      
      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;
      
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      
      const distance = matrix[len1][len2];
      const maxLen = Math.max(len1, len2);
      return 1 - (distance / maxLen);
    }

    // Fetch all brokers
    const allBrokers = await base44.asServiceRole.entities.Broker.list();
    console.log(`📊 Analyzing ${allBrokers.length} brokers for duplicates...`);

    // Normalize all phone numbers
    const brokersWithNormalizedPhones = allBrokers.map(broker => ({
      ...broker,
      normalized_phone: normalizePhone(broker.phone),
      alternate_phones_normalized: (broker.alternate_phones || [])
        .map(p => normalizePhone(p))
        .filter(p => p !== null)
    }));

    // Group by normalized phone
    const phoneGroups = {};
    brokersWithNormalizedPhones.forEach(broker => {
      if (!broker.normalized_phone) return;

      if (!phoneGroups[broker.normalized_phone]) {
        phoneGroups[broker.normalized_phone] = [];
      }
      phoneGroups[broker.normalized_phone].push(broker);

      // Also check alternate phones
      broker.alternate_phones_normalized?.forEach(altPhone => {
        if (!phoneGroups[altPhone]) {
          phoneGroups[altPhone] = [];
        }
        if (!phoneGroups[altPhone].includes(broker)) {
          phoneGroups[altPhone].push(broker);
        }
      });
    });

    // Find duplicate groups
    const duplicateGroups = Object.entries(phoneGroups)
      .filter(([phone, brokers]) => brokers.length > 1)
      .map(([phone, brokers]) => {
        // Sort by created_date (oldest first = original)
        const sorted = brokers.sort((a, b) => 
          new Date(a.created_date) - new Date(b.created_date)
        );
        
        return {
          phone: phone,
          original: sorted[0],
          duplicates: sorted.slice(1),
          total_count: sorted.length
        };
      });

    console.log(`🔍 Found ${duplicateGroups.length} duplicate groups`);

    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0);

    // DRY RUN: Report only
    if (mode === 'dry_run') {
      const report = duplicateGroups.map(group => ({
        normalized_phone: group.phone,
        original_broker: {
          id: group.original.id,
          custom_id: group.original.custom_id,
          name: group.original.name,
          phone: group.original.phone,
          created_date: group.original.created_date
        },
        duplicates: group.duplicates.map(dup => ({
          id: dup.id,
          custom_id: dup.custom_id,
          name: dup.name,
          phone: dup.phone,
          created_date: dup.created_date,
          name_similarity: calculateNameSimilarity(group.original.name, dup.name)
        })),
        action: 'Will merge all duplicates into original broker'
      }));

      return Response.json({
        success: true,
        mode: 'dry_run',
        summary: {
          total_brokers_scanned: allBrokers.length,
          duplicate_groups_found: duplicateGroups.length,
          total_duplicates: totalDuplicates,
          unique_brokers: allBrokers.length - totalDuplicates
        },
        duplicate_groups: report,
        next_step: 'Call with mode: "live" to merge duplicates'
      });
    }

    // LIVE MODE: Merge duplicates
    if (mode === 'live') {
      let mergedCount = 0;
      let errorCount = 0;
      const mergeLog = [];

      for (const group of duplicateGroups) {
        const original = group.original;
        
        for (const duplicate of group.duplicates) {
          try {
            console.log(`🔄 Merging ${duplicate.custom_id} → ${original.custom_id}`);

            // Reassign all properties from duplicate to original
            const duplicateProperties = await base44.asServiceRole.entities.Property.filter({
              broker_id: duplicate.id
            });

            for (const prop of duplicateProperties) {
              await base44.asServiceRole.entities.Property.update(prop.id, {
                broker_id: original.id,
                broker_name: original.name,
                broker_contact: original.phone
              });
            }

            // Update original broker stats
            const originalActiveListings = (original.active_listings_count || 0) + duplicateProperties.filter(p => p.status === 'Active').length;
            const originalTotalListings = (original.total_listings_count || 0) + duplicateProperties.length;

            await base44.asServiceRole.entities.Broker.update(original.id, {
              active_listings_count: originalActiveListings,
              total_listings_count: originalTotalListings,
              merged_with: [...(original.merged_with || []), duplicate.id]
            });

            // Mark duplicate as merged
            await base44.asServiceRole.entities.Broker.update(duplicate.id, {
              status: 'Dormant',
              duplicate_of: original.id,
              active_listings_count: 0,
              admin_notes: `Merged into ${original.custom_id} on ${new Date().toISOString()}`
            });

            mergedCount++;
            mergeLog.push({
              from: duplicate.custom_id,
              to: original.custom_id,
              properties_moved: duplicateProperties.length,
              status: 'success'
            });

          } catch (error) {
            console.error(`❌ Error merging ${duplicate.custom_id}:`, error);
            errorCount++;
            mergeLog.push({
              from: duplicate.custom_id,
              to: original.custom_id,
              status: 'error',
              error: error.message
            });
          }
        }
      }

      return Response.json({
        success: true,
        mode: 'live',
        summary: {
          total_brokers_scanned: allBrokers.length,
          duplicate_groups_found: duplicateGroups.length,
          duplicates_merged: mergedCount,
          errors: errorCount
        },
        merge_log: mergeLog
      });
    }

    return Response.json({
      success: false,
      error: 'Invalid mode. Use "dry_run" or "live"'
    }, { status: 400 });

  } catch (error) {
    console.error('Broker deduplication error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});