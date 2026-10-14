import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/popup-schedule.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { currentSlot, isDueIn, withSeen } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-10-01T08:00:00.000Z');

const once = (id, extra = {}) => ({
  id, revision: 1, title: id, html: '', showCount: 1, startsAt: null, endsAt: null, slotMs: null, ...extra,
});
const daily = (id, days = 7) => ({
  id, revision: 1, title: id, html: '', showCount: days,
  startsAt: new Date(T0).toISOString(), endsAt: new Date(T0 + days * DAY).toISOString(), slotMs: DAY,
});

test('closing a stack spends every popup in it, not only the one on screen', () => {
  const stack = [once('a'), once('b'), once('c')];
  let seen = withSeen({}, [stack[0]], T0); // only "a" was on screen
  assert.deepEqual(stack.map((p) => isDueIn(seen, p, T0)), [false, true, true]);
  seen = withSeen(seen, stack, T0); // closed with X
  assert.deepEqual(stack.map((p) => isDueIn(seen, p, T0 + 1000)), [false, false, false]);
});

test('re-marking a popup that was already on screen does not spend another showing', () => {
  const p = daily('d');
  const first = withSeen({}, [p], T0 + 1000);
  const again = withSeen(first, [p], T0 + 2000);
  assert.equal(again['d:1'].count, 1);
});

test('a recurring popup comes back once per slot and never after its window', () => {
  const p = daily('d', 3);
  let seen = withSeen({}, [p], T0 + 1000);
  assert.equal(isDueIn(seen, p, T0 + 2 * 60 * 60 * 1000), false); // same day
  assert.equal(isDueIn(seen, p, T0 + DAY + 1000), true); // next day
  seen = withSeen(seen, [p], T0 + DAY + 1000);
  seen = withSeen(seen, [p], T0 + 2 * DAY + 1000);
  assert.equal(seen['d:1'].count, 3);
  assert.equal(isDueIn(seen, p, T0 + 3 * DAY + 1000), false);
  assert.equal(currentSlot(p, T0 + 3 * DAY), null);
});

test('a new revision is unseen again', () => {
  const seen = withSeen({}, [once('a')], T0);
  assert.equal(isDueIn(seen, once('a', { revision: 2 }), T0 + 1000), true);
});

test('nothing is due before the start or after the end of its window', () => {
  const p = daily('d');
  assert.equal(isDueIn({}, p, T0 - 1000), false);
  assert.equal(isDueIn({}, once('e', { endsAt: new Date(T0).toISOString() }), T0), false);
});

test('entries older than a year are pruned when the record is written', () => {
  const seen = { 'old:1': { slot: 0, count: 1, at: T0 - 400 * DAY } };
  const next = withSeen(seen, [once('a')], T0);
  assert.equal('old:1' in next, false);
  assert.equal('a:1' in next, true);
});
