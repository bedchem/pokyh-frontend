import type { Dictionary } from '../dictionary';

// Copy of the public homepage. Words between *asterisks* are highlighted in
// the statement and reappear as the carousel words. Lists are split on "|".
export type HomepageKey =
  | 'heroName'
  | 'heroFor'
  | 'heroLine'
  | 'heroText'
  | 'heroWords'
  | 'heroRunA'
  | 'heroRunB'
  // Tiles (decorative sample content)
  | 'tPeriod'
  | 'tSubject'
  | 'tRoom'
  | 'tGradeSubject'
  | 'tAverage'
  | 'tCancel'
  | 'tCancelSub'
  | 'tMsgFrom'
  | 'tMsgText'
  | 'tExamDay'
  | 'tExam'
  | 'tWeekdays'
  | 'tNow'
  | 'tExamIn'
  | 'tDish'
  | 'tMensa'
  | 'tRate'
  | 'tExcused'
  | 'tOpen'
  | 'tOverdue'
  | 'tTodoList'
  | 'tReminderList'
  | 'tSubjectList'
  | 'tSenders'
  | 'tTopics'
  | 'tExamList'
  | 'tMonths'
  // Statement
  | 'missionTitle'
  | 'missionText'
  | 'missionCta'
  // Carousel
  | 'featuresTitle'
  | 'prev'
  | 'next'
  | 'slideOf'
  | 'f1Name' | 'f1Word' | 'f1Text' | 'f1Cta'
  | 'f2Name' | 'f2Word' | 'f2Text' | 'f2Cta'
  | 'f3Name' | 'f3Word' | 'f3Text' | 'f3Cta'
  | 'f4Name' | 'f4Word' | 'f4Text' | 'f4Cta'
  | 'f5Name' | 'f5Word' | 'f5Text' | 'f5Cta'
  | 'f6Name' | 'f6Word' | 'f6Text' | 'f6Cta'
  | 'f7Name' | 'f7Word' | 'f7Text' | 'f7Cta'
  | 'f8Name' | 'f8Word' | 'f8Text' | 'f8Cta'
  // Mensa
  | 'mensaTitle'
  | 'mensaNoRating'
  // Get
  | 'getTitle'
  | 'getWebWord'
  | 'getWebText'
  | 'getAndroidWord'
  | 'getAndroidText'
  | 'getIosWord'
  | 'getIosText'
  | 'getOpen'
  | 'getPwa'
  // Makers
  | 'makersTitle'
  | 'makersText';

