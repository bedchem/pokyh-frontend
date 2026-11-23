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
  | 'rateCounting'
  | 'ofLessonsYear'
  | 'spanLabel'
  | 'spanSoFar'
  | 'spanYear'
  | 'rateMissing'
  | 'rateRetry'
  | 'perMonth'
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
  | 'errPast'
  | 'checkTitle'
  | 'checkLead'
  | 'sendNow'
  | 'edit'
  // ReasonPicker
  | 'reasonTitle'
  | 'searchReason'
  | 'noReasons'
  // TimetableLessonPicker
  | 'lesson'
  | 'noLessons'
  | 'cancelledSuffix'
  | 'overSuffix'
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
    ofLessons: '{missed} von {total} Unterricht bisher',
    ofLessonsYear: '{missed} von {total} Unterricht im ganzen Schuljahr',
    spanLabel: 'Zeitraum',
    spanSoFar: 'Bisher',
    spanYear: 'Ganzes Jahr',
    rateCounting: 'Wird aus dem Stundenplan berechnet …',
    rateMissing: 'Noch nicht alle Wochen des Stundenplans geladen.',
    rateRetry: 'Erneut laden',
    perMonth: 'Pro Monat',
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
    errPast: 'Dieser Zeitraum ist schon vorbei. Melden kannst du nur, was noch kommt.',
    checkTitle: 'Angaben prüfen',
    checkLead: 'Stimmt alles? So wird die Abwesenheit in WebUntis gemeldet.',
    sendNow: 'Jetzt melden',
    edit: 'Ändern',
    reasonTitle: 'Abwesenheitsgrund',
    searchReason: 'Grund suchen…',
    noReasons: 'Keine Gründe gefunden.',
    lesson: 'Unterricht',
    noLessons: 'Kein Unterricht an diesem Tag.',
    cancelledSuffix: ' (entfällt)',
    overSuffix: ' (vorbei)',
    takeLessons: '{n} Unterrichtsblöcke übernehmen',
    takeLesson: '1 Unterrichtsblock übernehmen',
    chooseLessons: 'Unterrichtsblöcke auswählen',
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
    ofLessons: '{missed} su {total} di lezione finora',
    ofLessonsYear: '{missed} su {total} di lezione in tutto l’anno scolastico',
    spanLabel: 'Periodo',
    spanSoFar: 'Finora',
    spanYear: 'Tutto l’anno',
    rateCounting: 'Calcolo dall’orario in corso …',
    rateMissing: 'Non tutte le settimane dell’orario sono state caricate.',
    rateRetry: 'Ricarica',
    perMonth: 'Per mese',
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
    errPast: 'Questo periodo è già passato. Puoi segnalare solo ciò che deve ancora venire.',
    checkTitle: 'Controlla i dati',
    checkLead: 'È tutto giusto? Così l’assenza viene segnalata in WebUntis.',
    sendNow: 'Segnala ora',
    edit: 'Modifica',
    reasonTitle: 'Motivo dell’assenza',
    searchReason: 'Cerca motivo…',
    noReasons: 'Nessun motivo trovato.',
    lesson: 'Lezione',
    noLessons: 'Nessuna lezione in questo giorno.',
    cancelledSuffix: ' (annullata)',
    overSuffix: ' (passata)',
    takeLessons: 'Usa {n} blocchi di lezione',
    takeLesson: 'Usa 1 blocco di lezione',
    chooseLessons: 'Seleziona i blocchi di lezione',
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
    ofLessons: '{missed} of {total} of lessons so far',
    ofLessonsYear: '{missed} of {total} of lessons in the whole school year',
    spanLabel: 'Period',
    spanSoFar: 'So far',
    spanYear: 'Whole year',
    rateCounting: 'Working it out from the timetable …',
    rateMissing: 'Not every week of the timetable has loaded yet.',
    rateRetry: 'Load again',
    perMonth: 'Per month',
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
    errPast: 'This period is already over. You can only report what is still to come.',
    checkTitle: 'Check the details',
    checkLead: 'All correct? This is how the absence is reported in WebUntis.',
    sendNow: 'Report now',
    edit: 'Edit',
    reasonTitle: 'Reason for absence',
    searchReason: 'Search reason…',
    noReasons: 'No reasons found.',
    lesson: 'Lesson',
    noLessons: 'No lessons on this day.',
    cancelledSuffix: ' (cancelled)',
    overSuffix: ' (over)',
    takeLessons: 'Use {n} lesson blocks',
    takeLesson: 'Use 1 lesson block',
    chooseLessons: 'Select lesson blocks',
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
    ofLessons: "{missed} de {total} de lezion nchin a sën",
    ofLessonsYear: "{missed} de {total} de lezion te dut l ann de scola",
    spanLabel: "Tëmp",
    spanSoFar: "Nchin a sën",
    spanYear: "Dut l ann",
    rateCounting: "Vën calculà dal orar …",
    rateMissing: "Nia dutes la edemes dl orar ne n’é mo ciariedes.",
    rateRetry: "Ciarië de nuef",
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
  },
};
