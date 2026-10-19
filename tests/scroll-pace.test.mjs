import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/scroll-pace.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const load = async (tuning) => {
  if (tuning === undefined) delete process.env.NEXT_PUBLIC_SCROLL_TUNING;
  else process.env.NEXT_PUBLIC_SCROLL_TUNING = tuning;
  // A fresh module each time, so the tuning is read again.
  return import(`data:text/javascript;base64,${Buffer.from(`${compiled}\n// ${Math.random()}`).toString('base64')}`);
};
const wheel = (deltaY, extra = {}) => ({ deltaY, deltaX: 0, deltaMode: 0, ...extra });

test('mouse wheels and trackpads are told apart', async () => {
  const { inputKind } = await load();
  assert.equal(inputKind(wheel(100, { wheelDeltaY: -120 }), 500), 'wheel', 'classic notch');
  assert.equal(inputKind(wheel(3, { deltaMode: 1 }), 10), 'wheel', 'Firefox mouse: lines');
  assert.equal(inputKind(wheel(-4, { wheelDeltaY: 12 }), 500), 'precise', 'Chromium/Safari trackpad');
  assert.equal(inputKind(wheel(12.5), 500), 'precise', 'fractional step');
  assert.equal(inputKind(wheel(8), 16), 'precise', 'quick stream of small steps');
  assert.equal(inputKind(wheel(6, { deltaX: 2 }), 500), 'precise', 'two axes at once');
  assert.equal(inputKind(wheel(100), 120), 'wheel', 'large step without legacy data');
});

test('the default feel is the slow glide, calmest in the opening flight', async () => {
  const { SCROLL } = await load();
  assert.ok(SCROLL.gear.wheel < 1 && SCROLL.gear.precise < 1, 'less than the browser moves');
  assert.ok(SCROLL.lerp.wheel < 0.1 && SCROLL.lerp.precise < 0.1, 'the page glides after the input');
  assert.ok(SCROLL.pace.hero < SCROLL.pace.features && SCROLL.pace.features < SCROLL.pace.page, 'hero calmest, carousel calmer than the rest');
});

test('tuning overrides single values and keeps the earlier lerp form working', async () => {
  const { SCROLL } = await load(JSON.stringify({ lerp: 0.2, gear: { precise: 1 }, stretch: { hero: 3 }, pace: { hero: -1 } }));
  assert.equal(SCROLL.lerp.wheel, 0.2);
  assert.equal(SCROLL.gear.precise, 1);
  assert.equal(SCROLL.stretch.hero, 3);
  assert.equal(SCROLL.pace.hero, 0.45, 'invalid values fall back to the default');
  const bad = await load('not json');
  assert.equal(bad.SCROLL.lerp.wheel > 0, true);
  await load(undefined);
});

test('scenes are stretched only for fine pointers', async () => {
  const { stretchCss, sceneHeight, FINE_POINTER } = await load();
  assert.match(stretchCss('.home'), new RegExp(`^@media ${FINE_POINTER.replace(/[()]/g, '\\$&')}\\{\\.home\\{--stretch-hero:`));
  assert.equal(sceneHeight('hero', 260), 'calc(260 * var(--lvh) * var(--stretch-hero, 1))');
});
