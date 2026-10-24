import type { Dictionary } from '../dictionary';

export type AbsencesKey =
  // Page
  | 'title'
  | 'exact'
  | 'rounded'
  | 'totalMissed'
  | 'excused'
  | 'unexcused'
  | 'rate'
  | 'emptyTitle'
  | 'emptySubtitle'
  | 'statusExcused'
  | 'statusOpen'
  | 'reason'
  | 'text'
  | 'viewInTimetable'
  | 'report'
  | 'ofLessons'
  | 'perMonth'
  | 'perSubject'
  | 'perSubjectHint'
  | 'subjectLessons'
  | 'subjectUnexcused'
  // ReportAbsenceSheet
  | 'choose'
  | 'errChooseRange'
  | 'errEndAfterStart'
  | 'errChooseReason'
  | 'errSave'
  | 'confirm'
  | 'student'
  | 'me'
  | 'start'
  | 'end'
  | 'fromTimetable'
  | 'unavailable'
  | 'textOptional'
  | 'textPlaceholder'
  | 'reasonsLoadFailed'
  | 'reported'
  // ReasonPicker
  | 'reasonTitle'
  | 'searchReason'
  | 'noReasons'
  // TimetableLessonPicker
  | 'lesson'
  | 'noLessons'
  | 'cancelledSuffix'
  | 'takeLessons'
  | 'takeLesson'
  | 'chooseLessons'
  | 'prevDay'
  | 'nextDay'
  | 'apply'
  | 'chooseStart'
  | 'chooseEnd'
  | 'chooseReason'
  | 'forLabel';

