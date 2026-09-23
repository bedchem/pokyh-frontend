import type { Dictionary } from '../dictionary';

export type TimetableKey =
  | 'offlineUnknown'
  | 'unknownError'
  | 'icsWeekFile'
  | 'icsWeekName'
  | 'icsExamsFile'
  | 'icsExamsName'
  | 'icsTeacher'
  | 'lesson'
  | 'prevWeek'
  | 'nextWeek'
  | 'toToday'
  | 'thisWeek'
  | 'cw'
  | 'schoolYear'
  | 'asOf'
  | 'today'
  | 'hoursUnit'
  | 'cancellations'
  | 'exams'
  | 'substitutions'
  | 'export'
  | 'exportWeek'
  | 'exportExams'
  | 'unknownTitle'
  | 'loadingGrid'
  // tags / special days
  | 'cancelled'
  | 'exam'
  | 'substitution'
  | 'event'
  | 'holiday'
  | 'noLessons'
  | 'weekend'
  | 'free'
  | 'allCancelled'
  | 'allReplaced'
  | 'allDay'
  // detail sheet
  | 'note'
  | 'lessonText'
  | 'substitutionText'
  | 'examContent'
  | 'homework'
  | 'absent'
  | 'period'
  | 'reason'
  | 'teacher'
  | 'room'
  | 'instead'
  | 'insteadOf'
  | 'wholeDay'
  // absence marks
  | 'markPreExcused'
  | 'markExcused'
  | 'markAbsent'
  | 'markPreExcusedShort'
  | 'markExcusedShort'
  | 'markAbsentShort';

