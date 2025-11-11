import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Parity Logging - Compare client-side AI output with backend
 * Non-blocking, used for monitoring drift and quality
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // No auth required - this is just logging
    // But we'll track who's logging for debugging
    let userId = null;
    try {
      const user = await base44.auth.me();
      userId = user?.id;
    } catch {
      // Anonymous logging allowed
    }

    const body = await req.json();
    const { 
      property_id, 
      client_title, 
      client_description,
      enrichment_time_ms,
      session_id 
    } = body;

    if (!property_id) {
      return Response.json({ 
        success: false, 
        error: 'property_id required' 
      }, { status: 400 });
    }

    // Store parity log
    const logEntry = {
      property_id,
      client_title,
      client_description,
      enrichment_time_ms,
      session_id,
      user_id: userId,
      timestamp: new Date().toISOString(),
      client_version: 'v1.0',
    };

    // Store in a simple JSON array in environment variable or file
    // For production: use a proper logging service or database table
    console.log('[PARITY_LOG]', JSON.stringify(logEntry));

    // Optional: Compare with backend-generated version
    // (only if backend function still exists for comparison)
    let drift = null;
    let backend_title = null;
    let backend_description = null;

    // You can uncomment this if you want to compare with backend
    /*
    try {
      const backendResult = await base44.asServiceRole.functions.invoke(
        'generatePropertyDescriptions', 
        { property_id }
      );
      
      backend_title = backendResult.data.title;
      backend_description = backendResult.data.description;
      
      // Calculate drift metrics
      drift = {
        title_length_diff: Math.abs(client_title.length - backend_title.length),
        desc_length_diff: Math.abs(client_description.length - backend_description.length),
        title_match: client_title === backend_title,
        desc_match: client_description === backend_description,
      };
      
      console.log('[PARITY_DRIFT]', JSON.stringify(drift));
    } catch (error) {
      console.log('[PARITY_ERROR]', error.message);
    }
    */

    return Response.json({
      success: true,
      logged_at: logEntry.timestamp,
      drift,
    });

  } catch (error) {
    console.error('[PARITY_LOG_ERROR]', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});