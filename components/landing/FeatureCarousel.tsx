'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { homepageDict, type HomepageKey } from '@/lib/i18n/dictionaries/homepage';
import { frontpageDict, type FrontpageKey } from '@/lib/i18n/dictionaries/frontpage';
import { ensureGsap, prefersReducedMotion, ScrollTrigger, useGsap } from '@/lib/motion';
import { SCROLL, sceneHeight } from '@/lib/scroll-pace';
import { drawPoster, resolveFonts, type PosterKind } from '@/lib/landing-art';
import { useLenis } from '@/components/site/SmoothScroll';
import { useSiteDark } from '@/lib/site-theme';

// The functions of POKYH on a turning ring, rendered with three.js. The
// section stays on screen and scrolling turns the ring. With every function
// the whole screen takes its colour, and its name, set huge, glides past
// behind the ring. Below: one sentence and the way into the app. In the dark
// theme the colours are deep tints of the same tones, with light names.

type Tone = { bg: string; ink: string };
const FEATURES: { n: number; poster: PosterKind; href: string; label: FrontpageKey; light: Tone; dark: Tone }[] = [
  { n: 1, poster: 'timetable', href: '/timetable', label: 'tileTimetable', light: { bg: '#D2D0F7', ink: '#4A46A6' }, dark: { bg: '#23224A', ink: '#C9C7F8' } },
  { n: 4, poster: 'messages', href: '/messages', label: 'tileMessages', light: { bg: '#F7D9D3', ink: '#94493E' }, dark: { bg: '#3D221D', ink: '#F2C6BD' } },
  { n: 3, poster: 'grades', href: '/grades', label: 'tileGrades', light: { bg: '#D5E4D0', ink: '#44653F' }, dark: { bg: '#1D2C1A', ink: '#B9D4B2' } },
  { n: 6, poster: 'exams', href: '/timetable', label: 'tileExams', light: { bg: '#F7E7AC', ink: '#7A5B14' }, dark: { bg: '#382F14', ink: '#EFDB9E' } },
  { n: 7, poster: 'absences', href: '/absences', label: 'tileAbsences', light: { bg: '#E2E1FD', ink: '#4F46E5' }, dark: { bg: '#262546', ink: '#B9BAFB' } },
  { n: 5, poster: 'reminders', href: '/reminders', label: 'tileReminders', light: { bg: '#E9E4DC', ink: '#1E1E1E' }, dark: { bg: '#24221F', ink: '#E9E4DC' } },
  { n: 8, poster: 'todos', href: '/todos', label: 'tileTodos', light: { bg: '#CFEBDD', ink: '#047857' }, dark: { bg: '#15332A', ink: '#9FE0C2' } },
];
const COUNT = FEATURES.length;
const STEP = (Math.PI * 2) / COUNT;

// Ring radius and the (gentle) bend of each item, relative to the item width.
const RADIUS = 1.6;
const BEND = 4.2;

const key = (n: number, part: 'Text' | 'Cta') => `f${n}${part}` as HomepageKey;

/** Holds briefly on each function and turns smoothly in between. */
function stepped(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const t = Math.min(1, Math.max(0, (f - 0.12) / 0.76));
  return i + (1 - Math.cos(Math.PI * t)) / 2;
}

/** A slightly bent plane: a slice of a cylinder of `radius`, `width` along the arc, centred on the origin. */
function bentPlane(radius: number, width: number, height: number) {
  const theta = width / radius;
  const g = new THREE.CylinderGeometry(radius, radius, height, 40, 1, true, -theta / 2, theta);
  g.translate(0, 0, -radius);
  return g;
}

interface Scene {
  camera: THREE.PerspectiveCamera;
  cards: THREE.Mesh[];
}