export const absencesDict: Dictionary<AbsencesKey> = {
  de: {
    title: 'Abwesenheiten',
    exact: 'Exakt',
    rounded: 'Gerundet',
    totalMissed: 'Fehlstunden gesamt',
    excused: 'Entschuldigt',
    unexcused: 'Unentschuldigt',
    rate: 'Fehlquote',
    emptyTitle: 'Keine Fehlstunden',
    emptySubtitle: 'Du hast keine Fehlstunden.',
    statusExcused: 'entschuldigt',
    statusOpen: 'offen',
    reason: 'Grund',
    text: 'Text',
    viewInTimetable: 'Im Stundenplan ansehen',
    report: 'Abwesenheit melden',
    ofLessons: '{missed} von {total} Unterricht',
    perMonth: 'Pro Monat',
    perSubject: 'Pro Fach',
    perSubjectHint: 'So zählt deine Schule in WebUntis.',
    subjectLessons: '{n} Std.',
    subjectUnexcused: 'davon {time} offen',
    choose: 'Wählen',
    errChooseRange: 'Bitte Start und Ende wählen.',
    errEndAfterStart: 'Ende muss nach dem Start liegen.',
    errChooseReason: 'Bitte einen Abwesenheitsgrund wählen.',
    errSave: 'Die Abwesenheit konnte nicht gespeichert werden. Bitte versuche es später erneut.',
    confirm: 'Bestätigen',
    student: 'Schüler/in',
    me: 'Ich',
    start: 'Start',
    end: 'Ende',
    fromTimetable: 'Aus Stundenplan wählen',
    unavailable: 'Nicht verfügbar',
    textOptional: 'Text (optional)',
    textPlaceholder: 'Text hier eingeben',
    reasonsLoadFailed: 'Abwesenheitsgründe konnten gerade nicht geladen werden. Bitte versuche es später erneut.',
    reported: 'Abwesenheit gemeldet.',
    reasonTitle: 'Abwesenheitsgrund',
    searchReason: 'Grund suchen…',
    noReasons: 'Keine Gründe gefunden.',
    lesson: 'Stunde',
    noLessons: 'Keine Stunden an diesem Tag.',
    cancelledSuffix: ' (entfällt)',
    takeLessons: '{n} Stunden übernehmen',
    takeLesson: '1 Stunde übernehmen',
    chooseLessons: 'Stunden auswählen',
    prevDay: 'Vorheriger Tag',
    nextDay: 'Nächster Tag',
    apply: 'Übernehmen',
    chooseStart: 'Start wählen',
    chooseEnd: 'Ende wählen',
    chooseReason: 'Grund wählen',
    forLabel: 'Für',
  },
  it: {
    title: 'Assenze',
    exact: 'Esatto',
    rounded: 'Arrotondato',
    totalMissed: 'Ore di assenza totali',
    excused: 'Giustificate',
    unexcused: 'Non giustificate',
    rate: 'Tasso di assenza',
    emptyTitle: 'Nessuna assenza',
    emptySubtitle: 'Non hai ore di assenza.',
    statusExcused: 'giustificata',
    statusOpen: 'aperta',
    reason: 'Motivo',
    text: 'Testo',
    viewInTimetable: 'Vedi nell’orario',
    report: 'Segnala assenza',
    ofLessons: '{missed} su {total} di lezione',
    perMonth: 'Per mese',
    perSubject: 'Per materia',
    perSubjectHint: 'Come conta la tua scuola in WebUntis.',
    subjectLessons: '{n} ore',
    subjectUnexcused: 'di cui {time} da giustificare',
    choose: 'Scegli',
    errChooseRange: 'Scegli inizio e fine.',
    errEndAfterStart: 'La fine deve essere dopo l’inizio.',
    errChooseReason: 'Scegli un motivo dell’assenza.',
    errSave: 'Impossibile salvare l’assenza. Riprova più tardi.',
    confirm: 'Conferma',
    student: 'Studente/ssa',
    me: 'Io',
    start: 'Inizio',
    end: 'Fine',
    fromTimetable: 'Scegli dall’orario',
    unavailable: 'Non disponibile',
    textOptional: 'Testo (facoltativo)',
    textPlaceholder: 'Inserisci il testo qui',
    reasonsLoadFailed: 'Al momento non è stato possibile caricare i motivi di assenza. Riprova più tardi.',
    reported: 'Assenza segnalata.',
    reasonTitle: 'Motivo dell’assenza',
    searchReason: 'Cerca motivo…',
    noReasons: 'Nessun motivo trovato.',
    lesson: 'Ora',
    noLessons: 'Nessuna lezione in questo giorno.',
    cancelledSuffix: ' (annullata)',
    takeLessons: 'Usa {n} ore',
    takeLesson: 'Usa 1 ora',
    chooseLessons: 'Seleziona le ore',
    prevDay: 'Giorno precedente',
    nextDay: 'Giorno successivo',
    apply: 'Applica',
    chooseStart: 'Scegli l’inizio',
    chooseEnd: 'Scegli la fine',
    chooseReason: 'Scegli il motivo',
    forLabel: 'Per',
  },
  en: {
    title: 'Absences',
    exact: 'Exact',
    rounded: 'Rounded',
    totalMissed: 'Total missed hours',
    excused: 'Excused',
    unexcused: 'Unexcused',
    rate: 'Absence rate',
    emptyTitle: 'No absences',
    emptySubtitle: 'You don’t have any missed hours.',
    statusExcused: 'excused',
    statusOpen: 'open',
    reason: 'Reason',
    text: 'Note',
    viewInTimetable: 'View in timetable',
    report: 'Report absence',
    ofLessons: '{missed} of {total} of lessons',
    perMonth: 'Per month',
    perSubject: 'Per subject',
    perSubjectHint: 'As your school counts it in WebUntis.',
    subjectLessons: '{n} lessons',
    subjectUnexcused: '{time} not excused',
    choose: 'Choose',
    errChooseRange: 'Please choose a start and an end.',
    errEndAfterStart: 'The end must be after the start.',
    errChooseReason: 'Please choose a reason for the absence.',
    errSave: 'The absence couldn’t be saved. Please try again later.',
    confirm: 'Confirm',
    student: 'Student',
    me: 'Me',
    start: 'Start',
    end: 'End',
    fromTimetable: 'Pick from timetable',
    unavailable: 'Not available',
    textOptional: 'Note (optional)',
    textPlaceholder: 'Enter text here',
    reasonsLoadFailed: 'Absence reasons couldn’t be loaded right now. Please try again later.',
    reported: 'Absence reported.',
    reasonTitle: 'Reason for absence',
    searchReason: 'Search reason…',
    noReasons: 'No reasons found.',
    lesson: 'Lesson',
    noLessons: 'No lessons on this day.',
    cancelledSuffix: ' (cancelled)',
    takeLessons: 'Use {n} lessons',
    takeLesson: 'Use 1 lesson',
    chooseLessons: 'Select lessons',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    apply: 'Apply',
    chooseStart: 'Choose the start',
    chooseEnd: 'Choose the end',
    chooseReason: 'Choose a reason',
    forLabel: 'For',
  },
  lld: {
    title: "Assënzes",
    exact: "Esat",
    rounded: "Arundà",
    totalMissed: "Ëures de assënza dutes adum",
    excused: "Giustificades",
    unexcused: "Nia giustificades",
    rate: "Cuota de assënza",
    perSubject: "Per materia",
    perSubjectHint: "Coche tia scola conta te WebUntis.",
    subjectLessons: "{n} ëures",
    subjectUnexcused: "de chëstes {time} nia giustificà",
    emptyTitle: "Deguna assënza",
    emptySubtitle: "Tu ne n’ies nia stat assënt.",
    statusExcused: "giustificà",
    statusOpen: "daviert",
    reason: "Rejon",
    text: "Test",
    viewInTimetable: "Cialé tl urar",
    report: "Anunzië n’assënza",
    choose: "Cerni",
    errChooseRange: "Cerni l scumenciamënt y la fin.",
    errEndAfterStart: "La fin muessa vester do l scumenciamënt.",
    errChooseReason: "Cerni na rejon dl’assënza.",
    errSave: "L’assënza ne n’à nia pudù vester salveda. Prova plu tert mo n iede.",
    confirm: "Cunfermé",
    student: "Sculer/a",
    me: "Ie",
    start: "Scumenciamënt",
    end: "Fin",
    fromTimetable: "Cerni dal urar",
    unavailable: "Nia a dispuzion",
    textOptional: "Test (facoltatif)",
    textPlaceholder: "Scrij chilò l test",
    reasonsLoadFailed: "La rejons dl’assënza ne n’à nia pudù vester ciariedes. Prova plu tert mo n iede.",
    reported: "Assënza anunziëda.",
    reasonTitle: "Rejon dl’assënza",
    searchReason: "Crì la rejon…",
    noReasons: "Deguna rejon giapeda.",
    lesson: "Ëura",
    noLessons: "Deguna lezion te chësc di.",
    cancelledSuffix: " (suspendù)",
    takeLessons: "Tò sëura {n} ëures",
    takeLesson: "Tò sëura 1 ëura",
    chooseLessons: "Cerni la ëures",
  },
};
