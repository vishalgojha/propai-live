import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * DIAGNOSTIC FUNCTION - Proves agent is actually calling functions
 * Returns timestamp + confirms execution
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Log to console (visible in function logs)
    console.log('🚨 DIAGNOSTIC FUNCTION CALLED AT:', new Date().toISOString());
    
    const { test_message } = await req.json();
    console.log('📝 Message received:', test_message);
    
    // Return undeniable proof this function executed
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: '✅ FUNCTION ACTUALLY EXECUTED - NOT HALLUCINATED',
      received: test_message,
      random_proof: Math.random().toString(36).substring(7)
    });

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});