import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Get existing user by phone or create new one
 * Simplifies agent logic - auto-creates users with smart defaults
 * 
 * Input: { phone: "+919876543210", name: "Rajesh Sharma" }
 * Output: { user: {...}, created: boolean }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse request body
    const { phone, name } = await req.json();
    
    if (!phone) {
      return Response.json({ 
        error: 'Phone number is required' 
      }, { status: 400 });
    }
    
    // Normalize phone to +91XXXXXXXXXX format
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneLast10 = cleanPhone.slice(-10);
    
    // Validate Indian mobile number
    if (phoneLast10.length !== 10) {
      return Response.json({ 
        error: 'Invalid phone number - must be 10 digits' 
      }, { status: 400 });
    }
    
    if (!['6', '7', '8', '9'].includes(phoneLast10[0])) {
      return Response.json({ 
        error: 'Invalid Indian mobile number - must start with 6, 7, 8, or 9' 
      }, { status: 400 });
    }
    
    const normalizedPhone = '91' + phoneLast10;
    
    // Search for existing user by phone
    const allUsers = await base44.asServiceRole.entities.User.list();
    let existingUser = allUsers.find(u => {
      if (!u.phone) return false;
      const userPhoneLast10 = u.phone.replace(/\D/g, '').slice(-10);
      return userPhoneLast10 === phoneLast10;
    });
    
    // If user exists, return it
    if (existingUser) {
      return Response.json({
        user: existingUser,
        created: false,
        message: 'User found'
      });
    }
    
    // Create new user with broker role by default
    const newUser = await base44.asServiceRole.entities.User.create({
      phone: normalizedPhone,
      full_name: name || 'Unknown User',
      email: `user_${phoneLast10}@propai.temp`, // Temporary email
      role: 'broker', // Default role
      broker_profile: {
        company: null,
        verified: false,
        trust_score: 50, // Starting score
        specialization: [],
        areas_covered: []
      },
      stats: {
        properties_listed: 0,
        properties_sold: 0,
        active_listings: 0,
        last_active: new Date().toISOString()
      },
      source: 'whatsapp'
    });
    
    return Response.json({
      user: newUser,
      created: true,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('getOrCreateUser error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});