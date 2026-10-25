// The pages of a recap story (components/recap/RecapStory.tsx), from its
// figures: which pages there are, what each says (keys of
// lib/i18n/dictionaries/recap.ts with their values) and how the mascot
// reacts — every figure has its own tiers, from the crown for not one hour
// missed to covering its eyes above 25 %. A page without data is left out.
// Pure, tested on its own (tests/recap.test.mjs).

import type { RecapKey } from './i18n/dictionaries/recap';
import type { RecapPokyh, RecapSection } from './recap';
import type { UntisRecap } from './recap-figures';

/** How the mascot takes a figure (components/recap/reactions.ts draws each one). */
export type Mood =
  | 'wave' | 'legend' | 'great' | 'good' | 'ok' | 'meh' | 'worried' | 'alarm'
  | 'proud' | 'love' | 'focused' | 'sleepy' | 'party' | 'cool' | 'curious' | 'peek'
  | 'angry' | 'angel' | 'zap' | 'night' | 'early' | 'cheer';

/** The background of a page (components/recap/themes.ts). */
export type Theme =
  | 'night' | 'ocean' | 'sunset' | 'forest' | 'dusk' | 'candy' | 'gold' | 'mint'
  | 'grape' | 'teal' | 'ember' | 'alarm' | 'brand' | 'sky' | 'rose';

export type Tier = 'legend' | 'great' | 'good' | 'ok' | 'meh' | 'worried' | 'alarm';

export interface Text {
  key: RecapKey;
  vars?: Record<string, string | number>;
}

export type Value =
  | { kind: 'count'; n: number; decimals?: number; prefix?: string; suffix?: string; /** Counts from here (down, for a ranking). */ from?: number }
  | { kind: 'text'; text: string };

export interface ListRow {
  label: string;
  /** Said in the reader's language instead of label. */
  labelKey?: RecapKey;
  /** For the bar's length. */
  value: number;
  display: string;
}

export interface Slide {
  id: string;
  theme: Theme;
  mood: Mood;
  layout: 'intro' | 'number' | 'list' | 'summary';
  lead?: Text;
  value?: Value;
  unit?: Text;
  body?: Text[];
  quip?: Text;
  list?: ListRow[];
  /** The absence rate against the 25 % limit. */
  meter?: { value: number; limit: number };
  /** Where the mascot stands on this page. */
  place: 'bottom' | 'left' | 'right' | 'corner';
}

export interface SummaryItem {
  id: string;
  /** The short label the card shows. */
  label: RecapKey;
  value: string;
}

export interface Fmt {
  /** YYYYMMDD → "Dienstag, 14. März" */
  date(n: number): string;
  /** YYYY-MM-DD → "1. September 2025" */
  day(iso: string): string;
  /** Monday = 0 → "Montag" */
  weekday(i: number): string;
  /** Minutes of the day → "07:45" */
  time(minutes: number): string;
  /** A number with the locale's separators and `digits` decimals. */
  num(n: number, digits?: number): string;
  dish(name: { de: string; it: string; en: string }): string;
}

export interface StoryInput {
  title: string;
  firstName: string;
  periodFrom: string;
  periodTo: string;
  sections: readonly RecapSection[];
  untis: UntisRecap | null;
  pokyh: RecapPokyh | null;
}

/** The limit most schools set: three quarters of the lessons attended. */
export const ABSENCE_LIMIT = 25;

export function absenceTier(rate: number, missedMinutes: number): Tier {
  if (missedMinutes <= 0) return 'legend';
  if (rate < 2) return 'great';
  if (rate < 5) return 'good';
  if (rate < 10) return 'ok';
  if (rate < 15) return 'meh';
  if (rate < ABSENCE_LIMIT) return 'worried';
  return 'alarm';
}

/** Tiers of an average on the 1–10 scale (6 is a pass). */
export function gradeTier(average: number): 'legend' | 'great' | 'good' | 'ok' | 'low' {
  if (average >= 9) return 'legend';
  if (average >= 8) return 'great';
  if (average >= 7) return 'good';
  if (average >= 6) return 'ok';
  return 'low';
}

