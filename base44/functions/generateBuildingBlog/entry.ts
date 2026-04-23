import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AUTO-GENERATE BUILDING BLOG
 * 
 * Creates or updates a Building Blog post with real-time market intelligence.
 * Called when: New property added, property sold/rented, or manual refresh.
 * 
 * Input: { building_id: "uuid" }
 * Output: { success: true, blog_id: "uuid", action: "created|updated" }
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin authentication
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                success: false, 
                error: 'Unauthorized - Admin only' 
            }, { status: 401 });
        }

        const { building_id } = await req.json();
        
        if (!building_id) {
            return Response.json({ 
                success: false, 
                error: 'building_id is required' 
            }, { status: 400 });
        }

        // ✅ STEP 1: Fetch building data
        const buildings = await base44.asServiceRole.entities.Building.list();
        const building = buildings.find(b => b.id === building_id);
        
        if (!building) {
            return Response.json({ 
                success: false, 
                error: 'Building not found' 
            }, { status: 404 });
        }

        // ✅ STEP 2: Gather property intelligence
        const allProperties = await base44.asServiceRole.entities.Property.list('-created_date');
        const buildingProperties = allProperties.filter(p => p.building_id === building_id);
        
        const activeProperties = buildingProperties.filter(p => p.status === 'Active' && !p.is_duplicate);
        const recentProperties = buildingProperties.filter(p => {
            const created = new Date(p.created_date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return created >= thirtyDaysAgo;
        });

        const rentals = activeProperties.filter(p => p.listing_type === 'Rent');
        const sales = activeProperties.filter(p => p.listing_type === 'Sale');

        // Calculate pricing by BHK
        const calculateAvgPrice = (props, bhk) => {
            const filtered = props.filter(p => p.bhk === bhk && p.price);
            if (filtered.length === 0) return null;
            const sum = filtered.reduce((acc, p) => {
                const price = p.price_unit === 'crores' ? p.price * 100 : p.price;
                return acc + price;
            }, 0);
            return (sum / filtered.length).toFixed(2);
        };

        const bhkBreakdown = {};
        activeProperties.forEach(p => {
            if (p.bhk) {
                bhkBreakdown[p.bhk] = (bhkBreakdown[p.bhk] || 0) + 1;
            }
        });

        const avgRent2BHK = calculateAvgPrice(rentals, '2 BHK');
        const avgRent3BHK = calculateAvgPrice(rentals, '3 BHK');
        const avgSale2BHK = calculateAvgPrice(sales, '2 BHK');
        const avgSale3BHK = calculateAvgPrice(sales, '3 BHK');

        // ✅ STEP 3: Fetch developer data if linked
        let developer = null;
        if (building.developer_id) {
            const developers = await base44.asServiceRole.entities.Developer.list();
            developer = developers.find(d => d.id === building.developer_id);
        }

        // ✅ STEP 4: Generate blog content with AI
        const marketDataContext = `
**BUILDING:** ${building.name}
**LOCATION:** ${building.location}${building.pocket ? `, ${building.pocket}` : ''}
${building.developer_name ? `**DEVELOPER:** ${building.developer_name}${developer?.tier ? ` (${developer.tier})` : ''}` : ''}
${building.year_built ? `**YEAR BUILT:** ${building.year_built}` : ''}
${building.total_floors ? `**FLOORS:** ${building.total_floors}` : ''}
${building.total_units ? `**UNITS:** ${building.total_units}` : ''}

**REAL-TIME MARKET DATA:**
- Total Listings Tracked: ${buildingProperties.length}
- Currently Active: ${activeProperties.length} (${rentals.length} rentals, ${sales.length} sales)
- Last 30 Days Activity: ${recentProperties.length} new listings
- BHK Split: ${JSON.stringify(bhkBreakdown)}

**PRICING INTELLIGENCE (₹):**
${avgRent2BHK ? `- 2 BHK Rent Avg: ₹${avgRent2BHK}L/month` : ''}
${avgRent3BHK ? `- 3 BHK Rent Avg: ₹${avgRent3BHK}L/month` : ''}
${avgSale2BHK ? `- 2 BHK Sale Avg: ₹${(avgSale2BHK / 100).toFixed(2)} Cr` : ''}
${avgSale3BHK ? `- 3 BHK Sale Avg: ₹${(avgSale3BHK / 100).toFixed(2)} Cr` : ''}

${building.amenities?.length > 0 ? `**AMENITIES:** ${building.amenities.join(', ')}` : ''}
${building.tags?.length > 0 ? `**TAGS:** ${building.tags.join(', ')}` : ''}
${building.vibe_keywords?.length > 0 ? `**VIBE:** ${building.vibe_keywords.join(', ')}` : ''}
${building.management_quality && building.management_quality !== 'Unknown' ? `**MANAGEMENT:** ${building.management_quality}` : ''}
${building.building_summary ? `**EXISTING SUMMARY:** ${building.building_summary}` : ''}
${developer ? `\n**DEVELOPER CONTEXT:**\n- Reputation Score: ${developer.reputation_score}/100\n- Track Record: ${developer.delivery_track_record}\n- Notable Projects: ${developer.notable_projects?.slice(0, 3).join(', ')}` : ''}
`;

        const prompt = `You are writing a dynamic, data-driven "Building Blog" post for ${building.name} in ${building.location}. This is an evergreen post that updates automatically as new listings arrive.

${marketDataContext}

**YOUR TASK:**
Write a sharp, contextual blog post (800-1200 words) that:
1. **Leads with REAL data** (active listings, pricing trends, recent activity)
2. **Building context** (developer, year, management, amenities)
3. **Living experience** (vibe, tenant profile, neighborhood)
4. **Investment angle** (pricing trends, why this building)
5. **Practical insights** (rental vs sale demand, BHK popularity)

**TONE:**
- Conversational but data-backed ("${building.name} has ${activeProperties.length} active listings right now...")
- Honest, no sales fluff
- Use real numbers from the data above
- Write as if texting a friend who's relocating to Mumbai

**STRUCTURE:**
- Hook: Lead with the most interesting data point
- Market Activity: What's happening RIGHT NOW
- Pricing Reality: Table with real rent/sale prices
- Building Profile: Developer, amenities, management
- Living Here: Vibe, tenant types, pros/cons
- Bottom Line: Who should consider this building

**CRITICAL:**
- Use ONLY the real data provided above
- No made-up stats or generic fluff
- Include specific numbers (listings, prices, trends)
- Mention if data is limited (e.g., "Only rental data available currently")
- Make it evergreen but timestamp-aware ("As of ${new Date().toLocaleDateString()}")

Generate JSON with:
- title: Catchy, includes building name + key insight (e.g., "${building.name}: ${activeProperties.length} Listings, ₹${avgRent2BHK || 'Price'}L Avg Rent")
- seo_title: SEO-optimized (60 chars max)
- excerpt: 2-3 sentence summary with key data point
- content: Full markdown blog post (800-1200 words)
- summary: One-liner for quick preview (e.g., "${activeProperties.length} active listings • ${building.location} • ${developer?.tier || 'Premium'} developer")
- meta_description: SEO meta (150-160 chars)
- tags: 5-7 relevant tags
`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    seo_title: { type: "string" },
                    excerpt: { type: "string" },
                    content: { type: "string" },
                    summary: { type: "string" },
                    meta_description: { type: "string" },
                    tags: { type: "array", items: { type: "string" } }
                },
                required: ["title", "content", "excerpt"]
            }
        });

        // ✅ STEP 5: Create or update blog post
        const slug = `${building.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${building.location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        // Check if blog already exists
        const existingBlogs = await base44.asServiceRole.entities.Blog.filter({ building_id });
        const existingBlog = existingBlogs.find(b => b.building_id === building_id);

        const blogData = {
            title: aiResponse.title,
            slug,
            seo_title: aiResponse.seo_title || aiResponse.title,
            category: "Building Blog",
            building_id: building_id,
            excerpt: aiResponse.excerpt,
            content: aiResponse.content,
            summary: aiResponse.summary || aiResponse.excerpt,
            meta_description: aiResponse.meta_description || aiResponse.excerpt,
            tags: aiResponse.tags || [building.location, building.name],
            related_locations: [building.location],
            author: "Chariot AI",
            read_time: Math.ceil(aiResponse.content.split(' ').length / 200),
            status: "Published",
            ai_generated: true,
            auto_generated: true,
            last_auto_update: new Date().toISOString()
        };

        let blog;
        let action;

        if (existingBlog) {
            // Update existing blog
            await base44.asServiceRole.entities.Blog.update(existingBlog.id, blogData);
            blog = { ...existingBlog, ...blogData };
            action = "updated";
        } else {
            // Create new blog
            blog = await base44.asServiceRole.entities.Blog.create(blogData);
            action = "created";
        }

        return Response.json({
            success: true,
            blog_id: blog.id,
            action,
            slug: blog.slug,
            data: {
                title: blog.title,
                excerpt: blog.excerpt,
                summary: blog.summary,
                active_listings: activeProperties.length,
                total_listings: buildingProperties.length
            }
        });

    } catch (error) {
        console.error('❌ Generate Building Blog Error:', error);
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});