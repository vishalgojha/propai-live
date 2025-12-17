import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * ✅ BACKEND-FIRST: The ONLY way to create brokers
 * 
 * Auto-normalizes:
 * - Phone number (primary key)
 * - Returns existing broker if phone matches
 * - Generates custom_id atomically
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { payload } = await req.json();

    // Normalize phone
    const normalizePhone = (phone) => {
      if (!phone) return null;
      let cleaned = phone.replace(/\D/g, '');
      cleaned = cleaned.slice(-10);
      if (cleaned.length === 10 && cleaned[0] >= '6' && cleaned[0] <= '9') {
        return '+91' + cleaned;
      }
      return null;
    };

    const normalizedPhone = normalizePhone(payload.phone);
    
    if (!normalizedPhone) {
      return Response.json({
        success: false,
        error: 'Invalid phone number'
      }, { status: 400 });
    }

    // Check if broker already exists by phone
    const allBrokers = await base44.asServiceRole.entities.Broker.list();
    const existingBroker = allBrokers.find(b => {
      const bPhone = normalizePhone(b.phone);
      return bPhone === normalizedPhone;
    });

    if (existingBroker) {
      return Response.json({
        success: true,
        broker: existingBroker,
        status: 'existing'
      });
    }

    // Generate custom_id
    const nextNumber = String(allBrokers.length + 1).padStart(4, '0');
    const customId = `CHR-BRK-${nextNumber}`;

    // Create new broker
    const brokerData = {
      custom_id: customId,
      name: payload.name || "Unknown Broker",
      phone: normalizedPhone,
      status: "Active",
      trust_score: 50 // Default starting trust score
    };

    const newBroker = await base44.asServiceRole.entities.Broker.create(brokerData);

    return Response.json({
      success: true,
      broker: newBroker,
      status: 'created',
      custom_id: customId
    });

  } catch (error) {
    console.error('createBroker error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});