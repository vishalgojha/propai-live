import { useEffect } from "react";

/**
 * Service Worker Setup Component
 * Registers the service worker on mount
 */
export default function ServiceWorkerSetup() {
  useEffect(() => {
    // Skip service worker in preview/development environments (blob URLs not supported)
    if ('serviceWorker' in navigator && !window.location.hostname.includes('preview-sandbox') && window.location.protocol === 'https:') {
      // Create service worker inline
      const swCode = `
/**
 * Service Worker for PropAI Live
 * Handles push notifications
 */

const CACHE_NAME = 'propai-live-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {
    title: 'PropAI Live',
    body: 'New update available',
    icon: '/logo.png',
    badge: '/logo.png',
    data: {}
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: data.data,
    vibrate: [200, 100, 200],
    tag: data.tag || 'propai-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            if (event.notification.data?.url) {
              client.navigate(event.notification.data.url);
            }
            return client.focus();
          }
        }
        const urlToOpen = event.notification.data?.url || '/';
        return clients.openWindow(urlToOpen);
      })
  );
});
      `;

      // Create blob URL for service worker
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      // Register service worker
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
}