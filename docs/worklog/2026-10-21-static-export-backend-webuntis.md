# 2026-10-21 · Static website, WebUntis in the backend, Redis read cache, database recovery (frontend `redesign`, backend `main`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-21 · Pre-work checks

- Frontend: `git status` clean on `redesign` at `4e361cf`.
- Backend: `git status` clean on `main` at `0a515db`.
- Release state: uncommitted (both repositories)

## 2026-10-21 · Owner decisions

- Website hosting: both prepared — nginx container (same port 3011) and
  Cloudflare Pages files.
- Redis caches POKYH data and public WebUntis data only; no personal
  WebUntis answers (privacy notice unchanged).
- Database: extend the existing cluster (second location) instead of MySQL
  replication; add off-site backups, point-in-time recovery, automatic rebuild.
- MySQL target 8.4 LTS (8.0 is end of life since April 2026).
- One re-login of every website user after the switch is accepted (the
  sign-in cookies move from pokyh.com to api.pokyh.com).
- Backend: `tsc --noEmit` allowed for verification; later "fix all errors":
  local Prisma client regenerated for the type check, the two new pure unit
  test files run.

## 2026-10-21 · Backend: WebUntis for the website (`/webuntis/*`)

- All former Next route handlers (`app/api/webuntis/*`) ported one to one to
  `src/routes/webuntis.ts` with helpers in `src/webuntis/` (client, schools,
  session cookies, sealing, renewal, account class, app data, absences,
  messages). Same answers, codes and German texts as before.
- Sign-in at `POST /webuntis/login` creates the POKYH session directly
  (`completeWebUntisLogin`, `loginSchool` exported from `routes/auth.ts`);
  no `SERVER_KEY` involved for the website. The apps' server-to-server login
  is unchanged.
- Cookies (httpOnly, host-only on the API, Secure, SameSite=Strict), names
  and lifetimes as in the privacy notice: `pokyh_session` (sealed WebUntis
  session, 4 h), `pokyh_renew` (sealed sign-in, path `/webuntis/login`, 4 h),
  `pokyh_api_refresh` (30 days). Sealing: AES-256-GCM, key from
  `WEBUNTIS_SESSION_SECRET` or derived from `JWT_SECRET` (shared by every node).
- `/auth/web/local-login`, `/register`, `/refresh`, `/logout`: cookie variants
  of the existing auth routes (shared functions, existing routes unchanged).
- Reads of `/webuntis/*` need only the cookie (pictures, PDFs); writes also
  need `X-API-Key`. Binary answers carry `Cross-Origin-Resource-Policy:
  same-site`. Login limits: 60 per address / 5 min, 10 per account / 15 min.
- `/push/register` reads the WebUntis session from the cookie when the body
  has none (apps keep sending it).
- CORS preflight cache: `maxAge` 7200 s.
- Tests: `tests/webuntisAccountClass.test.mjs`, `tests/webuntisRenewal.test.mjs`
  (ported from the frontend's tests) — 13/13 pass.

## 2026-10-21 · Backend: Redis read cache (`src/services/cache.ts`)

- Entries stored under per-table versions; every Prisma write (middleware in
  `src/db.ts`, nested writes and cascades included), raw SQL (tables parsed
  from the statement, unknown → all), cluster-applied rows
  (`cluster/effects.ts`) and restores raise versions. Process-memory fallback
  without Redis; `CACHE_ENABLED` switch.
- Cached: menu (`/dishes`), popups (30 s, `now` fresh), to-dos, reminders,
  reminder comments, dish comments and votes, subject image list, WebUntis
  school search (10 min, as in the privacy notice).
- Redis bounded (`--maxmemory 256mb`, `volatile-lru`: version keys never evicted).

## 2026-10-21 · Backend: backups and recovery (`docs/database.md`)

- Backups: `BACKUP_INTERVAL_HOURS` (hourly possible), SHA-256 manifest per dump,
  verified before every restore; schema re-synced and cache dropped after a
  restore.
- Off-site copies (`src/services/offsite.ts`): AES-256-GCM encrypted upload to
  any S3-compatible bucket (SigV4), retention, newest dump kept;
  `npm run decrypt-backup`. Off until configured.
- Start-up rebuild (`src/services/dbHeal.ts`): a database without tables on a
  node that had data (backups or state file) restores the newest valid backup
  before use; `DB_AUTO_RESTORE=off|local|offsite`.
- Point-in-time recovery: `db-archiver` service (`deploy/db/archiver.sh`, same
  MySQL image) keeps base dumps with binlog position and closed binary logs;
  `deploy/db/pitr-restore.sh` rebuilds a moment in a temporary server and
  writes a new backup file for the admin panel (live database untouched).
  The official MySQL image ships no `mysqlbinlog`, so the replay uses MySQL's
  replication applier.
- MySQL 8.4.10 in `docker-compose.yml` and `deploy/node/compose.yml`: new
  volume `mysql84_data`, the 8.0 volume mounted read-only and copied on the
  first start, upgraded in place; `--mysql-native-password=ON` for the backup
  account; `stop_grace_period: 2m`. Test harnesses moved to 8.4.10.
- Verification: `npx tsc --noEmit` 0 errors (after `prisma generate`).
- Not verified (no local Docker, backend never run locally): the upgrade
  path, the archiver and the PITR restore — to be checked once on the server.

## 2026-10-21 · Frontend: static export

- `next.config.ts`: `output: 'export'` for builds; in development `next dev`
  passes the API's paths on to the API (cookies on localhost).
- Removed: all `app/api/*` except the static `privacy-notice` (apps) and
  `legal/contact`; `proxy.ts`; server-only modules (`lib/server/*` except the
  build-time menu read, session crypto, server session, WebUntis helpers).
- `lib/backend.ts`: API address, the page's own cookies (`pokyh_user`,
  `pokyh_api_token`). `lib/api.ts` maps the former `/api/webuntis/…` keys to
  the API (`credentials: 'include'`, API key on writes only, so reads need no
  preflight); Mensa reads go to `/dishes`, `/dish-ratings`, `/dish-comments`.
