# 2026-10-19 · Room 2B behind the sign-in door, header, support banner, phone account menu (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-19 · Pre-work checks

- `git status`: clean on `redesign` at `9cfc775` (the previous round's frontend
  changes were committed by the owner in that commit). `pokyh-backend`:
  `src/routes/dishes.ts` and `src/services/schools.ts` still uncommitted from the
  previous round, untouched now. Open pull requests (`gh pr list`): none.
- Release state: uncommitted

## 2026-10-19 · Smaller items

- Header (`components/site/SiteHeader.tsx`): the places are centred in the bar
  again (columns `minmax(max-content,1fr) auto minmax(max-content,1fr)`); below
  about 1366 px they move left only as far as the buttons need. Measured at
  1024–1920 px in de/it/en (centred from 1366/1440, never overlapping).
- "POKYH unterstützen" also on the About page, under the team (blush look;
  `SupportBanner` got a `tone` prop). Checked light, dark, phone.
- Phones (app): the picture in the top bar opens the same account menu as the
  folded sidebar (profile, settings, light/dark, start page, sign out,
  language) instead of linking to the profile. Checked signed in with fixture
  data, light and dark (opens, closes on a choice, outside tap, Escape).
- Release state: uncommitted

## 2026-10-19 · Room 2B (secret classroom)

- The hallway door on `/login` (and, on phones, the same door drawn beside the
  small mascot) is a button: hover/focus show it a crack open, a click opens
  it in steps, the view zooms through it and the classroom appears (lazy
  loaded `components/room`, View Transition where available). The address
  gets `#2b` (`#2b/snacks`, `#2b/tablet`, `#2b/bag` for the parts), so the
  browser's back button and a reload work; the sign-in form stays as it was
  underneath. "Zurück" returns to the sign-in page, the door shuts, the mascot
  waves.
- Classroom (`components/pixel/classroom.ts`): window with weather (sun,
  clouds, rain, snow) and night sky in the dark theme, poster, light switch,
  chalkboard with changing chalk, clock (real time), globe, bookshelf, vending
  machine, teacher's desk with apple, bin, desks with notebook and tablet,
  backpack, the mascot (shared `components/pixel/MascotFigure.tsx`). 14 hidden
  discoveries, mascot reactions incl. a rare golden moment and an angry one
  after many quick clicks. Pans on narrow screens.
- Vending machine: 12 items for fictional gold stars (snacks, hats, glasses,
  special eyes, decorations), keypad codes, dispensing animation, occasional
  stuck item (shake), rare crown, secret code (the room number) for a disco
  ball. Bought decorations stand in the room, worn items are worn by the
  mascot in the room and on the sign-in page.
- Tablet: a handheld with five playable games (Memory, quick maths, pixel
  catch, timetable challenge, slide puzzle), each with rules, play, result;
  1–3 stars per round by fixed thresholds, stars = gold stars, +2 once for the
  first three stars in a game, trophy for three stars in all five. Arrows,
  A/B, SELECT/START on screen, keyboard (arrows/WASD, Enter/Space, Backspace/
  Escape, P) and touch.
- Backpack: wear/decorate, discoveries, records, snacks eaten, delete
  progress.
- Storage: `pokyh_room_2b` in localStorage only (validated on read, never
  sent anywhere). Privacy policy, "Cookies und Speicher" list (de/it/en):
  entries for `pokyh_room_2b` and for `pokyh_mensa_choice` (from the previous
  round, missing until now) added beside the existing ones; nothing else in
  the legal texts changed; `PRIVACY_NOTICE_VERSION` not raised (owner's call).
- Texts: `lib/i18n/dictionaries/room.ts` (de, it, en); login dictionary +3 keys.
- Pixel font: brackets, =, <, >, %, *, ×, ÷, #, heart and star glyphs.
- Release state: uncommitted

## 2026-10-19 · Verification

- `tsc` clean; ESLint 0 problems on all changed and new files (5 older errors
  remain elsewhere: `lib/untis-permissions.ts`, `providers/AppProvider.tsx`,
  `providers/ThemeProvider.tsx`, vendored `public/draco`); `npm test` 51/51;
  `next build` completed.
- Headless browser against the dev server, no console errors or warnings and
  no Next.js issues in any run: door → room → objects → lights off → machine
  (buy, stuck/shake, take, secret code) → tablet (all five games opened,
  paused, quit) → backpack → back to the sign-in page → browser back/forward;
  at 1440 light and dark and 390 (phone). All five games played to the end by
  script (maths 18, puzzle solved in 22, memory 6 moves, timetable 5/5, catch
  run out): results, stars, records and bonus stored as expected.
- Text overflow checked by script in de/it/en at 320, 390, 768, 1024 and 1440 px
  for room, machine, tablet menu/intros/games/pause and backpack: none.
- Keyboard (door reachable, focus into the room, back button first, Escape,
  focus back to the form) and reduced motion: working, no errors.
- Release state: uncommitted
