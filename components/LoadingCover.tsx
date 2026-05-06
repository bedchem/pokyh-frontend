'use client';

import { useEffect, useRef, useState } from 'react';

const VIO = '#3730a3';

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
  sceneReady: boolean;
  onDone: () => void;
}

export default function LoadingCover({ sceneReady, onDone }: Props) {
  const [mounted,  setMounted]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoOp,   setLogoOp]   = useState(1);

  const rafRef          = useRef<number | null>(null);
  const startRef        = useRef<number>(0);
  const lockedRef       = useRef<boolean>(false);
  const lockElapsedRef  = useRef<number>(0);
  const lockProgressRef = useRef<number>(0);
  const rdyRef          = useRef<boolean>(false);
  const doneRef         = useRef<boolean>(false);
  const exitTsRef       = useRef<number>(0);
  const tilesRef        = useRef<Tile[]>([]);
  const dimRef          = useRef<{ W: number; H: number }>({ W: 0, H: 0 });

  const DEFAULT_DUR  = 2.0;  // hard cap: cover closes after this many seconds regardless
  const HOLD         = 0.3;  // logo hold before tiles start moving
  const COMPLETE_DUR = 0.5;  // time to smoothly finish remaining tiles after scene fires

  // Mount: measure viewport, build tiles, start rAF loop
  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight;
    dimRef.current  = { W, H };
    tilesRef.current = buildTiles(W, H);
    setMounted(true);

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;

      // When scene fires → record current progress and complete smoothly from there.
      // This avoids the jump that happens when tdRef changes mid-animation.
      if (rdyRef.current && !lockedRef.current) {
        lockedRef.current      = true;
        lockElapsedRef.current = elapsed;
        const rawAtLock = clamp((elapsed - HOLD) / Math.max(DEFAULT_DUR - HOLD, 0.001), 0, 1);
        lockProgressRef.current = easeInOutCubic(rawAtLock);
      }

      let p: number;
      if (lockedRef.current) {
        // Continue from the locked progress, reach 1.0 in COMPLETE_DUR seconds — no jump
        const t = clamp((elapsed - lockElapsedRef.current) / COMPLETE_DUR, 0, 1);
        p = lockProgressRef.current + easeInOutCubic(t) * (1 - lockProgressRef.current);
      } else {
        const raw = clamp((elapsed - HOLD) / Math.max(DEFAULT_DUR - HOLD, 0.001), 0, 1);
        p = easeInOutCubic(raw);
      }

      setProgress(p);
      setLogoOp(p > 0 ? Math.max(0, 1 - easeInOutCubic(clamp(p * 8, 0, 1))) : 1);

      if (p >= 1 && !doneRef.current) {
        if (!exitTsRef.current) exitTsRef.current = ts;
        if ((ts - exitTsRef.current) / 1000 >= 0.2) {
          doneRef.current = true;
          onDone();
          return;
        }
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
        color: '#6366F1',
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
      <div style={{
        marginTop: 14,
        fontSize: 11,
        letterSpacing: '0.32em',
        color: 'rgba(99,102,241,0.6)',
        textTransform: 'uppercase',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      }}>
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
        pointerEvents: progress >= 1 ? 'none' : 'all',
      }}
    >
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
