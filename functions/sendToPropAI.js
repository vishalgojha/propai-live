import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Send Data to PropAI Live - WITH USER AUTHENTICATION
 * 
 * This function forwards property, requirement, building, location, and broker data
 * from Chariot Realty to PropAI Live for centralized data management.
 */

Deno.serve(async (req) => {
  try {
    // 🔐 AUTHENTICATE USER FIRST
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 });
    }

    // Parse the request payload
    const { data_type, data, source_app } = await req.json();

    if (!data_type || !data) {
      return Response.json({ 
        error: 'Missing required fields: data_type, data' 
      }, { status: 400 });
    }

    // 🔐 Load PropAI secret key from environment
    const apiKey = Deno.env.get('PROPAI_LIVE_API_KEY');
    if (!apiKey) {
      return Response.json({ 
        error: 'PROPAI_LIVE_API_KEY not configured in environment secrets' 
      }, { status: 500 });
    }

    // 🛰️ PropAI Live endpoint
    const PROPAI_APP_ID = '6904873ecc87e0c213ac013f';
    const propAIUrl = `https://app.base44.com/api/apps/${PROPAI_APP_ID}/functions/receiveFromChariotParser`;

    console.log(`📤 [${user.email}] Sending ${data_type} to PropAI Live`);
    console.log(`🔑 API Key loaded: YES (length: ${apiKey.length})`);
    console.log(`📦 Data payload:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');

    // 🚀 Send data to PropAI
    const response = await fetch(propAIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        data_type,
        data,
        source_app: source_app || 'Chariot Parser',
        timestamp: new Date().toISOString(),
        sent_by: user.email // Track who sent the data
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ PropAI Live accepted ${data_type}:`, result);
    } else {
      console.error(`❌ PropAI Live rejected ${data_type}:`, result);
    }

    return Response.json(result, { status: response.status });

  } catch (error) {
    console.error('❌ sendToPropAI error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      details: 'Check function logs for more info'
    }, { status: 500 });
  }
});