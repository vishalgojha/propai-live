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
  console.log('🚀 Function invoked');
  
  let base44;
  
  try {
    const rawBody = await req.text();
    console.log('📦 Request body:', rawBody);
    
    let requestBody;
    try {
      requestBody = JSON.parse(rawBody);
    } catch (parseError) {
      return Response.json({ 
        success: false, 
        error: 'Invalid JSON: ' + parseError.message
      }, { status: 400 });
    }

    const { property_id } = requestBody;
    
    if (!property_id) {
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
    
    base44 = createClientFromRequest(bodyForSDK);
    
    let user;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      return Response.json({ 
        success: false, 
        error: 'Authentication failed: ' + authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('✅ User:', user.email);

    let properties;
    try {
      properties = await base44.asServiceRole.entities.Property.list();
    } catch (dbError) {
      return Response.json({ 
        success: false, 
        error: 'DB error: ' + dbError.message 
      }, { status: 500 });
    }
    
    const property = properties.find(p => p.id === property_id);
    
    if (!property) {
      return Response.json({ 
        success: false, 
        error: 'Property not found'
      }, { status: 404 });
    }

    console.log('✅ Property found:', property.ai_title || property.bhk);

    const appUrl = req.headers.get('origin') || 'https://propai.live';
    
    // ✅ ADD SECRET TOKEN to bypass login gate
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}&token=propai-screenshot-2025`;

    console.log('🔍 Target URL:', pageUrl);

    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      return Response.json({ 
        success: false, 
        error: 'BROWSERLESS_API_KEY not configured' 
      }, { status: 500 });
    }

    const endpoint = "https://production-sfo.browserless.io/chromium/bql";
    const fullUrl = `${endpoint}?token=${browserlessApiKey}`;
    
    console.log('📸 Calling Browserless...');

    // ✅ ADD WAIT TIME for page to fully render
    const graphqlBody = {
      query: `
        mutation Screenshot($url: String!) {
          goto(url: $url, waitUntil: networkidle) {
            status
          }
          wait(ms: 3000)
          screenshot(type: png, fullPage: false, clip: { x: 0, y: 0, width: 1200, height: 630 }) {
            base64
          }
        }
      `,
      variables: {
        url: pageUrl
      }
    };

    let screenshotResponse;
    try {
      screenshotResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlBody)
      });
    } catch (fetchError) {
      return Response.json({ 
        success: false, 
        error: 'Browserless connection failed: ' + fetchError.message 
      }, { status: 500 });
    }

    console.log('📥 Response status:', screenshotResponse.status);

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      return Response.json({ 
        success: false, 
        error: `Browserless error (${screenshotResponse.status}): ${errorText}` 
      }, { status: 500 });
    }

    let responseData;
    try {
      const responseText = await screenshotResponse.text();
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      return Response.json({ 
        success: false, 
        error: 'Invalid JSON from Browserless: ' + jsonError.message 
      }, { status: 500 });
    }
    
    if (responseData.errors) {
      return Response.json({ 
        success: false, 
        error: `GraphQL error: ${JSON.stringify(responseData.errors)}` 
      }, { status: 500 });
    }

    const base64Image = responseData.data?.screenshot?.base64;
    
    if (!base64Image) {
      return Response.json({ 
        success: false, 
        error: 'No screenshot data returned'
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
    } catch (decodeError) {
      return Response.json({ 
        success: false, 
        error: 'Base64 decode failed: ' + decodeError.message 
      }, { status: 500 });
    }
    
    const imageBlob = new Blob([bytes], { type: 'image/png' });
    const fileName = `social-${property_id}-${Date.now()}.png`;
    const imageFile = new File([imageBlob], fileName, { type: 'image/png' });

    console.log('⬆️ Uploading:', fileName);

    let uploadResult;
    try {
      uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
        file: imageFile
      });
    } catch (uploadError) {
      return Response.json({ 
        success: false, 
        error: 'Upload failed: ' + uploadError.message 
      }, { status: 500 });
    }

    if (!uploadResult.file_url) {
      return Response.json({ 
        success: false, 
        error: 'No file URL returned'
      }, { status: 500 });
    }

    console.log('🎉 SUCCESS! URL:', uploadResult.file_url);

    return Response.json({
      success: true,
      image_url: uploadResult.file_url,
      property_id: property_id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    return Response.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
});