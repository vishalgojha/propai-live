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
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized - login required' 
      }, { status: 401 });
    }

    // Parse request body
    const { property_id } = await req.json();
    
    if (!property_id) {
      return Response.json({ 
        success: false, 
        error: 'property_id is required' 
      }, { status: 400 });
    }

    // Fetch property to validate it exists
    const properties = await base44.asServiceRole.entities.Property.list();
    const property = properties.find(p => p.id === property_id);
    
    if (!property) {
      return Response.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }

    // Get the base URL for the app
    const appUrl = req.headers.get('origin') || 'https://propai.live';
    
    // Construct the SocialListing page URL with property ID
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}`;

    console.log('🔍 Generating screenshot for:', pageUrl);

    // Get Browserless API key
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      return Response.json({ 
        success: false, 
        error: 'BROWSERLESS_API_KEY not configured' 
      }, { status: 500 });
    }

    // BrowserQL endpoint
    const endpoint = "https://production-sfo.browserless.io/chromium/bql";
    
    console.log('📸 Calling Browserless BrowserQL API...');
    console.log('🔑 Using API key:', browserlessApiKey.substring(0, 10) + '...');

    // Call Browserless BrowserQL API with GraphQL mutation
    // Following the exact pattern from the working example
    const screenshotResponse = await fetch(`${endpoint}?token=${browserlessApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      })
    });

    console.log('📥 Response status:', screenshotResponse.status);

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('❌ Browserless API error:', errorText);
      return Response.json({ 
        success: false, 
        error: `Browserless API error (${screenshotResponse.status}): ${errorText}` 
      }, { status: 500 });
    }

    const responseData = await screenshotResponse.json();
    console.log('📦 Response data keys:', Object.keys(responseData));
    
    // Check for GraphQL errors
    if (responseData.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(responseData.errors));
      return Response.json({ 
        success: false, 
        error: `GraphQL error: ${JSON.stringify(responseData.errors)}` 
      }, { status: 500 });
    }

    console.log('✅ Screenshot captured successfully');

    // Extract base64 image from response
    const base64Image = responseData.data?.screenshot?.base64;
    
    if (!base64Image) {
      console.error('❌ No screenshot data in response:', JSON.stringify(responseData));
      return Response.json({ 
        success: false, 
        error: 'No screenshot data returned from Browserless' 
      }, { status: 500 });
    }

    console.log('🖼️ Base64 image length:', base64Image.length);

    // Convert base64 to buffer
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create a Blob from the buffer
    const imageBlob = new Blob([bytes], { type: 'image/png' });
    
    console.log('📦 Blob size:', imageBlob.size, 'bytes');
    
    // Create a File object for upload
    const fileName = `social-${property_id}-${Date.now()}.png`;
    const imageFile = new File([imageBlob], fileName, { type: 'image/png' });

    console.log('⬆️ Uploading to Base44 storage...');

    // Upload to Base44 storage
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
      file: imageFile
    });

    if (!uploadResult.file_url) {
      console.error('❌ Failed to upload image');
      return Response.json({ 
        success: false, 
        error: 'Failed to upload image to storage' 
      }, { status: 500 });
    }

    console.log('✅ Image uploaded:', uploadResult.file_url);

    // Return success with image URL
    return Response.json({
      success: true,
      image_url: uploadResult.file_url,
      property_id: property_id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating social image:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});