import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { property_id } = body;
    
    if (!property_id) {
      return Response.json({ success: false, error: 'property_id required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await base44.asServiceRole.entities.Property.list();
    const property = properties.find(p => p.id === property_id);
    
    if (!property) {
      return Response.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    const appUrl = req.headers.get('origin') || 'https://propai.live';
    const pageUrl = `${appUrl}/sociallisting?id=${property_id}`;

    const apiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!apiKey) {
      return Response.json({ success: false, error: 'API key missing' }, { status: 500 });
    }

    const endpoint = `https://production-sfo.browserless.io/screenshot?token=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageUrl,
        options: {
          fullPage: false,
          type: 'png',
          clip: { x: 0, y: 0, width: 1200, height: 630 }
        },
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 30000
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ success: false, error }, { status: 500 });
    }

    const imageBytes = await response.arrayBuffer();
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });
    const imageFile = new File([imageBlob], `social-${property_id}.png`, { type: 'image/png' });

    const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: imageFile });

    return Response.json({
      success: true,
      image_url: upload.file_url,
      property_id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});