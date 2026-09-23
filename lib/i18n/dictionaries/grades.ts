import type { Dictionary } from '../dictionary';

export type GradesKey =
  // Overview
  | 'sortName'
  | 'sortBest'
  | 'sortWorst'
  | 'sortRecent'
  | 'schoolYear'
  | 'summary'
  | 'noGradesYear'
  | 'emptyTitle'
  | 'emptySubtitle'
  | 'avgTitle'
  | 'avgSub'
  | 'prevMonth'
  | 'bestGrade'
  | 'ratioTitle'
  | 'ratioSub'
  | 'above6'
  | 'below6'
  | 'distTitle'
  | 'distSub'
  | 'mode'
  | 'median'
  | 'recentTitle'
  | 'recentSub'
  | 'subjects'
  | 'collapseAll'
  | 'expandAll'
  | 'noMatches'
  | 'collapse'
  | 'expand'
  | 'gradeOne'
  | 'gradeMany'
  | 'noSingleGrades'
  | 'openDetails'
  | 'exam'
  // Subject detail
  | 'today'
  | 'yesterday'
  | 'daysAgo'
  | 'weeksAgo'
  | 'monthsAgo'
  | 'yearsAgo'
  | 'own'
  | 'ownGrade'
  | 'subjectNotFound'
  | 'subject'
  | 'average'
  | 'simulation'
  | 'teacherAvg'
  | 'best'
  | 'rising'
  | 'falling'
  | 'stable'
  | 'whatDoINeed'
  | 'targetCalc'
  | 'target'
  | 'targetGrade'
  | 'reached'
  | 'impossible'
  | 'hintEnter'
  | 'hintReached'
  | 'hintImpossible'
  | 'hintNext'
  | 'hintMany'
  | 'trend'
  | 'trendSub'
  | 'reset'
  | 'noGradesYet'
  | 'gradeList'
  | 'activeExcluded'
  | 'noGradesRecorded'
  | 'restoreGrade'
  | 'excludeGrade'
  | 'avgCalc'
  | 'avgCalcSub'
  | 'examplePlaceholder'
  | 'addGrade'
  | 'noOwnGrades'
  | 'removeOwnGrade'
  | 'quickTest'
  | 'lastGrade'
  | 'allSubjects';

