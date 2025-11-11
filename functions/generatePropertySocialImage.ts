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
  let base44;
  
  try {
    base44 = createClientFromRequest(req);
    
    console.log('🔐 Authenticating user...');
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      console.log('❌ No user authenticated');
      return Response.json({ 
        success: false, 
        error: 'Unauthorized - login required' 
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return Response.json({ 
        success: false, 
        error: 'Invalid request body - must be valid JSON' 
      }, { status: 400 });
    }

    const { property_id } = requestBody;
    
    if (!property_id) {
      console.log('❌ No property_id provided');
      return Response.json({ 
        success: false, 
        error: 'property_id is required' 
      }, { status: 400 });
    }

    console.log('🔍 Looking for property:', property_id);

    // Fetch property to validate it exists
    let properties;
    try {
      properties = await base44.asServiceRole.entities.Property.list();
    } catch (dbError) {
      console.error('❌ Failed to fetch properties:', dbError);
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch property data: ' + dbError.message 
      }, { status: 500 });
    }
    
    const property = properties.find(p => p.id === property_id);
    
    if (!property) {
      console.log('❌ Property not found');
      return Response.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }

    console.log('✅ Property found:', property.ai_title || property.bhk);

    // Get the base URL for the app
    const appUrl = req.headers.get('origin') || 'https://propai.live';
    
    // Construct the SocialListing page URL with property ID
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}`;

    console.log('🔍 Screenshot target URL:', pageUrl);

    // Get Browserless API key
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      console.error('❌ BROWSERLESS_API_KEY not found in environment');
      return Response.json({ 
        success: false, 
        error: 'BROWSERLESS_API_KEY not configured' 
      }, { status: 500 });
    }

    console.log('🔑 API key found:', browserlessApiKey.substring(0, 15) + '...');

    // BrowserQL endpoint
    const endpoint = "https://production-sfo.browserless.io/chromium/bql";
    const fullUrl = `${endpoint}?token=${browserlessApiKey}`;
    
    console.log('📸 Calling Browserless BrowserQL API...');
    console.log('📍 Endpoint:', endpoint);

    // Prepare GraphQL request body
    const graphqlBody = {
      query: `
        mutation Screenshot($url: String!) {
          goto(url: $url, waitUntil: load) {
            status
          }
          screenshot(type: png, options: { fullPage: false, clip: { x: 0, y: 0, width: 1200, height: 630 } }) {
            base64
          }
        }
      `,
      variables: {
        url: pageUrl
      }
    };

    console.log('📦 Request body:', JSON.stringify(graphqlBody, null, 2));

    // Call Browserless BrowserQL API
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
      console.error('❌ Fetch error:', fetchError);
      return Response.json({ 
        success: false, 
        error: 'Failed to connect to Browserless: ' + fetchError.message 
      }, { status: 500 });
    }

    console.log('📥 Response status:', screenshotResponse.status);
    console.log('📥 Response headers:', Object.fromEntries(screenshotResponse.headers.entries()));

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('❌ Browserless API error response:', errorText);
      return Response.json({ 
        success: false, 
        error: `Browserless API error (${screenshotResponse.status}): ${errorText}` 
      }, { status: 500 });
    }

    let responseData;
    try {
      const responseText = await screenshotResponse.text();
      console.log('📦 Raw response (first 500 chars):', responseText.substring(0, 500));
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError);
      return Response.json({ 
        success: false, 
        error: 'Invalid JSON response from Browserless: ' + jsonError.message 
      }, { status: 500 });
    }
    
    console.log('📦 Response data keys:', Object.keys(responseData));
    
    // Check for GraphQL errors
    if (responseData.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(responseData.errors, null, 2));
      return Response.json({ 
        success: false, 
        error: `GraphQL error: ${JSON.stringify(responseData.errors)}` 
      }, { status: 500 });
    }

    console.log('✅ Screenshot captured successfully');

    // Extract base64 image from response
    const base64Image = responseData.data?.screenshot?.base64;
    
    if (!base64Image) {
      console.error('❌ No screenshot data. Full response:', JSON.stringify(responseData, null, 2));
      return Response.json({ 
        success: false, 
        error: 'No screenshot data returned from Browserless' 
      }, { status: 500 });
    }

    console.log('🖼️ Base64 image length:', base64Image.length);

    // Convert base64 to buffer
    let bytes;
    try {
      const binaryString = atob(base64Image);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } catch (decodeError) {
      console.error('❌ Failed to decode base64:', decodeError);
      return Response.json({ 
        success: false, 
        error: 'Failed to decode base64 image: ' + decodeError.message 
      }, { status: 500 });
    }
    
    // Create a Blob from the buffer
    const imageBlob = new Blob([bytes], { type: 'image/png' });
    
    console.log('📦 Blob created. Size:', imageBlob.size, 'bytes');
    
    // Create a File object for upload
    const fileName = `social-${property_id}-${Date.now()}.png`;
    const imageFile = new File([imageBlob], fileName, { type: 'image/png' });

    console.log('⬆️ Uploading to Base44 storage as:', fileName);

    // Upload to Base44 storage
    let uploadResult;
    try {
      uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
        file: imageFile
      });
    } catch (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return Response.json({ 
        success: false, 
        error: 'Failed to upload image to storage: ' + uploadError.message 
      }, { status: 500 });
    }

    if (!uploadResult.file_url) {
      console.error('❌ No file_url in upload result:', uploadResult);
      return Response.json({ 
        success: false, 
        error: 'Failed to upload image to storage - no URL returned' 
      }, { status: 500 });
    }

    console.log('✅ Image uploaded successfully:', uploadResult.file_url);

    // Return success with image URL
    return Response.json({
      success: true,
      image_url: uploadResult.file_url,
      property_id: property_id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Stack trace:', error.stack);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      name: error.name
    }, { status: 500 });
  }
});