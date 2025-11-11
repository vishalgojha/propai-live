import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getFeatureWithOverride } from '../config/features';

/**
 * Hook to automatically enrich properties with AI-generated titles and descriptions
 * Runs on-demand when properties are displayed (no heavy backend backfill needed)
 * 
 * Features:
 * - Feature flag support (client-side vs backend)
 * - Parity logging for monitoring
 * - Session caching to prevent re-enrichment
 * - Price validation for Mumbai market
 */
export function usePropertyAIEnrichment(property) {
  const [enrichedProperty, setEnrichedProperty] = useState(property);
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    if (!property) return;
    
    // Check if property needs enrichment
    const needsTitle = !property.ai_title;
    const needsDescription = !property.ai_description;
    
    if (!needsTitle && !needsDescription) {
      setEnrichedProperty(property);
      return;
    }

    // Only enrich once per property per session
    const enrichmentKey = `enriched-${property.id}`;
    if (sessionStorage.getItem(enrichmentKey)) {
      setEnrichedProperty(property);
      return;
    }

    const enrichProperty = async () => {
      const startTime = performance.now();
      
      try {
        setIsEnriching(true);

        // Check feature flag
        const useClientAI = getFeatureWithOverride('useClientAI');
        const enableParityLogging = getFeatureWithOverride('enableParityLogging');

        let aiTitle = property.ai_title;
        let aiDescription = property.ai_description;

        if (useClientAI) {
          // ✅ PRICE VALIDATION FOR MUMBAI MARKET
          const priceInLakhs = property.price_unit === 'crores' ? property.price * 100 : property.price;
          let priceWarning = '';
          
          // Sanity checks for Mumbai real estate
          if (property.listing_type === 'Sale' || property.listing_type === 'Pre Leased') {
            if (property.property_category === 'Residential') {
              if (priceInLakhs > 10000) { // > 100 Cr
                priceWarning = '⚠️ WARNING: Price seems unusually high for residential (>100 Cr). Verify data accuracy.';
              } else if (priceInLakhs < 50) { // < 50 Lakhs
                priceWarning = '⚠️ WARNING: Price seems too low for Mumbai property (<50L). Verify data accuracy.';
              }
            } else if (property.property_category === 'Commercial') {
              if (priceInLakhs > 20000) { // > 200 Cr
                priceWarning = '⚠️ WARNING: Price seems extremely high for commercial (>200 Cr). Verify data accuracy.';
              }
            }
          } else if (property.listing_type === 'Rent' || property.listing_type === 'Lease') {
            if (property.property_category === 'Residential') {
              if (priceInLakhs > 20) { // > 20 Lakhs/month
                priceWarning = '⚠️ WARNING: Monthly rent seems very high (>20L/month). Verify data accuracy.';
              }
            } else if (property.property_category === 'Commercial') {
              if (priceInLakhs > 50) { // > 50 Lakhs/month
                priceWarning = '⚠️ WARNING: Monthly rent seems very high (>50L/month). Verify data accuracy.';
              }
            }
          }

          // ✅ CLIENT-SIDE AI GENERATION WITH IMPROVED PROMPT
          const prompt = `You are writing property listings for a Mumbai real estate platform. Write naturally, like a knowledgeable local broker who's direct and informative.

**Property Details:**
- Type: ${property.bhk} ${property.property_category || 'Residential'}
- Price: ₹${property.price} ${property.price_unit} ${priceWarning ? `\n${priceWarning}` : ''}
- Listing: ${property.listing_type}
- Location: ${property.location}${property.pocket ? ` (${property.pocket})` : ''}
- Building: ${property.building_name || 'Not specified'}
- Area: ${property.carpet_area || 'Not specified'} sq.ft
- Furnishing: ${property.furnishing || 'Not specified'}
- Floor: ${property.floor || 'N/A'}${property.total_floors ? ` of ${property.total_floors}` : ''}
- Parking: ${property.parking || 'Not specified'}
- View: ${property.view || 'N/A'}
- Amenities: ${property.amenities?.slice(0, 5).join(', ') || 'Standard amenities'}

**Mumbai Real Estate Context (Typical Pricing):**
- Residential Sale: ₹1-30 Cr (premium areas like Bandra, Worli, BKC can go ₹5-50 Cr)
- Residential Rent: ₹50k-5L/month (luxury can be ₹10-20L/month)
- Commercial Sale: ₹5-100 Cr (depends heavily on location and size)
- Commercial Rent: ₹2L-30L/month (Grade A buildings command premium)

**Generate JSON:**
{
  "title": "Natural title here",
  "description": "Natural description here"
}

**Title Rules (12-18 words):**
❌ NEVER use: "Charming", "Stunning", "Luxurious", "Premium", "Elegant", "Exquisite", "Heart of", "Just steps from", "Nestled in", "Boasts"
✅ DO use: Specific features, actual amenities, real location details
✅ Format: "[Size/Type] [Key Feature] in [Specific Location]"
✅ Examples:
  - "Fully Furnished 3 BHK with Sea View in Bandra West, 2 Covered Parking"
  - "Spacious 2 BHK Office Space in BKC with Modern Fit-Out and Metro Access"
  - "1800 sq.ft 4 BHK Apartment in Worli, Top Floor with City Views"
⚠️ If price seems unusual: DO NOT mention the price in title/description, let the numbers speak

**Description Rules (40-80 words, one paragraph):**
❌ NEVER use: Generic adjectives, flowery language, "offers", "features", "boasts"
✅ DO write: Direct, factual, specific
✅ Start with: What makes it practical/useful
✅ Mention: Building reputation (if known), connectivity, specific amenities, tenant suitability
✅ Examples:
  - "This 2 BHK in Oberoi Sky Heights comes fully furnished with modular kitchen, split ACs, and 2 covered parking. Located on Linking Road, you're walking distance to Bandra station and major restaurants. Building has 24/7 security and backup power."
  - "Commercial space on the 8th floor of a Grade A building in BKC. Modern glass facade, central AC, 2 washrooms, and pantry area included. Direct metro access makes client meetings easy. Suitable for consulting firms or small tech companies."
⚠️ If price seems unusual: Focus on property features, avoid price commentary

**Mumbai Context:**
- Mention metro stations, railway stations if nearby
- Reference known buildings by name if applicable
- Note if expat-friendly, pet-friendly, veg-only (if specified)
- Connectivity matters: mention if near highways, airports
- Area vibe: Bandra = trendy/expat hub, BKC = corporate, Worli = sea-facing luxury, Lower Parel = mills redevelopment

Return ONLY the JSON, nothing else.`;

          const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" }
              },
              required: ["title", "description"]
            }
          });

          aiTitle = response.title;
          aiDescription = response.description;

          // ✅ PARITY LOGGING (non-blocking)
          if (enableParityLogging) {
            const enrichmentTime = performance.now() - startTime;
            
            // Fire-and-forget parity log
            base44.functions.invoke('parityLog', {
              property_id: property.id,
              client_title: aiTitle,
              client_description: aiDescription,
              enrichment_time_ms: Math.round(enrichmentTime),
              price_warning: priceWarning || null,
              session_id: sessionStorage.getItem('session_id') || Math.random().toString(36).substring(2)
            }).catch(err => {
              // Silent fail - don't block user experience
              console.warn('Parity logging failed:', err);
            });
          }

        } else {
          // ⚠️ FALLBACK: Backend function (if still exists)
          const response = await base44.functions.invoke('generatePropertyDescriptions', {
            property_id: property.id
          });
          
          aiTitle = response.data.title;
          aiDescription = response.data.description;
        }

        // Update property with AI content
        const updateData = {};
        if (needsTitle && aiTitle) {
          updateData.ai_title = aiTitle;
        }
        if (needsDescription && aiDescription) {
          updateData.ai_description = aiDescription;
        }

        if (Object.keys(updateData).length > 0) {
          await base44.entities.Property.update(property.id, updateData);
          
          // Mark as enriched in session
          sessionStorage.setItem(enrichmentKey, 'true');
          
          // Update local state
          setEnrichedProperty({ ...property, ...updateData });
        }

      } catch (error) {
        console.error('AI enrichment failed:', error);
        // Fallback to original property
        setEnrichedProperty(property);
      } finally {
        setIsEnriching(false);
      }
    };

    // Debounce enrichment (only if property is visible for 500ms)
    const debounceMs = getFeatureWithOverride('debounceEnrichmentMs') || 500;
    const timer = setTimeout(enrichProperty, debounceMs);
    return () => clearTimeout(timer);

  }, [property?.id]);

  return { property: enrichedProperty, isEnriching };
}