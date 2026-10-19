import type { Dictionary } from '../dictionary';

// The settings page (app/[lang]/(app)/settings).
export type SettingsKey =
  | 'title'
  | 'lead'
  | 'appearance'
  | 'theme'
  | 'themeHint'
  | 'system'
  | 'light'
  | 'dark'
  | 'language'
  | 'languageHint'
  | 'sidebar'
  | 'sidebarHint'
  | 'account'
  | 'password'
  | 'passwordHint'
  | 'forgot'
  | 'forgotHint'
  | 'profile'
  | 'profileHint'
  | 'notifications'
  | 'push'
  | 'pushOn'
  | 'pushOff'
  | 'pushBlocked'
  | 'pushUnsupported'
  | 'pushEnable'
  | 'privacy'
  | 'usage'
  | 'usageHint'
  | 'acknowledged'
  | 'never'
  | 'cookies'
  | 'cookiesHint'
  | 'policy'
  | 'storage'
  | 'clearCache'
  | 'clearCacheHint'
  | 'cleared'
  | 'about'
  | 'version'
  | 'legal'
  | 'faq'
  | 'source'
  | 'logout'
  | 'logoutHint'
  | 'logoutConfirm'
  | 'supportTitle'
  | 'supportText'
  | 'supportAction'
  | 'supportNewTab'
  | 'saveError'
  | 'onThisPage';