const TIER_MOOD: Record<Tier, Mood> = { legend: 'legend', great: 'great', good: 'good', ok: 'ok', meh: 'meh', worried: 'worried', alarm: 'alarm' };
const TIER_THEME: Record<Tier, Theme> = { legend: 'gold', great: 'mint', good: 'teal', ok: 'sky', meh: 'dusk', worried: 'ember', alarm: 'alarm' };
const TIER_QUIP: Record<Tier, RecapKey> = { legend: 'quipLegend', great: 'quipGreat', good: 'quipGood', ok: 'quipOk', meh: 'quipMeh', worried: 'quipWorried', alarm: 'quipAlarm' };
const TIER_BODY: Record<Tier, RecapKey> = {
  legend: 'rateBodyLegend', great: 'rateBodyGreat', good: 'rateBodyGood', ok: 'rateBodyOk', meh: 'rateBodyMeh', worried: 'rateBodyWorried', alarm: 'rateBodyAlarm',
};

const hours = (minutes: number) => Math.round(minutes / 60);
const maxIndex = (values: readonly number[]) => values.reduce((best, v, i) => (v > values[best]! ? i : best), 0);

function schoolSlides(u: UntisRecap, withAbsences: boolean, fmt: Fmt): Slide[] {
  const s = u.school;
  if (!s || s.lessons === 0) return [];
  const out: Slide[] = [];
  const missed = withAbsences ? u.absences?.missedMinutes ?? 0 : 0;
  const attended = Math.max(0, s.minutes - missed);
  const attendedHours = hours(attended);
  const body: Text[] = [{ key: 'hoursBody', vars: { days: fmt.num(s.days), lessons: fmt.num(s.lessons) } }];
  if (!u.complete) body.push({ key: 'partial', vars: { n: u.weeksTotal - u.weeksLoaded } });
  out.push({
    id: 'hours', theme: 'ocean', mood: 'proud', layout: 'number', place: 'bottom',
    lead: { key: 'hoursLead' },
    value: { kind: 'count', n: attendedHours },
    unit: { key: 'hoursUnit' },
    body,
    quip: { key: 'hoursQuip', vars: { days: fmt.num(attended / 60 / 24, 1) } },
  });

  const top = s.subjects[0];
  if (top) {
    out.push({
      id: 'subject', theme: 'sunset', mood: 'love', layout: 'list', place: 'corner',
      lead: { key: 'subjectLead' },
      value: { kind: 'text', text: top.name },
      unit: { key: 'subjectUnit', vars: { hours: fmt.num(hours(top.value)), lessons: fmt.num(top.lessons) } },
      list: s.subjects.map((x) => ({ label: x.name, value: x.value, display: `${fmt.num(hours(x.value))} h` })),
      quip: { key: 'subjectQuip' },
    });
  }

  const teacher = s.teachers[0];
  if (teacher) {
    const room = s.rooms[0];
    out.push({
      id: 'teacher', theme: 'forest', mood: 'wave', layout: 'number', place: 'right',
      lead: { key: 'teacherLead' },
      value: { kind: 'text', text: teacher.name },
      unit: { key: 'teacherUnit', vars: { n: fmt.num(teacher.lessons) } },
      body: room ? [{ key: 'teacherRoom', vars: { room: room.name, n: fmt.num(room.lessons) } }] : undefined,
      quip: { key: 'teacherQuip' },
    });
  }

  if (s.longestDay) {
    out.push({
      id: 'longest', theme: 'dusk', mood: 'sleepy', layout: 'number', place: 'left',
      lead: { key: 'longestLead' },
      value: { kind: 'text', text: fmt.date(s.longestDay.date) },
      unit: { key: 'longestUnit', vars: { start: fmt.time(s.longestDay.start), end: fmt.time(s.longestDay.end) } },
      body: s.earliest && s.latest ? [{ key: 'longestBody', vars: { early: fmt.time(s.earliest.start), late: fmt.time(s.latest.end) } }] : undefined,
      quip: { key: 'longestQuip' },
    });
  }

  const subs: Text[] = s.substitutions === 1 ? [{ key: 'cancelledSubsOne' }] : s.substitutions > 1 ? [{ key: 'cancelledSubs', vars: { n: fmt.num(s.substitutions) } }] : [];
  out.push({
    id: 'cancelled',
    theme: s.cancelled === 0 ? 'teal' : 'candy',
    mood: s.cancelled === 0 ? 'cool' : s.cancelled >= 30 ? 'party' : 'cheer',
    layout: 'number', place: 'bottom',
    lead: { key: 'cancelledLead' },
    value: { kind: 'count', n: s.cancelled },
    unit: { key: s.cancelled === 1 ? 'cancelledUnitOne' : 'cancelledUnit' },
    body: s.cancelled === 0 ? [{ key: 'cancelledNone' }, ...subs] : subs,
    quip: { key: s.cancelled === 0 ? 'cancelledQuipNone' : s.cancelled >= 30 ? 'cancelledQuipMany' : 'cancelledQuipSome' },
  });
  return out;
}

