import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Generate Property Social Image
 * 
 * Uses Browserless.io BrowserQL (GraphQL API) to take a screenshot of the SocialListing page
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
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}&token=propai-screenshot-2025`;

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

    const endpoint = "https://production-sfo.browserless.io/chromium/bql";
    const fullUrl = `${endpoint}?token=${browserlessApiKey}`;
    
    console.log('📸 Calling Browserless BrowserQL...');

    // ✅ CORRECTED: Remove invalid wait() - use networkidle + delay in goto
    const graphqlBody = {
      query: `
        mutation Screenshot($url: String!) {
          goto(url: $url, waitUntil: networkidle, timeout: 30000) {
            status
          }
          screenshot(type: png, fullPage: false, clip: { x: 0, y: 0, width: 1200, height: 630 }) {
            base64
          }
        }
      `,
      variables: {
        url: pageUrl
      }
    };

    console.log('📦 GraphQL query:', JSON.stringify(graphqlBody.variables));

    let screenshotResponse;
    try {
      console.log('🌐 Fetching from:', endpoint);
      screenshotResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlBody)
      });
      console.log('📥 Got response, status:', screenshotResponse.status);
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

    let responseData;
    try {
      const responseText = await screenshotResponse.text();
      console.log('📦 Response length:', responseText.length);
      console.log('📦 Response preview:', responseText.substring(0, 200));
      responseData = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully');
    } catch (jsonError) {
      console.error('❌ JSON parse error:', jsonError.message);
      return Response.json({ 
        success: false, 
        error: 'Invalid JSON from Browserless: ' + jsonError.message 
      }, { status: 500 });
    }
    
    if (responseData.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(responseData.errors, null, 2));
      return Response.json({ 
        success: false, 
        error: `GraphQL error: ${JSON.stringify(responseData.errors)}` 
      }, { status: 500 });
    }

    console.log('📦 Response data keys:', Object.keys(responseData));
    console.log('📦 Response.data keys:', responseData.data ? Object.keys(responseData.data) : 'null');

    const base64Image = responseData.data?.screenshot?.base64;
    
    if (!base64Image) {
      console.error('❌ No base64 in response');
      console.error('Full response:', JSON.stringify(responseData, null, 2));
      return Response.json({ 
        success: false, 
        error: 'No screenshot data returned',
        response: responseData
      }, { status: 500 });
    }

    console.log('✅ Screenshot captured! Length:', base64Image.length);

    let bytes;
    try {
      const binaryString = atob(base64Image);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('✅ Base64 decoded, bytes:', bytes.length);
    } catch (decodeError) {
      console.error('❌ Base64 decode failed:', decodeError.message);
      return Response.json({ 
        success: false, 
        error: 'Base64 decode failed: ' + decodeError.message 
      }, { status: 500 });
    }
    
    const imageBlob = new Blob([bytes], { type: 'image/png' });
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