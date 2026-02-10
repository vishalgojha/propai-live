import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates AI-powered insights for transaction records
 * Includes market comparison, trend analysis, investment scoring
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { transaction_id } = await req.json();

    const transaction = await base44.entities.TransactionRecord.get(transaction_id);
    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Fetch comparable transactions
    const comparables = await base44.entities.TransactionRecord.filter({
      location: transaction.location,
      transaction_type: transaction.transaction_type,
      bhk: transaction.bhk
    }, '-transaction_date', 50);

    // Calculate market insights
    const avgPricePerSqft = comparables.reduce((sum, t) => sum + (t.price_per_sqft || 0), 0) / comparables.length;
    const priceVsAverage = ((transaction.price_per_sqft - avgPricePerSqft) / avgPricePerSqft) * 100;

    // Trend analysis
    const recentTransactions = comparables.filter(t => {
      const txDate = new Date(t.transaction_date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return txDate >= sixMonthsAgo;
    });

    const trendAnalysis = recentTransactions.length > 5 ? 'Rising market segment' : 'Stable market';

    // Investment score (0-10 based on price vs average, trend, confidence)
    const investmentScore = calculateInvestmentScore(transaction, avgPricePerSqft, trendAnalysis);

    // Use LLM for detailed insights
    const llmInsights = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this Mumbai real estate transaction:
      
Location: ${transaction.location}
Property: ${transaction.bhk} ${transaction.property_type}
Price: ₹${(transaction.amount / 10000000).toFixed(2)} Cr
Area: ${transaction.area_sqft} sqft
Price/sqft: ₹${transaction.price_per_sqft?.toFixed(0)}
Market Average: ₹${avgPricePerSqft.toFixed(0)}/sqft
Transaction Date: ${transaction.transaction_date}

Provide brief insights: market comparison, trend, investment potential.`,
      response_json_schema: {
        type: 'object',
        properties: {
          market_comparison: { type: 'string' },
          trend_analysis: { type: 'string' },
          investment_summary: { type: 'string' }
        }
      }
    });

    // Update transaction with insights
    await base44.asServiceRole.entities.TransactionRecord.update(transaction_id, {
      ai_insights: {
        market_comparison: llmInsights.market_comparison,
        trend_analysis: llmInsights.trend_analysis,
        investment_score: investmentScore
      }
    });

    return Response.json({
      success: true,
      insights: {
        market_comparison: llmInsights.market_comparison,
        trend_analysis: llmInsights.trend_analysis,
        investment_score: investmentScore,
        comparable_count: comparables.length,
        avg_price_per_sqft: avgPricePerSqft
      }
    });

  } catch (error) {
    console.error('Insights generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateInvestmentScore(transaction, avgPrice, trend) {
  let score = 5; // Base score

  // Price comparison
  const priceDiff = (transaction.price_per_sqft - avgPrice) / avgPrice;
  if (priceDiff < -0.1) score += 2; // Below market
  else if (priceDiff > 0.2) score -= 1; // Above market

  // Trend bonus
  if (trend.includes('Rising')) score += 1.5;
  if (trend.includes('Stable')) score += 0.5;

  // Confidence bonus
  score += (transaction.confidence_score || 0.5) * 2;

  return Math.min(Math.max(score, 0), 10); // Clamp 0-10
}