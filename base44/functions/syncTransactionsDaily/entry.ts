import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Daily sync of transaction records from government sources
 * Runs as scheduled automation to keep data fresh
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only for scheduled tasks
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Starting daily transaction sync...');

    // Get all active properties for updating transaction data
    const properties = await base44.asServiceRole.entities.Property.filter({ 
      status: 'Active' 
    }, '-updated_date', 500);

    // Get all buildings for aggregated analytics
    const buildings = await base44.asServiceRole.entities.Building.list('-updated_date', 200);

    let syncedCount = 0;
    let errorCount = 0;

    // Sync transactions for each location
    const locations = [...new Set(properties.map(p => p.location).filter(Boolean))];

    for (const location of locations) {
      try {
        // Call RERA integration function
        const response = await base44.asServiceRole.functions.invoke('fetchRERATransactions', {
          location,
          timeframe: '30days',
          transaction_type: 'all'
        });

        if (response.data?.success) {
          syncedCount += response.data.count || 0;
        }
      } catch (error) {
        console.error(`Failed to sync ${location}:`, error);
        errorCount++;
      }
    }

    // Generate AI insights for recent transactions (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentTransactions = await base44.asServiceRole.entities.TransactionRecord.filter({
      transaction_date: { $gte: recentDate.toISOString().split('T')[0] }
    }, '-transaction_date', 100);

    let insightsGenerated = 0;
    for (const txn of recentTransactions) {
      if (!txn.ai_insights || !txn.ai_insights.market_comparison) {
        try {
          await base44.asServiceRole.functions.invoke('generateTransactionInsights', {
            transaction_id: txn.id
          });
          insightsGenerated++;
        } catch (error) {
          console.error(`Failed to generate insights for ${txn.id}:`, error);
        }
      }
    }

    return Response.json({
      success: true,
      summary: {
        locations_synced: locations.length,
        transactions_added: syncedCount,
        errors: errorCount,
        insights_generated: insightsGenerated,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Daily sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});