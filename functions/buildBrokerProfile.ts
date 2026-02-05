import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Broker Profile Builder
 * 
 * Analyzes all data about a broker to build rich contextual profiles:
 * - Team relationships (who they work with)
 * - Specializations (areas, property types, price ranges)
 * - Performance metrics (listing frequency, quality, consistency)
 * - Communication patterns
 * - AI-generated profile summary
 * 
 * This runs automatically when new properties are parsed, or manually via admin.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brokerId, buildAllProfiles } = await req.json();

    const brokersToAnalyze = buildAllProfiles
      ? await base44.asServiceRole.entities.Broker.list()
      : brokerId
        ? [await base44.asServiceRole.entities.Broker.filter({ id: brokerId })].flat().filter(Boolean)
        : [];

    if (brokersToAnalyze.length === 0) {
      return Response.json({ error: 'No brokers to analyze' }, { status: 400 });
    }

    const results = [];

    for (const broker of brokersToAnalyze) {
      console.log(`📊 Building profile for: ${broker.name} (${broker.custom_id})`);

      // 1. Get all properties from this broker
      const allProperties = await base44.asServiceRole.entities.Property.list();
      const brokerProperties = allProperties.filter(p => p.broker_id === broker.id);

      if (brokerProperties.length === 0) {
        console.log(`⚠️ No properties found for ${broker.name}`);
        continue;
      }

      // 2. TEAM DETECTION: Find co-brokers from source messages
      const teamMembers = {};
      brokerProperties.forEach(prop => {
        if (prop.source_text) {
          // Extract all phone numbers from source text
          const phoneRegex = /(\+?\d{10,13})/g;
          const phones = [...prop.source_text.matchAll(phoneRegex)].map(m => m[1]);
          
          // Find other brokers with these phones
          phones.forEach(phone => {
            const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
            const cobroker = allProperties.find(p => 
              p.broker_id !== broker.id && 
              p.broker_contact && 
              p.broker_contact.replace(/\D/g, '').includes(normalizedPhone)
            );
            
            if (cobroker) {
              const key = cobroker.broker_id;
              if (!teamMembers[key]) {
                teamMembers[key] = {
                  broker_id: cobroker.broker_id,
                  name: cobroker.broker_contact || 'Unknown',
                  phone: cobroker.broker_contact,
                  role: 'Partner',
                  co_listing_count: 0
                };
              }
              teamMembers[key].co_listing_count++;
            }
          });
        }
      });

      const teamArray = Object.values(teamMembers)
        .filter(tm => tm.co_listing_count >= 2) // Only include if 2+ co-listings
        .sort((a, b) => b.co_listing_count - a.co_listing_count);

      // 3. SPECIALIZATIONS: Analyze listing patterns
      const locationCounts = {};
      const bhkCounts = {};
      const listingTypeCounts = { Rent: 0, Sale: 0, Lease: 0 };
      const buildingCounts = {};
      const prices = [];

      brokerProperties.forEach(prop => {
        // Locations
        if (prop.location) {
          locationCounts[prop.location] = (locationCounts[prop.location] || 0) + 1;
        }

        // BHK
        if (prop.bhk) {
          bhkCounts[prop.bhk] = (bhkCounts[prop.bhk] || 0) + 1;
        }

        // Listing types
        if (prop.listing_type) {
          listingTypeCounts[prop.listing_type]++;
        }

        // Buildings
        if (prop.building_name) {
          buildingCounts[prop.building_name] = (buildingCounts[prop.building_name] || 0) + 1;
        }

        // Prices
        const priceInLakhs = prop.price_unit === 'crores' ? prop.price * 100 : prop.price;
        prices.push(priceInLakhs);
      });

      const primaryLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

      const preferredBhk = Object.entries(bhkCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

      const listingTypeFocus = listingTypeCounts.Rent > listingTypeCounts.Sale
        ? 'Rent'
        : listingTypeCounts.Sale > listingTypeCounts.Rent
          ? 'Sale'
          : 'Mixed';

      const buildingExpertise = Object.entries(buildingCounts)
        .filter(e => e[1] >= 3) // 3+ listings in same building
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);

      const priceRange = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      } : null;

      // 4. PERFORMANCE METRICS
      const propertyDates = brokerProperties
        .map(p => new Date(p.created_date))
        .sort((a, b) => a - b);

      const firstListing = propertyDates[0];
      const lastListing = propertyDates[propertyDates.length - 1];
      const monthsActive = firstListing && lastListing
        ? Math.max(1, (lastListing - firstListing) / (1000 * 60 * 60 * 24 * 30))
        : 1;

      const avgListingsPerMonth = Math.round(brokerProperties.length / monthsActive);

      // Consistency: check how evenly distributed listings are
      const monthlyDistribution = {};
      propertyDates.forEach(date => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyDistribution[key] = (monthlyDistribution[key] || 0) + 1;
      });

      const monthlyValues = Object.values(monthlyDistribution);
      const consistencyScore = monthlyValues.length > 3
        ? Math.round((1 - (Math.max(...monthlyValues) - Math.min(...monthlyValues)) / Math.max(...monthlyValues)) * 100)
        : 50;

      // Quality: properties with photos + detailed descriptions
      const qualityProps = brokerProperties.filter(p => 
        (p.images && p.images.length > 0) && 
        (p.ai_description || p.description)
      ).length;
      const qualityScore = Math.round((qualityProps / brokerProperties.length) * 100);

      // 5. COMMUNICATION STYLE
      const sourceTexts = brokerProperties
        .map(p => p.source_text)
        .filter(Boolean);

      const detailLevel = sourceTexts.length > 0
        ? sourceTexts.some(t => t.length > 300)
          ? 'Detailed'
          : sourceTexts.some(t => t.length > 100)
            ? 'Moderate'
            : 'Minimal'
        : 'Unknown';

      // Common abbreviations
      const abbreviations = new Set();
      sourceTexts.forEach(text => {
        const abbrs = text.match(/\b(ff|sf|uf|bhk|sqft|cp|mod|kit)\b/gi) || [];
        abbrs.forEach(a => abbreviations.add(a.toLowerCase()));
      });

      // 6. AI PROFILE SUMMARY
      const profilePrompt = `Generate a professional broker profile summary (2-3 paragraphs) based on this data:

**Broker:** ${broker.name}
**Agency:** ${broker.agency_name || 'Independent'}
**Total Listings:** ${brokerProperties.length}
**Active Since:** ${firstListing ? firstListing.toLocaleDateString() : 'Unknown'}

**Specializations:**
- Primary Areas: ${primaryLocations.join(', ') || 'Various'}
- Preferred Properties: ${preferredBhk.join(', ') || 'Mixed'}
- Focus: ${listingTypeFocus}
- Average Price Range: ₹${priceRange ? priceRange.avg : '?'} lakhs

**Team:**
${teamArray.length > 0 ? teamArray.map(t => `- ${t.name} (${t.co_listing_count} co-listings)`).join('\n') : 'Works independently'}

**Performance:**
- Avg ${avgListingsPerMonth} listings/month
- Consistency: ${consistencyScore}/100
- Quality: ${qualityScore}/100
- Trust Score: ${broker.trust_score || 'Not scored'}

**Style:**
- Communication: ${detailLevel} descriptions
- Common abbreviations: ${Array.from(abbreviations).join(', ') || 'None detected'}

Write a compelling, professional profile that highlights their strengths and expertise. Focus on what makes them unique.`;

      const aiSummary = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: profilePrompt,
        add_context_from_internet: false
      });

      // 7. UPDATE BROKER WITH PROFILE DATA
      const profileUpdate = {
        team_members: teamArray,
        specializations: {
          primary_locations: primaryLocations,
          preferred_bhk: preferredBhk,
          listing_type_focus: listingTypeFocus,
          price_range: priceRange,
          building_expertise: buildingExpertise
        },
        performance_metrics: {
          avg_listings_per_month: avgListingsPerMonth,
          consistency_score: consistencyScore,
          quality_score: qualityScore
        },
        communication_style: {
          detail_level: detailLevel,
          abbreviations_used: Array.from(abbreviations)
        },
        ai_profile_summary: aiSummary,
        profile_last_updated: new Date().toISOString()
      };

      await base44.asServiceRole.entities.Broker.update(broker.id, profileUpdate);

      results.push({
        broker_id: broker.id,
        broker_name: broker.name,
        custom_id: broker.custom_id,
        total_listings: brokerProperties.length,
        team_size: teamArray.length,
        specializations: profileUpdate.specializations,
        performance: profileUpdate.performance_metrics,
        profile_summary: aiSummary.substring(0, 200) + '...'
      });

      console.log(`✅ Profile built for ${broker.name}`);
    }

    return Response.json({
      success: true,
      profiles_built: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error building broker profiles:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});