import type { Dictionary } from '../dictionary';

export type NavKey =
  | 'groupOverview'
  | 'groupLessons'
  | 'groupMore'
  | 'dashboard'
  | 'home'
  | 'class'
  | 'timetable'
  | 'grades'
  | 'absences'
  | 'classregevents'
  | 'mensa'
  | 'messages'
  | 'reminders'
  | 'todos'
  | 'school'
  | 'profile'
  | 'legal'
  | 'darkMode'
  | 'lightMode'
  | 'collapse'
  | 'openMenu'
  | 'closeMenu'
  | 'about'
  | 'faq'
  | 'comparison'
  | 'login'
  | 'mensaMenu'
  | 'viewMensaMenu'
  | 'withoutLogin'
  | 'pages';

export const navDict: Dictionary<NavKey> = {
  de: {
    groupOverview: 'Übersicht',
    groupLessons: 'Unterricht',
    groupMore: 'Mehr',
    dashboard: 'Dashboard',
    home: 'Home',
    class: 'Klasse',
    timetable: 'Stundenplan',
    grades: 'Noten',
    absences: 'Abwesenheiten',
    classregevents: 'Klassenbuch',
    mensa: 'Mensa',
    messages: 'Nachrichten',
    reminders: 'Erinnerungen',
    todos: 'Todos',
    school: 'Schule',
    profile: 'Profil',
    legal: 'Rechtliches',
    darkMode: 'Dark Mode',
    lightMode: 'White Mode',
    collapse: 'Einklappen',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
    about: 'About',
    faq: 'FAQ',
    comparison: 'Vergleich',
    login: 'Anmelden',
    mensaMenu: 'Mensa-Speiseplan',
    viewMensaMenu: 'Mensa-Speiseplan ansehen',
    withoutLogin: 'Ohne Login',
    pages: 'Seiten',
  },
  it: {
    groupOverview: 'Panoramica',
    groupLessons: 'Lezioni',
    groupMore: 'Altro',
    dashboard: 'Dashboard',
    home: 'Home',
    class: 'Classe',
    timetable: 'Orario',
    grades: 'Voti',
    absences: 'Assenze',
    classregevents: 'Registro di classe',
    mensa: 'Mensa',
    messages: 'Messaggi',
    reminders: 'Promemoria',
    todos: 'To-do',
    school: 'Scuola',
    profile: 'Profilo',
    legal: 'Note legali',
    darkMode: 'Modalità scura',
    lightMode: 'Modalità chiara',
    collapse: 'Comprimi',
    openMenu: 'Apri menu',
    closeMenu: 'Chiudi menu',
    about: 'Chi siamo',
    faq: 'FAQ',
    comparison: 'Confronto',
    login: 'Accedi',
    mensaMenu: 'Menù della mensa',
    viewMensaMenu: 'Vedi il menù della mensa',
    withoutLogin: 'Senza login',
    pages: 'Pagine',
  },
  en: {
    groupOverview: 'Overview',
    groupLessons: 'Lessons',
    groupMore: 'More',
    dashboard: 'Dashboard',
    home: 'Home',
    class: 'Class',
    timetable: 'Timetable',
    grades: 'Grades',
    absences: 'Absences',
    classregevents: 'Class register',
    mensa: 'Cafeteria',
    messages: 'Messages',
    reminders: 'Reminders',
    todos: 'To-dos',
    school: 'School',
    profile: 'Profile',
    legal: 'Legal',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    collapse: 'Collapse',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    about: 'About',
    faq: 'FAQ',
    comparison: 'Comparison',
    login: 'Log in',
    mensaMenu: 'Cafeteria menu',
    viewMensaMenu: 'View the cafeteria menu',
    withoutLogin: 'No login needed',
    pages: 'Pages',
  },
  lld: {
    groupOverview: "Survista",
    groupLessons: "Lezions",
    groupMore: "Plu",
    dashboard: "Dashboard",
    home: "Home",
    class: "Tlas",
    timetable: "Urar",
    grades: "Notes",
    absences: "Assënzes",
    classregevents: "Register de tlas",
    mensa: "Mensa",
    messages: "Nutizies",
    reminders: "Recurdanzes",
    todos: "To-do",
    school: "Scola",
    profile: "Profil",
    legal: "Nfurmazions giuridiches",
    darkMode: "Modus scur",
    lightMode: "Modus cler",
    collapse: "Ridujé",
    openMenu: "Giaurì menu",
    closeMenu: "Stlù menu",
    about: "Sun nëus",
    faq: "FAQ",
    comparison: "Cunfront",
    login: "Jì ite",
    mensaMenu: "Menu dla mensa",
    viewMensaMenu: "Cialé l menu dla mensa",
    withoutLogin: "Zënza jì ite",
    pages: "Plates",
  },
};
