# 2026-11-18 · Privacy notice: the Apple Watch on its own

Factual log. No credentials or personal data are recorded here.

## Why

The iOS app's watch now loads by itself over Wi-Fi or cellular when the
iPhone can't help, and signs in to the POKYH backend as a device of its own
(`POKYH_IOS`: `Watch/WatchSession.swift`, `PokyhCore/Watch/WatchBackend.swift`,
`WatchLoader.swift`). The notice said data kept "for the Apple Watch" never
leaves the device, which was already not true before: the phone hands the
watch the WebUntis password and the watch signed in to WebUntis for the
timetable.

## What the watch does (checked in the code)

| Topic | Actual |
| --- | --- |
| Consent | nothing goes to the watch before "Connect" (first prompt or Settings → Apple Watch); "Not now" signs the watch out |
| Hand-off | user name, school, WebUntis password or app key, kind of account (pupil, guardian, POKYH-only, WebUntis only), WebUntis person id (a guardian's child), last snapshot, language; over WatchConnectivity |
| Storage on the watch | Keychain, this device only (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`); snapshot sealed with AES-GCM in the watch's app group |
| Own loads | timetable and grades from the school's WebUntis server; to-dos, menu and ratings from the POKYH backend; ticks sent to the backend when the phone can't |
| POKYH session | own device id (`X-Pokyh-Device`), user agent `POKYH-iOS/<version> (watchOS <version>; <model>)`, sign-in with its own WebUntis session as a renewal (not in the sign-in history), POKYH-only accounts with password, no sign-in for accounts without a POKYH account |
| Device list | signing the watch out there keeps it out until the person connects it again on the phone |
| Leaving | sign-out on the phone, "Not now" or another account: the watch deletes account and data and calls `POST /auth/logout` |
| Statistics | no usage pings and no error reports from the watch; the backend's daily counts classify its user agent as the iOS app |

## What changed

- `app/[lang]/(site)/legal/content.ts` (de, it, en): new item "Apple Watch"
  under "Which data POKYH processes"; "Mobile apps" no longer says the watch's
  data stays on the device. Version 18 November 2026.
- `lib/privacy-notice.ts`: version `2026-11-18`, so the notice is shown once
  more on the website and in the apps.
- `lib/seo/pages.ts`: `lastModified` of `/legal` and `/legal/datenschutz`.

Terms of use and cookies: unchanged (the password still only goes to the
school's WebUntis server; the watch stores nothing in the browser).
