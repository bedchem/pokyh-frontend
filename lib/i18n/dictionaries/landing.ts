import type { Dictionary } from '../dictionary';

export type LandingKey =
  // Hero
  | 'heroLine1'
  | 'heroLine2'
  | 'heroLead'
  | 'ctaLogin'
  | 'ctaMensa'
  | 'scrollHint'
  // Live period board
  | 'boardNow'
  | 'boardPeriod'
  | 'boardLeft'
  | 'boardBreak'
  | 'boardBreakNext'
  | 'boardBefore'
  | 'boardBeforeNext'
  | 'boardAfter'
  | 'boardTomorrow'
  | 'boardMonday'
  | 'boardWeekend'
  | 'boardSource'
  // Day story
  | 'storyTitle'
  | 'tagToday'
  | 'tagTimetable'
  | 'tagMensa'
  | 'tagGrades'
  | 'tagMessages'
  | 'ch1Title'
  | 'ch1Body'
  | 'ch2Title'
  | 'ch2Body'
  | 'ch3Title'
  | 'ch3Body'
  | 'ch4Title'
  | 'ch4Body'
  | 'ch5Title'
  | 'ch5Body'
  // Week
  | 'weekTitle'
  | 'weekBody'
  | 'weekCancelled'
  | 'weekSubstitute'
  | 'weekExam'
  | 'weekdays'
  | 'subjMath'
  | 'subjGerman'
  | 'subjEnglish'
  | 'subjItalian'
  | 'subjWorkshop'
  | 'subjTheory'
  | 'subjSport'
  | 'subjReligion'
  | 'subjEconomics'
  // Mensa
  | 'mensaToday'
  | 'mensaDay'
  | 'mensaLead'
  | 'mensaAll'
  | 'mensaEmpty'
  | 'mensaError'
  | 'mensaRatings'
  | 'mensaRatingOne'
  | 'mensaNoRating'
  // WebUntis inside
  | 'insideTitle'
  | 'insideBody'
  | 'fromUntis'
  | 'onlyPokyh'
  | 'u1'
  | 'u2'
  | 'u3'
  | 'u4'
  | 'u5'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'p5'
  | 'insideNote'
  // Compare
  | 'compareTitle'
  | 'compareLead'
  | 'cmpMensa'
  | 'cmpAverage'
  | 'cmpReminders'
  | 'cmpDark'
  | 'cmpFree'
  | 'cmpOfficial'
  | 'compareMore'
  // Makers
  | 'makersTitle'
  | 'makersBody'
  | 'makersGithub'
  | 'makersStory'
  // Get
  | 'getTitle'
  | 'getWeb'
  | 'getWebSub'
  | 'getAndroid'
  | 'getAndroidSub'
  | 'getIos'
  | 'getIosSub'
  | 'getPwa'
  | 'getPwaSub'
  // Final
  | 'finalTitle'
  | 'finalBody'
  | 'phoneAlt';

