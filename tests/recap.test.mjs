import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}

const { recapLessonsOfWeek, untisRecap, periodWeeks, CANCELLED, SUBSTITUTION, EXAM } = await load('../lib/recap-figures.ts');
const { buildStory, summaryItems, absenceTier, gradeTier } = await load('../lib/recap-story.ts');

const entry = (date, start, end, subject, extra = {}) => ({
  duration: { start: `${date}T${start}`, end: `${date}T${end}` },
  position1: [{ current: { displayName: 'MUE', longName: 'Müller' } }],
  position2: [{ current: { displayName: subject.slice(0, 1), longName: subject } }],
  position3: [{ current: { displayName: 'A1' } }],
  ...extra,
});

// Monday 2026-03-02 … Friday 2026-03-06
const WEEK = {
  days: [
    { date: '2026-03-02', gridEntries: [entry('2026-03-02', '08:00', '08:50', 'Mathematik'), entry('2026-03-02', '08:50', '09:40', 'Deutsch')] },
    {
      date: '2026-03-03',
      gridEntries: [
        entry('2026-03-03', '07:45', '08:35', 'Mathematik'),
        entry('2026-03-03', '08:35', '09:25', 'Englisch', { status: 'CANCELLED' }),
        entry('2026-03-03', '16:00', '16:50', 'Sport', { status: 'CHANGED', position1: [{ current: { displayName: 'HUB', longName: 'Huber', status: 'ADDED' } }, { removed: { displayName: 'MUE' } }] }),
      ],
    },
    { date: '2026-03-04', gridEntries: [entry('2026-03-04', '08:00', '08:50', 'Mathematik', { type: 'EXAM' }), { duration: { start: '2026-03-04T09:40', end: '2026-03-04T10:00' } }] },
  ],
};

const NOW = new Date(2026, 2, 9, 12, 0); // a Monday after the week

function weeks() {
  return { '2026-03-02': { at: NOW.getTime(), days: recapLessonsOfWeek(WEEK) } };
}

test('a timetable week: lessons with their state, breaks left out', () => {
  const days = recapLessonsOfWeek(WEEK);
  assert.deepEqual(Object.keys(days), ['20260302', '20260303', '20260304']);
  assert.equal(days['20260303'][1][5], CANCELLED);
  assert.equal(days['20260303'][2][5], SUBSTITUTION);
  assert.equal(days['20260304'][0][5], EXAM);
  assert.equal(days['20260304'].length, 1);
  assert.deepEqual(days['20260302'][0].slice(0, 5), [480, 530, 'Mathematik', 'Müller', 'A1']);
  assert.equal(recapLessonsOfWeek({ error: 'x' }), null);
});

test('the weeks of a period stop today', () => {
  assert.deepEqual(periodWeeks(20260302, 20260331, NOW), ['2026-03-02', '2026-03-09']);
  assert.deepEqual(periodWeeks(20260401, 20260430, NOW), []);
});

test('lessons in school: cancelled ones out, the longest day, the favourite subject', () => {
  const u = untisRecap({ from: 20260302, to: 20260306, now: NOW, weeks: weeks() });
  assert.equal(u.complete, true);
  const s = u.school;
  assert.equal(s.lessons, 5);
  assert.equal(s.cancelled, 1);
  assert.equal(s.substitutions, 1);
  assert.equal(s.minutes, 250);
  assert.equal(s.days, 3);
  assert.equal(s.subjects[0].name, 'Mathematik');
  assert.equal(s.subjects[0].value, 150);
  assert.deepEqual(s.longestDay, { date: 20260303, start: 465, end: 1010 });
  assert.deepEqual(s.earliest, { date: 20260303, start: 465 });
});

test('the period clips the lessons', () => {
  const u = untisRecap({ from: 20260303, to: 20260303, now: NOW, weeks: weeks() });
  assert.equal(u.school.lessons, 2);
  assert.equal(u.school.days, 1);
});

