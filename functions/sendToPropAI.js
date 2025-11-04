// functions/sendToPropAI.js
Deno.serve(async (req) => {
  try {
    // Parse the request payload
    const { data_type, data, source_app } = await req.json();

    if (!data_type || !data) {
      return Response.json({ error: 'Missing required fields: data_type, data' }, { status: 400 });
    }

    // 🔐 Load PropAI secret key from environment
    const apiKey = Deno.env.get('PROPAI_LIVE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'PROPAI_LIVE_API_KEY not configured' }, { status: 500 });
    }

    // 🛰️ Your PropAI app URL
    const PROPAI_APP_ID = '6904873ecc87e0c213ac013f';
    const propAIUrl = `https://app.base44.com/api/apps/${PROPAI_APP_ID}/functions/receiveFromChariotParser`;

    console.log(`📤 Sending ${data_type} to PropAI Live at: ${propAIUrl}`);
    console.log(`🔑 API Key loaded: ${apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO'}`);

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
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();
    console.log('✅ PropAI Live responded:', result);

    return Response.json(result, { status: response.status });
  } catch (error) {
    console.error('❌ sendToPropAI error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});