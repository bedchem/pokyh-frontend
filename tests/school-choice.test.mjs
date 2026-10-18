import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/school-choice.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { schoolChoiceExpiry, readSchoolChoice, saveSchoolChoice, forgetSchoolChoice, SCHOOL_CHOICE_KEY } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const DAY = 24 * 60 * 60 * 1000;

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

test('a choice made during the school year lasts until 31 August', () => {
  const now = new Date(2026, 9, 17, 12, 0, 0); // 17 Oct 2026
  const end = new Date(schoolChoiceExpiry(now));
  assert.equal(end.getFullYear(), 2027);
  assert.equal(end.getMonth(), 7);
  assert.equal(end.getDate(), 31);
});

test('a choice made in spring ends with this school year', () => {
  const now = new Date(2027, 2, 1, 9, 0, 0); // 1 Mar 2027
  const end = new Date(schoolChoiceExpiry(now));
  assert.equal(end.getFullYear(), 2027);
  assert.equal(end.getMonth(), 7);
});

test('close to the end of the school year it still lasts 30 days', () => {
  const now = new Date(2027, 7, 20, 9, 0, 0); // 20 Aug 2027
  assert.ok(schoolChoiceExpiry(now) - now.getTime() >= 30 * DAY - 1000);
});

test('save, read back and forget', () => {
  globalThis.localStorage = memoryStorage();
  const school = { loginName: 'lbs-brixen', server: 'lbs-brixen.webuntis.com', name: 'BBZ Ch. J. Tschuggmall', address: '39042, Brixen' };
  saveSchoolChoice(school);
  assert.deepEqual(readSchoolChoice(), school);
  forgetSchoolChoice();
  assert.equal(readSchoolChoice(), null);
});

test('an expired or tampered entry is dropped', () => {
  globalThis.localStorage = memoryStorage();
  localStorage.setItem(SCHOOL_CHOICE_KEY, JSON.stringify({ v: 1, loginName: 'x', server: 'x.webuntis.com', name: 'X', address: '', expires: Date.now() - 1 }));
  assert.equal(readSchoolChoice(), null);
  assert.equal(localStorage.getItem(SCHOOL_CHOICE_KEY), null);
  localStorage.setItem(SCHOOL_CHOICE_KEY, JSON.stringify({ v: 1, loginName: 'x', server: 'evil host/', name: 'X', address: '', expires: Date.now() + DAY }));
  assert.equal(readSchoolChoice(), null);
  localStorage.setItem(SCHOOL_CHOICE_KEY, '{not json');
  assert.equal(readSchoolChoice(), null);
});
