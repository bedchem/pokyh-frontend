import type { Dictionary } from '../dictionary';

export type HomeKey =
  | 'yesterday'
  | 'today'
  | 'tomorrow'
  | 'inDays'
  | 'all'
  | 'morning'
  | 'day'
  | 'evening'
  | 'lessonsEnd'
  | 'startAt'
  | 'noLessons'
  | 'gradeAvg'
  | 'subjectOne'
  | 'subjectMany'
  | 'lessonsToday'
  | 'activeCount'
  | 'cancelledCount'
  | 'messages'
  | 'unreadCount'
  | 'allRead'
  | 'mensaToday'
  | 'mensaNext'
  | 'noRatingYet'
  | 'noLessonsToday'
  | 'exam'
  | 'cancelled'
  | 'substitution'
  | 'nextExam'
  | 'noExam'
  | 'recentGrades'
  | 'noGrades'
  | 'grade'
  | 'now'
  | 'upNext'
  | 'afterThat'
  | 'left'
  | 'until'
  | 'firstStartsIn'
  | 'startsIn'
  | 'dayOver'
  | 'nextDay'
  | 'freeDay'
  | 'minutes'
  | 'hoursMinutes'
  | 'room'
  | 'timetable'
  | 'writeMessage'
  | 'reportAbsence'
  | 'openMessages'
  | 'noMessages'
  | 'lessonsOn'
  | 'shortcuts'
  | 'offline'
  | 'lessonsCount'
  | 'examsSoon'
  | 'examsSub'
  | 'openTodos'
  | 'todosSub'
  | 'todosNone'
  | 'nextSchoolDay'
  | 'absencesNote'
  | 'absencesHours'
  | 'todosNote'
  | 'remindersNote'
  | 'nothingOpen'
  | 'loadFailed';

