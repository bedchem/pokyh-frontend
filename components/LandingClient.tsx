'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import '@/app/landing.css';

// Three.js worker bundle + 5MB GLB — never block initial paint.
// Chunk is preloaded on idle; GLB is prefetched via fetch() before user scrolls.
const IPhoneScene = dynamic(() => import('@/components/IPhoneScene'), { ssr: false });

const WEEK_DAYS = [
  { abbr: 'Mo', num: 4, isToday: true  },
  { abbr: 'Di', num: 5, isToday: false },
  { abbr: 'Mi', num: 6, isToday: false },
  { abbr: 'Do', num: 7, isToday: false },
  { abbr: 'Fr', num: 8, isToday: false },
];
const WEEK_TIMES = ['07:50', '08:40', '09:30', 'pause', '10:35', '11:25'];
// [period][day] — null row = pause, null cell = free slot
const WEEK_GRID: Array<Array<{ s: string; t: string; oldT?: string; r: string; c: string; st: string } | null> | null> = [
  // 07:50
  [
    { s: 'R',       t: 'Fe-Ma',  r: 'c+2/03',  c: '#C6E84A', st: 'normal'      },
    { s: 'IT',      t: 'Wi-So',  r: 'c+2/03',  c: '#E73BDF', st: 'normal'      },
    { s: 'M',       t: 'Hu-Al',  r: 'c+2/03',  c: '#4ED87A', st: 'exam'        },
    { s: 'ENGL',    t: 'Vo-Be',  r: 'c+2/03',  c: '#3DC4CE', st: 'normal'      },
    { s: 'ENGL',    t: 'Vo-Be',  r: 'c+2/03',  c: '#3DC4CE', st: 'normal'      },
  ],
  // 08:40
  [
    { s: 'ENGL',    t: 'Vo-Be',  r: 'c+2/03',  c: '#3DC4CE', st: 'normal'      },
    { s: 'M5-M7',   t: 'Gu-Lu',  r: 'Inf III', c: '#E08899', st: 'normal'      },
    { s: 'D',       t: 'Ze-Ti',  r: 'c+2/03',  c: '#5AA0E8', st: 'normal'      },
    { s: 'ENGL',    t: 'Vo-Be',  r: 'c+2/03',  c: '#3DC4CE', st: 'normal'      },
    { s: 'D',       t: 'Ro-Fr',  r: 'c+2/03',  c: '#5AA0E8', st: 'normal'      },
  ],
  // 09:30
  [
    { s: 'IT',      t: 'Wi-So',  r: 'c+4/03',  c: '#E73BDF', st: 'normal'      },
    null,
    { s: 'Bew.',    t: 'Da-Mi',  r: 'Tu I',    c: '#AA8EE0', st: 'cancelled'   },
    { s: 'Re-Wiku', t: 'Ro-Fr',  r: 'c+2/03',  c: '#6AB87A', st: 'normal'      },
    null,
  ],
  // pause
  null,
  // 10:35
  [
    { s: 'M5-M7',   t: 'Gu-Lu',  r: 'Inf III', c: '#E08899', st: 'normal'      },
    { s: 'M5-M7',   t: 'Gu-Lu',  r: 'Inf III', c: '#E08899', st: 'normal'      },
    { s: 'Bew.',    t: 'Da-Mi',  r: 'Tu I',    c: '#AA8EE0', st: 'cancelled'   },
    { s: 'M8',      t: 'Li-An',  r: 'E-Lab',   c: '#E89E6E', st: 'normal'      },
    { s: 'M',       t: 'Ne-Pe',  oldT: 'Hu-Al', r: 'c+2/03',  c: '#4ED87A', st: 'replacement' },
  ],
  // 11:25
  [
    null,
    null,
    { s: 'Re-Wiku', t: 'Ro-Fr',  r: 'c+2/03',  c: '#6AB87A', st: 'normal'      },
    null,
    null,
  ],
];

const GRADES = [
  { subj: 'Mathematik', val: '9,1', cls: 'v-excellent' },
  { subj: 'Deutsch',    val: '8,3', cls: 'v-positive'  },
  { subj: 'Englisch',   val: '7,8', cls: 'v-positive'  },
  { subj: 'Fachpraxis', val: '9,4', cls: 'v-excellent' },
  { subj: 'Religion',   val: '5,2', cls: 'v-negative'  },
];

