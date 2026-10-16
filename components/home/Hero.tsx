'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import { ensureGsap, prefersReducedMotion, ScrollTrigger, useGsap } from '@/lib/motion';
import { resolveFonts, type TileText } from '@/lib/landing-art';
import { useLenis } from '@/components/site/SmoothScroll';
import { afterIntro } from './shared';
import type { HeroItem, HeroScene } from './heroScene';

// The opening: the name, large, on clean paper. Scrolling flies the camera
// through it into a tunnel of school-day tiles that come out of the haze,
// and at its end into a dark screen, which is where the next section begins.
// The name is HTML, scaled with the same camera so it sits in the 3D space.

const PAPER = '#F5F2ED';
const NIGHT = '#111114';
// heroScene CAMERA_REST / PORTAL_Z / PORTAL_FILL, duplicated so three.js loads lazily
const REST = 12;
const PORTAL_Z = -104;
const END_Z = PORTAL_Z + 0.85;
const TRAVEL = REST - END_Z;
const ENTER_FROM = 46;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function Hero() {
  const t = useT(frontpageDict);
  const th = useT(homepageDict);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  useEffect(() => { lenisRef.current = lenis; }, [lenis]);

  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const motion = useRef({ enterZ: ENTER_FROM, arrive: 0, progress: 0, eased: 0, px: 0, py: 0, tx: 0, ty: 0 });

  const items = useMemo<HeroItem[]>(() => [
    { type: 'tile', art: 'time', portrait: true, label: t('tileTimetable') },
    { type: 'poster', art: 'grades', label: t('tileGrades') },
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
  ], [t]);

  const tileText = useMemo<TileText>(() => ({
    period: th('tPeriod'), subject: th('tSubject'), room: th('tRoom'),
    gradeSubject: th('tGradeSubject'), average: th('tAverage'),
    cancel: th('tCancel'), cancelSub: th('tCancelSub'),
    msgFrom: th('tMsgFrom'), msgText: th('tMsgText'),
    examDay: th('tExamDay'), exam: th('tExam'),
    weekdays: th('tWeekdays').split('|'),
  }), [th]);

  // ── Scene, scroll and the frame loop ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = root.current;
    const box = stage.current;
    const headline = head.current;
    if (!canvas || !section || !box || !headline) return;
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

    if (reduced) {
      m.enterZ = REST;
      m.arrive = 1;
    }

    const st = reduced
      ? null
      : ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => { m.progress = self.progress; },
        });

    const tick = (time: number) => {
      if (!visible && scene) return;
      m.eased += (m.progress - m.eased) * 0.14;
      m.px += (m.tx - m.px) * 0.06;
      m.py += (m.ty - m.py) * 0.06;
      const p = m.eased;
      // Slow out of the start, fast down the tunnel, slow into the dark screen.
      const travel = (1 - Math.cos(Math.PI * p)) / 2;
      const camZ = m.enterZ - travel * TRAVEL;
      const covered = camZ - PORTAL_Z < 1.15;
      const bg = covered ? NIGHT : PAPER;
      box.style.backgroundColor = bg;
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
      chrome.forEach((el) => { el.style.opacity = fade; });

      if (!scene) return;
      if (fine && p > 0.05 && p < 0.8 && (lastPick.x !== m.tx || lastPick.y !== m.ty)) {
        lastPick = { x: m.tx, y: m.ty };
        const r = canvas.getBoundingClientRect();
        const hit = scene.pick(r.left + ((m.tx + 1) / 2) * r.width, r.top + ((1 - m.ty) / 2) * r.height);
        if (hit !== hovered) {
          hovered = hit;
          scene.setHover(hit);
          canvas.style.cursor = hit === null ? '' : 'pointer';
        }
      }
      scene.frame({
        camZ,
        px: m.px * (1 - travel),
        py: m.py * (1 - travel),
        velocity: lenisRef.current?.velocity ?? 0,
        arrive: m.arrive,
        background: bg,
        portal: smooth(0.3, 0.62, p),
        time,
      });
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

    const offIntro = reduced
      ? () => {}
      : afterIntro(() => {
          gsap.to(m, { enterZ: REST, duration: 2.9, ease: 'expo.out', delay: 0.05 });
          gsap.to(m, { arrive: 1, duration: 2.6, ease: 'power2.out' });
        });

    (async () => {
      const fonts = resolveFonts();
      await Promise.all([
        document.fonts.load(`400 64px ${fonts.display}`),
        document.fonts.load(`700 64px ${fonts.sans}`),
        document.fonts.load(`600 16px ${fonts.sans}`),
      ]).catch(() => undefined);
      const { createHeroScene } = await import('./heroScene');
      if (disposed) return;
      const list = window.innerWidth < 700 ? items.slice(0, 16) : [...items, ...items.slice(0, 8)];
      scene = createHeroScene(canvas, list, tileText, fonts);
      if (!scene) return;
      gsap.to(canvas, { opacity: 1, duration: 0.8, ease: 'power2.out' });
      if (reduced) tick(0);
    })();

    return () => {
      disposed = true;
      offIntro();
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

  // ── The name: letters rise in, then lean towards the pointer ───────────
  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    const letters = Array.from(scope.querySelectorAll<HTMLElement>('[data-letter]'));
    const tl = gsap.timeline({ paused: true });
    tl.from(letters, { yPercent: 105, duration: 1.6, stagger: 0.06, ease: 'expo.out' }, 0.2)
      .from(scope.querySelectorAll('[data-chrome] > *'), { y: 24, opacity: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0.8);
    const off = afterIntro(() => tl.play());

    if (!window.matchMedia('(pointer: fine)').matches) return off;
    const lift = letters.map((el) => gsap.quickTo(el, 'yPercent', { duration: 0.7, ease: 'power3' }));
    const tilt = letters.map((el) => gsap.quickTo(el, 'rotate', { duration: 0.7, ease: 'power3' }));
    const onMove = (e: PointerEvent) => {
      if (window.scrollY > window.innerHeight * 0.3 || tl.isActive()) return;
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
      off();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, root);

  return (
    <section ref={root} data-tone="light" aria-labelledby="hero-title" className="home-hero relative h-[310svh]">
      <div ref={stage} className="sticky top-0 h-[100svh] overflow-hidden bg-[var(--paper)] text-ink">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full opacity-0" />

        <div ref={head} className="pointer-events-none absolute inset-0 flex items-center justify-center will-change-transform">
          <h1 id="hero-title" className="font-display flex overflow-hidden pb-[0.04em] text-[min(27vw,44svh)] font-extrabold leading-[0.8] tracking-[-0.055em]">
            <span className="visually-hidden">{t('heroHidden')}</span>
            {t('heroTitle').split('').map((l, i) => (
              <span key={i} data-letter aria-hidden="true" className="inline-block origin-bottom">
                {l}
              </span>
            ))}
          </h1>
        </div>

        <div
          data-chrome
          className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-end gap-4 px-5 pb-6 text-[14px] font-medium md:px-10 md:pb-8 md:text-[15px] lg:px-[6.5vw]"
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
          <div className="flex flex-col items-center gap-3">
            <span className="text-[13px] text-ink-2">{t('heroScroll')}</span>
            <span aria-hidden="true" className="block h-10 w-px overflow-hidden bg-ink/15">
              <span className="home-scroll-cue block h-full w-full bg-ink" />
            </span>
          </div>
          <p className="justify-self-end text-right text-ink-2">{t('heroRight')}</p>
        </div>
      </div>
    </section>
  );
}

