import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// The canteens of the public Mensa page (lib/mensa.ts): reading pokyh-backend's
// answers and the search over canteens and schools.
const source = await readFile(new URL('../lib/mensa.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { canteensFrom, menuOwner, canteenMatches, canteenOf, schoolLabel } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const answer = {
  canteens: [
    { id: 'm1', name: 'Mensa Tschuggmall', schools: [{ slug: 'lbs-brixen', name: 'LBS Tschuggmall', shortName: 'Tschuggmall' }] },
    { id: 'm2', name: 'Mensa Bozen', schools: [{ slug: 'fs-bozen', name: 'Fachschule Bozen', shortName: '' }, { slug: 'gym-bozen', name: 'Gymnasium Bozen', shortName: 'Gym' }] },
    { id: 'm3', name: 'Without schools', schools: [] },
    { id: 4, name: 'Bad id', schools: [{ slug: 'x', name: 'X' }] },
  ],
};

test('reads the canteens and drops what is not one', () => {
  const list = canteensFrom(answer);
  assert.deepEqual(list.map((c) => c.id), ['m1', 'm2']);
  assert.equal(list[1].schools.length, 2);
  assert.deepEqual(canteensFrom(null), []);
  assert.deepEqual(canteensFrom({ error: 'unavailable' }), []);
  assert.deepEqual(canteensFrom({ canteens: 'nope' }), []);
});

test('names whose menu an answer is, if the backend says', () => {
  const owner = menuOwner({ available: true, canteen: { id: 'm1', name: 'Mensa Tschuggmall' }, school: { slug: 'lbs-brixen', name: 'LBS Tschuggmall', shortName: 'Tschuggmall' }, menu: { dishes: [] } });
  assert.deepEqual(owner.canteen, { id: 'm1', name: 'Mensa Tschuggmall' });
  assert.equal(owner.school.slug, 'lbs-brixen');
  // An older backend names nothing.
  assert.deepEqual(menuOwner({ available: true, menu: { dishes: [] } }), { canteen: null, school: null });
  assert.deepEqual(menuOwner(undefined), { canteen: null, school: null });
});

test('searches canteens by their name and their schools, ignoring case and accents', () => {
  const [brixen, bozen] = canteensFrom(answer);
  assert.equal(canteenMatches(brixen, ''), true);
  assert.equal(canteenMatches(brixen, 'tschugg'), true);
  assert.equal(canteenMatches(brixen, 'LBS'), true);
  assert.equal(canteenMatches(bozen, 'gymnasium'), true);
  assert.equal(canteenMatches(bozen, 'fachschule bozen'), true);
  assert.equal(canteenMatches(bozen, 'bózen'), true);
  assert.equal(canteenMatches(bozen, 'tschugg'), false);
  // Every word must be found.
  assert.equal(canteenMatches(bozen, 'bozen tschugg'), false);
});

test('finds the canteen of a school and its everyday name', () => {
  const list = canteensFrom(answer);
  assert.equal(canteenOf(list, 'gym-bozen')?.id, 'm2');
  assert.equal(canteenOf(list, 'unknown'), null);
  assert.equal(canteenOf(list, null), null);
  assert.equal(schoolLabel(list[0].schools[0]), 'Tschuggmall');
  assert.equal(schoolLabel(list[1].schools[0]), 'Fachschule Bozen');
});
