'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import LoadingCover from '@/components/LoadingCover';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import WeekGrid from '@/app/[lang]/timetable/WeekGrid';
import { isoWeekNumber } from '@/app/[lang]/timetable/timetable-logic';
import type { TimetableEntry } from '@/lib/types';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { landingDict, type LandingKey } from '@/lib/i18n/dictionaries/landing';
import { rich } from '@/lib/i18n/rich';

// Three.js worker bundle + 5MB GLB — never block initial paint.
// Chunk is preloaded on idle; GLB is prefetched via fetch() before user scrolls.
const IPhoneScene = dynamic(() => import('@/components/IPhoneScene'), { ssr: false });

// Sample week rendered with the real timetable grid, so the tile always shows the
// current timetable design. A fixed week keeps server and client output identical.
const SAMPLE_MONDAY = new Date(2026, 9, 19);
const SAMPLE_DATES = Array.from({ length: 6 }, (_, i) => new Date(2026, 9, 19 + i));
const SAMPLE_DAY_NUMS = SAMPLE_DATES.map((d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
const PERIODS: Array<[number, number]> = [
  [750, 840], [840, 930], [930, 1020], [1035, 1125], [1125, 1215],
  [1215, 1305], [1315, 1405], [1405, 1455], [1505, 1555], [1555, 1645],
];

type SampleLesson = { s: string; long: string; t: string; r: string; st?: 'exam' | 'cancelled' | 'replacement'; oldT?: string; oldR?: string };
// [period][day] (Mo–Fr); null = free period. Monday and Thursday run until 16:45.
const SAMPLE_GRID: Array<Array<SampleLesson | null>> = [
  [
    { s: 'St.t.Syst.', long: 'Statistik und Systeme', t: 'No-Ve', r: 'Inf II', st: 'exam' },
    { s: 'M', long: 'Mathematik', t: 'Lu-Ka', r: 'a+1/04' },
    { s: 'BS-NT', long: 'Betriebssysteme und Netzwerke', t: 'Sa-Ro', r: 'Inf I' },
    { s: 'M', long: 'Mathematik', t: 'Lu-Ka', r: 'a+2/05' },
    { s: 'Bew.Sport', long: 'Bewegung und Sport', t: 'Mi-Tu', r: 'Tu II' },
  ],
  [
    { s: 'DB', long: 'Datenbanken', t: 'Bo-Na', r: 'Inf II' },
    { s: 'DB', long: 'Datenbanken', t: 'Bo-Na', r: 'Inf II', st: 'cancelled' },
    { s: 'BS-NT', long: 'Betriebssysteme und Netzwerke', t: 'Sa-Ro', r: 'Inf I' },
    { s: 'ENGL', long: 'Englisch', t: 'Te-Ki', r: 'c+1/11' },
    { s: 'Re-Wiku', long: 'Recht und Wirtschaftskunde', t: 'Va-No', r: 'c+1/11' },
  ],
  [
    { s: 'IKE', long: 'IKE', t: 'Zi-Ma', r: 'Inf III' },
    { s: 'GE-GL', long: 'Gesellschaftliche Grundlagen', t: 'Ra-Lu', r: 'a+2/20' },
    { s: 'BS-NT', long: 'Betriebssysteme und Netzwerke', t: 'Sa-Ro', r: 'Inf I' },
    { s: 'IT', long: 'Informationstechnologie', t: 'Jo-Se', r: 'a+2/05' },
    { s: 'ENGL', long: 'Englisch', t: 'Te-Ki', r: 'c+1/11' },
  ],
  [
    { s: 'IKE', long: 'IKE', t: 'Zi-Ma', r: 'Inf III' },
    { s: 'GE-GL', long: 'Gesellschaftliche Grundlagen', t: 'Ra-Lu', r: 'a+2/20' },
    { s: 'AE', long: 'Anwendungsentwicklung', t: 'Mo-Ke', r: 'Inf IV', st: 'replacement', oldT: 'Ke-Fo' },
    { s: 'IT', long: 'Informationstechnologie', t: 'Jo-Se', r: 'a+2/05' },
    { s: 'D', long: 'Deutsch', t: 'Ra-Lu', r: 'c+1/11' },
  ],
  [
    { s: 'IKE', long: 'IKE', t: 'Zi-Ma', r: 'Inf III' },
    { s: 'D', long: 'Deutsch', t: 'Ra-Lu', r: 'a+2/20' },
    { s: 'AE', long: 'Anwendungsentwicklung', t: 'Ke-Fo', r: 'Inf IV' },
    { s: 'R', long: 'Religion', t: 'Pe-Li', r: 'a+2/05' },
    { s: 'GE-GL', long: 'Gesellschaftliche Grundlagen', t: 'Ra-Lu', r: 'c+1/11' },
  ],
  // Afternoon: 12:15–16:45
  [null, { s: 'D', long: 'Deutsch', t: 'Ra-Lu', r: 'a+2/20' }, { s: 'AE', long: 'Anwendungsentwicklung', t: 'Ke-Fo', r: 'Inf IV' }, { s: 'R', long: 'Religion', t: 'Pe-Li', r: 'a+2/05' }, { s: 'GE-GL', long: 'Gesellschaftliche Grundlagen', t: 'Ra-Lu', r: 'c+1/11', st: 'cancelled' }],
  [{ s: 'IKE', long: 'IKE', t: 'Zi-Ma', r: 'E-Lab' }, null, null, null, null],
  [{ s: 'IKE', long: 'IKE', t: 'Zi-Ma', r: 'E-Lab' }, null, null, { s: 'BS-NT', long: 'Betriebssysteme und Netzwerke', t: 'Sa-Ro', r: 'Inf IV', st: 'replacement', oldR: 'Inf II' }, null],
  [{ s: 'IKE', long: 'IKE', t: 'Zi-Ma', r: 'E-Lab' }, null, null, { s: 'BS-NT', long: 'Betriebssysteme und Netzwerke', t: 'Sa-Ro', r: 'Inf IV', st: 'replacement', oldR: 'Inf II' }, null],
  [{ s: 'IKE', long: 'IKE', t: 'Zi-Ma', r: 'E-Lab' }, null, null, { s: 'BS-NT', long: 'Betriebssysteme und Netzwerke', t: 'Sa-Ro', r: 'Inf IV', st: 'replacement', oldR: 'Inf II' }, null],
];

const SAMPLE_WEEK: TimetableEntry[][] = SAMPLE_DAY_NUMS.map((date, day) => {
  if (day > 4) return [];

  const entries: TimetableEntry[] = [];
  let previousPeriod = -1;
  let previousKey = '';

  SAMPLE_GRID.forEach((row, periodIndex) => {
    const lesson = row[day];
    if (!lesson) {
      previousPeriod = -1;
      previousKey = '';
      return;
    }

    const lessonKey = `${lesson.s}|${lesson.long}|${lesson.t}|${lesson.r}|${lesson.st ?? ''}|${lesson.oldT ?? ''}|${lesson.oldR ?? ''}`;
    const previousEntry = entries[entries.length - 1];
    if (previousEntry && previousPeriod === periodIndex - 1 && previousKey === lessonKey) {
      previousEntry.endTime = PERIODS[periodIndex][1];
      previousPeriod = periodIndex;
      return;
    }

    const id = day * 100 + periodIndex + 1;
    entries.push({
      id,
      lessonId: id,
      date,
      startTime: PERIODS[periodIndex][0],
      endTime: PERIODS[periodIndex][1],
      subjectName: lesson.s,
      subjectLong: lesson.long,
      teacherName: lesson.t,
      roomName: lesson.r,
      cellState: lesson.st === 'cancelled' ? 'CANCEL' : lesson.st === 'replacement' ? 'SUBSTITUTION' : 'STANDARD',
      isExam: lesson.st === 'exam',
      isCancelled: lesson.st === 'cancelled',
      isSubstitution: lesson.st === 'replacement',
      isAdditional: false,
      ...(lesson.st === 'exam' ? { icons: ['EXAM'] } : {}),
      ...(lesson.oldT ? { originalTeacher: lesson.oldT, addedTeachers: [lesson.t] } : {}),
      ...(lesson.oldR ? { originalRoom: lesson.oldR, addedRooms: [lesson.r] } : {}),
    } satisfies TimetableEntry);
    previousPeriod = periodIndex;
    previousKey = lessonKey;
  });

  return entries;
});

const GRADES: Array<{ subj: LandingKey; val: string; cls: string }> = [
  { subj: 'subjMath',     val: '9,1', cls: 'v-excellent' },
  { subj: 'subjGerman',   val: '8,3', cls: 'v-positive'  },
  { subj: 'subjEnglish',  val: '7,8', cls: 'v-positive'  },
  { subj: 'subjPractice', val: '9,4', cls: 'v-excellent' },
  { subj: 'subjReligion', val: '5,2', cls: 'v-negative'  },
];

// `cls` picks the tag colour in landing.css; the label is translated.
const DISHES: Array<{ name: LandingKey; desc: LandingKey; tags: Array<{ cls: string; label: LandingKey }>; imageUrl: string; stars: number; count: number }> = [
  { name: 'dish1', desc: 'dish1Desc', tags: [{ cls: 'fleisch', label: 'tagMeat' }], imageUrl: 'https://www.kerrygold.de/wp-content/uploads/2021/11/Gulasch_Apfelrotkohl_Spa%CC%88tzle-30.jpg', stars: 4.1, count: 9 },
  { name: 'dish2', desc: 'dish2Desc', tags: [{ cls: 'fisch', label: 'tagFish' }],   imageUrl: 'https://marleyspoon.com/media/recipes/47231/main_photos/large/scholle_mit_sauerampferdip_und_kartoffeln-25ec74b05c4d390296db69f0ffcf28e8.jpeg', stars: 3.6, count: 5 },
  { name: 'dish3', desc: 'dish3Desc', tags: [{ cls: 'vegan', label: 'tagVegan' }],   imageUrl: 'https://www.moeyskitchen.com/wp-content/uploads/2021/10/vegetarische-bolognese-sauce-7.jpg', stars: 0, count: 0 },
];

// `time` is either a clock time or a translation key.
const MESSAGES: Array<{ sender: string; init: string; color: string; subject: LandingKey; preview: LandingKey; time: string | LandingKey; read: boolean; attach: boolean }> = [
  { sender: 'Markus Hofer',  init: 'MH', color: 'hsl(220,60%,50%)', subject: 'msg1Subject', preview: 'msg1Preview', time: '08:42',     read: false, attach: true  },
  { sender: 'Eva Mair',      init: 'EM', color: 'hsl(140,60%,42%)', subject: 'msg2Subject', preview: 'msg2Preview', time: 'yesterday', read: false, attach: false },
  { sender: 'Klaus Gruber',  init: 'KG', color: 'hsl(280,60%,50%)', subject: 'msg3Subject', preview: 'msg3Preview', time: 'dayTue',    read: true,  attach: false },
  { sender: 'Thomas Berger', init: 'TB', color: 'hsl(20,60%,50%)',  subject: 'msg4Subject', preview: 'msg4Preview', time: 'dayMon',    read: true,  attach: false },
];

const ABS_ENTRIES: Array<{ date: string; time: string; subj: LandingKey; hours: number; excused: boolean }> = [
  { date: '05.04.25', time: '07:50 – 09:30', subj: 'subjMath',   hours: 2, excused: false },
  { date: '17.03.25', time: '08:40 – 12:15', subj: 'subjGerman', hours: 4, excused: true  },
];

const REMINDERS: Array<{ title: LandingKey; body: LandingKey; time: LandingKey; date: LandingKey; creator: string; overdue: boolean }> = [
  { title: 'rm1Title', body: 'rm1Body', time: 'rm1Time', date: 'rm1Date', creator: 'K.Pichler', overdue: true  },
  { title: 'rm2Title', body: 'rm2Body', time: 'rm2Time', date: 'rm2Date', creator: 'L.Hofer',   overdue: false },
];

const COMPARE: Array<{ title: LandingKey; sub: LandingKey; rd: number; icon: React.ReactNode }> = [
  { title:'cTimetable', sub:'cTimetableSub', rd:0,   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg> },
  { title:'cGrades',    sub:'cGradesSub',    rd:60,  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 20V10M12 20V4M19 20v-7"/></svg> },
  { title:'cMensa',     sub:'cMensaSub',     rd:120, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 11h16l-1.5 9h-13z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> },
  { title:'cSubst',     sub:'cSubstSub',     rd:180, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a9 9 0 1 1-3.6-7.2L21 7"/><path d="M21 3v4h-4"/></svg> },
  { title:'cMessages',  sub:'cMessagesSub',  rd:0,   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg> },
  { title:'cAbsences',  sub:'cAbsencesSub',  rd:60,  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M16 11l6 6M22 11l-6 6"/></svg> },
  { title:'cReminders', sub:'cRemindersSub', rd:120, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg> },
  { title:'cTodos',     sub:'cTodosSub',     rd:180, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/></svg> },
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
  const t = useT(landingDict);
  const localize = useLocalizeHref();
  const phoneStageRef   = useRef<HTMLDivElement>(null);
  // Scroll progress for Three.js — updated on scroll, never triggers re-render
  const progressRef     = useRef<number>(0);
  // GLB download progress (0→1) — written by IPhoneScene, read by LoadingCover each rAF
  const glbProgressRef  = useRef<number>(0);
  // Three.js scene only renders after browser is idle (after LCP is done)
  const [sceneReady, setSceneReady] = useState(false);
  // Tile-cover loader — dismissed when the 3D scene's first frame with the model renders
  const [pageLoading, setPageLoading]         = useState(true);
  const [sceneFirstFrame, setSceneFirstFrame] = useState(false);


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
      '/models/white.webp',
      '/models/dark.webp',
    ];
    for (const url of assets) {
      fetch(url, { priority: 'low' } as RequestInit).catch(() => {});
    }
    // Mount the scene after the origami unfold has fully landed (~750ms).
    const t = setTimeout(() => setSceneReady(true), 750);
    // Safety net: if onReady never fires (WebGL unavailable, worker crash, slow load),
    // force the loader to dismiss after 8 s so scroll is never permanently locked.
    const fallback = setTimeout(() => setSceneFirstFrame(true), 8000);
    return () => { clearTimeout(t); clearTimeout(fallback); };
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

      {/* ── PAGE LOADER ── tile-cover animation; exits when iPhone first frame renders */}
      {pageLoading && (
        <LoadingCover
          glbProgressRef={glbProgressRef}
          sceneReady={sceneFirstFrame}
          onDone={() => setPageLoading(false)}
        />
      )}

      {/* ── NAV ── */}
      <LandingNav />

      {/* ── HERO ── */}
      <header className="lp-hero">

        {/* Text zone — fills first viewport so phone is always below the fold */}
        <div className="lp-hero-text">
          <div className="lp-hero-eyebrow">POKYH</div>
          <h1 className="lp-hero-h1">
            {t('heroTitle1')}<br />{t('heroTitle2')}
          </h1>
          <p className="lp-hero-sub">
            {t('heroSub')}{' '}
            <strong>{t('heroSubStrong')}</strong>
          </p>
          <div className="lp-hero-actions">
            <Link href={localize('/login')} className="lp-alink">{t('loginNow')}</Link>
            <a    href="#funktionen" className="lp-alink">{t('allFeatures')}</a>
          </div>
          <Link href={localize('/mensa')} className="lp-hero-mensa">
            <strong>{t('mensaQuestion')}</strong>
            <span className="lp-hero-mensa-sub"> {t('mensaNoLogin')}</span>
            <span className="lp-hero-mensa-arrow" aria-hidden="true">›</span>
          </Link>
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
            ? <IPhoneScene progressRef={progressRef} className="lp-phone-canvas" onReady={() => setSceneFirstFrame(true)} onGlbProgress={(v) => { glbProgressRef.current = v; }} />
            : <div className="lp-phone-canvas lp-phone-skeleton" aria-hidden="true" />
          }
        </div>
      </header>

      {/* ── TILES ── */}
      <section className="lp-tiles-section" id="funktionen">
        <div className="lp-tiles">

          {/* Stundenplan */}
          <article className="lp-tile lp-tile-a tall">
            <div className="lp-tile-eyebrow lp-reveal">{t('ttEyebrow')}</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>{t('ttTitle1')}<br />{t('ttTitle2')}</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>{t('ttSub')}</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-tt">
                <WeekGrid
                  dayEntries={SAMPLE_WEEK}
                  dates={SAMPLE_DATES}
                  dayNums={SAMPLE_DAY_NUMS}
                  todayNum={SAMPLE_DAY_NUMS[0]}
                  weekNumber={isoWeekNumber(SAMPLE_MONDAY)}
                  minute={-1}
                  scale={0.8}
                  onTap={() => {}}
                />
              </div>
            </div>
          </article>

          {/* Noten */}
          <article className="lp-tile lp-tile-b tall">
            <div className="lp-tile-eyebrow lp-reveal">{t('grEyebrow')}</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>{t('grTitle1')}<br />{t('grTitle2')}</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>{t('grSub')}</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-grade-dash">
                {/* KPI row */}
                <div className="lp-gd-kpis">
                  {/* Average + Sparkline */}
                  <div className="lp-gd-card">
                    <div className="lp-gd-card-hd">
                      <div>
                        <div className="lp-gd-title">{t('grAverage')}</div>
                        <div className="lp-gd-sub">{t('grAllSubjects')}</div>
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
                        <div className="lp-gd-title">{t('grRatio')}</div>
                        <div className="lp-gd-sub">{t('grPosNeg')}</div>
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
                      <span className="lp-gd-good">{t('grAbove')}</span>
                      <span className="lp-gd-bad">{t('grBelow')}</span>
                    </div>
                  </div>
                </div>

                {/* Subject list */}
                <div className="lp-gd-subjects">
                  {GRADES.map(({ subj, val, cls }, i) => (
                    <div className="lp-gd-row" key={subj} style={{ borderTop: i > 0 ? '1px solid var(--lp-card-border)' : 'none', background: i % 2 === 0 ? 'var(--lp-gd-alt)' : 'transparent' }}>
                      <div className="lp-gd-row-left">
                        <span className="lp-gd-subj">{t(subj)}</span>
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
            <div className="lp-tile-eyebrow lp-reveal">{t('mnEyebrow')}</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>{t('mnTitle')}</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>{t('mnSub')}</p>
            <div className="lp-tile-link lp-reveal" {...reveal(150)}>
              <Link href={localize('/mensa')} className="lp-alink">{t('mnLink')}</Link>
            </div>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-mensa">
                {DISHES.map((d) => (
                  <div className="lp-mm-dish" key={d.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="lp-mm-thumb" src={d.imageUrl} alt={t(d.name)} loading="lazy" width="100" height="100" decoding="async" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                    <div className="lp-mm-content">
                      <div>
                        <div className="lp-mm-dish-name">{t(d.name)}</div>
                        {d.desc && <div className="lp-mm-dish-desc">{t(d.desc)}</div>}
                      </div>
                      <div className="lp-mm-dish-bottom">
                        <div className="lp-mm-stars">
                          {[1,2,3,4,5].map((s) => (
                            <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={d.stars > 0 && s <= Math.round(d.stars) ? '#FFD60A' : 'none'} stroke={d.stars > 0 && s <= Math.round(d.stars) ? '#FFD60A' : 'rgba(128,128,128,0.45)'} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          ))}
                          {d.stars > 0 ? (
                            <><span className="lp-mm-stars-val">{d.stars.toFixed(1)}</span><span className="lp-mm-stars-ct">({d.count})</span></>
                          ) : (
                            <span className="lp-mm-no-rating">{t('mnNoRating')}</span>
                          )}
                        </div>
                        <div className="lp-mm-tags">
                          {d.tags.map((tag) => (
                            <span key={tag.cls} className={`lp-mm-tag lp-mm-tag-${tag.cls}`}>{t(tag.label)}</span>
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
            <div className="lp-tile-eyebrow lp-reveal">{t('msEyebrow')}</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>{t('msTitle1')}<br />{t('msTitle2')}</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>{t('msSub')}</p>
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
                        <span className="lp-msg-subject" style={{ fontWeight: m.read ? 400 : 700 }}>{t(m.subject)}</span>
                        <span className="lp-msg-time">{/^\d/.test(m.time) ? m.time : t(m.time as LandingKey)}</span>
                      </div>
                      <div className="lp-msg-bottom">
                        <span className="lp-msg-preview" style={{ fontWeight: m.read ? 400 : 500 }}>
                          {m.sender} · {t(m.preview)}
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
            <div className="lp-tile-eyebrow lp-reveal">{t('abEyebrow')}</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>{t('abTitle1')}<br />{t('abTitle2')}</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>{t('abSub')}</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-abs">
                <div className="lp-abs-overview">
                  <div className="lp-abs-ov-row">
                    <div>
                      <div className="lp-abs-ov-lbl">{t('abTotal')}</div>
                      <div className="lp-abs-ov-total">12</div>
                    </div>
                    <div className="lp-abs-ov-split">
                      <div className="lp-abs-ov-item">
                        <div className="lp-abs-ov-num exc">10</div>
                        <div className="lp-abs-ov-sub">{t('abExcused')}</div>
                      </div>
                      <div className="lp-abs-ov-item">
                        <div className="lp-abs-ov-num unexc">2</div>
                        <div className="lp-abs-ov-sub">{t('abUnexcused')}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="lp-abs-rate-hd">
                      <span className="lp-abs-rate-lbl">{t('abRate')}</span>
                      <span className="lp-abs-rate-pct" style={{ color: '#30D158' }}>3,1%</span>
                    </div>
                    <div className="lp-abs-rate-bar">
                      <div className="lp-abs-rate-fill" style={{ width: '3.1%', background: '#30D158' }} />
                    </div>
                  </div>
                </div>
                <div className="lp-abs-group-hd">
                  <span className="lp-abs-group-label">{t('abMonth')}</span>
                  <span className="lp-abs-group-hrs">{t('abHours')}</span>
                </div>
                {ABS_ENTRIES.map((e, i) => (
                  <div className="lp-abs-entry" key={i}>
                    <div className="lp-abs-entry-left">
                      <div className="lp-abs-entry-date">{e.date}</div>
                      <div className="lp-abs-entry-meta">{e.time} · {t(e.subj)}</div>
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
            <div className="lp-tile-eyebrow lp-reveal">{t('rmEyebrow')}</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>{t('rmTitle1')}<br />{t('rmTitle2')}</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>{t('rmSub')}</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-rem">
                <div className="lp-rem-sect-label" style={{ color: '#FF3B30' }}>{t('rmDue')}</div>
                {REMINDERS.filter((r) => r.overdue).map((r) => (
                  <div key={r.title} className="lp-rem-card" style={{ border: '1px solid rgba(255,59,48,0.22)' }}>
                    <div className="lp-rem-bell" style={{ background: 'rgba(255,59,48,0.13)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg>
                    </div>
                    <div className="lp-rem-body">
                      <div className="lp-rem-title">{t(r.title)}</div>
                      <div className="lp-rem-desc">{t(r.body)}</div>
                      <div className="lp-rem-time" style={{ color: '#FF3B30' }}>{t(r.time)} · {t(r.date)}</div>
                      <div className="lp-rem-creator">{t('by', { name: r.creator })}</div>
                    </div>
                  </div>
                ))}
                <div className="lp-rem-sect-label" style={{ color: 'var(--app-text-secondary)', marginTop: 6 }}>{t('rmUpcoming')}</div>
                {REMINDERS.filter((r) => !r.overdue).map((r) => (
                  <div key={r.title} className="lp-rem-card">
                    <div className="lp-rem-bell" style={{ background: 'rgba(255,159,10,0.13)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg>
                    </div>
                    <div className="lp-rem-body">
                      <div className="lp-rem-title">{t(r.title)}</div>
                      <div className="lp-rem-desc">{t(r.body)}</div>
                      <div className="lp-rem-time">{t(r.time)} · {t(r.date)}</div>
                      <div className="lp-rem-creator">{t('by', { name: r.creator })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

        </div>
      </section>

      {/* ── COMPARE ── */}
      <section className="lp-compare" aria-label={t('cmpAria')}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="lp-h2 lp-reveal" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>
            {t('cmpTitle')}
          </h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 520, margin: '12px auto 0', transitionDelay: '80ms' }}>
            {t('cmpLead')}
          </p>
        </div>
        <div className="lp-compare-grid">
          {COMPARE.map(({ title, sub, icon, rd }) => (
            <div className="lp-compare-cell lp-reveal" style={{ transitionDelay: `${rd}ms` }} key={title}>
              <div className="lp-compare-icon">{icon}</div>
              <div className="lp-compare-title">{t(title)}</div>
              <div className="lp-compare-sub">{t(sub)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="lp-steps" id="login-info">
        <div className="lp-steps-head">
          <div className="lp-eyebrow lp-reveal" style={{ marginBottom: 8 }}>{t('stEyebrow')}</div>
          <h2 className="lp-h2 lp-reveal" {...reveal(80)}>{t('stTitle')}</h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 560, margin: '18px auto 0', transitionDelay: '160ms' }}>
            {rich(t('stLead'), { style: { color: 'var(--app-text-primary)', fontWeight: 500 } })}
          </p>
        </div>
        <div className="lp-steps-grid">
          {[
            { num:'01', title: t('st1Title'), body: rich(t('st1Body')), rd:0   },
            { num:'02', title: t('st2Title'), body: rich(t('st2Body')), rd:100 },
            { num:'03', title: t('st3Title'), body: rich(t('st3Body')), rd:200 },
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
          <div className="lp-eyebrow lp-reveal" style={{ marginBottom: 8 }}>{t('mkEyebrow')}</div>
          <h2 className="lp-h2 lp-reveal" {...reveal(80)}>{t('mkTitle')}</h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 520, margin: '18px auto 0', transitionDelay: '160ms' }}>
            {t('mkLeadBefore')}{' '}
            <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1', textDecoration: 'none' }}>
              bedchem
            </a>{' '}{t('mkLeadAfter')}
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
        <h2 className="lp-h2 lp-reveal">{t('ctaTitle')}</h2>
        <p className="lp-lead lp-reveal" {...reveal(80)}>
          {t('ctaLead')}
        </p>
        <div className="lp-reveal" style={{ transitionDelay: '160ms', marginTop: 32, display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={localize('/login')} className="lp-btn">{t('ctaButton')}</Link>
          <a    href="#login-info" className="lp-alink">{t('ctaHow')}</a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <LandingFooter />

    </div>
  );
}
