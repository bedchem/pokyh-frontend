# 2026-10-26 · Recap full screen and timetable on computers

Factual log. No credentials or personal data are recorded here.
Repository: `pokyh-frontend`. Follows `2026-10-25-recaps.md`.

## What the owner asked for

- Recap: works well on phones; on computers it should look as good, full
  screen.
- Timetable: on computers it looks squeezed; there it may scroll, on phones
  not. Phones stay exactly as they are.

## Recap (`components/recap/`)

- No card in the middle of the screen any more: the story is full screen
  everywhere. Phones (< 640 px, or upright) unchanged.
- Wide screens (`(min-width: 640px) and (min-aspect-ratio: 4/5)`, `WIDE` in
  `RecapStory.tsx`, the same query in `recap.module.css`): the text in a
  column on the left, centred in the sky; the mascot large in the right
  column, standing on the ground that runs across the screen; the buttons on
  the ground on the right, the keys (← → blättern, Esc schließen) on the left
  where there is a mouse. Sizes follow the screen's height, from a phone on
  its side (ranking in two columns) to 2560 × 1440. The figure's pixel size
  comes from `figureSize()` (height / 36, 9 … 40).
- Last page, wide: the poster standing on the ground, the settings that were
  behind "Anpassen" in a panel beside it, the buttons below the panel
  (`RecapSummary.tsx`, `wide`).
- Upright tablets: the phone layout with more room.
- Page turns: blocks sized on the shorter side (`pixelWipe.ts`), so a wide
  screen gets square blocks; unchanged on phones.
- Particles grow with `--k` (1 on phones).
- New texts `keysTurn`, `keysClose` (de, en, it).

## Timetable (`app/[lang]/(app)/timetable/`)

- From 1024 px (`DESKTOP_QUERY` in `page.tsx`, WeekGrid's `roomy`): a minute
  is 1.6 … 2.1 px tall, so a lesson keeps subject, teacher and room with room
  around them; a day longer than the window scrolls in the grid under the day
  names and fades out at the window's edge. The week reaches down to the
  window's edge (the 874 px cap for tall windows is gone). A day opened
  later than the view reaches starts at the current time. The wheel over the
  title or the week switch scrolls the grid. Teacher and room a little
  larger.
- Below 1024 px nothing changes.

## Verification

- Playwright with the bundled Chromium against `next dev` on :3012 (:3011 was
  held by the `pokyh-lh` nginx container): recap via `/de/dev-recap/` at
  390 × 844, 768 × 1024, 700 × 700, 844 × 390, 1024 × 768, 1280 × 720,
  1366 × 768, 1440 × 900, 1920 × 1080, 2560 × 1440, with and without reduced
  motion; timetable with a mocked session and API at 1024 … 2560 px, light
  and dark, short and long days.
- Phones unchanged, by pixel comparison against the previous code: recap all
  16 pages at 390 × 844; timetable at 320, 360, 390, 400, 430, 768 and 844
  (on its side) px, light and dark — no pixel differs.
- `tsc --noEmit`, `eslint .`, `npm test` 77/77, `next build` (static export,
  no dev-recap page, no local addresses).
