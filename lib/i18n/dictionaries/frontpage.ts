import type { Dictionary } from '../dictionary';

// Copy of the public homepage (components/home). German only for now; the
// other locales fall back to it until they are translated. The carousel of
// the school day keeps its own copy in homepage.ts.
// Words between *asterisks* are highlighted.
export type FrontpageKey =
  // Intro
  | 'introMorning' | 'introDay' | 'introEvening' | 'introNight' | 'introLoading'
  // Hero
  | 'heroTitle' | 'heroHidden' | 'heroGithub' | 'heroScroll' | 'heroRight'
  | 'tileTimetable' | 'tileGrades' | 'tileMessages' | 'tileExams' | 'tileAbsences' | 'tileCancel'
  | 'tileWeek' | 'tileTodos' | 'tileReminders'
  // Manifest
  | 'manifestText' | 'manifestNote' | 'manifestCta'
  // Mensa
  | 'mensaTitle' | 'mensaToday' | 'mensaNext' | 'mensaEmpty' | 'mensaVotes' | 'mensaNoVotes' | 'mensaLink'
  // Get
  | 'getTitleA' | 'getTitleB' | 'getLensA' | 'getLensB' | 'getNote'
  | 'getWeb' | 'getAndroid' | 'getIos' | 'getPwa'
  // Misc
  | 'tabAway';

export const frontpageDict: Dictionary<FrontpageKey> = {
  de: {
    introMorning: 'Guten Morgen.',
    introDay: 'Hallo.',
    introEvening: 'Guten Abend.',
    introNight: 'Gute Nacht.',
    introLoading: 'Dein Schultag wird geladen',

    heroTitle: 'POKYH',
    heroHidden: 'POKYH, die Schulapp der LBS Brixen',
    heroGithub: 'GitHub',
    heroScroll: 'Scrollen',
    heroRight: 'Die Schulapp der LBS Brixen',
    tileTimetable: 'Stundenplan',
    tileGrades: 'Noten',
    tileMessages: 'Nachrichten',
    tileExams: 'Prüfungen',
    tileAbsences: 'Abwesenheiten',
    tileCancel: 'Entfall',
    tileWeek: 'Woche',
    tileTodos: 'To-dos',
    tileReminders: 'Erinnerungen',

    manifestText: 'Schule ist kompliziert genug. Deine *Schulapp* muss es nicht sein.',
    manifestNote: 'Mit deinem WebUntis-Konto. Kostenlos, ohne Werbung.',
    manifestCta: 'Jetzt anmelden',

    mensaTitle: 'Heute in der Mensa',
    mensaToday: 'Heute',
    mensaNext: 'Als Nächstes',
    mensaEmpty: 'Heute gibt es kein Mensa-Menü.',
    mensaVotes: '{n} Bewertungen',
    mensaNoVotes: 'Noch keine Bewertung',
    mensaLink: 'Ganzes Menü',

    getTitleA: 'Hol dir',
    getTitleB: 'POKYH.',
    getLensA: 'Kostet dich',
    getLensB: 'nichts.',
    getNote: 'Mit deinem WebUntis-Konto, ohne Werbung. Auf jedem Gerät dasselbe.',
    getWeb: 'Im Browser öffnen',
    getAndroid: 'Android',
    getIos: 'iPhone',
    getPwa: 'Web-App',

    tabAway: 'Die Pause ist gleich vorbei.',
  },
};
