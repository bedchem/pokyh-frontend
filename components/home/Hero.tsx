'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { ensureGsap, prefersReducedMotion, ScrollTrigger, useGsap } from '@/lib/motion';
import { onSiteThemeChange, siteColor } from '@/lib/site-theme';
import { useLenis } from '@/components/site/SmoothScroll';
import { ManifestScreen } from './Manifest';
import { ARRIVE, HERO_LVH, lvh } from './scenes';
import { SCROLL, sceneHeight } from '@/lib/scroll-pace';
import type { HeroItem, HeroScene } from './heroScene';
import { useTileText } from './useTileText';

// The opening: on every visit the name, large, on clean paper, rises letter
// by letter out of a mask and comes into focus, then the school-day tiles
// arrive out of the depth. Scrolling flies the camera through the name into
// the tunnel of tiles towards a dark screen that comes out of the haze in
// its middle, tiles all around it. The screen already shows the next section
// (a copy of its layout, scaled to the screen); when it fills the view the
// hero steps aside and the real section, waiting underneath in exactly that
// place, carries on. The name is HTML, scaled with the same camera so it
// sits in the 3D space.

// heroScene CAMERA_REST / PORTAL_Z / PORTAL_FILL / FOG, duplicated so three.js loads lazily
const REST = 12;
const PORTAL_Z = -72;
const PORTAL_FILL = 1.2;
const END_Z = PORTAL_Z + PORTAL_FILL;
const FOG = { near: 9, far: 34 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Where the tunnel part ends and the dark screen starts to grow towards the view. */
const NEAR = 0.5;
/** Size of the dark screen (share of the view) at that point. */
const NEAR_SIZE = 0.12;

/**
 * Camera depth for scroll progress p. Down the tunnel the camera gathers
 * speed; from NEAR on the depth follows from the size the dark
 * screen should have, so it grows steadily and settles on the full view
 * instead of ballooning in the last metres (size = PORTAL_FILL / distance).
 */
function cameraZ(p: number): number {
  const nearZ = PORTAL_Z + PORTAL_FILL / NEAR_SIZE;
  if (p <= NEAR) {
    const t = p / NEAR;
    return REST - (1 - Math.cos((Math.PI / 2) * t)) * (REST - nearZ);
  }
  const t = clamp01((p - NEAR) / (ARRIVE - NEAR));
  const size = NEAR_SIZE + (1 - NEAR_SIZE) * (1 - Math.pow(1 - t, 2.2));
  return PORTAL_Z + PORTAL_FILL / size;
}

// The opening is CSS (globals.css, .home-hero) and starts with the first
// paint. On a first visit this small script, which runs before that paint,
// holds it (html[data-hero-wait] pauses the animations at their start, the
// name not yet visible) until the name's font is loaded and the tab is
// actually shown, at most 1.2 s: so the letters never rise in a stand-in
// font and the opening is not over before anyone sees it (a tab opened in
// the background). Rendered with the server HTML only, like ThemeScript;
// when the homepage is reached inside the site, the font is there already.
const HERO_START_EVENT = 'pokyh-hero-start';
const HERO_START = `(function(){var d=document.documentElement,done=0;d.setAttribute('data-hero-wait','');function go(){if(done)return;if(document.visibilityState==='hidden'){document.addEventListener('visibilitychange',go,{once:true});return}done=1;requestAnimationFrame(function(){d.removeAttribute('data-hero-wait');d.dispatchEvent(new Event('${HERO_START_EVENT}'))})}setTimeout(go,1200);try{var t=document.querySelector('.home-hero [data-title]'),s=getComputedStyle(t);document.fonts.load(s.fontWeight+' 100px '+s.fontFamily).then(go,go)}catch(e){go()}})()`;

const noopSubscribe = () => () => {};

function HeroStart() {
  const fromServerHtml = useSyncExternalStore(noopSubscribe, () => false, () => true);
  if (!fromServerHtml) return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: HERO_START }} />;
}

