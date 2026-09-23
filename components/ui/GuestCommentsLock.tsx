'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

const BLUR_PX = 10;
const MIN_BLUR_PX = 5;
const NOPE_SRC = '/img/nope.webp';

// Guests see the real comments, but only as an unreadable blur. Anyone who
// strips the blur or the overlay in DevTools gets the comments swapped out.
export default function GuestCommentsLock({ loginHref, children }: { loginHref: string; children: ReactNode }) {
  const blurRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tampered, setTampered] = useState(false);

  useEffect(() => {
    if (tampered) return;

    const check = () => {
      const blurEl = blurRef.current;
      const overlayEl = overlayRef.current;
      if (!blurEl?.isConnected || !overlayEl?.isConnected) return setTampered(true);

      const blurStyle = getComputedStyle(blurEl);
      const blur = /blur\(([\d.]+)px\)/.exec(blurStyle.filter);
      if (!blur || parseFloat(blur[1]) < MIN_BLUR_PX) return setTampered(true);
      if (blurStyle.display === 'none' || blurStyle.visibility === 'hidden') return setTampered(true);

      const overlayStyle = getComputedStyle(overlayEl);
      if (
        overlayStyle.display === 'none' ||
        overlayStyle.visibility === 'hidden' ||
        parseFloat(overlayStyle.opacity) < 0.5
      ) return setTampered(true);
    };

    const observer = new MutationObserver(check);
    const root = blurRef.current?.parentElement;
    if (root) observer.observe(root, { attributes: true, childList: true, subtree: true });
    // Stylesheet edits in DevTools don't trigger mutations, so poll as well.
    const interval = setInterval(check, 300);
    check();

    return () => { observer.disconnect(); clearInterval(interval); };
  }, [tampered]);

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ minHeight: tampered ? 360 : 140 }}>
      <div
        ref={blurRef}
        aria-hidden="true"
        inert
        className="select-none pointer-events-none"
        style={{ filter: `blur(${BLUR_PX}px)` }}
      >
        {!tampered && children}
      </div>

      <div
        ref={overlayRef}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4"
        style={{ background: 'color-mix(in srgb, var(--app-card) 35%, transparent)' }}
      >
        {!tampered && (
          <>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
            >
              <Lock size={20} color="var(--accent)" />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>
              Melde dich an, um die Kommentare zu sehen
            </p>
            <Link
              href={loginHref}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white press-scale"
              style={{ background: 'var(--accent)' }}
            >
              Anmelden
            </Link>
          </>
        )}
      </div>

      {tampered && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={NOPE_SRC}
          alt="Nö."
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 10 }}
        />
      )}
    </div>
  );
}