export const landingDict: Dictionary<LandingKey> = {
  de: {
    heroLine1: 'Der Schultag,',
    heroLine2: 'aufgeräumt.',
    heroLead: 'Stundenplan, Noten, Mensa und Nachrichten der LBS Brixen in einer App. Du meldest dich mit deinem WebUntis-Konto an. Das war’s.',
    ctaLogin: 'Mit WebUntis anmelden',
    ctaMensa: 'Heute in der Mensa',
    scrollHint: 'Scroll durch einen Schultag',

    boardNow: 'Jetzt',
    boardPeriod: '{n}. Stunde',
    boardLeft: 'noch {m} Min.',
    boardBreak: 'Pause',
    boardBreakNext: '{n}. Stunde um {time}',
    boardBefore: 'Vor Schulbeginn',
    boardBeforeNext: '1. Stunde in {m} Min.',
    boardAfter: 'Schulschluss',
    boardTomorrow: 'Morgen ab 07:50',
    boardMonday: 'Montag ab 07:50',
    boardWeekend: 'Sonntag',
    boardSource: 'Live nach dem Stundenraster der LBS Brixen',

    storyTitle: 'Ein Schultag mit POKYH',
    tagToday: 'Heute',
    tagTimetable: 'Stundenplan',
    tagMensa: 'Mensa',
    tagGrades: 'Noten',
    tagMessages: 'Nachrichten',
    ch1Title: 'Bevor du losfährst.',
    ch1Body: 'Nächste Stunde, Raum, Lehrkraft und was ausfällt. Auf einen Blick, noch bevor du im Bus sitzt.',
    ch2Title: 'Vertretung? Fällt auf.',
    ch2Body: 'Entfall, Vertretung und Prüfungen sind in deiner Woche markiert. Du stehst nicht mehr im falschen Raum.',
    ch3Title: 'Was gibt’s heute?',
    ch3Body: 'Das Mensa-Menü mit Zutaten, Nährwerten und den Sternen deiner Mitschüler. Auch ohne Anmeldung.',
    ch4Title: 'Neue Note eingetragen.',
    ch4Body: 'Dein Schnitt pro Fach und gesamt, mit Verlauf. Der Rechner sagt dir, was du in der nächsten Prüfung brauchst.',
    ch5Title: 'Kurz der Lehrerin schreiben.',
    ch5Body: 'WebUntis-Nachrichten lesen und schreiben, mit Anhängen. Direkt in POKYH, ohne eine zweite App.',

    weekTitle: 'Die ganze Woche. Auf einer Fläche.',
    weekBody: 'Jedes Fach hat seine Farbe. Änderungen tragen eine klare Markierung, damit du sie nicht übersiehst.',
    weekCancelled: 'Entfall',
    weekSubstitute: 'Vertretung',
    weekExam: 'Prüfung',
    weekdays: 'Mo,Di,Mi,Do,Fr,Sa',
    subjMath: 'Mathematik',
    subjGerman: 'Deutsch',
    subjEnglish: 'Englisch',
    subjItalian: 'Italienisch',
    subjWorkshop: 'Fachpraxis',
    subjTheory: 'Fachtheorie',
    subjSport: 'Bewegung',
    subjReligion: 'Religion',
    subjEconomics: 'Wirtschaft',

    mensaToday: 'Heute in der Mensa',
    mensaDay: '{day} in der Mensa',
    mensaLead: 'Direkt aus dem Speiseplan der Schule, mit den Bewertungen deiner Mitschüler.',
    mensaAll: 'Ganzer Speiseplan',
    mensaEmpty: 'Für die nächsten Tage ist noch kein Menü eingetragen.',
    mensaError: 'Der Speiseplan ist gerade nicht erreichbar.',
    mensaRatings: '{n} Bewertungen',
    mensaRatingOne: '1 Bewertung',
    mensaNoRating: 'Noch keine Bewertung',

    insideTitle: 'Dein WebUntis-Konto. Nur angenehmer.',
    insideBody: 'POKYH meldet sich mit deinem eigenen Konto bei WebUntis an und zeigt dir deine Daten. Was du in POKYH schreibst, kommt in WebUntis an.',
    fromUntis: 'Aus WebUntis',
    onlyPokyh: 'Nur in POKYH',
    u1: 'Stundenplan mit Vertretungen und Prüfungen',
    u2: 'Noten mit Durchschnitt pro Fach',
    u3: 'Nachrichten lesen und schreiben, mit Anhängen',
    u4: 'Fehlstunden und Abwesenheiten',
    u5: 'Klassenbuch, Hausaufgaben und Klassendienste',
    p1: 'Mensa mit Bewertungen und Kommentaren',
    p2: 'Erinnerungen für die ganze Klasse, in Echtzeit',
    p3: 'Persönliche To-dos auf allen Geräten',
    p4: 'Notenrechner: was brauche ich noch?',
    p5: 'Dunkles Design und drei Sprachen',
    insideNote: 'Dein Passwort geht nur an WebUntis und wird nicht auf POKYH-Servern gespeichert.',

    compareTitle: 'POKYH und WebUntis',
    compareLead: 'Kein Ersatz, sondern eine bessere Oberfläche für dieselben Daten. Dazu das, was im Schulalltag fehlt.',
    cmpMensa: 'Mensa-Speiseplan',
    cmpAverage: 'Notenschnitt automatisch',
    cmpReminders: 'Erinnerungen für die Klasse',
    cmpDark: 'Dunkles Design',
    cmpFree: 'Kostenlos und werbefrei',
    cmpOfficial: 'Offizielle Plattform der Schule',
    compareMore: 'Ganzer Vergleich',

    makersTitle: 'Gebaut von zwei aus der Klasse.',
    makersBody: 'POKYH entsteht in der Freizeit von zwei Schülern der LBS Brixen. Ohne Werbung, ohne Abo, mit offenem Code auf GitHub.',
    makersGithub: 'Code auf GitHub',
    makersStory: 'Die ganze Geschichte',

    getTitle: 'Im Browser, als App oder auf dem Homescreen.',
    getWeb: 'Im Browser',
    getWebSub: 'pokyh.com auf jedem Gerät',
    getAndroid: 'Android-App',
    getAndroidSub: 'APK direkt von GitHub',
    getIos: 'iPhone-App',
    getIosSub: 'IPA direkt von GitHub',
    getPwa: 'Homescreen-App',
    getPwaSub: 'Ohne App Store installieren',

    finalTitle: 'Leg los.',
    finalBody: 'Kostenlos und ohne Registrierung. Mit deinem WebUntis-Konto.',
    phoneAlt: 'POKYH auf einem iPhone',
  },
  it: {
    heroLine1: 'La giornata scolastica,',
    heroLine2: 'in ordine.',
    heroLead: 'Orario, voti, mensa e messaggi della LBS Bressanone in un’unica app. Accedi con il tuo account WebUntis. Fatto.',
    ctaLogin: 'Accedi con WebUntis',
    ctaMensa: 'Oggi in mensa',
    scrollHint: 'Scorri una giornata di scuola',

    boardNow: 'Ora',
    boardPeriod: '{n}ª ora',
    boardLeft: 'ancora {m} min',
    boardBreak: 'Pausa',
    boardBreakNext: '{n}ª ora alle {time}',
    boardBefore: 'Prima delle lezioni',
    boardBeforeNext: '1ª ora tra {m} min',
    boardAfter: 'Lezioni finite',
    boardTomorrow: 'Domani dalle 07:50',
    boardMonday: 'Lunedì dalle 07:50',
    boardWeekend: 'Domenica',
    boardSource: 'In tempo reale secondo l’orario della LBS Bressanone',

    storyTitle: 'Una giornata di scuola con POKYH',
    tagToday: 'Oggi',
    tagTimetable: 'Orario',
    tagMensa: 'Mensa',
    tagGrades: 'Voti',
    tagMessages: 'Messaggi',
    ch1Title: 'Prima di uscire di casa.',
    ch1Body: 'Prossima ora, aula, docente e cosa salta. Tutto a colpo d’occhio, prima ancora di salire sul bus.',
    ch2Title: 'Supplenza? Salta all’occhio.',
    ch2Body: 'Ore saltate, supplenze e verifiche sono segnate nella tua settimana. Niente più aula sbagliata.',
    ch3Title: 'Cosa c’è oggi?',
    ch3Body: 'Il menù della mensa con ingredienti, valori nutrizionali e le stelle dei compagni. Anche senza accesso.',
    ch4Title: 'Nuovo voto.',
    ch4Body: 'La tua media per materia e complessiva, con l’andamento. Il calcolatore ti dice cosa ti serve alla prossima verifica.',
    ch5Title: 'Scrivere alla prof.',
    ch5Body: 'Leggere e scrivere messaggi WebUntis, con allegati. Direttamente in POKYH, senza una seconda app.',

    weekTitle: 'Tutta la settimana. In un’unica vista.',
    weekBody: 'Ogni materia ha il suo colore. Le modifiche hanno un segno chiaro, così non le perdi.',
    weekCancelled: 'Saltata',
    weekSubstitute: 'Supplenza',
    weekExam: 'Verifica',
    weekdays: 'Lun,Mar,Mer,Gio,Ven,Sab',
    subjMath: 'Matematica',
    subjGerman: 'Tedesco',
    subjEnglish: 'Inglese',
    subjItalian: 'Italiano',
    subjWorkshop: 'Pratica',
    subjTheory: 'Teoria',
    subjSport: 'Motoria',
    subjReligion: 'Religione',
    subjEconomics: 'Economia',

    mensaToday: 'Oggi in mensa',
    mensaDay: '{day} in mensa',
    mensaLead: 'Direttamente dal menù della scuola, con le valutazioni dei compagni.',
    mensaAll: 'Menù completo',
    mensaEmpty: 'Per i prossimi giorni non c’è ancora un menù.',
    mensaError: 'Il menù non è raggiungibile al momento.',
    mensaRatings: '{n} valutazioni',
    mensaRatingOne: '1 valutazione',
    mensaNoRating: 'Ancora nessuna valutazione',

    insideTitle: 'Il tuo account WebUntis. Solo più comodo.',
    insideBody: 'POKYH accede a WebUntis con il tuo account e ti mostra i tuoi dati. Quello che scrivi in POKYH arriva in WebUntis.',
    fromUntis: 'Da WebUntis',
    onlyPokyh: 'Solo in POKYH',
    u1: 'Orario con supplenze e verifiche',
    u2: 'Voti con media per materia',
    u3: 'Leggere e scrivere messaggi, con allegati',
    u4: 'Assenze e ore perse',
    u5: 'Registro di classe, compiti e servizi di classe',
    p1: 'Mensa con valutazioni e commenti',
    p2: 'Promemoria per tutta la classe, in tempo reale',
    p3: 'To-do personali su tutti i dispositivi',
    p4: 'Calcolatore: che voto mi serve?',
    p5: 'Tema scuro e tre lingue',
    insideNote: 'La tua password va solo a WebUntis e non viene salvata sui server di POKYH.',

    compareTitle: 'POKYH e WebUntis',
    compareLead: 'Non un sostituto, ma un’interfaccia migliore per gli stessi dati. Più quello che manca nella vita di scuola.',
    cmpMensa: 'Menù della mensa',
    cmpAverage: 'Media automatica',
    cmpReminders: 'Promemoria per la classe',
    cmpDark: 'Tema scuro',
    cmpFree: 'Gratis e senza pubblicità',
    cmpOfficial: 'Piattaforma ufficiale della scuola',
    compareMore: 'Confronto completo',

    makersTitle: 'Fatto da due compagni di classe.',
    makersBody: 'POKYH nasce nel tempo libero di due studenti della LBS Bressanone. Senza pubblicità, senza abbonamento, con codice aperto su GitHub.',
    makersGithub: 'Codice su GitHub',
    makersStory: 'Tutta la storia',

    getTitle: 'Nel browser, come app o sulla schermata Home.',
    getWeb: 'Nel browser',
    getWebSub: 'pokyh.com su ogni dispositivo',
    getAndroid: 'App Android',
    getAndroidSub: 'APK direttamente da GitHub',
    getIos: 'App iPhone',
    getIosSub: 'IPA direttamente da GitHub',
    getPwa: 'App sulla Home',
    getPwaSub: 'Installare senza App Store',

    finalTitle: 'Inizia.',
    finalBody: 'Gratis e senza registrazione. Con il tuo account WebUntis.',
    phoneAlt: 'POKYH su un iPhone',
  },
  en: {
    heroLine1: 'Your school day,',
    heroLine2: 'sorted.',
    heroLead: 'Timetable, grades, cafeteria and messages for LBS Brixen in one app. Sign in with your WebUntis account. That’s it.',
    ctaLogin: 'Sign in with WebUntis',
    ctaMensa: 'Today’s menu',
    scrollHint: 'Scroll through a school day',

    boardNow: 'Now',
    boardPeriod: 'Period {n}',
    boardLeft: '{m} min left',
    boardBreak: 'Break',
    boardBreakNext: 'Period {n} at {time}',
    boardBefore: 'Before school',
    boardBeforeNext: 'Period 1 in {m} min',
    boardAfter: 'School’s out',
    boardTomorrow: 'Tomorrow from 07:50',
    boardMonday: 'Monday from 07:50',
    boardWeekend: 'Sunday',
    boardSource: 'Live, on the LBS Brixen bell schedule',

    storyTitle: 'A school day with POKYH',
    tagToday: 'Today',
    tagTimetable: 'Timetable',
    tagMensa: 'Cafeteria',
    tagGrades: 'Grades',
    tagMessages: 'Messages',
    ch1Title: 'Before you leave.',
    ch1Body: 'Next lesson, room, teacher and what’s cancelled. At a glance, before you’re even on the bus.',
    ch2Title: 'A substitution? You’ll notice.',
    ch2Body: 'Cancellations, substitutions and exams are marked in your week. No more wrong rooms.',
    ch3Title: 'What’s for lunch?',
    ch3Body: 'The cafeteria menu with ingredients, nutrition facts and ratings from your classmates. No sign-in needed.',
    ch4Title: 'A new grade.',
    ch4Body: 'Your average per subject and overall, with a trend. The calculator tells you what you need on the next test.',
    ch5Title: 'Message your teacher.',
    ch5Body: 'Read and write WebUntis messages, attachments included. Right inside POKYH, no second app.',

    weekTitle: 'The whole week. One view.',
    weekBody: 'Every subject has its colour. Changes carry a clear mark so you can’t miss them.',
    weekCancelled: 'Cancelled',
    weekSubstitute: 'Substitute',
    weekExam: 'Exam',
    weekdays: 'Mon,Tue,Wed,Thu,Fri,Sat',
    subjMath: 'Maths',
    subjGerman: 'German',
    subjEnglish: 'English',
    subjItalian: 'Italian',
    subjWorkshop: 'Workshop',
    subjTheory: 'Theory',
    subjSport: 'PE',
    subjReligion: 'RE',
    subjEconomics: 'Economics',

    mensaToday: 'Today in the cafeteria',
    mensaDay: '{day} in the cafeteria',
    mensaLead: 'Straight from the school’s menu, with ratings from your classmates.',
    mensaAll: 'Full menu',
    mensaEmpty: 'No menu has been published for the next few days yet.',
    mensaError: 'The menu can’t be reached right now.',
    mensaRatings: '{n} ratings',
    mensaRatingOne: '1 rating',
    mensaNoRating: 'No ratings yet',

    insideTitle: 'Your WebUntis account. Just nicer.',
    insideBody: 'POKYH signs in to WebUntis with your own account and shows you your data. What you write in POKYH arrives in WebUntis.',
    fromUntis: 'From WebUntis',
    onlyPokyh: 'Only in POKYH',
    u1: 'Timetable with substitutions and exams',
    u2: 'Grades with per-subject averages',
    u3: 'Read and write messages, with attachments',
    u4: 'Absences and missed hours',
    u5: 'Class register, homework and class duties',
    p1: 'Cafeteria with ratings and comments',
    p2: 'Reminders for the whole class, in real time',
    p3: 'Personal to-dos on every device',
    p4: 'Grade calculator: what do I still need?',
    p5: 'Dark mode and three languages',
    insideNote: 'Your password only goes to WebUntis and is never stored on POKYH servers.',

    compareTitle: 'POKYH and WebUntis',
    compareLead: 'Not a replacement, a better interface for the same data. Plus what school life is missing.',
    cmpMensa: 'Cafeteria menu',
    cmpAverage: 'Automatic grade average',
    cmpReminders: 'Class reminders',
    cmpDark: 'Dark mode',
    cmpFree: 'Free and ad-free',
    cmpOfficial: 'The school’s official platform',
    compareMore: 'Full comparison',

    makersTitle: 'Built by two classmates.',
    makersBody: 'POKYH is built in their free time by two students at LBS Brixen. No ads, no subscription, open source on GitHub.',
    makersGithub: 'Code on GitHub',
    makersStory: 'The full story',

    getTitle: 'In the browser, as an app or on your home screen.',
    getWeb: 'In the browser',
    getWebSub: 'pokyh.com on any device',
    getAndroid: 'Android app',
    getAndroidSub: 'APK straight from GitHub',
    getIos: 'iPhone app',
    getIosSub: 'IPA straight from GitHub',
    getPwa: 'Home screen app',
    getPwaSub: 'Install without an app store',

    finalTitle: 'Get started.',
    finalBody: 'Free, no registration. With your WebUntis account.',
    phoneAlt: 'POKYH on an iPhone',
  },
};
