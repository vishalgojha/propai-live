import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Generate Property Social Image
 * 
 * Uses Browserless.io REST API to take a screenshot of the SocialListing page
 * Returns the uploaded image URL for use in Open Graph meta tags
 * 
 * @param {string} property_id - Property ID to generate image for
 * @returns {object} { success: boolean, image_url?: string, error?: string }
 */
Deno.serve(async (req) => {
  console.log('🚀 ========== FUNCTION START ==========');
  
  let base44;
  
  try {
    const rawBody = await req.text();
    console.log('📦 Raw body:', rawBody);
    
    let requestBody;
    try {
      requestBody = JSON.parse(rawBody);
      console.log('✅ Parsed body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return Response.json({ 
        success: false, 
        error: 'Invalid JSON: ' + parseError.message
      }, { status: 400 });
    }

    const { property_id } = requestBody;
    console.log('🔑 property_id:', property_id);
    
    if (!property_id) {
      console.error('❌ No property_id');
      return Response.json({ 
        success: false, 
        error: 'property_id is required'
      }, { status: 400 });
    }

    const bodyForSDK = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: rawBody
    });
    
    console.log('🔐 Creating SDK client...');
    base44 = createClientFromRequest(bodyForSDK);
    
    console.log('🔐 Authenticating...');
    let user;
    try {
      user = await base44.auth.me();
      console.log('✅ User authenticated:', user.email);
    } catch (authError) {
      console.error('❌ Auth error:', authError.message);
      return Response.json({ 
        success: false, 
        error: 'Authentication failed: ' + authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ No user');
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('📊 Fetching properties...');
    let properties;
    try {
      properties = await base44.asServiceRole.entities.Property.list();
      console.log('✅ Got', properties.length, 'properties');
    } catch (dbError) {
      console.error('❌ DB error:', dbError.message);
      return Response.json({ 
        success: false, 
        error: 'DB error: ' + dbError.message 
      }, { status: 500 });
    }
    
    const property = properties.find(p => p.id === property_id);
    
    if (!property) {
      console.error('❌ Property not found');
      return Response.json({ 
        success: false, 
        error: 'Property not found'
      }, { status: 404 });
    }

    console.log('✅ Property found:', property.ai_title || property.bhk);

    const appUrl = req.headers.get('origin') || 'https://propai.live';
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}`;

    console.log('🔍 Target URL:', pageUrl);

    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      console.error('❌ No API key');
      return Response.json({ 
        success: false, 
        error: 'BROWSERLESS_API_KEY not configured' 
      }, { status: 500 });
    }

    console.log('🔑 API key found');

    // ✅ SWITCH TO REST API - Much simpler and more reliable
    const endpoint = `https://production-sfo.browserless.io/screenshot?token=${browserlessApiKey}`;
    
    console.log('📸 Calling Browserless REST API...');
    console.log('🌐 Endpoint:', endpoint);

    const screenshotBody = {
      url: pageUrl,
      options: {
        fullPage: false,
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: 1200,
          height: 630
        }
      },
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout: 30000
      }
    };

    console.log('📦 Request body:', JSON.stringify(screenshotBody, null, 2));

    let screenshotResponse;
    try {
      screenshotResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(screenshotBody)
      });
      console.log('📥 Got response, status:', screenshotResponse.status);
      console.log('📥 Response headers:', Object.fromEntries(screenshotResponse.headers.entries()));
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
      console.error('Stack:', fetchError.stack);
      return Response.json({ 
        success: false, 
        error: 'Browserless connection failed: ' + fetchError.message 
      }, { status: 500 });
    }

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('❌ Browserless error response:', errorText);
      return Response.json({ 
        success: false, 
        error: `Browserless error (${screenshotResponse.status}): ${errorText}` 
      }, { status: 500 });
    }

    console.log('✅ Screenshot response received');
    
    // REST API returns raw image bytes
    const imageBytes = await screenshotResponse.arrayBuffer();
    console.log('✅ Image bytes received, length:', imageBytes.byteLength);

    if (imageBytes.byteLength === 0) {
      console.error('❌ Empty image data');
      return Response.json({ 
        success: false, 
        error: 'Empty screenshot data returned'
      }, { status: 500 });
    }

    const imageBlob = new Blob([imageBytes], { type: 'image/png' });
    console.log('📦 Blob size:', imageBlob.size);
    
    const fileName = `social-${property_id}-${Date.now()}.png`;
    const imageFile = new File([imageBlob], fileName, { type: 'image/png' });

    console.log('⬆️ Uploading:', fileName);

    let uploadResult;
    try {
      uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
        file: imageFile
      });
      console.log('✅ Upload successful');
      console.log('📦 Upload result:', JSON.stringify(uploadResult));
    } catch (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Stack:', uploadError.stack);
      return Response.json({ 
        success: false, 
        error: 'Upload failed: ' + uploadError.message 
      }, { status: 500 });
    }

    if (!uploadResult.file_url) {
      console.error('❌ No file_url in result');
      return Response.json({ 
        success: false, 
        error: 'No file URL returned'
      }, { status: 500 });
    }

    console.log('🎉 ========== SUCCESS! ==========');
    console.log('📸 Image URL:', uploadResult.file_url);

    return Response.json({
      success: true,
      image_url: uploadResult.file_url,
      property_id: property_id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ========== UNEXPECTED ERROR ==========');
    console.error('❌ Name:', error.name);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    
    return Response.json({ 
      success: false, 
      error: error.message,
      error_name: error.name
    }, { status: 500 });
  }
});