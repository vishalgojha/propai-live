import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Social Media Preview Handler
 * 
 * Serves property pages with proper Open Graph meta tags for social media scrapers.
 * Regular browsers are redirected to the React app.
 * 
 * Usage: 
 * - Set up as /propertydetails route handler
 * - Detects social media bot user agents
 * - Returns HTML with meta tags for bots
 * - Redirects to React app for regular users
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    
    // Extract property slug/ID from query params
    const propertySlug = url.searchParams.get('slug') || url.searchParams.get('id');
    
    if (!propertySlug) {
      return new Response('Property not found', { status: 404 });
    }

    // Check if request is from a social media bot
    const userAgent = req.headers.get('user-agent') || '';
    const isSocialBot = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Pinterest/i.test(userAgent);

    // ✅ Fetch property data (using service role for public access)
    const properties = await base44.asServiceRole.entities.Property.list();
    const property = properties.find(p => p.slug === propertySlug || p.id === propertySlug);

    if (!property) {
      return new Response('Property not found', { status: 404 });
    }

    // ✅ If NOT a social bot, redirect to React app
    if (!isSocialBot) {
      const appUrl = property.slug 
        ? `https://propai.live/propertydetails?slug=${property.slug}`
        : `https://propai.live/propertydetails?id=${property.id}`;
      
      return Response.redirect(appUrl, 302);
    }

    // ✅ Generate meta tags for social bots
    const title = property.ai_title || `${property.bhk} in ${property.location}`;
    const description = property.ai_description || 
      `${property.bhk} property for ${property.listing_type} in ${property.location}. ${property.furnishing || ''} ${property.carpet_area ? property.carpet_area + ' sq.ft.' : ''}`;
    
    const priceDisplay = property.price_unit === 'crores' 
      ? `₹${property.price} Cr` 
      : `₹${property.price} ${property.price === 1 ? 'Lakh' : 'Lakhs'}`;
    
    const imageUrl = property.images?.[0] || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690cfb8070b3f94428fee21c/propai-social-share.png';
    
    const shareUrl = property.slug 
      ? `https://propai.live/propertydetails?slug=${property.slug}`
      : `https://propai.live/propertydetails?id=${property.id}`;

    // ✅ Build HTML with meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${title} | PropAI Live</title>
  <meta name="title" content="${title} | PropAI Live">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="PropAI Live">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${shareUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- WhatsApp -->
  <meta property="og:image:alt" content="${title}">
  
  <!-- LinkedIn -->
  <meta property="og:locale" content="en_IN">
  
  <!-- Auto-redirect for regular browsers (in case JS is disabled) -->
  <meta http-equiv="refresh" content="0;url=${shareUrl}">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: linear-gradient(to bottom right, #faf5ff, #f0f9ff); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div style="max-width: 600px; background: white; border-radius: 24px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); text-align: center;">
    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #9333ea, #3b82f6); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="white"/>
      </svg>
    </div>
    
    <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">
      ${title}
    </h1>
    
    <p style="font-size: 18px; font-weight: 700; color: #7c3aed; margin-bottom: 16px;">
      ${priceDisplay} • ${property.listing_type}
    </p>
    
    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
      ${description}
    </p>
    
    <a href="${shareUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
      View Full Details
    </a>
    
    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      Powered by <strong>PropAI Live</strong> • Mumbai's Smartest Property Platform
    </p>
  </div>
  
  <!-- Auto-redirect script for browsers with JS enabled -->
  <script>
    window.location.href = "${shareUrl}";
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Social Preview Error:', error);
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Property Not Found | PropAI Live</title>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Property Not Found</h1>
  <p>Sorry, we couldn't find this property.</p>
  <a href="https://propai.live">Go to PropAI Live</a>
</body>
</html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
});