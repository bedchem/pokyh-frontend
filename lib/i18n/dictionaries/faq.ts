import type { Dictionary } from '../dictionary';

export const FAQ_COUNT = 12;

/** Which group each question (1-based) belongs to. */
export const FAQ_GROUPS: { key: 'gGeneral' | 'gAccount' | 'gFeatures'; questions: number[] }[] = [
  { key: 'gGeneral', questions: [1, 2, 3, 7, 11, 12] },
  { key: 'gAccount', questions: [5, 6, 8] },
  { key: 'gFeatures', questions: [4, 9, 10] },
];

type Q = `q${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;
type A = `a${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;

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
    metaTitle: 'FAQ – Häufige Fragen zu POKYH',
    metaDescription: 'Häufige Fragen zu POKYH: Wie funktioniert die Anmeldung? Ist POKYH sicher? Was kostet es? Alle Antworten auf einen Blick.',
    ogDescription: 'Alle Antworten zu POKYH: Anmeldung, Sicherheit, Funktionen und mehr.',
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
    a1: 'POKYH ist eine kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen (Berufsbildungszentrum Christian Josef Tschuggmall). Sie zeigt Stundenplan, Noten, Abwesenheiten, Nachrichten und die Mensa übersichtlich an einem Ort.',
    q2: 'Wer kann POKYH nutzen?',
    a2: 'Alle mit einem aktiven WebUntis-Konto der LBS Brixen, auch Eltern. Ohne Schulkonto kannst du ein eigenes POKYH-Konto anlegen; dann fehlen die Daten aus WebUntis.',
    q3: 'Was kostet POKYH?',
    a3: 'Nichts. POKYH ist kostenlos, werbefrei und ein Open-Source-Projekt von zwei Schülern.',
    q4: 'Welche Funktionen gibt es?',
    a4: 'Stundenplan mit Vertretungen und Prüfungen, Noten mit Schnitt und Notenrechner, Abwesenheiten pro Monat, WebUntis-Nachrichten mit Anhängen, der Mensa-Speiseplan mit Bewertungen, Klassen-Erinnerungen in Echtzeit und persönliche To-dos.',
    q5: 'Wie melde ich mich an?',
    a5: 'Mit deinem WebUntis-Benutzernamen und Passwort, genau wie in der WebUntis-App. Eine eigene Registrierung brauchst du nicht.',
    q6: 'Ist POKYH sicher?',
    a6: 'Alle Verbindungen sind verschlüsselt. Anfragen an WebUntis stellt der POKYH-Server mit deiner Sitzung; das Sitzungs-Token liegt AES-GCM-verschlüsselt in einem httpOnly-Cookie, auf das Skripte im Browser keinen Zugriff haben.',
    q7: 'Was ist der Unterschied zu WebUntis?',
    a7: 'POKYH nutzt dein WebUntis-Konto und zeigt dieselben Schuldaten in einer schnelleren, übersichtlicheren Oberfläche. Dazu kommen Mensa, Erinnerungen und To-dos. POKYH ist ein inoffizielles Schülerprojekt und steht in keiner Verbindung zur Untis GmbH.',
    q8: 'Speichert POKYH mein Passwort?',
    a8: 'Nicht auf POKYH-Servern. Dein Passwort geht nur an WebUntis. Damit eine abgelaufene Sitzung automatisch erneuert werden kann, bleibt es im geöffneten Browser-Tab (sessionStorage) und wird beim Schließen des Tabs gelöscht.',
    q9: 'Gibt es POKYH als App?',
    a9: 'Ja. POKYH läuft im Browser auf jedem Gerät, lässt sich als Web-App auf den Homescreen legen und gibt es als App für Android und iPhone über GitHub.',
    q10: 'Sehe ich Vertretungen und Änderungen?',
    a10: 'Ja. Entfall, Vertretungen, zusätzliche Stunden und Prüfungen sind im Stundenplan markiert, sobald sie in WebUntis eingetragen sind.',
    q11: 'Wo ist die LBS Brixen?',
    a11: 'Die Landesberufsschule Brixen, auch Berufsbildungszentrum Christian Josef Tschuggmall, liegt in Brixen in Südtirol. POKYH ist speziell für ihre Schülerinnen und Schüler gemacht.',
    q12: 'Kann ich den Quellcode sehen?',
    a12: 'Ja. Der Code der Web-App liegt auf GitHub unter github.com/bedchem/pokyh-frontend, das Backend unter github.com/bedchem/pokyh-backend.',
  },
  it: {
    metaTitle: 'FAQ – Domande frequenti su POKYH',
    metaDescription: 'Domande frequenti su POKYH: come funziona l’accesso? POKYH è sicuro? Quanto costa? Tutte le risposte in un colpo d’occhio.',
    ogDescription: 'Tutte le risposte su POKYH: accesso, sicurezza, funzioni e altro.',
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
    a1: 'POKYH è una web app gratuita per le studentesse e gli studenti della LBS Bressanone (Centro di formazione professionale Christian Josef Tschuggmall). Mostra orario, voti, assenze, messaggi e la mensa in un unico posto.',
    q2: 'Chi può usare POKYH?',
    a2: 'Chiunque abbia un account WebUntis attivo della LBS Bressanone, anche i genitori. Senza account scolastico puoi creare un account POKYH; in quel caso mancano i dati di WebUntis.',
    q3: 'Quanto costa POKYH?',
    a3: 'Niente. POKYH è gratuita, senza pubblicità e un progetto open source di due studenti.',
    q4: 'Quali funzioni ci sono?',
    a4: 'Orario con supplenze e verifiche, voti con media e calcolatore, assenze per mese, messaggi WebUntis con allegati, il menù della mensa con valutazioni, promemoria di classe in tempo reale e to-do personali.',
    q5: 'Come accedo?',
    a5: 'Con nome utente e password di WebUntis, esattamente come nell’app WebUntis. Non serve una registrazione.',
    q6: 'POKYH è sicuro?',
    a6: 'Tutte le connessioni sono cifrate. Le richieste a WebUntis le fa il server di POKYH con la tua sessione; il token di sessione è cifrato con AES-GCM in un cookie httpOnly a cui gli script del browser non hanno accesso.',
    q7: 'Che differenza c’è con WebUntis?',
    a7: 'POKYH usa il tuo account WebUntis e mostra gli stessi dati in un’interfaccia più veloce e chiara. In più ci sono mensa, promemoria e to-do. POKYH è un progetto non ufficiale di studenti e non ha legami con Untis GmbH.',
    q8: 'POKYH salva la mia password?',
    a8: 'Non sui server di POKYH. La password va solo a WebUntis. Per rinnovare automaticamente una sessione scaduta resta nella scheda aperta del browser (sessionStorage) e viene eliminata alla chiusura della scheda.',
    q9: 'Esiste un’app di POKYH?',
    a9: 'Sì. POKYH funziona nel browser su ogni dispositivo, si può aggiungere alla schermata Home come web app ed è disponibile come app per Android e iPhone su GitHub.',
    q10: 'Vedo supplenze e modifiche?',
    a10: 'Sì. Ore saltate, supplenze, ore aggiuntive e verifiche sono segnate nell’orario appena vengono inserite in WebUntis.',
    q11: 'Dove si trova la LBS Bressanone?',
    a11: 'La scuola professionale provinciale di Bressanone, detta anche Centro Christian Josef Tschuggmall, si trova a Bressanone in Alto Adige. POKYH è pensato proprio per i suoi studenti.',
    q12: 'Posso vedere il codice sorgente?',
    a12: 'Sì. Il codice della web app è su GitHub in github.com/bedchem/pokyh-frontend, il backend in github.com/bedchem/pokyh-backend.',
  },
  en: {
    metaTitle: 'FAQ – Frequently asked questions about POKYH',
    metaDescription: 'Frequently asked questions about POKYH: How does sign-in work? Is POKYH safe? What does it cost? All answers at a glance.',
    ogDescription: 'All answers about POKYH: sign-in, security, features and more.',
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
    a1: 'POKYH is a free web app for students at LBS Brixen (vocational training centre Christian Josef Tschuggmall). It shows timetable, grades, absences, messages and the cafeteria in one tidy place.',
    q2: 'Who can use POKYH?',
    a2: 'Anyone with an active LBS Brixen WebUntis account, parents included. Without a school account you can create a POKYH account; WebUntis data is then missing.',
    q3: 'What does POKYH cost?',
    a3: 'Nothing. POKYH is free, ad-free and an open-source project by two students.',
    q4: 'Which features are there?',
    a4: 'Timetable with substitutions and exams, grades with averages and a calculator, absences per month, WebUntis messages with attachments, the cafeteria menu with ratings, real-time class reminders and personal to-dos.',
    q5: 'How do I sign in?',
    a5: 'With your WebUntis username and password, exactly as in the WebUntis app. No separate registration needed.',
    q6: 'Is POKYH safe?',
    a6: 'All connections are encrypted. Requests to WebUntis are made by the POKYH server with your session; the session token is AES-GCM encrypted in an httpOnly cookie that browser scripts cannot read.',
    q7: 'How is it different from WebUntis?',
    a7: 'POKYH uses your WebUntis account and shows the same school data in a faster, clearer interface. On top come cafeteria, reminders and to-dos. POKYH is an unofficial student project with no connection to Untis GmbH.',
    q8: 'Does POKYH store my password?',
    a8: 'Not on POKYH servers. Your password only goes to WebUntis. So an expired session can be renewed automatically, it stays in the open browser tab (sessionStorage) and is deleted when the tab closes.',
    q9: 'Is there a POKYH app?',
    a9: 'Yes. POKYH runs in the browser on any device, can be added to your home screen as a web app and is available as an app for Android and iPhone via GitHub.',
    q10: 'Do I see substitutions and changes?',
    a10: 'Yes. Cancellations, substitutions, extra lessons and exams are marked in the timetable as soon as they are entered in WebUntis.',
    q11: 'Where is LBS Brixen?',
    a11: 'The provincial vocational school in Brixen, also called the Christian Josef Tschuggmall centre, is in Brixen, South Tyrol. POKYH is made for its students.',
    q12: 'Can I see the source code?',
    a12: 'Yes. The web app’s code is on GitHub at github.com/bedchem/pokyh-frontend, the backend at github.com/bedchem/pokyh-backend.',
  },
};
