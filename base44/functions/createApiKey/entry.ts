import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHmac, randomBytes } from 'node:crypto';

/**
 * POST /createApiKey
 * Create a new API key for a broker
 * Returns the raw key ONLY ONCE - never stored or shown again
 * 
 * Request: { broker_person_id, scopes? }
 * Response: { success, key, key_id, message }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only endpoint
    if (user?.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    const { broker_person_id, scopes, notes } = await req.json();

    if (!broker_person_id) {
      return Response.json({ 
        success: false, 
        error: 'broker_person_id is required' 
      }, { status: 400 });
    }

    // Verify broker exists
    const broker = await base44.asServiceRole.entities.Person.get(broker_person_id);
    if (!broker) {
      return Response.json({ 
        success: false, 
        error: 'Broker not found' 
      }, { status: 404 });
    }

    // Generate secure random key: propai_<32 random hex chars>
    const randomPart = randomBytes(16).toString('hex'); // 32 chars
    const rawKey = `propai_${randomPart}`;
    const keyPrefix = rawKey.substring(0, 15); // propai_12345678...

    // Hash the key using HMAC-SHA256 with server secret
    const secret = Deno.env.get('API_KEY_SECRET') || 'propai-default-secret-change-in-production';
    const keyHash = createHmac('sha256', secret)
      .update(rawKey)
      .digest('hex');

    // Create APIKey record
    const apiKey = await base44.asServiceRole.entities.APIKey.create({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      broker_person_id: broker.id,
      broker_name: broker.name,
      broker_email: broker.email || null,
      status: 'active',
      scopes: scopes || ['read:properties', 'write:properties', 'read:requirements', 'write:requirements'],
      usage_count: 0,
      notes: notes || null
    });

    return Response.json({
      success: true,
      key: rawKey, // ⚠️ ONLY TIME this is returned
      key_id: apiKey.id,
      key_prefix: keyPrefix,
      broker: {
        id: broker.id,
        name: broker.name,
        email: broker.email
      },
      scopes: apiKey.scopes,
      message: 'API key created successfully. Save it now - it will not be shown again.'
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});