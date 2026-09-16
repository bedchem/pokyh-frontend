'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { fetchDuePopups, isDue, markSeen, type ActivePopup, type PopupAudience } from '@/lib/popups';

// Shows admin announcement popups one at a time, for signed-in users inside
// the app and for guests on the public pages (the admin picks the audience).
// `html` is rendered and sanitised by the backend (services/popupRender.ts);
// its content styles live in globals.css under `.popup-content`.

const RECHECK_MS = 10 * 60 * 1000;

export default function AnnouncementPopup({ audience }: { audience: PopupAudience }) {
  const [queue, setQueue] = useState<ActivePopup[]>([]);
  const lastCheck = useRef(0);
  const current = queue[0];

  const check = useCallback(() => {
    if (Date.now() - lastCheck.current < RECHECK_MS) return;
    lastCheck.current = Date.now();
    fetchDuePopups(audience)
      .then((due) => {
        if (due.length === 0) return;
        setQueue((q) => {
          const known = new Set(q.map((p) => `${p.id}:${p.revision}`));
          return [...q, ...due.filter((p) => !known.has(`${p.id}:${p.revision}`))];
        });
      })
      .catch(() => { /* popups are optional — never surface a failure */ });
  }, [audience]);

  useEffect(() => {
    check();
    // Long-lived tabs still get the next daily slot when the user comes back.
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  // Counts as seen the moment it is displayed, not when it is dismissed.
  useEffect(() => {
    if (current && isDue(current)) markSeen(current);
  }, [current]);

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, dismiss]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:px-4 sm:py-8"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={dismiss}
    >
      <div
        key={`${current.id}:${current.revision}`}
        className="w-full sm:max-w-lg max-h-[90dvh] overflow-hidden flex flex-col rounded-t-[28px] sm:rounded-[28px] slide-up"
        style={{ background: 'var(--app-surface)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
              <Megaphone size={12} /> Mitteilung
            </p>
            <h2 id="announcement-title" className="text-[19px] font-bold leading-snug" style={{ color: 'var(--app-text-primary)' }}>
              {current.title}
            </h2>
          </div>
          <button
            onClick={dismiss}
            className="w-9 h-9 flex items-center justify-center rounded-full press-scale flex-shrink-0"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 min-h-0">
          <div className="popup-content" dangerouslySetInnerHTML={{ __html: current.html }} />
        </div>

        <div className="px-5 pt-4 flex-shrink-0" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={dismiss}
            className="w-full h-11 rounded-xl press-scale text-[15px] font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {queue.length > 1 ? `Weiter (${queue.length - 1})` : 'Verstanden'}
          </button>
        </div>
      </div>
    </div>
  );
}
