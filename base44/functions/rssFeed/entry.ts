import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all published blog posts
    const blogs = await base44.asServiceRole.entities.Blog.filter(
      { status: "Published" },
      '-created_date',
      50 // Last 50 posts
    );

    // Generate RSS XML
    const rssItems = blogs.map(blog => {
      const pubDate = new Date(blog.created_date).toUTCString();
      const link = `https://propai.live/insights/${blog.slug}`;
      const description = blog.excerpt || blog.content?.substring(0, 200) + '...';
      
      return `    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${blog.category}</category>
      ${blog.author ? `<author>${blog.author}</author>` : ''}
      ${blog.featured_image ? `<enclosure url="${blog.featured_image}" type="image/jpeg" />` : ''}
    </item>`;
    }).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PropAI Live Insights</title>
    <link>https://propai.live</link>
    <description>Mumbai real estate knowledge, simplified. Neighborhood guides, expat survival tips, rental laws &amp; market trends.</description>
    <language>en-IN</language>
    <copyright>Copyright ${new Date().getFullYear()} PropAI Live</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://propai.live/api/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>https://propai.live/logo.png</url>
      <title>PropAI Live</title>
      <link>https://propai.live</link>
    </image>
${rssItems}
  </channel>
</rss>`;

    return new Response(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('RSS Feed Error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Error</title>
    <description>Failed to generate RSS feed: ${error.message}</description>
  </channel>
</rss>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/rss+xml; charset=UTF-8' },
      }
    );
  }
});