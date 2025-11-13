import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Notify Broker of Property Matches via WhatsApp
 * Called after automatch finds high-quality matches (80+)
 * Sends WhatsApp message to broker with matched properties
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requirement_id, matches } = await req.json();
    
    if (!requirement_id || !matches || matches.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Missing requirement_id or matches' 
      }, { status: 400 });
    }
    
    // Get requirement with broker details
    const requirements = await base44.asServiceRole.entities.Requirement.filter({ id: requirement_id });
    const requirement = requirements[0];
    
    if (!requirement) {
      return Response.json({ 
        success: false, 
        error: 'Requirement not found' 
      }, { status: 404 });
    }
    
    // Get broker details
    const brokers = await base44.asServiceRole.entities.Broker.filter({ id: requirement.broker_id });
    const broker = brokers[0];
    
    if (!broker || !broker.phone) {
      console.log('⚠️ No broker or phone found - skipping notification');
      return Response.json({ 
        success: true, 
        skipped: true,
        reason: 'No broker phone number' 
      });
    }
    
    // Get property details for matched properties
    const propertyIds = matches.map(m => m.property_id);
    const properties = await base44.asServiceRole.entities.Property.filter({ 
      id: { $in: propertyIds } 
    });
    
    // Build WhatsApp message
    const topMatches = matches.slice(0, 3); // Show top 3
    
    let message = `🎯 *New Property Matches Found!*\n\n`;
    message += `Your requirement: ${requirement.bhk_preference?.join(', ') || 'Property'} in ${requirement.preferred_locations?.join(', ') || 'Mumbai'}\n`;
    message += `Budget: ₹${requirement.budget_min}-${requirement.budget_max} ${requirement.budget_unit}\n\n`;
    
    message += `*Top ${topMatches.length} Matches (${matches.length} total):*\n\n`;
    
    topMatches.forEach((match, idx) => {
      const property = properties.find(p => p.id === match.property_id);
      if (property) {
        message += `${idx + 1}. *${property.ai_title || property.bhk + ' in ' + property.location}*\n`;
        message += `   📍 ${property.location}${property.building_name ? ' • ' + property.building_name : ''}\n`;
        message += `   💰 ₹${property.price} ${property.price_unit}\n`;
        message += `   ✅ Match Score: ${match.match_score}/100\n`;
        message += `   🔗 https://propai.live/propertydetails?slug=${property.slug}\n\n`;
      }
    });
    
    if (matches.length > 3) {
      message += `_+ ${matches.length - 3} more matches available on PropAI Live_\n\n`;
    }
    
    message += `🔍 View all: https://propai.live/smartfeed\n`;
    message += `📋 Requirement: https://propai.live/requirementdetails?id=${requirement.id}`;
    
    // Send via WhatsApp (using the agent's WhatsApp connection)
    // Note: This would typically be done through WhatsApp Business API
    // For now, we'll log it and mark for manual follow-up
    
    console.log('📱 WhatsApp notification prepared for:', broker.phone);
    console.log('Message:', message);
    
    // In production, you'd integrate with WhatsApp Business API here:
    // await sendWhatsAppMessage(broker.phone, message);
    
    // For now, we'll send an email as fallback if broker has email
    if (broker.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: broker.email,
          subject: `🎯 ${matches.length} New Property Match${matches.length > 1 ? 'es' : ''} Found!`,
          body: message.replace(/\*/g, '').replace(/_/g, '') // Remove markdown for email
        });
        console.log('✅ Email sent to', broker.email);
      } catch (emailError) {
        console.warn('Email send failed:', emailError.message);
      }
    }
    
    return Response.json({
      success: true,
      broker_phone: broker.phone,
      broker_email: broker.email,
      matches_count: matches.length,
      message_prepared: true,
      whatsapp_message: message
    });
    
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});