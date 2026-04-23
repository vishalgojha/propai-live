import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const baseUrl = 'https://propai.live';

    // ✅ FIXED: Fetch ALL entities, no limits
    const [blogs, properties, buildings, developers] = await Promise.all([
      base44.asServiceRole.entities.Blog.filter({ status: "Published" }, '-created_date'),
      base44.asServiceRole.entities.Property.filter({ 
        status: "Active",
        is_duplicate: false 
      }, '-created_date'), // ✅ ALL properties, no limit
      base44.asServiceRole.entities.Building.list('-updated_date'), // ✅ ALL buildings
      base44.asServiceRole.entities.Developer.list('-updated_date') // ✅ ALL developers
    ]);

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily', lastmod: new Date() },
      { url: '/smartfeed', priority: '0.9', changefreq: 'daily', lastmod: new Date() },
      { url: '/buildings', priority: '0.8', changefreq: 'weekly', lastmod: new Date() },
      { url: '/blogs', priority: '0.8', changefreq: 'weekly', lastmod: new Date() },
      { url: '/developerdirectory', priority: '0.7', changefreq: 'monthly', lastmod: new Date() },
      { url: '/brokernetwork', priority: '0.6', changefreq: 'monthly', lastmod: new Date() },
      { url: '/aboutus', priority: '0.7', changefreq: 'monthly', lastmod: new Date() },
      { url: '/faq', priority: '0.5', changefreq: 'monthly', lastmod: new Date() },
      { url: '/privacypolicy', priority: '0.3', changefreq: 'yearly', lastmod: new Date() },
      { url: '/termsofservice', priority: '0.3', changefreq: 'yearly', lastmod: new Date() },
      { url: '/disclaimer', priority: '0.3', changefreq: 'yearly', lastmod: new Date() }
    ];

    let urls = '';

    // Add static pages
    staticPages.forEach(page => {
      urls += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // ✅ Add ALL blog posts
    blogs.forEach(blog => {
      if (!blog.slug) return;
      const lastmod = blog.updated_date || blog.created_date;
      urls += `  <url>
    <loc>${baseUrl}/blogpost?slug=${encodeURIComponent(blog.slug)}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // ✅ Add ALL properties with slugs (no 500 limit)
    properties
      .filter(p => p.slug)
      .forEach(property => {
        urls += `  <url>
    <loc>${baseUrl}/propertydetails?slug=${encodeURIComponent(property.slug)}</loc>
    <lastmod>${new Date(property.updated_date || property.created_date).toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${property.images?.[0] || 'https://propai.live/logo.png'}</image:loc>
      <image:title>${property.ai_title || `${property.bhk} in ${property.location}`}</image:title>
    </image:image>
  </url>\n`;
      });

    // ✅ Add ALL buildings
    buildings
      .filter(b => b.id)
      .forEach(building => {
        urls += `  <url>
    <loc>${baseUrl}/buildingprofile?id=${building.id}</loc>
    <lastmod>${new Date(building.last_intelligence_update || building.updated_date || building.created_date).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      });

    // ✅ Add ALL developers
    developers
      .filter(d => d.slug)
      .forEach(developer => {
        urls += `  <url>
    <loc>${baseUrl}/developerprofile?slug=${encodeURIComponent(developer.slug)}</loc>
    <lastmod>${new Date(developer.updated_date || developer.created_date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
      });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}</urlset>`;

    return new Response(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
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