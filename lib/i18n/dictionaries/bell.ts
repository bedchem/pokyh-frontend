import type { Dictionary } from '../dictionary';

// The bell in the app's top bar (components/app/Bell.tsx): new grades,
// messages and reminders, what is coming due, the streak.
export type BellKey =
  | 'title'
  | 'labelNew'
  | 'newCount'
  | 'isNew'
  | 'streakDays'
  | 'streakOne'
  | 'streakNone'
  | 'streakLongest'
  | 'streakToday'
  | 'streakKeep'
  | 'milestone'
  | 'milestoneSub'
  | 'gradeNew'
  | 'reminderBy'
  | 'reminderSoon'
  | 'todoDue'
  | 'todoOverdue'
  | 'today'
  | 'yesterday'
  | 'todayAt'
  | 'tomorrowAt'
  | 'yesterdayAt'
  | 'inMinutes'
  | 'inHours'
  | 'emptyTitle'
  | 'emptyText';

export const bellDict: Dictionary<BellKey> = {
  de: {
    title: 'Benachrichtigungen',
    labelNew: 'Benachrichtigungen, {n} neu',
    newCount: '{n} neu',
    isNew: 'neu',
    streakDays: '{n} Tage in Folge',
    streakOne: '1 Tag in Folge',
    streakNone: 'Heute startet deine Serie',
    streakLongest: 'Längste Serie: {n}',
    streakToday: 'Heute dabei',
    streakKeep: 'Schau heute vorbei, damit sie hält',
    milestone: '{n} Tage in Folge!',
    milestoneSub: 'Deine Serie läuft',
    gradeNew: 'Neue Note in {subject}',
    reminderBy: 'Neue Erinnerung von {name}',
    reminderSoon: 'Erinnerung',
    todoDue: 'Fällig',
    todoOverdue: 'Überfällig',
    today: 'Heute',
    yesterday: 'Gestern',
    todayAt: 'heute {time}',
    tomorrowAt: 'morgen {time}',
    yesterdayAt: 'gestern {time}',
    inMinutes: 'in {n} Min.',
    inHours: 'in {n} Std.',
    emptyTitle: 'Alles ruhig',
    emptyText: 'Neue Noten, Nachrichten und Erinnerungen tauchen hier auf.',
  },
  it: {
    title: 'Notifiche',
    labelNew: 'Notifiche, {n} nuove',
    newCount: '{n} nuove',
    isNew: 'nuovo',
    streakDays: '{n} giorni di fila',
    streakOne: '1 giorno di fila',
    streakNone: 'Oggi inizia la tua serie',
    streakLongest: 'Serie più lunga: {n}',
    streakToday: 'Oggi ci sei',
    streakKeep: 'Passa oggi per tenerla viva',
    milestone: '{n} giorni di fila!',
    milestoneSub: 'La tua serie continua',
    gradeNew: 'Nuovo voto in {subject}',
    reminderBy: 'Nuovo promemoria da {name}',
    reminderSoon: 'Promemoria',
    todoDue: 'Scade',
    todoOverdue: 'Scaduto',
    today: 'Oggi',
    yesterday: 'Ieri',
    todayAt: 'oggi {time}',
    tomorrowAt: 'domani {time}',
    yesterdayAt: 'ieri {time}',
    inMinutes: 'tra {n} min',
    inHours: 'tra {n} h',
    emptyTitle: 'Tutto tranquillo',
    emptyText: 'Qui compaiono nuovi voti, messaggi e promemoria.',
  },
  en: {
    title: 'Notifications',
    labelNew: 'Notifications, {n} new',
    newCount: '{n} new',
    isNew: 'new',
    streakDays: '{n} days in a row',
    streakOne: '1 day in a row',
    streakNone: 'Your streak starts today',
    streakLongest: 'Longest streak: {n}',
    streakToday: 'In today',
    streakKeep: 'Drop by today to keep it going',
    milestone: '{n} days in a row!',
    milestoneSub: 'Your streak is on',
    gradeNew: 'New grade in {subject}',
    reminderBy: 'New reminder from {name}',
    reminderSoon: 'Reminder',
    todoDue: 'Due',
    todoOverdue: 'Overdue',
    today: 'Today',
    yesterday: 'Yesterday',
    todayAt: 'today {time}',
    tomorrowAt: 'tomorrow {time}',
    yesterdayAt: 'yesterday {time}',
    inMinutes: 'in {n} min',
    inHours: 'in {n} h',
    emptyTitle: 'All quiet',
    emptyText: 'New grades, messages and reminders show up here.',
  },
};
