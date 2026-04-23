import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationText, brokerId, propertyId } = await req.json();
    
    if (!conversationText) {
      return Response.json({ error: 'conversationText is required' }, { status: 400 });
    }

    // Build AI prompt for summarization
    const prompt = `You are summarizing a WhatsApp conversation between Chariot Realty and a property broker.

CONVERSATION:
${conversationText}

Generate a JSON response with the following structure:
{
  "summary": "2-3 sentence summary of the conversation",
  "key_points": ["array", "of", "action items", "or key information"],
  "sentiment": "Positive" | "Neutral" | "Negative",
  "availability_confirmed": true/false (was property availability confirmed?),
  "photos_received": true/false (were photos shared?),
  "follow_up_required": true/false (does this need follow-up?),
  "follow_up_reason": "reason if follow-up needed, else null"
}

FOCUS ON:
- Property availability status
- Photo sharing status
- Any pricing changes
- Viewing schedules
- Concerns or issues raised

Be concise and actionable.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          key_points: { type: "array", items: { type: "string" } },
          sentiment: { type: "string", enum: ["Positive", "Neutral", "Negative"] },
          availability_confirmed: { type: "boolean" },
          photos_received: { type: "boolean" },
          follow_up_required: { type: "boolean" },
          follow_up_reason: { type: "string" }
        }
      }
    });

    // Save interaction to database
    const interactionData = {
      broker_id: brokerId,
      property_id: propertyId || null,
      interaction_type: "WhatsApp",
      direction: "Incoming", // Assume incoming for summary
      content: conversationText,
      ai_summary: response.summary,
      key_points: response.key_points,
      sentiment: response.sentiment,
      availability_confirmed: response.availability_confirmed,
      photos_received: response.photos_received,
      follow_up_required: response.follow_up_required
    };

    const savedInteraction = await base44.asServiceRole.entities.BrokerInteraction.create(interactionData);

    // Update broker's last_activity
    if (brokerId) {
      await base44.asServiceRole.entities.Broker.update(brokerId, {
        last_activity: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      interactionId: savedInteraction.id,
      ...response
    });

  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});