function absenceSlides(u: UntisRecap, fmt: Fmt): Slide[] {
  const a = u.absences;
  if (!a) return [];
  const out: Slide[] = [];
  const missedHours = a.missedMinutes / 60;
  if (a.rate !== null && a.possibleMinutes) {
    const tier = absenceTier(a.rate, a.missedMinutes);
    const left = Math.max(0, (a.possibleMinutes * ABSENCE_LIMIT) / 100 - a.missedMinutes) / 60;
    out.push({
      id: 'rate', theme: TIER_THEME[tier], mood: TIER_MOOD[tier], layout: 'number', place: tier === 'alarm' || tier === 'worried' ? 'right' : 'bottom',
      lead: { key: 'rateLead' },
      value: { kind: 'count', n: a.rate, decimals: a.rate === 0 ? 0 : 1, suffix: ' %' },
      unit: { key: 'rateUnit' },
      meter: { value: a.rate, limit: ABSENCE_LIMIT },
      body: [{ key: TIER_BODY[tier], vars: { hours: fmt.num(Math.round(missedHours)), left: fmt.num(Math.floor(left)) } }],
      quip: { key: TIER_QUIP[tier] },
    });
  } else {
    // Without every week, no rate: the hours alone.
    const tier = a.missedMinutes === 0 ? 'legend' : 'ok';
    out.push({
      id: 'missed', theme: TIER_THEME[tier], mood: TIER_MOOD[tier], layout: 'number', place: 'bottom',
      lead: { key: 'missedLead' },
      value: { kind: 'count', n: Math.round(missedHours) },
      unit: { key: 'missedUnit' },
      body: a.missedMinutes === 0 ? [{ key: 'missedNone' }] : undefined,
      quip: { key: TIER_QUIP[tier] },
    });
  }
  if (a.missedMinutes <= 0) return out;

  const excusedShare = Math.round((a.excusedMinutes / a.missedMinutes) * 100);
  const open: Text = a.openEntries === 0 ? { key: 'detailsAllDone' } : a.openEntries === 1 ? { key: 'detailsOpenOne' } : { key: 'detailsOpen', vars: { n: fmt.num(a.openEntries) } };
  if (a.entries > 0) {
    out.push({
      id: 'details', theme: a.openEntries === 0 ? 'mint' : 'ember', mood: a.openEntries === 0 ? 'good' : 'curious', layout: 'number', place: 'left',
      lead: { key: 'detailsLead' },
      value: { kind: 'count', n: a.entries },
      unit: a.entries === 1 ? { key: 'detailsUnitOne' } : { key: 'detailsUnit', vars: { days: fmt.num(a.missedDays) } },
      body: [{ key: 'detailsExcused', vars: { n: excusedShare } }, open],
      quip: { key: a.openEntries === 0 ? 'detailsQuipDone' : 'detailsQuipOpen' },
    });
  }

  const subject = a.bySubject[0];
  if (subject) {
    const day = maxIndex(a.byWeekday);
    out.push({
      id: 'pattern', theme: 'rose', mood: 'peek', layout: 'number', place: 'right',
      lead: { key: 'patternLead' },
      value: { kind: 'text', text: subject.name },
      unit: { key: 'patternUnit', vars: { hours: fmt.num(Math.max(1, Math.round(subject.value / 60))) } },
      body: a.byWeekday[day]! > 0 ? [{ key: 'patternBody', vars: { weekday: fmt.weekday(day) } }] : undefined,
      quip: { key: day === 0 ? 'patternQuipMonday' : day === 4 ? 'patternQuipFriday' : 'patternQuip' },
    });
  }
  return out;
}

