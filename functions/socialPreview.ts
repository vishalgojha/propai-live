import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SOCIAL MEDIA PREVIEW HANDLER
 * 
 * Serves HTML with proper Open Graph meta tags for social sharing.
 * Crawlers get rich previews, users get redirected to the actual page.
 * 
 * Usage: https://yourdomain.com/api/socialPreview?type=property&id=123
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const url = new URL(req.url);
        const type = url.searchParams.get('type'); // property, building, blog
        const id = url.searchParams.get('id');
        const slug = url.searchParams.get('slug');

        if (!type) {
            // Default homepage preview
            return generateHTML({
                title: 'PropAI Live | WhatsApp → Organized Properties. Instantly.',
                description: 'Stop losing deals in WhatsApp chaos. AI turns messy broker chats into structured listings in seconds. Powered by Building-Level Intelligence.',
                image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690cfb8070b3f94428fee21c/propai-social-share.png',
                url: 'https://propai.live',
                redirectUrl: 'https://propai.live'
            });
        }

        // ✅ PROPERTY PREVIEW
        if (type === 'property') {
            let property;
            
            if (slug) {
                const props = await base44.asServiceRole.entities.Property.filter({ slug });
                property = props[0];
            } else if (id) {
                const props = await base44.asServiceRole.entities.Property.list();
                property = props.find(p => p.id === id);
            }

            if (!property) {
                return Response.json({ error: 'Property not found' }, { status: 404 });
            }

            const title = property.ai_title || `${property.bhk} in ${property.location}`;
            const priceText = property.price 
                ? `₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'} | ${property.listing_type}`
                : 'Price on Request';
            
            const description = property.ai_description 
                ? property.ai_description.substring(0, 155) + '...'
                : `${priceText} • ${property.building_name ? property.building_name + ', ' : ''}${property.location}${property.carpet_area ? ` • ${property.carpet_area} sq.ft` : ''} • PropAI Live`;

            const image = property.images?.[0] || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690cfb8070b3f94428fee21c/propai-social-share.png';
            
            const propertyUrl = slug 
                ? `https://propai.live/propertydetails?slug=${slug}`
                : `https://propai.live/propertydetails?id=${id}`;

            return generateHTML({
                title,
                description,
                image,
                url: propertyUrl,
                redirectUrl: propertyUrl,
                additionalMeta: `
                    <meta property="og:type" content="product" />
                    <meta property="product:price:amount" content="${property.price}" />
                    <meta property="product:price:currency" content="INR" />
                `
            });
        }

        // ✅ BUILDING PREVIEW
        if (type === 'building') {
            const buildings = await base44.asServiceRole.entities.Building.list();
            const building = buildings.find(b => b.id === id);

            if (!building) {
                return Response.json({ error: 'Building not found' }, { status: 404 });
            }

            const title = `${building.name} - ${building.location} | Building Intelligence`;
            const description = building.building_summary 
                ? building.building_summary.substring(0, 155) + '...'
                : `${building.name} in ${building.location} • ${building.active_listings || 0} active listings • PropAI Live Building Intelligence`;

            const image = building.images?.[0] || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690cfb8070b3f94428fee21c/propai-social-share.png';
            
            const buildingUrl = `https://propai.live/buildingblog?id=${id}`;

            return generateHTML({
                title,
                description,
                image,
                url: buildingUrl,
                redirectUrl: buildingUrl
            });
        }

        // ✅ BLOG PREVIEW
        if (type === 'blog') {
            let blog;
            
            if (slug) {
                const blogs = await base44.asServiceRole.entities.Blog.filter({ slug });
                blog = blogs[0];
            } else if (id) {
                const blogs = await base44.asServiceRole.entities.Blog.list();
                blog = blogs.find(b => b.id === id);
            }

            if (!blog) {
                return Response.json({ error: 'Blog not found' }, { status: 404 });
            }

            const title = blog.seo_title || blog.title;
            const description = blog.meta_description || blog.excerpt || blog.title;
            const image = blog.featured_image || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690cfb8070b3f94428fee21c/propai-social-share.png';
            
            const blogUrl = `https://propai.live/blogpost?slug=${blog.slug}`;

            return generateHTML({
                title,
                description,
                image,
                url: blogUrl,
                redirectUrl: blogUrl,
                additionalMeta: `
                    <meta property="og:type" content="article" />
                    <meta property="article:published_time" content="${blog.created_date}" />
                    <meta property="article:author" content="${blog.author}" />
                `
            });
        }

        return Response.json({ error: 'Invalid type parameter' }, { status: 400 });

    } catch (error) {
        console.error('❌ Social Preview Error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});

// ✅ HTML GENERATOR with proper OG tags
function generateHTML({ title, description, image, url, redirectUrl, additionalMeta = '' }) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}">
    <meta name="description" content="${escapeHtml(description)}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(url)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="PropAI Live">
    <meta property="og:locale" content="en_IN">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${escapeHtml(url)}">
    <meta property="twitter:title" content="${escapeHtml(title)}">
    <meta property="twitter:description" content="${escapeHtml(description)}">
    <meta property="twitter:image" content="${escapeHtml(image)}">
    
    <!-- WhatsApp (uses OG tags) -->
    <meta property="og:image:type" content="image/png">
    
    ${additionalMeta}
    
    <!-- Auto-redirect for real users (not crawlers) -->
    <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}">
    <script>
        // Immediate redirect for browsers (crawlers won't execute this)
        window.location.href = "${escapeHtml(redirectUrl)}";
    </script>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        p {
            margin: 0;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚡</div>
        <h1>PropAI Live</h1>
        <p>Redirecting to property...</p>
    </div>
</body>
</html>`;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        }
    });
}

// ✅ ESCAPE HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}