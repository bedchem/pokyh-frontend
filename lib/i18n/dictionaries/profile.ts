import type { Dictionary } from '../dictionary';

// The profile (app/[lang]/(app)/profile) and its statistics (profile/stats).
export type ProfileKey =
  | 'title'
  | 'school'
  | 'copied'
  | 'copy'
  | 'account'
  | 'username'
  | 'studentId'
  | 'class'
  | 'schoolLabel'
  | 'userId'
  | 'classId'
  | 'student'
  | 'guardian'
  | 'settings'
  | 'activity'
  | 'activityLead'
  | 'daysOnline'
  | 'logins'
  | 'currentStreak'
  | 'longestStreak'
  | 'days'
  | 'dayOne'
  | 'less'
  | 'more'
  | 'moreStats'
  | 'cellNone'
  | 'cellOnline'
  | 'cellLogins'
  | 'cellLoginOne'
  | 'cellMinutes'
  | 'activityUnavailable'
  | 'activityKept'
  | 'activityKeptConsent'
  | 'activityKeptYear'
  | 'activityKeptYearConsent'
  | 'consentLink'
  | 'statsOffTitle'
  | 'statsOffText'
  | 'statsTitle'
  | 'statsLead'
  | 'usageTime'
  | 'perDay'
  | 'visits'
  | 'screens'
  | 'whenOnline'
  | 'whenOnlineHint'
  | 'weekdays'
  | 'weekdaysHint'
  | 'devices'
  | 'devicesHint'
  | 'phone'
  | 'computer'
  | 'apps'
  | 'browser'
  | 'topPages'
  | 'topPagesHint'
  | 'views'
  | 'created'
  | 'todosDone'
  | 'todosOpen'
  | 'reminders'
  | 'comments'
  | 'ratings'
  | 'memberSince'
  | 'onlyWithConsent'
  | 'source'
  | 'back'
  | 'minutes'
  | 'hoursMinutes'
  | 'settingsHint'
  | 'websiteHint';

