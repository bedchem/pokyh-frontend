import type { Dictionary } from '../dictionary';

export type ComparisonKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogTitle'
  | 'ogDescription'
  | 'title'
  | 'lead'
  | 'note'
  | 'pokyhSub'
  | 'webuntisSub'
  | 'yes'
  | 'partial'
  | 'no'
  | 'secGeneral'
  | 'secDesign'
  | 'secFeatures'
  | 'secPlatform'
  | 'rFree'
  | 'rAdFree'
  | 'rNoAccount'
  | 'rModern'
  | 'rDark'
  | 'rMobileFirst'
  | 'rMobileApp'
  | 'rTimetable'
  | 'rSubst'
  | 'rGrades'
  | 'rCalculator'
  | 'rMensa'
  | 'rMessages'
  | 'rAbsences'
  | 'rReminders'
  | 'rTodos'
  | 'rWebApp'
  | 'rNativeApps'
  | 'rTeachers'
  | 'rOfficial'
  | 'rOpenSource'
  | 'sumTitle'
  | 'sumPokyhTitle'
  | 'sumPokyhBody'
  | 'sumWebuntisTitle'
  | 'sumWebuntisBody'
  | 'sumTogetherTitle'
  | 'sumTogetherBody'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin'
  | 'ctaFaq';

