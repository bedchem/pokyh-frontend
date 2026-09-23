import type { Dictionary } from '../dictionary';

export type SchoolKey =
  | 'pageTitle'
  | 'gradesTitle'
  | 'gradesSubtitle'
  | 'remindersTitle'
  | 'remindersSubtitle'
  | 'absencesTitle'
  | 'absencesSubtitle'
  | 'todosTitle'
  | 'todosSubtitle';

export const schoolDict: Dictionary<SchoolKey> = {
  de: {
    pageTitle: 'Schule',
    gradesTitle: 'Noten',
    gradesSubtitle: 'Alle Fächer & Bewertungen',
    remindersTitle: 'Erinnerungen',
    remindersSubtitle: 'Hausaufgaben & Klassen-Erinnerungen',
    absencesTitle: 'Abwesenheiten',
    absencesSubtitle: 'Fehlstunden & Entschuldigungen',
    todosTitle: 'Todos',
    todosSubtitle: 'Persönliche Aufgabenliste',
  },
  it: {
    pageTitle: 'Scuola',
    gradesTitle: 'Voti',
    gradesSubtitle: 'Tutte le materie e valutazioni',
    remindersTitle: 'Promemoria',
    remindersSubtitle: 'Compiti e promemoria di classe',
    absencesTitle: 'Assenze',
    absencesSubtitle: 'Ore di assenza e giustificazioni',
    todosTitle: 'Todos',
    todosSubtitle: 'La tua lista di attività personale',
  },
  en: {
    pageTitle: 'School',
    gradesTitle: 'Grades',
    gradesSubtitle: 'All subjects & grades',
    remindersTitle: 'Reminders',
    remindersSubtitle: 'Homework & class reminders',
    absencesTitle: 'Absences',
    absencesSubtitle: 'Missed hours & excuses',
    todosTitle: 'Todos',
    todosSubtitle: 'Your personal task list',
  },
  lld: {
    pageTitle: "Scola",
    gradesTitle: "Notes",
    gradesSubtitle: "Duta la materies y valutazions",
    remindersTitle: "Recurdanzes",
    remindersSubtitle: "Lëures da cësa y recurdanzes dla tlas",
    absencesTitle: "Assënzes",
    absencesSubtitle: "Ëures de assënza y giustificazions",
    todosTitle: "To-do",
    todosSubtitle: "Tia lista personela de lëures",
  },
};
