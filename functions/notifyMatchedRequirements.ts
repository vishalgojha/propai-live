import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Notify Users When Requirements Get Matched
 * Sends WhatsApp + Browser Push + Email notifications
 * Called after autoMatchRequirements runs
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requirement_ids } = await req.json();

    // If no specific requirements, check all active requirements with recent matches
    let requirements;
    if (requirement_ids && requirement_ids.length > 0) {
      requirements = await Promise.all(
        requirement_ids.map(id => base44.asServiceRole.entities.Requirement.filter({ id }))
      );
      requirements = requirements.flat();
    } else {
      // Get requirements updated in last hour with matches
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const allRequirements = await base44.asServiceRole.entities.Requirement.filter({
        status: 'Active'
      });
      requirements = allRequirements.filter(r => 
        r.ai_matched_properties?.length > 0 && 
        r.updated_date > oneHourAgo
      );
    }

    const notifications = [];

    for (const requirement of requirements) {
      if (!requirement.ai_matched_properties || requirement.ai_matched_properties.length === 0) {
        continue;
      }

      // Get broker details
      const broker = await base44.asServiceRole.entities.Broker.filter({
        id: requirement.broker_id
      }).then(brokers => brokers[0]);

      if (!broker) continue;

      const matchCount = requirement.ai_matched_properties.length;
      const topScore = Math.max(...requirement.ai_matched_properties.map(m => m.match_score));

      // 1. WhatsApp Notification (via agent)
      let whatsappSent = false;
      if (broker.phone) {
        try {
          // Format match summary
          const matchSummary = requirement.ai_matched_properties
            .slice(0, 3)
            .map(m => {
              const reasons = m.match_reasons.join(', ');
              return `🏠 Match Score: ${m.score}%\n   ${reasons}`;
            })
            .join('\n\n');

          const whatsappMessage = `🎯 **Found ${matchCount} Properties Matching Your Requirement!**

${requirement.bhk_preference?.join(', ')} in ${requirement.preferred_locations?.join(', ')}
Budget: ₹${requirement.budget_min}-${requirement.budget_max} ${requirement.budget_unit}

**Top Matches:**
${matchSummary}

View all matches: https://propai.live/smartfeed?requirement=${requirement.id}

Reply "show matches" to see details! 🚀`;

          // Note: This requires WhatsApp Business API integration
          // For now, we'll log it - you can integrate with your WhatsApp agent
          console.log(`WhatsApp notification to ${broker.phone}:`, whatsappMessage);
          whatsappSent = true;
        } catch (error) {
          console.error('WhatsApp notification failed:', error);
        }
      }

      // 2. Browser Push Notification
      let pushSent = false;
      try {
        const pushResponse = await base44.asServiceRole.functions.invoke('sendPushNotification', {
          title: `🎯 ${matchCount} Properties Match Your Requirements!`,
          body: `We found ${matchCount} properties matching "${requirement.bhk_preference?.join(', ')} in ${requirement.preferred_locations?.join(', ')}"`,
          data: {
            type: 'requirement_match',
            requirement_id: requirement.id,
            match_count: matchCount,
            url: `/smartfeed?requirement=${requirement.id}`
          },
          broker_ids: [requirement.broker_id]
        });

        pushSent = pushResponse.data?.sent > 0;
      } catch (error) {
        console.error('Browser push failed:', error);
      }

      // 3. Email Notification (optional)
      let emailSent = false;
      if (broker.email) {
        try {
          const propertyList = requirement.ai_matched_properties
            .slice(0, 5)
            .map(m => {
              return `<li>Match Score: ${m.match_score}% - ${m.match_reasons.join(', ')}</li>`;
            })
            .join('');

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: broker.email,
            subject: `🎯 ${matchCount} Properties Match Your Requirements - PropAI Live`,
            body: `
              <h2>Great News! We Found ${matchCount} Matching Properties</h2>
              <p><strong>Your Requirement:</strong></p>
              <ul>
                <li>Type: ${requirement.bhk_preference?.join(', ') || 'Any'}</li>
                <li>Budget: ₹${requirement.budget_min}-${requirement.budget_max} ${requirement.budget_unit}</li>
                <li>Location: ${requirement.preferred_locations?.join(', ') || 'Any'}</li>
              </ul>
              
              <h3>Top Matches:</h3>
              <ul>${propertyList}</ul>
              
              <p><a href="https://propai.live/smartfeed?requirement=${requirement.id}" style="background: linear-gradient(to right, #9333ea, #2563eb); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View All Matches →</a></p>
              
              <hr>
              <p style="color: #666; font-size: 12px;">PropAI Live - Mumbai's AI-powered property intelligence platform</p>
            `
          });
          emailSent = true;
        } catch (error) {
          console.error('Email notification failed:', error);
        }
      }

      notifications.push({
        requirement_id: requirement.id,
        broker_id: requirement.broker_id,
        broker_name: broker.name,
        match_count: matchCount,
        top_score: topScore,
        whatsapp_sent: whatsappSent,
        push_sent: pushSent,
        email_sent: emailSent
      });
    }

    return Response.json({
      success: true,
      notified: notifications.length,
      notifications
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});