# 2026-11-09 · The Mensa runs one round of weeks; the PDFs' dates pick the plan per day

Factual log. No credentials or personal data are recorded here.
Repositories: `pokyh-backend` (988ebde, on top of 815537b).

## What the owner asked for

- Afternoon: the autonomous Mensa still does not work: today (9 November
  2026) the canteen served "Nudel pasticciata". Learn how it really counts,
  make it work, test everything.
- Evening: "Why do you skip week 1, nothing fits together anymore." In the
  admin panel week 1 did not show at all, and the dish shown for today was not
  the one served. Asked how the canteen counts: "what is always in the top
  right corner of the PDF: extract it, make an algorithm that checks and
  enters it by itself."

## Findings

- "Nudeln pasticciata mit Erbsen" stands only once in the four PDFs of the
  Mensa St. Michael: Monday of week 3. So the canteen served week 3 on 9
  November. 815537b (week 1 = first Monday on or after 1 November) gives week
  2 there: "Gebratene Huhnschenkel", the wrong dish the panel showed, and week
  1 lay in the holiday week, so the panel never showed it.
- The afternoon fix (week 1 in the week 1 November falls in, every plan
  starting over at its season) only fitted by putting winter week 1 into
  26-30 October, when the PDFs' own dates ("1. April bis 31. Oktober") still
  say summer plan. In most other years it puts winter week 1 wholly into the
  Allerheiligenferien (2027: the app would start the winter with week 2).
- One round of weeks 1 to 6 that never starts over fits every data point
  without that: week 1 on 30 March 2026 (the owner's mensa.json), week 6 on 19
  October, week 1 on 26 October (summer dishes), week 2 in the holidays, week
  3 on 9 November (winter dishes). The summer and winter PDFs are the same six
  weeks with 8 of 30 dishes swapped.
- All four live PDFs say "1. April bis 31. Oktober" / "1. November bis 31.
  März"; the dates fit together.

## What changed

- `src/utils/mensaCycle.ts`: one count for both plans. It goes from an anchor
  the server stores itself at the first layout (week 1 in the week the season
  under way began: 26 October 2026) and keeps; an administrator's correction
  is a newer anchor that holds across every change of plan. Counting only
  school weeks moves the anchor up every three weeks, so the count never rests
  on WebUntis holidays that are no longer on record.
- `src/utils/mensaSeason.ts`: the season goes by the day's date. In a week the
  plans change in, each day takes the dishes of its own plan (31 March 2027
  winter, 1 April summer, both week 5).
- `src/utils/mensaPdf.ts`, `src/services/mensaSource.ts`: the top right corner
  is read whole (from and to), kept per source line
  (`mensa_menu_sources.validity`, new column), and checked: summer's end and
  winter's start must meet, and each vegetarian menu must run as long as its
  plan. A file taken over before the dates were kept is read once more. New
  dates lay the plan out anew and refresh the public menu at once.
- Admin panel: "Diese Woche" says where the count goes from; the texts
  describe the round; "Planwechsel" shows the PDFs' dates and any mismatch;
  a week's badge names the days of the other plan. The next school days take
  each day's own plan.
- README and schema comments.

## Verification

All against MySQL 8.4.13 in Docker (the production line).

- `npm test` 478/478. New unit tests with the real PDFs: week 3 on 9
  November, week 1 with summer dishes in the week of 26 October, the owner's
  mensa.json running on to week 3 on 9 November, ten years week by week
  (every school day the round's week from the plan of its date), a hundred
  years without a restart, corrections, the PDF dates and their check.
- Deploy rehearsal (`tests/cluster/mensaUpgrade.e2e.mjs`) from the state of
  815537b and, with `MENSA_UPGRADE_FROM=c0eca10`, from the one before: 4/4
  each. `GET /dishes` for 9 November answers pasticciata and safran risotto,
  the anchor is written once, 120 dishes and the uploaded picture are kept, a
  restart moves nothing, the log has no warning.
- Mensa e2e 16/16, PDF import 11/11 (incl. a wrong date put right by the next
  pull and a mismatch named in the panel), two nodes 8/8, cluster suite 66/66,
  admin access 22/22.
- Admin panel looked at in headless Chrome with production-like data: "Woche
  3 · Winterplan · Woche 1 ab 26.10.2026", the weeks 3, 4, 5, 6, 1, 2; the
  summer tab shows week 5 on 29 March 2027 with "Mo–Mi Winterplan".
- `tsc` for backend and admin, admin `vite build`: clean.
- Not run: account, push and updater suites (their code is not touched).
- The Mensa tests stay local (`.git/info/exclude`).

## Open

- 7 January 2027: the app shows "Pennette mit Meeresfrüchten" (week 5). If
  the canteen serves "Käsepressknödel auf Käsesauce mit Reis" (week 4), it
  skips the closed Christmas week: set a correction in the panel.
- 31 March 2027: the app shows week 5 ("Wienerschnitzel (Truthahn) mit
  Bratkartoffeln", still winter), 1 April summer week 5. If the canteen serves
  "Rindsgulasch mit Polenta" (week 1) on 31 March, it starts over at the
  change of plan after all: set a correction.
- Deploy: neither 815537b nor 988ebde is live yet (not pushed at the time of writing). After the deploy the
  first `GET /dishes` stores the anchor and lays the plan out; the PDFs' dates
  appear in the panel after the next pull (or "Jetzt holen").