function gradeSlides(u: UntisRecap, fmt: Fmt): Slide[] {
  const g = u.grades;
  if (!g || g.count === 0) return [];
  const tier = gradeTier(g.average);
  const mood: Record<typeof tier, Mood> = { legend: 'legend', great: 'great', good: 'good', ok: 'ok', low: 'worried' };
  const quip: Record<typeof tier, RecapKey> = { legend: 'gradesQuipLegend', great: 'gradesQuipGreat', good: 'gradesQuipGood', ok: 'gradesQuipOk', low: 'gradesQuipLow' };
  const out: Slide[] = [{
    id: 'grades', theme: tier === 'low' ? 'ember' : 'grape', mood: mood[tier], layout: 'number', place: 'bottom',
    lead: { key: 'gradesLead' },
    value: { kind: 'count', n: g.count },
    unit: { key: g.count === 1 ? 'gradesUnitOne' : 'gradesUnit' },
    body: [
      { key: 'gradesBody', vars: { avg: fmt.num(g.average, 2) } },
      g.negative > 0 ? { key: 'gradesMixed', vars: { pos: fmt.num(g.positive), neg: fmt.num(g.negative) } } : { key: 'gradesAllPositive' },
    ],
    quip: { key: quip[tier] },
  }];
  if (g.best) {
    out.push({
      id: 'best', theme: 'gold', mood: gradeTier(g.best.average) === 'legend' ? 'party' : 'proud', layout: 'list', place: 'corner',
      lead: { key: 'bestLead' },
      value: { kind: 'text', text: g.best.name },
      unit: g.best.count === 1 ? { key: 'bestUnitOne', vars: { avg: fmt.num(g.best.average, 2) } } : { key: 'bestUnit', vars: { avg: fmt.num(g.best.average, 2), n: g.best.count } },
      list: g.subjects.slice(0, 4).map((x) => ({ label: x.name, value: x.average, display: fmt.num(x.average, 2) })),
      body: g.top ? [{ key: 'bestTop', vars: { value: fmt.num(g.top.value, g.top.value % 1 ? 2 : 0), subject: g.top.name, date: fmt.date(g.top.date) } }] : undefined,
      quip: { key: 'bestQuip' },
    });
  }
  return out;
}

function examSlides(u: UntisRecap, fmt: Fmt): Slide[] {
  const exams = u.exams ?? 0;
  const homework = u.homework ?? 0;
  if (exams === 0 && homework === 0) return [];
  const examFirst = exams > 0;
  return [{
    id: 'exams', theme: 'teal', mood: 'focused', layout: 'number', place: 'right',
    lead: { key: 'examsLead' },
    value: { kind: 'count', n: examFirst ? exams : homework },
    unit: { key: examFirst ? (exams === 1 ? 'examsUnitOne' : 'examsUnit') : 'homeworkUnit' },
    body: examFirst && homework > 0 ? [{ key: 'examsHomework', vars: { n: fmt.num(homework) } }] : undefined,
    quip: { key: 'examsQuip' },
  }];
}

function classregSlides(u: UntisRecap): Slide[] {
  if (u.classreg === null) return [];
  const n = u.classreg;
  const level = n === 0 ? 'none' : n <= 3 ? 'few' : 'many';
  return [{
    id: 'classreg',
    theme: level === 'none' ? 'sky' : level === 'few' ? 'dusk' : 'ember',
    mood: level === 'none' ? 'angel' : level === 'few' ? 'meh' : 'angry',
    layout: 'number', place: 'bottom',
    lead: { key: 'classregLead' },
    value: { kind: 'count', n },
    body: [{ key: level === 'none' ? 'classregNone' : level === 'few' ? 'classregFew' : 'classregMany' }],
    quip: { key: level === 'none' ? 'classregQuipNone' : level === 'few' ? 'classregQuipFew' : 'classregQuipMany' },
  }];
}

