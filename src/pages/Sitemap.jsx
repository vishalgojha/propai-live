import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function Sitemap() {
  const [xmlContent, setXmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        // Fetch all data
        const [properties, buildings, blogs, developers] = await Promise.all([
          base44.entities.Property.filter({ status: 'Active', visibility: 'public' }),
          base44.entities.Building.list(),
          base44.entities.Blog.filter({ status: 'Published' }),
          base44.entities.Developer.list(),
        ]);

        const baseUrl = window.location.origin;
        const today = new Date().toISOString().split('T')[0];

        let urls = [];

        // Static pages
        const staticPages = [
          { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
          { loc: `${baseUrl}/smartfeed`, priority: '1.0', changefreq: 'hourly' },
          { loc: `${baseUrl}/buildings`, priority: '0.9', changefreq: 'daily' },
          { loc: `${baseUrl}/blogs`, priority: '0.8', changefreq: 'daily' },
          { loc: `${baseUrl}/developerdirectory`, priority: '0.8', changefreq: 'weekly' },
          { loc: `${baseUrl}/aboutus`, priority: '0.6', changefreq: 'monthly' },
          { loc: `${baseUrl}/faq`, priority: '0.5', changefreq: 'monthly' },
          { loc: `${baseUrl}/privacypolicy`, priority: '0.3', changefreq: 'yearly' },
          { loc: `${baseUrl}/termsofservice`, priority: '0.3', changefreq: 'yearly' },
          { loc: `${baseUrl}/disclaimer`, priority: '0.3', changefreq: 'yearly' },
        ];

        urls.push(...staticPages);

        // Properties
        properties.forEach(property => {
          if (property.slug || property.id) {
            urls.push({
              loc: `${baseUrl}/propertydetails?slug=${property.slug || property.id}`,
              lastmod: property.updated_date?.split('T')[0] || today,
              changefreq: 'daily',
              priority: '0.8'
            });
          }
        });

        // Buildings
        buildings.forEach(building => {
          if (building.id) {
            urls.push({
              loc: `${baseUrl}/buildingblog?id=${building.id}`,
              lastmod: building.last_intelligence_update?.split('T')[0] || today,
              changefreq: 'weekly',
              priority: '0.7'
            });
          }
        });

        // Blogs
        blogs.forEach(blog => {
          if (blog.slug) {
            urls.push({
              loc: `${baseUrl}/blogpost?slug=${blog.slug}`,
              lastmod: blog.updated_date?.split('T')[0] || today,
              changefreq: 'monthly',
              priority: '0.7'
            });
          }
        });

        // Developers
        developers.forEach(developer => {
          if (developer.slug) {
            urls.push({
              loc: `${baseUrl}/developerprofile?slug=${developer.slug}`,
              lastmod: today,
              changefreq: 'weekly',
              priority: '0.6'
            });
          }
        });

        // Generate XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        setXmlContent(xml);
        setIsLoading(false);

        // Set response headers for XML
        document.title = "Sitemap";
        const meta = document.querySelector('meta[name="robots"]');
        if (meta) {
          meta.setAttribute('content', 'noindex, follow');
        }
      } catch (error) {
        console.error('Failed to generate sitemap:', error);
        setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${window.location.origin}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
        setIsLoading(false);
      }
    };

    generateSitemap();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Generating sitemap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">XML Sitemap</h1>
          <p className="text-slate-600 mb-6">
            View the raw XML below or <a href={window.location.href} download="sitemap.xml" className="text-purple-600 hover:underline">download sitemap.xml</a>
          </p>
          <pre className="bg-white p-4 rounded border border-slate-300 overflow-x-auto text-xs">
            <code>{xmlContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}