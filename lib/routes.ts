// App routes that exist and require a session. Anything that is neither one of
// these nor a public route renders the 404 page instead of redirecting to /login.
export const PROTECTED_APP_ROUTES = [
  '/home',
  '/absences',
  '/class',
  '/classregevents',
  '/grades',
  '/messages',
  '/profile',
  '/reminders',
  '/school',
  '/timetable',
  '/todos',
];

// Pages that are reachable without a session.
export const PUBLIC_PAGE_ROUTES = [
  '/',
  '/login',
  '/legal',
  '/about',
  '/faq',
  '/comparison',
  '/howto',
  '/get',
  '/mensa',
];

function matchesRoute(pathname: string, route: string): boolean {
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(route + '/');
}

export function isProtectedAppRoute(pathname: string): boolean {
  return PROTECTED_APP_ROUTES.some((r) => matchesRoute(pathname, r));
}

export function isKnownPageRoute(pathname: string): boolean {
  return isProtectedAppRoute(pathname) || PUBLIC_PAGE_ROUTES.some((r) => matchesRoute(pathname, r));
}

export function isMensaRoute(pathname: string): boolean {
  return matchesRoute(pathname, '/mensa');
}
