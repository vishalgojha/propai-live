import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * DIAGNOSTIC CHECK - Verify if data is actually being saved
 * Returns recent activity, function call logs, and potential issues
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent data (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
    
    const allProperties = await base44.asServiceRole.entities.Property.list('-created_date');
    const allRequirements = await base44.asServiceRole.entities.Requirement.list('-created_date');
    const allBrokers = await base44.asServiceRole.entities.Broker.list('-created_date');
    
    const recentProperties = allProperties.filter(p => 
      p.created_date && new Date(p.created_date) >= twoHoursAgo
    );
    
    const recentRequirements = allRequirements.filter(r => 
      r.created_date && new Date(r.created_date) >= twoHoursAgo
    );
    
    const recentBrokers = allBrokers.filter(b => 
      b.created_date && new Date(b.created_date) >= twoHoursAgo
    );
    
    // Check last 10 properties for data quality
    const last10Properties = allProperties.slice(0, 10);
    const dataQualityIssues = last10Properties.map(p => {
      const issues = [];
      if (!p.custom_id) issues.push('Missing custom_id');
      if (!p.slug) issues.push('Missing slug');
      if (!p.ai_title) issues.push('Missing ai_title');
      if (!p.ai_description) issues.push('Missing ai_description');
      if (!p.broker_id) issues.push('Missing broker_id');
      if (!p.location) issues.push('Missing location');
      
      return {
        id: p.id,
        custom_id: p.custom_id || 'MISSING',
        created_date: p.created_date,
        issues: issues,
        has_issues: issues.length > 0
      };
    });
    
    const propertiesWithIssues = dataQualityIssues.filter(p => p.has_issues);
    
    // Check SmartFeed counter logic
    const activeProperties = allProperties.filter(p => 
      p.status === 'Active' && !p.is_duplicate
    );
    
    const smartFeedCount = activeProperties.length;
    
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      recent_activity: {
        last_2_hours: {
          properties: recentProperties.length,
          requirements: recentRequirements.length,
          brokers: recentBrokers.length
        },
        last_property: recentProperties[0] ? {
          custom_id: recentProperties[0].custom_id,
          created_date: recentProperties[0].created_date,
          location: recentProperties[0].location,
          broker_name: recentProperties[0].broker_name,
          source: recentProperties[0].source_text ? 'WhatsApp AI' : 'Manual'
        } : null,
        last_requirement: recentRequirements[0] ? {
          custom_id: recentRequirements[0].custom_id,
          created_date: recentRequirements[0].created_date,
          broker_name: recentRequirements[0].client_name
        } : null
      },
      
      smartfeed_counter: {
        should_show: smartFeedCount,
        total_in_db: allProperties.length,
        active_count: allProperties.filter(p => p.status === 'Active').length,
        non_duplicate_count: allProperties.filter(p => !p.is_duplicate).length,
        active_non_duplicate: smartFeedCount
      },
      
      data_quality: {
        last_10_properties: dataQualityIssues,
        properties_with_issues: propertiesWithIssues.length,
        common_issues: propertiesWithIssues.length > 0 ? 
          propertiesWithIssues[0].issues : []
      },
      
      database_health: {
        total_properties: allProperties.length,
        total_brokers: allBrokers.length,
        total_requirements: allRequirements.length,
        properties_missing_broker_id: allProperties.filter(p => !p.broker_id).length,
        properties_missing_custom_id: allProperties.filter(p => !p.custom_id).length,
        properties_missing_location: allProperties.filter(p => !p.location).length
      },
      
      diagnosis: {
        is_data_being_saved: recentProperties.length > 0 || recentRequirements.length > 0,
        last_activity_minutes_ago: recentProperties[0] ? 
          Math.floor((Date.now() - new Date(recentProperties[0].created_date)) / 60000) : null,
        potential_issues: [
          recentProperties.length === 0 ? '⚠️ No properties created in last 2 hours' : null,
          propertiesWithIssues.length > 0 ? `⚠️ ${propertiesWithIssues.length}/10 recent properties have data issues` : null,
          allProperties.filter(p => !p.broker_id).length > 10 ? '⚠️ Many properties missing broker_id' : null
        ].filter(Boolean)
      }
    });
    
  } catch (error) {
    console.error('Diagnostic check error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});