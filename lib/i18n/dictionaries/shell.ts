import type { Dictionary } from '../dictionary';

// The signed-in app's frame: sidebar (desktop), bottom bar (phone) and the
// labels both share.
export type ShellKey =| 'mainNav'| 'skip'| 'home'| 'timetable'
  | 'grades'
  | 'school'
  | 'mensa'
  | 'messages'
  | 'absences'
  | 'classregevents'
  | 'todos'
  | 'reminders'
  | 'class'
  | 'profile'
  | 'accountMenu'
  | 'settings'
  | 'collapse'
  | 'expand'
  | 'unread'
  | 'openProfile'
  | 'publicPage'
  | 'student'
  | 'guardian'
  | 'search'
  | 'searchPlaceholder'
  | 'noResults'
  | 'groupPages'
  | 'groupActions'
  | 'actionCompose'
  | 'actionReport'
  | 'actionTheme'
  | 'actionPassword'
  | 'actionLanguage'
  | 'profileStats'
  | 'searchClose'
  | 'searchNav'
  | 'done'
  | 'groupContent'
  | 'srcClassService'
  | 'srcClassreg'
  | 'srcHomework'
  | 'srcExam'
  | 'srcReminder'
  | 'srcTodo'
  | 'srcSubject'
  | 'srcGrade'
  | 'srcLesson'
  | 'srcMessage'
  | 'srcDish'
  | 'searchingContent'
  | 'searchEmpty'
  | 'website'
  | 'language';