function pokyhSlides(p: RecapPokyh, fmt: Fmt, schoolDays: number): Slide[] {
  const t = p.totals;
  const madeCount = p.created ? p.created.todosDone + p.created.reminders + p.created.comments + p.created.ratings : 0;
  if (!t || t.activeDays === 0) {
    // Nothing kept from the period (e.g. a year whose rows went at the
    // rollover without an archive): said so, instead of leaving it out.
    if (madeCount > 0 || p.favouriteDish || !p.covered) return [];
    return [{
      id: 'pokyh-none', theme: 'night', mood: 'curious', layout: 'number', place: 'right',
      lead: { key: 'pokyhNoneLead' },
      unit: { key: 'pokyhNoneUnit' },
      body: [{ key: 'pokyhNoneBody' }],
      quip: { key: 'pokyhNoneQuip' },
    }];
  }
  const out: Slide[] = [];
  // Open on most school days: full of energy.
  const zap = schoolDays > 0 && t.activeDays >= schoolDays * 0.6;
  out.push({
    id: 'days', theme: 'brand', mood: zap ? 'zap' : 'wave', layout: 'number', place: 'bottom',
    lead: { key: 'daysLead' },
    value: { kind: 'count', n: t.activeDays },
    unit: { key: t.activeDays === 1 ? 'daysUnitOne' : 'daysUnit' },
    body: [t.longestStreak === 1 ? { key: 'daysBodyOne' } : { key: 'daysBody', vars: { n: fmt.num(t.longestStreak) } }],
    quip: { key: zap ? 'daysQuipZap' : 'daysQuip' },
  });

  const weekdays = p.weekdays ?? [];
  const day = maxIndex(weekdays);
  if (p.usageConsent && t.activeSeconds >= 60 && p.hours) {
    const hour = maxIndex(p.hours);
    const night = hour >= 21 || hour < 5;
    const early = hour >= 5 && hour < 8;
    const asHours = t.activeSeconds >= 3600;
    out.push({
      id: 'time', theme: night ? 'night' : early ? 'sky' : 'sunset', mood: night ? 'night' : early ? 'early' : 'cool', layout: 'number', place: 'left',
      lead: { key: 'timeLead' },
      value: { kind: 'count', n: asHours ? Math.round(t.activeSeconds / 3600) : Math.round(t.activeSeconds / 60) },
      unit: { key: asHours ? 'timeUnitHours' : 'timeUnitMinutes' },
      body: [{ key: 'timeBody', vars: { hour, weekday: fmt.weekday(day) } }],
      quip: { key: night ? 'timeQuipNight' : early ? 'timeQuipEarly' : 'timeQuipDay' },
    });
  } else if ((weekdays[day] ?? 0) > 0) {
    out.push({
      id: 'when', theme: 'sky', mood: 'cool', layout: 'number', place: 'left',
      lead: { key: 'whenLead' },
      value: { kind: 'text', text: fmt.weekday(day) },
      unit: { key: 'whenUnit', vars: { n: fmt.num(weekdays[day]!) } },
      quip: { key: 'whenQuip' },
    });
  }

  const c = p.created;
  const made: Array<[RecapKey, number]> = c ? [['madeTodos', c.todosDone], ['madeReminders', c.reminders], ['madeComments', c.comments], ['madeRatings', c.ratings]] : [];
  const rows: ListRow[] = made.filter(([, n]) => n > 0).map(([labelKey, n]) => ({ label: '', labelKey, value: n, display: fmt.num(n) }));
  if (rows.length > 0 || p.favouriteDish) {
    out.push({
      id: 'made', theme: 'mint', mood: p.favouriteDish ? 'love' : 'cheer', layout: 'list', place: 'corner',
      lead: { key: 'madeLead' },
      list: rows,
      body: p.favouriteDish ? [{ key: 'madeDish', vars: { dish: fmt.dish(p.favouriteDish.name) } }] : undefined,
      quip: { key: 'madeQuip' },
    });
  }

  if (p.rank && p.rank.topPercent <= 50) {
    const legend = p.rank.topPercent <= 5;
    out.push({
      id: 'rank', theme: 'gold', mood: legend ? 'legend' : p.rank.topPercent <= 20 ? 'party' : 'great', layout: 'number', place: 'bottom',
      lead: { key: 'rankLead' },
      value: { kind: 'count', n: p.rank.topPercent, prefix: 'Top ', suffix: ' %', from: 100 },
      unit: { key: 'rankUnit' },
      quip: { key: legend ? 'rankQuipLegend' : 'rankQuip' },
    });
  }
  return out;
}

