import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ✅ Automated Broker Onboarding
 * Sends welcome email + WhatsApp instructions to new brokers
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { broker_id } = await req.json();

    // Get broker details
    const broker = await base44.asServiceRole.entities.Broker.filter({ id: broker_id });
    
    if (!broker || broker.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Broker not found' 
      }, { status: 404 });
    }

    const brokerData = broker[0];
    
    // Generate profile URL
    const profileUrl = `https://propai.live/r?u=${brokerData.slug || brokerData.id}`;
    const whatsappAgentUrl = `https://wa.me/919819471310?text=${encodeURIComponent('Hi PropAI team, I just joined as a broker. I want to start listing properties!')}`;

    // Send welcome email
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #9333ea, #3b82f6); padding: 30px; text-align: center; border-radius: 16px; margin-bottom: 30px; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; }
    .card { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 10px 5px; }
    .btn-secondary { background: linear-gradient(135deg, #9333ea, #7c3aed); }
    .step { background: #f9fafb; border-left: 4px solid #9333ea; padding: 16px; margin: 16px 0; border-radius: 8px; }
    .step h3 { margin: 0 0 8px 0; color: #9333ea; font-size: 16px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to PropAI Live!</h1>
      <p>Your broker account is ready, ${brokerData.name}!</p>
    </div>

    <div class="card">
      <h2 style="margin-top: 0;">👋 Hello ${brokerData.name},</h2>
      <p>You're now part of Mumbai's smartest property platform. Here's how to get started:</p>

      <div class="step">
        <h3>1️⃣ Connect WhatsApp AI Agent</h3>
        <p>Send property listings directly via WhatsApp. Our AI will parse and publish them instantly.</p>
        <a href="${whatsappAgentUrl}" class="btn">💬 Connect WhatsApp</a>
      </div>

      <div class="step">
        <h3>2️⃣ View Your Profile</h3>
        <p>Your public profile page is live at:</p>
        <a href="${profileUrl}" class="btn btn-secondary">🔗 View My Profile</a>
      </div>

      <div class="step">
        <h3>3️⃣ Start Listing Properties</h3>
        <p><strong>Send WhatsApp messages like:</strong></p>
        <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 13px;">
2 BHK in Bandra West
₹1.2L rent
850 sqft
Furnished
1 parking
Building: Silver Heights</pre>
        <p style="margin-top: 12px;"><strong>That's it!</strong> Our AI handles the rest.</p>
      </div>
    </div>

    <div class="card">
      <h3>💡 Quick Tips</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Include BHK, price, location, and area for best results</li>
        <li>Send multiple properties in one message - AI will separate them</li>
        <li>Add photos to WhatsApp messages for better visibility</li>
        <li>Properties go live within seconds</li>
      </ul>
    </div>

    <div class="card" style="background: #fef3c7; border-color: #fbbf24;">
      <h3 style="color: #92400e; margin-top: 0;">🚀 Your Benefits</h3>
      <p style="color: #78350f; margin: 0;">
        ✅ Instant property publishing<br>
        ✅ AI-generated descriptions & titles<br>
        ✅ BrokerTrust™ scoring (builds over time)<br>
        ✅ Direct client connections<br>
        ✅ Public profile page (${profileUrl})
      </p>
    </div>

    <div class="footer">
      <p><strong>PropAI Live</strong> | Mumbai's AI-Powered Property Intelligence</p>
      <p style="font-size: 12px;">Questions? Reply to this email or WhatsApp us anytime.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email
    if (brokerData.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: "PropAI Live",
        to: brokerData.email,
        subject: `🎉 Welcome to PropAI Live, ${brokerData.name}!`,
        body: emailBody
      });
    }

    return Response.json({
      success: true,
      broker_id: broker_id,
      profile_url: profileUrl,
      email_sent: !!brokerData.email
    });

  } catch (error) {
    console.error('sendBrokerWelcome error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});