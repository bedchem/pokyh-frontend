import type { Dictionary } from '../dictionary';

/**
 * Page titles and descriptions (browser tab, search results, link previews,
 * structured data). Written for people first: what POKYH is, for whom, and
 * that it works with any school on WebUntis. Brand names of Untis GmbH are
 * used only to describe compatibility, always with the note that POKYH is not
 * affiliated with it.
 */
export type MetaKey =
  | 'siteTitle'
  | 'siteDescription'
  | 'siteOgDescription'
  | 'landingTitle'
  | 'landingDescription'
  | 'landingOgTitle'
  | 'landingOgDescription'
  | 'loginTitle'
  | 'loginDescription'
  | 'loginOgTitle'
  | 'loginOgDescription'
  | 'notFound'
  | 'appDescription'
  | 'websiteDescription'
  | 'featureList'
  | 'offerDescription'
  | 'audience'
  | 'breadcrumbLogin'
  | 'aboutHeading'
  | 'aboutText'
  | 'aboutPoints'
  | 'independence';

export const metaDict: Dictionary<MetaKey> = {
  de: {
    siteTitle: 'POKYH | Die WebUntis-Alternative für Schüler und Eltern',
    siteDescription: 'POKYH ist eine kostenlose App für WebUntis: Stundenplan, Vertretungen, Noten, Abwesenheiten und Nachrichten übersichtlich an einem Ort. Für jede Schule mit WebUntis, in Europa und weltweit. Ohne Werbung.',
    siteOgDescription: 'Stundenplan, Noten, Abwesenheiten und Nachrichten aus WebUntis, übersichtlich in einer App. Kostenlos, ohne Werbung, für jede Schule mit WebUntis.',
    landingTitle: 'POKYH | WebUntis-Alternative für Stundenplan und Noten',
    landingDescription: 'Mit deinem WebUntis-Konto: Stundenplan, Vertretungen, Prüfungen, Noten mit Schnitt, Abwesenheiten und Nachrichten auf einen Blick. Kostenlos, ohne Werbung.',
    landingOgTitle: 'POKYH: Deine Schule mit WebUntis, übersichtlich',
    landingOgDescription: 'Die kostenlose App für WebUntis: Stundenplan, Noten, Abwesenheiten und Nachrichten an einem Ort. Für jede Schule mit WebUntis.',
    loginTitle: 'Anmelden | POKYH, die App für WebUntis',
    loginDescription: 'Such deine Schule und melde dich mit deinem WebUntis-Konto an. Jede Schule mit WebUntis ist dabei, dein Passwort geht nur an ihren Server.',
    loginOgTitle: 'Bei POKYH anmelden',
    loginOgDescription: 'Schule wählen, mit dem WebUntis-Konto anmelden, fertig. Stundenplan, Noten und Nachrichten in einer App.',
    notFound: 'Seite nicht gefunden',
    appDescription: 'POKYH ist eine kostenlose, werbefreie App für Schülerinnen, Schüler und Eltern an Schulen, die WebUntis nutzen. Sie zeigt Stundenplan mit Vertretungen und Prüfungen, Noten mit automatischem Schnitt, Abwesenheiten, Nachrichten, persönliche To-dos und Klassen-Erinnerungen. Die Anmeldung läuft über das eigene WebUntis-Konto der Schule.',
    websiteDescription: 'Die kostenlose App für WebUntis: Stundenplan, Noten, Abwesenheiten und Nachrichten an einem Ort.',
    featureList: 'Stundenplan in Tages- und Wochenansicht|Vertretungen, Entfall und Prüfungen im Stundenplan|Noten nach Fach mit automatischem Schnitt und Notenrechner|Abwesenheiten in Stunden und Prozent, pro Monat, entschuldigt und offen|Nachrichten mit Anhängen|Persönliche To-do-Liste|Klassenweite Erinnerungen|Mensa-Speiseplan, wo die Schule einen hat|Dunkelmodus und Design für Handy, Tablet und Computer|Installierbar als Web-App|Notenrechner und Fehlstundenrechner ohne Anmeldung|Kostenlos und ohne Werbung',
    offerDescription: 'Kostenlos und ohne Werbung',
    audience: 'Schülerinnen, Schüler und Eltern an Schulen mit WebUntis',
    breadcrumbLogin: 'Anmelden',
    aboutHeading: 'POKYH in Kürze',
    aboutText: 'POKYH ist eine unabhängige, kostenlose App für WebUntis. Du suchst deine Schule, meldest dich mit deinem WebUntis-Konto an und siehst Stundenplan, Vertretungen, Prüfungen, Noten, Abwesenheiten und Nachrichten übersichtlich an einem Ort, im Browser, als Web-App oder auf dem Handy. POKYH funktioniert mit jeder Schule, die WebUntis nutzt, in Italien, Österreich, Deutschland, der Schweiz, im übrigen Europa und überall sonst auf der Welt. Entstanden ist POKYH an einer Berufsschule in Südtirol.',
    aboutPoints: 'Für jede Schule mit WebUntis|Kostenlos und ohne Werbung|Deutsch, Italienisch und Englisch|Handy, Tablet und Computer',
    independence: 'POKYH ist ein unabhängiges Projekt und nicht mit der Untis GmbH verbunden. WebUntis und Untis sind Marken der Untis GmbH.',
  },
  it: {
    siteTitle: 'POKYH | L’alternativa a WebUntis per studenti e genitori',
    siteDescription: 'POKYH è un’app gratuita per WebUntis: orario, supplenze, voti, assenze e messaggi in un unico posto. Per ogni scuola che usa WebUntis, in Europa e nel mondo. Senza pubblicità.',
    siteOgDescription: 'Orario, voti, assenze e messaggi da WebUntis, chiari in un’unica app. Gratuita, senza pubblicità, per ogni scuola con WebUntis.',
    landingTitle: 'POKYH | Alternativa a WebUntis per orario e voti',
    landingDescription: 'Con il tuo account WebUntis: orario, supplenze, verifiche, voti con media, assenze e messaggi a colpo d’occhio. Gratuita, senza pubblicità.',
    landingOgTitle: 'POKYH: la tua scuola con WebUntis, chiara',
    landingOgDescription: 'L’app gratuita per WebUntis: orario, voti, assenze e messaggi in un unico posto. Per ogni scuola con WebUntis.',
    loginTitle: 'Accedi | POKYH, l’app per WebUntis',
    loginDescription: 'Cerca la tua scuola e accedi con il tuo account WebUntis. Ci sono tutte le scuole con WebUntis, la password va solo al loro server.',
    loginOgTitle: 'Accedi a POKYH',
    loginOgDescription: 'Scegli la scuola, accedi con l’account WebUntis, fatto. Orario, voti e messaggi in un’unica app.',
    notFound: 'Pagina non trovata',
    appDescription: 'POKYH è un’app gratuita e senza pubblicità per studentesse, studenti e genitori delle scuole che usano WebUntis. Mostra l’orario con supplenze e verifiche, i voti con media automatica, le assenze, i messaggi, i to-do personali e i promemoria di classe. Si accede con il proprio account WebUntis della scuola.',
    websiteDescription: 'L’app gratuita per WebUntis: orario, voti, assenze e messaggi in un unico posto.',
    featureList: 'Orario giornaliero e settimanale|Supplenze, ore annullate e verifiche nell’orario|Voti per materia con media automatica e calcolatore|Assenze in ore e percentuale, per mese, giustificate e da giustificare|Messaggi con allegati|Lista di to-do personale|Promemoria per tutta la classe|Menù della mensa, dove la scuola ne ha uno|Modalità scura e design per smartphone, tablet e computer|Installabile come web app|Calcolo media voti e assenze senza accesso|Gratuita e senza pubblicità',
    offerDescription: 'Gratuita e senza pubblicità',
    audience: 'Studentesse, studenti e genitori delle scuole con WebUntis',
    breadcrumbLogin: 'Accedi',
    aboutHeading: 'POKYH in breve',
    aboutText: 'POKYH è un’app indipendente e gratuita per WebUntis. Cerchi la tua scuola, accedi con il tuo account WebUntis e vedi orario, supplenze, verifiche, voti, assenze e messaggi in un unico posto, nel browser, come web app o sullo smartphone. POKYH funziona con ogni scuola che usa WebUntis, in Italia, Austria, Germania, Svizzera, nel resto d’Europa e in tutto il mondo. È nata in una scuola professionale dell’Alto Adige.',
    aboutPoints: 'Per ogni scuola con WebUntis|Gratuita e senza pubblicità|Italiano, tedesco e inglese|Smartphone, tablet e computer',
    independence: 'POKYH è un progetto indipendente e non è collegato a Untis GmbH. WebUntis e Untis sono marchi di Untis GmbH.',
  },
  en: {
    siteTitle: 'POKYH | The WebUntis alternative for students and parents',
    siteDescription: 'POKYH is a free app for WebUntis: timetable, substitutions, grades, absences and messages in one clear place. For every school on WebUntis, in Europe and worldwide. No ads.',
    siteOgDescription: 'Timetable, grades, absences and messages from WebUntis, clear in one app. Free, no ads, for every school on WebUntis.',
    landingTitle: 'POKYH | WebUntis alternative for timetable and grades',
    landingDescription: 'With your WebUntis account: timetable, substitutions, exams, grades with averages, absences and messages at a glance. Free, no ads.',
    landingOgTitle: 'POKYH: your school on WebUntis, at a glance',
    landingOgDescription: 'The free app for WebUntis: timetable, grades, absences and messages in one place. For every school on WebUntis.',
    loginTitle: 'Sign in | POKYH, the app for WebUntis',
    loginDescription: 'Find your school and sign in to POKYH with your WebUntis account. Every school on WebUntis is here. Your password only goes to your school’s WebUntis server.',
    loginOgTitle: 'Sign in to POKYH',
    loginOgDescription: 'Pick your school, sign in with your WebUntis account, done. Timetable, grades and messages in one app.',
    notFound: 'Page not found',
    appDescription: 'POKYH is a free, ad-free app for students and parents at schools that use WebUntis. It shows the timetable with substitutions and exams, grades with an automatic average, absences, messages, personal to-dos and class reminders. You sign in with your school’s own WebUntis account.',
    websiteDescription: 'The free app for WebUntis: timetable, grades, absences and messages in one place.',
    featureList: 'Timetable in day and week view|Substitutions, cancellations and exams in the timetable|Grades by subject with automatic average and calculator|Absences in hours and percent, per month, excused and open|Messages with attachments|Personal to-do list|Class-wide reminders|Cafeteria menu, where the school has one|Dark mode and design for phone, tablet and computer|Installable as a web app|Grade and absence calculators without sign-in|Free and without ads',
    offerDescription: 'Free and without ads',
    audience: 'Students and parents at schools that use WebUntis',
    breadcrumbLogin: 'Sign in',
    aboutHeading: 'POKYH in short',
    aboutText: 'POKYH is an independent, free app for WebUntis. You find your school, sign in with your WebUntis account and see timetable, substitutions, exams, grades, absences and messages in one clear place, in the browser, as a web app or on your phone. POKYH works with every school that uses WebUntis, in Italy, Austria, Germany, Switzerland, the rest of Europe and anywhere else in the world. It started at a vocational school in South Tyrol.',
    aboutPoints: 'For every school on WebUntis|Free and without ads|English, German and Italian|Phone, tablet and computer',
    independence: 'POKYH is an independent project and is not affiliated with Untis GmbH. WebUntis and Untis are trademarks of Untis GmbH.',
  },
};
