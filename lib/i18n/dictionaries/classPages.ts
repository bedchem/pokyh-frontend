import type { Dictionary } from '../dictionary';

/** "Klasse" dashboard and the "Klassenbuch" (class register) page. */
export type ClassPagesKey =
  // Class dashboard
  | 'classTitle'
  | 'myClass'
  | 'schoolYear'
  | 'newEntries'
  | 'noEntries3m'
  | 'openAbsences'
  | 'noOpenAbsences'
  | 'open'
  | 'more'
  | 'classServices'
  | 'noClassServices'
  | 'exams'
  | 'thisWeek'
  | 'nextWeek'
  | 'noExamsThisWeek'
  | 'noExamsNextWeek'
  | 'exam'
  | 'homework'
  | 'noHwThisWeek'
  | 'noHwNextWeek'
  | 'dueOn'
  // Class register
  | 'sortDateDesc'
  | 'sortDateAsc'
  | 'sortSubject'
  | 'sortCategory'
  | 'filterAll'
  | 'filter1m'
  | 'filter3m'
  | 'summary'
  | 'asOf'
  | 'emptyTitle'
  | 'emptySubtitle'
  | 'totalEntries'
  | 'wholeYear'
  | 'subjects'
  | 'affectedSubjects'
  | 'lastEntry'
  | 'newestEntry'
  | 'topCategory'
  | 'byCount'
  | 'entries'
  | 'noEntriesRange';

