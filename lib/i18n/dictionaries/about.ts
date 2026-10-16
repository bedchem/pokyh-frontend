import type { Dictionary } from '../dictionary';

export type AboutKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogTitle'
  | 'ogDescription'
  | 'title'
  | 'lead'
  | 'missingTitle'
  | 'm1Title'
  | 'm1Body'
  | 'm2Title'
  | 'm2Body'
  | 'm3Title'
  | 'm3Body'
  | 'builtTitle'
  | 'builtLead'
  | 'fTimetable'
  | 'fTimetableWhy'
  | 'fGrades'
  | 'fGradesWhy'
  | 'fMensa'
  | 'fMensaWhy'
  | 'fMessages'
  | 'fMessagesWhy'
  | 'fAbsences'
  | 'fAbsencesWhy'
  | 'fReminders'
  | 'fRemindersWhy'
  | 'fTodos'
  | 'fTodosWhy'
  | 'stackTitle'
  | 'stackBody'
  | 'sWeb'
  | 'sTypes'
  | 'sApi'
  | 'sDb'
  | 'sRealtime'
  | 'sAuth'
  | 'sMotion'
  | 'sNative'
  | 'teamTitle'
  | 'teamBody'
  | 'github'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin'
  | 'ctaCompare';

export const aboutDict: Dictionary<AboutKey> = {
  de: {
    metaTitle: 'Über POKYH – Die Geschichte dahinter | Schulapp Tschuggmall Brixen',
    metaDescription: 'Wie POKYH entstanden ist: zwei Schüler des BFS Tschuggmall (LBS Brixen) haben sich ihre eigene Schulapp gebaut. Open Source, kostenlos, für Schüler.',
    ogTitle: 'Über POKYH – Die Geschichte dahinter',
    ogDescription: 'Von zwei Schülern des BFS Tschuggmall / LBS Brixen selbst gebaut. Kostenlos, open source, für Schüler.',
    title: 'Wir wollten eine bessere Schul-App. Also haben wir eine gebaut.',
    lead: 'POKYH ist kein Firmenprodukt. Zwei Schüler der LBS Brixen bauen es in ihrer Freizeit, weil ihnen im Schulalltag Dinge gefehlt haben.',
    missingTitle: 'Was gefehlt hat',
    m1Title: 'Die Mensa war in keiner App.',
    m1Body: 'Jeden Tag dieselbe Suche auf einer eigenen Webseite. Jetzt steht das Menü neben dem Stundenplan, mit Sternen von Mitschülern.',
    m2Title: 'Niemand hat an die Schularbeit erinnert.',
    m2Body: 'Morgen Test, und die halbe Klasse wusste es nicht. Erinnerungen in POKYH erscheinen bei allen gleichzeitig.',
    m3Title: 'Der Stundenplan war schwer zu lesen.',
    m3Body: 'Für den schnellen Blick vor der Stunde war die Oberfläche zu dicht. Wir wollten Raum, Lehrkraft und Änderungen auf einen Blick.',
    builtTitle: 'Was daraus wurde',
    builtLead: 'Jede Funktion hat einen konkreten Grund.',
    fTimetable: 'Stundenplan',
    fTimetableWhy: 'Welche Stunde, wann, mit wem, in welchem Raum. Vertretungen und Entfall fallen sofort auf.',
    fGrades: 'Noten und Schnitt',
    fGradesWhy: 'Den eigenen Schnitt selbst auszurechnen war mühsam. Jetzt steht er da, pro Fach, mit Verlauf und Notenrechner.',
    fMensa: 'Mensa',
    fMensaWhy: 'Das Menü ist direkt dabei, mit Zutaten, Nährwerten und den Bewertungen deiner Mitschüler.',
    fMessages: 'Nachrichten',
    fMessagesWhy: 'WebUntis-Nachrichten lesen und schreiben, Anhänge öffnen und Links anklicken, in einer aufgeräumten Inbox.',
    fAbsences: 'Abwesenheiten',
    fAbsencesWhy: 'Wie viele Stunden fehlen dir eigentlich? Die Übersicht zeigt es pro Monat, entschuldigt und offen.',
    fReminders: 'Klassen-Erinnerungen',
    fRemindersWhy: 'Eine Erinnerung für die ganze Klasse, die bei allen in Echtzeit erscheint, samt Kommentaren.',
    fTodos: 'To-dos',
    fTodosWhy: 'Eine persönliche Liste dort, wo der Rest auch ist, synchron auf allen Geräten.',
    stackTitle: 'Unter der Haube',
    stackBody: 'Die Schuldaten kommen mit deinem eigenen Konto direkt aus WebUntis. Alles darüber hinaus läuft auf einem eigenen Backend: Erinnerungen, To-dos, Mensa-Bewertungen und Echtzeit-Updates.',
    sWeb: 'Web-App',
    sTypes: 'Typsicherheit',
    sApi: 'API',
    sDb: 'Datenbank',
    sRealtime: 'Echtzeit',
    sAuth: 'Anmeldung',
    sMotion: 'Diese Seite',
    sNative: 'Native Apps',
    teamTitle: 'Das Team',
    teamBody: 'Zwei Schüler, eine GitHub-Organisation namens bedchem und sehr viele Abende.',
    github: 'bedchem auf GitHub',
    ctaTitle: 'Probier es aus.',
    ctaLead: 'Kostenlos, mit deinem WebUntis-Konto.',
    ctaLogin: 'Anmelden',
    ctaCompare: 'POKYH und WebUntis im Vergleich',
  },
  it: {
    metaTitle: 'Chi siamo – La storia di POKYH | App scolastica Tschuggmall Bressanone',
    metaDescription: 'Come è nato POKYH: due studenti del BFS Tschuggmall (LBS Bressanone) hanno costruito la propria app scolastica. Open source, gratuita, per studenti.',
    ogTitle: 'Chi siamo – La storia di POKYH',
    ogDescription: 'Costruita da due studenti del BFS Tschuggmall / LBS Bressanone. Gratuita, open source, per studenti.',
    title: 'Volevamo un’app scolastica migliore. Così l’abbiamo costruita.',
    lead: 'POKYH non è un prodotto aziendale. Due studenti della LBS Bressanone lo sviluppano nel tempo libero, perché nella vita scolastica mancavano alcune cose.',
    missingTitle: 'Cosa mancava',
    m1Title: 'La mensa non era in nessuna app.',
    m1Body: 'Ogni giorno la stessa ricerca su un sito a parte. Ora il menù è accanto all’orario, con le stelle dei compagni.',
    m2Title: 'Nessuno ricordava la verifica.',
    m2Body: 'Domani c’è il test e metà classe non lo sapeva. I promemoria di POKYH compaiono a tutti nello stesso momento.',
    m3Title: 'L’orario era difficile da leggere.',
    m3Body: 'Per uno sguardo veloce prima della lezione l’interfaccia era troppo fitta. Volevamo aula, docente e modifiche a colpo d’occhio.',
    builtTitle: 'Cosa ne è nato',
    builtLead: 'Ogni funzione ha un motivo preciso.',
    fTimetable: 'Orario',
    fTimetableWhy: 'Quale ora, quando, con chi, in quale aula. Supplenze e ore saltate si notano subito.',
    fGrades: 'Voti e media',
    fGradesWhy: 'Calcolare la media da soli era faticoso. Ora c’è, per materia, con l’andamento e il calcolatore.',
    fMensa: 'Mensa',
    fMensaWhy: 'Il menù è sempre a portata di mano, con ingredienti, valori nutrizionali e valutazioni dei compagni.',
    fMessages: 'Messaggi',
    fMessagesWhy: 'Leggere e scrivere messaggi WebUntis, aprire allegati e link, in una casella ordinata.',
    fAbsences: 'Assenze',
    fAbsencesWhy: 'Quante ore ti mancano davvero? La panoramica lo mostra mese per mese, giustificate e aperte.',
    fReminders: 'Promemoria di classe',
    fRemindersWhy: 'Un promemoria per tutta la classe che appare a tutti in tempo reale, con i commenti.',
    fTodos: 'To-do',
    fTodosWhy: 'Una lista personale nello stesso posto di tutto il resto, sincronizzata su tutti i dispositivi.',
    stackTitle: 'Sotto il cofano',
    stackBody: 'I dati scolastici arrivano direttamente da WebUntis con il tuo account. Tutto il resto gira su un backend proprio: promemoria, to-do, valutazioni della mensa e aggiornamenti in tempo reale.',
    sWeb: 'Web app',
    sTypes: 'Tipizzazione',
    sApi: 'API',
    sDb: 'Database',
    sRealtime: 'Tempo reale',
    sAuth: 'Accesso',
    sMotion: 'Questa pagina',
    sNative: 'App native',
    teamTitle: 'Il team',
    teamBody: 'Due studenti, un’organizzazione GitHub chiamata bedchem e tantissime serate.',
    github: 'bedchem su GitHub',
    ctaTitle: 'Provala.',
    ctaLead: 'Gratis, con il tuo account WebUntis.',
    ctaLogin: 'Accedi',
    ctaCompare: 'Confronto tra POKYH e WebUntis',
  },
  en: {
    metaTitle: 'About POKYH – The story behind it | School app Tschuggmall Brixen',
    metaDescription: 'How POKYH started: two students at BFS Tschuggmall (LBS Brixen) built their own school app. Open source, free, for students.',
    ogTitle: 'About POKYH – The story behind it',
    ogDescription: 'Built by two students at BFS Tschuggmall / LBS Brixen. Free, open source, for students.',
    title: 'We wanted a better school app. So we built one.',
    lead: 'POKYH isn’t a company product. Two students at LBS Brixen build it in their free time because school life was missing a few things.',
    missingTitle: 'What was missing',
    m1Title: 'The cafeteria wasn’t in any app.',
    m1Body: 'Every day the same search on a separate website. Now the menu sits next to your timetable, with ratings from classmates.',
    m2Title: 'Nobody reminded you about the test.',
    m2Body: 'Test tomorrow, and half the class didn’t know. Reminders in POKYH show up for everyone at the same time.',
    m3Title: 'The timetable was hard to read.',
    m3Body: 'For a quick look before class the interface was too dense. We wanted room, teacher and changes at a glance.',
    builtTitle: 'What came of it',
    builtLead: 'Every feature has a concrete reason.',
    fTimetable: 'Timetable',
    fTimetableWhy: 'Which lesson, when, with whom, in which room. Substitutions and cancellations stand out right away.',
    fGrades: 'Grades and average',
    fGradesWhy: 'Working out your own average was tedious. Now it’s there, per subject, with a trend and a calculator.',
    fMensa: 'Cafeteria',
    fMensaWhy: 'The menu is always at hand, with ingredients, nutrition facts and ratings from classmates.',
    fMessages: 'Messages',
    fMessagesWhy: 'Read and write WebUntis messages, open attachments and links, in a tidy inbox.',
    fAbsences: 'Absences',
    fAbsencesWhy: 'How many hours have you actually missed? The overview shows it month by month, excused and open.',
    fReminders: 'Class reminders',
    fRemindersWhy: 'One reminder for the whole class that appears for everyone in real time, with comments.',
    fTodos: 'To-dos',
    fTodosWhy: 'A personal list where everything else is, in sync on all your devices.',
    stackTitle: 'Under the hood',
    stackBody: 'School data comes straight from WebUntis with your own account. Everything beyond that runs on our own backend: reminders, to-dos, cafeteria ratings and real-time updates.',
    sWeb: 'Web app',
    sTypes: 'Type safety',
    sApi: 'API',
    sDb: 'Database',
    sRealtime: 'Real time',
    sAuth: 'Sign-in',
    sMotion: 'This page',
    sNative: 'Native apps',
    teamTitle: 'The team',
    teamBody: 'Two students, a GitHub organisation called bedchem and a lot of evenings.',
    github: 'bedchem on GitHub',
    ctaTitle: 'Try it.',
    ctaLead: 'Free, with your WebUntis account.',
    ctaLogin: 'Sign in',
    ctaCompare: 'POKYH and WebUntis compared',
  },
};