- Language of addresses without one: `lib/locale-redirect.ts` in the root
  `index.html` and `404.html`; nginx does it on the server. Old `?view=` legal
  links: nginx and `LegacyViewRedirect`. Guests in the app's Mensa go to the
  public one (`AuthGuard guests="mensa"`). Redirects to `/login` keep the
  language and the way back (`loginPath`).
- Detail pages with an id built once for `_`; `lib/route-id.ts` reads the real
  id; nginx and `_redirects` serve every id from that page (navigation data
  is keyed by parameter name, so client navigation works too).
- `deploy/nginx.conf` + `deploy/nginx-headers.conf` (headers, redirects,
  language, id pages, caching); `public/_headers`, `public/_redirects` for
  Cloudflare Pages. Dockerfile: Node build stage → unprivileged nginx on 3011.
- Fix after the first beta deploy (beta.pokyh.com, nginx behind Cloudflare):
  the id rules also caught the message list's own navigation files
  (`/messages/index.txt`, `/messages/__next.*`) and tried the `_` folder,
  which redirected to itself (`ERR_TOO_MANY_REDIRECTS`, messages tab not
  clickable, `grades/subject/_/` prefetch failing). Ids are now dot-free
  segments only, the `_` page is served as a file, never a folder; the same
  for `public/_redirects`. Checked against a local server with the same rules.
- Service worker polls messages at the API address sent by the page.
- Console: no preloads nobody uses (fonts not preloaded, small logos lazy or
  low priority, avatar only for a signed-in account).
- Samsung Internet showed mixed colours with the "System" theme (its own
  dark filter over the light theme): `<meta name="color-scheme" content="light
  dark">` and `color-scheme: only light` for the light theme.
- Developer-tools greeting (`lib/console-secret.ts`): the self-XSS warning
  and the `pokyh.help()` tip removed (owner's request), greeting "Servus!" /
  "Ciao!" / "Hi there!". The command list appears on every developer-tools
  shortcut (at most once in 3 s), caught in the capture phase, also when the
  shortcut comes before the lazy install (`lib/devtools-key.ts`).
- Development only (`components/DevConsoleQuiet.tsx`): "[Fast Refresh]",
  "[HMR]" and React's DevTools tip are dropped from the browser console;
  warnings and errors untouched; not in the built website.
- Lint fixes: unused router leftovers, `ThemeProvider` reads the stored theme
  as an external store, `AppProvider` starts its sign-in check after render.
- Verification: `next build` (144 pages) ok, `eslint` 0 problems, `npm test`
  37/37.
- Release state: uncommitted. Deploy order: backend first (the current
  website keeps working with it), then the static website.

## 2026-10-21 · Live streams answered 429

- Symptom after the static switch: `/sse/todos`, `/sse/reminders/*` and
  `/sse/dish-ratings` answered 429; the console repeated "connection lost,
  reconnecting..." while live updates had in fact stopped.
- Cause: the browser now opens the streams straight at the API, and the
  backend's `sseLimiter` allowed 10 new streams a minute per address, shared
  by everyone at a school. The browser also never retries an EventSource
  after an error answer (429, 401) and retries network drops with the old
  address, whose token expires after an hour.
- Backend: `sseLimiter` mounted after `requireAuth` and counted per account
  (`sse:<stableUid>`), default `RATE_LIMIT_SSE_MAX` 30 (`.env.example`
  updated); `globalLimiter` still bounds each address.
- Website: one `liveStream()` in `lib/api-client.ts` for all six streams. Any
  error closes the stream and opens a new one with a current token, waiting
  2 s doubling to 5 min, randomly spread; a successful open resets the wait.
  The misleading warnings are gone.
- Verification: `tsc --noEmit` ok in both repositories, `eslint` ok on
  `lib/api-client.ts`. Not run against a backend (no local backend testing).
- Release state: uncommitted. Deploy the backend and raise
  `RATE_LIMIT_SSE_MAX` in the server's `.env` if it still says 10.
