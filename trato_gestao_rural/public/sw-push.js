/* ═══════════════════════════════════════════════════════════
   AgroFinance Pro — Push Notification Service Worker
   ═══════════════════════════════════════════════════════════ */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'AgroFinance Pro', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'agrofinance-notification',
    data: { url: data.url || '/' },
    actions: data.actions || [],
    requireInteraction: data.urgent || false,
    vibrate: data.urgent ? [200, 100, 200, 100, 200] : [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AgroFinance Pro', options)
  );
});

// SECURITY FIX: Validate that notification URLs belong to our origin
// to prevent open-redirect attacks via crafted push payloads.
function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  // Allow relative paths (start with /)
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  // Allow same-origin absolute URLs only
  try {
    const parsed = new URL(url, self.location.origin);
    return parsed.origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || '/';
  // SECURITY FIX: Reject URLs that don't match our origin
  const url = isSafeUrl(rawUrl) ? rawUrl : '/';
  const action = event.action;

  // Handle action buttons
  if (action === 'view') {
    event.waitUntil(clients.openWindow(url));
    return;
  }
  if (action === 'dismiss') {
    return;
  }

  // Default: open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});

// Handle push subscription change (browser auto-renews)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // POST updated subscription to server
      return fetch('/api/push-subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    })
  );
});
