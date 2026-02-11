import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * POST /revokeApiKey
 * Revoke an API key
 * Admin-only
 * 
 * Request: { key_id }
 * Response: { success, message }
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

    const { key_id } = await req.json();

    if (!key_id) {
      return Response.json({ 
        success: false, 
        error: 'key_id is required' 
      }, { status: 400 });
    }

    const apiKey = await base44.asServiceRole.entities.APIKey.get(key_id);
    if (!apiKey) {
      return Response.json({ 
        success: false, 
        error: 'Key not found' 
      }, { status: 404 });
    }

    if (apiKey.status === 'revoked') {
      return Response.json({ 
        success: false, 
        error: 'Key is already revoked' 
      }, { status: 400 });
    }

    await base44.asServiceRole.entities.APIKey.update(key_id, {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: user.email
    });

    return Response.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking API key:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});