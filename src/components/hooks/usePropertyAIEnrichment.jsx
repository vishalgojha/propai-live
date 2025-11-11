import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getFeatureWithOverride } from '@/config/features.js';

/**
 * Hook to automatically enrich properties with AI-generated titles and descriptions
 * Runs on-demand when properties are displayed (no heavy backend backfill needed)
 * 
 * Features:
 * - Feature flag support (client-side vs backend)
 * - Parity logging for monitoring
 * - Session caching to prevent re-enrichment
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
          // ✅ CLIENT-SIDE AI GENERATION
          const prompt = `Generate a property listing title and description for this Mumbai property:

**Property Details:**
- BHK: ${property.bhk}
- Price: ₹${property.price} ${property.price_unit}
- Listing Type: ${property.listing_type}
- Location: ${property.location}${property.pocket ? ` (${property.pocket})` : ''}
- Building: ${property.building_name || 'N/A'}
- Category: ${property.property_category}
- Carpet Area: ${property.carpet_area || 'N/A'} sq.ft
- Furnishing: ${property.furnishing || 'N/A'}
- Floor: ${property.floor || 'N/A'}${property.total_floors ? ` of ${property.total_floors}` : ''}
- Parking: ${property.parking || 'N/A'}
- Amenities: ${property.amenities?.slice(0, 5).join(', ') || 'N/A'}
- View: ${property.view || 'N/A'}

**Output JSON format:**
{
  "title": "Natural, engaging title (12-18 words, highlight key features like location, view, furnishing)",
  "description": "Full paragraph description (40-80 words, engaging, specific, no generic fluff)"
}

**Rules:**
- Title: Conversational, not salesy. Example: "Spacious 3 BHK with Sea Views in Prime Bandra West Location"
- Description: Full paragraph, paint the picture, mention standout features
- Be specific about location/building/amenities
- No "luxury", "premium", "world-class" generic terms
- Mumbai context matters (mention connectivity, vibe)

Return ONLY the JSON, no other text.`;

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