'use client';

import { useRef, useEffect, RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ════════════════════════════════════════════════
   SCREEN CANVAS TEXTURE — shown on iPhone screen
   ════════════════════════════════════════════════ */

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

function buildScreenTexture(): THREE.CanvasTexture {
  const W = 600, H = 1300;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;

  g.fillStyle = '#050506'; g.fillRect(0, 0, W, H);

  /* Dynamic Island */
  g.fillStyle = '#000';
  rrect(g, (W - 168) / 2, 24, 168, 42, 21); g.fill();

  /* Status bar */
  g.fillStyle = '#f5f5f7';
  g.font = 'bold 28px -apple-system, Helvetica Neue, sans-serif';
  g.textBaseline = 'alphabetic';
  g.fillText('9:41', 32, 78);
  g.font = '16px -apple-system, Helvetica Neue, sans-serif';
  g.textAlign = 'right'; g.fillStyle = '#f5f5f7';
  g.fillText('●●●', W - 30, 75);
  g.textAlign = 'left';

  /* Date */
  g.fillStyle = '#6e6e73';
  g.font = '400 24px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('Montag, 27. April', 30, 138);

  /* Greeting */
  g.fillStyle = '#f5f5f7';
  g.font = 'bold 54px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('Hallo, Sabby', 30, 204);

  /* Separator */
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(18, 224); g.lineTo(W - 18, 224); g.stroke();

  const card = (y: number, h: number) => {
    g.fillStyle = '#0f0f11';
    rrect(g, 16, y, W - 32, h, 28); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 1;
    rrect(g, 16, y, W - 32, h, 28); g.stroke();
  };

  /* Card 1: grade + next lesson */
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

  /* Card 2: timetable */
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

  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/* ════════════════════════════════════════════════
   REACT COMPONENT
   ════════════════════════════════════════════════ */

export default function IPhoneScene({
  progressRef,
  className,
}: {
  progressRef: RefObject<number>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    renderer.setClearColor(0x000000, 0);

    /* ── Camera — slight downward offset so phone sits centred in viewport ── */
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, -0.17, 7.5);
    camera.lookAt(0, 0, 0);

    /* ── Scene ── */
    const scene = new THREE.Scene();

    /* ── Environment map (bundled RoomEnvironment — no CDN) ── */
    const pmrem  = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    /* ── Lights — soft studio, nothing harsh ── */
    const isDarkInit = document.documentElement.classList.contains('dark');
    // Ambient: soft overall fill
    const ambLight  = new THREE.AmbientLight(0xffffff, isDarkInit ? 0.55 : 0.85);
    // Key: single gentle directional from upper-right
    const keyLight  = new THREE.DirectionalLight(0xffffff, isDarkInit ? 0.55 : 0.45);
    keyLight.position.set(2.5, 4, 3);
    // Fill: cool-tinted from the left
    const fillLight = new THREE.DirectionalLight(0xccd8ff, 0.22);
    fillLight.position.set(-3, 0, 2);
    // Rim: subtle back-light for depth
    const rimLight  = new THREE.DirectionalLight(0x8899bb, 0.18);
    rimLight.position.set(-1, -4, -3);
    // Screen glow: indigo point light
    const glowLight = new THREE.PointLight(0x6366f1, 0.28, 6);
    glowLight.position.set(0, 0, 2.2);
    scene.add(ambLight, keyLight, fillLight, rimLight, glowLight);

    /* ── Screen texture ── */
    const screenTex = buildScreenTexture();

    /* ── GLB loader (DRACO via Google CDN) ── */
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);

    /* phone = pivot group wrapping the model (scale changes won't drift center) */
    let phone: THREE.Group | null = null;

    gltfLoader.load(
      '/models/iphone.glb',
      (gltf) => {
        const model = gltf.scene;

        /* Compute bounding box before any scale change */
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const sf     = 1.9 / maxDim; // target: longest dim = 1.9 units

        /* Center model at local origin, apply base scale */
        model.position.set(-center.x, -center.y, -center.z);
        model.scale.setScalar(sf);

        /* Wrap in pivot so animation scale is independent of centering */
        const pivot = new THREE.Group();
        pivot.add(model);
        pivot.scale.setScalar(0.82); // start a bit smaller; grows to 1.0 on scroll-in
        scene.add(pivot);
        phone = pivot;

        /* Inject our screen texture if the mesh is identifiable */
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const nm = (
            child.name +
            (Array.isArray(child.material) ? '' : ((child.material as THREE.Material)?.name ?? ''))
          ).toLowerCase();
          if (
            nm.includes('screen') || nm.includes('display') ||
            nm.includes('glass_fr') || nm.includes('front_gl') ||
            nm.includes('oled')    || nm.includes('lcd')
          ) {
            child.material = new THREE.MeshBasicMaterial({ map: screenTex });
          }
        });
      },
      undefined,
      (err) => console.error('[IPhoneScene] GLB load error', err),
    );

    /* ── Resize ── */
    function syncSize() {
      const el = canvasRef.current;
      if (!el) return;
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);

    /* ── Dark-mode observer ── */
    let currentDark = isDarkInit;
    const moObs = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      if (dark === currentDark) return;
      currentDark = dark;
      ambLight.intensity  = dark ? 0.55 : 0.85;
      keyLight.intensity  = dark ? 0.55 : 0.45;
      renderer.toneMappingExposure = dark ? 0.88 : 0.78;
    });
    moObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    /* ── Animation loop ── */
    let rafId: number;
    const timer    = new THREE.Timer();
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let smoothP    = 0; // smoothed scroll progress, no React state

    function frame() {
      rafId = requestAnimationFrame(frame);
      timer.update();
      syncSize();

      if (phone) {
        /* Smooth-track raw scroll progress (0.055 = slow, deliberate feel) */
        const rawP = Math.max(0, Math.min(1, progressRef.current ?? 0));
        smoothP += (rawP - smoothP) * (noMotion ? 1 : 0.055);

        /* ── One full rotation, completes at 65% of scroll, then holds ──
           rotFraction goes 0→1 while smoothP goes 0→0.65, then stays at 1 */
        const rotFraction = Math.min(1, smoothP / 0.65);
        phone.rotation.y  = rotFraction * Math.PI * 2;

        /* Subtle X rock: peaks at halfway through spin */
        phone.rotation.x = Math.sin(rotFraction * Math.PI * 2) * 0.06;

        /* Scale in on entry: 0.82 → 1.0 over first 25% of scroll */
        const entry = Math.min(1, smoothP * 4);
        phone.scale.setScalar(0.82 + entry * 0.18);

        /* Gentle idle float once phone is visible */
        const t = timer.getElapsed();
        phone.position.y = Math.sin(t * 0.75) * 0.028 * entry;

        /* Screen glow breathes softly */
        glowLight.intensity = 0.20 + Math.sin(t * 1.1) * 0.055;
      }

      renderer.render(scene, camera);
    }
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      moObs.disconnect();
      renderer.dispose();
      screenTex.dispose();
      envTex.dispose();
      draco.dispose();
      timer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
