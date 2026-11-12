# 2026-11-12 · Pictures load in the apps again, Android builds its releases itself

Factual log. No credentials or personal data are recorded here.
Repositories: `pokyh-backend` 78e7e41, `POKYH_IOS` b36ada5, `POKYH_ANDROID`
03e6dd6, all pushed to `main`; `pokyh-frontend` unchanged apart from this entry.

## What the owner asked for

- Pictures from the backend no longer load: check all apps and fix it, API
  endpoints unchanged, nothing hardcoded, tested, security check, committed.
- Android: one GitHub workflow that builds and tests on every push, and on a
  published release sets the version from the tag and attaches the APK.
  Tested in Docker first. Secrets and variables are added by the owner.

## Findings

- Since 6334b24 every dish picture is in the database and named by path. The
  live server has no `PUBLIC_BASE_URL`, so `GET /dishes` answered
  `/dishes/<id>/image?v=…` for 20 of 28 dishes (checked 2026-11-11). The
  picture itself was served fine (200, `image/webp`).
- iOS: `URL(string:)` made a URL without a host from that path, so no dish
  showed a photo. This was the break.
- Android already put `Config.backendURL` in front of a path (since
  2026-09-10); the website puts its API address in front too. Neither was
  broken by the paths. Android was not run on a device (none on this Mac).

## What changed

- Backend (`src/utils/publicBase.ts`, `src/services/pictureBase.ts`): the
  menu and active popups get an address in front per request, after the
  shared cache: `PUBLIC_BASE_URL`, or else the HTTPS address of the request
  when its host is a `CORS_ORIGIN` host or below one. Otherwise, and over
  plain http, the path stays. `PUBLIC_BASE_URL` is checked before it goes into
  popup HTML. A pasted picture link with credentials is refused.
- iOS: `PokyhCore/Backend/BackendLink.swift` resolves backend links against
  `POKYH_BACKEND_URL` (https only; http only for a backend on http);
  `Dish.photoURL` is used for every dish photo, also for menus on disk.
  Dish photos load without cookies and only on a 2xx answer; a redirect
  away from the school's server no longer carries the WebUntis cookie.
- Android: `data/network/BackendUrls.kt` is the one resolver (scheme in lower
  case, other schemes dropped); popup HTML loads with the configured backend
  address instead of a hardcoded one.
- Android CI/CD (`.github/workflows/android.yml`): push to `main` and pull
  requests run the unit tests and a debug build without secrets; a published
  release `vX.Y.Z` builds, signs, checks and attaches `POKYH-X.Y.Z.apk` and
  its `.sha256`. Version, backend address and update repo come from
  `POKYH_VERSION_NAME`, `POKYH_BACKEND_URL`, `POKYH_UPDATE_REPO` (defaults
  unchanged). Secrets to add: `POKYH_KEYSTORE_BASE64`,
  `POKYH_KEYSTORE_PASSWORD`, `POKYH_KEY_ALIAS`, `POKYH_KEY_PASSWORD`,
  `POKYH_API_KEY`, `POKYH_SERVER_KEY`; optional variable
  `POKYH_SIGNING_CERT_SHA256`. Action SHAs checked against their tags.

## Security check

Three reviewers (backend, iOS, Android); their verifiers hit the usage
limit, so each finding was checked by hand.

- Fixed: a request host off the website's site (a proxy's upstream such as
  `app-blue:4000`, a forged `X-Forwarded-Host`) would have been named in the
  answer and could have broken the website's pictures. Now refused (e2e).
- Fixed: `PUBLIC_BASE_URL` unchecked inside popup HTML (operator only).
- Fixed (older than this work): iOS sent the WebUntis cookie on a redirect to
  another host. Reproduced with two local servers, gone with the fix.
- Fixed: iOS dish photos through `URLSession.shared` (cookies kept); plain
  http links in a release build; Android `HTTPS://` links Coil cannot load.
- Left as is, noted: popup pictures lose a path prefix of the backend address
  (`https://host/api`) in both apps; live has none. Android popup links open
  with ACTION_VIEW, iOS popup navigation of type `.other` is allowed; both
  need admin-written HTML.

## Tests

| What | Result |
| --- | --- |
| Backend unit (`npm test`) | 501/501 |
| Backend e2e `tests/cluster/pictureAddress.e2e.mjs` (MySQL 8.4 in Docker) | 5/5 |
| `tsc` backend and admin | clean |
| iOS `swift test` (PokyhKit) | 420/420 |
| iOS app and watch build (simulator) | exit 0 |
| iOS redirect probe (two local servers) | cookie only without the fix |
| Android `:app:testDebugUnitTest` | 16/16 |
| Android workflow in Docker (act 0.2.97, linux/amd64, throwaway keystore, fake token) | push: tests + debug APK pass without secrets; release `v2.2.1`: APK 2.2.1 / 20201 built, signed, checked, artifact kept, upload refused only for the fake token (401); bad tag and missing secrets fail as meant |
| Website `npm test` | 83/83 (no change) |

Tests are committed this time (owner's choice).

## Deploy notes

- Set `PUBLIC_BASE_URL=https://api.pokyh.com` on the server to be certain.
  Without it the address comes from the request only if the proxy chain
  passes `X-Forwarded-Proto: https` through `TRUST_PROXY`; not verified for
  live. Check after the deploy:
  `curl -s https://api.pokyh.com/dishes | jq -r '.menu.dishes[].imageUrl' | sort -u`
- act runs upload/download-artifact as v4 copies (its artifact server does not
  speak the protocol of v7/v8); on GitHub the pinned versions run. Two act
  jobs at once ran Docker out of memory (Gradle `-Xmx4096m` each); one at a
  time passes.
