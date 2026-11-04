# 2026-11-04 · The Mensa runs by itself

Factual log. No credentials or personal data are recorded here.
Repositories: `pokyh-backend` (63715c0), `pokyh-frontend` (9f2c6d0).

## What the owner asked for

- "Next week" showed the wrong date at the end of October (the summer plan's
  next weeks lay in April); at the switch to winter the next week should
  already show the winter plan.
- Check when the holidays are, wait them out, then go on with the plan; work
  alone and autonomously; switchable between manual and autonomous (default
  autonomous); pull the current plan and convert it; upload dish pictures by
  hand; research the Mensa of LBS Brixen / Tschuggmall and the last ten
  years; test everything; keep the new tests out of the commits.

## Research

- The LBS Tschuggmall eats at the Mensa St. Michael of the Gemeinde Brixen
  (gemeinde.brixen.bz.it, "Ausspeisungsdienst: Menüpläne"). Its plans: six
  weeks Monday to Friday plus a vegetarian menu; since 2025 a summer plan
  (1 April – 31 October) and a winter plan (1 November – 31 March), until
  2024/25 one plan a year (web.archive.org, 2016/17 to 2024/25).
- The mensa.json the live menu came from is the summer plan; the live winter
  plan held it too, seven dishes differ from the real winter plan.
- School calendar of South Tyrol: Beschluss der Landesregierung Nr. 75 of
  23 January 2012 (also for the Berufsbildung), changed by Nr. 8 of
  14 January 2025 (the Monday before a free Tuesday is free). Checked against
  the printed calendars 2015/16 to 2034/35; 4 October is a holiday since 2026
  (Legge 151/2025).

## What changed

- Backend: plans change on the canteen's dates or with the clocks; autonomous
  layout on school weeks with holidays waited out (official calendar,
  WebUntis holidays per school, days per menu); pull from a mensa.json, a PDF
  or the Gemeinde's page, by itself or by hand, vegetarian menu included;
  dish picture uploads; stricter source fetching; admin panel for all of it.
- Frontend: the Mensa page names the breaks; uploaded pictures load from the
  API and are not hidden with outside photos.

## Verification

- Backend: `npm test` 427/427, `tsc`, admin build; e2e with real processes and
  MySQL: Mensa 12/12, real Brixen sources and archive 10/10, two linked nodes
  7/7, push 14/14; replication suite 19/26 (the 7 left fail on the class
  check of 05e566a, as before this work); production image (Node 22 Alpine)
  reads the real PDFs; schema upgrade on a database with data, no loss.
- Frontend: `npm test` 83/83, `eslint`, `next build`.
- Playwright with the bundled Chromium: admin dish page and the public Mensa
  page against a real backend, 1280 px and 390 px, no console errors.
- The new tests stay local (`.git/info/exclude`).

## After the deploy

- Admin, Speiseplan: source page of the Gemeinde Brixen and "Mensa St.
  Michael", then "Jetzt holen". Set PUBLIC_BASE_URL so the apps find uploaded
  pictures.
