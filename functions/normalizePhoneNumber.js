import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Normalize Phone Numbers - Prevent Duplicate Brokers
 * 
 * Cleans and standardizes phone numbers to detect duplicates:
 * - Removes spaces, dashes, parentheses, dots
 * - Strips country codes (+91, 91, 0091)
 * - Returns 10-digit Indian mobile number
 * 
 * Example:
 *   "+91 98200-56789" → "9820056789"
 *   "91 9820 0567 89" → "9820056789"
 *   "(98200) 56789"   → "9820056789"
 * 
 * Can be called directly or used by other functions.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, phones } = await req.json();

    // Helper function
    function normalizePhone(phoneNumber) {
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return null;
      }

      // Remove all non-digit characters
      let cleaned = phoneNumber.replace(/\D/g, '');

      // Remove country code variants
      // +91, 91, 0091
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.substring(2); // Remove 91
      } else if (cleaned.startsWith('0091') && cleaned.length === 14) {
        cleaned = cleaned.substring(4); // Remove 0091
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = cleaned.substring(1); // Remove leading 0
      }

      // Validate: must be exactly 10 digits
      if (cleaned.length !== 10) {
        return null;
      }

      // Validate: must start with 6-9 (Indian mobile numbers)
      const firstDigit = parseInt(cleaned[0]);
      if (firstDigit < 6 || firstDigit > 9) {
        return null;
      }

      return cleaned;
    }

    // Single phone normalization
    if (phone) {
      const normalized = normalizePhone(phone);
      return Response.json({
        success: true,
        original: phone,
        normalized: normalized,
        valid: normalized !== null
      });
    }

    // Batch phone normalization
    if (phones && Array.isArray(phones)) {
      const results = phones.map(p => ({
        original: p,
        normalized: normalizePhone(p),
        valid: normalizePhone(p) !== null
      }));

      return Response.json({
        success: true,
        results: results,
        total: phones.length,
        valid_count: results.filter(r => r.valid).length
      });
    }

    return Response.json({
      success: false,
      error: 'Please provide either "phone" (string) or "phones" (array)'
    }, { status: 400 });

  } catch (error) {
    console.error('Phone normalization error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});