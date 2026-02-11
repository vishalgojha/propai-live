import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHmac, randomBytes } from 'node:crypto';

/**
 * POST /api/keys/rotate
 * Revoke old key and generate new one
 * Admin-only
 * 
 * Request: { key_id }
 * Response: { success, new_key, new_key_id }
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

    // Get old key
    const oldKey = await base44.asServiceRole.entities.APIKey.get(key_id);
    if (!oldKey) {
      return Response.json({ 
        success: false, 
        error: 'Key not found' 
      }, { status: 404 });
    }

    // Revoke old key
    await base44.asServiceRole.entities.APIKey.update(key_id, {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: user.email
    });

    // Generate new key
    const randomPart = randomBytes(16).toString('hex');
    const rawKey = `propai_${randomPart}`;
    const keyPrefix = rawKey.substring(0, 15);

    const secret = Deno.env.get('API_KEY_SECRET') || 'propai-default-secret-change-in-production';
    const keyHash = createHmac('sha256', secret)
      .update(rawKey)
      .digest('hex');

    // Create new key with same broker and scopes
    const newKey = await base44.asServiceRole.entities.APIKey.create({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      broker_person_id: oldKey.broker_person_id,
      broker_name: oldKey.broker_name,
      broker_email: oldKey.broker_email,
      status: 'active',
      scopes: oldKey.scopes,
      usage_count: 0,
      notes: `Rotated from ${oldKey.key_prefix}`
    });

    return Response.json({
      success: true,
      new_key: rawKey, // ⚠️ ONLY TIME shown
      new_key_id: newKey.id,
      old_key_id: key_id,
      message: 'Key rotated successfully. Old key revoked, new key generated.'
    });

  } catch (error) {
    console.error('Error rotating API key:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});