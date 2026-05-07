'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

const VIO = '#4930a3';

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

type Pt = [number, number];
type Tile = { pts: Pt[]; ring: number };

function buildTiles(W: number, H: number, cols = 4, rows = 3, seed = 13): Tile[] {
  const rand = seededRng(seed);
  const grid: Pt[][] = [];
  for (let y = 0; y <= rows; y++) {
    const row: Pt[] = [];
    for (let x = 0; x <= cols; x++) {
      const bx = (x / cols) * W, by = (y / rows) * H;
      const edge = x === 0 || x === cols || y === 0 || y === rows;
      row.push([
        bx + (edge ? 0 : (rand() - 0.5) * (W / cols) * 0.35),
        by + (edge ? 0 : (rand() - 0.5) * (H / rows) * 0.35),
      ]);
    }
    grid.push(row);
  }

  const tiles: Tile[] = [];
  const cxC = W / 2, cyC = H / 2;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const tl = grid[cy][cx], tr = grid[cy][cx + 1];
      const br = grid[cy + 1][cx + 1], bl = grid[cy + 1][cx];
      const c = rand();
      const groups: Pt[][] =
        c < 0.45 ? [[tl, tr, br, bl]] :
        c < 0.75 ? [[tl, tr, br], [tl, br, bl]] :
                   [[tl, tr, bl], [tr, br, bl]];
      for (const pts of groups) {
        let sx = 0, sy = 0;
        pts.forEach(([x, y]) => { sx += x; sy += y; });
        const tx = sx / pts.length, ty = sy / pts.length;
        const dx = Math.abs(tx - cxC) / (W / 2), dy = Math.abs(ty - cyC) / (H / 2);
        tiles.push({ pts, ring: Math.max(dx, dy) + 0.001 * Math.hypot(tx - cxC, ty - cyC) });
      }
    }
  }
  return tiles.sort((a, b) => a.ring - b.ring);
}

