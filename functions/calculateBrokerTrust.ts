import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * BrokerTrust™ Auto-Scoring System
 * 
 * Calculates trust score (0-100) based on:
 * - Duplicate rate (40 points): Lower = better
 * - Response time (20 points): Faster = better
 * - Photo sharing rate (20 points): Higher = better
 * - Availability confirmation rate (20 points): Higher = better
 * 
 * This score is used internally to prioritize clean sources in SmartFeed
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { brokerId, recalculateAll } = body;

    // If recalculateAll is true, score all brokers
    const brokersToScore = recalculateAll 
      ? await base44.asServiceRole.entities.Broker.list()
      : brokerId 
        ? [await base44.asServiceRole.entities.Broker.filter({ id: brokerId })].flat().filter(Boolean)
        : [];

    if (brokersToScore.length === 0) {
      return Response.json({ error: 'No brokers to score' }, { status: 400 });
    }

    const results = [];

    for (const broker of brokersToScore) {
      // Get all properties from this broker
      const brokerProperties = await base44.asServiceRole.entities.Property.filter({
        broker_id: broker.id
      });

      // Get broker interactions
      const interactions = await base44.asServiceRole.entities.BrokerInteraction.filter({
        broker_id: broker.id
      });

      // Calculate metrics
      const totalProperties = brokerProperties.length;
      const duplicateCount = brokerProperties.filter(p => p.is_duplicate).length;
      const duplicateRate = totalProperties > 0 ? (duplicateCount / totalProperties) * 100 : 0;

      const photoSharingCount = interactions.filter(i => i.photos_received).length;
      const photoSharingRate = interactions.length > 0 ? (photoSharingCount / interactions.length) * 100 : 0;

      const availabilityCount = interactions.filter(i => i.availability_confirmed).length;
      const availabilityRate = interactions.length > 0 ? (availabilityCount / interactions.length) * 100 : 0;

      // Response time score (0-20 points)
      let responseTimeScore = 10; // Default neutral
      if (broker.response_time === 'Fast') responseTimeScore = 20;
      else if (broker.response_time === 'Medium') responseTimeScore = 12;
      else if (broker.response_time === 'Slow') responseTimeScore = 5;

      // Duplicate score (0-40 points) - inverse relationship
      const duplicateScore = Math.max(0, 40 - (duplicateRate * 0.8));

      // Photo sharing score (0-20 points)
      const photoScore = (photoSharingRate / 100) * 20;

      // Availability confirmation score (0-20 points)
      const availabilityScore = (availabilityRate / 100) * 20;

      // Total trust score (0-100)
      const trustScore = Math.round(
        duplicateScore + responseTimeScore + photoScore + availabilityScore
      );

      // Update broker with trust metrics
      await base44.asServiceRole.entities.Broker.update(broker.id, {
        trust_score: trustScore,
        duplicate_rate: Math.round(duplicateRate)
      });

      results.push({
        brokerId: broker.id,
        brokerName: broker.name,
        trustScore,
        breakdown: {
          duplicateScore: Math.round(duplicateScore),
          responseTimeScore,
          photoScore: Math.round(photoScore),
          availabilityScore: Math.round(availabilityScore)
        },
        metrics: {
          totalProperties,
          duplicateRate: `${Math.round(duplicateRate)}%`,
          photoSharingRate: `${Math.round(photoSharingRate)}%`,
          availabilityRate: `${Math.round(availabilityRate)}%`,
          responseTime: broker.response_time
        }
      });
    }

    return Response.json({
      success: true,
      brokersScored: results.length,
      results: results.sort((a, b) => b.trustScore - a.trustScore)
    });

  } catch (error) {
    console.error('Error calculating broker trust:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});