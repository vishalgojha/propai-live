import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Send Daily Market Insights Email to Admins
 * Aggregates key metrics, deals, anomalies, and sends formatted email
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');
    
    if (admins.length === 0) {
      return Response.json({ error: 'No admin users found' }, { status: 400 });
    }
    
    // Fetch today's data
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const properties = await base44.asServiceRole.entities.Property.list();
    const newToday = properties.filter(p => 
      p.created_date && new Date(p.created_date) >= today
    );
    
    // Generate market insights
    const insightsResponse = await base44.asServiceRole.functions.invoke('generateMarketInsights', {
      timeframe: '7d'
    });
    
    // Detect anomalies (deals + problems)
    const anomaliesResponse = await base44.asServiceRole.functions.invoke('detectMarketAnomalies', {});
    
    const deals = anomaliesResponse.data.anomalies?.filter(a => a.type === 'underpriced').slice(0, 5) || [];
    const problems = anomaliesResponse.data.anomalies?.filter(a => a.type === 'overpriced' || a.type === 'broker_spam').slice(0, 3) || [];
    
    // Build email content
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .metric { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #7c3aed; }
    .deal { background: #dcfce7; padding: 12px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #22c55e; }
    .problem { background: #fef2f2; padding: 12px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #ef4444; }
    .insight { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
    h2 { color: #1e293b; margin-top: 30px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #22c55e; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    .badge-danger { background: #ef4444; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚡ PropAI Daily Intelligence</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <h2>📊 Today's Metrics</h2>
    <div class="metric">
      <strong>New Listings:</strong> ${newToday.length} properties added today
    </div>
    <div class="metric">
      <strong>Total Active:</strong> ${properties.filter(p => p.status === 'Active').length} properties
    </div>
    <div class="metric">
      <strong>Anomalies Detected:</strong> ${anomaliesResponse.data.total_anomalies || 0}
      <span class="badge badge-danger">${anomaliesResponse.data.by_severity?.high || 0} High</span>
      <span class="badge badge-warning">${anomaliesResponse.data.by_severity?.medium || 0} Medium</span>
    </div>
    
    ${deals.length > 0 ? `
    <h2>💰 Top Deals (Underpriced)</h2>
    ${deals.map(deal => `
      <div class="deal">
        <strong>${deal.property_title}</strong><br>
        <small>Building: ${deal.building_name}</small><br>
        Price: ${deal.price} <span class="badge badge-success">${deal.deviation} below avg</span><br>
        <small>Building Avg: ${deal.building_avg} | Z-Score: ${deal.z_score}</small>
        ${deal.ai_analysis ? `<br><em>${deal.ai_analysis.likely_cause}</em>` : ''}
      </div>
    `).join('')}
    ` : ''}
    
    ${problems.length > 0 ? `
    <h2>⚠️ Data Quality Issues</h2>
    ${problems.map(problem => `
      <div class="problem">
        <strong>${problem.type === 'broker_spam' ? 'Possible Spam Activity' : 'Overpriced Listing'}</strong><br>
        ${problem.property_title || `Broker: ${problem.broker_id}`}<br>
        ${problem.deviation ? `Price: ${problem.deviation} above market` : ''}
        ${problem.listing_count ? `${problem.listing_count} listings in ${problem.timeframe}` : ''}
      </div>
    `).join('')}
    ` : ''}
    
    ${insightsResponse.data?.ai_insights ? `
    <h2>🧠 Market Insights (Last 7 Days)</h2>
    ${insightsResponse.data.ai_insights.map(insight => `
      <div class="insight">
        ${insight}
      </div>
    `).join('')}
    
    <div class="metric" style="margin-top: 20px;">
      <strong>Summary:</strong> ${insightsResponse.data.summary}
    </div>
    ` : ''}
    
    <div class="footer">
      <p>🤖 Generated by PropAI Intelligence Engine</p>
      <p><a href="https://propai.live/admin" style="color: #7c3aed;">View Full Dashboard →</a></p>
    </div>
  </div>
</body>
</html>
`;

    // Send to all admins
    const emailPromises = admins.map(admin => 
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'PropAI Intelligence',
        to: admin.email,
        subject: `📊 Daily PropAI Insights - ${newToday.length} New Listings | ${deals.length} Deals`,
        body: emailBody
      })
    );
    
    await Promise.all(emailPromises);
    
    return Response.json({
      success: true,
      emails_sent: admins.length,
      recipients: admins.map(a => a.email),
      metrics: {
        new_today: newToday.length,
        total_active: properties.filter(p => p.status === 'Active').length,
        deals_found: deals.length,
        problems_found: problems.length
      },
      sent_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Daily insights email error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});