import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * GET /api/admin/licenses
 * Admin-only endpoint to list all licenses
 * 
 * Headers: { 'x-admin-secret': ADMIN_SECRET }
 * Query: ?search=email&status=active
 * Response: { ok, licenses: [...] }
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
        error: 'Admin secret not configured'
      }, { status: 500 });
    }

    if (adminSecret !== expectedSecret) {
      return Response.json({
        ok: false,
        error: 'Invalid admin secret'
      }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Fetch licenses
    let licenses = await base44.asServiceRole.entities.License.filter(
      filter,
      '-created_date',
      100
    );

    // Client-side search filter (if needed)
    if (search) {
      const searchLower = search.toLowerCase();
      licenses = licenses.filter(license =>
        (license.customer_name?.toLowerCase().includes(searchLower)) ||
        (license.customer_email?.toLowerCase().includes(searchLower)) ||
        (license.key_prefix?.toLowerCase().includes(searchLower)) ||
        (license.plan?.toLowerCase().includes(searchLower))
      );
    }

    return Response.json({
      ok: true,
      licenses: licenses.map(license => ({
        id: license.id,
        key_prefix: license.key_prefix,
        status: license.status,
        customer_name: license.customer_name,
        customer_email: license.customer_email,
        plan: license.plan,
        max_devices: license.max_devices,
        device_count: (license.devices || []).length,
        expires_at: license.expires_at,
        last_validated_at: license.last_validated_at,
        created_date: license.created_date,
        notes: license.notes
      }))
    });

  } catch (error) {
    console.error('Error listing licenses:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});