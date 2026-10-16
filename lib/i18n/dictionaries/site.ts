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
  | 'footerTitle'
  | 'footerText';

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
    footerTitle: 'bis morgen früh',
    footerText: 'Melde dich mit deinem WebUntis-Konto an. Mehr brauchst du nicht.',
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
    footerTitle: 'a domani mattina',
    footerText: 'Accedi con il tuo account WebUntis. Non serve altro.',
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
    footerTitle: 'see you in the morning',
    footerText: 'Sign in with your WebUntis account. That’s all you need.',
  },
};
