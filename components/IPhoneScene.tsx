'use client';

import { useRef, useEffect, RefObject } from 'react';

// ── Screen texture (needs DOM canvas API — must stay on main thread) ──────────
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.arcTo(x + w, y,     x + w, y + r,     r);
  g.lineTo(x + w, y + h - r);
  g.arcTo(x + w, y + h, x + w - r, y + h, r);
  g.lineTo(x + r, y + h);
  g.arcTo(x,     y + h, x,     y + h - r, r);
  g.lineTo(x,     y + r);
  g.arcTo(x,     y,     x + r, y,         r);
  g.closePath();
}

function buildScreenCanvas(): HTMLCanvasElement {
  const W = 600, H = 1300;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;

  g.fillStyle = '#050506'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#000';
  rrect(g, (W - 168) / 2, 24, 168, 42, 21); g.fill();

  g.fillStyle = '#f5f5f7';
  g.font = 'bold 28px -apple-system, Helvetica Neue, sans-serif';
  g.textBaseline = 'alphabetic';
  g.fillText('9:41', 32, 78);
  g.font = '16px -apple-system, Helvetica Neue, sans-serif';
  g.textAlign = 'right'; g.fillStyle = '#f5f5f7';
  g.fillText('●●●', W - 30, 75);
  g.textAlign = 'left';

  g.fillStyle = '#6e6e73';
  g.font = '400 24px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('Montag, 27. April', 30, 138);

  g.fillStyle = '#f5f5f7';
  g.font = 'bold 54px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('Hallo, Sabby', 30, 204);

  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(18, 224); g.lineTo(W - 18, 224); g.stroke();

  const card = (y: number, h: number) => {
    g.fillStyle = '#0f0f11';
    rrect(g, 16, y, W - 32, h, 28); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 1;
    rrect(g, 16, y, W - 32, h, 28); g.stroke();
  };

  card(234, 136);
  g.fillStyle = '#6e6e73';
  g.font = '600 17px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('SCHNITT', 36, 274);
  g.fillStyle = '#f5f5f7';
  g.font = 'bold 42px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('8,42', 36, 328);
  g.textAlign = 'right';
  g.fillStyle = '#6e6e73';
  g.font = '600 17px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('NÄCHSTE', W - 36, 274);
  g.fillStyle = '#f5f5f7';
  g.font = '600 25px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('Mathematik', W - 36, 308);
  g.fillStyle = '#6e6e73';
  g.font = '400 20px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('in 12 min · R204', W - 36, 342);
  g.textAlign = 'left';

  const LESSONS = [
    { time: '08:00', col: '#6366F1', title: 'Mathematik', room: 'R204 · Hofer' },
    { time: '09:00', col: '#10b981', title: 'Deutsch',    room: 'R112 · Mair'  },
    { time: '10:00', col: '#f97316', title: 'Fachpraxis', room: 'Werkstatt B'   },
    { time: '11:00', col: '#8b5cf6', title: 'Englisch',   room: 'R301 · Pichler'},
  ];
  card(388, 10 + LESSONS.length * 80);
  g.fillStyle = '#6e6e73';
  g.font = '600 17px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('HEUTE', 36, 428);
  LESSONS.forEach((l, i) => {
    const ly = 446 + i * 80;
    if (i > 0) {
      g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(54, ly - 6); g.lineTo(W - 32, ly - 6); g.stroke();
    }
    g.fillStyle = '#6e6e73';
    g.font = '400 20px -apple-system, Helvetica Neue, sans-serif';
    g.fillText(l.time, 32, ly + 28);
    g.fillStyle = l.col;
    rrect(g, 116, ly + 5, 4, 46, 2); g.fill();
    g.fillStyle = '#f5f5f7';
    g.font = '600 23px -apple-system, Helvetica Neue, sans-serif';
    g.fillText(l.title, 134, ly + 28);
    g.fillStyle = '#6e6e73';
    g.font = '400 19px -apple-system, Helvetica Neue, sans-serif';
    g.fillText(l.room, 134, ly + 53);
  });

  return cv;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IPhoneScene({
  progressRef,
  className,
  onReady,
}: {
  progressRef: RefObject<number>;
  className?: string;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── OffscreenCanvas path (Chrome 69+, Firefox 105+, Safari 16.4+) ────────
    if (typeof (canvas as HTMLCanvasElement & { transferControlToOffscreen?: () => OffscreenCanvas }).transferControlToOffscreen === 'function') {

      let active = true; // guards against React Strict Mode double-effect / unmount-before-promise

      // Load both screen images as ImageBitmaps; fall back to canvas-drawn screen on error
      async function loadBitmap(url: string): Promise<ImageBitmap> {
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`${r.status}`);
          return createImageBitmap(await r.blob());
        } catch (e) {
          console.warn('[IPhoneScene] screen bitmap load failed for', url, e);
          return createImageBitmap(buildScreenCanvas());
        }
      }

      Promise.all([
        loadBitmap('/models/whitemode_screen.webp'),
        loadBitmap('/models/darkmode_screen.webp'),
      ]).then(([lightScreenBitmap, darkScreenBitmap]) => {
        if (!active || !canvasRef.current) return; // effect was cleaned up before promise resolved

        const offscreen = (canvasRef.current as HTMLCanvasElement & { transferControlToOffscreen: () => OffscreenCanvas })
          .transferControlToOffscreen();

        const worker = new Worker(
          new URL('../workers/iphone-scene.worker.ts', import.meta.url),
          { type: 'module' },
        );

        // First-frame readiness signal — used by parent to time loader exit
        worker.onmessage = (ev: MessageEvent) => {
          if ((ev.data as { type?: string } | null)?.type === 'ready') {
            onReadyRef.current?.();
          }
        };

        const dark           = document.documentElement.classList.contains('dark');
        const noReducedMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const { clientWidth: width, clientHeight: height } = canvasRef.current!;

        // Transfer offscreen canvas + both screen bitmaps (all transferable)
        worker.postMessage(
          { type: 'init', canvas: offscreen, lightScreenBitmap, darkScreenBitmap, dark, noReducedMotion, width, height, dpr: window.devicePixelRatio },
          [offscreen, lightScreenBitmap, darkScreenBitmap],
        );

        // Forward scroll progress every frame — very lightweight on main thread
        let rafId: number;
        function syncProgress() {
          worker.postMessage({ type: 'progress', value: progressRef.current ?? 0 });
          rafId = requestAnimationFrame(syncProgress);
        }
        rafId = requestAnimationFrame(syncProgress);

        // Forward resize
        const ro = new ResizeObserver(() => {
          if (!canvasRef.current) return;
          worker.postMessage({
            type: 'resize',
            width:  canvasRef.current.clientWidth,
            height: canvasRef.current.clientHeight,
            dpr:    window.devicePixelRatio,
          });
        });
        ro.observe(canvasRef.current!);

        // Forward theme changes
        const moObs = new MutationObserver(() => {
          worker.postMessage({ type: 'theme', dark: document.documentElement.classList.contains('dark') });
        });
        moObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        // Store refs for cleanup
        (canvas as HTMLCanvasElement & { __workerCleanup?: () => void }).__workerCleanup = () => {
          cancelAnimationFrame(rafId);
          ro.disconnect();
          moObs.disconnect();
          worker.postMessage({ type: 'dispose' });
          worker.terminate();
        };
      });

      return () => {
        active = false;
        (canvas as HTMLCanvasElement & { __workerCleanup?: () => void }).__workerCleanup?.();
      };
    }

    // ── Fallback: inline Three.js (older browsers without OffscreenCanvas) ───
    // Dynamically import to avoid loading Three.js in the main bundle
    let active = true;
    import('../lib/iphone-scene-inline').then(({ startScene }) => {
      if (!active || !canvasRef.current) return;
      const stop = startScene(canvasRef.current, progressRef, () => onReadyRef.current?.());
      (canvas as HTMLCanvasElement & { __fallbackStop?: () => void }).__fallbackStop = stop;
    });

    return () => {
      active = false;
      (canvas as HTMLCanvasElement & { __fallbackStop?: () => void }).__fallbackStop?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
