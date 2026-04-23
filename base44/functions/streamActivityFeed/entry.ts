import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set up Server-Sent Events headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Create a readable stream for SSE
    let intervalId;
    let lastPropertyId = null;
    let lastRequirementId = null;
    let lastInteractionId = null;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({ 
          type: 'connected', 
          message: 'Activity feed connected',
          timestamp: new Date().toISOString()
        })}\n\n`);

        // Function to check for new activities
        const checkForUpdates = async () => {
          try {
            // Fetch latest activities
            const [properties, requirements, interactions] = await Promise.all([
              base44.asServiceRole.entities.Property.list('-created_date', 5),
              base44.asServiceRole.entities.Requirement.list('-created_date', 3),
              base44.asServiceRole.entities.PropertyInteraction.list('-created_date', 3),
            ]);

            const activities = [];

            // Check for new properties
            if (properties.length > 0) {
              const latestProperty = properties[0];
              if (lastPropertyId !== latestProperty.id) {
                // New property detected
                activities.push({
                  id: `prop-${latestProperty.id}`,
                  type: 'property',
                  action: 'new_listing',
                  title: 'New Property Listed',
                  description: `${latestProperty.bhk} in ${latestProperty.location}`,
                  metadata: {
                    propertyId: latestProperty.id,
                    bhk: latestProperty.bhk,
                    location: latestProperty.location,
                    price: latestProperty.price,
                    priceUnit: latestProperty.price_unit,
                    listingType: latestProperty.listing_type,
                    brokerName: latestProperty.broker_name || 'Unknown',
                  },
                  timestamp: latestProperty.created_date,
                });
                lastPropertyId = latestProperty.id;
              }
            }

            // Check for new requirements
            if (requirements.length > 0) {
              const latestRequirement = requirements[0];
              if (lastRequirementId !== latestRequirement.id) {
                activities.push({
                  id: `req-${latestRequirement.id}`,
                  type: 'requirement',
                  action: 'new_requirement',
                  title: 'New Client Requirement',
                  description: `${latestRequirement.bhk_preference?.join(', ') || 'Any'} in ${latestRequirement.preferred_locations?.[0] || 'Mumbai'}`,
                  metadata: {
                    requirementId: latestRequirement.id,
                    bhkPreference: latestRequirement.bhk_preference,
                    locations: latestRequirement.preferred_locations,
                    urgency: latestRequirement.urgency,
                    clientName: latestRequirement.client_name,
                  },
                  timestamp: latestRequirement.created_date,
                });
                lastRequirementId = latestRequirement.id;
              }
            }

            // Check for new interactions
            if (interactions.length > 0) {
              const latestInteraction = interactions[0];
              if (lastInteractionId !== latestInteraction.id) {
                activities.push({
                  id: `int-${latestInteraction.id}`,
                  type: 'interaction',
                  action: latestInteraction.interaction_type || 'view',
                  title: latestInteraction.interaction_type === 'whatsapp' ? 'WhatsApp Contact' : 'Property View',
                  description: 'User interaction',
                  metadata: {
                    interactionId: latestInteraction.id,
                    interactionType: latestInteraction.interaction_type,
                    propertyId: latestInteraction.property_id,
                  },
                  timestamp: latestInteraction.created_date,
                });
                lastInteractionId = latestInteraction.id;
              }
            }

            // Send new activities if any
            if (activities.length > 0) {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'activities',
                activities,
                timestamp: new Date().toISOString(),
              })}\n\n`);
            }

            // Send heartbeat every 15 seconds to keep connection alive
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            })}\n\n`);

          } catch (error) {
            console.error('Error checking for updates:', error);
            controller.enqueue(`data: ${JSON.stringify({
              type: 'error',
              message: error.message,
              timestamp: new Date().toISOString(),
            })}\n\n`);
          }
        };

        // Check for updates every 5 seconds
        intervalId = setInterval(checkForUpdates, 5000);

        // Initial check
        await checkForUpdates();
      },

      cancel() {
        // Clean up interval when connection closes
        if (intervalId) {
          clearInterval(intervalId);
        }
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Stream error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to establish activity feed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});