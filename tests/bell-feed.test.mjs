import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// The bell's feed (lib/bell-feed.ts): what goes in, in which order, and which
// of it counts as new.
const source = await readFile(new URL('../lib/bell-feed.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const {
  buildFeed, streakMilestone, settleSeen, markSeen, freshKeys, readSeen, untisDay,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const H = 3_600_000;
const D = 24 * H;
// Tuesday 21 October 2026, 10:00 local time.
const now = new Date(2026, 9, 21, 10).getTime();
const midnight = new Date(2026, 9, 21).getTime();

const input = {
  grades: [
    { id: 1, subject: 'Mathe', lessonId: 7, value: 8, date: 20261020, examType: 'Test' },
    { id: 2, subject: 'Deutsch', lessonId: 8, value: 6.5, date: 20260901, examType: '' }, // too old
    { id: 3, subject: 'Englisch', lessonId: 9, value: 0, date: 20261021, examType: '' }, // no mark
  ],
  messages: [
    { id: 10, subject: 'Ausflug', sender: 'Huber', sent: now - 2 * H, read: false },
    { id: 11, subject: 'Alt', sender: 'Huber', sent: now - 5 * D, read: true },
  ],
  reminders: [
    { id: 'a', title: 'Bio-Test', remindAt: now + 5 * H, createdAt: now - D, by: 'anna', mine: false }, // soon
    { id: 'b', title: 'Ausflug', remindAt: now + 4 * D, createdAt: now - H, by: 'max', mine: false }, // new from a classmate
    { id: 'c', title: 'Meins', remindAt: now + 4 * D, createdAt: now - H, by: 'me', mine: true }, // own, not due
    { id: 'd', title: 'Vorbei', remindAt: now - D, createdAt: now - 3 * D, by: 'max', mine: false }, // past
  ],
  todos: [
    { id: 't1', title: 'Hausaufgabe', dueAt: now - 3 * H, done: false },
    { id: 't2', title: 'Referat', dueAt: now + 6 * H, done: false },
    { id: 't3', title: 'Erledigt', dueAt: now - H, done: true },
    { id: 't4', title: 'Später', dueAt: now + 3 * D, done: false },
    { id: 't5', title: 'Ohne Datum', dueAt: null, done: false },
  ],
  streak: { days: 8, end: midnight },
};

test('untisDay is local midnight', () => {
  assert.equal(untisDay(20261021), midnight);
});

test('the feed holds what is due and what happened, in order', () => {
  const feed = buildFeed(input, now);
  assert.deepEqual(feed.current.map((i) => i.key), [`todo:t1:${now - 3 * H}`, 'rem-soon:a', `todo:t2:${now + 6 * H}`]);
  assert.equal(feed.current[0].overdue, true);
  assert.equal(feed.current[2].overdue, false);
  assert.deepEqual(feed.recent.map((i) => i.key), ['rem:b', 'msg:10', 'grade:1', `streak:${midnight - 7 * D}:7`, 'msg:11']);
  assert.equal(feed.recent.find((i) => i.key === 'msg:11').settled, true);
  assert.equal(feed.recent.find((i) => i.key === 'grade:1').href, '/grades/subject/7');
});

test('the streak passes its milestones', () => {
  assert.equal(streakMilestone({ days: 2, end: midnight }), null);
  const m = streakMilestone({ days: 5, end: midnight });
  assert.equal(m.days, 3);
  assert.equal(m.start, midnight - 4 * D);
  assert.equal(m.at, midnight - 2 * D);
  assert.equal(streakMilestone({ days: 7, end: midnight }).at, midnight);
});

test('a first load only counts what is recent as new', () => {
  const feed = buildFeed(input, now);
  const empty = { keys: [], sources: [] };
  const settled = settleSeen(empty, feed, ['grades', 'messages', 'reminders', 'todos', 'streak'], now);
  // The 7-day milestone was reached yesterday: still new. The read message never counts.
  assert.deepEqual([...freshKeys(feed, settled)].sort(), [
    'grade:1', 'msg:10', 'rem-soon:a', 'rem:b', `streak:${midnight - 7 * D}:7`, `todo:t1:${now - 3 * H}`, `todo:t2:${now + 6 * H}`,
  ].sort());
  // Nothing new loaded: the same state comes back.
  assert.equal(settleSeen(settled, feed, ['grades'], now), settled);
});

test('old items of a source loaded for the first time are seen', () => {
  const later = now + 4 * D;
  const feed = buildFeed(input, later);
  const settled = settleSeen({ keys: [], sources: [] }, feed, ['grades', 'messages'], later);
  const fresh = freshKeys(feed, settled);
  assert.equal(fresh.has('grade:1'), false);
  assert.equal(fresh.has('msg:10'), false);
});

test('opening the bell sees everything; something newer is new again', () => {
  const feed = buildFeed(input, now);
  const seen = markSeen({ keys: [], sources: ['grades'] }, feed);
  assert.equal(freshKeys(feed, seen).size, 0);
  assert.equal(markSeen(seen, feed), seen);
  const next = buildFeed({ ...input, grades: [...input.grades, { id: 4, subject: 'Physik', lessonId: 5, value: 9, date: 20261021, examType: '' }] }, now);
  assert.deepEqual([...freshKeys(next, seen)], ['grade:4']);
});

test('a stored state that cannot be read starts empty', () => {
  assert.deepEqual(readSeen(null), { keys: [], sources: [] });
  assert.deepEqual(readSeen('nope'), { keys: [], sources: [] });
  assert.deepEqual(readSeen('{"keys":["a",3],"sources":["grades"]}'), { keys: ['a'], sources: ['grades'] });
});
