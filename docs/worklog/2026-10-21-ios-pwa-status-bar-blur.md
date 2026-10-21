# 2026-10-21 · iPhone home-screen app: no blur under the status bar (frontend `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-21 · Pre-work checks

- `git status` clean on `redesign` at `4e361cf`.
- Release state: uncommitted

## 2026-10-21 · Cause

- Owner report: in the installed web app on the iPhone, a blur sits at the
  very top of the screen.
- Reproduced in the iOS 27.0 simulator (iPhone 18 Pro, web app added through
  Safari's "Add to Home Screen", "Open as Web App" on): the app draws beneath
  the status bar, and iOS blurs the top edge over the upper part of the app's
  top bar (search field and round buttons soft at their top).
- WebKit (`LocalFrameView::fixedContainerEdges`) leaves the blur out and gives
  the status bar a solid colour only when a fixed or sticky box spanning the
  screen sits just below the status bar (hit test 4 px below the top inset)
  and has no `backdrop-filter`. The app's top bar is an ordinary block, so
  nothing qualified. A fixed strip only as tall as the status bar was tried
  and does not qualify (the test point lies below it); not kept.
- The sign-in page and the public pages were not affected (their header is
  already fixed).

## 2026-10-21 · Change

- `components/app/shell.module.css`: below 1024 px the app's top bar is
  `position: sticky; top: 0` with the canvas as its fill, `z-index: 55`
  (above the page, the floating button and the bottom bar so its menus still
  open over them; below every dialog, which start at 70). Wide screens with
  the sidebar are unchanged.

## 2026-10-21 · Verification

- iOS 27.0 simulator, installed web app, timetable page: top bar sharp;
  status bar area one solid colour, exactly the canvas (`#F2EEE7` light,
  `#111114` dark); before the change it was blurred and uneven.
- Scrolling the page, bell panel and account menu open over the page,
  light/dark switch, landscape: all sharp, menus above the content.
- Sign-in page and privacy page in the web app: no iOS blur.
- `npm test` 49/49; ESLint clean.
- Not checked: a real iPhone; iPad in landscape (sidebar layout, unchanged).
- Note: existing installs pick up the change after reloading; no reinstall
  needed (no meta tag changed).
- Release state: uncommitted
