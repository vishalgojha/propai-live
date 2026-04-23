import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Detect Market Anomalies using Statistical Analysis + LLM Reasoning
 * Finds unusual patterns that might indicate deals or data errors
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all active properties and buildings
    const properties = await base44.asServiceRole.entities.Property.filter({ status: 'Active' });
    const buildings = await base44.asServiceRole.entities.Building.list();
    
    const anomalies = [];
    
    // 1. Price Outliers per Building
    const buildingGroups = {};
    properties.forEach(p => {
      if (!p.building_name) return;
      if (!buildingGroups[p.building_name]) {
        buildingGroups[p.building_name] = [];
      }
      buildingGroups[p.building_name].push(p);
    });
    
    for (const [buildingName, props] of Object.entries(buildingGroups)) {
      if (props.length < 3) continue;
      
      // Calculate price stats for same BHK
      const bhkGroups = {};
      props.forEach(p => {
        if (!bhkGroups[p.bhk]) bhkGroups[p.bhk] = [];
        const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
        bhkGroups[p.bhk].push({ property: p, priceInLakhs });
      });
      
      for (const [bhk, items] of Object.entries(bhkGroups)) {
        if (items.length < 2) continue;
        
        const prices = items.map(i => i.priceInLakhs);
        const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const stdDev = Math.sqrt(
          prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length
        );
        
        // Flag outliers (>2 standard deviations)
        items.forEach(({ property, priceInLakhs }) => {
          const zScore = Math.abs((priceInLakhs - avg) / stdDev);
          
          if (zScore > 2) {
            const percentDiff = ((priceInLakhs - avg) / avg) * 100;
            anomalies.push({
              type: percentDiff < 0 ? 'underpriced' : 'overpriced',
              severity: zScore > 3 ? 'high' : 'medium',
              property_id: property.id,
              property_title: property.ai_title || `${property.bhk} in ${property.location}`,
              building_name: buildingName,
              price: `₹${property.price} ${property.price_unit}`,
              building_avg: `₹${avg.toFixed(2)}L`,
              deviation: `${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%`,
              z_score: zScore.toFixed(2)
            });
          }
        });
      }
    }
    
    // 2. Sudden Broker Activity Spikes
    const brokerActivity = {};
    const now = new Date();
    const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    properties.forEach(p => {
      if (!p.broker_id || !p.created_date) return;
      if (new Date(p.created_date) < last24h) return;
      
      brokerActivity[p.broker_id] = (brokerActivity[p.broker_id] || 0) + 1;
    });
    
    // Flag brokers with >10 listings in 24h (possible spam)
    for (const [brokerId, count] of Object.entries(brokerActivity)) {
      if (count > 10) {
        anomalies.push({
          type: 'broker_spam',
          severity: 'medium',
          broker_id: brokerId,
          listing_count: count,
          timeframe: '24 hours'
        });
      }
    }
    
    // 3. Duplicate Detection Across Buildings
    const propertyFingerprints = {};
    properties.forEach(p => {
      const fp = `${p.bhk}|${p.location}|${p.carpet_area}|${Math.round(p.price)}`;
      if (!propertyFingerprints[fp]) {
        propertyFingerprints[fp] = [];
      }
      propertyFingerprints[fp].push(p);
    });
    
    for (const [fp, props] of Object.entries(propertyFingerprints)) {
      if (props.length > 1) {
        // Same specs but different buildings - possible duplicate or genuine similar listings
        const uniqueBuildings = [...new Set(props.map(p => p.building_name))];
        if (uniqueBuildings.length > 1) {
          anomalies.push({
            type: 'cross_building_duplicate',
            severity: 'low',
            property_ids: props.map(p => p.id),
            buildings: uniqueBuildings,
            specs: fp
          });
        }
      }
    }
    
    // Use LLM to analyze top anomalies and provide recommendations
    if (anomalies.length > 0) {
      const topAnomalies = anomalies
        .filter(a => a.type === 'underpriced' || a.type === 'overpriced')
        .slice(0, 5);
      
      if (topAnomalies.length > 0) {
        const llmPrompt = `Analyze these property pricing anomalies and provide insights:

${topAnomalies.map((a, idx) => `
${idx + 1}. ${a.property_title}
   Building: ${a.building_name}
   Price: ${a.price} (${a.deviation} vs building avg of ${a.building_avg})
   Z-Score: ${a.z_score}
   Type: ${a.type.toUpperCase()}
`).join('\n')}

For each anomaly, determine:
1. Is this likely a genuine deal or a data error?
2. What action should be taken?

Return JSON with "analysis" array.`;

        const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: llmPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              analysis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    property_index: { type: "number" },
                    likely_cause: { type: "string" },
                    recommended_action: { type: "string" },
                    confidence: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        // Merge LLM insights back into anomalies
        llmResponse.analysis.forEach(insight => {
          if (insight.property_index < topAnomalies.length) {
            topAnomalies[insight.property_index].ai_analysis = insight;
          }
        });
      }
    }
    
    // Sort anomalies by severity
    const sortedAnomalies = anomalies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    return Response.json({
      success: true,
      total_anomalies: anomalies.length,
      by_severity: {
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length
      },
      by_type: {
        underpriced: anomalies.filter(a => a.type === 'underpriced').length,
        overpriced: anomalies.filter(a => a.type === 'overpriced').length,
        broker_spam: anomalies.filter(a => a.type === 'broker_spam').length,
        duplicates: anomalies.filter(a => a.type === 'cross_building_duplicate').length
      },
      anomalies: sortedAnomalies.slice(0, 20), // Top 20
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});