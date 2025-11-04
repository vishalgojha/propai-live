import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * sendToPropAI - Pure Data Sender
 * 
 * Job: Push structured truth from Chariot Parser to PropAI Live database
 * 
 * What it sends:
 * - Parsed property data
 * - Real broker attribution (broker_id, name, phone, agency)
 * - Building relationships
 * - Source metadata
 * 
 * What it DOESN'T do:
 * - No UI logic
 * - No hardcoded Vishal/Kapil
 * - No display formatting
 * 
 * PropAI Live receives authentic source data and decides what to do with it.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data_type, data } = await req.json();
    
    if (!data_type || !data) {
      return Response.json({ 
        error: 'data_type and data are required',
        example: {
          data_type: 'property',
          data: { /* property object */ }
        }
      }, { status: 400 });
    }

    const PROPAI_URL = 'https://propai-live.deno.dev/api/receive';
    const PROPAI_API_KEY = Deno.env.get('PROPAI_LIVE_API_KEY');

    if (!PROPAI_API_KEY) {
      return Response.json({ 
        error: 'PROPAI_LIVE_API_KEY not set in environment variables' 
      }, { status: 500 });
    }

    // Build payload with authentic source data
    const payload = {
      data_type,
      data: {
        ...data,
        // Metadata
        source: "chariot_parser",
        timestamp: new Date().toISOString(),
        parser_version: "2.0_broker_attribution"
      },
      // Authentication
      api_key: PROPAI_API_KEY
    };

    console.log('Sending to PropAI Live:', {
      data_type,
      property_id: data.custom_id || data.id,
      broker_id: data.broker_id,
      broker_name: data.broker_name,
      location: data.location
    });

    // Send to PropAI Live
    const response = await fetch(PROPAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PROPAI_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PropAI Live rejected request: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ PropAI Live accepted:', result);

    return Response.json({
      success: true,
      propai_response: result,
      sent_data: {
        data_type,
        property_id: data.custom_id || data.id,
        broker_attribution: {
          broker_id: data.broker_id,
          broker_name: data.broker_name,
          broker_phone: data.broker_phone,
          broker_agency: data.broker_agency
        }
      }
    });

  } catch (error) {
    console.error('sendToPropAI error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});