function ptsStr(pts: Pt[]) {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

interface Props {
  glbProgressRef: RefObject<number>;
  sceneReady: boolean;
  onDone: () => void;
}

export default function LoadingCover({ glbProgressRef, sceneReady, onDone }: Props) {
  const [mounted,  setMounted]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoOp,   setLogoOp]   = useState(1);

  const rafRef     = useRef<number | null>(null);
  const mountTsRef = useRef<number>(0); // when the rAF loop first ticked
  const startRef   = useRef<number>(0); // when the tile animation actually began
  const rdyRef     = useRef<boolean>(false);
  const doneRef    = useRef<boolean>(false);
  const exitTsRef  = useRef<number>(0);
  const tilesRef   = useRef<Tile[]>([]);
  const dimRef     = useRef<{ W: number; H: number }>({ W: 0, H: 0 });

  // Minimum duration for the animation — even a cached GLB shows a real transition.
  // On slow connections the tiles clear proportionally to the download progress.
  const MIN_DURATION = 1.5;

  // Mount: measure viewport, build tiles, start rAF loop
  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight;
    dimRef.current  = { W, H };
    tilesRef.current = buildTiles(W, H);
    setMounted(true);

    const step = (ts: number) => {
      if (!mountTsRef.current) mountTsRef.current = ts;

      const glbRaw = clamp(glbProgressRef.current ?? 0, 0, 1);

      // Delay the animation start until the worker begins sending GLB progress,
      // or fall back to a time-based start after 3 s (network error / no events).
      if (!startRef.current) {
        const waited = (ts - mountTsRef.current) / 1000;
        if (glbRaw > 0 || waited > 3) startRef.current = ts;
      }

      if (!startRef.current) {
        // Still waiting for the first GLB progress event — hold at 0 %
        setProgress(0);
        setLogoOp(1);
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const elapsed  = (ts - startRef.current) / 1000;
      const timeRaw  = clamp(elapsed / MIN_DURATION, 0, 1);
      // Bottleneck: tiles can't clear faster than MIN_DURATION, and can't run
      // ahead of the actual download. glbRaw=0 on the fallback path means unknown
      // progress — treat as 100% so the time-based animation runs freely.
      const p = easeInOutCubic(Math.min(timeRaw, glbRaw > 0 ? glbRaw : 1));

      setProgress(p);
      setLogoOp(p > 0 ? Math.max(0, 1 - easeInOutCubic(clamp(p * 8, 0, 1))) : 1);

      // Dismiss only when animation is done AND the first frame with the model rendered
      if (p >= 1 && rdyRef.current && !doneRef.current) {
        if (!exitTsRef.current) exitTsRef.current = ts;
        if ((ts - exitTsRef.current) / 1000 >= 0.2) {
          doneRef.current = true;
          onDone();
          return;
        }
      } else if (!rdyRef.current) {
        exitTsRef.current = 0;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    // Scroll to top on every (re)load and disable browser scroll-restoration
    if (typeof history !== 'undefined') history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // Block wheel / keyboard / touch scroll while cover is up.
    // CSS overflow:hidden on body stops the body scroll container, but the
    // html element with overflow-y:scroll can still receive wheel events.
    const SCROLL_KEYS = new Set(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ']);
    const noWheel = (e: WheelEvent)    => e.preventDefault();
    const noTouch = (e: TouchEvent)    => e.preventDefault();
    const noKey   = (e: KeyboardEvent) => { if (SCROLL_KEYS.has(e.key)) e.preventDefault(); };
    window.addEventListener('wheel',     noWheel, { passive: false });
    window.addEventListener('touchmove', noTouch, { passive: false });
    window.addEventListener('keydown',   noKey);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('wheel',     noWheel);
      window.removeEventListener('touchmove', noTouch);
      window.removeEventListener('keydown',   noKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sceneReady || rdyRef.current) return;
    rdyRef.current = true;
  }, [sceneReady]);

  // ── Logo style (shared between static and animated render) ──────────────
  const logoDiv = (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: logoOp,
        color: '#e9e9fc',
        textAlign: 'center',
        pointerEvents: 'none',
        willChange: 'opacity',
        userSelect: 'none',
      }}
    >
      <div style={{
        fontSize: 'clamp(56px, 9vw, 110px)',
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: '-0.04em',
      }}>
        POKYH
      </div>

    </div>
  );

  // SSR / pre-hydration: static solid cover (same on server & client → no mismatch)
  if (!mounted) {
    return (
      <div
        role="status"
        aria-label="POKYH lädt"
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: VIO, contain: 'strict' }}
      >
        {logoDiv}
      </div>
    );
  }

  // Client: animated tile cover
  const { W, H } = dimRef.current;
  const tiles = tilesRef.current;
  const N     = tiles.length;
  const cxC   = W / 2, cyC = H / 2;
  const polys: Pt[][] = [];

  for (let i = 0; i < N; i++) {
    const tile = tiles[i];
    const s = i / N, e = (i + 1) / N;
    let amt = 0;
    if (progress >= e) { amt = 1; }
    else if (progress > s) { amt = easeInOutCubic((progress - s) / (e - s)); }
    if (amt >= 0.999) continue;
    if (amt <= 0.001) { polys.push(tile.pts); continue; }

    // Shrink tile toward its outermost vertex (the corner farthest from screen center)
    let ax = tile.pts[0][0], ay = tile.pts[0][1], bd = -Infinity;
    tile.pts.forEach(([x, y]) => {
      const d = Math.hypot(x - cxC, y - cyC);
      if (d > bd) { bd = d; ax = x; ay = y; }
    });
    const rem = 1 - amt;
    polys.push(tile.pts.map(([x, y]) => [ax + (x - ax) * rem, ay + (y - ay) * rem] as Pt));
  }

  return (
    <div
      role="status"
      aria-label="POKYH lädt"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        contain: 'strict',
        pointerEvents: progress >= 1 && sceneReady ? 'none' : 'all',
      }}
    >
      {/* Tiles animate away — reveal the page behind them as the GLB downloads */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {polys.map((pts, i) => (
          <polygon
            key={i}
            points={ptsStr(pts)}
            fill={VIO}
            stroke={VIO}
            strokeWidth="2.5"
            strokeLinejoin="miter"
          />
        ))}
      </svg>
      {logoDiv}
    </div>
  );
}
