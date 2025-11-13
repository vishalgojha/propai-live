import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Browser Push Notifications Component
 * Handles Web Push API integration for real-time property match notifications
 */
export default function BrowserNotifications({ user }) {
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Check current notification permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      
      if (existingSub) {
        setIsSubscribed(true);
        setSubscription(existingSub);
        console.log("✅ Existing push subscription found");
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser doesn't support notifications");
      return;
    }

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("🔔 Notifications enabled!", {
          description: "You'll get alerts for new property matches"
        });
        await subscribeToPush();
      } else if (result === "denied") {
        toast.error("Notifications blocked", {
          description: "Enable in browser settings to receive alerts"
        });
      }
    } catch (error) {
      console.error("Permission request failed:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications not supported");
      return;
    }

    try {
      // Register service worker if not already registered
      let registration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        // Register new service worker
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      }

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey())
      });

      setSubscription(pushSubscription);
      setIsSubscribed(true);

      // Save subscription to user profile
      if (user) {
        try {
          await base44.auth.updateMe({
            push_subscription: JSON.stringify(pushSubscription)
          });
          console.log("✅ Push subscription saved to user profile");
        } catch (error) {
          console.warn("Failed to save subscription to profile:", error);
        }
      }

      // Show test notification
      if (Notification.permission === "granted") {
        new Notification("PropAI Live Notifications Active! 🔔", {
          body: "You'll now receive instant alerts for property matches",
          icon: "/favicon.ico",
          badge: "/favicon.ico"
        });
      }

      toast.success("Push notifications enabled!");
    } catch (error) {
      console.error("Push subscription failed:", error);
      toast.error("Failed to enable push notifications", {
        description: error.message
      });
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    setIsLoading(true);

    try {
      await subscription.unsubscribe();
      setIsSubscribed(false);
      setSubscription(null);

      // Remove from user profile
      if (user) {
        try {
          await base44.auth.updateMe({
            push_subscription: null
          });
        } catch (error) {
          console.warn("Failed to remove subscription from profile:", error);
        }
      }

      toast.success("Notifications disabled");
    } catch (error) {
      console.error("Unsubscribe failed:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("🎯 Test: New Property Match!", {
        body: "3 BHK in Bandra West • ₹2.5L/month • 95% match",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "test-notification",
        requireInteraction: false
      });
      toast.success("Test notification sent!");
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  };

  // Placeholder - in production, this should come from environment
  const getVapidPublicKey = () => {
    // This should be your VAPID public key from web-push
    // For now, returning a placeholder
    return "BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV15k8K9dJVwEuGBQwmN8kWvJHb1lGmGFxhqHMOsP5XqDYl5PV5W3A";
  };

  if (!("Notification" in window)) {
    return (
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Browser notifications not supported
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Try Chrome, Firefox, or Edge for push notifications
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900">Browser Notifications</h3>
          </div>
          <p className="text-sm text-slate-600">
            Get instant alerts when properties match your requirements
          </p>
        </div>

        {isSubscribed ? (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <Check className="w-3 h-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="border-slate-300 text-slate-600">
            <BellOff className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {permission === "default" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-3">
              📱 Enable notifications to get instant alerts when we find property matches for you
            </p>
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
        )}

        {permission === "granted" && !isSubscribed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 mb-3">
              ✅ Permission granted! Click below to activate push notifications
            </p>
            <Button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Activate Push Notifications
                </>
              )}
            </Button>
          </div>
        )}

        {permission === "granted" && isSubscribed && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 mb-2 font-semibold">
                🔔 Notifications Active!
              </p>
              <p className="text-xs text-green-700 mb-3">
                You'll receive instant alerts for:
              </p>
              <ul className="text-xs text-green-700 space-y-1 ml-4">
                <li>• New property matches (80+ score)</li>
                <li>• Price drops on saved properties</li>
                <li>• Requirement status updates</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={sendTestNotification}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Send Test
              </Button>
              <Button
                onClick={unsubscribe}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:bg-red-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  <>
                    <BellOff className="w-3 h-3 mr-1" />
                    Disable
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {permission === "denied" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 mb-2 font-semibold">
              ⚠️ Notifications Blocked
            </p>
            <p className="text-xs text-red-700 mb-3">
              You've blocked notifications. To enable:
            </p>
            <ol className="text-xs text-red-700 space-y-1 ml-4 list-decimal">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in permissions</li>
              <li>Change to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          💡 <strong>Tip:</strong> Notifications work even when the tab is closed. You'll get alerts instantly when matches are found.
        </p>
      </div>
    </Card>
  );
}