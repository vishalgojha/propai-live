import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brokerId, propertyId, context } = await req.json();
    
    if (!brokerId) {
      return Response.json({ error: 'brokerId is required' }, { status: 400 });
    }

    // Get broker details
    const brokers = await base44.asServiceRole.entities.Broker.list();
    const broker = brokers.find(b => b.id === brokerId);
    
    if (!broker) {
      return Response.json({ error: 'Broker not found' }, { status: 404 });
    }

    // Get property details if propertyId provided
    let property = null;
    if (propertyId) {
      const properties = await base44.asServiceRole.entities.Property.list();
      property = properties.find(p => p.id === propertyId);
    }

    // Get recent interactions with this broker
    const interactions = await base44.asServiceRole.entities.BrokerInteraction.filter(
      { broker_id: brokerId },
      '-created_date',
      5
    );

    const lastInteraction = interactions[0];
    const daysSinceLastContact = lastInteraction 
      ? Math.floor((Date.now() - new Date(lastInteraction.created_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Build context for AI
    let promptContext = `Generate a professional WhatsApp follow-up message for broker: ${broker.name}\n\n`;
    
    promptContext += `Broker Profile:\n`;
    promptContext += `- Response Time: ${broker.response_time || 'Unknown'}\n`;
    promptContext += `- Areas: ${broker.areas_covered?.join(', ') || 'N/A'}\n`;
    promptContext += `- Total Listings: ${broker.total_listings_count || 0}\n`;
    if (broker.notes) promptContext += `- Notes: ${broker.notes}\n`;
    
    if (property) {
      promptContext += `\nProperty to Follow Up:\n`;
      promptContext += `- ${property.bhk} in ${property.location}\n`;
      promptContext += `- ${property.building_name || 'N/A'}\n`;
      promptContext += `- Price: ₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}\n`;
      promptContext += `- ID: ${property.custom_id || property.id}\n`;
      promptContext += `- Days since listing: ${Math.floor((Date.now() - new Date(property.created_date).getTime()) / (1000 * 60 * 60 * 24))}\n`;
    }

    if (lastInteraction) {
      promptContext += `\nLast Interaction (${daysSinceLastContact} days ago):\n`;
      promptContext += `${lastInteraction.ai_summary || lastInteraction.content || 'No summary'}\n`;
    }

    promptContext += `\nAdditional Context: ${context || 'General follow-up'}\n`;

    promptContext += `\n\nIMPORTANT INSTRUCTIONS:\n`;
    promptContext += `1. Keep message SHORT (2-3 lines max)\n`;
    promptContext += `2. Be professional but friendly\n`;
    promptContext += `3. FOCUS ON:\n`;
    promptContext += `   - Asking if property is STILL AVAILABLE\n`;
    promptContext += `   - Requesting PHOTOS if not provided yet\n`;
    promptContext += `4. DO NOT mention views, stats, or analytics\n`;
    promptContext += `5. Use broker's name naturally\n`;
    promptContext += `6. Reference property ID for clarity\n`;
    promptContext += `7. End with a simple question to encourage response\n`;
    promptContext += `8. Use Indian English style\n\n`;
    promptContext += `Generate ONLY the WhatsApp message text. No greetings like "Hi", start directly with broker name.`;

    // Call AI to generate follow-up
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: promptContext,
      add_context_from_internet: false
    });

    const followUpMessage = response.trim();

    // Determine optimal time to send based on broker's response patterns
    let optimalTime = 'Anytime';
    if (broker.response_time === 'Fast') {
      optimalTime = 'Send now - broker responds quickly';
    } else if (daysSinceLastContact > 7) {
      optimalTime = 'Send now - been over a week';
    } else if (daysSinceLastContact < 2) {
      optimalTime = 'Wait 1-2 days - contacted recently';
    }

    // Analyze interaction patterns for best time of day
    const responseTimes = interactions
      .filter(i => i.direction === 'Incoming' && i.response_time_minutes)
      .map(i => ({
        hour: new Date(i.created_date).getHours(),
        responseTime: i.response_time_minutes
      }));

    let bestTimeOfDay = 'Morning (10 AM - 1 PM)'; // Default
    if (responseTimes.length >= 3) {
      const avgByTimeOfDay = {
        morning: responseTimes.filter(t => t.hour >= 10 && t.hour < 13).reduce((sum, t) => sum + t.responseTime, 0) / responseTimes.filter(t => t.hour >= 10 && t.hour < 13).length || 999,
        afternoon: responseTimes.filter(t => t.hour >= 13 && t.hour < 17).reduce((sum, t) => sum + t.responseTime, 0) / responseTimes.filter(t => t.hour >= 13 && t.hour < 17).length || 999,
        evening: responseTimes.filter(t => t.hour >= 17 && t.hour < 21).reduce((sum, t) => sum + t.responseTime, 0) / responseTimes.filter(t => t.hour >= 17 && t.hour < 21).length || 999
      };

      const fastest = Object.entries(avgByTimeOfDay).sort((a, b) => a[1] - b[1])[0];
      if (fastest[0] === 'morning') bestTimeOfDay = 'Morning (10 AM - 1 PM)';
      else if (fastest[0] === 'afternoon') bestTimeOfDay = 'Afternoon (2 PM - 5 PM)';
      else bestTimeOfDay = 'Evening (5 PM - 8 PM)';
    }

    return Response.json({
      message: followUpMessage,
      broker: {
        name: broker.name,
        phone: broker.phone,
        responsePattern: broker.response_time
      },
      recommendations: {
        sendTiming: optimalTime,
        bestTimeOfDay: bestTimeOfDay,
        daysSinceLastContact: daysSinceLastContact
      },
      whatsappUrl: `https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(followUpMessage)}`
    });

  } catch (error) {
    console.error('Error generating follow-up:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});