export const timetableDict: Dictionary<TimetableKey> = {
  de: {
    offlineUnknown: 'Du bist offline und für diese Woche ist kein Stundenplan gespeichert. Ob Unterricht ist, lässt sich erst sagen, wenn du wieder Internet hast.',
    unknownError: 'Unbekannter Fehler.',
    icsWeekFile: 'pokyh_stundenplan.ics',
    icsWeekName: 'POKYH Stundenplan',
    icsExamsFile: 'pokyh_pruefungen.ics',
    icsExamsName: 'POKYH Prüfungen',
    icsTeacher: 'Lehrer',
    lesson: 'Stunde',
    prevWeek: 'Vorherige Woche',
    nextWeek: 'Nächste Woche',
    toToday: 'Zu heute',
    thisWeek: 'Diese Woche',
    cw: 'KW',
    schoolYear: 'Schuljahr',
    asOf: 'Stand {time}',
    today: 'Heute',
    hoursUnit: 'Std',
    cancellations: 'Entfälle',
    exams: 'Prüfungen',
    substitutions: 'Vertretungen',
    export: 'Exportieren',
    exportWeek: 'Diese Woche exportieren',
    exportExams: 'Prüfungen exportieren',
    unknownTitle: 'Stundenplan unbekannt',
    loadingGrid: 'Stundenplan wird geladen',
    cancelled: 'Entfall',
    exam: 'Prüfung',
    substitution: 'Vertretung',
    event: 'Veranstaltung',
    holiday: 'Ferien',
    noLessons: 'Kein Unterricht',
    weekend: 'Wochenende',
    free: 'Frei',
    allCancelled: 'Alle Stunden ausgefallen',
    allReplaced: 'Tag durchgehend ersetzt',
    allDay: 'Ganztägig',
    note: 'Notiz',
    lessonText: 'Stundentext',
    substitutionText: 'Vertretungstext',
    examContent: 'Prüfungsinhalt',
    homework: 'Hausaufgaben',
    absent: 'Abwesend',
    period: 'Zeitraum',
    reason: 'Grund',
    teacher: 'Lehrer',
    room: 'Raum',
    instead: 'Stattdessen',
    insteadOf: 'Statt',
    wholeDay: 'Ganzer Tag',
    markPreExcused: 'Vorentschuldigung',
    markExcused: 'Entschuldigt',
    markAbsent: 'Unentschuldigt',
    markPreExcusedShort: 'Vorentsch.',
    markExcusedShort: 'Entsch.',
    markAbsentShort: 'Unentsch.',
  },
  it: {
    offlineUnknown: 'Sei offline e per questa settimana non è salvato nessun orario. Se ci sono lezioni si potrà sapere solo quando avrai di nuovo Internet.',
    unknownError: 'Errore sconosciuto.',
    icsWeekFile: 'pokyh_orario.ics',
    icsWeekName: 'POKYH Orario',
    icsExamsFile: 'pokyh_verifiche.ics',
    icsExamsName: 'POKYH Verifiche',
    icsTeacher: 'Docente',
    lesson: 'Ora',
    prevWeek: 'Settimana precedente',
    nextWeek: 'Settimana successiva',
    toToday: 'Vai a oggi',
    thisWeek: 'Questa settimana',
    cw: 'Sett.',
    schoolYear: 'Anno scolastico',
    asOf: 'Aggiornato {time}',
    today: 'Oggi',
    hoursUnit: 'ore',
    cancellations: 'Annullate',
    exams: 'Verifiche',
    substitutions: 'Supplenze',
    export: 'Esporta',
    exportWeek: 'Esporta questa settimana',
    exportExams: 'Esporta verifiche',
    unknownTitle: 'Orario sconosciuto',
    loadingGrid: 'Caricamento orario',
    cancelled: 'Annullata',
    exam: 'Verifica',
    substitution: 'Supplenza',
    event: 'Evento',
    holiday: 'Vacanze',
    noLessons: 'Nessuna lezione',
    weekend: 'Fine settimana',
    free: 'Libero',
    allCancelled: 'Tutte le ore annullate',
    allReplaced: 'Giornata interamente sostituita',
    allDay: 'Tutto il giorno',
    note: 'Nota',
    lessonText: 'Testo della lezione',
    substitutionText: 'Testo della supplenza',
    examContent: 'Contenuto della verifica',
    homework: 'Compiti',
    absent: 'Assente',
    period: 'Periodo',
    reason: 'Motivo',
    teacher: 'Docente',
    room: 'Aula',
    instead: 'Al suo posto',
    insteadOf: 'Al posto di',
    wholeDay: 'Tutto il giorno',
    markPreExcused: 'Giustificazione anticipata',
    markExcused: 'Giustificata',
    markAbsent: 'Non giustificata',
    markPreExcusedShort: 'Giust. ant.',
    markExcusedShort: 'Giust.',
    markAbsentShort: 'Non giust.',
  },
  en: {
    offlineUnknown: 'You’re offline and no timetable is saved for this week. Whether there are classes can only be known once you’re back online.',
    unknownError: 'Unknown error.',
    icsWeekFile: 'pokyh_timetable.ics',
    icsWeekName: 'POKYH Timetable',
    icsExamsFile: 'pokyh_exams.ics',
    icsExamsName: 'POKYH Exams',
    icsTeacher: 'Teacher',
    lesson: 'Lesson',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    toToday: 'Go to today',
    thisWeek: 'This week',
    cw: 'Wk',
    schoolYear: 'School year',
    asOf: 'As of {time}',
    today: 'Today',
    hoursUnit: 'h',
    cancellations: 'Cancelled',
    exams: 'Exams',
    substitutions: 'Substitutes',
    export: 'Export',
    exportWeek: 'Export this week',
    exportExams: 'Export exams',
    unknownTitle: 'Timetable unknown',
    loadingGrid: 'Loading timetable',
    cancelled: 'Cancelled',
    exam: 'Exam',
    substitution: 'Substitute',
    event: 'Event',
    holiday: 'Holidays',
    noLessons: 'No classes',
    weekend: 'Weekend',
    free: 'Free',
    allCancelled: 'All lessons cancelled',
    allReplaced: 'Whole day replaced',
    allDay: 'All day',
    note: 'Note',
    lessonText: 'Lesson text',
    substitutionText: 'Substitution text',
    examContent: 'Exam content',
    homework: 'Homework',
    absent: 'Absent',
    period: 'Period',
    reason: 'Reason',
    teacher: 'Teacher',
    room: 'Room',
    instead: 'Instead',
    insteadOf: 'Instead of',
    wholeDay: 'All day',
    markPreExcused: 'Excused in advance',
    markExcused: 'Excused',
    markAbsent: 'Unexcused',
    markPreExcusedShort: 'Pre-exc.',
    markExcusedShort: 'Exc.',
    markAbsentShort: 'Unexc.',
  },
  lld: {
    offlineUnknown: "Tu ies offline y per chësta ena ne n’ie degun urar salvà. Sce l ie lezion se lascia dì mé canche tu es inò Internet.",
    unknownError: "Fal nia cunesciù.",
    icsWeekFile: "pokyh_urar.ics",
    icsWeekName: "POKYH Urar",
    icsExamsFile: "pokyh_verifiches.ics",
    icsExamsName: "POKYH Verifiches",
    icsTeacher: "Nseniant",
    lesson: "Ëura",
    prevWeek: "Ena dant",
    nextWeek: "Ena do",
    toToday: "A ncuei",
    thisWeek: "Chësta ena",
    cw: "Ena",
    schoolYear: "Ann de scola",
    asOf: "Stat {time}",
    today: "Ncuei",
    hoursUnit: "ëures",
    cancellations: "Suspendudes",
    exams: "Verifiches",
    substitutions: "Suplenzes",
    export: "Esporté",
    exportWeek: "Esporté chësta ena",
    exportExams: "Esporté la verifiches",
    unknownTitle: "Urar nia cunesciù",
    loadingGrid: "L urar se cëria",
    cancelled: "Suspendù",
    exam: "Verifica",
    substitution: "Suplenza",
    event: "Manifestazion",
    holiday: "Vacanzes",
    noLessons: "Deguna lezion",
    weekend: "Fin dl’ena",
    free: "Liede",
    allCancelled: "Duta la ëures suspendudes",
    allReplaced: "Di dut suplì",
    allDay: "Dut l di",
    note: "Nota",
    lessonText: "Test dla lezion",
    substitutionText: "Test dla suplenza",
    examContent: "Cuntenut dla verifica",
    homework: "Lëures da cësa",
    absent: "Assënt",
    period: "Tëmp",
    reason: "Rejon",
    teacher: "Nseniant",
    room: "Aula",
    instead: "Al post",
    insteadOf: "Al post de",
    wholeDay: "Dut l di",
    markPreExcused: "Giustificazion dant",
    markExcused: "Giustificà",
    markAbsent: "Nia giustificà",
    markPreExcusedShort: "Giust. dant",
    markExcusedShort: "Giust.",
    markAbsentShort: "Nia giust.",
  },
};
