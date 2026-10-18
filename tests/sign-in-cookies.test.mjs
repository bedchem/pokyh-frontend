import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const transpile = async (path) => ts.transpileModule(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;

// The school list is configuration; a stand-in that accepts any well-formed school.
const schools = `
  export const defaultSchool = () => ({ loginName: 'default-school', server: 'default.webuntis.com' });
  export const parseSchool = (v) => v && typeof v.loginName === 'string' && typeof v.server === 'string'
    ? { loginName: v.loginName, server: v.server, ...(typeof v.name === 'string' ? { name: v.name } : {}) } : null;
`;
const crypto = await transpile('lib/session-crypto.ts');
const source = (await transpile('lib/server/sign-in-cookies.ts'))
  .replace("'@/lib/session-crypto'", `'${moduleUrl(crypto)}'`)
  .replace("'./schools'", `'${moduleUrl(schools)}'`);
const { sealRenewal, openRenewal, clearRenewal, RENEWAL_COOKIE, SESSION_COOKIE_OPTS } = await import(moduleUrl(source));
const { encryptSession } = await import(moduleUrl(crypto));

const school = { loginName: 'lbs-brixen', server: 'lbs-brixen.webuntis.com', name: 'LBS Brixen' };
const signIn = { username: 'anna.muster', password: 'geheim', school };

function response() {
  const set = new Map();
  return { set, cookies: { set: (name, value, opts) => set.set(name, { value, ...opts }) } };
}
const request = (cookies) => ({ cookies: { get: (name) => (name in cookies ? { value: cookies[name] } : undefined) } });

async function sealed(sign = signIn) {
  const res = response();
  await sealRenewal(res, sign);
  return res.set.get(RENEWAL_COOKIE).value;
}
const session = (data = {}) => encryptSession({ sessionId: 's1', username: 'anna.muster', school, loginAt: Date.now(), ...data });

test('the renewal cookie is httpOnly, only sent to the sign-in route and lives as long as the session', async () => {
  const res = response();
  await sealRenewal(res, signIn);
  const cookie = res.set.get(RENEWAL_COOKIE);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.path, '/api/webuntis/login');
  assert.equal(cookie.sameSite, 'strict');
  assert.equal(cookie.maxAge, SESSION_COOKIE_OPTS.maxAge);
  assert.ok(!cookie.value.includes('geheim') && !cookie.value.includes('anna'), 'sealed, not readable');
});

test('a session with its renewal cookie can be renewed', async () => {
  assert.deepEqual(await openRenewal(request({ [RENEWAL_COOKIE]: await sealed(), pokyh_session: await session() })), signIn);
});

test('without the session cookie (deleted, expired) there is nothing to renew', async () => {
  assert.equal(await openRenewal(request({ [RENEWAL_COOKIE]: await sealed() })), null);
  assert.equal(await openRenewal(request({ pokyh_session: await session() })), null);
  assert.equal(await openRenewal(request({})), null);
});

test('the renewal only belongs to its own session', async () => {
  const renew = await sealed();
  assert.equal(await openRenewal(request({ [RENEWAL_COOKIE]: renew, pokyh_session: await session({ username: 'someone.else' }) })), null);
  assert.equal(await openRenewal(request({ [RENEWAL_COOKIE]: renew, pokyh_session: await session({ school: { loginName: 'other', server: 'other.webuntis.com' } }) })), null);
  const hours = SESSION_COOKIE_OPTS.maxAge / 3600;
  assert.equal(await openRenewal(request({ [RENEWAL_COOKIE]: renew, pokyh_session: await session({ loginAt: Date.now() - (hours + 1) * 3600_000 }) })), null);
});

test('sessions from before schools renew at the default school only', async () => {
  const old = await session({ school: undefined });
  const atDefault = await sealed({ ...signIn, school: { loginName: 'default-school', server: 'default.webuntis.com' } });
  assert.equal((await openRenewal(request({ [RENEWAL_COOKIE]: atDefault, pokyh_session: old })))?.school.loginName, 'default-school');
  assert.equal(await openRenewal(request({ [RENEWAL_COOKIE]: await sealed(), pokyh_session: old })), null);
});

test('other sealed cookies and tampered values are refused', async () => {
  const current = await session();
  assert.equal(await openRenewal(request({ [RENEWAL_COOKIE]: current, pokyh_session: current })), null);
  const renew = await sealed();
  const tampered = renew.slice(0, -2) + (renew.endsWith('A') ? 'BB' : 'AA');
  assert.equal(await openRenewal(request({ [RENEWAL_COOKIE]: tampered, pokyh_session: current })), null);
});

test('signing out clears the renewal cookie on its own path', () => {
  const res = response();
  clearRenewal(res);
  const cookie = res.set.get(RENEWAL_COOKIE);
  assert.equal(cookie.value, '');
  assert.equal(cookie.maxAge, 0);
  assert.equal(cookie.path, '/api/webuntis/login');
});
