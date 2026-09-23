import type { Dictionary } from '../dictionary';

export type LandingKey =
  // Hero
  | 'heroTitle1'
  | 'heroTitle2'
  | 'heroSub'
  | 'heroSubStrong'
  | 'loginNow'
  | 'allFeatures'
  | 'mensaQuestion'
  | 'mensaNoLogin'
  // Timetable tile
  | 'ttEyebrow'
  | 'ttTitle1'
  | 'ttTitle2'
  | 'ttSub'
  // Grades tile
  | 'grEyebrow'
  | 'grTitle1'
  | 'grTitle2'
  | 'grSub'
  | 'grAverage'
  | 'grAllSubjects'
  | 'grRatio'
  | 'grPosNeg'
  | 'grAbove'
  | 'grBelow'
  | 'subjMath'
  | 'subjGerman'
  | 'subjEnglish'
  | 'subjPractice'
  | 'subjReligion'
  // Mensa tile
  | 'mnEyebrow'
  | 'mnTitle'
  | 'mnSub'
  | 'mnLink'
  | 'mnNoRating'
  | 'dish1'
  | 'dish1Desc'
  | 'dish2'
  | 'dish2Desc'
  | 'dish3'
  | 'dish3Desc'
  | 'tagMeat'
  | 'tagFish'
  | 'tagVegan'
  // Messages tile
  | 'msEyebrow'
  | 'msTitle1'
  | 'msTitle2'
  | 'msSub'
  | 'msg1Subject'
  | 'msg1Preview'
  | 'msg2Subject'
  | 'msg2Preview'
  | 'msg3Subject'
  | 'msg3Preview'
  | 'msg4Subject'
  | 'msg4Preview'
  | 'yesterday'
  | 'dayTue'
  | 'dayMon'
  // Absences tile
  | 'abEyebrow'
  | 'abTitle1'
  | 'abTitle2'
  | 'abSub'
  | 'abTotal'
  | 'abExcused'
  | 'abUnexcused'
  | 'abRate'
  | 'abMonth'
  | 'abHours'
  // Reminders tile
  | 'rmEyebrow'
  | 'rmTitle1'
  | 'rmTitle2'
  | 'rmSub'
  | 'rmDue'
  | 'rmUpcoming'
  | 'rm1Title'
  | 'rm1Body'
  | 'rm1Time'
  | 'rm1Date'
  | 'rm2Title'
  | 'rm2Body'
  | 'rm2Time'
  | 'rm2Date'
  | 'by'
  // Compare
  | 'cmpAria'
  | 'cmpTitle'
  | 'cmpLead'
  | 'cTimetable'
  | 'cTimetableSub'
  | 'cGrades'
  | 'cGradesSub'
  | 'cMensa'
  | 'cMensaSub'
  | 'cSubst'
  | 'cSubstSub'
  | 'cMessages'
  | 'cMessagesSub'
  | 'cAbsences'
  | 'cAbsencesSub'
  | 'cReminders'
  | 'cRemindersSub'
  | 'cTodos'
  | 'cTodosSub'
  // Steps
  | 'stEyebrow'
  | 'stTitle'
  | 'stLead'
  | 'st1Title'
  | 'st1Body'
  | 'st2Title'
  | 'st2Body'
  | 'st3Title'
  | 'st3Body'
  // Makers
  | 'mkEyebrow'
  | 'mkTitle'
  | 'mkLeadBefore'
  | 'mkLeadAfter'
  // CTA
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaButton'
  | 'ctaHow';