export const profileDict: Dictionary<ProfileKey> = {
  de: {
    title: 'Profil',
    school: 'LBS Brixen',
    copied: 'Kopiert',
    copy: 'Kopieren',
    account: 'Konto',
    username: 'Benutzername',
    studentId: 'Schüler-ID',
    class: 'Klasse',
    schoolLabel: 'Schule',
    userId: 'POKYH-ID',
    classId: 'Klassen-ID',
    student: 'Schüler/in',
    guardian: 'Erziehungsberechtigt',
    settings: 'Einstellungen',
    settingsHint: 'Darstellung, Sprache, Benachrichtigungen und Datenschutz.',
    websiteHint: 'Die öffentliche Seite von POKYH mit allen Infos.',
    activity: 'Aktivität',
    activityLead: 'An welchen Tagen du POKYH genutzt hast.',
    daysOnline: 'Tage online',
    logins: 'Anmeldungen',
    currentStreak: 'Aktuelle Serie',
    longestStreak: 'Längste Serie',
    days: '{n} Tage',
    dayOne: '1 Tag',
    less: 'Weniger',
    more: 'Mehr',
    moreStats: 'Mehr Statistiken',
    cellNone: 'Nicht online',
    cellOnline: 'Online',
    cellLogins: '{n} Anmeldungen',
    cellLoginOne: '1 Anmeldung',
    cellMinutes: '{d} in POKYH',
    activityUnavailable: 'Deine Aktivität kann gerade nicht geladen werden.',
    activityKept: 'POKYH bewahrt Server-Protokolle {n} Tage auf; ältere Tage bleiben leer.',
    activityKeptConsent: 'Nutzungszeit wird mit deiner Zustimmung {n} Tage deinem Konto zugeordnet.',
    activityKeptYear: 'POKYH bewahrt deine aktiven Tage und Anmeldungen für das laufende Schuljahr auf; am Schuljahresende kommen sie ins Schuljahresarchiv.',
    activityKeptYearConsent: 'Nutzungszeit wird mit deiner Zustimmung ebenso lange deinem Konto zugeordnet.',
    consentLink: 'In den Einstellungen einschalten',
    statsOffTitle: 'Persönliche Statistiken sind ausgeschaltet',
    statsOffText: 'Darum siehst du hier nur, an welchen Tagen du online warst, nicht wie lange und was du am meisten öffnest. Du kannst sie jederzeit einschalten und wieder ausschalten.',
    statsTitle: 'Statistiken',
    statsLead: 'Wie du POKYH nutzt, nur für dich sichtbar.',
    usageTime: 'Nutzungszeit',
    perDay: 'Ø pro Tag',
    visits: 'Besuche',
    screens: 'Geöffnete Seiten',
    whenOnline: 'Wann du online bist',
    whenOnlineHint: 'Nutzungszeit nach Uhrzeit.',
    weekdays: 'Wochentage',
    weekdaysHint: 'An welchen Wochentagen du online warst.',
    devices: 'Geräte',
    devicesHint: 'Tage, an denen du das jeweilige Gerät genutzt hast.',
    phone: 'Handy',
    computer: 'Computer',
    apps: 'App',
    browser: 'Browser',
    topPages: 'Meistgenutzte Seiten',
    topPagesHint: 'Auf der Website, in den letzten Wochen.',
    views: '{n} Aufrufe',
    created: 'Was du erstellt hast',
    todosDone: 'To-dos erledigt',
    todosOpen: 'To-dos offen',
    reminders: 'Erinnerungen',
    comments: 'Kommentare',
    ratings: 'Mensa-Bewertungen',
    memberSince: 'Dabei seit',
    onlyWithConsent: 'Nur mit persönlicher Nutzungsstatistik.',
    source: 'Gezeigt wird, was der POKYH-Server ohnehin speichert (Datenschutzerklärung). Nur du siehst diese Übersicht.',
    back: 'Profil',
    minutes: '{n} min',
    hoursMinutes: '{h} h {m} min',
  },
  it: {
    title: 'Profilo',
    school: 'LBS Bressanone',
    copied: 'Copiato',
    copy: 'Copia',
    account: 'Account',
    username: 'Nome utente',
    studentId: 'ID studente',
    class: 'Classe',
    schoolLabel: 'Scuola',
    userId: 'ID POKYH',
    classId: 'ID classe',
    student: 'Studente/ssa',
    guardian: 'Genitore',
    settings: 'Impostazioni',
    settingsHint: 'Aspetto, lingua, notifiche e privacy.',
    websiteHint: 'Il sito pubblico di POKYH con tutte le informazioni.',
    activity: 'Attività',
    activityLead: 'In quali giorni hai usato POKYH.',
    daysOnline: 'Giorni online',
    logins: 'Accessi',
    currentStreak: 'Serie attuale',
    longestStreak: 'Serie più lunga',
    days: '{n} giorni',
    dayOne: '1 giorno',
    less: 'Meno',
    more: 'Più',
    moreStats: 'Altre statistiche',
    cellNone: 'Non online',
    cellOnline: 'Online',
    cellLogins: '{n} accessi',
    cellLoginOne: '1 accesso',
    cellMinutes: '{d} su POKYH',
    activityUnavailable: 'Al momento non è possibile caricare la tua attività.',
    activityKept: 'POKYH conserva i log del server per {n} giorni; i giorni più vecchi restano vuoti.',
    activityKeptConsent: 'Con il tuo consenso il tempo d’uso resta collegato al tuo account per {n} giorni.',
    activityKeptYear: 'POKYH conserva i tuoi giorni attivi e i tuoi accessi per l’anno scolastico in corso; alla fine dell’anno passano nell’archivio dell’anno scolastico.',
    activityKeptYearConsent: 'Con il tuo consenso il tempo d’uso resta collegato al tuo account per lo stesso periodo.',
    consentLink: 'Attiva nelle impostazioni',
    statsOffTitle: 'Le statistiche personali sono disattivate',
    statsOffText: 'Per questo qui vedi solo in quali giorni sei stato online, non per quanto tempo né cosa apri di più. Puoi attivarle e disattivarle in qualsiasi momento.',
    statsTitle: 'Statistiche',
    statsLead: 'Come usi POKYH, visibile solo a te.',
    usageTime: 'Tempo d’uso',
    perDay: 'Media al giorno',
    visits: 'Visite',
    screens: 'Pagine aperte',
    whenOnline: 'Quando sei online',
    whenOnlineHint: 'Tempo d’uso per ora del giorno.',
    weekdays: 'Giorni della settimana',
    weekdaysHint: 'In quali giorni della settimana eri online.',
    devices: 'Dispositivi',
    devicesHint: 'Giorni in cui hai usato ciascun dispositivo.',
    phone: 'Telefono',
    computer: 'Computer',
    apps: 'App',
    browser: 'Browser',
    topPages: 'Pagine più usate',
    topPagesHint: 'Sul sito, nelle ultime settimane.',
    views: '{n} visualizzazioni',
    created: 'Cosa hai creato',
    todosDone: 'To-do completati',
    todosOpen: 'To-do aperti',
    reminders: 'Promemoria',
    comments: 'Commenti',
    ratings: 'Valutazioni mensa',
    memberSince: 'Iscritto dal',
    onlyWithConsent: 'Solo con le statistiche d’uso personali.',
    source: 'Si vede ciò che il server di POKYH conserva comunque (informativa privacy). Solo tu vedi questa panoramica.',
    back: 'Profilo',
    minutes: '{n} min',
    hoursMinutes: '{h} h {m} min',
  },
  en: {
    title: 'Profile',
    school: 'LBS Brixen',
    copied: 'Copied',
    copy: 'Copy',
    account: 'Account',
    username: 'Username',
    studentId: 'Student ID',
    class: 'Class',
    schoolLabel: 'School',
    userId: 'POKYH ID',
    classId: 'Class ID',
    student: 'Student',
    guardian: 'Guardian',
    settings: 'Settings',
    settingsHint: 'Appearance, language, notifications and privacy.',
    websiteHint: 'The public POKYH site with all the details.',
    activity: 'Activity',
    activityLead: 'The days you used POKYH.',
    daysOnline: 'Days online',
    logins: 'Sign-ins',
    currentStreak: 'Current streak',
    longestStreak: 'Longest streak',
    days: '{n} days',
    dayOne: '1 day',
    less: 'Less',
    more: 'More',
    moreStats: 'More statistics',
    cellNone: 'Not online',
    cellOnline: 'Online',
    cellLogins: '{n} sign-ins',
    cellLoginOne: '1 sign-in',
    cellMinutes: '{d} in POKYH',
    activityUnavailable: 'Your activity can’t be loaded right now.',
    activityKept: 'POKYH keeps server logs for {n} days; older days stay empty.',
    activityKeptConsent: 'With your consent, time in POKYH stays linked to your account for {n} days.',
    activityKeptYear: 'POKYH keeps your active days and sign-ins for the current school year; at its end they move to the school-year archive.',
    activityKeptYearConsent: 'With your consent, your time in POKYH stays linked to your account just as long.',
    consentLink: 'Turn it on in settings',
    statsOffTitle: 'Personal statistics are turned off',
    statsOffText: 'That is why you only see the days you were online here, not for how long or what you open most. You can turn them on and off at any time.',
    statsTitle: 'Statistics',
    statsLead: 'How you use POKYH, visible only to you.',
    usageTime: 'Time in POKYH',
    perDay: 'Average per day',
    visits: 'Visits',
    screens: 'Pages opened',
    whenOnline: 'When you’re online',
    whenOnlineHint: 'Time in POKYH by hour of day.',
    weekdays: 'Weekdays',
    weekdaysHint: 'Which weekdays you were online.',
    devices: 'Devices',
    devicesHint: 'Days on which you used each kind of device.',
    phone: 'Phone',
    computer: 'Computer',
    apps: 'App',
    browser: 'Browser',
    topPages: 'Most used pages',
    topPagesHint: 'On the website, in the last weeks.',
    views: '{n} views',
    created: 'What you created',
    todosDone: 'To-dos done',
    todosOpen: 'To-dos open',
    reminders: 'Reminders',
    comments: 'Comments',
    ratings: 'Cafeteria ratings',
    memberSince: 'Member since',
    onlyWithConsent: 'Only with personal usage statistics.',
    source: 'This shows what the POKYH server stores anyway (privacy policy). Only you can see this overview.',
    back: 'Profile',
    minutes: '{n} min',
    hoursMinutes: '{h} h {m} min',
  },
};
