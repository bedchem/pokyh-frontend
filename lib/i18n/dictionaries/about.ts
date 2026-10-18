import type { Dictionary } from '../dictionary';

// The story of POKYH, told without technology: why it was started, what was
// missing, what came of it, and the people behind it.
export type AboutKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogTitle'
  | 'ogDescription'
  | 'title'
  | 'lead'
  | 'ch1Title'
  | 'ch1Body'
  | 'missingTitle'
  | 'missingBody'
  | 'm1Title'
  | 'm1Body'
  | 'm2Title'
  | 'm2Body'
  | 'm3Title'
  | 'm3Body'
  | 'ch3Title'
  | 'ch3Body'
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
  | 'ch5Title'
  | 'ch5Body'
  | 'teamTitle'
  | 'teamBody'
  | 'profile'
  | 'github'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin'
  | 'ctaCompare';

export const aboutDict: Dictionary<AboutKey> = {
  de: {
    metaTitle: 'Über POKYH: Wie eine Schul-App für WebUntis entstanden ist',
    metaDescription: 'Wie POKYH entstanden ist: zwei Schüler einer Berufsschule in Südtirol haben sich ihre eigene App für WebUntis gebaut. Heute für jede Schule mit WebUntis, kostenlos und Open Source.',
    ogTitle: 'Über POKYH: die Geschichte dahinter',
    ogDescription: 'Von zwei Schülern selbst gebaut, heute für jede Schule mit WebUntis. Kostenlos, Open Source, ohne Werbung.',
    title: 'Wir wollten eine Schul-App, die passt. Also haben wir eine gebaut.',
    lead: 'POKYH ist kein Firmenprodukt. Zwei Schüler einer Berufsschule in Brixen, Südtirol, bauen es in ihrer Freizeit, weil ihnen im Schulalltag Dinge gefehlt haben. Heute steht es allen Schulen mit WebUntis offen.',
    ch1Title: 'Es fing mit kleinen Fragen an.',
    ch1Body: 'Welche Stunde kommt als Nächstes, in welchem Raum? Was gibt es heute in der Mensa? War morgen nicht ein Test? Jeden Tag dieselben Fragen, und jedes Mal stand die Antwort woanders.',
    missingTitle: 'Was gefehlt hat',
    missingBody: 'Drei Dinge haben uns besonders gestört.',
    m1Title: 'Die Mensa war in keiner App.',
    m1Body: 'Jeden Tag dieselbe Suche auf einer eigenen Webseite. Jetzt steht das Menü neben dem Stundenplan, mit Sternen von Mitschülern.',
    m2Title: 'Niemand hat an die Schularbeit erinnert.',
    m2Body: 'Morgen Test, und die halbe Klasse wusste es nicht. Erinnerungen in POKYH erscheinen bei allen gleichzeitig.',
    m3Title: 'Der Stundenplan war schwer zu lesen.',
    m3Body: 'Für den schnellen Blick vor der Stunde war die Oberfläche zu dicht. Wir wollten Raum, Lehrkraft und Änderungen auf einen Blick.',
    ch3Title: 'Also haben wir angefangen.',
    ch3Body: 'Ohne Auftrag und ohne Firma dahinter, an vielen Abenden nach der Schule. Zuerst für uns selbst, dann für unsere Schule und jetzt für alle Schulen mit WebUntis: eine App, die zeigt, was du gerade wissen willst, und den Rest weglässt.',
    builtTitle: 'Was daraus wurde',
    builtLead: 'Jede Funktion hat einen konkreten Grund.',
    fTimetable: 'Stundenplan',
    fTimetableWhy: 'Welche Stunde, wann, mit wem, in welchem Raum. Vertretungen und Entfall fallen sofort auf.',
    fGrades: 'Noten und Schnitt',
    fGradesWhy: 'Den eigenen Schnitt selbst auszurechnen war mühsam. Jetzt steht er da, pro Fach, mit Verlauf und Notenrechner.',
    fMensa: 'Mensa',
    fMensaWhy: 'Das Menü ist direkt dabei, mit Zutaten, Nährwerten und den Bewertungen deiner Mitschüler.',
    fMessages: 'Nachrichten',
    fMessagesWhy: 'Nachrichten von Lehrkräften lesen und beantworten, Anhänge öffnen, alles in einem aufgeräumten Postfach.',
    fAbsences: 'Abwesenheiten in Stunden und Prozent',
    fAbsencesWhy: 'Wie viele Stunden fehlen dir eigentlich? Die Übersicht zeigt sie Monat für Monat, entschuldigt und offen, und den Anteil an deiner Unterrichtszeit in Prozent. Berechnet aus deinem Stundenplan als Hilfe; verbindlich bleiben die Angaben der Schule.',
    fReminders: 'Klassen-Erinnerungen',
    fRemindersWhy: 'Eine Erinnerung für die ganze Klasse, die bei allen sofort erscheint, samt Kommentaren.',
    fTodos: 'To-dos',
    fTodosWhy: 'Eine persönliche Liste dort, wo der Rest auch ist, auf allen deinen Geräten gleich.',
    ch5Title: 'Und es geht weiter.',
    ch5Body: 'POKYH bleibt kostenlos und ohne Werbung. Es ist ein unabhängiges Projekt und nicht mit der Untis GmbH verbunden. Wir bauen weiter, sobald uns im Schulalltag wieder etwas fehlt. Und wenn dir etwas fehlt: Sag es uns auf GitHub.',
    teamTitle: 'Die Menschen dahinter',
    teamBody: 'Zwei Schüler, eine GitHub-Organisation namens bedchem und sehr viele Abende.',
    profile: 'Profil ansehen',
    github: 'bedchem auf GitHub',
    ctaTitle: 'Probier es aus.',
    ctaLead: 'Kostenlos, mit deinem WebUntis-Konto.',
    ctaLogin: 'Anmelden',
    ctaCompare: 'POKYH und WebUntis im Vergleich',
  },
  it: {
    metaTitle: 'Chi siamo: come è nata un’app scolastica per WebUntis',
    metaDescription: 'Come è nato POKYH: due studenti di una scuola professionale dell’Alto Adige hanno costruito la propria app per WebUntis. Oggi per ogni scuola con WebUntis, gratuita e open source.',
    ogTitle: 'Chi siamo: la storia di POKYH',
    ogDescription: 'Costruita da due studenti, oggi per ogni scuola con WebUntis. Gratuita, open source, senza pubblicità.',
    title: 'Volevamo un’app scolastica su misura. Così l’abbiamo costruita.',
    lead: 'POKYH non è un prodotto aziendale. Due studenti di una scuola professionale di Bressanone, in Alto Adige, lo sviluppano nel tempo libero, perché nella vita scolastica mancavano alcune cose. Oggi è aperta a tutte le scuole con WebUntis.',
    ch1Title: 'Tutto è iniziato con piccole domande.',
    ch1Body: 'Qual è la prossima ora, in quale aula? Cosa c’è oggi in mensa? Domani non c’era una verifica? Ogni giorno le stesse domande, e ogni volta la risposta stava altrove.',
    missingTitle: 'Cosa mancava',
    missingBody: 'Tre cose ci davano particolarmente fastidio.',
    m1Title: 'La mensa non era in nessuna app.',
    m1Body: 'Ogni giorno la stessa ricerca su un sito a parte. Ora il menù è accanto all’orario, con le stelle dei compagni.',
    m2Title: 'Nessuno ricordava la verifica.',
    m2Body: 'Domani c’è il test e metà classe non lo sapeva. I promemoria di POKYH compaiono a tutti nello stesso momento.',
    m3Title: 'L’orario era difficile da leggere.',
    m3Body: 'Per uno sguardo veloce prima della lezione l’interfaccia era troppo fitta. Volevamo aula, docente e modifiche a colpo d’occhio.',
    ch3Title: 'Così abbiamo cominciato.',
    ch3Body: 'Senza incarico e senza un’azienda alle spalle, in tante serate dopo la scuola. Prima per noi stessi, poi per la nostra scuola e ora per tutte le scuole con WebUntis: un’app che mostra quello che vuoi sapere in quel momento e lascia via il resto.',
    builtTitle: 'Cosa ne è nato',
    builtLead: 'Ogni funzione ha un motivo preciso.',
    fTimetable: 'Orario',
    fTimetableWhy: 'Quale ora, quando, con chi, in quale aula. Supplenze e ore saltate si notano subito.',
    fGrades: 'Voti e media',
    fGradesWhy: 'Calcolare la media da soli era faticoso. Ora c’è, per materia, con l’andamento e il calcolatore.',
    fMensa: 'Mensa',
    fMensaWhy: 'Il menù è sempre a portata di mano, con ingredienti, valori nutrizionali e valutazioni dei compagni.',
    fMessages: 'Messaggi',
    fMessagesWhy: 'Leggere e rispondere ai messaggi dei docenti, aprire gli allegati, tutto in una casella ordinata.',
    fAbsences: 'Assenze in ore e percentuale',
    fAbsencesWhy: 'Quante ore hai perso davvero? La panoramica le mostra mese per mese, giustificate e da giustificare, con la quota del tuo orario in percentuale. Calcolate dal tuo orario come aiuto; fanno fede i dati della scuola.',
    fReminders: 'Promemoria di classe',
    fRemindersWhy: 'Un promemoria per tutta la classe che appare subito a tutti, con i commenti.',
    fTodos: 'To-do',
    fTodosWhy: 'Una lista personale nello stesso posto di tutto il resto, uguale su tutti i tuoi dispositivi.',
    ch5Title: 'E si va avanti.',
    ch5Body: 'POKYH resta gratuita e senza pubblicità. È un progetto indipendente e non è collegato a Untis GmbH. Continuiamo a costruire appena nella vita scolastica ci manca di nuovo qualcosa. E se manca qualcosa a te, diccelo su GitHub.',
    teamTitle: 'Le persone dietro',
    teamBody: 'Due studenti, un’organizzazione GitHub chiamata bedchem e tantissime serate.',
    profile: 'Vedi il profilo',
    github: 'bedchem su GitHub',
    ctaTitle: 'Provala.',
    ctaLead: 'Gratis, con il tuo account WebUntis.',
    ctaLogin: 'Accedi',
    ctaCompare: 'Confronto tra POKYH e WebUntis',
  },
  en: {
    metaTitle: 'About POKYH: how a school app for WebUntis came about',
    metaDescription: 'How POKYH started: two students at a vocational school in South Tyrol built their own app for WebUntis. Today for every school on WebUntis, free and open source.',
    ogTitle: 'About POKYH: the story behind it',
    ogDescription: 'Built by two students, today for every school on WebUntis. Free, open source, no ads.',
    title: 'We wanted a school app that fits. So we built one.',
    lead: 'POKYH isn’t a company product. Two students at a vocational school in Brixen, South Tyrol, build it in their free time because school life was missing a few things. Today it is open to every school on WebUntis.',
    ch1Title: 'It started with small questions.',
    ch1Body: 'Which lesson is next, and in which room? What’s in the cafeteria today? Wasn’t there a test tomorrow? The same questions every day, and every time the answer was somewhere else.',
    missingTitle: 'What was missing',
    missingBody: 'Three things bothered us most.',
    m1Title: 'The cafeteria wasn’t in any app.',
    m1Body: 'Every day the same search on a separate website. Now the menu sits next to your timetable, with ratings from classmates.',
    m2Title: 'Nobody reminded you about the test.',
    m2Body: 'Test tomorrow, and half the class didn’t know. Reminders in POKYH show up for everyone at the same time.',
    m3Title: 'The timetable was hard to read.',
    m3Body: 'For a quick look before class the interface was too dense. We wanted room, teacher and changes at a glance.',
    ch3Title: 'So we got started.',
    ch3Body: 'No assignment and no company behind it, just a lot of evenings after school. First for ourselves, then for our school and now for every school on WebUntis: an app that shows what you want to know right now and leaves out the rest.',
    builtTitle: 'What came of it',
    builtLead: 'Every feature has a concrete reason.',
    fTimetable: 'Timetable',
    fTimetableWhy: 'Which lesson, when, with whom, in which room. Substitutions and cancellations stand out right away.',
    fGrades: 'Grades and average',
    fGradesWhy: 'Working out your own average was tedious. Now it’s there, per subject, with a trend and a calculator.',
    fMensa: 'Cafeteria',
    fMensaWhy: 'The menu is always at hand, with ingredients, nutrition facts and ratings from classmates.',
    fMessages: 'Messages',
    fMessagesWhy: 'Read and answer messages from teachers and open attachments, all in one tidy inbox.',
    fAbsences: 'Absences in hours and percent',
    fAbsencesWhy: 'How many hours have you actually missed? The overview shows them month by month, excused and open, and the share of your lesson time in percent. Calculated from your timetable as a help; your school’s records remain authoritative.',
    fReminders: 'Class reminders',
    fRemindersWhy: 'One reminder for the whole class that shows up for everyone right away, with comments.',
    fTodos: 'To-dos',
    fTodosWhy: 'A personal list where everything else is, the same on all your devices.',
    ch5Title: 'And it keeps going.',
    ch5Body: 'POKYH stays free and without ads. It is an independent project and not affiliated with Untis GmbH. We keep building whenever school life is missing something again. And if something is missing for you, tell us on GitHub.',
    teamTitle: 'The people behind it',
    teamBody: 'Two students, a GitHub organisation called bedchem and a lot of evenings.',
    profile: 'View profile',
    github: 'bedchem on GitHub',
    ctaTitle: 'Try it.',
    ctaLead: 'Free, with your WebUntis account.',
    ctaLogin: 'Sign in',
    ctaCompare: 'POKYH and WebUntis compared',
  },
};
