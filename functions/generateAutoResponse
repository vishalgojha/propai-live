import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * AUTO-RESPONSE GENERATOR
 * 
 * Generates contextual, professional responses to property inquiries
 * Detects inquiry type and provides appropriate response with property details
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 });
    }

    const { 
      inquiryText, 
      propertyId = null,
      inquirerType = 'client' // 'client' or 'broker'
    } = await req.json();
    
    if (!inquiryText || inquiryText.trim().length < 5) {
      return Response.json({ 
        success: false,
        error: 'inquiryText is required and must be at least 5 characters' 
      }, { status: 400 });
    }

    // Get property details if property ID provided
    let property = null;
    if (propertyId) {
      const properties = await base44.asServiceRole.entities.Property.list();
      property = properties.find(p => p.id === propertyId);
    }

    // Analyze inquiry to determine type and generate response
    const analysisPrompt = `Analyze this property inquiry and generate a professional response.

Inquiry:
"""
${inquiryText}
"""

${property ? `
Property Details:
- Type: ${property.bhk}
- Location: ${property.location}
- Price: ₹${property.price}${property.price_unit === 'crores' ? ' Crores' : ' Lakhs'}
- Furnishing: ${property.furnishing || 'Not specified'}
- Status: ${property.status}
- Building: ${property.building_name || 'Not specified'}
` : 'No specific property mentioned'}

Inquirer Type: ${inquirerType === 'broker' ? 'Real estate broker' : 'Direct client'}

Return this EXACT JSON structure:
{
  "inquiry_type": "string (Availability Check|Viewing Request|Price Negotiation|Details Request|General Inquiry)",
  "urgency": "string (High|Medium|Low)",
  "response": "string (2-3 paragraph professional response, include property details if available)",
  "suggested_actions": ["array of 2-3 next steps for admin"],
  "tone": "string (Professional|Friendly|Formal)"
}

Response guidelines:
- Be warm but professional
- Include specific property details when available
- For brokers: acknowledge their professionalism, confirm details
- For clients: be helpful, answer questions, offer viewing
- Always end with clear next steps
- Use natural, conversational tone`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          inquiry_type: { type: "string" },
          urgency: { type: "string" },
          response: { type: "string" },
          suggested_actions: { type: "array", items: { type: "string" } },
          tone: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      inquiry: {
        text: inquiryText,
        type: response.inquiry_type,
        urgency: response.urgency,
        property_id: propertyId,
        inquirer_type: inquirerType
      },
      auto_response: {
        message: response.response,
        tone: response.tone,
        suggested_actions: response.suggested_actions
      },
      whatsapp_ready: true
    });

  } catch (error) {
    console.error('Auto-response generation error:', error);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});