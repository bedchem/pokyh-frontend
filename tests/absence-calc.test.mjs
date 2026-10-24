import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/absence-calc.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { absenceFigures, hasWholeYear, lessonsOfWeek, possibleMinutes, refreshLessonCalendar, schoolYearWeeks } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

// A device's storage for the kept weeks.
const store = new Map();
globalThis.window = { localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) } };

const lesson = (date, start, end, extra = {}) => ({
  duration: { start: `${date}T${start}`, end: `${date}T${end}` },
  position2: [{ current: { shortName: 'M' } }],
  ...extra,
});

// Five days, Monday to Friday, with two 50-minute lessons each.
function week(monday) {
  const [y, m, d] = monday.split('-').map(Number);
  const days = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(y, m - 1, d + i);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    days.push({ date: iso, gridEntries: [lesson(iso, '08:00', '08:50'), lesson(iso, '08:50', '09:40')] });
  }
  return { days };
}

test('a week: groups at the same time count once, cancelled lessons and breaks not at all', () => {
  const days = lessonsOfWeek({
    days: [{
      date: '2026-10-12',
      gridEntries: [
        lesson('2026-10-12', '08:00', '08:50'),
        lesson('2026-10-12', '08:00', '09:40'),
        lesson('2026-10-12', '10:00', '10:50', { status: 'CANCELLED' }),
        { duration: { start: '2026-10-12T09:40', end: '2026-10-12T09:55' }, position2: [] },
      ],
    }],
  });
  assert.deepEqual(days, { 20261012: [[480, 580]] });
  assert.equal(lessonsOfWeek(null), null, 'not a week: not kept as one without lessons');
  assert.equal(lessonsOfWeek({ error: 'x' }), null);
});

test('the whole counts the lessons from 1 September that have ended', () => {
  const now = new Date(2026, 8, 9, 8, 55); // Wednesday 9 September, after the first lesson
  const weeks = schoolYearWeeks(2026, now);
  assert.deepEqual(weeks, ['2026-08-31', '2026-09-07']);
  const cal = { v: 2, weeks: Object.fromEntries(weeks.map((m) => [m, { at: now.getTime(), days: lessonsOfWeek(week(m)) }])) };
  // 31 Aug is before the year; 1–4 Sep: 4 days × 100; 7–8 Sep: 2 × 100; today one lesson.
  assert.equal(possibleMinutes(cal, 2026, now), 4 * 100 + 2 * 100 + 50);
});

test('a week that did not load leaves no rate, and is asked for again next time', async () => {
  store.clear();
  const now = new Date(2026, 9, 24, 12, 0);
  const weeks = schoolYearWeeks(2026, now);
  let running = 0;
  let most = 0;
  const failing = new Set([weeks[3]]);
  const fetchWeek = async (monday) => {
    running++;
    most = Math.max(most, running);
    await new Promise((r) => setTimeout(r, 1));
    running--;
    if (failing.has(monday)) throw new Error('HTTP 502');
    return week(monday);
  };

  const first = await refreshLessonCalendar(7, 2026, fetchWeek, [], now);
  assert.ok(most <= 3, 'a few weeks at a time');
  assert.equal(hasWholeYear(first, 2026, now), false);
  const absences = [{ id: 1, startDate: 20261012, endDate: 20261012, startTime: 800, endTime: 940, isExcused: true, hours: 2 }];
  assert.equal(absenceFigures(absences, first, null, 2026, now).rate, null);

  failing.clear();
  let asked = [];
  const second = await refreshLessonCalendar(7, 2026, async (m) => { asked.push(m); return fetchWeek(m); }, [], now);
  assert.deepEqual(asked, [weeks[3]], 'only the missing week');
  assert.equal(hasWholeYear(second, 2026, now), true);

  const a = absenceFigures(absences, second, null, 2026, now);
  const b = absenceFigures(absences, second, null, 2026, now);
  assert.equal(a.possible, b.possible, 'the same figures every time');
  assert.equal(a.minutes, 100);
  assert.ok(a.rate > 0);
});

test('missed minutes: the school\'s own first, then the timetable, then hours × 50', () => {
  const now = new Date(2026, 9, 24, 12, 0);
  const cal = { v: 2, weeks: { '2026-10-12': { at: now.getTime(), days: lessonsOfWeek(week('2026-10-12')) } } };
  const absences = [
    { id: 1, startDate: 20261012, endDate: 20261012, startTime: 800, endTime: 850, isExcused: false, hours: 1 },
    { id: 2, startDate: 20261013, endDate: 20261013, startTime: 0, endTime: 0, isExcused: true, hours: 2 },
    { id: 3, startDate: 20261020, endDate: 20261020, startTime: 0, endTime: 0, isExcused: true, hours: 3 },
  ];
  const f = absenceFigures(absences, cal, { lessons: [{ absenceId: 1, minutes: 45 }] }, 2026, now);
  assert.equal(f.perAbsence.get(1), 45);
  assert.equal(f.perAbsence.get(2), 100);
  assert.equal(f.perAbsence.get(3), 150, 'its week is not kept');
  assert.equal(f.minutes, 295);
  assert.equal(f.excusedMinutes, 250);
});

test('the whole year counts every lesson up to 30 June, also those still to come', () => {
  const now = new Date(2026, 8, 9, 8, 55);
  const sofar = schoolYearWeeks(2026, now);
  const all = schoolYearWeeks(2026, now, true);
  assert.equal(all.at(-1), '2027-06-28');
  const cal = { v: 2, weeks: Object.fromEntries(sofar.map((m) => [m, { at: now.getTime(), days: lessonsOfWeek(week(m)) }])) };
  assert.equal(hasWholeYear(cal, 2026, now, true), false, 'the weeks to come are not kept yet');
  for (const m of all) cal.weeks[m] ??= { at: now.getTime(), days: lessonsOfWeek(week(m)) };
  assert.equal(hasWholeYear(cal, 2026, now, true), true);
  assert.ok(possibleMinutes(cal, 2026, now, true) > possibleMinutes(cal, 2026, now) * 10);
  const absences = [{ id: 1, startDate: 20260908, endDate: 20260908, startTime: 0, endTime: 0, isExcused: true, hours: 2 }];
  const sofarRate = absenceFigures(absences, cal, null, 2026, now).rate;
  const yearRate = absenceFigures(absences, cal, null, 2026, now, true).rate;
  assert.ok(yearRate < sofarRate);
});
