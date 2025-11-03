import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data_type, data, source_app } = await req.json();
    
    if (!data_type || !data) {
      return Response.json({ 
        error: 'Missing required fields: data_type, data' 
      }, { status: 400 });
    }
    
    const apiKey = Deno.env.get('PROPAI_LIVE_API_KEY');
    
    if (!apiKey) {
      return Response.json({ 
        error: 'PROPAI_LIVE_API_KEY not configured' 
      }, { status: 500 });
    }
    
    // PropAI Live function URL - UPDATE THIS WITH YOUR ACTUAL URL
    const propAIUrl = 'https://YOUR-PROPAI-APP.base44.app/api/functions/receiveFromChariotParser';
    
    console.log(`📤 Sending ${data_type} to PropAI Live...`);
    
    const response = await fetch(propAIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        data_type,
        data,
        source_app: source_app || 'Chariot Realty',
        timestamp: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ PropAI Live rejected:', result);
      return Response.json({ 
        success: false,
        error: result.error || 'PropAI Live rejected the data',
        details: result
      }, { status: response.status });
    }
    
    console.log('✅ Successfully sent to PropAI Live:', result);
    
    return Response.json({
      success: true,
      propai_response: result,
      sent_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error sending to PropAI Live:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});