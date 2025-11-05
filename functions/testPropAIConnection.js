import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Test PropAI Live Connection
 * 
 * Verifies:
 * 1. API key is set
 * 2. PropAI endpoint is reachable
 * 3. Can send test data
 * 
 * Use this to diagnose sendToPropAI issues
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const PROPAI_URL = 'https://propai-live.deno.dev/api/receive';
    const PROPAI_API_KEY = Deno.env.get('PROPAI_LIVE_API_KEY');

    console.log('🧪 Testing PropAI Live connection...');

    // 1. Check if API key exists
    if (!PROPAI_API_KEY) {
      return Response.json({ 
        success: false,
        error: 'PROPAI_LIVE_API_KEY not set in environment variables',
        solution: 'Go to Dashboard → Settings → Environment Variables and add PROPAI_LIVE_API_KEY'
      }, { status: 500 });
    }

    console.log('✓ API key found');

    // 2. Send test ping
    const testPayload = {
      data_type: 'test_ping',
      data: {
        source: 'chariot_parser',
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Testing connection from Chariot Realty'
      },
      api_key: PROPAI_API_KEY
    };

    console.log('Sending test payload to:', PROPAI_URL);

    const response = await fetch(PROPAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PROPAI_API_KEY
      },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();
    console.log('PropAI response status:', response.status);
    console.log('PropAI response:', responseText);

    if (!response.ok) {
      return Response.json({
        success: false,
        error: `PropAI rejected connection: ${response.status}`,
        details: responseText,
        possible_causes: [
          'Invalid API key',
          'PropAI Live endpoint is down',
          'Firewall/network issue',
          'API key not matching on PropAI side'
        ]
      }, { status: 500 });
    }

    // Try to parse response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    return Response.json({
      success: true,
      message: '✅ PropAI Live connection working!',
      propai_response: parsedResponse,
      connection_details: {
        endpoint: PROPAI_URL,
        api_key_set: true,
        api_key_preview: PROPAI_API_KEY.substring(0, 8) + '...',
        response_status: response.status
      }
    });

  } catch (error) {
    console.error('PropAI connection test failed:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});