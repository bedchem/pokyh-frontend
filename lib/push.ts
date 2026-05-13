const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

export async function requestPermissionAndSubscribe(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || !('PushManager' in window)) return;
  if (!VAPID_PUBLIC_KEY) {
    // No VAPID key configured — fall back to SW polling only (Android)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage('start-poll');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Tell the backend — it will poll WebUntis using the user's current session
    const json = sub.toJSON();
    await fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: (json.keys as Record<string, string>)['p256dh'],
        auth: (json.keys as Record<string, string>)['auth'],
      }),
    });

    // Also start SW polling as a fallback (helps on Android)
    reg.active?.postMessage('start-poll');
  } catch {
    // Silently ignore — e.g. user denied in a different tab, or VAPID mismatch
  }
}