export const settingsDict: Dictionary<SettingsKey> = {
  de: {
    title: 'Einstellungen',
    lead: 'Darstellung, Konto, Mitteilungen und Datenschutz.',
    appearance: 'Darstellung',
    theme: 'Farbschema',
    themeHint: 'System folgt der Einstellung deines Geräts.',
    system: 'System',
    light: 'Hell',
    dark: 'Dunkel',
    language: 'Sprache',
    languageHint: 'Gilt für die ganze Website.',
    sidebar: 'Seitenleiste eingeklappt',
    sidebarHint: 'Auf großen Bildschirmen nur die Symbole zeigen.',
    account: 'Konto & Sicherheit',
    password: 'WebUntis-Passwort ändern',
    passwordHint: 'Gilt danach auch in der WebUntis-App.',
    forgot: 'Passwort zurücksetzen',
    forgotHint: 'WebUntis schickt dir einen Link per E-Mail.',
    profile: 'Profil & Aktivität',
    profileHint: 'Deine Daten und wann du POKYH genutzt hast.',
    notifications: 'Mitteilungen',
    push: 'Benachrichtigungen im Browser',
    pushOn: 'Eingeschaltet',
    pushOff: 'Neue Nachrichten, fällige To-dos und Erinnerungen melden.',
    pushBlocked: 'Im Browser blockiert. Erlaube sie in den Website-Einstellungen deines Browsers.',
    pushUnsupported: 'Dieser Browser unterstützt keine Benachrichtigungen.',
    pushEnable: 'Einschalten',
    privacy: 'Datenschutz',
    usage: 'Persönliche Nutzungsstatistik',
    usageHint: 'Ordnet deine Nutzung deinem Konto zu, damit du deine Aktivität im Profil siehst. Ohne Zustimmung wird nur anonym gezählt.',
    acknowledged: 'Datenschutzhinweis bestätigt',
    never: 'Noch nicht',
    cookies: 'Cookie-Einstellungen',
    cookiesHint: 'Auswahl im Cookie-Banner ändern.',
    policy: 'Datenschutzerklärung',
    storage: 'Speicher',
    clearCache: 'Offline-Kopien löschen',
    clearCacheHint: 'Gespeicherte Stundenpläne, Noten und Nachrichten auf diesem Gerät. Du bleibst angemeldet.',
    cleared: 'Gelöscht',
    about: 'Über POKYH',
    version: 'Version',
    legal: 'Impressum & Rechtliches',
    faq: 'Häufige Fragen',
    source: 'Quellcode auf GitHub',
    logout: 'Abmelden',
    logoutHint: 'Meldet dich auf diesem Gerät ab.',
    logoutConfirm: 'Wirklich abmelden?',
    supportTitle: 'POKYH unterstützen',
    supportText: 'POKYH ist kostenlos, ohne Werbung und entsteht in unserer Freizeit. Wenn dir die App hilft und du magst, kannst du uns einen Kaffee spendieren. Ganz freiwillig: alles bleibt für alle gleich.',
    supportAction: 'Buy me a coffee',
    supportNewTab: '(öffnet in einem neuen Tab)',
    saveError: 'Konnte nicht gespeichert werden. Versuch es nochmal.',
    onThisPage: 'Auf dieser Seite',
  },
  it: {
    title: 'Impostazioni',
    lead: 'Aspetto, account, notifiche e privacy.',
    appearance: 'Aspetto',
    theme: 'Tema',
    themeHint: 'Sistema segue l’impostazione del dispositivo.',
    system: 'Sistema',
    light: 'Chiaro',
    dark: 'Scuro',
    language: 'Lingua',
    languageHint: 'Vale per tutto il sito.',
    sidebar: 'Barra laterale compressa',
    sidebarHint: 'Sugli schermi grandi mostra solo le icone.',
    account: 'Account e sicurezza',
    password: 'Cambia la password di WebUntis',
    passwordHint: 'Vale anche nell’app di WebUntis.',
    forgot: 'Reimposta la password',
    forgotHint: 'WebUntis ti manda un link via e-mail.',
    profile: 'Profilo e attività',
    profileHint: 'I tuoi dati e quando hai usato POKYH.',
    notifications: 'Notifiche',
    push: 'Notifiche del browser',
    pushOn: 'Attive',
    pushOff: 'Avvisa di nuovi messaggi, to-do in scadenza e promemoria.',
    pushBlocked: 'Bloccate nel browser. Consentile nelle impostazioni del sito del browser.',
    pushUnsupported: 'Questo browser non supporta le notifiche.',
    pushEnable: 'Attiva',
    privacy: 'Privacy',
    usage: 'Statistiche d’uso personali',
    usageHint: 'Collega il tuo utilizzo al tuo account, così vedi la tua attività nel profilo. Senza consenso si conta solo in forma anonima.',
    acknowledged: 'Informativa privacy confermata',
    never: 'Non ancora',
    cookies: 'Impostazioni cookie',
    cookiesHint: 'Cambia la scelta del banner dei cookie.',
    policy: 'Informativa sulla privacy',
    storage: 'Memoria',
    clearCache: 'Elimina le copie offline',
    clearCacheHint: 'Orari, voti e messaggi salvati su questo dispositivo. Resti connesso.',
    cleared: 'Eliminate',
    about: 'Su POKYH',
    version: 'Versione',
    legal: 'Note legali',
    faq: 'Domande frequenti',
    source: 'Codice sorgente su GitHub',
    logout: 'Esci',
    logoutHint: 'Esci su questo dispositivo.',
    logoutConfirm: 'Vuoi davvero uscire?',
    supportTitle: 'Sostieni POKYH',
    supportText: 'POKYH è gratuito, senza pubblicità e nasce nel nostro tempo libero. Se l’app ti è utile e ti va, puoi offrirci un caffè. Del tutto facoltativo: tutto resta uguale per tutti.',
    supportAction: 'Buy me a coffee',
    supportNewTab: '(si apre in una nuova scheda)',
    saveError: 'Impossibile salvare. Riprova.',
    onThisPage: 'In questa pagina',
  },
  en: {
    title: 'Settings',
    lead: 'Appearance, account, notifications and privacy.',
    appearance: 'Appearance',
    theme: 'Colour scheme',
    themeHint: 'System follows your device’s setting.',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    languageHint: 'Applies to the whole website.',
    sidebar: 'Collapsed sidebar',
    sidebarHint: 'Show only the icons on large screens.',
    account: 'Account & security',
    password: 'Change WebUntis password',
    passwordHint: 'Also applies in the WebUntis app afterwards.',
    forgot: 'Reset password',
    forgotHint: 'WebUntis sends you a link by e-mail.',
    profile: 'Profile & activity',
    profileHint: 'Your details and when you used POKYH.',
    notifications: 'Notifications',
    push: 'Browser notifications',
    pushOn: 'On',
    pushOff: 'Tell me about new messages, due to-dos and reminders.',
    pushBlocked: 'Blocked in the browser. Allow them in your browser’s site settings.',
    pushUnsupported: 'This browser doesn’t support notifications.',
    pushEnable: 'Turn on',
    privacy: 'Privacy',
    usage: 'Personal usage statistics',
    usageHint: 'Links your use to your account so you can see your activity in your profile. Without consent it is only counted anonymously.',
    acknowledged: 'Privacy notice acknowledged',
    never: 'Not yet',
    cookies: 'Cookie settings',
    cookiesHint: 'Change your cookie banner choice.',
    policy: 'Privacy policy',
    storage: 'Storage',
    clearCache: 'Delete offline copies',
    clearCacheHint: 'Timetables, grades and messages saved on this device. You stay signed in.',
    cleared: 'Deleted',
    about: 'About POKYH',
    version: 'Version',
    legal: 'Imprint & legal',
    faq: 'Frequently asked questions',
    source: 'Source code on GitHub',
    logout: 'Log out',
    logoutHint: 'Signs you out on this device.',
    logoutConfirm: 'Really log out?',
    supportTitle: 'Support POKYH',
    supportText: 'POKYH is free, has no ads and is built in our spare time. If the app helps you and you feel like it, you can buy us a coffee. Entirely optional: everything stays the same for everyone.',
    supportAction: 'Buy me a coffee',
    supportNewTab: '(opens in a new tab)',
    saveError: 'Could not be saved. Please try again.',
    onThisPage: 'On this page',
  },
};
