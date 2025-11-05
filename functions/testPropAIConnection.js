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
      });
    }

    const PROPAI_URL = Deno.env.get('PROPAI_LIVE_URL') || 'https://propai-live.deno.dev/api/receive';
    const PROPAI_API_KEY = Deno.env.get('PROPAI_LIVE_API_KEY');

    console.log('🧪 Testing PropAI Live connection...');

    // 1. Check if API key exists
    if (!PROPAI_API_KEY) {
      return Response.json({ 
        success: false,
        error: 'PROPAI_LIVE_API_KEY not set',
        help: '⚙️ PropAI sync is optional. If you want to enable it:\n\n1. Deploy PropAI Live endpoint\n2. Go to Dashboard → Settings → Environment Variables\n3. Add PROPAI_LIVE_API_KEY with your key\n\nOtherwise, property parsing will work fine without it.'
      });
    }

    console.log('✓ API key found:', PROPAI_API_KEY.substring(0, 8) + '...');

    // 2. Send test ping
    const testPayload = {
      data_type: 'test_ping',
      data: {
        source: 'chariot_realty',
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Testing connection from Chariot Realty'
      }
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

    } catch (fetchError) {
      console.error('❌ Network error:', fetchError);
      return Response.json({
        success: false,
        error: 'Network Error',
        details: `Could not reach PropAI endpoint: ${fetchError.message}`,
        help: '🔧 Possible fixes:\n\n1. Check if PropAI Live is deployed at: ' + PROPAI_URL + '\n2. Verify the endpoint URL is correct\n3. Check network/firewall settings\n\n💡 PropAI sync is optional - property parsing works without it!'
      });
    }

    // Handle 404 specifically
    if (response.status === 404) {
      return Response.json({
        success: false,
        error: 'PropAI Endpoint Not Found (404)',
        details: `The endpoint ${PROPAI_URL} returned 404 - it might not be deployed yet.`,
        help: '🚀 To set up PropAI Live:\n\n1. Deploy the PropAI Live Deno app to Deno Deploy\n2. Create an endpoint at /api/receive that accepts POST requests\n3. Verify the URL matches: ' + PROPAI_URL + '\n\n💡 Meanwhile, property parsing works fine without PropAI sync!\n\nIf you don\'t need PropAI, you can remove the PROPAI_LIVE_API_KEY from environment variables.'
      });
    }

    // Handle other errors
    if (!response.ok) {
      return Response.json({
        success: false,
        error: `PropAI Error (HTTP ${response.status})`,
        details: responseText,
        possible_causes: [
          response.status === 401 || response.status === 403 ? '🔑 Invalid API key' : '❌ Server error',
          '🔌 PropAI endpoint configuration issue',
          '🔐 API key mismatch between Chariot and PropAI'
        ],
        connection_info: {
          endpoint: PROPAI_URL,
          status_code: response.status,
          api_key_preview: PROPAI_API_KEY.substring(0, 8) + '...'
        },
        help: 'Check PropAI Live logs for more details'
      });
    }

    // Success!
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { raw_response: responseText };
    }

    console.log('✅ PropAI connection successful!');

    return Response.json({
      success: true,
      message: '✅ PropAI Live Connected Successfully!',
      propai_response: parsedResponse,
      connection_details: {
        endpoint: PROPAI_URL,
        api_key_set: true,
        api_key_preview: PROPAI_API_KEY.substring(0, 8) + '...',
        response_status: response.status,
        timestamp: new Date().toISOString()
      },
      next_steps: 'PropAI sync is active. Property data will be synced automatically in the background.'
    });

  } catch (error) {
    console.error('❌ PropAI connection test failed:', error);
    return Response.json({ 
      success: false,
      error: `Unexpected Error: ${error.message}`,
      stack: error.stack,
      help: 'Check Deno logs for more details. PropAI sync is optional - property parsing works without it.'
    });
  }
});