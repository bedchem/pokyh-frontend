import type { Dictionary } from '../dictionary';

export const FAQ_COUNT = 13;

/** Which group each question (1-based) belongs to. */
export const FAQ_GROUPS: { key: 'gGeneral' | 'gAccount' | 'gFeatures'; questions: number[] }[] = [
  { key: 'gGeneral', questions: [1, 2, 11, 3, 7, 13, 12] },
  { key: 'gAccount', questions: [5, 6, 8] },
  { key: 'gFeatures', questions: [4, 9, 10] },
];

type Q = `q${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13}`;
type A = `a${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13}`;

export type FaqKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogDescription'
  | 'title'
  | 'lead'
  | 'search'
  | 'noResults'
  | 'gGeneral'
  | 'gAccount'
  | 'gFeatures'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin'
  | Q
  | A;

export const faqDict: Dictionary<FaqKey> = {
  de: {
    metaTitle: 'FAQ: Häufige Fragen zu POKYH, der App für WebUntis',
    metaDescription: 'Häufige Fragen zu POKYH: Welche Schulen sind dabei? Wie funktioniert die Anmeldung mit WebUntis? Ist POKYH sicher und kostenlos? Alle Antworten auf einen Blick.',
    ogDescription: 'Alle Antworten zu POKYH: Schulen, Anmeldung, Sicherheit und Funktionen.',
    title: 'Häufige Fragen',
    lead: 'Alles zu Anmeldung, Sicherheit und Funktionen. Deine Frage fehlt? Schreib uns auf GitHub.',
    search: 'Frage suchen',
    noResults: 'Keine passende Frage gefunden.',
    gGeneral: 'Allgemein',
    gAccount: 'Anmeldung und Sicherheit',
    gFeatures: 'Funktionen',
    ctaTitle: 'Einfach ausprobieren.',
    ctaLead: 'Kostenlos, mit deinem WebUntis-Konto.',
    ctaLogin: 'Anmelden',
    q1: 'Was ist POKYH?',
    a1: 'POKYH ist eine kostenlose, unabhängige App für WebUntis. Sie zeigt Stundenplan, Vertretungen, Prüfungen, Noten, Abwesenheiten und Nachrichten deiner Schule übersichtlich an einem Ort, im Browser, als Web-App und auf dem Handy.',
    q2: 'Wer kann POKYH nutzen?',
    a2: 'Schülerinnen, Schüler und Eltern jeder Schule, die WebUntis nutzt. Ohne Schulkonto kannst du ein eigenes POKYH-Konto anlegen; dann fehlen die Daten aus WebUntis.',
    q3: 'Was kostet POKYH?',
    a3: 'Nichts. POKYH ist kostenlos, ohne Werbung und ein Open-Source-Projekt.',
    q4: 'Welche Funktionen gibt es?',
    a4: 'Stundenplan mit Vertretungen und Prüfungen, Noten mit Schnitt und Notenrechner, Abwesenheiten in Stunden und als Prozentsatz deiner Unterrichtszeit, WebUntis-Nachrichten mit Anhängen, Klassen-Erinnerungen in Echtzeit und persönliche To-dos. Hat deine Schule einen Speiseplan bei POKYH, siehst du auch die Mensa mit Bewertungen. Berechnete Werte sind eine Hilfe; verbindlich sind die Angaben der Schule.',
    q5: 'Wie melde ich mich an?',
    a5: 'Du suchst deine Schule nach Name, Ort oder Postleitzahl und meldest dich mit deinem WebUntis-Benutzernamen und Passwort an, genau wie bei WebUntis. Eine eigene Registrierung brauchst du nicht. Die gewählte Schule merkt sich dein Browser bis zum Ende des Schuljahres.',
    q6: 'Ist POKYH sicher?',
    a6: 'Alle Verbindungen sind verschlüsselt. Anfragen an WebUntis stellt der POKYH-Server mit deiner Sitzung; das Sitzungs-Token liegt AES-GCM-verschlüsselt in einem httpOnly-Cookie, auf das Skripte im Browser keinen Zugriff haben.',
    q7: 'Was ist der Unterschied zu WebUntis?',
    a7: 'POKYH nutzt dein WebUntis-Konto und zeigt dieselben Schuldaten in einer eigenen, übersichtlichen Oberfläche. Dazu kommen Erinnerungen, To-dos und, wo vorhanden, die Mensa. POKYH ist ein unabhängiges Projekt und nicht mit der Untis GmbH verbunden.',
    q8: 'Speichert POKYH mein Passwort?',
    a8: 'Nicht auf POKYH-Servern. Dein Passwort geht nur an WebUntis. Damit eine abgelaufene Sitzung automatisch erneuert werden kann, liegt es verschlüsselt in einem Cookie in deinem Browser, das nur zusammen mit deiner Sitzung gilt und beim Abmelden gelöscht wird. Löschst du die Cookies, bist du abgemeldet.',
    q9: 'Gibt es POKYH als App?',
    a9: 'Ja. POKYH läuft im Browser auf jedem Gerät, lässt sich als Web-App auf den Homescreen legen und gibt es als App für Android und iPhone über GitHub.',
    q10: 'Sehe ich Vertretungen und Änderungen?',
    a10: 'Ja. Entfall, Vertretungen, zusätzliche Stunden und Prüfungen sind im Stundenplan markiert, sobald sie in WebUntis eingetragen sind.',
    q11: 'Welche Schulen werden unterstützt?',
    a11: 'Jede Schule, die WebUntis nutzt, egal ob in Italien, Österreich, Deutschland, der Schweiz oder anderswo in Europa. Beim Anmelden findest du deine Schule über die Schulsuche von WebUntis. Entstanden ist POKYH an einer Berufsschule in Brixen, Südtirol.',
    q12: 'Kann ich den Quellcode sehen?',
    a12: 'Ja. Der Code der Web-App liegt auf GitHub unter github.com/bedchem/pokyh-frontend, das Backend unter github.com/bedchem/pokyh-backend.',
    q13: 'Ab welchem Alter darf ich POKYH nutzen?',
    a13: 'POKYH ist für Personen ab 14 Jahren. Bist du jünger, nutze POKYH bitte nur mit dem Einverständnis deiner Eltern, zum Beispiel gemeinsam über deren Elternzugang. Freiwillige Statistiken sind erst ab 14 Jahren möglich.',
  },
  it: {
    metaTitle: 'FAQ: Domande frequenti su POKYH, l’app per WebUntis',
    metaDescription: 'Domande frequenti su POKYH: quali scuole sono incluse? Come funziona l’accesso con WebUntis? POKYH è sicura e gratuita? Tutte le risposte in un colpo d’occhio.',
    ogDescription: 'Tutte le risposte su POKYH: scuole, accesso, sicurezza e funzioni.',
    title: 'Domande frequenti',
    lead: 'Tutto su accesso, sicurezza e funzioni. Manca la tua domanda? Scrivici su GitHub.',
    search: 'Cerca una domanda',
    noResults: 'Nessuna domanda trovata.',
    gGeneral: 'In generale',
    gAccount: 'Accesso e sicurezza',
    gFeatures: 'Funzioni',
    ctaTitle: 'Provala e basta.',
    ctaLead: 'Gratis, con il tuo account WebUntis.',
    ctaLogin: 'Accedi',
    q1: 'Cos’è POKYH?',
    a1: 'POKYH è un’app gratuita e indipendente per WebUntis. Mostra orario, supplenze, verifiche, voti, assenze e messaggi della tua scuola in un unico posto, nel browser, come web app e sullo smartphone.',
    q2: 'Chi può usare POKYH?',
    a2: 'Studentesse, studenti e genitori di ogni scuola che usa WebUntis. Senza account scolastico puoi creare un account POKYH; in quel caso mancano i dati di WebUntis.',
    q3: 'Quanto costa POKYH?',
    a3: 'Niente. POKYH è gratuita, senza pubblicità e un progetto open source.',
    q4: 'Quali funzioni ci sono?',
    a4: 'Orario con supplenze e verifiche, voti con media e calcolatore, assenze in ore e come percentuale del tuo orario, messaggi WebUntis con allegati, promemoria di classe in tempo reale e to-do personali. Se la tua scuola ha un menù su POKYH, vedi anche la mensa con le valutazioni. I valori calcolati sono un aiuto; fanno fede i dati della scuola.',
    q5: 'Come accedo?',
    a5: 'Cerchi la tua scuola per nome, città o CAP e accedi con nome utente e password di WebUntis, esattamente come su WebUntis. Non serve una registrazione. Il browser ricorda la scuola scelta fino alla fine dell’anno scolastico.',
    q6: 'POKYH è sicuro?',
    a6: 'Tutte le connessioni sono cifrate. Le richieste a WebUntis le fa il server di POKYH con la tua sessione; il token di sessione è cifrato con AES-GCM in un cookie httpOnly a cui gli script del browser non hanno accesso.',
    q7: 'Che differenza c’è con WebUntis?',
    a7: 'POKYH usa il tuo account WebUntis e mostra gli stessi dati della scuola in un’interfaccia propria e chiara. In più ci sono promemoria, to-do e, dove disponibile, la mensa. POKYH è un progetto indipendente e non è collegato a Untis GmbH.',
    q8: 'POKYH salva la mia password?',
    a8: 'Non sui server di POKYH. La password va solo a WebUntis. Per rinnovare automaticamente una sessione scaduta resta cifrata in un cookie del tuo browser, valido solo insieme alla tua sessione ed eliminato al logout. Se elimini i cookie, sei disconnesso.',
    q9: 'Esiste un’app di POKYH?',
    a9: 'Sì. POKYH funziona nel browser su ogni dispositivo, si può aggiungere alla schermata Home come web app ed è disponibile come app per Android e iPhone su GitHub.',
    q10: 'Vedo supplenze e modifiche?',
    a10: 'Sì. Ore saltate, supplenze, ore aggiuntive e verifiche sono segnate nell’orario appena vengono inserite in WebUntis.',
    q11: 'Quali scuole sono supportate?',
    a11: 'Ogni scuola che usa WebUntis, in Italia, Austria, Germania, Svizzera o altrove in Europa. Al momento dell’accesso trovi la tua scuola tramite la ricerca scuole di WebUntis. POKYH è nata in una scuola professionale di Bressanone, in Alto Adige.',
    q12: 'Posso vedere il codice sorgente?',
    a12: 'Sì. Il codice della web app è su GitHub in github.com/bedchem/pokyh-frontend, il backend in github.com/bedchem/pokyh-backend.',
    q13: 'Da che età posso usare POKYH?',
    a13: 'POKYH è per persone dai 14 anni in su. Se sei più giovane, usa POKYH solo con il consenso dei tuoi genitori, per esempio insieme a loro tramite l’accesso per genitori. Le statistiche facoltative sono possibili solo dai 14 anni.',
  },
  en: {
    metaTitle: 'FAQ: Questions about POKYH, the app for WebUntis',
    metaDescription: 'Frequently asked questions about POKYH: which schools are included? How does sign-in with WebUntis work? Is POKYH safe and free? All answers at a glance.',
    ogDescription: 'All answers about POKYH: schools, sign-in, security and features.',
    title: 'Frequently asked questions',
    lead: 'Everything about sign-in, security and features. Your question is missing? Write to us on GitHub.',
    search: 'Search questions',
    noResults: 'No matching question found.',
    gGeneral: 'General',
    gAccount: 'Sign-in and security',
    gFeatures: 'Features',
    ctaTitle: 'Just try it.',
    ctaLead: 'Free, with your WebUntis account.',
    ctaLogin: 'Sign in',
    q1: 'What is POKYH?',
    a1: 'POKYH is a free, independent app for WebUntis. It shows your school’s timetable, substitutions, exams, grades, absences and messages in one clear place, in the browser, as a web app and on your phone.',
    q2: 'Who can use POKYH?',
    a2: 'Students and parents at every school that uses WebUntis. Without a school account you can create a POKYH account; WebUntis data is then missing.',
    q3: 'What does POKYH cost?',
    a3: 'Nothing. POKYH is free, ad-free and an open-source project.',
    q4: 'Which features are there?',
    a4: 'Timetable with substitutions and exams, grades with averages and a calculator, absences in hours and as a share of your lesson time in percent, WebUntis messages with attachments, real-time class reminders and personal to-dos. If your school has a menu on POKYH, you also see the cafeteria with ratings. Calculated values are a help; your school’s records are authoritative.',
    q5: 'How do I sign in?',
    a5: 'You look up your school by name, town or postcode and sign in with your WebUntis username and password, exactly as on WebUntis. No separate registration needed. Your browser remembers the school until the end of the school year.',
    q6: 'Is POKYH safe?',
    a6: 'All connections are encrypted. Requests to WebUntis are made by the POKYH server with your session; the session token is AES-GCM encrypted in an httpOnly cookie that browser scripts cannot read.',
    q7: 'How is it different from WebUntis?',
    a7: 'POKYH uses your WebUntis account and shows the same school data in its own clear interface. On top come reminders, to-dos and, where available, the cafeteria. POKYH is an independent project and is not affiliated with Untis GmbH.',
    q8: 'Does POKYH store my password?',
    a8: 'Not on POKYH servers. Your password only goes to WebUntis. So an expired session can be renewed automatically, it is kept encrypted in a cookie in your browser that is only valid together with your session and deleted when you sign out. Delete the cookies and you are signed out.',
    q9: 'Is there a POKYH app?',
    a9: 'Yes. POKYH runs in the browser on any device, can be added to your home screen as a web app and is available as an app for Android and iPhone via GitHub.',
    q10: 'Do I see substitutions and changes?',
    a10: 'Yes. Cancellations, substitutions, extra lessons and exams are marked in the timetable as soon as they are entered in WebUntis.',
    q11: 'Which schools are supported?',
    a11: 'Every school that uses WebUntis, whether in Italy, Austria, Germany, Switzerland or elsewhere in Europe. When signing in, you find your school through the WebUntis school search. POKYH started at a vocational school in Brixen, South Tyrol.',
    q12: 'Can I see the source code?',
    a12: 'Yes. The web app’s code is on GitHub at github.com/bedchem/pokyh-frontend, the backend at github.com/bedchem/pokyh-backend.',
    q13: 'How old do I have to be to use POKYH?',
    a13: 'POKYH is for people aged 14 and over. If you are younger, please only use POKYH with your parents’ consent, for example together through their parent access. Optional statistics are only possible from 14.',
  },
};
