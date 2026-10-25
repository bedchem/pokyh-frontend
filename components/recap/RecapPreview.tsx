'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { ClientRecap, RecapPokyh } from '@/lib/recap';
import type { UntisRecap } from '@/lib/recap-figures';

// Development only (app/[lang]/dev-recap/page.dev.ts): the recap story with
// made-up figures, to see every page and every reaction of the mascot
// without a WebUntis account — the absence tiers from 0 % to over 25 %, the
// grade tiers, the class register, with and without the usage statistics.

const RecapStory = dynamic(() => import('./RecapStory'), { ssr: false });

const RATES = [0, 1.5, 4, 8, 13, 20, 31];
const AVERAGES = [9.3, 8.2, 7.1, 6.2, 5.4];
const ENTRIES = [0, 2, 7];
const CANCELLED = [0, 12, 45];
const HOURS = [22, 7, 16];
const RANKS = [3, 15, 40, 70];

const RECAP: ClientRecap = {
  id: '00000000-0000-4000-8000-000000000000',
  title: 'Dein Schuljahr 2025/26',
  periodFrom: '2025-09-01',
  periodTo: '2026-06-30',
  endsAt: null,
  sections: ['school', 'absences', 'grades', 'exams', 'classreg', 'pokyh'],
  openedAt: null,
  finishedAt: null,
};

function untisSample(rate: number, average: number, classreg: number, cancelled: number): UntisRecap {
  const possible = 52_200;
  const missed = Math.round((possible * rate) / 100);
  const subjects = [['Mathematik', 9000, 180], ['Deutsch', 7200, 144], ['Englisch', 6000, 120], ['Informatik', 5400, 108], ['Geschichte', 3600, 72]] as const;
  return {
    complete: true,
    weeksLoaded: 43,
    weeksTotal: 43,
    school: {
      days: 172,
      lessons: 1044,
      minutes: possible,
      cancelled,
      substitutions: 23,
      subjects: subjects.map(([name, value, lessons]) => ({ name, value, lessons })),
      teachers: [{ name: 'Maria Huber', value: 212, lessons: 212 }],
      rooms: [{ name: 'A2.05', value: 341, lessons: 341 }],
      longestDay: { date: 20260303, start: 465, end: 1010 },
      earliest: { date: 20251006, start: 445 },
      latest: { date: 20260303, end: 1010 },
      weekdays: [11_000, 10_500, 10_400, 10_300, 10_000, 0, 0],
    },
    absences: {
      entries: missed ? Math.max(1, Math.round(missed / 280)) : 0,
      openEntries: rate > 10 ? 3 : 0,
      missedMinutes: missed,
      excusedMinutes: Math.round(missed * (rate > 10 ? 0.7 : 1)),
      possibleMinutes: possible,
      rate,
      missedDays: Math.round(missed / 300),
      bySubject: missed ? [{ name: 'Mathematik', value: Math.round(missed * 0.3), lessons: 6 }] : [],
      byWeekday: [missed * 0.4, missed * 0.15, missed * 0.15, missed * 0.1, missed * 0.2, 0, 0],
      official: true,
    },
    grades: {
      count: 34,
      average,
      positive: average < 6 ? 22 : 34,
      negative: average < 6 ? 12 : 0,
      subjects: [
        { name: 'Informatik', average: Math.min(10, average + 0.9), count: 5 },
        { name: 'Englisch', average: Math.min(10, average + 0.4), count: 6 },
        { name: 'Deutsch', average, count: 7 },
        { name: 'Mathematik', average: Math.max(1, average - 0.8), count: 8 },
      ],
      best: { name: 'Informatik', average: Math.min(10, average + 0.9), count: 5 },
      top: { value: Math.min(10, Math.round(average + 1.5)), name: 'Informatik', date: 20260415 },
    },
    exams: 18,
    homework: 64,
    classreg,
  };
}

function pokyhSample(consent: boolean, hour: number, rank: number): RecapPokyh {
  const hours = Array.from({ length: 24 }, (_, h) => (h === hour ? 40_000 : h >= 7 && h <= 22 ? 4000 : 0));
  return {
    covered: { from: RECAP.periodFrom, to: RECAP.periodTo },
    usageConsent: consent,
    memberSince: '2025-09-03T07:00:00.000Z',
    totals: { activeDays: 131, logins: 14, activeSeconds: consent ? 152_000 : 0, visits: 420, screens: 2900, longestStreak: 23 },
    weekdays: [30, 28, 26, 25, 18, 2, 2],
    hours: consent ? hours : Array(24).fill(0),
    platforms: { phone: 120, desktop: 40, app: 90, web: 60 },
    firstDay: '2025-09-03',
    busiestDay: null,
    pages: [],
    created: { todos: 40, todosDone: 37, reminders: 6, comments: 11, ratings: 24 },
    favouriteDish: { name: { de: 'Spinatknödel mit Parmesan', it: 'Canederli agli spinaci', en: 'Spinach dumplings' }, stars: 5 },
    rank: { topPercent: rank, group: 480 },
  };
}

function Pick<T extends number>({ label, values, value, onChange, show }: { label: string; values: readonly T[]; value: T; onChange: (v: T) => void; show: (v: T) => string }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-ink-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={v === value}
            className={`rounded-[11px] px-3 py-1.5 text-[14px] font-semibold ${v === value ? 'bg-accent text-on-accent' : 'bg-inset text-ink'}`}>
            {show(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RecapPreview() {
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState(0);
  const [rate, setRate] = useState(0);
  const [average, setAverage] = useState(8.2);
  const [classreg, setClassreg] = useState(0);
  const [cancelled, setCancelled] = useState(12);
  const [hour, setHour] = useState(22);
  const [rank, setRank] = useState(3);
  const [consent, setConsent] = useState(true);
  const data = useMemo(() => ({
    untis: untisSample(rate, average, classreg, cancelled),
    pokyh: pokyhSample(consent, hour, rank),
    firstName: 'Anna',
  }), [rate, average, classreg, cancelled, consent, hour, rank]);

  return (
    <main className="min-h-dvh bg-canvas px-4 py-10 text-ink">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 rounded-[26px] bg-surface p-6">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">Recap-Vorschau</h1>
          <p className="mt-1 text-[14.5px] text-ink-2">Nur in der Entwicklung. Die Story mit erfundenen Zahlen, um jede Seite und jede Reaktion zu sehen.</p>
        </div>
        <Pick label="Fehlquote" values={RATES} value={rate} onChange={setRate} show={(v) => `${v} %`} />
        <Pick label="Notendurchschnitt" values={AVERAGES} value={average} onChange={setAverage} show={(v) => String(v)} />
        <Pick label="Klassenbucheinträge" values={ENTRIES} value={classreg} onChange={setClassreg} show={String} />
        <Pick label="Entfallene Stunden" values={CANCELLED} value={cancelled} onChange={setCancelled} show={String} />
        <Pick label="Lieblingsuhrzeit in POKYH" values={HOURS} value={hour} onChange={setHour} show={(v) => `${v} Uhr`} />
        <Pick label="Top % der Schule" values={RANKS} value={rank} onChange={setRank} show={(v) => `${v} %`} />
        <label className="flex items-center gap-2 text-[14.5px] font-semibold">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> Einwilligung zur Nutzungsstatistik
        </label>
        <button type="button" onClick={() => { setRun((n) => n + 1); setOpen(true); }} className="h-[52px] rounded-[16px] bg-accent text-[16px] font-semibold text-on-accent">
          Story abspielen
        </button>
      </div>
      <AnimatePresence>
        {open && <RecapStory key={run} recap={RECAP} preview={data} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}
