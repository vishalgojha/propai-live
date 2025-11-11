import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== SOCIAL IMAGE GENERATION START ===');
  
  try {
    const rawBody = await req.text();
    console.log('Request body:', rawBody);
    
    const requestBody = JSON.parse(rawBody);
    const { property_id } = requestBody;
    
    if (!property_id) {
      return Response.json({ success: false, error: 'property_id required' }, { status: 400 });
    }

    const bodyForSDK = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: rawBody
    });
    
    const base44 = createClientFromRequest(bodyForSDK);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await base44.asServiceRole.entities.Property.list();
    const property = properties.find(p => p.id === property_id);
    
    if (!property) {
      return Response.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    console.log('Property found:', property.ai_title);

    const appUrl = req.headers.get('origin') || 'https://propai.live';
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}`;

    console.log('Target URL:', pageUrl);

    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      return Response.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }

    const endpoint = `https://production-sfo.browserless.io/screenshot?token=${browserlessApiKey}`;
    
    console.log('Calling Browserless...');

    const screenshotResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      })
    });

    console.log('Response status:', screenshotResponse.status);

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('Browserless error:', errorText);
      return Response.json({ 
        success: false, 
        error: `Browserless error (${screenshotResponse.status}): ${errorText}` 
      }, { status: 500 });
    }

    const imageBytes = await screenshotResponse.arrayBuffer();
    console.log('Image bytes:', imageBytes.byteLength);

    if (imageBytes.byteLength === 0) {
      return Response.json({ success: false, error: 'Empty screenshot' }, { status: 500 });
    }

    const imageBlob = new Blob([imageBytes], { type: 'image/png' });
    const fileName = `social-${property_id}-${Date.now()}.png`;
    const imageFile = new File([imageBlob], fileName, { type: 'image/png' });

    console.log('Uploading:', fileName);

    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
      file: imageFile
    });

    if (!uploadResult.file_url) {
      return Response.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }

    console.log('SUCCESS! Image URL:', uploadResult.file_url);

    return Response.json({
      success: true,
      image_url: uploadResult.file_url,
      property_id: property_id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    return Response.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
});