const DISHES = [
  { name: 'Kalbsgulasch',   desc: 'Mit Eierspätzle',        tags: ['Fleisch'], imageUrl: 'https://www.kerrygold.de/wp-content/uploads/2021/11/Gulasch_Apfelrotkohl_Spa%CC%88tzle-30.jpg', stars: 4.1, count: 9 },
  { name: 'Schollenfilet',  desc: 'Mit Kräuterkartoffeln',  tags: ['Fisch'],   imageUrl: 'https://marleyspoon.com/media/recipes/47231/main_photos/large/scholle_mit_sauerampferdip_und_kartoffeln-25ec74b05c4d390296db69f0ffcf28e8.jpeg', stars: 3.6, count: 5 },
  { name: 'Vollkornnudeln', desc: 'Linsen-Gemüsesauce',     tags: ['Vegan'],   imageUrl: 'https://www.moeyskitchen.com/wp-content/uploads/2021/10/vegetarische-bolognese-sauce-7.jpg', stars: 0, count: 0 },
];

const MESSAGES = [
  { sender: 'Markus Hofer', init: 'MH', color: 'hsl(220,60%,50%)', subject: 'Mathe-Schularbeit verschoben', preview: 'Die Schularbeit von Mittwoch wird auf Freitag verschoben.', time: '08:42',   read: false, attach: true  },
  { sender: 'Eva Mair',     init: 'EM', color: 'hsl(140,60%,42%)', subject: 'Lektüre für nächste Woche',   preview: 'Bitte lest Kapitel 8–10 bis Montag.',                    time: 'Gestern', read: false, attach: false },
  { sender: 'Klaus Gruber',  init: 'KG', color: 'hsl(280,60%,50%)', subject: 'Werkzeug mitbringen',    preview: 'Denkt daran, morgen das Werkzeug mitzubringen.',  time: 'Di',  read: true,  attach: false },
  { sender: 'Thomas Berger', init: 'TB', color: 'hsl(20,60%,50%)',  subject: 'Ausflug nächste Woche', preview: 'Bitte um 8:00 Uhr am Haupteingang sein.',           time: 'Mo',  read: true,  attach: false },
];

const ABS_ENTRIES = [
  { date: '05.04.25', time: '07:50 – 09:30', subj: 'Mathematik', hours: 2, excused: false },
  { date: '17.03.25', time: '08:40 – 12:15', subj: 'Deutsch',    hours: 4, excused: true  },
];

const REMINDERS = [
  { title: 'Englisch Referat',   body: 'Präsentation fertig machen', time: 'Fällig',      date: 'Mi, 30. Apr · 08:00', creator: 'K.Pichler', overdue: true  },
  { title: 'Mathe Schularbeit',  body: 'Kapitel 5–7 wiederholen',    time: 'in 2 Tagen',  date: 'Fr, 2. Mai · 08:00',  creator: 'L.Hofer',   overdue: false },
];

