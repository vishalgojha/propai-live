import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Browser Notification Manager Component
 * Handles web push notification subscriptions
 */
export default function BrowserNotificationManager({ user }) {
  const [notificationStatus, setNotificationStatus] = useState("unknown"); // unknown, denied, granted, not-supported
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check notification support and permission on mount
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!("Notification" in window)) {
      setNotificationStatus("not-supported");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setNotificationStatus("not-supported");
      return;
    }

    setNotificationStatus(Notification.permission);

    // Check if already subscribed
    if (Notification.permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToNotifications = async () => {
    if (notificationStatus === "not-supported") {
      toast.error("Push notifications not supported", {
        description: "Your browser doesn't support push notifications"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission !== "granted") {
        toast.error("Permission denied", {
          description: "You need to allow notifications to receive match alerts"
        });
        setIsLoading(false);
        return;
      }

      // Register service worker if not already registered
      let registration;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      } catch (error) {
        console.error("Service worker registration failed:", error);
        // Try to get existing registration
        registration = await navigator.serviceWorker.ready;
      }

      // Subscribe to push notifications
      // ✅ UPDATED: Using actual VAPID public key
      const vapidPublicKey = "BJVtD5ykgmQ439gS5z4yifCKI8I70lxiblVxRnDI4jd4Qv48pAxFhoHEiWntiXU-sNbicldCJAvzESC6vnydkpw";
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Save subscription to database
      const subscriptionData = {
        user_id: user?.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("p256dh")))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("auth"))))
        },
        user_agent: navigator.userAgent,
        is_active: true
      };

      await base44.entities.PushSubscription.create(subscriptionData);

      setIsSubscribed(true);
      toast.success("🔔 Notifications Enabled!", {
        description: "You'll get alerts when properties match your requirements",
        duration: 5000
      });

      // Send test notification
      new Notification("PropAI Live 🏠", {
        body: "You're all set! You'll get notified when we find property matches.",
        icon: "/logo.png",
        badge: "/logo.png"
      });

    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to enable notifications", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const subscriptions = await base44.entities.PushSubscription.filter({
          user_id: user?.id
        });

        for (const sub of subscriptions) {
          await base44.entities.PushSubscription.delete(sub.id);
        }

        setIsSubscribed(false);
        toast.success("Notifications disabled");
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (notificationStatus === "not-supported") {
    return (
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-slate-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Push notifications not supported</p>
            <p className="text-xs text-slate-600">Try using a modern browser like Chrome or Firefox</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isSubscribed ? "bg-green-600" : "bg-purple-600"
          }`}>
            {isSubscribed ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <Bell className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">Property Match Alerts</p>
              {isSubscribed ? (
                <Badge className="bg-green-100 text-green-800 border-0 text-xs">Active</Badge>
              ) : (
                <Badge className="bg-slate-200 text-slate-700 border-0 text-xs">Inactive</Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isSubscribed 
                ? "You'll get notified when we find matching properties" 
                : "Get instant alerts when properties match your requirements"}
            </p>
          </div>
        </div>

        {isSubscribed ? (
          <Button
            onClick={unsubscribeFromNotifications}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-purple-300 hover:bg-purple-50"
          >
            {isLoading ? "Disabling..." : "Disable"}
          </Button>
        ) : (
          <Button
            onClick={subscribeToNotifications}
            disabled={isLoading}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isLoading ? "Enabling..." : "Enable Alerts"}
          </Button>
        )}
      </div>
    </Card>
  );
}