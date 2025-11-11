import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * generatePropertyShareImage - Creates shareable social media images
 * 
 * Uses Browserless.io to screenshot the SocialSharePropertyCard component
 * Saves the image to Base44 storage and returns the public URL
 * 
 * @param {string} property_id - Property ID to generate image for
 * @returns {object} { success: boolean, image_url: string, error?: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get request body
    const { property_id } = await req.json();
    
    if (!property_id) {
      return Response.json({ 
        success: false, 
        error: 'property_id is required' 
      }, { status: 400 });
    }

    // Fetch property data
    const properties = await base44.entities.Property.list();
    const property = properties.find(p => p.id === property_id);

    if (!property) {
      return Response.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }

    // Get Browserless API key
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      return Response.json({ 
        success: false, 
        error: 'BROWSERLESS_API_KEY not configured' 
      }, { status: 500 });
    }

    // Build the URL to screenshot
    // This will be a special route that renders just the SocialSharePropertyCard
    const baseUrl = req.headers.get('origin') || 'https://your-app.base44.com';
    const screenshotUrl = `${baseUrl}/social-share-preview?id=${property_id}`;

    // Call Browserless API to take screenshot
    const browserlessResponse = await fetch(
      `https://chrome.browserless.io/screenshot?token=${browserlessApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: screenshotUrl,
          options: {
            fullPage: false,
            type: 'jpeg',
            quality: 90,
          },
          viewport: {
            width: 1200,
            height: 630,
            deviceScaleFactor: 2, // High DPI for better quality
          },
          waitFor: 1000, // Wait 1 second for fonts/images to load
        }),
      }
    );

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      return Response.json({ 
        success: false, 
        error: `Browserless API error: ${errorText}` 
      }, { status: 500 });
    }

    // Get the image as a blob
    const imageBlob = await browserlessResponse.blob();
    
    // Convert blob to File for upload
    const imageFile = new File(
      [imageBlob], 
      `property-share-${property_id}-${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    );

    // Upload to Base44 storage
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ 
      file: imageFile 
    });

    if (!uploadResult || !uploadResult.file_url) {
      return Response.json({ 
        success: false, 
        error: 'Failed to upload image to storage' 
      }, { status: 500 });
    }

    // Update property with the share image URL (optional - for caching)
    await base44.asServiceRole.entities.Property.update(property_id, {
      social_share_image: uploadResult.file_url,
      last_share_image_generated: new Date().toISOString()
    });

    return Response.json({
      success: true,
      image_url: uploadResult.file_url,
      property_id: property_id
    });

  } catch (error) {
    console.error('generatePropertyShareImage error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});