export const comparisonDict: Dictionary<ComparisonKey> = {
  de: {
    metaTitle: 'POKYH vs. WebUntis – Funktionsvergleich | Schulapp Tschuggmall Brixen',
    metaDescription: 'POKYH vs. WebUntis: Was bietet POKYH zusätzlich? Mensa, automatischer Notenschnitt, Klassen-Erinnerungen, kostenlos für Schüler des BFS Tschuggmall / LBS Brixen.',
    ogTitle: 'POKYH vs. WebUntis – Funktionsvergleich',
    ogDescription: 'Was bietet POKYH zusätzlich zu WebUntis? Eine ehrliche Gegenüberstellung für Schüler des BFS Tschuggmall / LBS Brixen.',
    title: 'POKYH und WebUntis, ehrlich verglichen.',
    lead: 'POKYH ersetzt WebUntis nicht. Es nutzt dein WebUntis-Konto und legt eine schnellere Oberfläche und ein paar fehlende Funktionen darüber.',
    note: 'POKYH ist kein offizielles Produkt und steht in keiner Verbindung zur Untis GmbH. Du meldest dich weiterhin mit deinem WebUntis-Konto an.',
    pokyhSub: 'Für Schüler der LBS Brixen',
    webuntisSub: 'Offizielle Plattform',
    yes: 'Ja',
    partial: 'Teilweise',
    no: 'Nein',
    secGeneral: 'Allgemein',
    secDesign: 'Design und Bedienung',
    secFeatures: 'Funktionen',
    secPlatform: 'Plattform',
    rFree: 'Kostenlos',
    rAdFree: 'Werbefrei',
    rNoAccount: 'Ohne Schulkonto nutzbar',
    rModern: 'Aufgeräumtes Design',
    rDark: 'Dunkles Design',
    rMobileFirst: 'Fürs Handy gebaut',
    rMobileApp: 'Mobile App',
    rTimetable: 'Stundenplan',
    rSubst: 'Vertretungen und Entfall',
    rGrades: 'Noten mit Schnitt',
    rCalculator: 'Notenrechner',
    rMensa: 'Mensa-Speiseplan',
    rMessages: 'Nachrichten mit Anhängen',
    rAbsences: 'Abwesenheiten',
    rReminders: 'Klassen-Erinnerungen',
    rTodos: 'Persönliche To-dos',
    rWebApp: 'Web-App',
    rNativeApps: 'App für iPhone und Android',
    rTeachers: 'Funktionen für Lehrkräfte',
    rOfficial: 'Offizielle Plattform der Schule',
    rOpenSource: 'Open Source',
    sumTitle: 'Kurz gesagt',
    sumPokyhTitle: 'POKYH',
    sumPokyhBody: 'Für den Schulalltag gebaut: schneller Blick auf Stunden und Noten, Mensa, Erinnerungen und To-dos.',
    sumWebuntisTitle: 'WebUntis',
    sumWebuntisBody: 'Die offizielle Plattform der Untis GmbH, mit Funktionen für Lehrkräfte und Verwaltung.',
    sumTogetherTitle: 'Zusammen',
    sumTogetherBody: 'Du meldest dich in POKYH mit deinem WebUntis-Konto an. Beide zeigen dieselben Daten; du kannst sie nebeneinander nutzen.',
    ctaTitle: 'Selbst sehen.',
    ctaLead: 'Kostenlos, mit deinem WebUntis-Konto.',
    ctaLogin: 'Anmelden',
    ctaFaq: 'Zu den FAQ',
  },
  it: {
    metaTitle: 'POKYH vs. WebUntis – Confronto delle funzioni | App scolastica Tschuggmall Bressanone',
    metaDescription: 'POKYH vs. WebUntis: cosa offre in più POKYH? Mensa, media automatica, promemoria di classe, gratis per gli studenti del BFS Tschuggmall / LBS Bressanone.',
    ogTitle: 'POKYH vs. WebUntis – Confronto delle funzioni',
    ogDescription: 'Cosa offre POKYH in più rispetto a WebUntis? Un confronto onesto per gli studenti del BFS Tschuggmall / LBS Bressanone.',
    title: 'POKYH e WebUntis, confrontati onestamente.',
    lead: 'POKYH non sostituisce WebUntis. Usa il tuo account WebUntis e aggiunge un’interfaccia più veloce e qualche funzione che mancava.',
    note: 'POKYH non è un prodotto ufficiale e non ha legami con Untis GmbH. Continui ad accedere con il tuo account WebUntis.',
    pokyhSub: 'Per gli studenti della LBS Bressanone',
    webuntisSub: 'Piattaforma ufficiale',
    yes: 'Sì',
    partial: 'In parte',
    no: 'No',
    secGeneral: 'In generale',
    secDesign: 'Design e uso',
    secFeatures: 'Funzioni',
    secPlatform: 'Piattaforma',
    rFree: 'Gratuito',
    rAdFree: 'Senza pubblicità',
    rNoAccount: 'Utilizzabile senza account scolastico',
    rModern: 'Design ordinato',
    rDark: 'Tema scuro',
    rMobileFirst: 'Pensato per il telefono',
    rMobileApp: 'App mobile',
    rTimetable: 'Orario',
    rSubst: 'Supplenze e ore saltate',
    rGrades: 'Voti con media',
    rCalculator: 'Calcolatore dei voti',
    rMensa: 'Menù della mensa',
    rMessages: 'Messaggi con allegati',
    rAbsences: 'Assenze',
    rReminders: 'Promemoria di classe',
    rTodos: 'To-do personali',
    rWebApp: 'Web app',
    rNativeApps: 'App per iPhone e Android',
    rTeachers: 'Funzioni per docenti',
    rOfficial: 'Piattaforma ufficiale della scuola',
    rOpenSource: 'Open source',
    sumTitle: 'In breve',
    sumPokyhTitle: 'POKYH',
    sumPokyhBody: 'Pensato per la vita di scuola: uno sguardo veloce a ore e voti, mensa, promemoria e to-do.',
    sumWebuntisTitle: 'WebUntis',
    sumWebuntisBody: 'La piattaforma ufficiale di Untis GmbH, con funzioni per docenti e segreteria.',
    sumTogetherTitle: 'Insieme',
    sumTogetherBody: 'Accedi a POKYH con il tuo account WebUntis. Mostrano gli stessi dati; puoi usarli entrambi.',
    ctaTitle: 'Guarda tu stesso.',
    ctaLead: 'Gratis, con il tuo account WebUntis.',
    ctaLogin: 'Accedi',
    ctaFaq: 'Alle FAQ',
  },
  en: {
    metaTitle: 'POKYH vs. WebUntis – Feature comparison | School app Tschuggmall Brixen',
    metaDescription: 'POKYH vs. WebUntis: what does POKYH add? Cafeteria, automatic grade average, class reminders, free for students at BFS Tschuggmall / LBS Brixen.',
    ogTitle: 'POKYH vs. WebUntis – Feature comparison',
    ogDescription: 'What does POKYH add to WebUntis? An honest comparison for students at BFS Tschuggmall / LBS Brixen.',
    title: 'POKYH and WebUntis, compared honestly.',
    lead: 'POKYH doesn’t replace WebUntis. It uses your WebUntis account and adds a faster interface and a few missing features.',
    note: 'POKYH is not an official product and has no connection to Untis GmbH. You keep signing in with your WebUntis account.',
    pokyhSub: 'For students at LBS Brixen',
    webuntisSub: 'Official platform',
    yes: 'Yes',
    partial: 'Partly',
    no: 'No',
    secGeneral: 'General',
    secDesign: 'Design and use',
    secFeatures: 'Features',
    secPlatform: 'Platform',
    rFree: 'Free',
    rAdFree: 'Ad-free',
    rNoAccount: 'Usable without a school account',
    rModern: 'Tidy design',
    rDark: 'Dark mode',
    rMobileFirst: 'Built for phones',
    rMobileApp: 'Mobile app',
    rTimetable: 'Timetable',
    rSubst: 'Substitutions and cancellations',
    rGrades: 'Grades with average',
    rCalculator: 'Grade calculator',
    rMensa: 'Cafeteria menu',
    rMessages: 'Messages with attachments',
    rAbsences: 'Absences',
    rReminders: 'Class reminders',
    rTodos: 'Personal to-dos',
    rWebApp: 'Web app',
    rNativeApps: 'App for iPhone and Android',
    rTeachers: 'Features for teachers',
    rOfficial: 'The school’s official platform',
    rOpenSource: 'Open source',
    sumTitle: 'In short',
    sumPokyhTitle: 'POKYH',
    sumPokyhBody: 'Built for school life: a quick look at lessons and grades, cafeteria, reminders and to-dos.',
    sumWebuntisTitle: 'WebUntis',
    sumWebuntisBody: 'The official platform by Untis GmbH, with features for teachers and administration.',
    sumTogetherTitle: 'Together',
    sumTogetherBody: 'You sign in to POKYH with your WebUntis account. Both show the same data; you can use them side by side.',
    ctaTitle: 'See for yourself.',
    ctaLead: 'Free, with your WebUntis account.',
    ctaLogin: 'Sign in',
    ctaFaq: 'Go to the FAQ',
  },
};
