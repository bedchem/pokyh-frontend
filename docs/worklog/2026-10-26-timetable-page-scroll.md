# 2026-10-26 · Timetable on computers: the page scrolls

Factual log. No credentials or personal data are recorded here.
Repository: `pokyh-frontend`. Follows `2026-10-26-recap-timetable-desktop.md`.

## What the owner asked for

- Timetable: scrolling down looked odd (a box scrolling inside a page that
  stood still); when scrolling down the top should simply go away. Make it
  look good and professional.

## Timetable (`app/[lang]/(app)/timetable/`)

- From 1024 px (`data-roomy` on the page, WeekGrid's `roomy`): a long day no
  longer scrolls inside the grid. The page scrolls, as the other pages do:
  title and menus leave at the top, the week switch and the day names stay
  there (`position: sticky`), and the lessons fade out as they pass under the
  day names (`--under`, 0 … 1 over the first 24 px, set on scroll). No more
  inner scrollbar and no fade at the window's bottom edge.
- The day names stop right under the week switch: its height is measured
  (`measureStick` in `page.tsx`, `--tt-stick`). The switch's background
  reaches over the gaps above and below it.
- The weeks in the pager are in the flow there, as tall as the shown week
  (at least the window, for loading and error states); the weeks beside it
  are cut to it (`overflow: clip`), so swiping keeps the day names stuck in
  both weeks and the scroll position stays when the week changes.
- The size of a minute is worked out as before (the room the window leaves
  under the day names with nothing scrolled), so the unscrolled week looks
  as it did.
- A day opened later than the window reaches scrolls the page so that now is
  a third down the room under the day names; only the shown week does this.
- A lesson reached with Tab comes into view below the day names
  (`scroll-padding-top`).
- The wheel handler that scrolled the grid from over the title is gone (the
  page scrolls by itself).
- Below 1024 px nothing changes.

## Verification

- Playwright with the bundled Chromium against `next dev` on :3012, mocked
  session and API: 1024 × 768, 1024 × 600, 1100 × 460, 1280 × 720,
  1440 × 900, 1920 × 1080, 2560 × 1440, light and dark, short and long days;
  wheel, keyboard and trackpad week changes while scrolled, a mouse drag
  between weeks, the year menu over the stuck switch, a lesson opened while
  scrolled (no jump), a slow week (skeleton fills the window), opening at
  13:10 and 14:40, resizing between 1440 and 900 px, and touch scrolling and
  swiping at 1180 × 820.
- Unscrolled, 1280 and 1440 px are the same as before up to anti-aliasing
  (at most 8/255) apart from the removed fade at the bottom.
- Phones and tablets unchanged, by pixel comparison against the previous
  code: 320, 390, 430, 768, 844 (on its side) and 1023 px, light and dark,
  short and long days — no pixel of the timetable differs.
- `tsc --noEmit`, `eslint .`, `npm test` 77/77, `next build` (static export,
  no local addresses).
