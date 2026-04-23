import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * POST /listApiKeys
 * List all API keys (admin view)
 * Admin-only
 * 
 * Request: { status?, broker_person_id? }
 * Response: { success, keys: [] }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    const { status, broker_person_id } = await req.json().catch(() => ({}));

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (broker_person_id) filter.broker_person_id = broker_person_id;

    const keys = await base44.asServiceRole.entities.APIKey.filter(filter, '-created_date');

    return Response.json({
      success: true,
      keys: keys.map(key => ({
        id: key.id,
        key_prefix: key.key_prefix,
        broker_person_id: key.broker_person_id,
        broker_name: key.broker_name,
        broker_email: key.broker_email,
        status: key.status,
        scopes: key.scopes,
        created_date: key.created_date,
        last_used_at: key.last_used_at,
        usage_count: key.usage_count,
        revoked_at: key.revoked_at,
        revoked_by: key.revoked_by,
        notes: key.notes
      }))
    });

  } catch (error) {
    console.error('Error listing API keys:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});