import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse request body
    const { 
      property_id, 
      broker_id, 
      interaction_type,
      broker_contact,
      contacted_via 
    } = await req.json();

    // Validate required fields
    if (!property_id || !interaction_type) {
      return Response.json({
        success: false,
        error: 'Missing required fields: property_id and interaction_type are required'
      }, { status: 400 });
    }

    // Get user info (if logged in)
    let user = null;
    let user_id = null;
    let user_email = null;
    let user_name = null;
    
    try {
      user = await base44.auth.me();
      if (user) {
        user_id = user.id;
        user_email = user.email;
        user_name = user.full_name;
      }
    } catch (error) {
      // User not logged in - that's okay, we'll use anonymous tracking
    }

    // Generate session ID from request (use IP + user agent hash)
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const sessionId = btoa(`${ip}-${userAgent}`).substring(0, 32);

    // Detect device type
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    const device_type = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    // Create interaction record
    const interactionData = {
      property_id,
      broker_id: broker_id || null,
      user_id: user_id || null,
      interaction_type,
      user_email: user_email || null,
      user_name: user_name || null,
      session_id: sessionId,
      device_type,
      source: 'smartfeed', // Default to smartfeed, can be customized later
      metadata: {
        broker_contact: broker_contact || null,
        contacted_via: contacted_via || null,
        timestamp: new Date().toISOString(),
        user_agent: userAgent,
        referrer: req.headers.get('referer') || null
      }
    };

    // Save to database using service role (no RLS restrictions)
    const interaction = await base44.asServiceRole.entities.PropertyInteraction.create(interactionData);

    return Response.json({
      success: true,
      interaction_id: interaction.id,
      message: 'Contact interaction tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking contact interaction:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to track interaction'
    }, { status: 500 });
  }
});