test('absence rate from the school’s own minutes', () => {
  const u = untisRecap({
    from: 20260302, to: 20260306, now: NOW, weeks: weeks(),
    absences: [{ id: 1, startDate: 20260302, endDate: 20260302, startTime: 800, endTime: 940, isExcused: true, hours: 2 }],
    times: { lessons: [
      { absenceId: 1, minutes: 50, subject: 'Mathematik', excused: true, date: 20260302 },
      { absenceId: 1, minutes: 50, subject: 'Deutsch', excused: true, date: 20260302 },
    ] },
  });
  assert.equal(u.absences.official, true);
  assert.equal(u.absences.missedMinutes, 100);
  assert.equal(u.absences.possibleMinutes, 250);
  assert.equal(u.absences.rate, 40);
  assert.equal(u.absences.entries, 1);
  assert.equal(u.absences.openEntries, 0);
  assert.equal(u.absences.byWeekday[0], 100);
});

test('without the school’s minutes the timetable decides; a missing week means no rate', () => {
  const absences = [{ id: 1, startDate: 20260303, endDate: 20260303, startTime: 0, endTime: 0, isExcused: false, hours: 3 }];
  const u = untisRecap({ from: 20260302, to: 20260306, now: NOW, weeks: weeks(), absences, times: null });
  // A whole day: Mathematik and Sport (Englisch was cancelled).
  assert.equal(u.absences.missedMinutes, 100);
  assert.equal(u.absences.openEntries, 1);
  const partial = untisRecap({ from: 20260302, to: 20260313, now: new Date(2026, 2, 16), weeks: weeks(), absences, times: null });
  assert.equal(partial.complete, false);
  assert.equal(partial.absences.rate, null);
});

test('grades of the period, one subject across two school years', () => {
  const u = untisRecap({
    from: 20260101, to: 20260630, now: NOW, weeks: {},
    grades: [
      { subjectName: 'Mathematik', grades: [{ date: 20260110, markDisplayValue: 8 }, { date: 20251010, markDisplayValue: 4 }] },
      { subjectName: 'Mathematik', grades: [{ date: 20260210, markDisplayValue: 9 }] },
      { subjectName: 'Deutsch', grades: [{ date: 20260115, markDisplayValue: 5 }] },
    ],
  });
  assert.equal(u.grades.count, 3);
  assert.equal(u.grades.best.name, 'Mathematik');
  assert.equal(u.grades.best.average, 8.5);
  assert.equal(u.grades.negative, 1);
  assert.deepEqual(u.grades.top, { value: 9, name: 'Mathematik', date: 20260210 });
});

test('absence tiers, from the crown to the alarm', () => {
  assert.equal(absenceTier(0, 0), 'legend');
  assert.equal(absenceTier(1.5, 30), 'great');
  assert.equal(absenceTier(4, 30), 'good');
  assert.equal(absenceTier(9.9, 30), 'ok');
  assert.equal(absenceTier(14, 30), 'meh');
  assert.equal(absenceTier(24.9, 30), 'worried');
  assert.equal(absenceTier(25, 30), 'alarm');
  assert.equal(gradeTier(9.1), 'legend');
  assert.equal(gradeTier(5.9), 'low');
});

