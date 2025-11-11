import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Generate Property Social Image
 * 
 * Uses Browserless.io to take a screenshot of the SocialListing page
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

    // Call Browserless screenshot API - FIXED FORMAT
    // Correct endpoint: https://chrome.browserless.io/screenshot?token=YOUR_TOKEN
    const browserlessUrl = `https://chrome.browserless.io/screenshot?token=${browserlessApiKey}`;
    
    console.log('📸 Calling Browserless API...');

    const screenshotResponse = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pageUrl,
        options: {
          fullPage: false,
          type: 'png',
          viewport: {
            width: 1200,
            height: 630,
            deviceScaleFactor: 2 // High DPI for sharp images
          }
        },
        waitFor: 3000 // Wait 3 seconds for page to fully render (increased from 2s)
      })
    });

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('❌ Browserless API error:', errorText);
      return Response.json({ 
        success: false, 
        error: `Browserless API error (${screenshotResponse.status}): ${errorText}` 
      }, { status: 500 });
    }

    console.log('✅ Screenshot captured successfully');

    // Get image buffer
    const imageBuffer = await screenshotResponse.arrayBuffer();
    
    // Create a Blob from the buffer
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    
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