const COMPARE = [
  { title:'Stundenplan',   sub:'Live aus WebUntis.',       rd:0,   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg> },
  { title:'Noten',         sub:'Schnitt automatisch.',     rd:60,  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 20V10M12 20V4M19 20v-7"/></svg> },
  { title:'Mensa',         sub:'Menü & Bewertungen.',        rd:120, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 11h16l-1.5 9h-13z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> },
  { title:'Vertretungen',  sub:'Sofort sichtbar.',         rd:180, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a9 9 0 1 1-3.6-7.2L21 7"/><path d="M21 3v4h-4"/></svg> },
  { title:'Nachrichten',   sub:'Mit Anhängen.',            rd:0,   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg> },
  { title:'Abwesenheiten', sub:'Quote im Blick.',          rd:60,  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M16 11l6 6M22 11l-6 6"/></svg> },
  { title:'Erinnerungen',  sub:'Klassenweit, in Echtzeit.',rd:120, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg> },
  { title:'Todos',         sub:'Auf allen Geräten.',       rd:180, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/></svg> },
];

function GhIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2C6.5 7.4 6.1 6.1 6.6 4.4c0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.5 1.7.1 3 .1 3.3.7.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
    </svg>
  );
}

function reveal(td: number) {
  return { style: { transitionDelay: `${td}ms` } };
}

export default function LandingClient() {
  const phoneStageRef = useRef<HTMLDivElement>(null);
  // Scroll progress for Three.js — updated on scroll, never triggers re-render
  const progressRef   = useRef<number>(0);
  // Three.js scene only renders after browser is idle (after LCP is done)
  const [sceneReady, setSceneReady] = useState(false);
  // Metamask-style page loader — visible from first paint, dismissed when the
  // 3D scene's first frame with the model has rendered (or after a hard 2.5s cap).
  const [pageLoading, setPageLoading]             = useState(true);
  const [pageLoaderExiting, setPageLoaderExiting] = useState(false);
  const [sceneFirstFrame, setSceneFirstFrame]     = useState(false);
  const loaderStartRef                            = useRef<number>(0);

  /* Drive the loader exit:
       - prefer the worker's "ready" message (real users → exits the moment the
         iPhone is actually rendered)
       - cap at 2.5s so slow connections / Lighthouse don't see a perma-loader
       - guarantee a 1.1s minimum so the fold-in animation always lands cleanly */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!loaderStartRef.current) loaderStartRef.current = Date.now();

    const MIN_MS = 1200;
    const MAX_MS = 3000;
    const EXIT_DURATION_MS = 600;

    const elapsed = Date.now() - loaderStartRef.current;
    const wait = sceneFirstFrame
      ? Math.max(0, MIN_MS - elapsed)
      : Math.max(0, MAX_MS - elapsed);

    const exitT   = window.setTimeout(() => setPageLoaderExiting(true), wait);
    const removeT = window.setTimeout(() => setPageLoading(false),       wait + EXIT_DURATION_MS);
    return () => { clearTimeout(exitT); clearTimeout(removeT); };
  }, [sceneFirstFrame]);

  /* Kick off chunk + asset prefetch immediately, but **delay** mounting the 3D
     scene until after the unfold-in animation has played. Mounting earlier causes
     visible jank — buildScreenCanvas() blocks the main thread for ~30ms and the
     worker's WebGL/PMREM init pushes GPU commands that contend with the
     compositor running the unfold animation. */
  useEffect(() => {
    (IPhoneScene as any).preload?.();
    const assets = [
      '/models/iphone.glb',
      '/draco/gltf/draco_wasm_wrapper.js',
      '/draco/gltf/draco_decoder.wasm',
    ];
    for (const url of assets) {
      fetch(url, { priority: 'low' } as RequestInit).catch(() => {});
    }
    // Mount the scene after the origami unfold has fully landed (~750ms).
    const t = setTimeout(() => setSceneReady(true), 750);
    return () => clearTimeout(t);
  }, []);

  /* Lock the body scroll while the loader is up. Using a class on <html> means
     it works whether or not the loader is in the DOM yet. */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (pageLoading) root.classList.add('lp-loading');
    else             root.classList.remove('lp-loading');
    return () => root.classList.remove('lp-loading');
  }, [pageLoading]);

  /* Scroll-driven reveal for section cards */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.lp-reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Scroll progress → progressRef (read by Three.js useFrame each tick) */
  useEffect(() => {
    const stage = phoneStageRef.current;
    if (!stage) return;

    function update() {
      const { top, height } = stage!.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when stage enters from bottom, 1 when stage has scrolled fully through
      // Using stage height as scroll distance → full 360° over the whole stage
      progressRef.current = Math.max(0, Math.min(1, (vh - top) / (height * 0.9)));
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="lp-root">

      {/* ── PAGE LOADER ── (overlay, exits when 3D scene's first frame is rendered) */}
      {pageLoading && (
        <div className={`lp-page-loader${pageLoaderExiting ? ' is-exiting' : ''}`} role="status" aria-label="POKYH lädt">
          <div className="lp-page-loader-name" aria-hidden="true">
            {['P','O','K','Y','H'].map((c, i) => {
              // Distance from center letter — drives the inside-out unfold stagger
              const d = Math.abs(i - 2);
              return (
                <span key={i} style={{ ['--d' as string]: d } as React.CSSProperties}>{c}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-brand">
            <span className="lp-nav-logo" style={{ padding: 0, overflow: 'hidden' }}>
              <Image src="/POKYH_Logo.png" alt="" aria-hidden width={28} height={28} style={{ display: 'block', objectFit: 'contain' }} />
            </span>
            POKYH
          </Link>
          <div className="lp-nav-links">
            <a href="#funktionen" className="lp-nav-link">Funktionen</a>
            <a href="#login-info"  className="lp-nav-link">Login</a>
            <Link href="/login"   className="lp-nav-cta">Anmelden</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="lp-hero">

        {/* Text zone — fills first viewport so phone is always below the fold */}
        <div className="lp-hero-text">
          <div className="lp-hero-eyebrow">POKYH</div>
          <h1 className="lp-hero-h1">
            Deine Schule.<br />Übersichtlich.
          </h1>
          <p className="lp-hero-sub">
            Stundenplan, Noten, Mensa und mehr — für alle Schüler der LBS Brixen.{' '}
            <strong>Anmeldung mit deinem WebUntis‑Account.</strong>
          </p>
          <div className="lp-hero-actions">
            <Link href="/login"    className="lp-alink">Jetzt anmelden</Link>
            <a    href="#funktionen" className="lp-alink">Alle Funktionen</a>
          </div>
          {/* Scroll cue */}
          <div className="lp-scroll-hint" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
        </div>

        {/* Atmospheric glow — sits behind the phone */}
        <div className="lp-hero-glow" aria-hidden="true" />

        {/* Three.js iPhone — mounted while the page loader is still on screen.
            onReady fires after the worker renders the first frame containing the model,
            which is the signal LandingClient uses to fade the loader out. */}
        <div className="lp-phone-stage" ref={phoneStageRef}>
          {sceneReady
            ? <IPhoneScene progressRef={progressRef} className="lp-phone-canvas" onReady={() => setSceneFirstFrame(true)} />
            : <div className="lp-phone-canvas lp-phone-skeleton" aria-hidden="true" />
          }
        </div>
      </header>

      {/* ── TILES ── */}
      <section className="lp-tiles-section" id="funktionen">
        <div className="lp-tiles">

          {/* Stundenplan */}
          <article className="lp-tile lp-tile-a tall">
            <div className="lp-tile-eyebrow lp-reveal">Stundenplan</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Die Woche.<br />Auf einen Blick.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Tages‑ und Wochenansicht. Vertretungen und Entfall sind sofort erkennbar.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-tt">
                {/* Day headers */}
                <div className="lp-wk-hd">
                  <div className="lp-wk-corner" />
                  {WEEK_DAYS.map((d) => (
                    <div key={d.abbr} className="lp-wk-hd-day">
                      <span className="lp-wk-hd-abbr">{d.abbr}</span>
                      <span className={`lp-wk-hd-num${d.isToday ? ' is-today' : ''}`}>{d.num}</span>
                    </div>
                  ))}
                </div>
                {/* Grid */}
                <div className="lp-wk-body">
                  {WEEK_TIMES.map((time, pi) => (
                    time === 'pause' ? (
                      <div key="pause" className="lp-wk-pause" />
                    ) : (
                    <div key={pi} className="lp-wk-row">
                      <div className="lp-wk-time">{time}</div>
                      {(WEEK_GRID[pi] as Array<{ s: string; t: string; oldT?: string; r: string; c: string; st: string } | null>).map((lesson, di) => (
                        <div key={di} className="lp-wk-slot">
                          {lesson && (
                            <div className={`lp-wk-cell lp-wk-cell-${lesson.st}`}>
                              <div className="lp-wk-cbar" style={{ background: lesson.st === 'cancelled' ? '#ef4444' : lesson.st === 'replacement' ? '#f97316' : lesson.st === 'exam' ? '#FFD60A' : lesson.c }} />
                              <div className="lp-wk-cbody">
                                <div className={`lp-wk-csubj${lesson.st === 'cancelled' ? ' is-struck' : ''}`}>{lesson.s}</div>
                                {lesson.st === 'replacement' && lesson.oldT ? (
                                  <div className="lp-wk-cmeta lp-wk-cmeta-repl">
                                    <span style={{ color: 'color-mix(in srgb, #ef4444 70%, #a0a0b4)', textDecoration: 'line-through', textDecorationColor: '#ef4444', textDecorationThickness: '1.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>{lesson.oldT}</span>
                                    <span style={{ color: 'var(--app-text-secondary)', flexShrink: 0 }}>»</span>
                                    <span style={{ color: '#f97316', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.t}</span>
                                  </div>
                                ) : (
                                  <div className="lp-wk-cmeta">{lesson.t}</div>
                                )}
                                <div className="lp-wk-cmeta">{lesson.r}</div>
                              </div>
                              {lesson.st === 'cancelled' && (
                                <span className="lp-wk-cicon">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </span>
                              )}
                              {lesson.st === 'replacement' && (
                                <span className="lp-wk-cicon">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/></svg>
                                </span>
                              )}
                              {lesson.st === 'exam' && (
                                <span className="lp-wk-cicon">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,159,10,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    )))}
                </div>
              </div>
            </div>
          </article>

          {/* Noten */}
          <article className="lp-tile lp-tile-b tall">
            <div className="lp-tile-eyebrow lp-reveal">Noten &amp; Schnitt</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Dein Durchschnitt.<br />Immer aktuell.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Alle Noten nach Fach. Gesamtschnitt automatisch berechnet — auf zwei Dezimalstellen.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-grade-dash">
                {/* KPI row */}
                <div className="lp-gd-kpis">
                  {/* Average + Sparkline */}
                  <div className="lp-gd-card">
                    <div className="lp-gd-card-hd">
                      <div>
                        <div className="lp-gd-title">Durchschnitt</div>
                        <div className="lp-gd-sub">Alle Fächer</div>
                      </div>
                      <span className="lp-gd-pill up">↗ 0,18</span>
                    </div>
                    <div className="lp-gd-value" style={{ color: '#10b981' }}>8,42</div>
                    <div className="lp-gd-spark-wrap">
                      <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="lp-gd-spark" style={{ color: '#10b981' }}>
                        <defs>
                          <linearGradient id="lpsg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,38.3 L28.6,33.5 L57.1,28.4 L85.7,32.4 L114.3,26.5 L142.9,24.5 L171.4,23.3 L200,21.7 L200,60 L0,60 Z" fill="url(#lpsg)" />
                        <path d="M0,38.3 L28.6,33.5 L57.1,28.4 L85.7,32.4 L114.3,26.5 L142.9,24.5 L171.4,23.3 L200,21.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                        {[[0,38.3],[28.6,33.5],[57.1,28.4],[85.7,32.4],[114.3,26.5],[142.9,24.5],[171.4,23.3],[200,21.7]].map(([x, y], i) => (
                          <circle key={i} cx={x} cy={y} r="2" fill="currentColor" opacity="0.45" />
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* Ratio */}
                  <div className="lp-gd-card">
                    <div className="lp-gd-card-hd">
                      <div>
                        <div className="lp-gd-title">Verhältnis</div>
                        <div className="lp-gd-sub">Positiv · Negativ</div>
                      </div>
                      <span className="lp-gd-pill">80 %</span>
                    </div>
                    <div className="lp-gd-ratio">
                      <span className="lp-gd-ratio-pos">4</span>
                      <span className="lp-gd-ratio-sep">/</span>
                      <span className="lp-gd-ratio-neg">1</span>
                    </div>
                    <div className="lp-gd-ratio-bar">
                      <div className="lp-gd-ratio-p" style={{ width: '80%' }} />
                      <div className="lp-gd-ratio-n" style={{ width: '20%' }} />
                    </div>
                    <div className="lp-gd-foot">
                      <span className="lp-gd-good">4 über 6,0</span>
                      <span className="lp-gd-bad">1 unter 6,0</span>
                    </div>
                  </div>
                </div>

                {/* Subject list */}
                <div className="lp-gd-subjects">
                  {GRADES.map(({ subj, val, cls }, i) => (
                    <div className="lp-gd-row" key={subj} style={{ borderTop: i > 0 ? '1px solid var(--lp-card-border)' : 'none', background: i % 2 === 0 ? 'var(--lp-gd-alt)' : 'transparent' }}>
                      <div className="lp-gd-row-left">
                        <span className="lp-gd-subj">{subj}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`lp-gd-val ${cls}`}>{val}</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Mensa */}
          <article className="lp-tile lp-tile-c">
            <div className="lp-tile-eyebrow lp-reveal">Mensa</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Was gibt's heute?</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Tagesmenü mit Bewertungen und Allergenen — direkt im Klassenzimmer.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-mensa">
                {DISHES.map((d) => (
                  <div className="lp-mm-dish" key={d.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="lp-mm-thumb" src={d.imageUrl} alt={d.name} loading="lazy" width="100" height="100" decoding="async" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                    <div className="lp-mm-content">
                      <div>
                        <div className="lp-mm-dish-name">{d.name}</div>
                        {d.desc && <div className="lp-mm-dish-desc">{d.desc}</div>}
                      </div>
                      <div className="lp-mm-dish-bottom">
                        <div className="lp-mm-stars">
                          {[1,2,3,4,5].map((s) => (
                            <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={d.stars > 0 && s <= Math.round(d.stars) ? '#FFD60A' : 'none'} stroke={d.stars > 0 && s <= Math.round(d.stars) ? '#FFD60A' : 'rgba(128,128,128,0.45)'} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          ))}
                          {d.stars > 0 ? (
                            <><span className="lp-mm-stars-val">{d.stars.toFixed(1)}</span><span className="lp-mm-stars-ct">({d.count})</span></>
                          ) : (
                            <span className="lp-mm-no-rating">Keine Bewertung</span>
                          )}
                        </div>
                        <div className="lp-mm-tags">
                          {d.tags.map((tag) => (
                            <span key={tag} className={`lp-mm-tag lp-mm-tag-${tag.toLowerCase()}`}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Nachrichten */}
          <article className="lp-tile lp-tile-a">
            <div className="lp-tile-eyebrow lp-reveal">Nachrichten</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Direkt aus<br />WebUntis.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Mit Anhang‑Vorschau und klickbaren Links.</p>
            <div className="lp-tile-visual lp-reveal" style={{ alignItems: 'center', transitionDelay: '180ms' }}>
              <div className="lp-mock-msg">
                {MESSAGES.map((m, i) => (
                  <div className="lp-msg-item" key={m.sender} style={{ borderTop: i > 0 ? '1px solid var(--lp-card-border)' : 'none' }}>
                    <div className="lp-msg-av-wrap">
                      <div className="lp-msg-avatar" style={{ background: m.color }}>{m.init}</div>
                      {!m.read && <div className="lp-msg-dot" />}
                    </div>
                    <div className="lp-msg-content">
                      <div className="lp-msg-top">
                        <span className="lp-msg-subject" style={{ fontWeight: m.read ? 400 : 700 }}>{m.subject}</span>
                        <span className="lp-msg-time">{m.time}</span>
                      </div>
                      <div className="lp-msg-bottom">
                        <span className="lp-msg-preview" style={{ fontWeight: m.read ? 400 : 500 }}>
                          {m.sender} · {m.preview}
                        </span>
                        {m.attach && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Abwesenheiten */}
          <article className="lp-tile lp-tile-d">
            <div className="lp-tile-eyebrow lp-reveal">Abwesenheiten</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Fehlstunden.<br />Pro Monat.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Entschuldigt, unentschuldigt und Quote im Schuljahr.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-abs">
                <div className="lp-abs-overview">
                  <div className="lp-abs-ov-row">
                    <div>
                      <div className="lp-abs-ov-lbl">Fehlstunden gesamt</div>
                      <div className="lp-abs-ov-total">12</div>
                    </div>
                    <div className="lp-abs-ov-split">
                      <div className="lp-abs-ov-item">
                        <div className="lp-abs-ov-num exc">10</div>
                        <div className="lp-abs-ov-sub">Entschuldigt</div>
                      </div>
                      <div className="lp-abs-ov-item">
                        <div className="lp-abs-ov-num unexc">2</div>
                        <div className="lp-abs-ov-sub">Unentschuldigt</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="lp-abs-rate-hd">
                      <span className="lp-abs-rate-lbl">Fehlquote</span>
                      <span className="lp-abs-rate-pct" style={{ color: '#30D158' }}>3,1%</span>
                    </div>
                    <div className="lp-abs-rate-bar">
                      <div className="lp-abs-rate-fill" style={{ width: '3.1%', background: '#30D158' }} />
                    </div>
                  </div>
                </div>
                <div className="lp-abs-group-hd">
                  <span className="lp-abs-group-label">Apr 2025</span>
                  <span className="lp-abs-group-hrs">4 Std.</span>
                </div>
                {ABS_ENTRIES.map((e, i) => (
                  <div className="lp-abs-entry" key={i}>
                    <div className="lp-abs-entry-left">
                      <div className="lp-abs-entry-date">{e.date}</div>
                      <div className="lp-abs-entry-meta">{e.time} · {e.subj}</div>
                    </div>
                    <div className="lp-abs-entry-right">
                      <span className="lp-abs-entry-hrs">{e.hours}h</span>
                      {e.excused ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Erinnerungen & Todos */}
          <article className="lp-tile lp-tile-b">
            <div className="lp-tile-eyebrow lp-reveal">Erinnerungen &amp; Todos</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Nichts mehr<br />vergessen.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Klassenweite Erinnerungen für Prüfungen — und persönliche Todos für dich.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-rem">
                <div className="lp-rem-sect-label" style={{ color: '#FF3B30' }}>FÄLLIG</div>
                {REMINDERS.filter((r) => r.overdue).map((r) => (
                  <div key={r.title} className="lp-rem-card" style={{ border: '1px solid rgba(255,59,48,0.22)' }}>
                    <div className="lp-rem-bell" style={{ background: 'rgba(255,59,48,0.13)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg>
                    </div>
                    <div className="lp-rem-body">
                      <div className="lp-rem-title">{r.title}</div>
                      <div className="lp-rem-desc">{r.body}</div>
                      <div className="lp-rem-time" style={{ color: '#FF3B30' }}>{r.time} · {r.date}</div>
                      <div className="lp-rem-creator">von {r.creator}</div>
                    </div>
                  </div>
                ))}
                <div className="lp-rem-sect-label" style={{ color: 'var(--app-text-secondary)', marginTop: 6 }}>KOMMEND</div>
                {REMINDERS.filter((r) => !r.overdue).map((r) => (
                  <div key={r.title} className="lp-rem-card">
                    <div className="lp-rem-bell" style={{ background: 'rgba(255,159,10,0.13)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg>
                    </div>
                    <div className="lp-rem-body">
                      <div className="lp-rem-title">{r.title}</div>
                      <div className="lp-rem-desc">{r.body}</div>
                      <div className="lp-rem-time">{r.time} · {r.date}</div>
                      <div className="lp-rem-creator">von {r.creator}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

        </div>
      </section>

      {/* ── COMPARE ── */}
      <section className="lp-compare" aria-label="Funktionsübersicht">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="lp-h2 lp-reveal" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>
            Alles. An einem Ort.
          </h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 520, margin: '12px auto 0', transitionDelay: '80ms' }}>
            Alle Schulinformationen, die du täglich brauchst – schneller und übersichtlicher als je zuvor.
          </p>
        </div>
        <div className="lp-compare-grid">
          {COMPARE.map(({ title, sub, icon, rd }) => (
            <div className="lp-compare-cell lp-reveal" style={{ transitionDelay: `${rd}ms` }} key={title}>
              <div className="lp-compare-icon">{icon}</div>
              <div className="lp-compare-title">{title}</div>
              <div className="lp-compare-sub">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="lp-steps" id="login-info">
        <div className="lp-steps-head">
          <div className="lp-eyebrow lp-reveal" style={{ marginBottom: 8 }}>Anmeldung</div>
          <h2 className="lp-h2 lp-reveal" {...reveal(80)}>In 30&nbsp;Sekunden eingeloggt.</h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 560, margin: '18px auto 0', transitionDelay: '160ms' }}>
            POKYH nutzt deinen{' '}
            <strong style={{ color: 'var(--app-text-primary)', fontWeight: 500 }}>WebUntis‑Account</strong>
            {' '}— denselben, mit dem du dich auch in der WebUntis‑App anmeldest. Kein neues Passwort, keine Registrierung.
          </p>
        </div>
        <div className="lp-steps-grid">
          {[
            { num:'01', title:'BFS Tschuggmall',   body: <><strong>Momentan</strong> wird nur das Berufsbildungszentrum <strong>„Christian Josef Tschuggmall“</strong> unterstützt.</>,                                    rd:0   },
            { num:'02', title:'WebUntis‑Login',  body: <>Gib deinen <strong>WebUntis‑Benutzernamen</strong> und dein Passwort ein — wie in der WebUntis‑App. Dein Passwort wird <strong>niemals gespeichert</strong>.</>, rd:100 },
            { num:'03', title:'Loslegen',        body: <>Stundenplan, Noten und Mensa werden <strong>automatisch geladen</strong>.</>,                          rd:200 },
          ].map(({ num, title, body, rd }) => (
            <div className="lp-step lp-reveal" style={{ transitionDelay: `${rd}ms` }} key={num}>
              <div className="lp-step-num">{num}</div>
              <div className="lp-step-title">{title}</div>
              <div className="lp-step-body">{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAKERS ── */}
      <section className="lp-makers">
        <div className="lp-makers-head">
          <div className="lp-eyebrow lp-reveal" style={{ marginBottom: 8 }}>Made by Schülern</div>
          <h2 className="lp-h2 lp-reveal" {...reveal(80)}>Von zwei aus der Klasse.</h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 520, margin: '18px auto 0', transitionDelay: '160ms' }}>
            POKYH wird in der Freizeit von zwei Schülern der LBS Brixen entwickelt — als Open‑Source‑Projekt unter der{' '}
            <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1', textDecoration: 'none' }}>
              bedchem
            </a>{' '}Organisation auf GitHub.
          </p>
        </div>
        <div className="lp-makers-grid">
          <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer" className="lp-maker lp-reveal">
            <div className="lp-maker-mono">N</div>
            <div>
              <div className="lp-maker-name">
                Nexor{' '}
                <span style={{ color: 'var(--app-text-tertiary)', fontWeight: 400 }}>· Plattnericus</span>
              </div>
              <div className="lp-maker-handle"><GhIcon />github.com/plattnericus</div>
            </div>
          </a>
          <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer" className="lp-maker lp-reveal" style={{ transitionDelay: '100ms' }}>
            <div className="lp-maker-mono">R</div>
            <div>
              <div className="lp-maker-name">Ryhox</div>
              <div className="lp-maker-handle"><GhIcon />github.com/ryhox</div>
            </div>
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta" id="login">
        <h2 className="lp-h2 lp-reveal">Bereit?</h2>
        <p className="lp-lead lp-reveal" {...reveal(80)}>
          Kostenlos. Ohne Registrierung. Mit deinem WebUntis‑Account.
        </p>
        <div className="lp-reveal" style={{ transitionDelay: '160ms', marginTop: 32, display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/login"    className="lp-btn">Mit WebUntis anmelden</Link>
          <a    href="#login-info" className="lp-alink">So funktioniert's</a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-disclaimer">
            POKYH ist ein eigenständiges Schülerprojekt und steht in keiner offiziellen Verbindung zur LBS Brixen, zum Berufsbildungszentrum Christian Josef Tschuggmall oder zu WebUntis / Untis GmbH. Die Anmeldung erfolgt über die WebUntis-Schnittstelle der LBS Brixen. Marken und Logos sind Eigentum ihrer jeweiligen Inhaber.
          </div>
          <div className="lp-footer-bar">
            <div>
              © 2026{' '}
              <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer">bedchem</a>
              {' '}· POKYH · Made by{' '}
              <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer">Plattnericus</a>
              {' '}&amp;{' '}
              <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer">Ryhox</a>
            </div>
            <div className="lp-footer-links">
              <Link href="/login">Anmelden</Link>
              <Link href="/legal">Impressum</Link>
              <Link href="/legal#datenschutz">Datenschutz</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
