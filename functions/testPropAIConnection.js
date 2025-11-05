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
      return Response.json({ 
        success: false,
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 });
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
      });
    }

    console.log('✓ API key found:', PROPAI_API_KEY.substring(0, 8) + '...');

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

    console.log('📤 Sending test payload to:', PROPAI_URL);

    let response;
    let responseText;
    
    try {
      response = await fetch(PROPAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PROPAI_API_KEY
        },
        body: JSON.stringify(testPayload)
      });

      responseText = await response.text();
      console.log('📥 PropAI response status:', response.status);
      console.log('📥 PropAI response:', responseText.substring(0, 200));

    } catch (fetchError) {
      console.error('❌ Network error:', fetchError);
      return Response.json({
        success: false,
        error: `Network error: ${fetchError.message}`,
        details: 'Could not reach PropAI Live endpoint',
        possible_causes: [
          'PropAI Live endpoint is down',
          'Network/DNS issue',
          'Firewall blocking connection',
          'Invalid URL'
        ],
        endpoint: PROPAI_URL
      });
    }

    if (!response.ok) {
      return Response.json({
        success: false,
        error: `PropAI rejected connection (HTTP ${response.status})`,
        details: responseText,
        possible_causes: [
          response.status === 401 || response.status === 403 ? 'Invalid API key' : 'Unknown error',
          'PropAI Live endpoint configuration issue',
          'API key not matching on PropAI side'
        ],
        connection_info: {
          endpoint: PROPAI_URL,
          status_code: response.status,
          api_key_preview: PROPAI_API_KEY.substring(0, 8) + '...'
        }
      });
    }

    // Try to parse response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { raw_response: responseText };
    }

    console.log('✅ PropAI connection successful!');

    return Response.json({
      success: true,
      message: '✅ PropAI Live connection working!',
      propai_response: parsedResponse,
      connection_details: {
        endpoint: PROPAI_URL,
        api_key_set: true,
        api_key_preview: PROPAI_API_KEY.substring(0, 8) + '...',
        response_status: response.status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ PropAI connection test failed:', error);
    return Response.json({ 
      success: false,
      error: `Unexpected error: ${error.message}`,
      stack: error.stack,
      help: 'Check Deno logs for more details'
    });
  }
});