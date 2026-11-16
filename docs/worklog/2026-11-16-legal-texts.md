# 2026-11-16 · Legal texts checked against all POKYH repositories

Factual log. No credentials or personal data are recorded here.
Repositories read, not changed: `pokyh-backend` 78e7e41, `POKYH_IOS` b36ada5,
`POKYH_ANDROID` 03e6dd6, `FastProtect3.0`. Changed: `pokyh-frontend` only,
not committed.

## What the owner asked for

- Update the legal pages so POKYH is fully legal in Italy; read the other
  POKYH repositories and GitHub, ask when something is unclear.

## Owner's answers

- Dish photos: the team uploads its own photos; the texts describe photos on
  the POKYH server with removal on request.
- FastProtect is run by the team itself, all nodes in the EU.
- Backups stay local only (no S3, no other copy outside own servers).
- School-year archive: kept one year, deleted at the next rollover.

## Findings (what the texts said vs. the code)

| Topic | Old text | Actual |
| --- | --- | --- |
| Website hosting | Cloudflare Tunnel to own server | Cloudflare Workers (static assets); live headers `server: cloudflare`, NEL header set by Cloudflare |
| API path | Cloudflare Tunnel | Cloudflare proxy, then FastProtect, then the homelab (wiki: Network, FastProtect (102)) |
| iOS notifications | local only, no remote push | APNs push for messages, due to-dos and reminders (`ApnsDevice`, `services/pushNotices.ts`); title and reminder text in the payload |
| Web push | only unread message count | also due to-dos and class reminders |
| Android QR scan | Google Play code scanner, no camera access | own camera scanner (ZXing, `CAMERA` permission), on device only |
| App updates | both apps via GitHub API | only Android (GitHub releases, APK download) |
| Dish photos | hotlinked, never copied | copied into `dish_images` and served from api.pokyh.com (18 of 19 live on 2026-11-16) |
| Google Analytics | "may be used" | `NEXT_PUBLIC_GA_ID` not set live (`gaId: undefined` in the HTML) |
| School-year archive | no deletion period | still none in the backend |
| Backups | 7 days | dumps 7 days (`BACKUP_RETENTION_DAYS`, admin-changeable), binlogs 14 days (`PITR_RETENTION_DAYS`) |
| Recap, absences/excuses, profile picture | not mentioned | exist |
| Account deletion | e-mail only | self-service in the iOS and Android apps (`DELETE /users/me`) |
| Pokyh Learn notice | own page | Learn removed from the backend on 2026-10-28 |

## What changed

- `app/[lang]/(site)/legal/content.ts` (de, it, en), state 16 November 2026:
  - Privacy notice: new items for WebUntis messages/absences/profile picture
    (health data, Art. 9(2)(a) GDPR), recap, iOS push (APNs), FastProtect;
    rewritten web push, dish photos, Cloudflare, mobile apps, to-dos and
    reminders, local storage, recipients (Apple added, administrators under
    Art. 29 GDPR / Art. 2-quaterdecies Codice), third countries, retention
    (binlogs 14 days, server backups before maintenance at most 30 days,
    archive one year), rights (self-deletion, one-month answer), security.
  - Cookies: Art. 122(1) Codice and the Garante cookie guidelines of
    10 June 2021 as basis for necessary storage; new rows
    `pokyh_recapweeks_*`, `pokyh_grade_seen`, `pokyh_signed_out_elsewhere`,
    NEL (Cloudflare); `passkey_declined` is a setting; GA cookie text fixed.
  - Imprint: copyright section (iOS app MIT too, photos on own server,
    removal on request). Terms: school-year rollover, account deletion.
  - Pokyh Learn notice removed.
- Sections, blocks and rows can carry `when: 'analytics' | 'noAnalytics'`;
  `LegalViews.tsx` shows them by `lib/analytics-config.ts` (the same switch
  as the cookie banner). Without `NEXT_PUBLIC_GA_ID` no Google Analytics text
  is published.
- `lib/privacy-notice.ts`: version `2026-11-16`, so everyone is asked to
  acknowledge the notice again on the website and in the apps.
- Old Learn links: `/xx/legal/learn/` and `?view=learn` go to the overview
  (`LegacyViewRedirect.tsx`, `deploy/nginx.conf`, `public/_redirects`);
  removed from the sitemap (`lib/seo/pages.ts`).
- `lib/i18n/dictionaries/media.ts`: the photo note says "some photos".

## Checks

- `npx tsc --noEmit`, eslint on the changed files: clean.
- `npm test`: 83 of 83 pass.
- `npm run build`: static export in `out/`, `/xx/legal/learn` no longer
  built; the built privacy notice (de, it, en) has no Google Analytics,
  Tunnel, Google Play or Learn text; `/api/privacy-notice` answers
  `2026-11-16`.

## Open (owner)

- Replace the copied third-party dish photos (copyright, L. 633/1941); until
  then the texts are honest about it but the copies stay a legal risk.
- Delete the school-year archive at the next rollover (1 August 2027) or add
  a backend job; the text now promises one year.
- Server backups before maintenance: the vzdump files of 2026-11-05/06 (USB
  drive and pve01) contain the POKYH database; delete them or keep them
  within the 30 days the text states.
- FastProtect stats: IPs of refused traffic are kept up to 400 days
  (default `hourDays`); lower it if possible, then update the text.
- Cloudflare Network Error Logging: turn it off in Cloudflare if possible.
- Keep `BACKUP_RETENTION_DAYS` at 7 and `PITR_RETENTION_DAYS` at 14 in
  production, or change the text.
- Administrators: have each confirm confidentiality in writing.
- If Google Analytics is ever turned on: set its data retention to 14 months.
