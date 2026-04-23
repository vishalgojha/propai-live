import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Meta WhatsApp Business API Webhook
 * Receives WhatsApp messages and routes them to PropAI agent
 * 
 * Setup:
 * 1. Set secrets: WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 * 2. Configure webhook in Meta: https://developers.facebook.com/apps/
 * 3. Webhook URL: https://your-app.base44.com/api/whatsappMetaWebhook
 * 4. Subscribe to: messages
 */

const AGENT_NAME = 'propai_live';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);

  // GET - Webhook verification (Meta requirement)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('❌ Webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // POST - Handle incoming messages
  if (req.method === 'POST') {
    try {
      const body = await req.json();

      // Extract message data
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        // Not a message event (status update, etc.)
        return Response.json({ success: true });
      }

      const message = messages[0];
      const from = message.from; // User's phone number
      const messageBody = message.text?.body;
      const messageType = message.type;

      console.log('📩 WhatsApp message from:', from);

      // Only handle text messages for now
      if (messageType !== 'text' || !messageBody) {
        await sendWhatsAppMessage(from, "Sorry, I can only process text messages right now.");
        return Response.json({ success: true });
      }

      // Get or create conversation for this phone number
      const conversations = await base44.asServiceRole.entities.Conversation
        .filter({ agent_name: AGENT_NAME })
        .catch(() => []);

      let conversation = conversations.find(c => 
        c.metadata?.whatsapp_phone === from
      );

      if (!conversation) {
        conversation = await base44.asServiceRole.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: {
            whatsapp_phone: from,
            source: 'meta_whatsapp',
            created_at: new Date().toISOString()
          }
        });
        console.log('✅ Created new conversation:', conversation.id);
      }

      // Add user message to conversation
      await base44.asServiceRole.agents.addMessage(conversation, {
        role: 'user',
        content: messageBody
      });

      // Subscribe to agent responses
      let fullResponse = '';
      let lastChunk = '';
      
      await new Promise((resolve) => {
        const unsubscribe = base44.asServiceRole.agents.subscribeToConversation(
          conversation.id,
          (data) => {
            const messages = data.messages || [];
            const lastMessage = messages[messages.length - 1];

            if (lastMessage?.role === 'assistant') {
              const content = lastMessage.content || '';
              
              // Detect when streaming is complete (no change in content)
              if (content === lastChunk) {
                fullResponse = content;
                unsubscribe();
                resolve();
              }
              lastChunk = content;
            }
          }
        );

        // Timeout after 30 seconds
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 30000);
      });

      // Send response back via WhatsApp
      if (fullResponse) {
        await sendWhatsAppMessage(from, fullResponse);
        console.log('✅ Sent response to WhatsApp');
      }

      return Response.json({ success: true });

    } catch (error) {
      console.error('❌ Error processing WhatsApp message:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});

/**
 * Send message via Meta WhatsApp Business API
 */
async function sendWhatsAppMessage(to, text) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('WhatsApp API error:', error);
    throw new Error(`WhatsApp API failed: ${error}`);
  }

  return response.json();
}