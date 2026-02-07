import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * OpenClaw Webhook Endpoint
 * 
 * Receives WhatsApp group messages from OpenClaw silent listener
 * Processes and stores property/requirement data from broker groups
 * 
 * POST /api/functions/openclawWebhook
 * Authorization: Bearer propai_internal_v1_token
 * Content-Type: application/json
 */

Deno.serve(async (req) => {
  try {
    console.log('📥 OpenClaw webhook triggered');

    // ✅ VERIFY TOKEN
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('OPENCLAW_TOKEN') || 'propai_internal_v1_token';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ Missing authorization header');
      return Response.json({ 
        status: 'error',
        message: 'Missing authorization header' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== expectedToken) {
      console.warn('⚠️ Invalid token');
      return Response.json({ 
        status: 'error',
        message: 'Invalid token' 
      }, { status: 401 });
    }

    // ✅ PARSE PAYLOAD
    let payload;
    try {
      payload = await req.json();
      console.log('✓ Payload received:', {
        source: payload.source,
        agent: payload.agent?.name,
        group: payload.message?.group_name,
        sender: payload.message?.sender_name
      });
    } catch (jsonError) {
      console.error('❌ Invalid JSON:', jsonError.message);
      return Response.json({ 
        status: 'error',
        message: 'Invalid JSON payload' 
      }, { status: 400 });
    }

    // ✅ VALIDATE REQUIRED FIELDS
    if (!payload.message?.raw_text) {
      console.warn('⚠️ Missing raw_text');
      return Response.json({ 
        status: 'error',
        message: 'Missing message.raw_text' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // ✅ DETERMINE IF PROPERTY OR REQUIREMENT
    const intent = payload.extracted?.intent || 'unknown';
    const isRequirement = intent === 'buy' || intent === 'rent' || payload.message.raw_text.toLowerCase().includes('required');

    console.log(`✓ Detected intent: ${intent} → ${isRequirement ? 'REQUIREMENT' : 'PROPERTY'}`);

    // ✅ PARSE MESSAGE USING EXISTING FUNCTIONS
    let parseResult;
    try {
      if (isRequirement) {
        // Parse as requirement
        parseResult = await base44.asServiceRole.functions.invoke('parseRequirementFromMessage', {
          message: payload.message.raw_text
        });
        console.log('✓ Parsed as requirement:', parseResult.data?.requirement?.custom_id);
      } else {
        // Parse as property
        parseResult = await base44.asServiceRole.functions.invoke('parsePropertyFromMessage', {
          message: payload.message.raw_text
        });
        console.log('✓ Parsed as property:', parseResult.data?.property?.custom_id);
      }

      // ✅ LOG SUCCESS METRICS
      console.log('📊 OpenClaw metrics:', {
        group: payload.message?.group_name,
        broker_confidence: payload.meta?.broker_confidence_score,
        city: payload.meta?.city,
        parsed_type: isRequirement ? 'requirement' : 'property',
        result_id: parseResult.data?.property?.custom_id || parseResult.data?.requirement?.custom_id
      });

      return Response.json({ 
        status: 'ok',
        parsed: isRequirement ? 'requirement' : 'property',
        id: parseResult.data?.property?.custom_id || parseResult.data?.requirement?.custom_id
      });

    } catch (parseError) {
      console.error('❌ Parse failed:', parseError.message);
      
      // Still return 200 OK to OpenClaw (don't break their flow)
      return Response.json({ 
        status: 'ok',
        note: 'Received but parse failed',
        error: parseError.message
      });
    }

  } catch (error) {
    console.error('❌ OpenClaw webhook error:', error.message);
    
    // Always return 200 to OpenClaw (graceful degradation)
    return Response.json({ 
      status: 'ok',
      note: 'Received with error',
      error: error.message
    });
  }
});