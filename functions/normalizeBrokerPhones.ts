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
      
      // ✅ FIXED: Better handling of country codes
      
      // Case 1: Already 10 digits starting with 6-9 (valid Indian mobile)
      if (cleaned.length === 10 && cleaned[0] >= '6' && cleaned[0] <= '9') {
        return {
          normalized: cleaned,
          changed: original !== cleaned,
          reason: original !== cleaned ? 'removed formatting' : 'already correct'
        };
      }
      
      // Case 2: 12 digits starting with 91 (Indian country code)
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        const without91 = cleaned.substring(2);
        if (without91[0] >= '6' && without91[0] <= '9') {
          return {
            normalized: without91,
            changed: true,
            reason: 'removed +91 prefix'
          };
        }
      }
      
      // Case 3: 14 digits starting with 0091
      if (cleaned.length === 14 && cleaned.startsWith('0091')) {
        const without0091 = cleaned.substring(4);
        if (without0091.length === 10 && without0091[0] >= '6' && without0091[0] <= '9') {
          return {
            normalized: without0091,
            changed: true,
            reason: 'removed 0091 prefix'
          };
        }
      }
      
      // Case 4: 11 digits starting with 0 (trunk prefix)
      if (cleaned.length === 11 && cleaned.startsWith('0')) {
        const without0 = cleaned.substring(1);
        if (without0[0] >= '6' && without0[0] <= '9') {
          return {
            normalized: without0,
            changed: true,
            reason: 'removed trunk 0'
          };
        }
      }
      
      // ✅ FIXED: Case 5: Wrong country code like +961 (Lebanon) used instead of +91
      // Only strip if it results in a valid 10-digit number
      if (cleaned.length > 10) {
        // Try removing leading digits until we get 10 digits
        const last10 = cleaned.slice(-10);
        if (last10[0] >= '6' && last10[0] <= '9') {
          // Check if this looks like a wrong country code situation
          // E.g., 9619155175 (10 digits starting with 961) vs 9619155175XX (12+ digits)
          if (cleaned.length >= 12) {
            // Likely has a country code prefix
            return {
              normalized: last10,
              changed: true,
              reason: 'extracted 10 digits from longer number with country code'
            };
          } else if (cleaned.length === 11) {
            // Could be 961 prefix used wrong OR a trunk 0
            // Check if first digit is 0 (trunk) or if starts with common wrong codes
            if (cleaned.startsWith('961') || cleaned.startsWith('971')) {
              return {
                normalized: last10,
                changed: true,
                reason: 'fixed wrong country code (+961→+91)'
              };
            }
          }
        }
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
      errors: 0,
      error_details: [] // ✅ NEW: Track error details
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
              // ✅ FIXED: Safer update with error handling
              await base44.asServiceRole.entities.Broker.update(broker.id, {
                phone: normalized
              });
            } catch (error) {
              console.error(`Failed to update broker ${broker.id} (${broker.name}):`, error.message);
              results.errors++;
              
              // ✅ NEW: Store error details for debugging
              if (results.error_details.length < 20) {
                results.error_details.push({
                  broker_id: broker.id,
                  broker_name: broker.name,
                  old_phone: broker.phone,
                  new_phone: normalized,
                  error: error.message
                });
              }
            }
          }
        } else {
          results.already_correct++;
        }
      } else {
        results.invalid_phones++;
        if (results.examples.length < 5 && mode === 'dry_run') {
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
      success: results.errors < results.fixed, // ✅ Success if more fixes than errors
      mode,
      summary: results,
      updates: mode === 'dry_run' ? updates : undefined,
      error_details: mode === 'live' && results.error_details.length > 0 ? results.error_details : undefined, // ✅ Show errors
      message: mode === 'dry_run' 
        ? `Found ${results.fixed} broker phone numbers that need fixing. Run with mode: 'live' to update.`
        : results.errors === 0
          ? `✅ Successfully normalized ${results.fixed} broker phone numbers.`
          : `⚠️ Normalized ${results.fixed - results.errors} of ${results.fixed} broker phone numbers (${results.errors} errors)`
    });

  } catch (error) {
    console.error('Broker phone normalization error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});