export const landingDict: Dictionary<LandingKey> = {
  de: {
    heroTitle1: 'Deine Schule.',
    heroTitle2: 'Übersichtlich.',
    heroSub: 'Stundenplan, Noten, Mensa und mehr — für alle Schüler der LBS Brixen.',
    heroSubStrong: 'Anmeldung mit deinem WebUntis‑Account.',
    loginNow: 'Jetzt anmelden',
    allFeatures: 'Alle Funktionen',
    mensaQuestion: 'Was gibt’s heute in der Mensa?',
    mensaNoLogin: 'Speiseplan ohne Anmeldung',
    ttEyebrow: 'Stundenplan',
    ttTitle1: 'Die Woche.',
    ttTitle2: 'Auf einen Blick.',
    ttSub: 'Tages‑ und Wochenansicht. Vertretungen und Entfall sind sofort erkennbar.',
    grEyebrow: 'Noten & Schnitt',
    grTitle1: 'Dein Durchschnitt.',
    grTitle2: 'Immer aktuell.',
    grSub: 'Alle Noten nach Fach. Gesamtschnitt automatisch berechnet — auf zwei Dezimalstellen.',
    grAverage: 'Durchschnitt',
    grAllSubjects: 'Alle Fächer',
    grRatio: 'Verhältnis',
    grPosNeg: 'Positiv · Negativ',
    grAbove: '4 über 6,0',
    grBelow: '1 unter 6,0',
    subjMath: 'Mathematik',
    subjGerman: 'Deutsch',
    subjEnglish: 'Englisch',
    subjPractice: 'Fachpraxis',
    subjReligion: 'Religion',
    mnEyebrow: 'Mensa',
    mnTitle: 'Was gibt’s heute?',
    mnSub: 'Tagesmenü mit Bewertungen und Allergenen — direkt im Klassenzimmer.',
    mnLink: 'Speiseplan ansehen',
    mnNoRating: 'Keine Bewertung',
    dish1: 'Kalbsgulasch',
    dish1Desc: 'Mit Eierspätzle',
    dish2: 'Schollenfilet',
    dish2Desc: 'Mit Kräuterkartoffeln',
    dish3: 'Vollkornnudeln',
    dish3Desc: 'Linsen-Gemüsesauce',
    tagMeat: 'Fleisch',
    tagFish: 'Fisch',
    tagVegan: 'Vegan',
    msEyebrow: 'Nachrichten',
    msTitle1: 'Direkt aus',
    msTitle2: 'WebUntis.',
    msSub: 'Mit Anhang‑Vorschau und klickbaren Links.',
    msg1Subject: 'Mathe-Schularbeit verschoben',
    msg1Preview: 'Die Schularbeit von Mittwoch wird auf Freitag verschoben.',
    msg2Subject: 'Lektüre für nächste Woche',
    msg2Preview: 'Bitte lest Kapitel 8–10 bis Montag.',
    msg3Subject: 'Werkzeug mitbringen',
    msg3Preview: 'Denkt daran, morgen das Werkzeug mitzubringen.',
    msg4Subject: 'Ausflug nächste Woche',
    msg4Preview: 'Bitte um 8:00 Uhr am Haupteingang sein.',
    yesterday: 'Gestern',
    dayTue: 'Di',
    dayMon: 'Mo',
    abEyebrow: 'Abwesenheiten',
    abTitle1: 'Fehlstunden.',
    abTitle2: 'Pro Monat.',
    abSub: 'Entschuldigt, unentschuldigt und Quote im Schuljahr.',
    abTotal: 'Fehlstunden gesamt',
    abExcused: 'Entschuldigt',
    abUnexcused: 'Unentschuldigt',
    abRate: 'Fehlquote',
    abMonth: 'Apr 2025',
    abHours: '4 Std.',
    rmEyebrow: 'Erinnerungen & Todos',
    rmTitle1: 'Nichts mehr',
    rmTitle2: 'vergessen.',
    rmSub: 'Klassenweite Erinnerungen für Prüfungen — und persönliche Todos für dich.',
    rmDue: 'FÄLLIG',
    rmUpcoming: 'KOMMEND',
    rm1Title: 'Englisch Referat',
    rm1Body: 'Präsentation fertig machen',
    rm1Time: 'Fällig',
    rm1Date: 'Mi, 30. Apr · 08:00',
    rm2Title: 'Mathe Schularbeit',
    rm2Body: 'Kapitel 5–7 wiederholen',
    rm2Time: 'in 2 Tagen',
    rm2Date: 'Fr, 2. Mai · 08:00',
    by: 'von {name}',
    cmpAria: 'Funktionsübersicht',
    cmpTitle: 'Alles. An einem Ort.',
    cmpLead: 'Alle Schulinformationen, die du täglich brauchst – schneller und übersichtlicher als je zuvor.',
    cTimetable: 'Stundenplan',
    cTimetableSub: 'Live aus WebUntis.',
    cGrades: 'Noten',
    cGradesSub: 'Schnitt automatisch.',
    cMensa: 'Mensa',
    cMensaSub: 'Menü & Bewertungen.',
    cSubst: 'Vertretungen',
    cSubstSub: 'Sofort sichtbar.',
    cMessages: 'Nachrichten',
    cMessagesSub: 'Mit Anhängen.',
    cAbsences: 'Abwesenheiten',
    cAbsencesSub: 'Quote im Blick.',
    cReminders: 'Erinnerungen',
    cRemindersSub: 'Klassenweit, in Echtzeit.',
    cTodos: 'Todos',
    cTodosSub: 'Auf allen Geräten.',
    stEyebrow: 'Anmeldung',
    stTitle: 'In 30 Sekunden eingeloggt.',
    stLead: 'POKYH nutzt deinen **WebUntis‑Account** — denselben, mit dem du dich auch in der WebUntis‑App anmeldest. Kein neues Passwort, keine Registrierung.',
    st1Title: 'BFS Tschuggmall',
    st1Body: '**Momentan** wird nur das Berufsbildungszentrum **„Christian Josef Tschuggmall“** unterstützt.',
    st2Title: 'WebUntis‑Login',
    st2Body: 'Gib deinen **WebUntis‑Benutzernamen** und dein Passwort ein — wie in der WebUntis‑App. Dein Passwort wird **niemals gespeichert**.',
    st3Title: 'Loslegen',
    st3Body: 'Stundenplan, Noten und Mensa werden **automatisch geladen**.',
    mkEyebrow: 'Made by Schülern',
    mkTitle: 'Von zwei aus der Klasse.',
    mkLeadBefore: 'POKYH wird in der Freizeit von zwei Schülern der LBS Brixen entwickelt — als Open‑Source‑Projekt unter der',
    mkLeadAfter: 'Organisation auf GitHub.',
    ctaTitle: 'Bereit?',
    ctaLead: 'Kostenlos. Ohne Registrierung. Mit deinem WebUntis‑Account.',
    ctaButton: 'Mit WebUntis anmelden',
    ctaHow: 'So funktioniert’s',
  },
  it: {
    heroTitle1: 'La tua scuola.',
    heroTitle2: 'Tutto chiaro.',
    heroSub: 'Orario, voti, mensa e altro — per tutti gli studenti della LBS Bressanone.',
    heroSubStrong: 'Accesso con il tuo account WebUntis.',
    loginNow: 'Accedi ora',
    allFeatures: 'Tutte le funzioni',
    mensaQuestion: 'Cosa c’è oggi in mensa?',
    mensaNoLogin: 'Menù senza accesso',
    ttEyebrow: 'Orario',
    ttTitle1: 'La settimana.',
    ttTitle2: 'A colpo d’occhio.',
    ttSub: 'Vista giornaliera e settimanale. Supplenze e ore annullate si vedono subito.',
    grEyebrow: 'Voti e media',
    grTitle1: 'La tua media.',
    grTitle2: 'Sempre aggiornata.',
    grSub: 'Tutti i voti per materia. Media generale calcolata automaticamente — con due decimali.',
    grAverage: 'Media',
    grAllSubjects: 'Tutte le materie',
    grRatio: 'Rapporto',
    grPosNeg: 'Positivi · Negativi',
    grAbove: '4 sopra 6,0',
    grBelow: '1 sotto 6,0',
    subjMath: 'Matematica',
    subjGerman: 'Tedesco',
    subjEnglish: 'Inglese',
    subjPractice: 'Pratica professionale',
    subjReligion: 'Religione',
    mnEyebrow: 'Mensa',
    mnTitle: 'Cosa c’è oggi?',
    mnSub: 'Menù del giorno con valutazioni e allergeni — direttamente in classe.',
    mnLink: 'Vedi il menù',
    mnNoRating: 'Nessuna valutazione',
    dish1: 'Gulasch di vitello',
    dish1Desc: 'Con spätzle all’uovo',
    dish2: 'Filetto di platessa',
    dish2Desc: 'Con patate alle erbe',
    dish3: 'Pasta integrale',
    dish3Desc: 'Sugo di lenticchie e verdure',
    tagMeat: 'Carne',
    tagFish: 'Pesce',
    tagVegan: 'Vegano',
    msEyebrow: 'Messaggi',
    msTitle1: 'Direttamente da',
    msTitle2: 'WebUntis.',
    msSub: 'Con anteprima degli allegati e link cliccabili.',
    msg1Subject: 'Compito di matematica spostato',
    msg1Preview: 'Il compito di mercoledì viene spostato a venerdì.',
    msg2Subject: 'Lettura per la prossima settimana',
    msg2Preview: 'Leggete i capitoli 8–10 entro lunedì.',
    msg3Subject: 'Portare gli attrezzi',
    msg3Preview: 'Ricordatevi di portare gli attrezzi domani.',
    msg4Subject: 'Gita la prossima settimana',
    msg4Preview: 'Trovatevi alle 8:00 all’ingresso principale.',
    yesterday: 'Ieri',
    dayTue: 'Mar',
    dayMon: 'Lun',
    abEyebrow: 'Assenze',
    abTitle1: 'Ore di assenza.',
    abTitle2: 'Mese per mese.',
    abSub: 'Giustificate, non giustificate e tasso nell’anno scolastico.',
    abTotal: 'Ore di assenza totali',
    abExcused: 'Giustificate',
    abUnexcused: 'Non giustificate',
    abRate: 'Tasso di assenza',
    abMonth: 'Apr 2025',
    abHours: '4 ore',
    rmEyebrow: 'Promemoria e to-do',
    rmTitle1: 'Non dimenticare',
    rmTitle2: 'più nulla.',
    rmSub: 'Promemoria per tutta la classe per le verifiche — e to-do personali per te.',
    rmDue: 'SCADUTI',
    rmUpcoming: 'IN ARRIVO',
    rm1Title: 'Presentazione di inglese',
    rm1Body: 'Finire la presentazione',
    rm1Time: 'Scaduto',
    rm1Date: 'Mer 30 apr · 08:00',
    rm2Title: 'Compito di matematica',
    rm2Body: 'Ripassare i capitoli 5–7',
    rm2Time: 'tra 2 giorni',
    rm2Date: 'Ven 2 mag · 08:00',
    by: 'di {name}',
    cmpAria: 'Panoramica delle funzioni',
    cmpTitle: 'Tutto. In un unico posto.',
    cmpLead: 'Tutte le informazioni scolastiche che ti servono ogni giorno – più veloci e chiare che mai.',
    cTimetable: 'Orario',
    cTimetableSub: 'In diretta da WebUntis.',
    cGrades: 'Voti',
    cGradesSub: 'Media automatica.',
    cMensa: 'Mensa',
    cMensaSub: 'Menù e valutazioni.',
    cSubst: 'Supplenze',
    cSubstSub: 'Visibili subito.',
    cMessages: 'Messaggi',
    cMessagesSub: 'Con allegati.',
    cAbsences: 'Assenze',
    cAbsencesSub: 'Tasso sotto controllo.',
    cReminders: 'Promemoria',
    cRemindersSub: 'Per tutta la classe, in tempo reale.',
    cTodos: 'To-do',
    cTodosSub: 'Su tutti i dispositivi.',
    stEyebrow: 'Accesso',
    stTitle: 'Dentro in 30 secondi.',
    stLead: 'POKYH usa il tuo **account WebUntis** — lo stesso con cui accedi all’app WebUntis. Nessuna nuova password, nessuna registrazione.',
    st1Title: 'BFS Tschuggmall',
    st1Body: '**Al momento** è supportato solo il Centro di formazione professionale **“Christian Josef Tschuggmall”**.',
    st2Title: 'Login WebUntis',
    st2Body: 'Inserisci il tuo **nome utente WebUntis** e la password — come nell’app WebUntis. La tua password **non viene mai salvata**.',
    st3Title: 'Si parte',
    st3Body: 'Orario, voti e mensa vengono **caricati automaticamente**.',
    mkEyebrow: 'Fatto da studenti',
    mkTitle: 'Da due della classe.',
    mkLeadBefore: 'POKYH è sviluppato nel tempo libero da due studenti della LBS Bressanone — come progetto open source nell’organizzazione',
    mkLeadAfter: 'su GitHub.',
    ctaTitle: 'Pronto?',
    ctaLead: 'Gratis. Senza registrazione. Con il tuo account WebUntis.',
    ctaButton: 'Accedi con WebUntis',
    ctaHow: 'Come funziona',
  },
  en: {
    heroTitle1: 'Your school.',
    heroTitle2: 'At a glance.',
    heroSub: 'Timetable, grades, cafeteria and more — for every student at LBS Brixen.',
    heroSubStrong: 'Log in with your WebUntis account.',
    loginNow: 'Log in now',
    allFeatures: 'All features',
    mensaQuestion: 'What’s for lunch today?',
    mensaNoLogin: 'Menu without logging in',
    ttEyebrow: 'Timetable',
    ttTitle1: 'Your week.',
    ttTitle2: 'At a glance.',
    ttSub: 'Day and week view. Substitutes and cancellations stand out instantly.',
    grEyebrow: 'Grades & average',
    grTitle1: 'Your average.',
    grTitle2: 'Always up to date.',
    grSub: 'All grades by subject. Overall average calculated automatically — to two decimals.',
    grAverage: 'Average',
    grAllSubjects: 'All subjects',
    grRatio: 'Ratio',
    grPosNeg: 'Pass · Fail',
    grAbove: '4 above 6.0',
    grBelow: '1 below 6.0',
    subjMath: 'Mathematics',
    subjGerman: 'German',
    subjEnglish: 'English',
    subjPractice: 'Workshop practice',
    subjReligion: 'Religion',
    mnEyebrow: 'Cafeteria',
    mnTitle: 'What’s on today?',
    mnSub: 'Daily menu with ratings and allergens — right from the classroom.',
    mnLink: 'View the menu',
    mnNoRating: 'No rating',
    dish1: 'Veal goulash',
    dish1Desc: 'With egg spätzle',
    dish2: 'Plaice fillet',
    dish2Desc: 'With herb potatoes',
    dish3: 'Wholegrain pasta',
    dish3Desc: 'Lentil and vegetable sauce',
    tagMeat: 'Meat',
    tagFish: 'Fish',
    tagVegan: 'Vegan',
    msEyebrow: 'Messages',
    msTitle1: 'Straight from',
    msTitle2: 'WebUntis.',
    msSub: 'With attachment previews and clickable links.',
    msg1Subject: 'Maths test postponed',
    msg1Preview: 'Wednesday’s test is moved to Friday.',
    msg2Subject: 'Reading for next week',
    msg2Preview: 'Please read chapters 8–10 by Monday.',
    msg3Subject: 'Bring your tools',
    msg3Preview: 'Remember to bring your tools tomorrow.',
    msg4Subject: 'Trip next week',
    msg4Preview: 'Please be at the main entrance at 8:00.',
    yesterday: 'Yesterday',
    dayTue: 'Tue',
    dayMon: 'Mon',
    abEyebrow: 'Absences',
    abTitle1: 'Missed hours.',
    abTitle2: 'Month by month.',
    abSub: 'Excused, unexcused and your rate for the school year.',
    abTotal: 'Total missed hours',
    abExcused: 'Excused',
    abUnexcused: 'Unexcused',
    abRate: 'Absence rate',
    abMonth: 'Apr 2025',
    abHours: '4 h',
    rmEyebrow: 'Reminders & to-dos',
    rmTitle1: 'Never forget',
    rmTitle2: 'a thing.',
    rmSub: 'Class-wide reminders for exams — and personal to-dos just for you.',
    rmDue: 'DUE',
    rmUpcoming: 'UPCOMING',
    rm1Title: 'English presentation',
    rm1Body: 'Finish the slides',
    rm1Time: 'Due',
    rm1Date: 'Wed, Apr 30 · 08:00',
    rm2Title: 'Maths test',
    rm2Body: 'Revise chapters 5–7',
    rm2Time: 'in 2 days',
    rm2Date: 'Fri, May 2 · 08:00',
    by: 'by {name}',
    cmpAria: 'Feature overview',
    cmpTitle: 'Everything. In one place.',
    cmpLead: 'All the school information you need every day – faster and clearer than ever.',
    cTimetable: 'Timetable',
    cTimetableSub: 'Live from WebUntis.',
    cGrades: 'Grades',
    cGradesSub: 'Automatic average.',
    cMensa: 'Cafeteria',
    cMensaSub: 'Menu & ratings.',
    cSubst: 'Substitutes',
    cSubstSub: 'Visible instantly.',
    cMessages: 'Messages',
    cMessagesSub: 'With attachments.',
    cAbsences: 'Absences',
    cAbsencesSub: 'Rate at a glance.',
    cReminders: 'Reminders',
    cRemindersSub: 'Class-wide, in real time.',
    cTodos: 'To-dos',
    cTodosSub: 'On all your devices.',
    stEyebrow: 'Login',
    stTitle: 'Logged in within 30 seconds.',
    stLead: 'POKYH uses your **WebUntis account** — the same one you use in the WebUntis app. No new password, no sign-up.',
    st1Title: 'BFS Tschuggmall',
    st1Body: '**Currently** only the **“Christian Josef Tschuggmall”** vocational training centre is supported.',
    st2Title: 'WebUntis login',
    st2Body: 'Enter your **WebUntis username** and password — just like in the WebUntis app. Your password is **never stored**.',
    st3Title: 'Get going',
    st3Body: 'Timetable, grades and cafeteria are **loaded automatically**.',
    mkEyebrow: 'Made by students',
    mkTitle: 'By two from the class.',
    mkLeadBefore: 'POKYH is built in their free time by two students at LBS Brixen — as an open-source project under the',
    mkLeadAfter: 'organisation on GitHub.',
    ctaTitle: 'Ready?',
    ctaLead: 'Free. No sign-up. With your WebUntis account.',
    ctaButton: 'Log in with WebUntis',
    ctaHow: 'How it works',
  },
  lld: {
    heroTitle1: "Tia scola.",
    heroTitle2: "Tlera y ordineda.",
    heroSub: "Urar, notes, mensa y de plu — per duc i sculeies dla LBS Porsenù.",
    heroSubStrong: "Jì ite cun ti account WebUntis.",
    loginNow: "Jì ite sën",
    allFeatures: "Duta la funzions",
    mensaQuestion: "Ci iel ncuei tla mensa?",
    mensaNoLogin: "Menu zënza jì ite",
    ttEyebrow: "Urar",
    ttTitle1: "L’ena.",
    ttTitle2: "Te n’udleda.",
    ttSub: "Vista dl di y dl’ena. Suplenzes y ëures suspendudes se vëija sibe.",
    grEyebrow: "Notes y media",
    grTitle1: "Tia media.",
    grTitle2: "For atualisada.",
    grSub: "Duta la notes aldò dla materia. La media generela vën calculeda da sëula — cun doi posć dò la virgula.",
    grAverage: "Media",
    grAllSubjects: "Duta la materies",
    grRatio: "Rapurt",
    grPosNeg: "Positives · Negatives",
    grAbove: "4 sëura 6,0",
    grBelow: "1 sot 6,0",
    subjMath: "Matematica",
    subjGerman: "Tudësch",
    subjEnglish: "Nglëisc",
    subjPractice: "Pratica prufesciunela",
    subjReligion: "Religion",
    mnEyebrow: "Mensa",
    mnTitle: "Ci iel ncuei?",
    mnSub: "Menu dl di cun valutazions y alergeni — diretamënter tla tlas.",
    mnLink: "Cialé l menu",
    mnNoRating: "Deguna valutazion",
    dish1: "Gulasch de videl",
    dish1Desc: "Cun spätzle da uef",
    dish2: "Filet de passera",
    dish2Desc: "Cun patac ala erbes",
    dish3: "Pasta integrela",
    dish3Desc: "Salsa de lentes y verdures",
    tagMeat: "Ciern",
    tagFish: "Pësc",
    tagVegan: "Vegan",
    msEyebrow: "Nutizies",
    msTitle1: "Diretamënter da",
    msTitle2: "WebUntis.",
    msSub: "Cun anteprima di alegac y link che se pò tliché.",
    msg1Subject: "Verifica de matematica spustëda",
    msg1Preview: "La verifica de mierculdi vën spustëda a vënderdi.",
    msg2Subject: "Letura per l’ena che vën",
    msg2Preview: "Liejëde i capitul 8–10 nchin lunesc.",
    msg3Subject: "Purté la massaries",
    msg3Preview: "Pensëde de purté doman la massaries.",
    msg4Subject: "Gita l’ena che vën",
    msg4Preview: "Siede ai 8:00 dan la porta prinzipela.",
    yesterday: "Ier",
    dayTue: "Mer",
    dayMon: "Lun",
    abEyebrow: "Assënzes",
    abTitle1: "Ëures de assënza.",
    abTitle2: "Per mëns.",
    abSub: "Giustificades, nia giustificades y cuota tl ann de scola.",
    abTotal: "Ëures de assënza dutes adum",
    abExcused: "Giustificades",
    abUnexcused: "Nia giustificades",
    abRate: "Cuota de assënza",
    abMonth: "Auril 2025",
    abHours: "4 ëures",
    rmEyebrow: "Recurdanzes y to-do",
    rmTitle1: "Nia plu",
    rmTitle2: "desmincé.",
    rmSub: "Recurdanzes per duta la tlas per la verifiches — y to-do personei per te.",
    rmDue: "SCADUDES",
    rmUpcoming: "CHE VËN",
    rm1Title: "Referat de nglëisc",
    rm1Body: "Fenì la prejentazion",
    rm1Time: "Scadù",
    rm1Date: "Mie, 30 auril · 08:00",
    rm2Title: "Verifica de matematica",
    rm2Body: "Repeté i capitul 5–7",
    rm2Time: "danter 2 dis",
    rm2Date: "Vën, 2 mei · 08:00",
    by: "da {name}",
    cmpAria: "Survista dla funzions",
    cmpTitle: "Dut. Tl medem post.",
    cmpLead: "Duta la nfurmazions dla scola che te fej de bujën uni di – plu svelt y plu tler che mai.",
    cTimetable: "Urar",
    cTimetableSub: "Live da WebUntis.",
    cGrades: "Notes",
    cGradesSub: "Media da sëula.",
    cMensa: "Mensa",
    cMensaSub: "Menu y valutazions.",
    cSubst: "Suplenzes",
    cSubstSub: "Se vëija sibe.",
    cMessages: "Nutizies",
    cMessagesSub: "Cun alegac.",
    cAbsences: "Assënzes",
    cAbsencesSub: "Cuota for sot l’edl.",
    cReminders: "Recurdanzes",
    cRemindersSub: "Per duta la tlas, te tëmp real.",
    cTodos: "To-do",
    cTodosSub: "Sun duc i dispusitifs.",
    stEyebrow: "Jì ite",
    stTitle: "Ite te 30 secundes.",
    stLead: "POKYH adurvea ti **account WebUntis** — l medem cun chël che tu vas ite tl’app WebUntis. Deguna password nueva, deguna registrazion.",
    st1Title: "BFS Tschuggmall",
    st1Body: "**Al mumënt** vën mé sustenì l Zënter de furmazion prufesciunela **„Christian Josef Tschuggmall“**.",
    st2Title: "Login WebUntis",
    st2Body: "Scrij ite ti **inuem dl utënt WebUntis** y la password — coche tl’app WebUntis. Tia password ne vën **mai nia salveda**.",
    st3Title: "Scumencé",
    st3Body: "Urar, notes y mensa vën **ciariei da sëuli**.",
    mkEyebrow: "Fat da sculeies",
    mkTitle: "Da doi dla tlas.",
    mkLeadBefore: "POKYH vën fat tl tëmp liede da doi sculeies dla LBS Porsenù — coche proiet open source dla organisazion",
    mkLeadAfter: "sun GitHub.",
    ctaTitle: "Pront?",
    ctaLead: "Debant. Zënza registrazion. Cun ti account WebUntis.",
    ctaButton: "Jì ite cun WebUntis",
    ctaHow: "Coche funzionel",
  },
};
