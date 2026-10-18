import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/school-week.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { currentWeekMonday, parseRollover, calendarMonday } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const day = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Week of Monday 12 Oct 2026 … Sunday 18 Oct 2026.
const at = (date, h, m = 0) => new Date(2026, 9, date, h, m);

test('during the week, this week is the calendar week', () => {
  assert.equal(day(currentWeekMonday(at(12, 8))), '2026-10-12');
  assert.equal(day(currentWeekMonday(at(16, 23, 59))), '2026-10-12', 'Friday night');
  assert.equal(day(currentWeekMonday(at(17, 16, 59))), '2026-10-12', 'Saturday before 17:00');
});

test('from Saturday 17:00 the next week is this week', () => {
  assert.equal(day(currentWeekMonday(at(17, 17, 0))), '2026-10-19');
  assert.equal(day(currentWeekMonday(at(18, 18, 12))), '2026-10-19', 'Sunday evening (the screenshot)');
  assert.equal(day(currentWeekMonday(at(19, 7, 50))), '2026-10-19', 'Monday morning');
});

test('the moment is configurable and falls back on nonsense', () => {
  assert.deepEqual(parseRollover('0 12:30'), { day: 0, minute: 750 });
  assert.deepEqual(parseRollover('7 10:00'), { day: 6, minute: 1020 });
  assert.deepEqual(parseRollover('6 25:00'), { day: 6, minute: 1020 });
  assert.deepEqual(parseRollover(undefined), { day: 6, minute: 1020 });
  const sundayNoon = { day: 0, minute: 12 * 60 };
  assert.equal(day(currentWeekMonday(at(17, 20), sundayNoon)), '2026-10-12', 'Saturday evening, rollover on Sunday');
  assert.equal(day(currentWeekMonday(at(18, 12), sundayNoon)), '2026-10-19');
  assert.equal(day(calendarMonday(at(18, 12))), '2026-10-12');
});
