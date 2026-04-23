import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Auto-generates blog posts about developers
 * Creates SEO-optimized content for "Top Developers in [Location]" etc.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { topic, location, tier, market_segment } = await req.json();

    // Fetch developers and buildings
    const developers = await base44.asServiceRole.entities.Developer.list();
    const buildings = await base44.asServiceRole.entities.Building.list();

    // Filter developers based on criteria
    let filteredDevelopers = developers;
    
    if (tier) {
      filteredDevelopers = filteredDevelopers.filter(d => d.tier === tier);
    }
    
    if (market_segment) {
      filteredDevelopers = filteredDevelopers.filter(d => d.market_segment === market_segment);
    }

    if (location) {
      // Filter by developers active in that location
      filteredDevelopers = filteredDevelopers.filter(d => 
        d.locations_active?.some(loc => 
          loc.toLowerCase().includes(location.toLowerCase())
        ) ||
        buildings.some(b => 
          b.developer_id === d.id && 
          b.location?.toLowerCase().includes(location.toLowerCase())
        )
      );
    }

    // Generate content based on topic type
    let blogTitle, category, prompt;

    if (topic === 'top_developers_by_location') {
      blogTitle = `Top Real Estate Developers in ${location} 2025`;
      category = "Market Insights";
      prompt = `Write a comprehensive blog post titled "${blogTitle}".

Focus on these verified developers active in ${location}:
${filteredDevelopers.slice(0, 10).map(d => `
- ${d.name} (${d.tier})
  * Notable Projects: ${d.notable_projects?.slice(0, 3).join(', ')}
  * Track Record: ${d.delivery_track_record}
  * Reputation: ${d.reputation_score}/100
  * Specializations: ${d.key_focus_areas?.join(', ')}
  * Market Segment: ${d.market_segment}
`).join('\n')}

Structure:
1. Introduction (why ${location} is a prime real estate destination)
2. Top Tier 1 Developers (with their flagship projects)
3. Emerging Tier 2 Developers
4. What to Look for When Choosing a Developer
5. Conclusion with actionable advice

Include:
- Specific project names and locations
- Price ranges and market segments
- Track records and delivery timelines
- What makes each developer unique

Write 1200-1500 words. Be authoritative but accessible. Use Mumbai real estate context.`;

    } else if (topic === 'luxury_developers') {
      blogTitle = `Mumbai's Best Luxury Developers: A 2025 Guide`;
      category = "Market Insights";
      const luxuryDevs = developers.filter(d => 
        d.market_segment === 'Ultra-Luxury' || d.market_segment === 'Luxury'
      );
      
      prompt = `Write a detailed guide titled "${blogTitle}".

Cover these verified luxury developers:
${luxuryDevs.slice(0, 8).map(d => `
- ${d.name} (${d.tier})
  * Projects: ${d.notable_projects?.slice(0, 3).join(', ')}
  * Track Record: ${d.delivery_track_record}
  * Reputation: ${d.reputation_score}/100
  * Segment: ${d.market_segment}
  * Sustainable: ${d.sustainability_focus ? 'Yes' : 'No'}
`).join('\n')}

Structure:
1. What Defines a Luxury Developer in Mumbai
2. Tier 1 Luxury Leaders (Oberoi, Lodha, etc.)
3. Boutique Luxury Developers (Sheth, etc.)
4. Key Factors: Quality, Amenities, Location
5. Investment Perspective: Which luxury developers hold value
6. Conclusion

1200-1500 words. Target HNIs and expats. Include price ranges and ROI context.`;

    } else if (topic === 'affordable_developers') {
      blogTitle = `Best Affordable Housing Developers in Mumbai 2025`;
      category = "Market Insights";
      const affordableDevs = developers.filter(d => 
        d.market_segment === 'Affordable' || d.market_segment === 'Mid-Segment'
      );
      
      prompt = `Write a helpful guide titled "${blogTitle}".

Feature these affordable/mid-segment developers:
${affordableDevs.slice(0, 10).map(d => `
- ${d.name} (${d.tier})
  * Projects: ${d.notable_projects?.slice(0, 3).join(', ')}
  * Locations: ${d.locations_active?.join(', ')}
  * Track Record: ${d.delivery_track_record}
`).join('\n')}

Structure:
1. Why affordable housing matters in Mumbai
2. Top Tier 1 developers with affordable segments
3. Tier 2 developers specializing in value homes
4. What to check: RERA, construction quality, timelines
5. Best locations for affordable housing
6. Financing and PMAY options

1200-1500 words. Target first-time homebuyers. Practical and empowering tone.`;

    } else {
      // Default: General developer overview
      blogTitle = `Mumbai Real Estate Developers: The Complete 2025 Guide`;
      category = "Market Insights";
      prompt = `Write an authoritative guide titled "${blogTitle}".

Cover the Mumbai developer landscape:

Tier 1 Developers (Mega/National):
${developers.filter(d => d.tier === 'Tier 1').slice(0, 8).map(d => 
  `- ${d.name}: ${d.notable_projects?.slice(0, 2).join(', ')}`
).join('\n')}

Tier 2 Developers (Established/Regional):
${developers.filter(d => d.tier === 'Tier 2').slice(0, 8).map(d => 
  `- ${d.name}: ${d.key_focus_areas?.join(', ')}`
).join('\n')}

Structure:
1. Understanding Mumbai's Developer Tiers
2. Tier 1: The Mega Developers
3. Tier 2: Regional Specialists
4. Tier 3: Emerging Builders
5. How to Choose the Right Developer
6. Red Flags to Watch For
7. Conclusion

1500-2000 words. Comprehensive and educational.`;
    }

    // Generate blog content using AI
    const blogContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Full blog post in markdown format" },
          excerpt: { type: "string", description: "2-3 sentence summary for preview" },
          meta_description: { type: "string", description: "SEO meta description (150-160 chars)" },
          tags: { type: "array", items: { type: "string" }, description: "5-7 relevant tags" },
          read_time: { type: "number", description: "Estimated read time in minutes" }
        }
      }
    });

    // Create slug
    const slug = blogTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create blog post
    const blog = await base44.asServiceRole.entities.Blog.create({
      title: blogTitle,
      slug,
      category,
      excerpt: blogContent.excerpt,
      content: blogContent.content,
      meta_description: blogContent.meta_description,
      tags: blogContent.tags,
      read_time: blogContent.read_time,
      author: "Chariot AI",
      status: "Published",
      ai_generated: true,
      related_locations: location ? [location] : []
    });

    return Response.json({
      success: true,
      blog_id: blog.id,
      title: blogTitle,
      slug,
      preview_url: `/blogpost?slug=${slug}`
    });

  } catch (error) {
    console.error('Generate developer blog error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});