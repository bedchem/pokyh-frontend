# 2026-11-09 · The Mensa counts its plan weeks like the canteen

Factual log. No credentials or personal data are recorded here.
Repositories: `pokyh-backend` (815537b).

## What the owner asked for

- The Mensa is a week behind: make it run perfectly by itself, for the long
  run; look at how it works and at its history; use the Gemeinde Brixen's
  pages; test everything. No trace of AI in commits.

## Findings

- No public source says which plan week the canteen serves when: not the
  Gemeinde's pages (Menüpläne, Online-Einschreibungen), not the PDFs, not the
  canteen brochure, not the archived brixen.it pages (web.archive.org).
- The live API showed winter week 1 on 9 November 2026; the canteen served
  week 2. The layout of 4 November waited out the Allerheiligenferien
  (2 to 6 November) and started week 1 after them. Before 4 November the
  winter plan lay with week 1 on 2 November (calendar rolling), which matches
  the canteen.
- The layout shifted dishes relative to where they lay, so any error stayed
  for good, and two nodes laying out at once could shift twice.
- The server's week turned at midnight UTC, not in Brixen.

## What changed

- Each plan begins with week 1 in the first week of its season (the first
  Monday on or after 1 November / 1 April) and goes on every calendar week,
  holiday weeks included. Computed from the calendar alone
  (`src/utils/mensaCycle.ts`); "only school weeks" is a setting per menu.
- An administrator's correction ("this week is week N") holds until the next
  season; the panel shows this week's plan week, the count and corrections.
- Dishes are written onto absolute dates; dishes added by hand join the plan
  week of their day; `MENSA_TIMEZONE` (default Europe/Rome).
- The branch schools' and packed-lunch files are never taken for the
  canteen's own; mensa.json dates are read up to 9999.

## Verification

- Backend: `npm test` 467/467, `tsc`, admin build. Unit tests: the live menu
  of 9 November, ten years week by week, season starts for a hundred years.
- e2e with real processes and MySQL: Mensa 16/16, real Brixen sources and
  archive 10/10, two linked nodes 8/8, admin access 22/22; node logs without
  unexpected warnings.
- The live Gemeinde page and PDFs of 9 November parse: four lines, 30 dishes
  each, validity 1 November / 1 April.
- The new tests stay local (`.git/info/exclude`).

## Open

- Whether the canteen also counts the Christmas weeks: on 7 January 2027 the
  app shows week 4 (calendar count). If the canteen serves week 2, switch the
  panel to "Nur Schulwochen".
