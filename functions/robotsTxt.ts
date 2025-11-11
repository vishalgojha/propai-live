import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ROBOTS.TXT GENERATOR
 * 
 * Generates robots.txt for search engines
 * Points to sitemap.xml
 * 
 * Accessible at: [your-function-url]
 */

Deno.serve(async (req) => {
  try {
    const baseUrl = 'https://propai.live'; // ✅ CHANGE THIS TO YOUR ACTUAL DOMAIN
    
    // Get the sitemap function URL from dashboard
    // For now, using a placeholder - you'll update this after deploying sitemap function
    const sitemapUrl = `${baseUrl}/api/sitemap`; // ✅ UPDATE THIS TO YOUR ACTUAL SITEMAP FUNCTION URL

    const robotsTxt = `# PropAI Live - Robots.txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${sitemapUrl}

# Crawl-delay (be nice to our servers)
Crawl-delay: 1

# Disallow admin pages
User-agent: *
Disallow: /admin
Disallow: /dashboard
Disallow: /livedashboard
Disallow: /adminlogin
Disallow: /myprofile

# Allow important pages
Allow: /
Allow: /smartfeed
Allow: /buildings
Allow: /blogs
Allow: /propertydetails
Allow: /buildingprofile
Allow: /blogpost
`;

    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      }
    });

  } catch (error) {
    console.error('Robots.txt generation error:', error);
    return new Response(`User-agent: *\nAllow: /`, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
});