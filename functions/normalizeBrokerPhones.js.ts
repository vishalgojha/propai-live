import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Normalize Broker Phone Numbers - Fix Incorrect Country Codes
 * 
 * Fixes broker phone numbers with wrong country codes (e.g., +961 Lebanon → +91 India)
 * 
 * Usage:
 * - dry_run: Shows what will be changed without updating
 * - live: Actually updates broker records
 * 
 * Call with: { mode: 'dry_run' } or { mode: 'live' }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { mode = 'dry_run' } = await req.json();

    // Normalize Indian phone number
    function normalizeIndianPhone(phone) {
      if (!phone || typeof phone !== 'string') {
        return { normalized: null, changed: false, reason: 'empty or invalid' };
      }

      const original = phone;
      
      // Remove all non-digits
      let cleaned = phone.replace(/\D/g, '');
      
      // Remove country code variants (+91, 91, 0091, etc.)
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.substring(2); // Remove 91
      } else if (cleaned.startsWith('0091') && cleaned.length === 14) {
        cleaned = cleaned.substring(4); // Remove 0091
      } else if (cleaned.startsWith('961') && cleaned.length >= 10) {
        // FIX: Handle Lebanese code +961 that was mistakenly used
        cleaned = cleaned.slice(-10);
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = cleaned.substring(1); // Remove leading 0
      }
      
      // If too long, take last 10 digits
      if (cleaned.length > 10) {
        cleaned = cleaned.slice(-10);
      }
      
      // Validate: must be exactly 10 digits starting with 6-9
      if (cleaned.length === 10 && cleaned[0] >= '6' && cleaned[0] <= '9') {
        const normalized = cleaned; // Store without country code
        return {
          normalized,
          changed: original !== normalized,
          reason: original !== normalized ? 'fixed country code' : 'already correct'
        };
      }
      
      return { normalized: null, changed: false, reason: 'invalid format' };
    }

    // Fetch all brokers
    const brokers = await base44.asServiceRole.entities.Broker.list();

    const results = {
      total_brokers: brokers.length,
      valid_phones: 0,
      invalid_phones: 0,
      fixed: 0,
      already_correct: 0,
      examples: [],
      errors: 0
    };

    const updates = [];

    for (const broker of brokers) {
      if (!broker.phone) {
        results.invalid_phones++;
        continue;
      }

      const { normalized, changed, reason } = normalizeIndianPhone(broker.phone);

      if (normalized) {
        results.valid_phones++;
        
        if (changed) {
          results.fixed++;
          updates.push({
            broker_id: broker.id,
            broker_name: broker.name,
            old_phone: broker.phone,
            new_phone: normalized,
            reason
          });

          // Store first 5 examples
          if (results.examples.length < 5) {
            results.examples.push({
              name: broker.name,
              old: broker.phone,
              new: normalized,
              reason
            });
          }

          // Actually update in live mode
          if (mode === 'live') {
            try {
              await base44.asServiceRole.entities.Broker.update(broker.id, {
                phone: normalized
              });
            } catch (error) {
              console.error(`Failed to update broker ${broker.id}:`, error);
              results.errors++;
            }
          }
        } else {
          results.already_correct++;
        }
      } else {
        results.invalid_phones++;
        if (results.examples.length < 5) {
          results.examples.push({
            name: broker.name,
            old: broker.phone,
            new: 'INVALID',
            reason
          });
        }
      }
    }

    return Response.json({
      success: true,
      mode,
      summary: results,
      updates: mode === 'dry_run' ? updates : undefined,
      message: mode === 'dry_run' 
        ? `Found ${results.fixed} broker phone numbers that need fixing. Run with mode: 'live' to update.`
        : `Successfully normalized ${results.fixed} broker phone numbers.`
    });

  } catch (error) {
    console.error('Broker phone normalization error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});