export const classPagesDict: Dictionary<ClassPagesKey> = {
  de: {
    classTitle: 'Klasse {name}',
    myClass: 'Meine Klasse',
    schoolYear: 'Schuljahr {year}',
    newEntries: 'Neue Klassenbuch Einträge · Letzte 3 Monate',
    noEntries3m: 'Keine Einträge in den letzten 3 Monaten',
    openAbsences: 'Offene Abwesenheiten',
    noOpenAbsences: 'Keine offenen Abwesenheiten',
    open: 'Offen',
    more: '+{n} weitere',
    classServices: 'Klassendienste',
    noClassServices: 'Keine Klassendienste eingetragen',
    exams: 'Prüfungen',
    thisWeek: 'Diese Woche',
    nextWeek: 'Nächste Woche',
    noExamsThisWeek: 'Keine Prüfungen diese Woche',
    noExamsNextWeek: 'Keine Prüfungen nächste Woche',
    exam: 'Prüfung',
    homework: 'Hausaufgaben',
    noHwThisWeek: 'Keine Hausaufgaben diese Woche',
    noHwNextWeek: 'Keine Hausaufgaben nächste Woche',
    dueOn: 'Fällig: {date}',
    sortDateDesc: 'Datum ↓',
    sortDateAsc: 'Datum ↑',
    sortSubject: 'Fach',
    sortCategory: 'Kategorie',
    filterAll: 'Alle',
    filter1m: 'Letzter Monat',
    filter3m: 'Letzte 3 Monate',
    summary: '{entries} Einträge · {subjects} Fächer',
    asOf: ' · Stand {date}',
    emptyTitle: 'Keine Einträge',
    emptySubtitle: 'Für dieses Schuljahr wurden keine Klassenbucheinträge gefunden.',
    totalEntries: 'Total Einträge',
    wholeYear: 'Schuljahr gesamt',
    subjects: 'Fächer',
    affectedSubjects: 'Betroffene Fächer',
    lastEntry: 'Letzte Eintragung',
    newestEntry: 'Neuester Eintrag',
    topCategory: 'Häufigste Kategorie',
    byCount: 'Nach Anzahl',
    entries: 'Einträge',
    noEntriesRange: 'Keine Einträge im gewählten Zeitraum',
  },
  it: {
    classTitle: 'Classe {name}',
    myClass: 'La mia classe',
    schoolYear: 'Anno scolastico {year}',
    newEntries: 'Nuove annotazioni nel registro · Ultimi 3 mesi',
    noEntries3m: 'Nessuna annotazione negli ultimi 3 mesi',
    openAbsences: 'Assenze aperte',
    noOpenAbsences: 'Nessuna assenza aperta',
    open: 'Aperta',
    more: '+{n} altre',
    classServices: 'Incarichi di classe',
    noClassServices: 'Nessun incarico di classe registrato',
    exams: 'Verifiche',
    thisWeek: 'Questa settimana',
    nextWeek: 'Prossima settimana',
    noExamsThisWeek: 'Nessuna verifica questa settimana',
    noExamsNextWeek: 'Nessuna verifica la prossima settimana',
    exam: 'Verifica',
    homework: 'Compiti',
    noHwThisWeek: 'Nessun compito questa settimana',
    noHwNextWeek: 'Nessun compito la prossima settimana',
    dueOn: 'Scadenza: {date}',
    sortDateDesc: 'Data ↓',
    sortDateAsc: 'Data ↑',
    sortSubject: 'Materia',
    sortCategory: 'Categoria',
    filterAll: 'Tutte',
    filter1m: 'Ultimo mese',
    filter3m: 'Ultimi 3 mesi',
    summary: '{entries} annotazioni · {subjects} materie',
    asOf: ' · Aggiornato al {date}',
    emptyTitle: 'Nessuna annotazione',
    emptySubtitle: 'Per questo anno scolastico non sono state trovate annotazioni nel registro.',
    totalEntries: 'Annotazioni totali',
    wholeYear: 'Intero anno scolastico',
    subjects: 'Materie',
    affectedSubjects: 'Materie interessate',
    lastEntry: 'Ultima annotazione',
    newestEntry: 'Annotazione più recente',
    topCategory: 'Categoria più frequente',
    byCount: 'Per numero',
    entries: 'Annotazioni',
    noEntriesRange: 'Nessuna annotazione nel periodo scelto',
  },
  en: {
    classTitle: 'Class {name}',
    myClass: 'My class',
    schoolYear: 'School year {year}',
    newEntries: 'New class register entries · Last 3 months',
    noEntries3m: 'No entries in the last 3 months',
    openAbsences: 'Open absences',
    noOpenAbsences: 'No open absences',
    open: 'Open',
    more: '+{n} more',
    classServices: 'Class duties',
    noClassServices: 'No class duties assigned',
    exams: 'Exams',
    thisWeek: 'This week',
    nextWeek: 'Next week',
    noExamsThisWeek: 'No exams this week',
    noExamsNextWeek: 'No exams next week',
    exam: 'Exam',
    homework: 'Homework',
    noHwThisWeek: 'No homework this week',
    noHwNextWeek: 'No homework next week',
    dueOn: 'Due: {date}',
    sortDateDesc: 'Date ↓',
    sortDateAsc: 'Date ↑',
    sortSubject: 'Subject',
    sortCategory: 'Category',
    filterAll: 'All',
    filter1m: 'Last month',
    filter3m: 'Last 3 months',
    summary: '{entries} entries · {subjects} subjects',
    asOf: ' · As of {date}',
    emptyTitle: 'No entries',
    emptySubtitle: 'No class register entries were found for this school year.',
    totalEntries: 'Total entries',
    wholeYear: 'Whole school year',
    subjects: 'Subjects',
    affectedSubjects: 'Subjects affected',
    lastEntry: 'Latest entry',
    newestEntry: 'Most recent entry',
    topCategory: 'Most common category',
    byCount: 'By count',
    entries: 'Entries',
    noEntriesRange: 'No entries in the selected period',
  },
  lld: {
    classTitle: "Tlas {name}",
    myClass: "Mia tlas",
    schoolYear: "Ann de scola {year}",
    newEntries: "Nueves scritures tl register de tlas · Ultimi 3 mëisc",
    noEntries3m: "Deguna scritura ti ultimi 3 mëisc",
    openAbsences: "Assënzes davertes",
    noOpenAbsences: "Deguna assënza daverta",
    open: "Daviert",
    more: "+{n} d’autres",
    classServices: "Servijes dla tlas",
    noClassServices: "Deguni servijes dla tlas registrei",
    exams: "Verifiches",
    thisWeek: "Chësta ena",
    nextWeek: "Ena che vën",
    noExamsThisWeek: "Deguna verifica chësta ena",
    noExamsNextWeek: "Deguna verifica l’ena che vën",
    exam: "Verifica",
    homework: "Lëures da cësa",
    noHwThisWeek: "Deguni lëures da cësa chësta ena",
    noHwNextWeek: "Deguni lëures da cësa l’ena che vën",
    dueOn: "Scadënza: {date}",
    sortDateDesc: "Data ↓",
    sortDateAsc: "Data ↑",
    sortSubject: "Materia",
    sortCategory: "Categoria",
    filterAll: "Dutes",
    filter1m: "Ultim mëns",
    filter3m: "Ultimi 3 mëisc",
    summary: "{entries} scritures · {subjects} materies",
    asOf: " · Stat {date}",
    emptyTitle: "Deguna scritura",
    emptySubtitle: "Per chësc ann de scola ne n’ie nia unides giapedes scritures tl register de tlas.",
    totalEntries: "Scritures dutes adum",
    wholeYear: "Dut l ann de scola",
    subjects: "Materies",
    affectedSubjects: "Materies tuchedes",
    lastEntry: "Ultima scritura",
    newestEntry: "Scritura plu nueva",
    topCategory: "Categoria plu frecuënta",
    byCount: "Aldò dl numer",
    entries: "Scritures",
    noEntriesRange: "Deguna scritura tl tëmp cernù",
  },
};
