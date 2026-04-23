import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brokerId } = await req.json();
    
    if (!brokerId) {
      return Response.json({ error: 'brokerId is required' }, { status: 400 });
    }

    // Get all interactions for this broker
    const interactions = await base44.asServiceRole.entities.BrokerInteraction.filter(
      { broker_id: brokerId },
      '-created_date'
    );

    if (interactions.length === 0) {
      return Response.json({
        brokerId,
        totalInteractions: 0,
        message: 'No interaction history available',
        recommendations: {
          bestTimeOfDay: 'Morning (10 AM - 1 PM)',
          bestDayOfWeek: 'Weekdays',
          avgResponseTime: 'Unknown',
          reliabilityScore: 'Not enough data'
        }
      });
    }

    // Analyze response times
    const responseTimes = interactions
      .filter(i => i.response_time_minutes != null)
      .map(i => i.response_time_minutes);

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

    // Analyze time of day patterns
    const hourlyResponses = interactions.map(i => ({
      hour: new Date(i.created_date).getHours(),
      day: new Date(i.created_date).getDay(),
      responseTime: i.response_time_minutes || 999
    }));

    const timeSlots = {
      morning: hourlyResponses.filter(h => h.hour >= 10 && h.hour < 13),
      afternoon: hourlyResponses.filter(h => h.hour >= 13 && h.hour < 17),
      evening: hourlyResponses.filter(h => h.hour >= 17 && h.hour < 21)
    };

    const avgByTimeSlot = Object.entries(timeSlots).map(([slot, times]) => ({
      slot,
      count: times.length,
      avgResponseTime: times.length > 0 
        ? Math.round(times.reduce((sum, t) => sum + t.responseTime, 0) / times.length)
        : 999
    })).sort((a, b) => a.avgResponseTime - b.avgResponseTime);

    const bestTimeSlot = avgByTimeSlot[0]?.slot || 'morning';
    const bestTimeOfDayMap = {
      morning: 'Morning (10 AM - 1 PM)',
      afternoon: 'Afternoon (2 PM - 5 PM)',
      evening: 'Evening (5 PM - 8 PM)'
    };

    // Analyze day of week
    const dayResponses = {};
    hourlyResponses.forEach(h => {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.day];
      if (!dayResponses[dayName]) dayResponses[dayName] = [];
      dayResponses[dayName].push(h.responseTime);
    });

    const avgByDay = Object.entries(dayResponses).map(([day, times]) => ({
      day,
      avgResponseTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    })).sort((a, b) => a.avgResponseTime - b.avgResponseTime);

    const bestDay = avgByDay[0]?.day || 'Monday';

    // Calculate reliability metrics
    const availabilityConfirmed = interactions.filter(i => i.availability_confirmed).length;
    const photosReceived = interactions.filter(i => i.photos_received).length;
    const followUpsNeeded = interactions.filter(i => i.follow_up_required).length;

    const reliabilityScore = interactions.length >= 5
      ? Math.round(((availabilityConfirmed + photosReceived) / interactions.length) * 100)
      : null;

    // Sentiment analysis
    const sentiments = interactions.map(i => i.sentiment).filter(Boolean);
    const positiveSentiment = sentiments.filter(s => s === 'Positive').length;
    const sentimentScore = sentiments.length > 0
      ? Math.round((positiveSentiment / sentiments.length) * 100)
      : null;

    return Response.json({
      brokerId,
      totalInteractions: interactions.length,
      analysisDate: new Date().toISOString(),
      recommendations: {
        bestTimeOfDay: bestTimeOfDayMap[bestTimeSlot],
        bestDayOfWeek: bestDay === 'Saturday' || bestDay === 'Sunday' ? 'Weekdays preferred' : bestDay,
        avgResponseTime: avgResponseTime ? `${avgResponseTime} minutes` : 'Unknown',
        reliabilityScore: reliabilityScore ? `${reliabilityScore}%` : 'Not enough data'
      },
      metrics: {
        avgResponseTimeMinutes: avgResponseTime,
        availabilityConfirmationRate: interactions.length > 0 
          ? `${Math.round((availabilityConfirmed / interactions.length) * 100)}%`
          : '0%',
        photoSharingRate: interactions.length > 0
          ? `${Math.round((photosReceived / interactions.length) * 100)}%`
          : '0%',
        followUpRate: interactions.length > 0
          ? `${Math.round((followUpsNeeded / interactions.length) * 100)}%`
          : '0%',
        sentimentScore: sentimentScore ? `${sentimentScore}% positive` : 'N/A'
      },
      detailedTimeAnalysis: avgByTimeSlot.map(slot => ({
        timeSlot: bestTimeOfDayMap[slot.slot],
        interactions: slot.count,
        avgResponseTime: `${slot.avgResponseTime} min`
      })),
      recentInteractions: interactions.slice(0, 5).map(i => ({
        date: new Date(i.created_date).toLocaleDateString(),
        summary: i.ai_summary || 'No summary',
        sentiment: i.sentiment,
        availabilityConfirmed: i.availability_confirmed,
        photosReceived: i.photos_received
      }))
    });

  } catch (error) {
    console.error('Error analyzing broker patterns:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});