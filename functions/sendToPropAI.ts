import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PropAI Live Sync Function
 * 
 * Sends property data to PropAI Live (external analytics/CRM system)
 * Gracefully handles failures - this is a non-blocking background task
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { data_type, data } = await req.json();
    
    if (!data_type || !data) {
      return Response.json({ 
        success: false,
        error: 'data_type and data are required' 
      }, { status: 400 });
    }

    const PROPAI_URL = Deno.env.get('PROPAI_LIVE_URL') || 'https://propai-live.deno.dev/api/receive';
    const PROPAI_API_KEY = Deno.env.get('PROPAI_LIVE_API_KEY');

    // If no API key is set, skip silently (PropAI is optional)
    if (!PROPAI_API_KEY) {
      console.log('⚠️ PROPAI_LIVE_API_KEY not set - skipping sync');
      return Response.json({
        success: true,
        skipped: true,
        reason: 'API key not configured'
      });
    }

    const payload = {
      data_type,
      data,
      source: 'chariot_realty',
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Syncing to PropAI: ${data_type}`);

    let response;
    try {
      response = await fetch(PROPAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PROPAI_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Handle 404 gracefully - endpoint might not exist yet
        if (response.status === 404) {
          console.warn('⚠️ PropAI endpoint not found (404) - endpoint might not be deployed yet');
          return Response.json({
            success: true,
            skipped: true,
            reason: 'PropAI endpoint not deployed (404)'
          });
        }

        // Other errors
        const errorText = await response.text();
        console.error(`❌ PropAI sync failed (${response.status}):`, errorText);
        
        return Response.json({
          success: false,
          error: `PropAI rejected: HTTP ${response.status}`,
          details: errorText
        });
      }

      const result = await response.json();
      console.log('✅ PropAI sync successful');

      return Response.json({
        success: true,
        propai_response: result
      });

    } catch (fetchError) {
      // Network errors - endpoint might be down
      console.warn('⚠️ PropAI sync network error:', fetchError.message);
      
      return Response.json({
        success: true,
        skipped: true,
        reason: `Network error: ${fetchError.message}`
      });
    }

  } catch (error) {
    console.error('❌ sendToPropAI error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});