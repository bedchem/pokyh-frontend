import type { Dictionary } from '../dictionary';

// Copy of the public homepage (components/home) in German, Italian and
// English. The carousel of the school day keeps its own copy in homepage.ts.
// Words between *asterisks* are highlighted.
export type FrontpageKey =
  // Intro (former curtain, components/home/Intro.tsx)
  | 'introMorning' | 'introDay' | 'introEvening' | 'introNight' | 'introLoading'
  // Hero
  | 'heroTitle' | 'heroHidden' | 'heroGithub' | 'heroScroll' | 'heroRight'
  | 'tileTimetable' | 'tileGrades' | 'tileMessages' | 'tileExams' | 'tileAbsences' | 'tileCancel'
  | 'tileWeek' | 'tileTodos' | 'tileReminders'
  // Manifest
  | 'manifestText' | 'manifestNote' | 'manifestCta'
  // Mensa
  | 'mensaTitle' | 'mensaTitleTomorrow' | 'mensaTitleDay' | 'mensaTitleDate' | 'mensaEmptyTitle' | 'mensaEmpty'
  | 'mensaVotes' | 'mensaNoVotes' | 'mensaLink'
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
    mensaTitleTomorrow: 'Morgen in der Mensa',
    mensaTitleDay: '{day} in der Mensa',
    mensaTitleDate: 'Am {date} in der Mensa',
    mensaEmptyTitle: 'Die Mensa macht Pause',
    mensaEmpty: 'Der nächste Speiseplan ist noch nicht online. Sobald er da ist, steht er hier.',
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
  it: {
    introMorning: 'Buongiorno.',
    introDay: 'Ciao.',
    introEvening: 'Buonasera.',
    introNight: 'Buonanotte.',
    introLoading: 'Stiamo caricando la tua giornata a scuola',

    heroTitle: 'POKYH',
    heroHidden: 'POKYH, l’app scolastica della LBS Bressanone',
    heroGithub: 'GitHub',
    heroScroll: 'Scorri',
    heroRight: 'L’app scolastica della LBS Bressanone',
    tileTimetable: 'Orario',
    tileGrades: 'Voti',
    tileMessages: 'Messaggi',
    tileExams: 'Verifiche',
    tileAbsences: 'Assenze',
    tileCancel: 'Ora saltata',
    tileWeek: 'Settimana',
    tileTodos: 'To-do',
    tileReminders: 'Promemoria',

    manifestText: 'La scuola è già complicata. La tua *app scolastica* non deve esserlo.',
    manifestNote: 'Con il tuo account WebUntis. Gratis, senza pubblicità.',
    manifestCta: 'Accedi ora',

    mensaTitle: 'Oggi in mensa',
    mensaTitleTomorrow: 'Domani in mensa',
    mensaTitleDay: '{day} in mensa',
    mensaTitleDate: 'Il {date} in mensa',
    mensaEmptyTitle: 'La mensa è in pausa',
    mensaEmpty: 'Il prossimo menù non è ancora online. Appena c’è, lo trovi qui.',
    mensaVotes: '{n} valutazioni',
    mensaNoVotes: 'Ancora nessuna valutazione',
    mensaLink: 'Menù completo',

    getTitleA: 'Scarica',
    getTitleB: 'POKYH.',
    getLensA: 'Non ti costa',
    getLensB: 'niente.',
    getNote: 'Con il tuo account WebUntis, senza pubblicità. Uguale su ogni dispositivo.',
    getWeb: 'Apri nel browser',
    getAndroid: 'Android',
    getIos: 'iPhone',
    getPwa: 'Web app',

    tabAway: 'La ricreazione sta per finire.',
  },
  en: {
    introMorning: 'Good morning.',
    introDay: 'Hello.',
    introEvening: 'Good evening.',
    introNight: 'Good night.',
    introLoading: 'Loading your school day',

    heroTitle: 'POKYH',
    heroHidden: 'POKYH, the school app of LBS Brixen',
    heroGithub: 'GitHub',
    heroScroll: 'Scroll',
    heroRight: 'The school app of LBS Brixen',
    tileTimetable: 'Timetable',
    tileGrades: 'Grades',
    tileMessages: 'Messages',
    tileExams: 'Exams',
    tileAbsences: 'Absences',
    tileCancel: 'Cancelled',
    tileWeek: 'Week',
    tileTodos: 'To-dos',
    tileReminders: 'Reminders',

    manifestText: 'School is complicated enough. Your *school app* doesn’t have to be.',
    manifestNote: 'With your WebUntis account. Free, no ads.',
    manifestCta: 'Sign in now',

    mensaTitle: 'Today in the cafeteria',
    mensaTitleTomorrow: 'Tomorrow in the cafeteria',
    mensaTitleDay: '{day} in the cafeteria',
    mensaTitleDate: 'In the cafeteria on {date}',
    mensaEmptyTitle: 'The cafeteria is taking a break',
    mensaEmpty: 'The next menu isn’t online yet. As soon as it is, you’ll find it here.',
    mensaVotes: '{n} ratings',
    mensaNoVotes: 'No ratings yet',
    mensaLink: 'Full menu',

    getTitleA: 'Get',
    getTitleB: 'POKYH.',
    getLensA: 'Costs you',
    getLensB: 'nothing.',
    getNote: 'With your WebUntis account, no ads. The same on every device.',
    getWeb: 'Open in the browser',
    getAndroid: 'Android',
    getIos: 'iPhone',
    getPwa: 'Web app',

    tabAway: 'Break is almost over.',
  },
};