export const homeDict: Dictionary<HomeKey> = {
  de: {
    yesterday: 'Gestern',
    today: 'Heute',
    tomorrow: 'Morgen',
    inDays: 'in {n} Tagen',
    all: 'Alle',
    morning: 'Guten Morgen',
    day: 'Hallo',
    evening: 'Guten Abend',
    lessonsEnd: 'Unterrichtsende',
    startAt: 'Beginn {time}',
    noLessons: 'Kein Unterricht',
    gradeAvg: 'Notenschnitt',
    subjectOne: '{n} Fach',
    subjectMany: '{n} Fächer',
    lessonsToday: 'Stunden heute',
    activeCount: '{n} aktiv',
    cancelledCount: '{n} entfallen',
    messages: 'Nachrichten',
    unreadCount: '{n} ungelesen',
    allRead: 'Alles gelesen',
    mensaToday: 'Heute in der Mensa',
    mensaNext: 'Als Nächstes in der Mensa',
    noRatingYet: 'Noch keine Bewertung',
    noLessonsToday: 'Heute kein Unterricht',
    exam: 'Prüfung',
    cancelled: 'Entfall',
    substitution: 'Vertretung',
    nextExam: 'Nächste Prüfung',
    noExam: 'Keine Prüfung in den nächsten zwei Wochen',
    recentGrades: 'Letzte Noten',
    noGrades: 'Noch keine Noten in diesem Schuljahr',
    grade: 'Note',
    now: 'Jetzt',
    upNext: 'Als Nächstes',
    afterThat: 'Danach',
    left: 'noch {d}',
    until: 'bis {time}',
    firstStartsIn: 'Die 1. Stunde beginnt in {d}',
    startsIn: 'beginnt in {d}',
    dayOver: 'Unterricht für heute vorbei',
    nextDay: '{day}: {time} {subject}',
    freeDay: 'Heute kein Unterricht',
    minutes: '{n} min',
    hoursMinutes: '{h} h {m} min',
    room: 'Raum {room}',
    timetable: 'Stundenplan',
    writeMessage: 'Nachricht schreiben',
    reportAbsence: 'Abwesenheit melden',
    openMessages: 'Alle Nachrichten',
    noMessages: 'Keine Nachrichten',
    lessonsOn: 'Unterricht am {day}',
    shortcuts: 'Schnellzugriff',
    offline: 'Offline: angezeigt wird der letzte Stand.',
    lessonsCount: '{n} Stunden',
    examsSoon: 'Prüfungen',
    examsSub: 'in den nächsten 14 Tagen',
    openTodos: 'To-dos',
    todosSub: 'offen',
    todosNone: 'alles erledigt',
    nextSchoolDay: 'Nächster Schultag',
    absencesNote: "{rate} % · {hours} Std.",
    absencesHours: "{hours} Std. gefehlt",
    todosNote: "{n} offen",
    remindersNote: "{n} anstehend",
    nothingOpen: "Nichts offen",
    loadFailed: "Konnte nicht geladen werden",
  },
  it: {
    yesterday: 'Ieri',
    today: 'Oggi',
    tomorrow: 'Domani',
    inDays: 'tra {n} giorni',
    all: 'Tutti',
    morning: 'Buongiorno',
    day: 'Ciao',
    evening: 'Buonasera',
    lessonsEnd: 'Fine lezioni',
    startAt: 'Inizio {time}',
    noLessons: 'Nessuna lezione',
    gradeAvg: 'Media voti',
    subjectOne: '{n} materia',
    subjectMany: '{n} materie',
    lessonsToday: 'Ore oggi',
    activeCount: '{n} attive',
    cancelledCount: '{n} annullate',
    messages: 'Messaggi',
    unreadCount: '{n} non letti',
    allRead: 'Tutto letto',
    mensaToday: 'Oggi in mensa',
    mensaNext: 'Prossimamente in mensa',
    noRatingYet: 'Ancora nessuna valutazione',
    noLessonsToday: 'Oggi nessuna lezione',
    exam: 'Verifica',
    cancelled: 'Annullata',
    substitution: 'Supplenza',
    nextExam: 'Prossima verifica',
    noExam: 'Nessuna verifica nelle prossime due settimane',
    recentGrades: 'Ultimi voti',
    noGrades: 'Ancora nessun voto quest’anno',
    grade: 'Voto',
    now: 'Adesso',
    upNext: 'Prossima',
    afterThat: 'Dopo',
    left: 'ancora {d}',
    until: 'fino alle {time}',
    firstStartsIn: 'La 1ª ora inizia tra {d}',
    startsIn: 'inizia tra {d}',
    dayOver: 'Lezioni di oggi finite',
    nextDay: '{day}: {time} {subject}',
    freeDay: 'Oggi nessuna lezione',
    minutes: '{n} min',
    hoursMinutes: '{h} h {m} min',
    room: 'Aula {room}',
    timetable: 'Orario',
    writeMessage: 'Scrivi un messaggio',
    reportAbsence: 'Segnala assenza',
    openMessages: 'Tutti i messaggi',
    noMessages: 'Nessun messaggio',
    lessonsOn: 'Lezioni di {day}',
    shortcuts: 'Accesso rapido',
    offline: 'Offline: vedi l’ultimo stato salvato.',
    lessonsCount: '{n} ore',
    examsSoon: 'Verifiche',
    examsSub: 'nei prossimi 14 giorni',
    openTodos: 'To-do',
    todosSub: 'aperti',
    todosNone: 'tutto fatto',
    nextSchoolDay: 'Prossimo giorno di scuola',
    absencesNote: "{rate} % · {hours} h",
    absencesHours: "{hours} h di assenza",
    todosNote: "{n} aperti",
    remindersNote: "{n} in arrivo",
    nothingOpen: "Niente in sospeso",
    loadFailed: "Impossibile caricare",
  },
  en: {
    yesterday: 'Yesterday',
    today: 'Today',
    tomorrow: 'Tomorrow',
    inDays: 'in {n} days',
    all: 'All',
    morning: 'Good morning',
    day: 'Hello',
    evening: 'Good evening',
    lessonsEnd: 'Classes end',
    startAt: 'Starts {time}',
    noLessons: 'No classes',
    gradeAvg: 'Grade average',
    subjectOne: '{n} subject',
    subjectMany: '{n} subjects',
    lessonsToday: 'Lessons today',
    activeCount: '{n} active',
    cancelledCount: '{n} cancelled',
    messages: 'Messages',
    unreadCount: '{n} unread',
    allRead: 'All read',
    mensaToday: 'In the cafeteria today',
    mensaNext: 'Next in the cafeteria',
    noRatingYet: 'No ratings yet',
    noLessonsToday: 'No classes today',
    exam: 'Exam',
    cancelled: 'Cancelled',
    substitution: 'Substitute',
    nextExam: 'Next exam',
    noExam: 'No exams in the next two weeks',
    recentGrades: 'Recent grades',
    noGrades: 'No grades this school year yet',
    grade: 'Grade',
    now: 'Now',
    upNext: 'Up next',
    afterThat: 'After that',
    left: '{d} left',
    until: 'until {time}',
    firstStartsIn: 'First lesson starts in {d}',
    startsIn: 'starts in {d}',
    dayOver: 'Classes are over for today',
    nextDay: '{day}: {time} {subject}',
    freeDay: 'No classes today',
    minutes: '{n} min',
    hoursMinutes: '{h} h {m} min',
    room: 'Room {room}',
    timetable: 'Timetable',
    writeMessage: 'Write a message',
    reportAbsence: 'Report absence',
    openMessages: 'All messages',
    noMessages: 'No messages',
    lessonsOn: 'Lessons on {day}',
    shortcuts: 'Shortcuts',
    offline: 'Offline: showing the last saved state.',
    lessonsCount: '{n} lessons',
    examsSoon: 'Exams',
    examsSub: 'in the next 14 days',
    openTodos: 'To-dos',
    todosSub: 'open',
    todosNone: 'all done',
    nextSchoolDay: 'Next school day',
    absencesNote: "{rate} % · {hours} h",
    absencesHours: "{hours} h missed",
    todosNote: "{n} open",
    remindersNote: "{n} upcoming",
    nothingOpen: "Nothing open",
    loadFailed: "Couldn’t be loaded",
  },
};
