import type { Dictionary } from '../dictionary';

export type AboutKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogTitle'
  | 'ogDescription'
  | 'eyebrow'
  | 'heroTitle'
  | 'heroSub'
  | 'startTitle'
  | 'startSub'
  | 'p1Title'
  | 'p1Body'
  | 'p2Title'
  | 'p2Body'
  | 'p3Title'
  | 'p3Body'
  | 'startOutro'
  | 'builtTitle'
  | 'builtSub'
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
  | 'backendTitle'
  | 'backendSub'
  | 'backendBody'
  | 'sHttp'
  | 'sTypes'
  | 'sDb'
  | 'sRealtime'
  | 'sAuth'
  | 'sHosting'
  | 'github'
  | 'teamTitle'
  | 'teamBefore'
  | 'teamAfter'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin'
  | 'ctaCompare';

export const aboutDict: Dictionary<AboutKey> = {
  de: {
    metaTitle: 'Über POKYH – Die Story dahinter | Schulapp Tschuggmall Brixen',
    metaDescription: 'Wie POKYH entstanden ist — von zwei Schülern des BFS Tschuggmall (LBS Brixen), die sich ihre eigene Schulapp gebaut haben. Open Source, kostenlos, für Schüler.',
    ogTitle: 'Über POKYH – Die Story dahinter',
    ogDescription: 'Von zwei Schülern des BFS Tschuggmall / LBS Brixen selbst gebaut — kostenlos, open source, für Schüler.',
    eyebrow: 'Von Schülern, für Schüler',
    heroTitle: 'Die Story dahinter.',
    heroSub: 'POKYH ist kein kommerzielles Produkt. Es ist das Ergebnis davon, dass wir selbst eine bessere Schulapp wollten — und sie einfach gebaut haben.',
    startTitle: 'Wie es angefangen hat',
    startSub: 'WebUntis ist die offizielle Plattform unserer Schule — und sie funktioniert gut für das, wofür sie gedacht ist. Aber im Alltag haben uns drei Dinge immer wieder gefehlt:',
    p1Title: 'Keine Mensa',
    p1Body: 'Das Tagesmenü war nirgends in der App. Wir haben täglich eine separate Webseite aufgerufen — das wollten wir ändern.',
    p2Title: 'Keine Klassen-Erinnerungen',
    p2Body: 'Schularbeiten, Abgaben, wichtige Termine — irgendjemand in der Klasse hat es immer vergessen. Eine klassenweite Erinnerung in Echtzeit gab es nicht.',
    p3Title: 'Kein sauberes UI',
    p3Body: 'Für den schnellen Blick auf den Stundenplan oder die Noten war die Oberfläche zu unübersichtlich. Wir wollten etwas, das direkt lesbar ist.',
    startOutro: 'Also haben wir angefangen zu bauen — zuerst als kleines Schulprojekt, dann immer größer. Heute ist POKYH eine vollständige Web-App mit eigenem Backend, die täglich von Schülern der LBS Brixen genutzt wird.',
    builtTitle: 'Was wir gebaut haben — und warum',
    builtSub: 'Jede Funktion hat einen konkreten Grund.',
    fTimetable: 'Stundenplan',
    fTimetableWhy: 'WebUntis zeigt den Stundenplan — aber für uns war er schwer lesbar. Wir wollten ihn auf einen Blick verstehen: welche Stunde, wann, welcher Lehrer, welcher Raum. Und Vertretungen sollten sofort auffallen.',
    fGrades: 'Noten & Schnitt',
    fGradesWhy: 'Den eigenen Notenschnitt selbst ausrechnen zu müssen war nervig. Wir wollten ihn einfach sehen — automatisch, nach Fach, auf zwei Dezimalstellen.',
    fMensa: 'Mensa',
    fMensaWhy: 'Die Mensa war in keiner App. Jeden Tag das gleiche Spiel: Webseite aufrufen, suchen, warten. Wir wollten das Menü direkt dabei haben — mit Bewertungen von Mitschülern.',
    fMessages: 'Nachrichten',
    fMessagesWhy: 'Nachrichten in WebUntis zu lesen war umständlich. Anhänge waren schwer zu öffnen, Links nicht klickbar. Wir wollten eine saubere Inbox.',
    fAbsences: 'Abwesenheiten',
    fAbsencesWhy: 'Wie viele Fehlstunden habe ich eigentlich? Eine Gesamtübersicht gab es nicht wirklich. Wir wollten die eigene Fehlquote auf einen Blick sehen.',
    fReminders: 'Klassen-Erinnerungen',
    fRemindersWhy: 'Morgen Schularbeit — und die Hälfte der Klasse hat es vergessen. Wir wollten Erinnerungen, die für alle gleichzeitig erscheinen, in Echtzeit.',
    fTodos: 'Todos',
    fTodosWhy: 'Aufgaben auf Papier oder in einer separaten App. Wir wollten eine persönliche Todo-Liste direkt da, wo der Rest auch ist — und die auf allen Geräten synchron bleibt.',
    backendTitle: 'Unser eigenes Backend',
    backendSub: 'Die WebUntis-Daten kommen direkt über die offizielle API. Aber für alles, was darüber hinausgeht — Klassen-Erinnerungen, Todos, Echtzeit-Updates — haben wir ein eigenes Backend von Grund auf gebaut.',
    backendBody: 'Das war ehrlich gesagt der technisch spannendste Teil. Erinnerungen sollen in Echtzeit bei allen Klassenmitgliedern ankommen — dafür haben wir Server-Sent Events (SSE) implementiert. Das Backend läuft als Express-Server mit TypeScript, Prisma als ORM und MySQL als Datenbank. Dazu kommt ein eigenes Admin-Panel und eine JWT-basierte Authentifizierung.',
    sHttp: 'HTTP Server',
    sTypes: 'Typsicherheit',
    sDb: 'Datenbank',
    sRealtime: 'Echtzeit-Updates',
    sAuth: 'Authentifizierung',
    sHosting: 'Tunnel & Hosting',
    github: 'Auf GitHub ansehen',
    teamTitle: 'Das Team',
    teamBefore: 'POKYH wird von zwei Schülern der LBS Brixen in der Freizeit entwickelt — als Open-Source-Projekt unter der',
    teamAfter: 'Organisation auf GitHub.',
    ctaTitle: 'Selbst ausprobieren.',
    ctaLead: 'Kostenlos. Mit deinem WebUntis-Account oder POKYH-Konto.',
    ctaLogin: 'Jetzt anmelden',
    ctaCompare: 'POKYH vs. WebUntis',
  },
  it: {
    metaTitle: 'Chi siamo – La storia di POKYH | App scolastica Tschuggmall Bressanone',
    metaDescription: 'Come è nato POKYH — da due studenti del BFS Tschuggmall (LBS Bressanone) che si sono costruiti la propria app scolastica. Open source, gratuita, per studenti.',
    ogTitle: 'Chi siamo – La storia di POKYH',
    ogDescription: 'Costruita da due studenti del BFS Tschuggmall / LBS Bressanone — gratuita, open source, per studenti.',
    eyebrow: 'Da studenti, per studenti',
    heroTitle: 'La storia dietro.',
    heroSub: 'POKYH non è un prodotto commerciale. È nato perché volevamo un’app scolastica migliore — e l’abbiamo semplicemente costruita.',
    startTitle: 'Come è iniziato',
    startSub: 'WebUntis è la piattaforma ufficiale della nostra scuola — e funziona bene per ciò per cui è pensata. Ma nella vita di tutti i giorni ci mancavano sempre tre cose:',
    p1Title: 'Niente mensa',
    p1Body: 'Il menù del giorno non era da nessuna parte nell’app. Ogni giorno aprivamo un sito separato — volevamo cambiarlo.',
    p2Title: 'Niente promemoria di classe',
    p2Body: 'Compiti in classe, consegne, scadenze importanti — qualcuno in classe se ne dimenticava sempre. Un promemoria per tutta la classe in tempo reale non esisteva.',
    p3Title: 'Nessuna interfaccia pulita',
    p3Body: 'Per dare un’occhiata veloce all’orario o ai voti l’interfaccia era troppo confusa. Volevamo qualcosa di leggibile subito.',
    startOutro: 'Così abbiamo iniziato a costruire — prima come piccolo progetto scolastico, poi sempre più grande. Oggi POKYH è una web app completa con un proprio backend, usata ogni giorno dagli studenti della LBS Bressanone.',
    builtTitle: 'Cosa abbiamo costruito — e perché',
    builtSub: 'Ogni funzione ha un motivo concreto.',
    fTimetable: 'Orario',
    fTimetableWhy: 'WebUntis mostra l’orario — ma per noi era difficile da leggere. Volevamo capirlo a colpo d’occhio: quale ora, quando, quale docente, quale aula. E le supplenze dovevano saltare subito all’occhio.',
    fGrades: 'Voti e media',
    fGradesWhy: 'Calcolarsi la media da soli era una seccatura. Volevamo semplicemente vederla — automaticamente, per materia, con due decimali.',
    fMensa: 'Mensa',
    fMensaWhy: 'La mensa non era in nessuna app. Ogni giorno la stessa storia: aprire il sito, cercare, aspettare. Volevamo il menù sempre a portata di mano — con le valutazioni dei compagni.',
    fMessages: 'Messaggi',
    fMessagesWhy: 'Leggere i messaggi su WebUntis era scomodo. Gli allegati erano difficili da aprire, i link non erano cliccabili. Volevamo una inbox pulita.',
    fAbsences: 'Assenze',
    fAbsencesWhy: 'Quante ore di assenza ho davvero? Una panoramica completa non c’era. Volevamo vedere il nostro tasso di assenza a colpo d’occhio.',
    fReminders: 'Promemoria di classe',
    fRemindersWhy: 'Domani compito in classe — e metà classe se n’è dimenticata. Volevamo promemoria che compaiono per tutti contemporaneamente, in tempo reale.',
    fTodos: 'To-do',
    fTodosWhy: 'Attività su carta o in un’app separata. Volevamo una lista di to-do personale proprio dove si trova tutto il resto — sincronizzata su tutti i dispositivi.',
    backendTitle: 'Il nostro backend',
    backendSub: 'I dati di WebUntis arrivano direttamente dall’API ufficiale. Ma per tutto ciò che va oltre — promemoria di classe, to-do, aggiornamenti in tempo reale — abbiamo costruito da zero un nostro backend.',
    backendBody: 'Sinceramente è stata la parte tecnicamente più interessante. I promemoria devono arrivare in tempo reale a tutti i membri della classe — per questo abbiamo implementato i Server-Sent Events (SSE). Il backend gira come server Express con TypeScript, Prisma come ORM e MySQL come database. In più c’è un pannello di amministrazione e un’autenticazione basata su JWT.',
    sHttp: 'Server HTTP',
    sTypes: 'Tipizzazione sicura',
    sDb: 'Database',
    sRealtime: 'Aggiornamenti in tempo reale',
    sAuth: 'Autenticazione',
    sHosting: 'Tunnel e hosting',
    github: 'Vedi su GitHub',
    teamTitle: 'Il team',
    teamBefore: 'POKYH è sviluppato nel tempo libero da due studenti della LBS Bressanone — come progetto open source nell’organizzazione',
    teamAfter: 'su GitHub.',
    ctaTitle: 'Provalo tu stesso.',
    ctaLead: 'Gratis. Con il tuo account WebUntis o un account POKYH.',
    ctaLogin: 'Accedi ora',
    ctaCompare: 'POKYH vs. WebUntis',
  },
  en: {
    metaTitle: 'About POKYH – The story behind it | School app Tschuggmall Brixen',
    metaDescription: 'How POKYH came to be — built by two students at BFS Tschuggmall (LBS Brixen) who made their own school app. Open source, free, for students.',
    ogTitle: 'About POKYH – The story behind it',
    ogDescription: 'Built by two students at BFS Tschuggmall / LBS Brixen — free, open source, for students.',
    eyebrow: 'By students, for students',
    heroTitle: 'The story behind it.',
    heroSub: 'POKYH isn’t a commercial product. It exists because we wanted a better school app ourselves — so we just built it.',
    startTitle: 'How it started',
    startSub: 'WebUntis is our school’s official platform — and it works well for what it’s meant to do. But in everyday life, three things kept missing:',
    p1Title: 'No cafeteria',
    p1Body: 'The daily menu wasn’t anywhere in the app. Every day we opened a separate website — we wanted to change that.',
    p2Title: 'No class reminders',
    p2Body: 'Tests, deadlines, important dates — someone in class always forgot. A class-wide real-time reminder didn’t exist.',
    p3Title: 'No clean UI',
    p3Body: 'For a quick look at the timetable or grades, the interface was too cluttered. We wanted something readable at a glance.',
    startOutro: 'So we started building — first as a small school project, then bigger and bigger. Today POKYH is a full web app with its own backend, used every day by students at LBS Brixen.',
    builtTitle: 'What we built — and why',
    builtSub: 'Every feature has a concrete reason.',
    fTimetable: 'Timetable',
    fTimetableWhy: 'WebUntis shows the timetable — but we found it hard to read. We wanted to understand it at a glance: which lesson, when, which teacher, which room. And substitutes should stand out immediately.',
    fGrades: 'Grades & average',
    fGradesWhy: 'Working out your own grade average was annoying. We just wanted to see it — automatically, per subject, to two decimals.',
    fMensa: 'Cafeteria',
    fMensaWhy: 'The cafeteria wasn’t in any app. Same routine every day: open the website, search, wait. We wanted the menu right there — with ratings from classmates.',
    fMessages: 'Messages',
    fMessagesWhy: 'Reading messages in WebUntis was clunky. Attachments were hard to open, links weren’t clickable. We wanted a clean inbox.',
    fAbsences: 'Absences',
    fAbsencesWhy: 'How many hours have I actually missed? There wasn’t really an overview. We wanted to see our own absence rate at a glance.',
    fReminders: 'Class reminders',
    fRemindersWhy: 'Test tomorrow — and half the class forgot. We wanted reminders that show up for everyone at once, in real time.',
    fTodos: 'To-dos',
    fTodosWhy: 'Tasks on paper or in a separate app. We wanted a personal to-do list right where everything else is — synced across all devices.',
    backendTitle: 'Our own backend',
    backendSub: 'WebUntis data comes straight from the official API. But for everything beyond that — class reminders, to-dos, real-time updates — we built our own backend from scratch.',
    backendBody: 'Honestly, that was the most exciting part technically. Reminders have to reach every class member in real time — so we implemented Server-Sent Events (SSE). The backend runs as an Express server with TypeScript, Prisma as ORM and MySQL as database. On top of that there’s our own admin panel and JWT-based authentication.',
    sHttp: 'HTTP server',
    sTypes: 'Type safety',
    sDb: 'Database',
    sRealtime: 'Real-time updates',
    sAuth: 'Authentication',
    sHosting: 'Tunnel & hosting',
    github: 'View on GitHub',
    teamTitle: 'The team',
    teamBefore: 'POKYH is built in their free time by two students at LBS Brixen — as an open-source project under the',
    teamAfter: 'organisation on GitHub.',
    ctaTitle: 'Try it yourself.',
    ctaLead: 'Free. With your WebUntis account or a POKYH account.',
    ctaLogin: 'Log in now',
    ctaCompare: 'POKYH vs. WebUntis',
  },
  lld: {
    metaTitle: "Sun POKYH – La storia – App dla scola Tschuggmall Porsenù",
    metaDescription: "Coche POKYH ie nasciù — da doi sculeies dl BFS Tschuggmall (LBS Porsenù) che se à fat si app dla scola. Open source, debant, per sculeies.",
    ogTitle: "Sun POKYH – La storia",
    ogDescription: "Fat da doi sculeies dl BFS Tschuggmall / LBS Porsenù — debant, open source, per sculeies.",
    eyebrow: "Da sculeies, per sculeies",
    heroTitle: "La storia.",
    heroSub: "POKYH ne n’ie nia n prodot comerziel. L ie nasciù ajache nëus ulovon n’app dla scola miëura — y la on scialdi fata.",
    startTitle: "Coche l à scumencià",
    startSub: "WebUntis ie la plataforma ufiziela de nosta scola — y la funzionea bën per chël che la ie pensëda. Ma tla vita de uni di ne nes mancia for inò trëi cosses:",
    p1Title: "Deguna mensa",
    p1Body: "L menu dl di ne n’ova nia tl’app. Uni di giauriovon n’autra plata web — chësc ulovon mudé.",
    p2Title: "Deguna recurdanza dla tlas",
    p2Body: "Verifiches, cunsegnes, termins de mpurtanza — velch un dla tlas se l desmincia for. Na recurdanza per duta la tlas te tëmp real ne n’ova nia.",
    p3Title: "Deguna interfacia tlera",
    p3Body: "Per na udleda sveta sun l urar o la notes fova la interfacia massa cunfusa. Nëus ulovon velch che se lascia liejer sibe.",
    startOutro: "Nsci on scumencià a lauré — prim coche pitl proiet de scola, pona for plu grant. Ncuei ie POKYH na web app cumpleta cun n backend nosc, che vën adurveda uni di dai sculeies dla LBS Porsenù.",
    builtTitle: "Ci che on fat — y ciuldì",
    builtSub: "Uni funzion à na rejon concreta.",
    fTimetable: "Urar",
    fTimetableWhy: "WebUntis mostra l urar — ma per nëus fovel ri da liejer. Nëus ulovon l capì te n’udleda: cie ëura, canche, cie nseniant, cie aula. Y la suplenzes muessa se udëi sibe.",
    fGrades: "Notes y media",
    fGradesWhy: "Muessé se calculé da sëul la media dla notes fova nuiëus. Nëus la ulovon mé udëi — da sëula, aldò dla materia, cun doi posć dò la virgula.",
    fMensa: "Mensa",
    fMensaWhy: "La mensa ne n’ova te deguna app. Uni di la medema storia: giaurì la plata web, crì, speté. Nëus ulovon avëi l menu for pro — cun la valutazions di cumpanies.",
    fMessages: "Nutizies",
    fMessagesWhy: "Liejer la nutizies te WebUntis fova scomot. I alegac fova ri da giaurì, i link ne se lasciova nia tliché. Nëus ulovon na nbox tlera.",
    fAbsences: "Assënzes",
    fAbsencesWhy: "Tan de ëures de assënza ei pa? Na survista cumpleta ne n’ova nia. Nëus ulovon udëi la cuota de assënza te n’udleda.",
    fReminders: "Recurdanzes dla tlas",
    fRemindersWhy: "Doman verifica — y la metà dla tlas se l à desmincià. Nëus ulovon recurdanzes che cumpar a duc tl medem mumënt, te tëmp real.",
    fTodos: "To-do",
    fTodosWhy: "Lëures sun papier o te n’autra app. Nëus ulovon na lista de to-do personela iló ulache ie dut l rest — y che resta sincronisëda sun duc i dispusitifs.",
    backendTitle: "Nosc backend",
    backendSub: "I dac de WebUntis vën diretamënter tres l’API ufiziela. Ma per dut chël che va sëura ora — recurdanzes dla tlas, to-do, atualisazions te tëmp real — on fat n backend nosc dal prinzip.",
    backendBody: "Chësta fova sinceramënter la pert plu nteressanta dal pont de ududa tecnich. La recurdanzes muessa ruvé te tëmp real a duc i members dla tlas — per chël on implementà i Server-Sent Events (SSE). L backend jirà coche server Express cun TypeScript, Prisma coche ORM y MySQL coche database. Pona iel mo n panel de aministrazion nosc y n’autenticazion basëda sun JWT.",
    sHttp: "Server HTTP",
    sTypes: "Segurëza di tips",
    sDb: "Database",
    sRealtime: "Atualisazions te tëmp real",
    sAuth: "Autenticazion",
    sHosting: "Tunnel y hosting",
    github: "Cialé sun GitHub",
    teamTitle: "L team",
    teamBefore: "POKYH vën fat tl tëmp liede da doi sculeies dla LBS Porsenù — coche proiet open source dla organisazion",
    teamAfter: "sun GitHub.",
    ctaTitle: "Prova te nstës.",
    ctaLead: "Debant. Cun ti account WebUntis o n account POKYH.",
    ctaLogin: "Jì ite sën",
    ctaCompare: "POKYH vs. WebUntis",
  },
};