export const gradesDict: Dictionary<GradesKey> = {
  de: {
    sortName: 'Name',
    sortBest: 'Bester ⌀',
    sortWorst: 'Schlechtester ⌀',
    sortRecent: 'Letzte Note',
    schoolYear: 'Schuljahr {year}',
    summary: 'Stand {date} · {subjects} Fächer · {grades} Noten erfasst',
    noGradesYear: 'Keine Noten für dieses Schuljahr',
    emptyTitle: 'Keine Noten',
    emptySubtitle: 'Für dieses Schuljahr wurden keine Noten gefunden.',
    avgTitle: 'Durchschnittsnote',
    avgSub: 'Alle Fächer · gewichtet',
    prevMonth: 'Vormonat',
    bestGrade: 'Beste Note',
    ratioTitle: 'Notenverhältnis',
    ratioSub: 'Genügend · Ungenügend',
    above6: 'über 6.0',
    below6: 'unter 6.0',
    distTitle: 'Notenverteilung',
    distSub: 'Häufigkeit pro Note',
    mode: 'Modus',
    median: 'Median',
    recentTitle: 'Kürzlich hinzugefügt',
    recentSub: 'Letzte 3 Einträge',
    subjects: 'Fächer',
    collapseAll: 'Einklappen',
    expandAll: 'Alle aufklappen',
    noMatches: 'Keine Treffer',
    collapse: '{name} einklappen',
    expand: '{name} aufklappen',
    gradeOne: '{n} Note',
    gradeMany: '{n} Noten',
    noSingleGrades: 'Keine Einzelnoten vorhanden.',
    openDetails: 'Details öffnen',
    exam: 'Prüfung',
    today: 'heute',
    yesterday: 'gestern',
    daysAgo: 'vor {n} Tagen',
    weeksAgo: 'vor {n} Wochen',
    monthsAgo: 'vor {n} Monaten',
    yearsAgo: 'vor {n} Jahren',
    own: 'Eigene',
    ownGrade: 'Eigene Note',
    subjectNotFound: 'Fach nicht gefunden',
    subject: 'Fach',
    average: 'Durchschnitt',
    simulation: 'Simulation',
    teacherAvg: 'Lehrer-Schnitt',
    best: 'Beste {grade}',
    rising: 'steigend',
    falling: 'fallend',
    stable: 'stabil',
    whatDoINeed: 'Was brauche ich?',
    targetCalc: 'Zielnote-Rechner',
    target: 'Ziel',
    targetGrade: 'Zielnote',
    reached: 'erreicht',
    impossible: 'unmöglich',
    hintEnter: 'Trage einen Zielschnitt ein',
    hintReached: 'Ziel ist mit dem aktuellen Schnitt schon erreicht',
    hintImpossible: 'Ziel ist mit weiteren Noten nicht mehr erreichbar',
    hintNext: 'Nächste Note für dein Ziel',
    hintMany: '{n}x {grade}, um den Schnitt zu erreichen',
    trend: 'Notentrend',
    trendSub: 'Verlauf vom Schuljahresbeginn bis heute',
    reset: 'Zurücksetzen',
    noGradesYet: 'Noch keine Noten',
    gradeList: 'Noten-Liste',
    activeExcluded: '{active} aktiv · {excluded} ausgeschlossen',
    noGradesRecorded: 'Keine Noten erfasst',
    restoreGrade: 'Note wiederherstellen',
    excludeGrade: 'Note ausschließen',
    avgCalc: 'Mittelwert-Rechner',
    avgCalcSub: 'Eigene Noten zum Spielen',
    examplePlaceholder: 'z.B. 7,5',
    addGrade: 'Note hinzufügen',
    noOwnGrades: 'Noch keine eigenen Noten',
    removeOwnGrade: 'Eigene Note entfernen',
    quickTest: 'Schnell-Test:',
    lastGrade: 'Letzte Note',
    allSubjects: 'Alle Fächer →',
  },
  it: {
    sortName: 'Nome',
    sortBest: 'Media migliore',
    sortWorst: 'Media peggiore',
    sortRecent: 'Ultimo voto',
    schoolYear: 'Anno scolastico {year}',
    summary: 'Aggiornato al {date} · {subjects} materie · {grades} voti registrati',
    noGradesYear: 'Nessun voto per questo anno scolastico',
    emptyTitle: 'Nessun voto',
    emptySubtitle: 'Per questo anno scolastico non sono stati trovati voti.',
    avgTitle: 'Media dei voti',
    avgSub: 'Tutte le materie · ponderata',
    prevMonth: 'Mese precedente',
    bestGrade: 'Voto migliore',
    ratioTitle: 'Rapporto voti',
    ratioSub: 'Sufficiente · Insufficiente',
    above6: 'sopra 6.0',
    below6: 'sotto 6.0',
    distTitle: 'Distribuzione voti',
    distSub: 'Frequenza per voto',
    mode: 'Moda',
    median: 'Mediana',
    recentTitle: 'Aggiunti di recente',
    recentSub: 'Ultimi 3 inserimenti',
    subjects: 'Materie',
    collapseAll: 'Comprimi',
    expandAll: 'Espandi tutto',
    noMatches: 'Nessun risultato',
    collapse: 'Comprimi {name}',
    expand: 'Espandi {name}',
    gradeOne: '{n} voto',
    gradeMany: '{n} voti',
    noSingleGrades: 'Nessun voto singolo disponibile.',
    openDetails: 'Apri dettagli',
    exam: 'Verifica',
    today: 'oggi',
    yesterday: 'ieri',
    daysAgo: '{n} giorni fa',
    weeksAgo: '{n} settimane fa',
    monthsAgo: '{n} mesi fa',
    yearsAgo: '{n} anni fa',
    own: 'Mio',
    ownGrade: 'Voto personale',
    subjectNotFound: 'Materia non trovata',
    subject: 'Materia',
    average: 'Media',
    simulation: 'Simulazione',
    teacherAvg: 'Media del docente',
    best: 'Migliore {grade}',
    rising: 'in crescita',
    falling: 'in calo',
    stable: 'stabile',
    whatDoINeed: 'Di cosa ho bisogno?',
    targetCalc: 'Calcolatore voto obiettivo',
    target: 'Obiettivo',
    targetGrade: 'Voto obiettivo',
    reached: 'raggiunto',
    impossible: 'impossibile',
    hintEnter: 'Inserisci una media obiettivo',
    hintReached: 'L’obiettivo è già raggiunto con la media attuale',
    hintImpossible: 'L’obiettivo non è più raggiungibile con altri voti',
    hintNext: 'Prossimo voto per il tuo obiettivo',
    hintMany: '{n}x {grade} per raggiungere la media',
    trend: 'Andamento dei voti',
    trendSub: 'Dall’inizio dell’anno scolastico a oggi',
    reset: 'Ripristina',
    noGradesYet: 'Ancora nessun voto',
    gradeList: 'Elenco voti',
    activeExcluded: '{active} attivi · {excluded} esclusi',
    noGradesRecorded: 'Nessun voto registrato',
    restoreGrade: 'Ripristina voto',
    excludeGrade: 'Escludi voto',
    avgCalc: 'Calcolatore media',
    avgCalcSub: 'Voti personali per simulare',
    examplePlaceholder: 'es. 7,5',
    addGrade: 'Aggiungi voto',
    noOwnGrades: 'Ancora nessun voto personale',
    removeOwnGrade: 'Rimuovi voto personale',
    quickTest: 'Test rapido:',
    lastGrade: 'Ultimo voto',
    allSubjects: 'Tutte le materie →',
  },
  en: {
    sortName: 'Name',
    sortBest: 'Best ⌀',
    sortWorst: 'Worst ⌀',
    sortRecent: 'Latest grade',
    schoolYear: 'School year {year}',
    summary: 'As of {date} · {subjects} subjects · {grades} grades recorded',
    noGradesYear: 'No grades for this school year',
    emptyTitle: 'No grades',
    emptySubtitle: 'No grades were found for this school year.',
    avgTitle: 'Grade average',
    avgSub: 'All subjects · weighted',
    prevMonth: 'Last month',
    bestGrade: 'Best grade',
    ratioTitle: 'Pass ratio',
    ratioSub: 'Pass · Fail',
    above6: 'above 6.0',
    below6: 'below 6.0',
    distTitle: 'Grade distribution',
    distSub: 'Frequency per grade',
    mode: 'Mode',
    median: 'Median',
    recentTitle: 'Recently added',
    recentSub: 'Last 3 entries',
    subjects: 'Subjects',
    collapseAll: 'Collapse',
    expandAll: 'Expand all',
    noMatches: 'No matches',
    collapse: 'Collapse {name}',
    expand: 'Expand {name}',
    gradeOne: '{n} grade',
    gradeMany: '{n} grades',
    noSingleGrades: 'No individual grades available.',
    openDetails: 'Open details',
    exam: 'Exam',
    today: 'today',
    yesterday: 'yesterday',
    daysAgo: '{n} days ago',
    weeksAgo: '{n} weeks ago',
    monthsAgo: '{n} months ago',
    yearsAgo: '{n} years ago',
    own: 'Own',
    ownGrade: 'Own grade',
    subjectNotFound: 'Subject not found',
    subject: 'Subject',
    average: 'Average',
    simulation: 'Simulation',
    teacherAvg: 'Teacher average',
    best: 'Best {grade}',
    rising: 'rising',
    falling: 'falling',
    stable: 'stable',
    whatDoINeed: 'What do I need?',
    targetCalc: 'Target grade calculator',
    target: 'Target',
    targetGrade: 'Target grade',
    reached: 'reached',
    impossible: 'impossible',
    hintEnter: 'Enter a target average',
    hintReached: 'The target is already reached with your current average',
    hintImpossible: 'The target can no longer be reached with more grades',
    hintNext: 'Next grade for your target',
    hintMany: '{n}x {grade} to reach the average',
    trend: 'Grade trend',
    trendSub: 'From the start of the school year until today',
    reset: 'Reset',
    noGradesYet: 'No grades yet',
    gradeList: 'Grade list',
    activeExcluded: '{active} active · {excluded} excluded',
    noGradesRecorded: 'No grades recorded',
    restoreGrade: 'Restore grade',
    excludeGrade: 'Exclude grade',
    avgCalc: 'Average calculator',
    avgCalcSub: 'Your own grades to play with',
    examplePlaceholder: 'e.g. 7.5',
    addGrade: 'Add grade',
    noOwnGrades: 'No own grades yet',
    removeOwnGrade: 'Remove own grade',
    quickTest: 'Quick test:',
    lastGrade: 'Latest grade',
    allSubjects: 'All subjects →',
  },
  lld: {
    sortName: "Inuem",
    sortBest: "Miëura ⌀",
    sortWorst: "Piesc ⌀",
    sortRecent: "Ultima nota",
    schoolYear: "Ann de scola {year}",
    summary: "Stat {date} · {subjects} materies · {grades} notes registredes",
    noGradesYear: "Deguna nota per chësc ann de scola",
    emptyTitle: "Deguna nota",
    emptySubtitle: "Per chësc ann de scola ne n’ie nia unides giapedes notes.",
    avgTitle: "Media dla notes",
    avgSub: "Duta la materies · ponderà",
    prevMonth: "Mëns dant",
    bestGrade: "Miëura nota",
    ratioTitle: "Rapurt dla notes",
    ratioSub: "Sufizient · Nia sufizient",
    above6: "sëura 6.0",
    below6: "sot 6.0",
    distTitle: "Spartizion dla notes",
    distSub: "Frecuënza per nota",
    mode: "Moda",
    median: "Mediana",
    recentTitle: "Juntedes da puech",
    recentSub: "Ultimes 3 notes",
    subjects: "Materies",
    collapseAll: "Ridujé",
    expandAll: "Giaurì dut",
    noMatches: "Nia giapà",
    collapse: "Ridujé {name}",
    expand: "Giaurì {name}",
    gradeOne: "{n} nota",
    gradeMany: "{n} notes",
    noSingleGrades: "Deguna nota singula.",
    openDetails: "Giaurì i detaies",
    exam: "Verifica",
    today: "ncuei",
    yesterday: "ier",
    daysAgo: "dant {n} dis",
    weeksAgo: "dant {n} enes",
    monthsAgo: "dant {n} mëisc",
    yearsAgo: "dant {n} ani",
    own: "Mia",
    ownGrade: "Mia nota",
    subjectNotFound: "Materia nia giapeda",
    subject: "Materia",
    average: "Media",
    simulation: "Simulazion",
    teacherAvg: "Media dl nseniant",
    best: "Miëura {grade}",
    rising: "va sù",
    falling: "va ju",
    stable: "stabl",
    whatDoINeed: "Ci me ëila de bujën?",
    targetCalc: "Calcul dla nota de destinazion",
    target: "Destinazion",
    targetGrade: "Nota de destinazion",
    reached: "arjont",
    impossible: "nia puscibl",
    hintEnter: "Scrij na media de destinazion",
    hintReached: "La destinazion ie bele arjonta cun la media de sën",
    hintImpossible: "La destinazion ne se lascia plu nia arjonjer cun d’autra notes",
    hintNext: "Nota che vën per tia destinazion",
    hintMany: "{n}x {grade} per arjonjer la media",
    trend: "Andamënt dla notes",
    trendSub: "Dal scumenciamënt dl ann de scola nchin ncuei",
    reset: "Mëter zeruch",
    noGradesYet: "Mo deguna nota",
    gradeList: "Lista dla notes",
    activeExcluded: "{active} atives · {excluded} lascedes ora",
    noGradesRecorded: "Deguna nota registreda",
    restoreGrade: "Mëter zeruch la nota",
    excludeGrade: "Lascé ora la nota",
    avgCalc: "Calcul dla media",
    avgCalcSub: "Mia notes per pruvé",
    examplePlaceholder: "p.ej. 7,5",
    addGrade: "Junté na nota",
    noOwnGrades: "Mo deguna nota mia",
    removeOwnGrade: "Tò demez mia nota",
    quickTest: "Test svelt:",
    lastGrade: "Ultima nota",
    allSubjects: "Duta la materies →",
  },
};
