# 2026-10-20 · Room 2B: a drinks row with the White Monster, sign-in on phones without the door (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-20 · Pre-work checks

- `git status`: clean on `redesign` at `b29f6f4`. Open pull requests
  (`gh pr list`): none.
- Release state: uncommitted

## 2026-10-20 · Vending machine

- Owner asked for a Monster can in the room 2B vending machine (then: a white
  one) and for the machine to be better overall.
- The machine up close (`components/pixel/vending.ts`) has a fifth row,
  E, for drinks: behind its own cooler glass (paler back, frost along the
  top). E1 Hausaufgaben-Limo (moved from A3), E2 White Monster (white can,
  silver lid and rim, three silver claw marks, a line of print), E3
  Schul-Kakao (carton with straw). A3 is now Pausen-Chips. Drawing 96 × 164
  (was 96 × 142); flap, feet, sticker and glass sheen moved down; a cooling
  grille under the star slot.
- Keypad: letters A–E and the clear key, numbers 1–3, a wide OK key with
  "OK" on it. The keyboard's E works as well.
- Catalog (`components/room/catalog.ts`): `chips`, `monster`, `cocoa` added;
  drinks are snacks with `drink: true` (counted as eaten, nothing kept).
  Stored progress (`pokyh_room_2b`) keeps its shape; nothing in the privacy
  texts changes.
- The room's small machine (`components/pixel/classroom.ts`) shows five rows
  too, the white can in the cold bottom row.
- Back in the room after a drink, the mascot sips ("Schlürf!") instead of
  munching. After the White Monster it buzzes on the spot with wide eyes,
  arms up and lightning bolts flashing ("VOLLE POWER!", about 4 s), then
  slumps with closed eyes and a drop of sweat ("Puh … Pause."); the crushed
  can stays on the floor beside it for the visit. New motion `buzz` and
  bolts in `MascotFigure` / `app/globals.css`, off with reduced motion.
- Texts in `lib/i18n/dictionaries/room.ts` (de/it/en): new items and
  descriptions, `kind_drink`, `vmGotDrink`, `drinkDrunk`, `monsterDrunk`,
  `mascotSlurp`, `mascotHyper`, `mascotCrash`; slot hint now "A1 bis E3";
  backpack heading "Gegessen und getrunken".
- Release state: uncommitted

## 2026-10-20 · Sign-in page on phones

- Owner asked for the mascot alone on mobile devices and the door only on
  desktop.
- `MascotBadge` (`app/[lang]/login/Hallway.tsx`), shown below the `lg`
  breakpoint (phones and tablets standing up), draws only the mascot and its
  speech bubble, a little larger than before; the bubble may be wider now (a
  greeting with a name fits on one line). Room is kept above the head so the
  form doesn't move while it talks. The door stays in the desktop hallway;
  `#2b` links still open the room on any device.
- Release state: uncommitted

## 2026-10-20 · Verification

- `tsc --noEmit` clean; ESLint 0 problems on the changed files; `npm test`
  51/51. `next build` not run (dev server in use).
- Headless browser against the dev server (no console errors or warnings in
  any run): machine with the new row at 1440 (de, en), 1024 (it, dark) and
  390 (dark); E2 chosen with the keyboard, bought, taken out (one run got
  stuck and was shaken free), back in the room: buzzing with bolts, then the
  slump, the can on the floor; stars and the eaten count stored as expected.
- Sign-in page: 390 light/dark, 320 (it), 768 without a door button; 1440
  with the door. Bubble with a name and the password pose checked on 390 and
  320.
- Not checked: a real phone or tablet.
- Release state: uncommitted
