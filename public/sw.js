const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min — same as native app
let _knownUnread = -1;
let _pollTimer = null;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Start polling when the SW activates or when the page tells us the user logged in
self.addEventListener('message', (event) => {
  if (event.data === 'start-poll') startPolling();
  if (event.data === 'stop-poll') stopPolling();
});

function startPolling() {
  if (_pollTimer) return;
  checkMessages();
  _pollTimer = setInterval(checkMessages, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  _knownUnread = -1;
}

async function checkMessages() {
  try {
    const res = await fetch('/api/webuntis/messages', { credentials: 'include' });
    if (!res.ok) { stopPolling(); return; } // session expired / logged out

    const data = await res.json();
    const arr =
      data?.incomingMessages ??
      data?.messages ??
      data?.data?.incomingMessages ??
      [];

    const unread = arr.filter((m) => {
      const r = m.isRead ?? m.read ?? m.isread;
      if (typeof r === 'boolean') return !r;
      if (typeof r === 'number') return r !== 1;
      return false;
    }).length;

    if (_knownUnread >= 0 && unread > _knownUnread) {
      const diff = unread - _knownUnread;
      await self.registration.showNotification(
        diff === 1 ? 'Neue Mitteilung' : `${diff} neue Mitteilungen`,
        {
          body: 'Tippe um sie zu sehen',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'pokyh-messages',
          data: { url: '/messages' },
          vibrate: [100, 50, 100],
        }
      );
    }
    _knownUnread = unread;
  } catch {
    // Network error — will retry next interval
  }
}

// Incoming push from backend (VAPID) — works in background on iOS 16.4+ and Android
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: 'POKYH', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'POKYH', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'pokyh-messages',
      data: { url: data.url ?? '/messages' },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/messages';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