export default function Hero() {
  const t = useT(frontpageDict);
  const tileText = useTileText();
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  useEffect(() => { lenisRef.current = lenis; }, [lenis]);

  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const motion = useRef({ arrive: 0, progress: 0, eased: 0, px: 0, py: 0, tx: 0, ty: 0 });
  // The opening tells the scene when the tiles may come.
  const opened = useRef<(() => void) | null>(null);

  const items = useMemo<HeroItem[]>(() => [
    { type: 'tile', art: 'time', portrait: true, label: t('tileTimetable') },
    { type: 'poster', art: 'grades', label: t('tileGrades') },
    { type: 'tile', art: 'plate', portrait: false, label: tileText.titles.mensa },
    { type: 'tile', art: 'message', portrait: false, label: t('tileMessages') },
    { type: 'tile', art: 'exam', portrait: true, label: t('tileExams') },
    { type: 'poster', art: 'absences', label: t('tileAbsences') },
    { type: 'tile', art: 'cancel', portrait: false, label: t('tileCancel') },
    { type: 'tile', art: 'week', portrait: true, label: t('tileWeek') },
    { type: 'poster', art: 'timetable', label: t('tileTimetable') },
    { type: 'tile', art: 'grade', portrait: true, label: t('tileGrades') },
    { type: 'poster', art: 'todos', label: t('tileTodos') },
    { type: 'poster', art: 'messages', label: t('tileMessages') },
    { type: 'tile', art: 'time', portrait: false, label: t('tileTimetable') },
    { type: 'poster', art: 'reminders', label: t('tileReminders') },
    { type: 'tile', art: 'grade', portrait: false, label: t('tileGrades') },
    { type: 'poster', art: 'exams', label: t('tileExams') },
    { type: 'tile', art: 'message', portrait: true, label: t('tileMessages') },
    { type: 'tile', art: 'time', portrait: true, label: t('tileTimetable') },
    { type: 'tile', art: 'exam', portrait: false, label: t('tileExams') },
    { type: 'tile', art: 'cancel', portrait: true, label: t('tileCancel') },
    { type: 'tile', art: 'week', portrait: false, label: t('tileWeek') },
    { type: 'tile', art: 'plate', portrait: true, label: tileText.titles.mensa },
    { type: 'poster', art: 'mensa', label: tileText.titles.mensa },
    { type: 'tile', art: 'plate', portrait: false, label: tileText.titles.mensa },
  ], [t, tileText]);


  // ── Scene, scroll and the frame loop ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = root.current;
    const box = stage.current;
    const headline = head.current;
    const portal = screen.current;
    if (!canvas || !section || !box || !headline || !portal) return;
    const gsap = ensureGsap();
    const reduced = prefersReducedMotion();
    const m = motion.current;
    const chrome = Array.from(section.querySelectorAll<HTMLElement>('[data-chrome]'));
    let scene: HeroScene | null = null;
    let disposed = false;
    let visible = true;
    let hovered: number | null = null;
    let lastPick = { x: -1, y: -1 };
    const fine = window.matchMedia('(pointer: fine)').matches;

    // The two colours of the page, read from the theme and re-read when it flips.
    const colours = { paper: '#F5F2ED', night: '#111114', dark: false };
    const readColours = (dark: boolean) => {
      colours.paper = siteColor('--paper') || colours.paper;
      colours.night = siteColor('--night') || colours.night;
      colours.dark = dark;
      scene?.setTheme({ night: colours.night, dark });
    };
    readColours(document.documentElement.classList.contains('dark'));
    const offTheme = onSiteThemeChange(readColours);

    if (reduced) m.arrive = 1;

    // Progress over exactly the pinned distance (hero minus its stage), so it
    // does not depend on the window height, which changes on phones when the
    // browser bars collapse. The camera glides after the scroll position
    // (time-based, SCROLL.heroFollow), so a flick on a trackpad or a phone
    // becomes a flight instead of a jump. The hand-over to the section
    // underneath needs both: the camera has arrived and the page has scrolled
    // there, so scrolling back up never shows the section out of place.
    const st = reduced
      ? null
      : ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.max(1, section.offsetHeight - box.offsetHeight)}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => { m.progress = self.progress; },
        });

    let last = 0;
    const tick = (time: number) => {
      const dt = last ? Math.min(0.1, time - last) : 1 / 60;
      last = time;
      if (!visible && scene) return;
      m.eased += (m.progress - m.eased) * (1 - Math.exp(-dt * SCROLL.heroFollow));
      if (Math.abs(m.progress - m.eased) < 0.0004) m.eased = m.progress;
      m.px += (m.tx - m.px) * 0.06;
      m.py += (m.ty - m.py) * 0.06;
      const p = m.eased;
      const camZ = cameraZ(p);
      // Dark once the screen fills the view; from there the next section shows.
      const covered = camZ < END_Z + 0.02;
      const handed = p >= ARRIVE - 0.0005 && m.progress >= ARRIVE - 0.0005;
      const bg = covered ? colours.night : colours.paper;
      box.style.backgroundColor = handed ? 'transparent' : bg;
      box.style.pointerEvents = handed ? 'none' : '';
      // Handed over: the section underneath is in charge (also of the scroll pace).
      section.style.pointerEvents = handed ? 'none' : '';
      canvas.style.visibility = handed ? 'hidden' : '';
      const tone = covered ? 'dark' : 'light';
      if (section.dataset.tone !== tone) section.dataset.tone = tone;

      // The headline lives on the plane z = 0 of the scene.
      if (camZ > 0.6) {
        headline.style.transform = `scale(${(REST / camZ).toFixed(4)})`;
        headline.style.opacity = clamp01((camZ - 1.4) / 2.6).toFixed(3);
        headline.style.visibility = 'visible';
      } else {
        headline.style.visibility = 'hidden';
      }
      const fade = clamp01(1 - p / 0.04).toFixed(3);
      chrome.forEach((el) => {
        el.style.opacity = fade;
        el.style.pointerEvents = fade === '0.000' ? 'none' : '';
      });

      if (!scene) {
        portal.style.visibility = 'hidden';
        return;
      }
      if (fine && p > 0.04 && p < ARRIVE && (lastPick.x !== m.tx || lastPick.y !== m.ty)) {
        lastPick = { x: m.tx, y: m.ty };
        const r = canvas.getBoundingClientRect();
        const hit = scene.pick(r.left + ((m.tx + 1) / 2) * r.width, r.top + ((1 - m.ty) / 2) * r.height);
        if (hit !== hovered) {
          hovered = hit;
          scene.setHover(hit);
          canvas.style.cursor = hit === null ? '' : 'pointer';
        }
      }
      const travel = 1 - (camZ - END_Z) / (REST - END_Z);
      scene.frame({
        camZ,
        px: m.px * (1 - clamp01(travel)),
        py: m.py * (1 - clamp01(travel)),
        velocity: lenisRef.current?.velocity ?? 0,
        arrive: m.arrive,
        background: bg,
        fogNear: FOG.near,
        fogFar: FOG.far,
        time,
      });

      // The dark screen with the next section on it, where the scene put it;
      // towards the end it settles on the full view exactly (no corners, no
      // parallax), which is where the real section is waiting.
      const distance = camZ - PORTAL_Z;
      const haze = clamp01((distance - FOG.near) / (FOG.far - FOG.near));
      if (handed || haze >= 1) {
        portal.style.visibility = 'hidden';
      } else {
        const w = box.clientWidth;
        const h = box.clientHeight;
        const r = scene.portalRect();
        // Parallax and perspective are let go of in the last part of the approach.
        const k = clamp01((Math.min((r.right - r.left) / w, 1) - 0.7) / 0.3);
        const sx = ((r.right - r.left) / w) * (1 - k) + k;
        const sy = ((r.bottom - r.top) / h) * (1 - k) + k;
        const x = r.left * (1 - k);
        const y = r.top * (1 - k);
        const corner = 8 * (1 - clamp01((Math.min(sx, sy) - 0.55) / 0.45));
        portal.style.visibility = 'visible';
        portal.style.opacity = (1 - haze).toFixed(3);
        portal.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`;
        portal.style.borderRadius = `${corner.toFixed(2)}% / ${corner.toFixed(2)}%`;
      }
    };

    const onMove = (e: PointerEvent) => {
      m.tx = (e.clientX / window.innerWidth) * 2 - 1;
      m.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onClick = (e: MouseEvent) => {
      if (!scene) return;
      const hit = scene.pick(e.clientX, e.clientY);
      if (hit !== null) scene.flip(hit);
    };

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(section);
    const ro = new ResizeObserver(() => scene?.resize());
    ro.observe(box);
    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      gsap.ticker.add(tick);
    }
    canvas.addEventListener('click', onClick);

    // The tiles come once the letters have closed up (see the opening below)
    // and the tunnel is built, whichever is later.
    let arrived = reduced;
    let wanted = false;
    const arrive = () => {
      if (arrived || !wanted || !scene) return;
      arrived = true;
      gsap.to(m, { arrive: 1, duration: 2.4, ease: 'power2.out' });
    };
    opened.current = () => {
      wanted = true;
      arrive();
    };

    (async () => {
      const [{ createHeroScene }, { resolveFonts }] = await Promise.all([import('./heroScene'), import('@/lib/landing-art')]);
      const fonts = resolveFonts();
      await Promise.all([
        document.fonts.load(`400 64px ${fonts.display}`),
        document.fonts.load(`800 64px ${fonts.sans}`),
        document.fonts.load(`600 16px ${fonts.sans}`),
      ]).catch(() => undefined);
      if (disposed) return;
      const small = Math.min(window.innerWidth, window.innerHeight) < 700;
      const list = small ? [...items.slice(0, 15), ...items.slice(4, 10)] : [...items, ...items.slice(0, 12)];
      const built = await createHeroScene(canvas, list, tileText, fonts, { textureSize: small ? 400 : 520, cancelled: () => disposed });
      if (!built || disposed) return;
      scene = built;
      scene.setTheme({ night: colours.night, dark: colours.dark });
      gsap.to(canvas, { opacity: 1, duration: 0.8, ease: 'power2.out' });
      if (reduced) tick(0);
      arrive();
    })();

    return () => {
      disposed = true;
      opened.current = null;
      offTheme();
      st?.kill();
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
      gsap.killTweensOf(m);
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('click', onClick);
      scene?.dispose();
      scene = null;
    };
  }, [items, tileText]);

  // The cue under the name starts the flight: down to where the camera has
  // gone through the name and the next section takes over.
  const startFlight = () => {
    const section = root.current;
    const box = stage.current;
    if (!section || !box) return;
    const target = section.offsetTop + Math.max(0, section.offsetHeight - box.offsetHeight) * ARRIVE + 2;
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(target, { duration: 2.8 });
    else window.scrollTo({ top: target, behavior: 'smooth' });
  };

  // ── The opening, then the letters lean towards the pointer ─────────────
  // The opening itself is CSS (globals.css, .home-hero): it starts with the
  // first paint instead of waiting for the scripts, so the name is there at
  // once on a slow connection too. Here: the tiles set off 0.6 s into it, and
  // afterwards the letters lean towards the pointer.
  useGsap(({ gsap, reduced, scope }) => {
    const letters = Array.from(scope.querySelectorAll<HTMLElement>('[data-letter]'));

    if (reduced) {
      opened.current?.();
      return;
    }

    // The opening may still wait for the font (HeroStart below), or have run
    // a while before the scripts arrived: the tiles follow its own clock.
    const html = document.documentElement;
    let start = 0;
    let introEnds = Infinity;
    const begin = () => {
      const elapsed = Number(letters[0]?.getAnimations?.()[0]?.currentTime ?? 0) || 0;
      start = window.setTimeout(() => opened.current?.(), Math.max(0, 600 - elapsed));
      introEnds = performance.now() + Math.max(0, 1900 - elapsed);
    };
    if (html.hasAttribute('data-hero-wait')) html.addEventListener(HERO_START_EVENT, begin, { once: true });
    else begin();
    const stop = () => {
      html.removeEventListener(HERO_START_EVENT, begin);
      window.clearTimeout(start);
    };

    if (!window.matchMedia('(pointer: fine)').matches) return stop;
    const lift = letters.map((el) => gsap.quickTo(el, 'yPercent', { duration: 0.7, ease: 'power3' }));
    const tilt = letters.map((el) => gsap.quickTo(el, 'rotation', { duration: 0.7, ease: 'power3' }));
    const onMove = (e: PointerEvent) => {
      if (window.scrollY > window.innerHeight * 0.3 || performance.now() < introEnds) return;
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / (window.innerWidth * 0.22));
        lift[i](-near * 9);
        tilt[i](near * (dx > 0 ? -4 : 4));
      });
    };
    const onLeave = () => letters.forEach((_, i) => { lift[i](0); tilt[i](0); });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      stop();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, root);

  return (
    <section ref={root} data-tone="light" data-scroll-pace="hero" aria-labelledby="hero-title" className="home-hero relative z-10" style={{ height: sceneHeight('hero', HERO_LVH) }}>
      <div ref={stage} className="sticky top-0 overflow-hidden bg-[var(--paper)] text-ink" style={{ height: lvh(100) }}>
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full opacity-0" />

        {/* The dark screen in the tunnel, with the next section already on it */}
        <div
          ref={screen}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-full w-full origin-top-left overflow-hidden bg-[var(--night)] will-change-transform"
          style={{ visibility: 'hidden' }}
        >
          <ManifestScreen copy />
        </div>

        <div ref={head} className="pointer-events-none absolute inset-0 flex items-center justify-center will-change-transform">
          <h1 id="hero-title" data-title className="font-display flex pb-[0.04em] text-[min(27vw,calc(44*var(--svh)))] font-extrabold leading-[0.8] tracking-[-0.055em]">
            <span className="visually-hidden">{t('heroHidden')}</span>
            {t('heroTitle').split('').map((l, i) => (
              <span key={i} data-letter aria-hidden="true" className="inline-block origin-bottom" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                {l}
              </span>
            ))}
          </h1>
          <HeroStart />
        </div>

        {/* Kept above a phone's browser bars (bottom: the large minus the small viewport) */}
        <div
          data-chrome
          style={{ bottom: 'var(--toolbar)' }}
          className="absolute inset-x-0 grid grid-cols-[1fr_auto_1fr] items-end gap-4 px-5 pb-6 text-[14px] font-medium md:px-10 md:pb-8 md:text-[15px] lg:px-[6.5vw]"
        >
          <a
            href="https://github.com/bedchem"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 justify-self-start"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
              <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
            </svg>
            <span className="border-b border-transparent transition-colors group-hover:border-current">{t('heroGithub')}</span>
          </a>
          <button type="button" onClick={startFlight} aria-label={t('heroScroll')} className="home-scroll group flex flex-col items-center gap-2.5 rounded-2xl px-3 py-1.5">
            <span aria-hidden="true" className="home-scroll-word flex text-[13px] font-semibold text-ink-2 transition-colors duration-300 group-hover:text-ink">
              {[...t('heroScroll')].map((c, i) => <span key={i} style={{ animationDelay: `${i * 55}ms` }}>{c}</span>)}
            </span>
            <span aria-hidden="true" className="home-scroll-track relative block h-11 w-[26px] rounded-full">
              <span className="home-scroll-dot absolute left-1/2 top-[7px] block h-[9px] w-1 rounded-full bg-ink" />
            </span>
          </button>
          <p className="justify-self-end text-right text-ink-2">{t('heroRight')}</p>
        </div>
      </div>
    </section>
  );
}
