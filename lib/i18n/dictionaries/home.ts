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
  | 'messages'
  | 'unreadCount'
  | 'allRead'
  | 'mensaToday'
  | 'noRatingYet'
  | 'todayWithDate'
  | 'noLessonsToday'
  | 'exam'
  | 'cancelled'
  | 'substitution'
  | 'nextExam'
  | 'recentGrades'
  | 'grade';

export const homeDict: Dictionary<HomeKey> = {
  de: {
    yesterday: 'Gestern',
    today: 'Heute',
    tomorrow: 'Morgen',
    inDays: 'in {n} Tagen',
    all: 'Alle',
    morning: 'Guten Morgen',
    day: 'Guten Tag',
    evening: 'Guten Abend',
    lessonsEnd: 'Unterrichtsende',
    startAt: 'Start: {time}',
    noLessons: 'Kein Unterricht',
    gradeAvg: 'Notenschnitt',
    subjectOne: '{n} Fach',
    subjectMany: '{n} Fächer',
    lessonsToday: 'Stunden heute',
    activeCount: '{n} aktiv',
    messages: 'Nachrichten',
    unreadCount: '{n} ungelesen',
    allRead: 'Alle gelesen',
    mensaToday: 'Mensa heute',
    noRatingYet: 'Noch keine Bewertung',
    todayWithDate: 'Heute · {date}',
    noLessonsToday: 'Kein Unterricht heute',
    exam: 'Prüfung',
    cancelled: 'Entfall',
    substitution: 'Vertretung',
    nextExam: 'Nächste Prüfung',
    recentGrades: 'Letzte Noten',
    grade: 'Note',
  },
  it: {
    yesterday: 'Ieri',
    today: 'Oggi',
    tomorrow: 'Domani',
    inDays: 'tra {n} giorni',
    all: 'Tutti',
    morning: 'Buongiorno',
    day: 'Buongiorno',
    evening: 'Buonasera',
    lessonsEnd: 'Fine lezioni',
    startAt: 'Inizio: {time}',
    noLessons: 'Nessuna lezione',
    gradeAvg: 'Media voti',
    subjectOne: '{n} materia',
    subjectMany: '{n} materie',
    lessonsToday: 'Ore oggi',
    activeCount: '{n} attive',
    messages: 'Messaggi',
    unreadCount: '{n} non letti',
    allRead: 'Tutti letti',
    mensaToday: 'Mensa oggi',
    noRatingYet: 'Ancora nessuna valutazione',
    todayWithDate: 'Oggi · {date}',
    noLessonsToday: 'Nessuna lezione oggi',
    exam: 'Verifica',
    cancelled: 'Annullata',
    substitution: 'Supplenza',
    nextExam: 'Prossima verifica',
    recentGrades: 'Ultimi voti',
    grade: 'Voto',
  },
  en: {
    yesterday: 'Yesterday',
    today: 'Today',
    tomorrow: 'Tomorrow',
    inDays: 'in {n} days',
    all: 'All',
    morning: 'Good morning',
    day: 'Good afternoon',
    evening: 'Good evening',
    lessonsEnd: 'Classes end',
    startAt: 'Start: {time}',
    noLessons: 'No classes',
    gradeAvg: 'Grade average',
    subjectOne: '{n} subject',
    subjectMany: '{n} subjects',
    lessonsToday: 'Lessons today',
    activeCount: '{n} active',
    messages: 'Messages',
    unreadCount: '{n} unread',
    allRead: 'All read',
    mensaToday: 'Cafeteria today',
    noRatingYet: 'No ratings yet',
    todayWithDate: 'Today · {date}',
    noLessonsToday: 'No classes today',
    exam: 'Exam',
    cancelled: 'Cancelled',
    substitution: 'Substitute',
    nextExam: 'Next exam',
    recentGrades: 'Recent grades',
    grade: 'Grade',
  },
  lld: {
    yesterday: "Ier",
    today: "Ncuei",
    tomorrow: "Doman",
    inDays: "danter {n} dis",
    all: "Duc",
    morning: "Bon di",
    day: "Bon di",
    evening: "Bona sëira",
    lessonsEnd: "Fin dla lezions",
    startAt: "Scumenciamënt: {time}",
    noLessons: "Deguna lezion",
    gradeAvg: "Media dla notes",
    subjectOne: "{n} materia",
    subjectMany: "{n} materies",
    lessonsToday: "Ëures ncuei",
    activeCount: "{n} atives",
    messages: "Nutizies",
    unreadCount: "{n} nia liedes",
    allRead: "Dutes liedes",
    mensaToday: "Mensa ncuei",
    noRatingYet: "Mo deguna valutazion",
    todayWithDate: "Ncuei · {date}",
    noLessonsToday: "Deguna lezion ncuei",
    exam: "Verifica",
    cancelled: "Suspendù",
    substitution: "Suplenza",
    nextExam: "Verifica che vën",
    recentGrades: "Ultimes notes",
    grade: "Nota",
  },
};
