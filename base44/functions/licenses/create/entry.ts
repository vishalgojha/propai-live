import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHmac, randomBytes } from 'node:crypto';

/**
 * POST /api/admin/licenses/create
 * Admin-only endpoint to create a new license
 * 
 * Headers: { 'x-admin-secret': ADMIN_SECRET }
 * Body: { customer_name?, customer_email?, plan?, expires_at?, max_devices?, notes? }
 * Response: { ok, license_id, key, key_prefix, status, expires_at, plan, max_devices }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin secret
    const adminSecret = req.headers.get('x-admin-secret');
    const expectedSecret = Deno.env.get('ADMIN_SECRET');

    if (!expectedSecret) {
      return Response.json({
        ok: false,
        error: 'Admin secret not configured. Please set ADMIN_SECRET environment variable.'
      }, { status: 500 });
    }

    if (adminSecret !== expectedSecret) {
      return Response.json({
        ok: false,
        error: 'Invalid admin secret'
      }, { status: 403 });
    }

    const {
      customer_name,
      customer_email,
      plan,
      expires_at,
      max_devices = 1,
      notes
    } = await req.json();

    // Generate secure random license key: propai_lic_<48 hex chars>
    const randomPart = randomBytes(24).toString('hex'); // 48 chars
    const rawKey = `propai_lic_${randomPart}`;
    const keyPrefix = rawKey.substring(0, 12); // propai_lic_...

    // Hash the key using HMAC-SHA256
    const keyHash = createHmac('sha256', 'propai-license-secret')
      .update(rawKey)
      .digest('hex');

    // Create License record
    const license = await base44.asServiceRole.entities.License.create({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      status: 'active',
      customer_name: customer_name || null,
      customer_email: customer_email || null,
      plan: plan || null,
      expires_at: expires_at || null,
      max_devices: max_devices,
      devices: [],
      notes: notes || null
    });

    return Response.json({
      ok: true,
      license_id: license.id,
      key: rawKey, // ⚠️ ONLY TIME this is returned
      key_prefix: keyPrefix,
      status: license.status,
      expires_at: license.expires_at,
      plan: license.plan,
      max_devices: license.max_devices,
      customer_name: license.customer_name,
      customer_email: license.customer_email,
      message: 'License created successfully. Save the key now - it will not be shown again.'
    });

  } catch (error) {
    console.error('Error creating license:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});