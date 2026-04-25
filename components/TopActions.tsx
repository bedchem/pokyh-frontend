'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useSession } from '@/providers/SessionProvider';

// Module-level cache so the count persists across page navigations
let _cachedUnread = 0;
let _lastFetch = 0;
const TTL = 2 * 60 * 1000; // 2 min

async function loadUnread(): Promise<number> {
  if (Date.now() - _lastFetch < TTL) return _cachedUnread;
  try {
    const res = await fetch('/api/webuntis/messages', { credentials: 'same-origin' });
    if (!res.ok) return _cachedUnread;
    const data = await res.json();
    const arr =
      (data?.incomingMessages as Array<{ isRead?: boolean }>) ??
      (data?.messages as Array<{ isRead?: boolean }>) ??
      ((data?.data as { incomingMessages?: Array<{ isRead?: boolean }> })?.incomingMessages) ??
      [];
    _cachedUnread = arr.filter((m) => !m.isRead).length;
    _lastFetch = Date.now();
  } catch {
    /* non-fatal */
  }
  return _cachedUnread;
}

export function invalidateUnreadCache() {
  _lastFetch = 0;
}

export default function TopActions() {
  const { user } = useSession();
  const [unread, setUnread] = useState(_cachedUnread);

  useEffect(() => {
    loadUnread().then(setUnread);
  }, []);

  const initials = user?.username.slice(0, 2).toUpperCase() ?? 'ME';

  return (
    <div className="flex items-center gap-3">
      <Link href="/messages" className="relative press-scale" aria-label="Nachrichten">
        <MessageCircle size={26} color="var(--accent)" />
        {unread > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
            style={{ background: 'var(--danger)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
      <Link href="/profile" className="press-scale" aria-label="Profil">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)' }}
        >
          {initials}
        </div>
      </Link>
    </div>
  );
}
