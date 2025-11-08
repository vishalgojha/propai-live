import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const baseUrl = 'https://propai.live';

    // Fetch dynamic content
    const [blogs, properties, buildings] = await Promise.all([
      base44.asServiceRole.entities.Blog.filter({ status: "Published" }, '-created_date'),
      base44.asServiceRole.entities.Property.filter({ status: "Active" }, '-created_date', 1000),
      base44.asServiceRole.entities.Building.filter({ verified: true }, '-created_date', 500)
    ]);

    // Static pages with priority and change frequency
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/smartfeed', priority: '0.9', changefreq: 'daily' },
      { url: '/buildings', priority: '0.8', changefreq: 'weekly' },
      { url: '/insights', priority: '0.8', changefreq: 'weekly' },
      { url: '/network', priority: '0.6', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
      { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
      { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' }
    ];

    // Build sitemap URLs
    let urls = '';

    // Add static pages
    staticPages.forEach(page => {
      urls += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // Add blog posts
    blogs.forEach(blog => {
      const lastmod = blog.updated_date || blog.created_date;
      urls += `  <url>
    <loc>${baseUrl}/insights/${blog.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Add properties (only with slugs)
    properties
      .filter(p => p.slug && !p.is_duplicate)
      .slice(0, 500) // Limit to 500 most recent
      .forEach(property => {
        urls += `  <url>
    <loc>${baseUrl}/property/${property.slug}</loc>
    <lastmod>${new Date(property.updated_date || property.created_date).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
      });

    // Add buildings (only verified with slugs)
    buildings
      .filter(b => b.slug)
      .forEach(building => {
        urls += `  <url>
    <loc>${baseUrl}/building/${building.slug}</loc>
    <lastmod>${new Date(building.last_intelligence_update || building.updated_date || building.created_date).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
      });

    // Generate sitemap XML
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}</urlset>`;

    return new Response(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://propai.live</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=UTF-8' },
      }
    );
  }
});