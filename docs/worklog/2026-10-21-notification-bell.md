# 2026-10-21 · A bell in the top bar: new grades, messages, reminders, due to-dos, the streak (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-21 · Pre-work checks

- `git status`: clean on `redesign` at `e83066b`.
- Release state: uncommitted

## 2026-10-21 · The bell

- Owner asked for a bell next to the messages in the top bar that shows new
  grades, to-dos/reminders and messages, like YouTube's bell, with the
  streak ("3 days streak", 7 …).
- `components/app/Bell.tsx`, placed in `AppShell`'s top bar right after the
  envelope (for every account; the envelope stays WebUntis-only). A count of
  what is new since the bell was last opened, in the same badge as the
  envelope's; the bell swings once when the count goes up and the badge pops
  in. Opening it counts everything as seen; what was new keeps a dot (and
  comes in one row after another) while the panel is open.
- The panel: the streak on top (flame, "N Tage in Folge", longest streak or
  "Schau heute vorbei, damit sie hält" when today is still missing, the last
  seven days as squares with today outlined); then what is due soon — open
  to-dos due within a day or overdue (up to 14 days), class reminders due
  within a day; then what happened in the last 14 days — new grades (mark in
  its pass/borderline/fail tone), inbox messages, reminders a classmate put
  up, and the streak's milestones (3, 7, 14, 21, 30, 50, 75, 100, …). Every
  row links to its page (grade → subject, message → message, reminders,
  to-dos, profile). Empty: the pixel bell with "Alles ruhig".
- Phones: the panel spans the screen under the top bar, above the bottom
  bar; from 640 px it hangs from the bell (392 px). Closes on a choice, a
  click elsewhere, Escape (focus back on the bell), leaving it with Tab or a
  new page.
- Data (`components/app/useBell.ts`): the stored grades and inbox at once,
  then WebUntis once per page load — grades only when the stored ones are
  older than the cache's 5 minutes (`areGradesStale` in `lib/api.ts`), the
  inbox shared with the unread badges' request; to-dos and the class's
  reminders from the backend; the streak from `GET /users/me/activity`
  (shared with the profile). Opening the bell reads the to-dos and reminders
  again (at most every 30 s); back in the tab after 5 minutes everything is
  read again. Reading messages updates the bell (`pokyh-messages-updated`).
- What was seen is remembered per account on the device
  (`pokyh_bell_seen_<username>`, keys only, at most 400). The first time a
  source is read on a device, only what is younger than three days counts as
  new, so the bell doesn't start with a full badge.
- Feed rules in `lib/bell-feed.ts` (pure); unit tests in
  `tests/bell-feed.test.mjs`.
- Texts in `lib/i18n/dictionaries/bell.ts` (de/it/en).
- Cookies and storage (`app/[lang]/(site)/legal/content.ts`, de/it/en):
  `pokyh_bell_seen_*` added as a setting next to `pokyh_popups_seen`.
- No backend change. The Android app is unchanged.
- Checks: `tsc --noEmit` clean, `eslint` clean on the changed files,
  `node --test tests/*.test.mjs` 44/44.
- Release state: uncommitted