const fmt = {
  date: (n) => String(n), day: (iso) => iso, weekday: (i) => ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i],
  time: (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`, num: (n, d = 0) => n.toFixed(d), dish: (n) => n.de,
};
const ALL = ['school', 'absences', 'grades', 'exams', 'classreg', 'pokyh'];

function story(untis, pokyh = null, sections = ALL) {
  return buildStory({ title: 'Dein Jahr', firstName: 'Anna', periodFrom: '2026-03-02', periodTo: '2026-03-06', sections, untis, pokyh }, fmt);
}

test('the story: hello, the parts with data, the summary', () => {
  const u = untisRecap({ from: 20260302, to: 20260306, now: NOW, weeks: weeks(), absences: [], times: { lessons: [] }, exams: [], homework: [], classreg: [] });
  const slides = story(u);
  const ids = slides.map((s) => s.id);
  assert.equal(ids[0], 'intro');
  assert.equal(ids.at(-1), 'summary');
  assert.ok(ids.includes('hours'));
  // Not one hour missed: the crown.
  const rate = slides.find((s) => s.id === 'rate');
  assert.equal(rate.mood, 'legend');
  assert.equal(rate.body[0].key, 'rateBodyLegend');
  // No grades, no exams: no pages for them; no class register entries: the angel.
  assert.ok(!ids.includes('grades'));
  assert.ok(!ids.includes('exams'));
  assert.equal(slides.find((s) => s.id === 'classreg').mood, 'angel');
  // Only the chosen parts.
  assert.deepEqual(story(u, null, ['grades']).map((s) => s.id), ['intro', 'summary']);
});

test('over a quarter missed: the alarm, with the limit on the meter', () => {
  const u = untisRecap({
    from: 20260302, to: 20260306, now: NOW, weeks: weeks(),
    times: { lessons: [{ absenceId: 1, minutes: 100, subject: 'Mathematik', excused: false, date: 20260302 }] },
  });
  const rate = story(u).find((s) => s.id === 'rate');
  assert.equal(rate.mood, 'alarm');
  assert.equal(rate.theme, 'alarm');
  assert.deepEqual(rate.meter, { value: 40, limit: 25 });
});

test('POKYH pages: time only with consent, the ranking only from the top half', () => {
  const base = { covered: { from: '2026-03-02', to: '2026-03-06' }, memberSince: null, totals: { activeDays: 4, logins: 2, activeSeconds: 0, visits: 0, screens: 0, longestStreak: 3 }, weekdays: [2, 1, 1, 0, 0, 0, 0], hours: Array(24).fill(0), platforms: { phone: 1, desktop: 1, app: 0, web: 1 }, created: { todos: 0, todosDone: 3, reminders: 0, comments: 0, ratings: 0 }, favouriteDish: null };
  const without = story(null, { ...base, usageConsent: false, rank: { topPercent: 70, group: 40 } }, ['pokyh']).map((s) => s.id);
  assert.deepEqual(without, ['intro', 'days', 'when', 'made', 'summary']);
  const hours = Array(24).fill(0);
  hours[22] = 4000;
  const withTime = story(null, { ...base, usageConsent: true, totals: { ...base.totals, activeSeconds: 4000 }, hours, rank: { topPercent: 3, group: 40 } }, ['pokyh']);
  const time = withTime.find((s) => s.id === 'time');
  assert.equal(time.mood, 'night');
  assert.equal(withTime.find((s) => s.id === 'rank').mood, 'legend');
  const items = summaryItems({ title: '', firstName: '', periodFrom: '', periodTo: '', sections: ['pokyh'], untis: null, pokyh: { ...base, usageConsent: true, rank: { topPercent: 3, group: 40 } } }, fmt);
  // Every figure the card can show, the most telling first.
  assert.deepEqual(items.map((i) => i.id), ['rank', 'days', 'streak', 'todos']);
  assert.equal(items[0].value, 'Top 3 %');
});

const font = await load('../components/recap/pixelFont.ts');

test('the pixel font: widths, wrapping, cutting off, umlauts and accents', () => {
  // 5 wide letters with a gap of one: "AB" is 11.
  assert.equal(font.pixelWidth('AB'), 11);
  assert.equal(font.pixelWidth('ab'), 11);
  assert.ok(font.pixelWidth('ÄÖÜ') > 0);
  assert.equal(font.pixelWidth('È'), font.pixelWidth('E'));
  assert.deepEqual(font.pixelLines('MEIN SCHULJAHR', 40), ['MEIN', 'SCHULJAHR']);
  assert.ok(font.pixelWidth(font.pixelClip('MATHEMATIK', 30)) <= 30);
  assert.ok(font.pixelClip('MATHEMATIK', 30).endsWith('...'));
  const p = font.pixelPath('1', 2);
  assert.equal(p.height, 14);
  assert.match(p.d, /^M/);
});

const calc = await load('../lib/absence-calc.ts');

// A week of 2025/26: Monday 1 September … Friday 5 September, four lessons a day.
const SEP = {
  days: ['2025-09-01', '2025-09-02', '2025-09-03', '2025-09-04', '2025-09-05'].map((date) => ({
    date,
    gridEntries: [
      entry(date, '08:00', '08:50', 'Mathematik'),
      entry(date, '08:50', '09:40', 'Deutsch'),
      entry(date, '10:00', '10:50', 'Englisch', date === '2025-09-03' ? { status: 'CANCELLED' } : {}),
      entry(date, '10:50', '11:40', 'Informatik'),
    ],
  })),
};
const SAT = new Date(2025, 8, 6, 12, 0);
const ABSENCES = [
  // The school counts this one itself ("Fehlzeiten").
  { id: 1, startDate: 20250901, endDate: 20250901, startTime: 800, endTime: 940, isExcused: true, hours: 2 },
  // This one only the timetable can tell: the whole of Thursday.
  { id: 2, startDate: 20250904, endDate: 20250904, startTime: 0, endTime: 0, isExcused: false, hours: 4 },
];
const TIMES = { lessons: [
  { absenceId: 1, minutes: 50, subject: 'Mathematik', excused: true, counting: true, date: 20250901 },
  { absenceId: 1, minutes: 50, subject: 'Deutsch', excused: true, counting: true, date: 20250901 },
] };

test('an empty "Fehlzeiten" answer does not wipe out the absences (it showed 0 %)', () => {
  const weeks = { '2025-09-01': { at: SAT.getTime(), days: recapLessonsOfWeek(SEP) } };
  const u = untisRecap({ from: 20250901, to: 20260630, now: SAT, weeks, absences: ABSENCES, times: { lessons: [] } });
  // Both absences from the timetable: 100 + 200 minutes.
  assert.equal(u.absences.missedMinutes, 300);
  assert.ok(u.absences.rate > 0);
  assert.equal(u.absences.entries, 2);
  assert.equal(u.absences.openEntries, 1);
});

test('the recap counts absences exactly like the absences page (lib/absence-calc.ts)', () => {
  const weeks = { '2025-09-01': { at: SAT.getTime(), days: recapLessonsOfWeek(SEP) } };
  const recap = untisRecap({ from: 20250901, to: 20260630, now: SAT, weeks, absences: ABSENCES, times: TIMES }).absences;
  const cal = { v: 2, weeks: { '2025-09-01': { at: SAT.getTime(), days: calc.lessonsOfWeek(SEP) } } };
  const page = calc.absenceFigures(ABSENCES, cal, TIMES, 2025, SAT, false);
  assert.equal(recap.missedMinutes, page.minutes);
  assert.equal(recap.excusedMinutes, page.excusedMinutes);
  assert.equal(recap.possibleMinutes, page.possible);
  assert.equal(recap.rate, page.rate);
  // 100 school minutes + Thursday's 200; 19 lessons of 50 held (one cancelled).
  assert.equal(recap.missedMinutes, 300);
  assert.equal(recap.possibleMinutes, 950);
  // Where the minutes came from: Mathematik and Deutsch on Monday, Thursday's four lessons.
  assert.deepEqual(recap.bySubject.map((s) => [s.name, s.value]), [['Deutsch', 100], ['Mathematik', 100], ['Englisch', 50], ['Informatik', 50]]);
  assert.equal(recap.byWeekday[0], 100);
  assert.equal(recap.byWeekday[3], 200);
});

test('a double lesson shown as one entry counts as two lessons', () => {
  const week = { days: [{ date: '2026-03-02', gridEntries: [
    entry('2026-03-02', '08:00', '08:50', 'Deutsch'),
    entry('2026-03-02', '08:50', '10:30', 'Mathematik'),
    entry('2026-03-02', '10:45', '11:35', 'Englisch'),
  ] }] };
  const u = untisRecap({ from: 20260302, to: 20260302, now: NOW, weeks: { '2026-03-02': { at: 0, days: recapLessonsOfWeek(week) } } });
  assert.equal(u.school.lessons, 4);
  assert.equal(u.school.subjects[0].name, 'Mathematik');
  assert.equal(u.school.subjects[0].lessons, 2);
});

test('exams and homework still to come are not counted yet; each homework once', () => {
  const u = untisRecap({
    from: 20260101, to: 20260630, now: NOW, weeks: {},
    exams: [{ examDate: 20260215 }, { examDate: 20260520 }],
    homework: [{ id: 1, date: 20260210 }, { id: 1, date: 20260210 }, { id: 2, date: 20260601 }, { homeworkId: 3 }],
  });
  assert.equal(u.exams, 1);
  assert.equal(u.homework, 1);
});
