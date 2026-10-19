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
  | 'ctaFaq'
  | 'asOf';

export const comparisonDict: Dictionary<ComparisonKey> = {
  de: {
    metaTitle: 'POKYH und WebUntis im Vergleich',
    metaDescription: 'Was POKYH zusätzlich bietet, etwa Notenrechner, Klassen-Erinnerungen und To-dos, und wofür du weiterhin WebUntis brauchst. Für jede Schule mit WebUntis.',
    ogTitle: 'POKYH und WebUntis im Vergleich',
    ogDescription: 'Was bietet POKYH zusätzlich zu WebUntis? Eine sachliche Gegenüberstellung für Schülerinnen, Schüler und Eltern.',
    title: 'POKYH und WebUntis, ehrlich verglichen.',
    lead: 'POKYH ersetzt WebUntis nicht. Es nutzt dein WebUntis-Konto, zeigt die Daten in einer eigenen Oberfläche und ergänzt ein paar Funktionen.',
    note: 'POKYH ist ein unabhängiges Projekt und nicht mit der Untis GmbH verbunden. Du meldest dich weiterhin mit deinem WebUntis-Konto an.',
    pokyhSub: 'Für jede Schule mit WebUntis',
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
    sumPokyhBody: 'Für den Schulalltag gebaut: Stunden und Noten im Blick, Erinnerungen, To-dos und, wo vorhanden, die Mensa.',
    sumWebuntisTitle: 'WebUntis',
    sumWebuntisBody: 'Die offizielle Plattform der Untis GmbH, mit Funktionen für Lehrkräfte und Verwaltung.',
    sumTogetherTitle: 'Zusammen',
    sumTogetherBody: 'Du meldest dich in POKYH mit deinem WebUntis-Konto an. Beide zeigen dieselben Daten; du kannst sie nebeneinander nutzen.',
    ctaTitle: 'Selbst sehen.',
    ctaLead: 'Kostenlos, mit deinem WebUntis-Konto.',
    ctaLogin: 'Anmelden',
    ctaFaq: 'Zu den FAQ',
    asOf: 'Stand: Oktober 2026. Angaben zu WebUntis nach öffentlich zugänglichen Informationen der Untis GmbH; welche Funktionen eine Schule freischaltet, kann abweichen. WebUntis und Untis sind Marken der Untis GmbH.',
  },
  it: {
    metaTitle: 'POKYH e WebUntis a confronto',
    metaDescription: 'Cosa offre in più POKYH, come calcolatore dei voti, promemoria di classe e to-do, e per cosa serve ancora WebUntis. Per ogni scuola con WebUntis.',
    ogTitle: 'POKYH e WebUntis a confronto',
    ogDescription: 'Cosa offre POKYH in più rispetto a WebUntis? Un confronto oggettivo per studenti e genitori.',
    title: 'POKYH e WebUntis, confrontati onestamente.',
    lead: 'POKYH non sostituisce WebUntis. Usa il tuo account WebUntis, mostra i dati in un’interfaccia propria e aggiunge alcune funzioni.',
    note: 'POKYH è un progetto indipendente e non è collegato a Untis GmbH. Continui ad accedere con il tuo account WebUntis.',
    pokyhSub: 'Per ogni scuola con WebUntis',
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
    sumPokyhBody: 'Pensata per la vita a scuola: ore e voti sotto controllo, promemoria, to-do e, dove disponibile, la mensa.',
    sumWebuntisTitle: 'WebUntis',
    sumWebuntisBody: 'La piattaforma ufficiale di Untis GmbH, con funzioni per docenti e segreteria.',
    sumTogetherTitle: 'Insieme',
    sumTogetherBody: 'Accedi a POKYH con il tuo account WebUntis. Mostrano gli stessi dati; puoi usarli entrambi.',
    ctaTitle: 'Guarda tu stesso.',
    ctaLead: 'Gratis, con il tuo account WebUntis.',
    ctaLogin: 'Accedi',
    ctaFaq: 'Alle FAQ',
    asOf: 'Aggiornato a ottobre 2026. Dati su WebUntis secondo le informazioni pubbliche di Untis GmbH; le funzioni attivate da una scuola possono variare. WebUntis e Untis sono marchi di Untis GmbH.',
  },
  en: {
    metaTitle: 'POKYH and WebUntis compared',
    metaDescription: 'What POKYH adds, such as a grade calculator, class reminders and to-dos, and what you still use WebUntis for. For every school on WebUntis.',
    ogTitle: 'POKYH and WebUntis compared',
    ogDescription: 'What does POKYH add to WebUntis? A factual comparison for students and parents.',
    title: 'POKYH and WebUntis, compared honestly.',
    lead: 'POKYH does not replace WebUntis. It uses your WebUntis account, shows the data in its own interface and adds a few features.',
    note: 'POKYH is an independent project and is not affiliated with Untis GmbH. You still sign in with your WebUntis account.',
    pokyhSub: 'For every school on WebUntis',
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
    sumPokyhBody: 'Built for school days: lessons and grades at a glance, reminders, to-dos and, where available, the cafeteria.',
    sumWebuntisTitle: 'WebUntis',
    sumWebuntisBody: 'The official platform by Untis GmbH, with features for teachers and administration.',
    sumTogetherTitle: 'Together',
    sumTogetherBody: 'You sign in to POKYH with your WebUntis account. Both show the same data; you can use them side by side.',
    ctaTitle: 'See for yourself.',
    ctaLead: 'Free, with your WebUntis account.',
    ctaLogin: 'Sign in',
    ctaFaq: 'Go to the FAQ',
    asOf: 'As of October 2026. WebUntis details are based on information published by Untis GmbH; the features a school switches on may differ. WebUntis and Untis are trademarks of Untis GmbH.',
  },
};