/** The story's pages, in order: hello, the chosen parts, the summary. */
export function buildStory(input: StoryInput, fmt: Fmt): Slide[] {
  const wants = (s: RecapSection) => input.sections.includes(s);
  const u = input.untis;
  const slides: Slide[] = [{
    id: 'intro', theme: 'night', mood: 'wave', layout: 'intro', place: 'bottom',
    lead: input.firstName ? { key: 'introHello', vars: { name: input.firstName } } : { key: 'introHelloAnon' },
    value: { kind: 'text', text: input.title },
    body: [{ key: 'introLead', vars: { from: fmt.day(input.periodFrom), to: fmt.day(input.periodTo) } }],
    quip: { key: 'introQuip' },
  }];
  if (u && wants('school')) slides.push(...schoolSlides(u, wants('absences'), fmt));
  if (u && wants('absences')) slides.push(...absenceSlides(u, fmt));
  if (u && wants('grades')) slides.push(...gradeSlides(u, fmt));
  if (u && wants('exams')) slides.push(...examSlides(u, fmt));
  if (u && wants('classreg')) slides.push(...classregSlides(u));
  if (input.pokyh && wants('pokyh')) slides.push(...pokyhSlides(input.pokyh, fmt, u?.school?.days ?? 0));
  slides.push({ id: 'summary', theme: 'night', mood: 'party', layout: 'summary', place: 'corner', value: { kind: 'text', text: input.title }, quip: { key: 'summaryQuip' } });
  return slides;
}

/**
 * Every figure the card to share can show, the most telling first; the
 * student picks which (the first few are chosen at the start).
 */
export function summaryItems(input: StoryInput, fmt: Fmt): SummaryItem[] {
  const out: SummaryItem[] = [];
  const u = input.untis;
  const p = input.pokyh;
  const wants = (s: RecapSection) => input.sections.includes(s);
  const add = (id: string, label: RecapKey, value: string) => out.push({ id, label, value });
  if (u?.school && wants('school') && u.school.lessons > 0) {
    add('hours', 'cardHours', fmt.num(hours(Math.max(0, u.school.minutes - (wants('absences') ? u.absences?.missedMinutes ?? 0 : 0)))));
  }
  if (u?.absences?.rate != null && wants('absences')) add('rate', 'cardRate', `${fmt.num(u.absences.rate, u.absences.rate === 0 ? 0 : 1)} %`);
  if (u?.grades && u.grades.count > 0 && wants('grades')) add('average', 'cardAverage', fmt.num(u.grades.average, 2));
  if (u?.school?.subjects[0] && wants('school')) add('subject', 'cardSubject', u.school.subjects[0].name);
  if (p?.rank && p.rank.topPercent <= 50 && wants('pokyh')) add('rank', 'cardRank', `Top ${p.rank.topPercent} %`);
  if (p?.totals && p.totals.activeDays > 0 && wants('pokyh')) add('days', 'cardDays', fmt.num(p.totals.activeDays));
  if (u?.grades?.best && wants('grades')) add('best', 'cardBest', u.grades.best.name);
  if (u?.exams && wants('exams')) add('exams', 'cardExams', fmt.num(u.exams));
  if (u?.homework && wants('exams')) add('homework', 'cardHomework', fmt.num(u.homework));
  if (u?.absences && wants('absences')) add('missed', 'cardMissed', fmt.num(Math.round(u.absences.missedMinutes / 60)));
  if (u?.school && wants('school') && u.school.lessons > 0) add('cancelled', 'cardCancelled', fmt.num(u.school.cancelled));
  if (u?.school?.teachers[0] && wants('school')) add('teacher', 'cardTeacher', u.school.teachers[0].name);
  if (p?.totals && p.totals.longestStreak > 1 && wants('pokyh')) add('streak', 'cardStreak', fmt.num(p.totals.longestStreak));
  if (p?.created && p.created.todosDone > 0 && wants('pokyh')) add('todos', 'cardTodos', fmt.num(p.created.todosDone));
  if (u?.classreg != null && wants('classreg')) add('classreg', 'cardClassreg', fmt.num(u.classreg));
  return out;
}
