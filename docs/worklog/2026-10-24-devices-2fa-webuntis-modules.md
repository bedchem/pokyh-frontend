# 2026-10-24 · Devices & sign-ins, two-factor sign-in, WebUntis account settings, missed hours, deleting messages, holidays, data download

Factual log. No credentials, personal data or request bodies are recorded here.
Repositories: `pokyh-frontend`, `pokyh-backend`, `POKYH_ANDROID`.

## Pre-work checks

- `pokyh-frontend` `git status`: clean on `main` at `1de42ba`.
- `pokyh-backend` `git status`: clean at `c57250f`.
- `POKYH_ANDROID` `git status`: clean.
- Release state: uncommitted in all three; the owner deploys the backend.

## Survey of WebUntis (owner signed in himself)

- Walked every menu of the school's WebUntis (Heute, Übersicht, Mitteilungen,
  Stundenpläne, Abwesenheiten, Hausaufgaben, Klassenbuch, Dienste, Prüfungen,
  Noten, Profil) and noted the API calls each makes; compared with
  `pokyh-backend/src/routes/webuntis.ts`.
- Owner chose: two-factor sign-in, the WebUntis profile settings, device
  sessions with a login history (instead of Untis Mobile's device sign-out),
  the official missed hours, deleting messages, named holidays; later added a
  data download ("Daten anfordern") and an admin view of the sessions.
- Endpoints taken from WebUntis' own web app: `api/profile/general`
  (GET/POST), `api/profile/languages`, `api/profile/access` (GET),
  `api/profile/access/totp/create` (POST), `api/profile/access/totp`
  (POST/DELETE), `j_spring_security_check` (form login with `token`),
  `api/rest/view/v1/messages?ids=` (DELETE) and `…/messages/{id}` (DELETE),
  `api/classreg/absencetimes/student`, JSON-RPC `getHolidays`.

## Backend

- Device sessions (`src/services/sessions.ts`, `sessionDevice.ts`): one
  `refresh_tokens` row per device instead of one per account; the refresh
  token rotates in place; the row id is the access token's `sid`. Devices are
  recognised by the refresh token they hold, the app's `X-Pokyh-Device`
  header or the website's new `pokyh_device` cookie. New columns: device id,
  client, platform, OS, browser, model, IP, country/region/city (Cloudflare
  headers), last use. Signing a device out marks it revoked: its access
  tokens and the website's WebUntis cookie stop at once (`isSessionRevoked`,
  cluster effect on `refresh_tokens`), and its automatic sign-in answers
  `session_revoked`. Cleanup after `SESSION_IDLE_DAYS` (60).
- Login history: new table `login_events` (sign-ins by the person only, not
  renewals), kept `LOGIN_HISTORY_DAYS` (90). Older apps without a device id
  are counted only when they open a new session.
- Routes: `GET /auth/sessions`, `DELETE /auth/sessions/:id`,
  `POST /auth/sessions/sign-out-others`, `GET /auth/login-history`,
  `GET /users/me/export` (JSON of everything POKYH keeps; no password hash,
  token hashes or push keys; 5 per hour).
- Admin: `GET /api/admin/sessions` now one entry per person with their
  devices; `DELETE /api/admin/sessions/user/:stableUid`,
  `GET /api/admin/sessions/user/:stableUid/logins`; "sign everyone out" marks
  sessions revoked instead of deleting them. Admin `SessionsPage` rebuilt:
  person rows with a device count, expand for devices (place, IP, last use),
  sign out one or all, sign-ins on demand.
