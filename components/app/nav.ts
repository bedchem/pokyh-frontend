import type { Icon } from '@phosphor-icons/react';
import {
  BellRinging,
  BookOpenText,
  CalendarBlank,
  ChartLineUp,
  CheckSquare,
  EnvelopeSimple,
  ForkKnife,
  GearSix,
  House,
  SquaresFour,
  UserCircle,
  UserMinus,
  UsersThree,
} from '@phosphor-icons/react';
import type { ShellKey } from '@/lib/i18n/dictionaries/shell';

// The four category tones of the Android app, used as solid blocks. Each
// destination keeps its tone everywhere (hub tiles, shortcuts, icon tiles),
// so a place can be found by colour as well as by name.
export type AppTone = 'periwinkle' | 'butter' | 'sage' | 'blush';

export const TONE_CLASS: Record<AppTone, string> = {
  periwinkle: 'bg-periwinkle text-periwinkle-ink',
  butter: 'bg-butter text-butter-ink',
  sage: 'bg-sage text-sage-ink',
  blush: 'bg-blush text-blush-ink',
};

export interface AppDestination {
  href: string;
  key: ShellKey;
  Icon: Icon;
  tone: AppTone;
  /** Needs a WebUntis account (guardian-free POKYH accounts don't have these). */
  untis?: boolean;
  /** Leaves the app frame (a public page with its own header). */
  site?: boolean;
}

export const DEST = {
  home: { href: '/home', key: 'home', Icon: House, tone: 'periwinkle' },
  timetable: { href: '/timetable', key: 'timetable', Icon: CalendarBlank, tone: 'periwinkle', untis: true },
  grades: { href: '/grades', key: 'grades', Icon: ChartLineUp, tone: 'periwinkle', untis: true },
  messages: { href: '/messages', key: 'messages', Icon: EnvelopeSimple, tone: 'periwinkle', untis: true },
  absences: { href: '/absences', key: 'absences', Icon: UserMinus, tone: 'butter', untis: true },
  classregevents: { href: '/classregevents', key: 'classregevents', Icon: BookOpenText, tone: 'butter', untis: true },
  todos: { href: '/todos', key: 'todos', Icon: CheckSquare, tone: 'sage' },
  reminders: { href: '/reminders', key: 'reminders', Icon: BellRinging, tone: 'blush' },
  class: { href: '/class', key: 'class', Icon: UsersThree, tone: 'sage', untis: true },
  // The signed-in Mensa (ratings, comments); guests get the public /mensa page.
  mensa: { href: '/canteen', key: 'mensa', Icon: ForkKnife, tone: 'butter' },
  school: { href: '/school', key: 'school', Icon: SquaresFour, tone: 'periwinkle' },
  profile: { href: '/profile', key: 'profile', Icon: UserCircle, tone: 'periwinkle' },
  settings: { href: '/settings', key: 'settings', Icon: GearSix, tone: 'sage' },
} satisfies Record<string, AppDestination>;

/** Sidebar on wide screens: every place, in the order of a school day. */
export const SIDEBAR_GROUPS: AppDestination[][] = [
  [DEST.home, DEST.timetable, DEST.grades, DEST.messages, DEST.mensa],
  [DEST.absences, DEST.classregevents, DEST.todos, DEST.reminders, DEST.class],
];

/** Bottom bar on phones: the five tabs of the Android app, in its order. */
export const BOTTOM_TABS: AppDestination[] = [DEST.home, DEST.timetable, DEST.school, DEST.grades, DEST.mensa];

/** What the "Schule" tab holds: everything that has no tab of its own. */
export const HUB_ITEMS: AppDestination[] = [
  DEST.messages,
  DEST.absences,
  DEST.todos,
  DEST.reminders,
  DEST.classregevents,
  DEST.class,
];

/** Routes that belong to a tab without being the tab itself. */
const TAB_OWNERS: Record<string, string> = {
  '/messages': '/school',
  '/absences': '/school',
  '/todos': '/school',
  '/reminders': '/school',
  '/classregevents': '/school',
  '/class': '/school',
  '/profile': '/school',
  '/settings': '/school',
};

export function isActive(path: string, href: string): boolean {
  return path === href || path.startsWith(href + '/');
}

/** The bottom-bar tab a route lives under. */
export function tabFor(path: string): string {
  for (const [route, owner] of Object.entries(TAB_OWNERS)) {
    if (isActive(path, route)) return owner;
  }
  return BOTTOM_TABS.find((t) => isActive(path, t.href))?.href ?? '/home';
}
