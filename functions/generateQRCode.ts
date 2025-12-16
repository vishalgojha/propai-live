import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import QRCode from 'npm:qrcode@1.5.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { text, size = 300, format = 'png' } = await req.json();

    if (!text) {
      return Response.json({ error: 'text parameter required' }, { status: 400 });
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    // If format is 'image', return the image directly
    if (format === 'image') {
      const base64Data = qrDataUrl.split(',')[1];
      const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      return new Response(imageData, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline; filename=qrcode.png'
        }
      });
    }

    // Return as JSON with data URL
    return Response.json({
      success: true,
      qrCodeDataUrl: qrDataUrl,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});