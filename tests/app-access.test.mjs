import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/app-access.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { parseAppAccess, normaliseAppKey, looksLikeAppKey, webuntisLoginUrl, webuntisProfileUrl } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const school = { loginName: 'bergisches-bk', server: 'bergisches-bk.webuntis.com' };

test('the key alone, as WebUntis shows it', () => {
  assert.deepEqual(parseAppAccess('ABCDEFGHIJKLMNOP'), { key: 'ABCDEFGHIJKLMNOP' });
  assert.deepEqual(parseAppAccess('  abcd efgh ijkl mnop \n'), { key: 'ABCDEFGHIJKLMNOP' });
});

test("WebUntis' table copied whole, in German, English or Italian", () => {
  const de = 'Schulnummer:\t3262600\nSchule:\tbergisches-bk\nURL:\tbergisches-bk.webuntis.com\nBenutzer:\ts36782\nSchlüssel:\tABCDEFGHIJKLMNOP';
  assert.deepEqual(parseAppAccess(de), { user: 's36782', key: 'ABCDEFGHIJKLMNOP' });
  assert.deepEqual(parseAppAccess('User: anna.muster\nKey: QRSTUVWXYZ234567'), { user: 'anna.muster', key: 'QRSTUVWXYZ234567' });
  assert.deepEqual(parseAppAccess('Utente: anna\nChiave: QRSTUVWXYZ234567'), { user: 'anna', key: 'QRSTUVWXYZ234567' });
});

test("the QR code's link", () => {
  const link = 'untis://setschool?url=bergisches-bk.webuntis.com&school=bergisches-bk&user=s36782&key=ABCDEFGHIJKLMNOP&schoolNumber=3262600';
  assert.deepEqual(parseAppAccess(link), { user: 's36782', key: 'ABCDEFGHIJKLMNOP' });
});

test('anything else gives nothing', () => {
  assert.deepEqual(parseAppAccess('geheim'), {});
  assert.deepEqual(parseAppAccess(''), {});
  assert.equal(normaliseAppKey('ABCDEFGH01890000'), '');
});

test('a saved key filled into the password field is recognised, a password is not', () => {
  assert.equal(looksLikeAppKey('ABCDEFGHIJKLMNOP'), true);
  assert.equal(looksLikeAppKey('Sommer2026!'), false);
  assert.equal(looksLikeAppKey('abcdefghijklmnop'), false);
});

test('the links lead to the school in WebUntis', () => {
  assert.equal(webuntisLoginUrl(school), 'https://bergisches-bk.webuntis.com/WebUntis/?school=bergisches-bk#/basic/login');
  assert.equal(webuntisProfileUrl(school), 'https://bergisches-bk.webuntis.com/WebUntis/?school=bergisches-bk#/basic/profile');
});