export default function FeatureCarousel() {
  const t = useT(homepageDict);
  const tf = useT(frontpageDict);
  const localize = useLocalizeHref();
  const lenis = useLenis();
  const root = useRef<HTMLElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const names = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  // Scroll position as a fractional index (target and the eased value drawn).
  const pos = useRef({ target: 0, current: 0 });
  const swingRef = useRef({ y: 0, x: 0, lift: 0 });
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [shown, setShown] = useState(0);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const dark = useSiteDark();
  const tones = FEATURES.map((f) => (dark ? f.dark : f.light));
  const colours = useRef(tones.map((tone) => tone.bg));
  useEffect(() => { colours.current = FEATURES.map((f) => (dark ? f.dark : f.light).bg); }, [dark]);
  const front = FEATURES[shown];
  const frontTone = tones[shown];

  // ── scrolling ──────────────────────────────────────────────────────────
  const scrollTo = useCallback((y: number, immediate = false) => {
    if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 1.2, force: true });
    else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
  }, [lenis]);

  const goTo = useCallback((i: number) => {
    const st = trigger.current;
    if (!st) return;
    scrollTo(st.start + (Math.min(COUNT - 1, Math.max(0, i)) / (COUNT - 1)) * (st.end - st.start));
  }, [scrollTo]);

  // ── three.js scene and the frame loop ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = stage.current;
    const section = root.current;
    const back = sky.current;
    const strip = names.current;
    if (!canvas || !host || !section || !back || !strip) return;
    const gsap = ensureGsap();
    const reduced = prefersReducedMotion();
    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let three: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let ring: THREE.Group | null = null;
    let swing: THREE.Group | null = null;
    let layout = () => {};

    trigger.current = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom 200%',
      onUpdate: (self) => { pos.current.target = self.progress * (COUNT - 1); },
    });

    const frame = () => {
      const p = pos.current;
      p.current += (p.target - p.current) * (reduced ? 1 : 0.085);
      const s = stepped(p.current);
      const near = Math.min(COUNT - 1, Math.max(0, Math.round(p.current)));
      if (near !== indexRef.current) {
        indexRef.current = near;
        setIndex(near);
      }
      // The colour of the function in front floods the screen.
      const i = Math.min(COUNT - 2, Math.floor(s));
      back.style.backgroundColor = gsap.utils.interpolate(colours.current[i], colours.current[i + 1], Math.min(1, s - i)) as string;
      strip.style.transform = `translate3d(${(-s * 100).toFixed(3)}vw,0,0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${(p.current / (COUNT - 1)).toFixed(4)})`;
      if (!renderer || !three || !camera || !ring || !swing) return;
      const sw = swingRef.current;
      ring.rotation.y = -s * STEP;
      swing.rotation.y = sw.y;
      swing.rotation.x = sw.x;
      swing.position.y = -sw.lift;
      renderer.render(three, camera);
    };

    let ticking = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ticking) { gsap.ticker.add(frame); ticking = true; }
      if (!e.isIntersecting && ticking) { gsap.ticker.remove(frame); ticking = false; }
    }, { rootMargin: '200px' });
    io.observe(section);
    const ro = new ResizeObserver(() => { layout(); frame(); });
    ro.observe(host);

    (async () => {
      const fonts = resolveFonts();
      await Promise.all([
        document.fonts.load(`400 64px ${fonts.display}`),
        document.fonts.load(`600 16px ${fonts.sans}`),
      ]).catch(() => undefined);
      if (disposed) return;

      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      } catch {
        return; // No WebGL: names, colours and the link still work.
      }
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const aniso = renderer.capabilities.getMaxAnisotropy();
      camera = new THREE.PerspectiveCamera(27, 1, 10, 20000);
      three = new THREE.Scene();
      const turning = new THREE.Group();
      swing = new THREE.Group();
      ring = turning;
      swing.add(turning);
      three.add(swing);

      const cards: THREE.Mesh[] = [];
      FEATURES.forEach((f, i) => {
        const pivot = new THREE.Group();
        pivot.rotation.y = i * STEP;
        const tex = new THREE.CanvasTexture(drawPoster(f.poster, 1000, fonts));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = aniso;
        const mesh = new THREE.Mesh(
          new THREE.BufferGeometry(),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, toneMapped: false }),
        );
        mesh.userData.index = i;
        pivot.add(mesh);
        turning.add(pivot);
        cards.push(mesh);
      });

      // Geometry follows the item width set in CSS (--w).
      layout = () => {
        if (!renderer || !camera || !ring) return;
        const w = host.clientWidth;
        const h = host.clientHeight;
        const card = host.querySelector<HTMLElement>('[data-measure]')?.offsetWidth || w * 0.25;
        const radius = card * RADIUS;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const distance = h * 2.15;
        camera.fov = (2 * Math.atan(h / 2 / distance) * 180) / Math.PI;
        camera.position.set(0, 0, distance);
        camera.updateProjectionMatrix();
        ring.position.z = -radius;
        cards.forEach((m) => {
          m.geometry.dispose();
          m.geometry = bentPlane(card * BEND, card, card * 1.24);
          m.position.z = radius;
        });
      };

      layout();
      frame();
      scene.current = { camera, cards };
      gsap.to(canvas, { opacity: 1, duration: 0.6 });
      ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(frame);
      trigger.current?.kill();
      trigger.current = null;
      three?.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mat = o.material as THREE.MeshBasicMaterial;
          mat.map?.dispose();
          mat.dispose();
        }
      });
      renderer?.dispose();
      scene.current = null;
    };
  }, []);

  // ── the sentence below changes with the function in front ──────────────
  useEffect(() => {
    if (index === shown) return;
    const gsap = ensureGsap();
    const reduced = prefersReducedMotion();
    gsap.to(caption.current?.querySelectorAll('[data-swap]') ?? [], {
      yPercent: reduced ? 0 : -100,
      opacity: 0,
      duration: reduced ? 0 : 0.3,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => setShown(index),
    });
  }, [index, shown]);

  const firstShow = useRef(true);
  useEffect(() => {
    const items = caption.current?.querySelectorAll('[data-swap]');
    if (!items) return;
    const gsap = ensureGsap();
    if (firstShow.current || prefersReducedMotion()) {
      firstShow.current = false;
      gsap.set(items, { yPercent: 0, opacity: 1 });
      return;
    }
    gsap.fromTo(items, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out' });
  }, [shown]);

  // ── drag turns the ring by scrolling the page; a tap on a side item brings it round ─
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { x: e.clientX, scroll: window.scrollY, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const st = trigger.current;
    if (!d || !st) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    const card = stage.current?.querySelector<HTMLElement>('[data-measure]')?.offsetWidth || 300;
    const segment = (st.end - st.start) / (COUNT - 1);
    scrollTo(Math.min(st.end, Math.max(st.start, d.scroll - (dx / card) * segment)), true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      goTo(Math.round(pos.current.target));
      return;
    }
    const s = scene.current;
    const host = stage.current;
    if (!s || !host) return;
    const r = host.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), s.camera);
    const hit = ray.intersectObjects(s.cards, false)[0];
    if (hit && hit.object.userData.index !== indexRef.current) goTo(hit.object.userData.index);
  };

  // ── entrance: the ring swings in and straightens as the section arrives ─
  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    gsap.fromTo(
      swingRef.current,
      { y: 1.1, x: 0.28, lift: () => window.innerHeight * 0.3 },
      {
        y: 0,
        x: 0,
        lift: 0,
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top bottom', end: 'top top', scrub: 1, invalidateOnRefresh: true },
      },
    );
    gsap.from(scope.querySelectorAll('[data-late]'), {
      y: 30,
      opacity: 0,
      duration: 1.1,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: scope, start: 'top 30%' },
    });
  }, root);

  return (
    <section
      ref={root}
      id="funktionen"
      data-tone="light"
      aria-roledescription="carousel"
      aria-labelledby="features-title"
      className="relative"
      style={{ height: sceneHeight('features', COUNT * SCROLL.length.featureEach + SCROLL.length.featureExtra) }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
      }}
    >
      <h2 id="features-title" className="visually-hidden">{t('featuresTitle')}</h2>

      <div
        ref={sky}
        data-carousel-stage
        className="sticky top-0 flex h-[calc(100*var(--lvh))] flex-col justify-center overflow-hidden pb-[calc(clamp(110px,16svh,150px)+var(--toolbar))] pt-[clamp(70px,11svh,104px)]"
        style={{ backgroundColor: tones[0].bg }}
      >
        {/* The names, huge, on one long strip above the ring */}
        <div aria-hidden="true" className="pointer-events-none relative w-full shrink-0">
          <div ref={names} className="flex w-max will-change-transform">
            {FEATURES.map((f, i) => {
              const word = tf(f.label);
              return (
                <span
                  key={f.n}
                  className="flex w-[100vw] shrink-0 justify-center whitespace-nowrap pb-[0.06em] font-extrabold leading-[0.86] tracking-[-0.065em]"
                  style={{ color: tones[i].ink, fontSize: `min(20vw, ${(150 / word.length).toFixed(2)}vw, 22svh)` }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        <div
          ref={stage}
          className="relative -mt-[2svh] h-[calc(var(--w)*1.24_+_60px)] w-full shrink cursor-grab touch-pan-y select-none active:cursor-grabbing [--w:min(54vw,34svh)] sm:[--w:min(38vw,36svh)] md:[--w:clamp(190px,min(20vw,37svh),360px)]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { drag.current = null; }}
        >
          <div data-measure aria-hidden="true" className="invisible absolute h-0 w-[var(--w)]" />
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full opacity-0" />
        </div>

        <div
          ref={caption}
          className="absolute inset-x-0 bottom-[var(--toolbar)] flex flex-col gap-5 px-5 pb-8 md:flex-row md:items-end md:justify-between md:px-10 md:pb-10 lg:px-[6.5vw]"
          aria-live="polite"
        >
          <p data-late className="overflow-hidden">
            <span data-swap className="block max-w-[36ch] text-[17px] font-medium leading-[1.45] text-ink md:text-[19px]">
              <span className="visually-hidden">{tf(front.label)}: </span>
              {t(key(front.n, 'Text'))}
            </span>
          </p>
          <div data-late className="overflow-hidden">
            <span data-swap className="block">
              <Link
                href={localize(front.href)}
                className="key"
                style={dark
                  ? ({ '--key-bg': `color-mix(in srgb, ${frontTone.ink} 20%, transparent)`, '--key-fg': frontTone.ink } as React.CSSProperties)
                  : ({ '--key-bg': frontTone.ink, '--key-fg': '#FFFFFF' } as React.CSSProperties)}
              >
                {t(key(front.n, 'Cta'))}
                <span aria-hidden="true" className="key-arrow">→</span>
              </Link>
            </span>
          </div>
        </div>

        <span aria-hidden="true" className="absolute inset-x-0 bottom-[var(--toolbar)] h-[3px] bg-ink/10">
          <span ref={bar} className="block h-full w-full origin-left bg-ink" style={{ transform: 'scaleX(0)' }} />
        </span>
      </div>
    </section>
  );
}
