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
  | 'm4Title'
  | 'm4Body'
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
    ch1Title: 'Zwei Websites und kein Überblick.',
    ch1Body: 'An unserer Schule gab es zwei Seiten: WebUntis für Stundenplan, Tests und Abwesenheiten, und eine zweite nur für die Noten. Beide haben ihren Zweck erfüllt, mehr nicht. Wer wissen wollte, was morgen ansteht und wie er in Mathe steht, musste zwischen beiden hin und her wechseln, am Handy erst recht.',
    missingTitle: 'Was gefehlt hat',
    missingBody: 'Vier Dinge haben uns besonders gestört.',
    m1Title: 'Keine der beiden Seiten war schön zu benutzen.',
    m1Body: 'Graue Tabellen, kleine Schrift, am Handy kaum zu bedienen. Wir wollten eine App, die man gern aufmacht: klar, schnell und auch im Dunkeln angenehm.',
    m2Title: 'Niemand hat an den Test erinnert.',
    m2Body: 'Morgen Test, und die halbe Klasse wusste es nicht. Erinnerungen in POKYH erscheinen bei allen gleichzeitig, und alle können sie kommentieren.',
    m3Title: 'Den Schnitt musste man selbst rechnen.',
    m3Body: 'Welche Note brauche ich noch für eine Sechs? Dafür gab es nur Papier und Taschenrechner. Jetzt steht der Schnitt pro Fach da, mit Verlauf und einem Notenrechner für die nächste Prüfung.',
    m4Title: 'Die Mensa gab es nicht digital.',
    m4Body: 'Was es mittags gibt, stand nirgends online. Jetzt steht der Speiseplan neben dem Stundenplan, mit Fotos, Allergenen und Sternen von Mitschülern.',
    ch3Title: 'Und uns war langweilig.',
    ch3Body: 'Also haben wir angefangen, ohne Auftrag und ohne Firma dahinter, an vielen Abenden nach der Schule. Zuerst für uns selbst, dann für unsere Klasse und unsere Schule, und heute für alle Schulen mit WebUntis: eine App, die alles an einem Ort zeigt und dabei gut aussieht.',
    builtTitle: 'Was daraus wurde',
    builtLead: 'Jede Funktion hat einen konkreten Grund.',
    fTimetable: 'Stundenplan',
    fTimetableWhy: 'Welche Stunde, wann, mit wem, in welchem Raum. Vertretungen und Entfall fallen sofort auf.',
    fGrades: 'Noten und Schnitt',
    fGradesWhy: 'Alle Noten an einem Ort statt auf einer eigenen Website: der Schnitt pro Fach, der Verlauf und ein Notenrechner, der zeigt, was du noch brauchst.',
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
    teamTitle: 'Wer POKYH baut',
    teamBody: 'Zwei Schüler der LBS Brixen, eine GitHub-Organisation namens bedchem und sehr viele Abende.',
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
    ch1Title: 'Due siti e nessuna visione d’insieme.',
    ch1Body: 'Nella nostra scuola c’erano due siti: WebUntis per orario, verifiche e assenze, e un secondo solo per i voti. Facevano il loro lavoro, niente di più. Chi voleva sapere cosa c’era domani e come andava in matematica doveva passare dall’uno all’altro, ancora peggio sul telefono.',
    missingTitle: 'Cosa mancava',
    missingBody: 'Quattro cose ci davano particolarmente fastidio.',
    m1Title: 'Nessuno dei due era bello da usare.',
    m1Body: 'Tabelle grigie, testo piccolo, quasi inutilizzabili sul telefono. Volevamo un’app che si apre volentieri: chiara, veloce e piacevole anche al buio.',
    m2Title: 'Nessuno ricordava la verifica.',
    m2Body: 'Domani c’è il test e metà classe non lo sapeva. I promemoria di POKYH compaiono a tutti nello stesso momento e tutti possono commentarli.',
    m3Title: 'La media bisognava calcolarla da soli.',
    m3Body: 'Che voto mi serve ancora per un sei? C’erano solo carta e calcolatrice. Ora la media c’è per ogni materia, con l’andamento e un calcolatore per la prossima prova.',
    m4Title: 'La mensa non era digitale.',
    m4Body: 'Cosa c’era a pranzo non si trovava online. Ora il menù è accanto all’orario, con foto, allergeni e le stelle dei compagni.',
    ch3Title: 'E ci annoiavamo.',
    ch3Body: 'Così abbiamo cominciato, senza incarico e senza un’azienda alle spalle, in tante serate dopo la scuola. Prima per noi, poi per la nostra classe e la nostra scuola, e oggi per tutte le scuole con WebUntis: un’app che mette tutto in un posto solo, ed è anche bella.',
    builtTitle: 'Cosa ne è nato',
    builtLead: 'Ogni funzione ha un motivo preciso.',
    fTimetable: 'Orario',
    fTimetableWhy: 'Quale ora, quando, con chi, in quale aula. Supplenze e ore saltate si notano subito.',
    fGrades: 'Voti e media',
    fGradesWhy: 'Tutti i voti in un posto solo invece che su un sito a parte: la media per materia, l’andamento e un calcolatore che mostra cosa ti serve ancora.',
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
    teamTitle: 'Chi costruisce POKYH',
    teamBody: 'Due studenti della LBS di Bressanone, un’organizzazione GitHub chiamata bedchem e tantissime serate.',
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
    ch1Title: 'Two websites, no overview.',
    ch1Body: 'Our school had two sites: WebUntis for the timetable, tests and absences, and a second one just for grades. Both did their job and nothing more. Anyone who wanted to know what was on tomorrow and how they were doing in maths had to switch between them, and on a phone it was worse.',
    missingTitle: 'What was missing',
    missingBody: 'Four things bothered us most.',
    m1Title: 'Neither of them was nice to use.',
    m1Body: 'Grey tables, tiny text, barely usable on a phone. We wanted an app you like to open: clear, fast and easy on the eyes at night.',
    m2Title: 'Nobody reminded you about the test.',
    m2Body: 'Test tomorrow, and half the class didn’t know. Reminders in POKYH show up for everyone at the same time, and everyone can comment.',
    m3Title: 'You had to work out your average yourself.',
    m3Body: 'Which grade do I still need to pass? There was only paper and a calculator. Now your average is there for every subject, with a trend and a calculator for the next test.',
    m4Title: 'The cafeteria wasn’t online.',
    m4Body: 'What was for lunch couldn’t be found anywhere online. Now the menu sits next to your timetable, with photos, allergens and stars from classmates.',
    ch3Title: 'And we were bored.',
    ch3Body: 'So we got started, with no assignment and no company behind it, over a lot of evenings after school. First for ourselves, then for our class and our school, and today for every school on WebUntis: one app that puts everything in one place, and looks good doing it.',
    builtTitle: 'What came of it',
    builtLead: 'Every feature has a concrete reason.',
    fTimetable: 'Timetable',
    fTimetableWhy: 'Which lesson, when, with whom, in which room. Substitutions and cancellations stand out right away.',
    fGrades: 'Grades and average',
    fGradesWhy: 'All your grades in one place instead of on a separate website: the average per subject, a trend and a calculator that shows what you still need.',
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
    teamTitle: 'Who builds POKYH',
    teamBody: 'Two students at the LBS Brixen, a GitHub organisation called bedchem and a lot of evenings.',
    profile: 'View profile',
    github: 'bedchem on GitHub',
    ctaTitle: 'Try it.',
    ctaLead: 'Free, with your WebUntis account.',
    ctaLogin: 'Sign in',
    ctaCompare: 'POKYH and WebUntis compared',
  },
};