export const shellDict: Dictionary<ShellKey> = {
  de: {
    mainNav: 'Hauptnavigation',
    skip: 'Zum Inhalt springen',
    home: 'Home',
    timetable: 'Stundenplan',
    grades: 'Noten',
    school: 'Schule',
    mensa: 'Mensa',
    messages: 'Nachrichten',
    absences: 'Abwesenheiten',
    classregevents: 'Klassenbuch',
    todos: 'To-dos',
    reminders: 'Erinnerungen',
    class: 'Klasse',
    profile: 'Profil',
    accountMenu: 'Konto-Menü',
    settings: 'Einstellungen',
    collapse: 'Seitenleiste einklappen',
    website: 'Startseite',
    language: 'Sprache',
    expand: 'Seitenleiste ausklappen',
    unread: '{n} ungelesen',
    openProfile: 'Profil öffnen',
    publicPage: 'öffnet die Mensa-Seite',
    student: 'Schüler/in',
    guardian: 'Erziehungsberechtigt',
    search: 'Suchen',
    searchPlaceholder: 'Seiten, Fächer, Nachrichten, Lehrer …',
    noResults: 'Nichts gefunden für „{q}“',
    groupPages: 'Seiten',
    groupActions: 'Aktionen',
    actionCompose: 'Nachricht an Lehrer schreiben',
    actionReport: 'Abwesenheit melden',
    actionTheme: 'Hell/Dunkel umschalten',
    actionPassword: 'WebUntis-Passwort ändern',
    actionLanguage: 'Sprache ändern',
    profileStats: 'Statistiken',
    searchClose: 'Suche schließen',
    searchNav: 'Pfeiltasten zum Auswählen, Enter zum Öffnen',
    done: 'erledigt',
    groupContent: 'Inhalte',
    srcClassService: 'Klassendienst',
    srcClassreg: 'Klassenbuch',
    srcHomework: 'Hausaufgabe',
    srcExam: 'Prüfung',
    srcReminder: 'Erinnerung',
    srcTodo: 'To-do',
    srcSubject: 'Fach',
    srcGrade: 'Note',
    srcLesson: 'Stundenplan',
    srcMessage: 'Nachricht',
    srcDish: 'Mensa',
    searchingContent: 'Inhalte werden geladen …',
    searchEmpty: 'Tippe, um Seiten und Inhalte zu durchsuchen.',
  },
  it: {
    mainNav: 'Navigazione principale',
    skip: 'Vai al contenuto',
    home: 'Home',
    timetable: 'Orario',
    grades: 'Voti',
    school: 'Scuola',
    mensa: 'Mensa',
    messages: 'Messaggi',
    absences: 'Assenze',
    classregevents: 'Registro di classe',
    todos: 'To-do',
    reminders: 'Promemoria',
    class: 'Classe',
    profile: 'Profilo',
    accountMenu: 'Menu dell’account',
    settings: 'Impostazioni',
    collapse: 'Comprimi la barra laterale',
    website: 'Pagina iniziale',
    language: 'Lingua',
    expand: 'Espandi la barra laterale',
    unread: '{n} non letti',
    openProfile: 'Apri il profilo',
    publicPage: 'apre la pagina della mensa',
    student: 'Studente/ssa',
    guardian: 'Genitore',
    search: 'Cerca',
    searchPlaceholder: 'Pagine, materie, messaggi, docenti …',
    noResults: 'Nessun risultato per «{q}»',
    groupPages: 'Pagine',
    groupActions: 'Azioni',
    actionCompose: 'Scrivi un messaggio a un docente',
    actionReport: 'Segnala un’assenza',
    actionTheme: 'Cambia chiaro/scuro',
    actionPassword: 'Cambia la password di WebUntis',
    actionLanguage: 'Cambia lingua',
    profileStats: 'Statistiche',
    searchClose: 'Chiudi la ricerca',
    searchNav: 'Frecce per scegliere, Invio per aprire',
    done: 'fatto',
    groupContent: 'Contenuti',
    srcClassService: 'Servizio di classe',
    srcClassreg: 'Registro di classe',
    srcHomework: 'Compito',
    srcExam: 'Verifica',
    srcReminder: 'Promemoria',
    srcTodo: 'To-do',
    srcSubject: 'Materia',
    srcGrade: 'Voto',
    srcLesson: 'Orario',
    srcMessage: 'Messaggio',
    srcDish: 'Mensa',
    searchingContent: 'Caricamento dei contenuti …',
    searchEmpty: 'Scrivi per cercare pagine e contenuti.',
  },
  en: {
    mainNav: 'Main navigation',
    skip: 'Skip to content',
    home: 'Home',
    timetable: 'Timetable',
    grades: 'Grades',
    school: 'School',
    mensa: 'Cafeteria',
    messages: 'Messages',
    absences: 'Absences',
    classregevents: 'Class register',
    todos: 'To-dos',
    reminders: 'Reminders',
    class: 'Class',
    profile: 'Profile',
    accountMenu: 'Account menu',
    settings: 'Settings',
    collapse: 'Collapse sidebar',
    website: 'Homepage',
    language: 'Language',
    expand: 'Expand sidebar',
    unread: '{n} unread',
    openProfile: 'Open profile',
    publicPage: 'opens the cafeteria page',
    student: 'Student',
    guardian: 'Guardian',
    search: 'Search',
    searchPlaceholder: 'Pages, subjects, messages, teachers …',
    noResults: 'Nothing found for “{q}”',
    groupPages: 'Pages',
    groupActions: 'Actions',
    actionCompose: 'Write a message to a teacher',
    actionReport: 'Report an absence',
    actionTheme: 'Toggle light/dark',
    actionPassword: 'Change WebUntis password',
    actionLanguage: 'Change language',
    profileStats: 'Statistics',
    searchClose: 'Close search',
    searchNav: 'Arrow keys to pick, Enter to open',
    done: 'done',
    groupContent: 'Content',
    srcClassService: 'Class duty',
    srcClassreg: 'Class register',
    srcHomework: 'Homework',
    srcExam: 'Exam',
    srcReminder: 'Reminder',
    srcTodo: 'To-do',
    srcSubject: 'Subject',
    srcGrade: 'Grade',
    srcLesson: 'Timetable',
    srcMessage: 'Message',
    srcDish: 'Cafeteria',
    searchingContent: 'Loading content …',
    searchEmpty: 'Type to search pages and content.',
  },
};
