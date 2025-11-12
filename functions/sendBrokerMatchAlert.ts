import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Send WhatsApp Alerts to Brokers when Properties Match Their Requirements
 * Triggered after autoMatchRequirements runs
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requirement_id } = await req.json();
    
    // If specific requirement provided, match only that one
    // Otherwise match all active requirements
    const requirements = requirement_id ? 
      [await base44.asServiceRole.entities.Requirement.get(requirement_id)] :
      await base44.asServiceRole.entities.Requirement.filter({ status: 'Active' });
    
    const notifications = [];
    
    for (const requirement of requirements) {
      // Skip if no matches
      if (!requirement.ai_matched_properties || requirement.ai_matched_properties.length === 0) {
        continue;
      }
      
      // Get broker details
      let broker = null;
      if (requirement.broker_id) {
        try {
          broker = await base44.asServiceRole.entities.Broker.get(requirement.broker_id);
        } catch (error) {
          console.log('Broker not found for requirement:', requirement.id);
          continue;
        }
      }
      
      if (!broker?.phone) {
        console.log('No broker phone for requirement:', requirement.id);
        continue;
      }
      
      // Fetch matched properties
      const matchedPropertyIds = requirement.ai_matched_properties
        .filter(m => m.match_score >= 70)
        .slice(0, 3) // Top 3 only
        .map(m => m.property_id);
      
      if (matchedPropertyIds.length === 0) continue;
      
      const properties = await base44.asServiceRole.entities.Property.list();
      const matchedProperties = properties.filter(p => matchedPropertyIds.includes(p.id));
      
      // Build WhatsApp message
      const message = `🏠 PropAI Match Alert!\n\nHi ${broker.name || 'there'},\n\nWe found ${matchedProperties.length} properties matching your requirement:\n\n` +
        `📋 YOUR REQUIREMENT:\n` +
        `${requirement.bhk_preference?.join(', ') || 'Any BHK'} | ` +
        `${requirement.listing_type} | ` +
        `Budget: ₹${requirement.budget_min || '?'}-${requirement.budget_max || '?'} ${requirement.budget_unit || 'lakhs'}\n` +
        `Location: ${requirement.preferred_locations?.join(', ') || 'Any'}\n\n` +
        `✅ MATCHED PROPERTIES:\n\n` +
        matchedProperties.map((p, idx) => {
          const match = requirement.ai_matched_properties.find(m => m.property_id === p.id);
          return `${idx + 1}. ${p.ai_title || `${p.bhk} in ${p.location}`}\n` +
            `   💰 ${p.price} ${p.price_unit} | 📐 ${p.carpet_area || '?'} sq.ft\n` +
            `   🏢 ${p.building_name || 'Building N/A'}\n` +
            `   🎯 Match: ${match?.match_score || '?'}% ${match?.match_reasons ? '(' + match.match_reasons.slice(0, 2).join(', ') + ')' : ''}\n` +
            `   📱 View: https://propai.live/propertydetails?id=${p.id}\n`;
        }).join('\n') +
        `\n🔗 View all matches on PropAI Live\n\n` +
        `Reply to connect with these properties!`;
      
      // For now, just prepare notification data (actual WhatsApp sending would need Twilio/similar)
      notifications.push({
        broker_id: broker.id,
        broker_name: broker.name,
        broker_phone: broker.phone,
        requirement_id: requirement.id,
        match_count: matchedProperties.length,
        message: message,
        notification_type: 'whatsapp',
        status: 'prepared' // Would be 'sent' after actual WhatsApp API call
      });
      
      // Create interaction record for tracking
      await base44.asServiceRole.entities.BrokerInteraction.create({
        broker_id: broker.id,
        interaction_type: 'WhatsApp',
        direction: 'Outgoing',
        content: message,
        ai_summary: `Auto-match alert sent for ${matchedProperties.length} properties`,
        sentiment: 'Positive'
      });
    }
    
    return Response.json({
      success: true,
      notifications_prepared: notifications.length,
      notifications: notifications,
      next_steps: 'Integrate Twilio/WhatsApp Business API to send actual messages',
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Broker match alert error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});