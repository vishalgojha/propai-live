import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * POST /api/admin/licenses/revoke
 * Admin-only endpoint to revoke a license
 * 
 * Headers: { 'x-admin-secret': ADMIN_SECRET }
 * Body: { license_id }
 * Response: { ok, license_id, status }
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

    const { license_id } = await req.json();

    if (!license_id) {
      return Response.json({
        ok: false,
        error: 'license_id is required'
      }, { status: 400 });
    }

    // Get license
    const license = await base44.asServiceRole.entities.License.get(license_id);

    if (!license) {
      return Response.json({
        ok: false,
        error: 'License not found'
      }, { status: 404 });
    }

    // Revoke license
    await base44.asServiceRole.entities.License.update(license_id, {
      status: 'revoked'
    });

    return Response.json({
      ok: true,
      license_id: license_id,
      status: 'revoked',
      message: 'License revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking license:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});