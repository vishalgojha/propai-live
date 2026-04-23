import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Fix Property Visibility
 * 
 * Sets visibility="public" on all properties that don't have it set.
 * This fixes the issue where properties exist in DB but aren't visible due to RLS rules.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Get ALL properties using service role (bypasses RLS)
    const allProperties = await base44.asServiceRole.entities.Property.list();
    
    console.log(`Total properties in database: ${allProperties.length}`);
    
    // Find properties without visibility field or with null/undefined
    const propertiesNeedingFix = allProperties.filter(p => !p.visibility);
    
    console.log(`Properties needing visibility fix: ${propertiesNeedingFix.length}`);
    
    if (propertiesNeedingFix.length === 0) {
      return Response.json({
        success: true,
        message: 'All properties already have visibility set!',
        stats: {
          total_properties: allProperties.length,
          fixed: 0,
          already_set: allProperties.length
        }
      });
    }

    // Fix each property
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const property of propertiesNeedingFix) {
      try {
        await base44.asServiceRole.entities.Property.update(property.id, {
          visibility: 'public'
        });
        
        successCount++;
        results.push({
          id: property.id,
          custom_id: property.custom_id,
          status: 'success'
        });
      } catch (error) {
        errorCount++;
        results.push({
          id: property.id,
          custom_id: property.custom_id,
          status: 'error',
          error: error.message
        });
        console.error(`Failed to fix property ${property.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      message: `Fixed visibility for ${successCount} properties!`,
      stats: {
        total_properties: allProperties.length,
        needed_fix: propertiesNeedingFix.length,
        fixed: successCount,
        errors: errorCount,
        already_set: allProperties.length - propertiesNeedingFix.length
      },
      results: results.slice(0, 20) // Show first 20 for debugging
    });

  } catch (error) {
    console.error('Fix visibility error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});