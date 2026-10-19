# 2026-10-19 · Pixel art as sprites, sign-in mascot, sidebar (branch `redesign`)

Factual log. Nothing was committed or pushed.

## Sidebar (signed in)

- Top row: the logo, and on its right the way back to the public website
  (new icon, `ArrowSquareUpLeft`). Bottom: language, light/dark and folding
  in one row; the profile with the settings beside it
  (`components/app/AppShell.tsx`, `.head` / `.me` in `shell.module.css`).
  Folded, each pair stands in a column; the language button now fills the
  column (it sat on the left).
- The light/dark button moved from the top bar into the sidebar (the top
  bar's one showed only where the sidebar is anyway).
- The fold button no longer keeps a hover background while the sidebar is
  open (`[aria-expanded]` style limited to buttons with a menu).
- `next.config.ts`: the development badge sits bottom right, so it no longer
  covers the profile and settings.

## Pixel art as sprites

- New small sprite engine in `components/pixel/`: `sprite.ts` (pixel grid,
  shapes, shading with outline and light from the top left, dithering, a
  3 × 5 pixel font), `palette.ts` (five tones per material from the site's
  tokens, `light-dark()` where the themes differ; injected once per page as a
  hoisted `<style>`), `SceneSvg.tsx` (one path per tone, crisp edges).
- `PixelState` scenes redrawn on a 40 × 25 grid (`components/pixel/states.ts`):
  plug and socket, magnifier over a page, padlock, cactus and tumbleweed,
  beach with umbrella and waves, sun in sunglasses with a drifting cloud,
  calendar with a cross, waving flag, two arrows. Same API; shown at
  160 px (compact 120 px), compact timetable cards 80 px.
- Their animations moved from `app.css` to `globals.css` (`.px-*`), so the
  public Mensa dish page animates them too.
- 404 (`components/pixel/notFound.ts`, `Pixel404.tsx`): chunky digits standing
  out towards the bottom right; a round little ghost (white, dark outline,
  cool blue shade, shiny eyes, cheeks, tongue, waving stubs, scalloped hem)
  that looks at the 404. The 404 brings its own styles, so the standalone
  document (`app/global-not-found.tsx`) no longer keeps a copy.

## Sign-in page

- The site's normal bar on top (`SiteHeader`); the page's own small header
  (back link, language, theme) is gone.
- Beside the form (desktop) a school hallway drawn for the panel's size
  (`components/pixel/hallway.ts`, about 112 rows): lockers in the tile tones,
  one open (books, bag, POKYH sticker), a window with clouds by day and moon
  and stars in the dark theme, a cork board with timetable and Mensa menu, a
  clock showing the time, the door of room 2B, tiled floor.
- The mascot (`components/pixel/mascot.ts`): an indigo block with mitts and
  stubby legs. Reactions (`app/[lang]/login/Hallway.tsx`): magnifier while
  the school is searched ("!" with results, "?" without), wave and
  "Hallo, <name>!" while the name is typed, hands over the eyes for the
  password (peeking when it is shown; the open locker shuts), wide eyes and a
  thumb up when the browser fills the form (autofill animation hook in
  `globals.css`, or saved credentials), a wobble with a drop of sweat and
  "Hoppla!" at an error, a cheer on success. Otherwise it breathes, blinks and
  follows the pointer with its eyes; each key makes it hop.
- Phones: the mascot small above the title instead of the letter tiles.
- `NameTiles.tsx` and the tile styles were removed; bubble texts in
  `loginDict` (de/it/en).

## Verification

- `tsc --noEmit` passes; ESLint clean on the changed files (one older warning
  in the timetable page); `npm test` 41/41.
- Browser (dev server, desktop): sidebar open and folded, Mensa dish page
  with the magnifier scene, 404, sign-in page in both themes, name and
  password poses, autofill reaction. No console errors.
- Not seen in the browser: the phone layout of the sign-in page (the window
  could not be resized), the remaining state scenes in their pages, the
  standalone 404 document.
