import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all saved searches with alerts enabled
    const savedSearches = await base44.asServiceRole.entities.SavedSearch.filter({ 
      alert_enabled: true 
    });

    if (!savedSearches || savedSearches.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No active alerts to process',
        alerts_processed: 0
      });
    }

    const results = {
      total_searches: savedSearches.length,
      alerts_sent: 0,
      errors: []
    };

    // Get all active properties for matching
    const allProperties = await base44.asServiceRole.entities.Property.filter({ 
      status: "Active",
      is_duplicate: false
    }, '-created_date', 500);

    for (const search of savedSearches) {
      try {
        // Determine notification frequency cutoff
        const now = new Date();
        let cutoffTime = new Date(search.last_notified || search.created_date);
        
        if (search.alert_frequency === 'instant') {
          cutoffTime = new Date(now.getTime() - 5 * 60 * 1000); // Last 5 minutes
        } else if (search.alert_frequency === 'daily') {
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        } else if (search.alert_frequency === 'weekly') {
          cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        }

        // Filter properties matching search criteria
        const matchingProperties = allProperties.filter(property => {
          // Only properties created after last notification
          if (new Date(property.created_date) <= cutoffTime) return false;

          const filters = search.filters || {};

          // Search query match
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
              property.building_name?.toLowerCase().includes(searchLower) ||
              property.location?.toLowerCase().includes(searchLower) ||
              property.pocket?.toLowerCase().includes(searchLower) ||
              property.ai_title?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }

          // BHK match
          if (filters.bhk_multi && filters.bhk_multi.length > 0) {
            if (!filters.bhk_multi.includes(property.bhk)) return false;
          }

          // Location match
          if (filters.location_multi && filters.location_multi.length > 0) {
            if (!filters.location_multi.includes(property.location)) return false;
          }

          // Listing type
          if (filters.listingType && filters.listingType !== "all") {
            if (property.listing_type !== filters.listingType) return false;
          }

          // Property category
          if (filters.propertyCategory && filters.propertyCategory !== "all") {
            if (property.property_category !== filters.propertyCategory) return false;
          }

          // Furnishing
          if (filters.furnishing && filters.furnishing !== "all") {
            if (property.furnishing !== filters.furnishing) return false;
          }

          // Price range
          if (filters.minPrice || filters.maxPrice) {
            const filterUnit = (filters.listingType === 'Sale' || filters.listingType === 'Pre Leased') ? 'crores' : 'lakhs';
            let propertyPriceNormalized;
            if (filterUnit === 'crores') {
              propertyPriceNormalized = property.price_unit === "crores" ? property.price : property.price / 100;
            } else {
              propertyPriceNormalized = property.price_unit === "crores" ? property.price * 100 : property.price;
            }

            if (filters.minPrice && propertyPriceNormalized < parseFloat(filters.minPrice)) return false;
            if (filters.maxPrice && propertyPriceNormalized > parseFloat(filters.maxPrice)) return false;
          }

          // Amenities
          if (filters.amenities && filters.amenities.length > 0) {
            const propertyAmenities = property.amenities || [];
            const hasAllAmenities = filters.amenities.every(amenity => 
              propertyAmenities.some(pa => pa.toLowerCase().includes(amenity.toLowerCase()))
            );
            if (!hasAllAmenities) return false;
          }

          return true;
        });

        if (matchingProperties.length > 0) {
          // Get user info
          const users = await base44.asServiceRole.entities.User.filter({ id: search.user_id });
          const user = users[0];

          if (user && user.email) {
            // Send email notification
            const propertyList = matchingProperties.slice(0, 5).map(p => {
              const price = p.price_unit === 'crores' ? `₹${p.price} Cr` : `₹${p.price} L`;
              return `• ${p.bhk} in ${p.location} - ${price}\n  ${p.building_name || ''}\n  View: https://propai.live/propertydetails?slug=${p.slug || p.id}`;
            }).join('\n\n');

            const moreText = matchingProperties.length > 5 
              ? `\n\n...and ${matchingProperties.length - 5} more properties` 
              : '';

            const emailBody = `Hi ${user.full_name || 'there'},

Great news! We found ${matchingProperties.length} new ${matchingProperties.length === 1 ? 'property' : 'properties'} matching your saved search "${search.name}":

${propertyList}${moreText}

View all matches: https://propai.live/smartfeed

Manage your alerts: https://propai.live/myprofile

---
PropAI Live - Real-time Mumbai property intelligence
Unsubscribe from this alert: https://propai.live/myprofile`;

            await base44.asServiceRole.integrations.Core.SendEmail({
              to: user.email,
              subject: `🏠 ${matchingProperties.length} New ${matchingProperties.length === 1 ? 'Property' : 'Properties'} Match Your Search: ${search.name}`,
              body: emailBody
            });

            // Try to send push notification
            try {
              const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ 
                user_id: search.user_id,
                is_active: true
              });

              for (const sub of subscriptions) {
                try {
                  await base44.asServiceRole.functions.invoke('sendPushNotification', {
                    subscription: {
                      endpoint: sub.endpoint,
                      keys: sub.keys
                    },
                    title: `${matchingProperties.length} New ${matchingProperties.length === 1 ? 'Property' : 'Properties'}`,
                    body: `${search.name}: ${matchingProperties[0].bhk} in ${matchingProperties[0].location}`,
                    data: {
                      url: '/smartfeed',
                      type: 'property_alert'
                    }
                  });
                } catch (pushError) {
                  console.log('Push notification failed for subscription:', pushError);
                }
              }
            } catch (pushError) {
              console.log('Push notification error:', pushError);
            }

            // Update saved search
            await base44.asServiceRole.entities.SavedSearch.update(search.id, {
              last_notified: new Date().toISOString(),
              match_count: matchingProperties.length
            });

            results.alerts_sent++;
          }
        }
      } catch (error) {
        console.error(`Error processing search ${search.id}:`, error);
        results.errors.push({
          search_id: search.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Property alerts error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});