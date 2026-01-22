import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function Sitemap() {
  const [xmlContent, setXmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIRST useEffect: Generate sitemap
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

  // ✅ SECOND useEffect: Auto-download XML (MUST be before any returns!)
  useEffect(() => {
    if (xmlContent && !isLoading) {
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [xmlContent, isLoading]);

  // ✅ Early return AFTER all hooks
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">PropAI Live Sitemap</h1>
            <p className="text-slate-600">
              XML sitemap for search engines
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
              <p className="text-sm text-green-800 text-center">
                ✅ Sitemap generated successfully! Your download should start automatically.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h2 className="font-bold text-slate-900 mb-3">What's in the sitemap?</h2>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• All active properties ({xmlContent.match(/<url>/g)?.length || 0} total URLs)</li>
                <li>• Building profiles</li>
                <li>• Published blog posts</li>
                <li>• Developer profiles</li>
                <li>• Static pages (Home, SmartFeed, etc.)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([xmlContent], { type: 'application/xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sitemap.xml';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all"
              >
                📥 Download Again
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(xmlContent);
                  alert('Sitemap XML copied to clipboard!');
                }}
                className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold py-3 px-6 rounded-xl transition-all"
              >
                📋 Copy XML
              </button>
            </div>

            <details className="bg-white rounded-2xl border border-slate-200">
              <summary className="cursor-pointer p-4 font-semibold text-slate-900 hover:bg-slate-50 rounded-2xl">
                View Raw XML
              </summary>
              <div className="p-4 pt-0">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs max-h-96 overflow-y-auto">
                  <code>{xmlContent}</code>
                </pre>
              </div>
            </details>

            <div className="text-center pt-4">
              <a 
                href="/"
                className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-2 hover:underline"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}