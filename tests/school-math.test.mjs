import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/school-math.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { GRADE_SCALES, parseGrade, parseWeight, weightedAverage, neededGrade, isPassing, absenceStats, parseAmount } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const { it, de, de15 } = GRADE_SCALES;

test('reads grades as people write them', () => {
  assert.equal(parseGrade('7', it), 7);
  assert.equal(parseGrade('7,5', it), 7.5);
  assert.equal(parseGrade(' 6+ ', it), 6.25);
  assert.equal(parseGrade('6-', it), 5.75);
  assert.equal(parseGrade('6½', it), 6.5);
  assert.equal(parseGrade('6/7', it), 6.5);
  assert.equal(parseGrade('6+', it, 0.5), 6.5);
});

test('plus means better, also where 1 is the best grade', () => {
  assert.equal(parseGrade('2+', de, 0.3), 1.7);
  assert.equal(parseGrade('2-', de, 0.3), 2.3);
});

test('rejects what is not a grade on the scale', () => {
  assert.equal(parseGrade('11', it), null);
  assert.equal(parseGrade('0', it), null);
  assert.equal(parseGrade('7', de), null);
  assert.equal(parseGrade('6/8', it), null);
  assert.equal(parseGrade('abc', it), null);
  assert.equal(parseGrade('', it), null);
  assert.equal(parseGrade('0', de15), 0);
});

test('weights default to 1 and must be positive', () => {
  assert.equal(parseWeight(''), 1);
  assert.equal(parseWeight('0,5'), 0.5);
  assert.equal(parseWeight('0'), null);
  assert.equal(parseWeight('-1'), null);
});

test('weighted average', () => {
  assert.equal(weightedAverage([]), null);
  assert.equal(weightedAverage([{ value: 6, weight: 1 }, { value: 8, weight: 1 }]), 7);
  assert.equal(weightedAverage([{ value: 6, weight: 1 }, { value: 9, weight: 2 }]), 8);
});

test('grade needed for a target average', () => {
  const grades = [{ value: 5, weight: 1 }, { value: 6, weight: 1 }];
  assert.deepEqual(neededGrade(grades, 6, 1, it), { kind: 'grade', value: 7 });
  assert.deepEqual(neededGrade(grades, 9, 1, it), { kind: 'impossible' });
  assert.deepEqual(neededGrade([{ value: 9, weight: 3 }], 6, 1, it), { kind: 'any' });
  // 1 is best: average 3 and 4, target 3 -> needs a 2 or better
  assert.deepEqual(neededGrade([{ value: 3, weight: 1 }, { value: 4, weight: 1 }], 3, 1, de), { kind: 'grade', value: 2 });
  assert.deepEqual(neededGrade([{ value: 5, weight: 2 }], 1.5, 1, de), { kind: 'impossible' });
});

test('passing depends on the direction of the scale', () => {
  assert.equal(isPassing(6, it), true);
  assert.equal(isPassing(5.9, it), false);
  assert.equal(isPassing(4, de), true);
  assert.equal(isPassing(4.1, de), false);
});

test('absences in percent and hours left before the limit', () => {
  assert.deepEqual(absenceStats(100, 1000, 25), { absentPct: 10, hoursLeft: 150 });
  assert.deepEqual(absenceStats(250, 1000, 25), { absentPct: 25, hoursLeft: 0 });
  assert.deepEqual(absenceStats(260, 1000, 25), { absentPct: 26, hoursLeft: -10 });
  assert.equal(absenceStats(10, 999, 25).hoursLeft, 239);
  assert.equal(absenceStats(10, 0, 25), null);
  assert.equal(absenceStats(20, 10, 25), null);
});

test('amounts accept comma and point', () => {
  assert.equal(parseAmount('12,5'), 12.5);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('-3'), null);
});
