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
  | 'navSelfHost'
  | 'login'
  | 'openApp'
  | 'menu'
  | 'close'
  | 'home'
  | 'language'
  | 'theme'
  | 'themeLight'
  | 'themeDark'
  | 'themeSystem'
  | 'footerProduct'
  | 'footerProject'
  | 'footerLegal'
  | 'imprint'
  | 'privacy'
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
    navSelfHost: 'Selbst hosten',
    login: 'Anmelden',
    openApp: 'Zur App',
    menu: 'Menü',
    close: 'Schließen',
    home: 'Startseite',
    language: 'Sprache',
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
    disclaimer: 'POKYH ist ein Schülerprojekt und kein offizielles Produkt der Untis GmbH.',
    toTop: 'Nach oben',
    endTitle: 'Deine Schule. Übersichtlich.',
    endText: 'Stundenplan, Noten, Mensa und Nachrichten an einem Ort. Kostenlos, mit deinem WebUntis-Konto.',
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
    navSelfHost: 'Self-hosting',
    login: 'Accedi',
    openApp: "Apri l'app",
    menu: 'Menu',
    close: 'Chiudi',
    home: 'Home',
    language: 'Lingua',
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
    disclaimer: 'POKYH è un progetto di studenti e non un prodotto ufficiale di Untis GmbH.',
    toTop: 'Torna su',
    endTitle: 'La tua scuola. In ordine.',
    endText: 'Orario, voti, mensa e messaggi in un unico posto. Gratis, con il tuo account WebUntis.',
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
    navSelfHost: 'Self-hosting',
    login: 'Sign in',
    openApp: 'Open app',
    menu: 'Menu',
    close: 'Close',
    home: 'Home',
    language: 'Language',
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
    disclaimer: 'POKYH is a student project and not an official product of Untis GmbH.',
    toTop: 'Back to top',
    endTitle: 'Your school. At a glance.',
    endText: 'Timetable, grades, cafeteria and messages in one place. Free, with your WebUntis account.',
    tilesHint: 'Tap the letters.',
  },
};
