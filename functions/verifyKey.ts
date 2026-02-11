import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHmac } from 'node:crypto';

/**
 * POST /verifyKey
 * Verify an API key and return broker profile
 * Used by CLI clients to authenticate
 * 
 * Authorization: Bearer propai_<key>
 * Response: { valid, broker, scopes }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Extract key from Authorization header OR api_key header
    const authHeader = req.headers.get('Authorization');
    const apiKeyHeader = req.headers.get('api_key');
    
    let rawKey;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.substring(7); // Remove "Bearer "
    } else if (apiKeyHeader) {
      rawKey = apiKeyHeader;
    } else {
      return Response.json({ 
        valid: false, 
        error: 'Missing API key. Provide either Authorization: Bearer <key> or api_key: <key>' 
      }, { status: 401 });
    }

    if (!rawKey.startsWith('propai_')) {
      return Response.json({ 
        valid: false, 
        error: 'Invalid key format' 
      }, { status: 401 });
    }

    // Hash the incoming key
    const secret = Deno.env.get('API_KEY_SECRET') || 'propai-default-secret-change-in-production';
    const keyHash = createHmac('sha256', secret)
      .update(rawKey)
      .digest('hex');

    // Look up key in database
    const apiKeys = await base44.asServiceRole.entities.APIKey.filter({
      key_hash: keyHash
    });

    if (apiKeys.length === 0) {
      // Log failed attempt
      console.warn('Invalid API key attempt:', rawKey.substring(0, 15));
      return Response.json({ 
        valid: false, 
        error: 'Invalid API key' 
      }, { status: 401 });
    }

    const apiKey = apiKeys[0];

    // Check if key is revoked
    if (apiKey.status === 'revoked') {
      console.warn('Revoked API key attempt:', apiKey.key_prefix);
      return Response.json({ 
        valid: false, 
        error: 'API key has been revoked' 
      }, { status: 401 });
    }

    // Update last_used_at and usage_count
    await base44.asServiceRole.entities.APIKey.update(apiKey.id, {
      last_used_at: new Date().toISOString(),
      usage_count: (apiKey.usage_count || 0) + 1
    });

    // Fetch full broker profile
    const broker = await base44.asServiceRole.entities.Person.get(apiKey.broker_person_id);

    return Response.json({
      valid: true,
      broker: {
        id: broker.id,
        name: broker.name,
        email: broker.email,
        agency_name: broker.agency_name,
        trust_score: broker.trust_score,
        status: broker.status
      },
      scopes: apiKey.scopes,
      key_id: apiKey.id
    });

  } catch (error) {
    console.error('Error verifying API key:', error);
    return Response.json({ 
      valid: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});