import type { Dictionary } from '../dictionary';

// Chrome of the public site: header, menu, footer.
export type SiteKey =
  | 'skip'
  | 'navFeatures'
  | 'navMensa'
  | 'navAbout'
  | 'navFaq'
  | 'navGet'
  | 'navCompare'
  | 'navWebuntis'
  | 'navTools'
  | 'navSelfHost'
  | 'login'
  | 'openApp'
  | 'menu'
  | 'close'
  | 'home'
  | 'language'
  | 'languageTitle'
  | 'languageNow'
  | 'theme'
  | 'themeLight'
  | 'themeDark'
  | 'themeSystem'
  | 'footerProduct'
  | 'footerProject'
  | 'footerLegal'
  | 'imprint'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'cookieSettings'
  | 'github'
  | 'disclaimer'
  | 'toTop'
  | 'endTitle'
  | 'endText'
  | 'tilesHint';

export const siteDict: Dictionary<SiteKey> = {
  de: {
    skip: 'Zum Inhalt springen',
    navFeatures: 'Funktionen',
    navMensa: 'Mensa',
    navAbout: 'Über POKYH',
    navFaq: 'FAQ',
    navGet: 'App holen',
    navCompare: 'Vergleich mit WebUntis',
    navWebuntis: 'Für WebUntis',
    navTools: 'Noten- und Fehlstundenrechner',
    navSelfHost: 'Selbst hosten',
    login: 'Anmelden',
    openApp: 'Zur App',
    menu: 'Menü',
    close: 'Schließen',
    home: 'Startseite',
    language: 'Sprache',
    languageTitle: 'Sprache der Seite wählen',
    languageNow: 'Aktuelle Sprache',
    theme: 'Darstellung',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'System',
    footerProduct: 'Produkt',
    footerProject: 'Projekt',
    footerLegal: 'Rechtliches',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    cookies: 'Cookies',
    cookieSettings: 'Cookie-Einstellungen',
    github: 'GitHub',
    disclaimer: 'POKYH ist ein unabhängiges Projekt und nicht mit der Untis GmbH verbunden. WebUntis und Untis sind Marken der Untis GmbH.',
    terms: 'Nutzungsbedingungen',
    toTop: 'Nach oben',
    endTitle: 'Deine Schule. Übersichtlich.',
    endText: 'Stundenplan, Noten, Abwesenheiten und Nachrichten an einem Ort. Kostenlos, mit deinem WebUntis-Konto, für jede Schule mit WebUntis.',
    tilesHint: 'Tipp die Buchstaben an.',
  },
  it: {
    skip: 'Vai al contenuto',
    navFeatures: 'Funzioni',
    navMensa: 'Mensa',
    navAbout: 'Chi siamo',
    navFaq: 'FAQ',
    navGet: "Scarica l'app",
    navCompare: 'Confronto con WebUntis',
    navWebuntis: 'Per WebUntis',
    navTools: 'Calcolo media e assenze',
    navSelfHost: 'Self-hosting',
    login: 'Accedi',
    openApp: "Apri l'app",
    menu: 'Menu',
    close: 'Chiudi',
    home: 'Home',
    language: 'Lingua',
    languageTitle: 'Scegli la lingua del sito',
    languageNow: 'Lingua attuale',
    theme: 'Aspetto',
    themeLight: 'Chiaro',
    themeDark: 'Scuro',
    themeSystem: 'Sistema',
    footerProduct: 'Prodotto',
    footerProject: 'Progetto',
    footerLegal: 'Note legali',
    imprint: 'Note legali',
    privacy: 'Privacy',
    cookies: 'Cookie',
    cookieSettings: 'Impostazioni cookie',
    github: 'GitHub',
    disclaimer: 'POKYH è un progetto indipendente e non è collegato a Untis GmbH. WebUntis e Untis sono marchi di Untis GmbH.',
    terms: 'Condizioni d’uso',
    toTop: 'Torna su',
    endTitle: 'La tua scuola. In ordine.',
    endText: 'Orario, voti, assenze e messaggi in un unico posto. Gratis, con il tuo account WebUntis, per ogni scuola con WebUntis.',
    tilesHint: 'Tocca le lettere.',
  },
  en: {
    skip: 'Skip to content',
    navFeatures: 'Features',
    navMensa: 'Cafeteria',
    navAbout: 'About',
    navFaq: 'FAQ',
    navGet: 'Get the app',
    navCompare: 'Compared to WebUntis',
    navWebuntis: 'For WebUntis',
    navTools: 'Grade and absence calculators',
    navSelfHost: 'Self-hosting',
    login: 'Sign in',
    openApp: 'Open app',
    menu: 'Menu',
    close: 'Close',
    home: 'Home',
    language: 'Language',
    languageTitle: 'Choose the site language',
    languageNow: 'Current language',
    theme: 'Appearance',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    footerProduct: 'Product',
    footerProject: 'Project',
    footerLegal: 'Legal',
    imprint: 'Imprint',
    privacy: 'Privacy',
    cookies: 'Cookies',
    cookieSettings: 'Cookie settings',
    github: 'GitHub',
    disclaimer: 'POKYH is an independent project and is not affiliated with Untis GmbH. WebUntis and Untis are trademarks of Untis GmbH.',
    terms: 'Terms of use',
    toTop: 'Back to top',
    endTitle: 'Your school. At a glance.',
    endText: 'Timetable, grades, absences and messages in one place. Free, with your WebUntis account, for every school on WebUntis.',
    tilesHint: 'Tap the letters.',
  },
};
