import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.6';

/**
 * Send Browser Push Notifications
 * Sends web push notifications to subscribed users
 * 
 * SETUP REQUIRED:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY as environment variables
 * 3. Set VAPID_EMAIL (e.g., mailto:hello@propai.live)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { title, body, data, user_ids, broker_ids } = await req.json();

    // Validate VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:hello@propai.live';

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({
        success: false,
        error: 'VAPID keys not configured. Generate with: npx web-push generate-vapid-keys'
      }, { status: 500 });
    }

    // Configure web-push
    webpush.setVapidDetails(
      vapidEmail,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Get subscriptions to notify
    let subscriptions = [];
    
    if (user_ids && user_ids.length > 0) {
      for (const userId of user_ids) {
        const userSubs = await base44.asServiceRole.entities.PushSubscription.filter({
          user_id: userId,
          is_active: true
        });
        subscriptions.push(...userSubs);
      }
    }

    if (broker_ids && broker_ids.length > 0) {
      for (const brokerId of broker_ids) {
        const brokerSubs = await base44.asServiceRole.entities.PushSubscription.filter({
          broker_id: brokerId,
          is_active: true
        });
        subscriptions.push(...brokerSubs);
      }
    }

    if (subscriptions.length === 0) {
      return Response.json({
        success: true,
        sent: 0,
        message: 'No active subscriptions found'
      });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: title || 'PropAI Live',
      body: body || 'New update available',
      icon: '/logo.png',
      badge: '/logo.png',
      data: data || {},
      timestamp: Date.now()
    });

    // Send notifications
    let sent = 0;
    let failed = 0;
    const failedSubscriptions = [];

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        sent++;

        // Update last_notified timestamp
        await base44.asServiceRole.entities.PushSubscription.update(subscription.id, {
          last_notified: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Failed to send to subscription ${subscription.id}:`, error);
        failed++;
        failedSubscriptions.push(subscription.id);

        // If subscription is invalid (410 Gone), mark as inactive
        if (error.statusCode === 410) {
          await base44.asServiceRole.entities.PushSubscription.update(subscription.id, {
            is_active: false
          });
        }
      }
    }

    return Response.json({
      success: true,
      sent,
      failed,
      total: subscriptions.length,
      failedSubscriptions
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});