- WebUntis: `GET/PUT /webuntis/account` (e-mail, language, messages by
  e-mail; the app key in WebUntis' answer is never passed on),
  `POST /webuntis/account/two-factor/setup` (secret + QR SVG to the browser
  only), `POST|DELETE /webuntis/account/two-factor`, sign-in with `token`
  through the WebUntis form (`src/webuntis/webLogin.ts`; `two_factor_required`
  / `two_factor_invalid`), `GET /webuntis/absences/times`,
  `GET /webuntis/holidays`, `DELETE /webuntis/messages?ids=`.
- `AppError` carries an optional `code`; CORS allows `X-Pokyh-Client`.
- Verification: `tsc --noEmit` clean; `npm test` 261 pass, 4 fail — the
  same 4 cluster installer/relay/update tests that check Unix file modes and
  fail on this Windows machine (untouched code); new unit tests for device
  parsing, the form login's answers, missed hours and holidays pass. Admin UI
  `tsc` and `vite build` clean.

## Website

- Settings: groups Darstellung · Konto (profile, WebUntis e-mail, messages by
  e-mail, WebUntis language) · Sicherheit (Geräte & Anmeldungen, two-factor
  sign-in, password) · Mitteilungen · Datenschutz (+ "Meine Daten
  herunterladen") · Speicher · Über.
- New page `/settings/devices`: this device, other devices with ✕, "Alle
  anderen abmelden", login history.
- Two-factor sheet: explanation → QR code and key → code → done; turning off
  asks once. Login: a code step after the password when WebUntis asks.
- Absences: each absence's minutes from the school's own figures where there,
  new "Pro Fach" panel; the rate's whole still comes from the timetable.
- Messages: select and delete in the inbox; delete in an opened message.
- Holidays: names worked out by date (`lib/holidays.ts`), shown on the
  timetable's free days and as "Herbstferien in 8 Tagen" on the home page.
- Texts in de/it/en; Ladin falls back to German for the new keys.
- Verification: `tsc --noEmit` and `eslint` on the changed files clean.

## Android

- `DeviceInterceptor`: `User-Agent: POKYH-Android/<version> (Android <x>;
  <maker> <model>)` and a random `X-Pokyh-Device` id, backend requests only.
- Sign-ins with the stored password send `renewal: true`; a
  `session_revoked` answer signs the account out (its stored password goes).
- Verification: `gradlew :app:compileDebugKotlin` succeeds.

## Second pass (owner: "finish it completely")

- Privacy policy (`app/[lang]/(site)/legal/content.ts`, de/it/en): new
  entries "Angemeldete Geräte und Anmeldeverlauf" (what is stored, purpose,
  Art. 6(1)(b)/(f), 60/90 days) and "Zwei-Faktor-Anmeldung und
  WebUntis-Einstellungen" (passed through to WebUntis only, the secret is
  neither stored nor logged); the data download under the rights; retention
  section; cookie `pokyh_device` in both cookie tables; date 24 October 2026.
  `PRIVACY_NOTICE_VERSION` raised to `2026-10-24`, so the notice is shown
  once more on the website and in the apps.
- Ladin (Gherdëina) for every new text: devices/security, holidays, the
  login code step, absences' per-subject panel, deleting messages. Written
  without a native speaker; worth a check.
- Login page: a browser signed out from another device says so once
  (`session_revoked` noted by `lib/api.ts`, shown by `LoginForm`).
- Android: two-factor sign-in. `UntisClient.login(…, token)` signs in through
  WebUntis' sign-in form with the code; a refused JSON-RPC sign-in (other than
  a wrong password) asks the form whether a code is needed
  (`TwoFactorRequiredException`). `AppState` keeps the request in memory and
  `TwoFactorDialog` at the app root asks for the code — also after a
  fingerprint unlock or a relaunch. Strings de/it/en.
  `gradlew :app:compileDebugKotlin` succeeds.
- Local test stack for the owner (nothing installed system-wide): official
  MySQL 8.4.10 zip (checksum verified) in the session's scratchpad on port
  3407 with an empty database, the backend from the working tree on port
  4400 (development settings passed as environment variables, no `.env`
  written), the frontend from a separate worktree copy on port 3020
  (`next dev --webpack`, `API_DEV_PROXY_TARGET` to the local backend). The
  schema applied itself on start (new columns and `login_events` present).
- Verification: frontend `tsc` and `eslint` on the changed files clean;
  production build of the changes in an isolated worktree succeeded
  (147 pages, `/settings/devices` in every language).

## Open

- Live test with the owner's account on the local stack, then two-factor
  sign-in once the owner has turned it on (the JSON-RPC answer for such an
  account is not known yet).