export const homepageDict: Dictionary<HomepageKey> = {
  de: {
    heroName: 'POKYH, die Schulapp der LBS Brixen',
    heroFor: 'gemacht für',
    heroLine: 'Die Schulapp der LBS Brixen,',
    heroText: 'Stundenplan, Noten, Mensa und Nachrichten an einem Ort. Kostenlos und von Schülern gebaut.',
    heroWords: 'Montagmorgen.|die große Pause.|Schularbeiten.|die Mensa.|deine Klasse.',
    heroRunA: 'Stundenplan · Mensa · Noten · Nachrichten ·',
    heroRunB: 'dein Schultag an einem Ort ·',
    tPeriod: '1. Stunde',
    tSubject: 'Mathematik',
    tRoom: 'Raum 204',
    tGradeSubject: 'Deutsch',
    tAverage: 'Schnitt 8,2',
    tCancel: 'Entfall',
    tCancelSub: '3. Stunde · Physik',
    tMsgFrom: 'Klassenvorstand',
    tMsgText: 'Bitte morgen das Werkstattheft mitbringen.',
    tExamDay: 'Donnerstag',
    tExam: 'Schularbeit Englisch',
    tWeekdays: 'Mo|Di|Mi|Do|Fr',
    tNow: 'jetzt',
    tExamIn: 'in 3 Tagen',
    tDish: 'Pasta al ragù',
    tMensa: 'Mensa',
    tRate: 'Fehlquote im Schuljahr',
    tExcused: 'Entschuldigt',
    tOpen: 'Offen',
    tOverdue: 'Überfällig',
    tTodoList: 'Werkstattheft mitbringen|Referat vorbereiten|Formular abgeben|Vokabeln lernen',
    tReminderList: 'Ausflug nach Bozen|Elternsprechtag|Bücher zurückgeben',
    tSubjectList: 'Deutsch|Mathematik|Physik',
    tSenders: 'Klassenvorstand|Sekretariat|Huber|Kofler',
    tTopics: 'Werkstattheft mitbringen|Ausflug am Freitag|Elternsprechtag|Raumänderung Mittwoch',
    tExamList: 'Mathematik · Test|Englisch · Vokabeltest',
    tMonths: 'S|O|N|D|J|F|M|A|M|J',
    missionTitle: 'unsere idee',
    missionText:
      'Wir glauben, dass ein Schultag leichter sein kann. Du weißt *pünktlich*, welche Stunde als Nächstes kommt, siehst schon in der Pause, was die Mensa kocht und ob es *lecker* ist, und hast die nächste Schularbeit *gemeinsam* mit deiner Klasse im Blick. Dafür haben wir POKYH gebaut.',
    missionCta: 'Jetzt anmelden',
    featuresTitle: 'Was POKYH kann',
    prev: 'Vorherige Funktion',
    next: 'Nächste Funktion',
    slideOf: '{n} von {total}',
    f1Name: 'Stundenplan',
    f1Word: 'pünktlich',
    f1Text: 'Welche Stunde, wann, wo und mit wem. Entfall und Vertretungen siehst du sofort.',
    f1Cta: 'Zum Stundenplan',
    f2Name: 'Mensa',
    f2Word: 'lecker',
    f2Text: 'Das Menü der Woche mit Zutaten, Allergenen und den Sternen deiner Mitschüler.',
    f2Cta: 'Zur Mensa',
    f3Name: 'Noten',
    f3Word: 'klar',
    f3Text: 'Alle Noten pro Fach, dein Schnitt rechnet sich von selbst.',
    f3Cta: 'Zu den Noten',
    f4Name: 'Nachrichten',
    f4Word: 'direkt',
    f4Text: 'Nachrichten von Lehrkräften lesen, beantworten und Anhänge öffnen.',
    f4Cta: 'Zu den Nachrichten',
    f5Name: 'Klassen-Erinnerungen',
    f5Word: 'gemeinsam',
    f5Text: 'Eine Erinnerung für die ganze Klasse, sie erscheint bei allen gleichzeitig.',
    f5Cta: 'Zu den Erinnerungen',
    f6Name: 'Prüfungen und Hausaufgaben',
    f6Word: 'vorbereitet',
    f6Text: 'Schularbeiten und Aufgaben stehen direkt bei der Stunde, zu der sie gehören.',
    f6Cta: 'Zum Stundenplan',
    f7Name: 'Abwesenheiten',
    f7Word: 'gemeldet',
    f7Text: 'Fehlstunden pro Monat im Überblick. Abwesenheiten meldest du direkt in der App.',
    f7Cta: 'Zu den Abwesenheiten',
    f8Name: 'To-dos',
    f8Word: 'erledigt',
    f8Text: 'Deine eigene Liste für alles, was neben dem Unterricht ansteht.',
    f8Cta: 'Zu den To-dos',
    mensaTitle: 'heute in der mensa',
    mensaNoRating: 'noch keine Sterne',
    getTitle: 'so kommst du rein',
    getWebWord: 'im browser',
    getWebText: 'Sofort, ohne Installation. Anmelden mit deinem WebUntis-Konto.',
    getAndroidWord: 'android',
    getAndroidText: 'Die App für dein Android-Handy, mit Anleitung.',
    getIosWord: 'iphone',
    getIosText: 'Die App für dein iPhone, mit Anleitung.',
    getOpen: 'Öffnen',
    getPwa: 'Lieber als Web-App auf dem Homescreen?',
    makersTitle: 'von schülern gemacht',
    makersText:
      'POKYH ist kein Firmenprodukt. Zwei Schüler der LBS Brixen bauen es in ihrer Freizeit, weil ihnen im Schulalltag Dinge gefehlt haben. Es ist *kostenlos*, ohne Werbung und für *alle*, die hier lernen.',
  },
  it: {
    heroName: "POKYH, l'app scolastica della LBS Bressanone",
    heroFor: 'fatto per',
    heroWords: 'la LBS Bressanone.|il lunedì mattina.|l’intervallo.|le verifiche.|la mensa.',
    heroRunA: 'Orario · Mensa · Voti · Messaggi ·',
    heroRunB: 'la tua giornata in un posto ·',
    tPeriod: '1ª ora',
    tSubject: 'Matematica',
    tRoom: 'Aula 204',
    tGradeSubject: 'Tedesco',
    tAverage: 'Media 8,2',
    tCancel: 'Annullata',
    tCancelSub: '3ª ora · Fisica',
    tMsgFrom: 'Coordinatore di classe',
    tMsgText: 'Domani portate il quaderno di laboratorio.',
    tExamDay: 'Giovedì',
    tExam: 'Verifica di inglese',
    tWeekdays: 'Lu|Ma|Me|Gi|Ve',
    tNow: 'ora',
    tExamIn: 'tra 3 giorni',
    tDish: 'Pasta al ragù',
    tMensa: 'Mensa',
    tRate: 'Tasso di assenza dell’anno',
    tExcused: 'Giustificate',
    tOpen: 'Aperte',
    tOverdue: 'In ritardo',
    tTodoList: 'Portare il quaderno|Preparare la relazione|Consegnare il modulo|Studiare i vocaboli',
    tReminderList: 'Gita a Bolzano|Colloqui con i genitori|Restituire i libri',
    tSubjectList: 'Tedesco|Matematica|Fisica',
    tSenders: 'Coordinatore|Segreteria|Huber|Kofler',
    tTopics: 'Portare il quaderno|Gita di venerdì|Colloqui con i genitori|Cambio aula mercoledì',
    tExamList: 'Matematica · Verifica|Inglese · Vocaboli',
    tMonths: 'S|O|N|D|G|F|M|A|M|G',
    missionTitle: 'la nostra idea',
    missionText:
      "Crediamo che una giornata di scuola possa essere più leggera. Sai in modo *puntuale* quale lezione arriva, vedi già durante l'intervallo cosa cucina la mensa e se è *gustoso*, e tieni d'occhio la prossima verifica *insieme* alla tua classe. Per questo abbiamo creato POKYH.",
    missionCta: 'Accedi ora',
    featuresTitle: 'Cosa fa POKYH',
    prev: 'Funzione precedente',
    next: 'Funzione successiva',
    slideOf: '{n} di {total}',
    f1Name: 'Orario',
    f1Word: 'puntuale',
    f1Text: 'Quale lezione, quando, dove e con chi. Ore annullate e supplenze si vedono subito.',
    f1Cta: "All'orario",
    f2Name: 'Mensa',
    f2Word: 'gustoso',
    f2Text: 'Il menù della settimana con ingredienti, allergeni e le stelle dei compagni.',
    f2Cta: 'Alla mensa',
    f3Name: 'Voti',
    f3Word: 'chiaro',
    f3Text: 'Tutti i voti per materia, la media si calcola da sola.',
    f3Cta: 'Ai voti',
    f4Name: 'Messaggi',
    f4Word: 'diretto',
    f4Text: 'Leggi e rispondi ai messaggi dei docenti, apri gli allegati.',
    f4Cta: 'Ai messaggi',
    f5Name: 'Promemoria di classe',
    f5Word: 'insieme',
    f5Text: 'Un promemoria per tutta la classe, appare a tutti nello stesso momento.',
    f5Cta: 'Ai promemoria',
    f6Name: 'Verifiche e compiti',
    f6Word: 'pronto',
    f6Text: "Verifiche e compiti stanno direttamente accanto all'ora a cui appartengono.",
    f6Cta: "All'orario",
    f7Name: 'Assenze',
    f7Word: 'segnalato',
    f7Text: "Le ore di assenza per mese a colpo d'occhio. Le assenze le segnali direttamente nell'app.",
    f7Cta: 'Alle assenze',
    f8Name: 'To-do',
    f8Word: 'fatto',
    f8Text: "La tua lista per tutto quello che c'è oltre alle lezioni.",
    f8Cta: 'Ai to-do',
    mensaTitle: 'oggi in mensa',
    mensaNoRating: 'ancora nessuna stella',
    getTitle: 'come entrare',
    getWebWord: 'nel browser',
    getWebText: "Subito, senza installare nulla. Accedi con l'account WebUntis.",
    getAndroidWord: 'android',
    getAndroidText: "L'app per il tuo telefono Android, con guida.",
    getIosWord: 'iphone',
    getIosText: "L'app per il tuo iPhone, con guida.",
    getOpen: 'Apri',
    getPwa: 'Preferisci la web app sulla schermata home?',
    makersTitle: 'fatto da studenti',
    makersText:
      'POKYH non è un prodotto aziendale. Due studenti della LBS Bressanone lo costruiscono nel tempo libero, perché nella vita scolastica mancava qualcosa. È *gratuito*, senza pubblicità e per *tutti* quelli che studiano qui.',
  },
  en: {
    heroName: 'POKYH, the school app of LBS Brixen',
    heroFor: 'made for',
    heroWords: 'LBS Brixen.|Monday mornings.|the long break.|exam weeks.|the cafeteria.',
    heroRunA: 'Timetable · Cafeteria · Grades · Messages ·',
    heroRunB: 'your school day in one place ·',
    tPeriod: 'Period 1',
    tSubject: 'Maths',
    tRoom: 'Room 204',
    tGradeSubject: 'German',
    tAverage: 'Average 8.2',
    tCancel: 'Cancelled',
    tCancelSub: 'Period 3 · Physics',
    tMsgFrom: 'Class teacher',
    tMsgText: 'Please bring your workshop notebook tomorrow.',
    tExamDay: 'Thursday',
    tExam: 'English test',
    tWeekdays: 'Mo|Tu|We|Th|Fr',
    tNow: 'now',
    tExamIn: 'in 3 days',
    tDish: 'Pasta al ragù',
    tMensa: 'Cafeteria',
    tRate: 'Absence rate this year',
    tExcused: 'Excused',
    tOpen: 'Open',
    tOverdue: 'Overdue',
    tTodoList: 'Bring the workshop notebook|Prepare the presentation|Hand in the form|Learn vocabulary',
    tReminderList: 'Trip to Bolzano|Parents’ evening|Return the books',
    tSubjectList: 'German|Maths|Physics',
    tSenders: 'Class teacher|Office|Huber|Kofler',
    tTopics: 'Bring the workshop notebook|Trip on Friday|Parents’ evening|Room change Wednesday',
    tExamList: 'Maths · Test|English · Vocabulary',
    tMonths: 'S|O|N|D|J|F|M|A|M|J',
    missionTitle: 'our idea',
    missionText:
      'We believe a school day can feel lighter. You know *on time* which lesson comes next, see during the break what the cafeteria is cooking and whether it’s *tasty*, and keep the next test in view *together* with your class. That’s why we built POKYH.',
    missionCta: 'Sign in now',
    featuresTitle: 'What POKYH does',
    prev: 'Previous feature',
    next: 'Next feature',
    slideOf: '{n} of {total}',
    f1Name: 'Timetable',
    f1Word: 'on time',
    f1Text: 'Which lesson, when, where and with whom. Cancellations and substitutions stand out at once.',
    f1Cta: 'Open timetable',
    f2Name: 'Cafeteria',
    f2Word: 'tasty',
    f2Text: 'The week’s menu with ingredients, allergens and your classmates’ stars.',
    f2Cta: 'Open cafeteria',
    f3Name: 'Grades',
    f3Word: 'clear',
    f3Text: 'Every grade per subject, and your average works itself out.',
    f3Cta: 'Open grades',
    f4Name: 'Messages',
    f4Word: 'direct',
    f4Text: 'Read and answer messages from your teachers, open attachments.',
    f4Cta: 'Open messages',
    f5Name: 'Class reminders',
    f5Word: 'together',
    f5Text: 'One reminder for the whole class, it shows up for everyone at once.',
    f5Cta: 'Open reminders',
    f6Name: 'Tests and homework',
    f6Word: 'ready',
    f6Text: 'Tests and homework sit right next to the lesson they belong to.',
    f6Cta: 'Open timetable',
    f7Name: 'Absences',
    f7Word: 'reported',
    f7Text: 'Missed hours per month at a glance. You report absences right in the app.',
    f7Cta: 'Open absences',
    f8Name: 'To-dos',
    f8Word: 'done',
    f8Text: 'Your own list for everything beside lessons.',
    f8Cta: 'Open to-dos',
    mensaTitle: 'today in the cafeteria',
    mensaNoRating: 'no stars yet',
    getTitle: 'how to get in',
    getWebWord: 'in the browser',
    getWebText: 'Right away, nothing to install. Sign in with your WebUntis account.',
    getAndroidWord: 'android',
    getAndroidText: 'The app for your Android phone, with a guide.',
    getIosWord: 'iphone',
    getIosText: 'The app for your iPhone, with a guide.',
    getOpen: 'Open',
    getPwa: 'Rather have the web app on your home screen?',
    makersTitle: 'made by students',
    makersText:
      'POKYH is not a company product. Two students of LBS Brixen build it in their free time, because things were missing from their school day. It is *free*, without ads and for *everyone* who learns here.',
  },
};
