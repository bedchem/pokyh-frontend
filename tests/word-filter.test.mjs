import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/word-filter.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { createWordFilter } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

// The lists as the app uses them (lib/mascot-filter.ts): all languages at once.
const lists = await Promise.all(['de', 'it', 'en', 'lld'].map(async (l) => JSON.parse(await readFile(new URL(`../lib/word-lists/${l}.json`, import.meta.url), 'utf8'))));
const isOffensive = createWordFilter({ anywhere: lists.flatMap((l) => l.anywhere), asWord: lists.flatMap((l) => l.asWord) });

test('catches swear words and slurs in German, Italian and English', () => {
  for (const name of ['arschloch', 'Hurensohn', 'fick dich', 'cazzo', 'vaffanculo', 'stronzo99', 'fuck', 'motherfucker', 'bitch', 'hitler']) {
    assert.equal(isOffensive(name), true, name);
  }
});

test('also when written with digits, signs, repeats or spaced out', () => {
  for (const name of ['f*ck', 'sh1t', 'a.r.s.c.h', 'fuuuuck', 'Sch3isse', 'c4zz0', 'b!tch', 'f i c k', 'sch**sse']) {
    assert.equal(isOffensive(name), true, name);
  }
});

test('short words only on their own', () => {
  assert.equal(isOffensive('cock'), true);
  assert.equal(isOffensive('culo'), true);
  assert.equal(isOffensive('max.shit'), true);
});

test('leaves ordinary names and words alone', () => {
  for (const name of ['mus-anna', 'Hancock', 'Scunthorpe', 'calcolo', 'Glasser', 'Dick', 'peacock', 'Cassandra', 'Assisi', 'Sextus', 'analisa.rossi', 'Pistorius', 'plattner.felix', 'anna2009', 'Mongolfiera', 'Matteo Troiani', '']) {
    assert.equal(isOffensive(name), false, name);
  }
});

test('a deployment can add words and free names', () => {
  const custom = createWordFilter({ anywhere: ['badword'], asWord: ['cock'], allow: ['cock'] });
  assert.equal(custom('my-badword-99'), true);
  assert.equal(custom('cock'), false);
});

test('every list entry is plain lowercase letters, as the filter expects', () => {
  for (const [i, l] of lists.entries()) {
    for (const w of [...l.anywhere, ...l.asWord]) assert.match(w, /^[a-z]+$/, `${['de', 'it', 'en', 'lld'][i]}: ${w}`);
  }
});
