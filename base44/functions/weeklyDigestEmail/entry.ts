import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Weekly Digest Email - Comprehensive weekly summary for admins
 * Includes market trends, top deals, broker leaderboard, and performance metrics
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
    
    // Fetch data for the week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const properties = await base44.asServiceRole.entities.Property.list();
    const brokers = await base44.asServiceRole.entities.Broker.list();
    const requirements = await base44.asServiceRole.entities.Requirement.list();
    
    const thisWeek = properties.filter(p => 
      p.created_date && new Date(p.created_date) >= weekAgo
    );
    
    // Calculate weekly metrics
    const metrics = {
      new_listings: thisWeek.length,
      total_active: properties.filter(p => p.status === 'Active').length,
      total_views: thisWeek.reduce((sum, p) => sum + (p.views_count || 0), 0),
      avg_views: (thisWeek.reduce((sum, p) => sum + (p.views_count || 0), 0) / thisWeek.length).toFixed(1),
      
      by_category: {
        residential: thisWeek.filter(p => p.property_category === 'Residential').length,
        commercial: thisWeek.filter(p => p.property_category === 'Commercial').length
      },
      
      by_type: {
        sale: thisWeek.filter(p => p.listing_type === 'Sale').length,
        rent: thisWeek.filter(p => p.listing_type === 'Rent').length
      }
    };
    
    // Top locations this week
    const locationCounts = {};
    thisWeek.forEach(p => {
      if (p.location) {
        locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
      }
    });
    
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Top brokers by activity
    const brokerActivity = {};
    thisWeek.forEach(p => {
      if (p.broker_id) {
        brokerActivity[p.broker_id] = (brokerActivity[p.broker_id] || 0) + 1;
      }
    });
    
    const topBrokerIds = Object.entries(brokerActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));
    
    const topBrokers = topBrokerIds.map(tb => {
      const broker = brokers.find(b => b.id === tb.id);
      return {
        name: broker?.name || 'Unknown',
        count: tb.count,
        trust_score: broker?.trust_score || 0
      };
    });
    
    // Detect deals and anomalies
    const anomaliesResponse = await base44.asServiceRole.functions.invoke('detectMarketAnomalies', {});
    const deals = anomaliesResponse.data.anomalies?.filter(a => a.type === 'underpriced').slice(0, 5) || [];
    
    // Generate market insights with LLM
    const insightsResponse = await base44.asServiceRole.functions.invoke('generateMarketInsights', {
      timeframe: '7d'
    });
    
    // Build rich HTML email
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 650px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; }
    .section { padding: 30px; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .metric { background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #7c3aed; }
    .metric-value { font-size: 32px; font-weight: bold; color: #7c3aed; margin: 5px 0; }
    .metric-label { font-size: 14px; color: #64748b; }
    .deal-card { background: #dcfce7; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #22c55e; }
    .insight-card { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .broker-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 5px; }
    h2 { color: #1e293b; margin-top: 30px; font-size: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-left: 8px; }
    .badge-success { background: #22c55e; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">⚡ PropAI Weekly Digest</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.95;">Week of ${weekAgo.toLocaleDateString('en-IN')} - ${now.toLocaleDateString('en-IN')}</p>
    </div>
    
    <div class="section">
      <h2>📊 Weekly Overview</h2>
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value">${metrics.new_listings}</div>
          <div class="metric-label">New Listings</div>
        </div>
        <div class="metric">
          <div class="metric-value">${metrics.total_active}</div>
          <div class="metric-label">Total Active</div>
        </div>
        <div class="metric">
          <div class="metric-value">${metrics.total_views}</div>
          <div class="metric-label">Total Views</div>
        </div>
        <div class="metric">
          <div class="metric-value">${metrics.avg_views}</div>
          <div class="metric-label">Avg Views/Listing</div>
        </div>
      </div>
      
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-label">Residential</div>
          <div class="metric-value" style="font-size: 24px;">${metrics.by_category.residential}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Commercial</div>
          <div class="metric-value" style="font-size: 24px;">${metrics.by_category.commercial}</div>
        </div>
      </div>
      
      ${deals.length > 0 ? `
      <h2>💰 Top Deals This Week</h2>
      ${deals.map((deal, idx) => `
        <div class="deal-card">
          <strong>${idx + 1}. ${deal.property_title}</strong><br>
          <small style="color: #059669;">Building: ${deal.building_name}</small><br>
          Price: ${deal.price} <span class="badge badge-success">${deal.deviation} below market</span><br>
          <small style="color: #64748b;">Building Avg: ${deal.building_avg}</small>
        </div>
      `).join('')}
      ` : ''}
      
      ${topLocations.length > 0 ? `
      <h2>📍 Hottest Locations</h2>
      ${topLocations.map(([location, count], idx) => `
        <div class="broker-row">
          <span><strong>${idx + 1}. ${location}</strong></span>
          <span class="badge badge-warning">${count} listings</span>
        </div>
      `).join('')}
      ` : ''}
      
      ${topBrokers.length > 0 ? `
      <h2>⭐ Top Brokers</h2>
      ${topBrokers.map((broker, idx) => `
        <div class="broker-row">
          <span><strong>${idx + 1}. ${broker.name}</strong></span>
          <span>
            ${broker.count} listings
            <span class="badge ${broker.trust_score >= 80 ? 'badge-success' : 'badge-warning'}">
              Trust: ${broker.trust_score}/100
            </span>
          </span>
        </div>
      `).join('')}
      ` : ''}
      
      ${insightsResponse.data?.ai_insights ? `
      <h2>🧠 AI Market Insights</h2>
      ${insightsResponse.data.ai_insights.map(insight => `
        <div class="insight-card">
          💡 ${insight}
        </div>
      `).join('')}
      
      ${insightsResponse.data.recommendation ? `
      <div class="metric" style="margin-top: 20px; border-left-color: #3b82f6;">
        <strong>📈 Recommendation:</strong><br>
        ${insightsResponse.data.recommendation}
      </div>
      ` : ''}
      ` : ''}
    </div>
    
    <div class="footer">
      <a href="https://propai.live/admin" class="btn">View Full Dashboard</a>
      <a href="https://propai.live/automationhub" class="btn" style="background: linear-gradient(135deg, #059669, #10b981);">Run Automations</a>
      <p style="margin-top: 20px; color: #64748b; font-size: 14px;">
        🤖 Powered by PropAI Intelligence Engine<br>
        Data as of ${now.toLocaleString('en-IN')}
      </p>
    </div>
  </div>
</body>
</html>
`;

    // Send to all admins
    const emailPromises = admins.map(admin => 
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'PropAI Weekly Digest',
        to: admin.email,
        subject: `📊 PropAI Weekly Digest - ${metrics.new_listings} New Listings | ${deals.length} Deals`,
        body: emailBody
      })
    );
    
    await Promise.all(emailPromises);
    
    return Response.json({
      success: true,
      emails_sent: admins.length,
      recipients: admins.map(a => a.email),
      digest_summary: {
        new_listings: metrics.new_listings,
        deals_found: deals.length,
        top_location: topLocations[0]?.[0],
        top_broker: topBrokers[0]?.name
      },
      sent_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weekly digest error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});