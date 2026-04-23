import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * DYNAMIC SITEMAP GENERATOR
 * 
 * Generates XML sitemap with all public URLs:
 * - Homepage
 * - SmartFeed
 * - All property detail pages
 * - All building profile pages
 * - All blog posts
 * - Static pages (FAQ, Privacy, etc.)
 * 
 * Accessible at: [your-function-url]
 * Add to robots.txt: Sitemap: [your-function-url]
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active content
    const [properties, buildings, blogs] = await Promise.all([
      base44.asServiceRole.entities.Property.filter({ status: 'Active' }),
      base44.asServiceRole.entities.Building.list(),
      base44.asServiceRole.entities.Blog.filter({ status: 'Published' })
    ]);

    const baseUrl = 'https://propai.live'; // ✅ CHANGE THIS TO YOUR ACTUAL DOMAIN

    // Build sitemap URLs
    const urls = [];

    // Static pages
    urls.push({
      loc: baseUrl,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString().split('T')[0]
    });

    urls.push({
      loc: `${baseUrl}/smartfeed`,
      changefreq: 'hourly',
      priority: 0.9,
      lastmod: new Date().toISOString().split('T')[0]
    });

    urls.push({
      loc: `${baseUrl}/buildings`,
      changefreq: 'daily',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0]
    });

    urls.push({
      loc: `${baseUrl}/blogs`,
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date().toISOString().split('T')[0]
    });

    // Static legal pages
    ['faq', 'privacypolicy', 'termsofservice', 'disclaimer', 'brokernetwork', 'developerdirectory'].forEach(page => {
      urls.push({
        loc: `${baseUrl}/${page}`,
        changefreq: 'monthly',
        priority: 0.3
      });
    });

    // Property detail pages (active only)
    properties.forEach(property => {
      if (property.slug) {
        urls.push({
          loc: `${baseUrl}/propertydetails?slug=${property.slug}`,
          changefreq: 'daily',
          priority: 0.8,
          lastmod: property.updated_date?.split('T')[0] || property.created_date?.split('T')[0]
        });
      }
    });

    // Building profile pages
    buildings.forEach(building => {
      if (building.slug) {
        urls.push({
          loc: `${baseUrl}/buildingprofile?slug=${building.slug}`,
          changefreq: 'weekly',
          priority: 0.6,
          lastmod: building.updated_date?.split('T')[0] || building.created_date?.split('T')[0]
        });
      } else if (building.id) {
        urls.push({
          loc: `${baseUrl}/buildingprofile?id=${building.id}`,
          changefreq: 'weekly',
          priority: 0.6,
          lastmod: building.updated_date?.split('T')[0] || building.created_date?.split('T')[0]
        });
      }
    });

    // Blog posts
    blogs.forEach(blog => {
      if (blog.slug) {
        urls.push({
          loc: `${baseUrl}/blogpost?slug=${blog.slug}`,
          changefreq: 'monthly',
          priority: 0.5,
          lastmod: blog.updated_date?.split('T')[0] || blog.created_date?.split('T')[0]
        });
      }
    });

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});

// Helper: Escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}