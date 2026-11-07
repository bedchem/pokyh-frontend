import type { Dictionary } from '../dictionary';

/** Todos and class reminders. */
export type TasksKey =
  | 'dateTime'
  | 'titleRequired'
  | 'add'
  | 'loadFailed'
  | 'saveFailed'
  | 'you'
  // Todos
  | 'todosTitle'
  | 'todosLoadError'
  | 'todosEmptyTitle'
  | 'todosEmptySubtitle'
  | 'open'
  | 'done'
  | 'addTodo'
  | 'detailsOptional'
  | 'dueOptional'
  | 'todayAt'
  // Reminders
  | 'remindersTitle'
  | 'remindersLoadError'
  | 'due'
  | 'inDay'
  | 'inDays'
  | 'inHours'
  | 'soon'
  | 'classNotFound'
  | 'syncFailed'
  | 'loginAgain'
  | 'noClassParentTitle'
  | 'noClassParentDetail'
  | 'noClassRoleTitle'
  | 'noClassRoleDetail'
  | 'classPendingTitle'
  | 'classPendingDetail'
  | 'noClassInUntisTitle'
  | 'noClassInUntisDetail'
  | 'sharedRecordTitle'
  | 'sharedRecordDetail'
  | 'remindersEmptyTitle'
  | 'remindersEmptySubtitle'
  | 'overdueHeader'
  | 'upcomingHeader'
  | 'addReminder'
  | 'descriptionOptional'
  | 'chooseDateTime'
  | 'memberOne'
  | 'memberMany'
  | 'byUser'
  | 'deleteAsAdmin'
  | 'composePlaceholder'
  | 'moreDetails'
  | 'openTitle'
  | 'doneTitle'
  | 'overdue'
  | 'deleteItem'
  | 'markDone'
  | 'markOpen'
  | 'todosLead'
  | 'remindersLead'
  | 'newReminder'
  | 'comments'
  | 'whenLabel';

export const tasksDict: Dictionary<TasksKey> = {
  de: {
    dateTime: '{date} · {time} Uhr',
    titleRequired: 'Titel *',
    add: 'Hinzufügen',
    loadFailed: 'Fehler beim Laden',
    saveFailed: 'Fehler beim Speichern. Bitte erneut versuchen.',
    you: 'Du',
    todosTitle: 'To-dos',
    todosLoadError: 'Fehler beim Laden der Todos.',
    todosEmptyTitle: 'Keine Todos',
    todosEmptySubtitle: 'Füge deine ersten Aufgaben hinzu.',
    open: 'Offen ({n})',
    done: 'Erledigt ({n})',
    addTodo: 'Todo hinzufügen',
    detailsOptional: 'Details (optional)',
    dueOptional: 'Fälligkeitsdatum wählen (optional)',
    todayAt: 'Heute {time}',
    remindersTitle: 'Erinnerungen',
    remindersLoadError: 'Fehler beim Laden der Erinnerungen.',
    due: 'Fällig',
    inDay: 'in 1 Tag',
    inDays: 'in {n} Tagen',
    inHours: 'in {n} Std.',
    soon: 'Gleich',
    classNotFound: 'Klasse nicht gefunden',
    syncFailed: 'Synchronisierung fehlgeschlagen. Versuche es erneut oder melde dich neu an.',
    loginAgain: 'Neu anmelden',
    noClassParentTitle: "Elternkonten haben keine Klasse",
    noClassParentDetail: "Erinnerungen gehören zur Klasse. Elternkonten sind in keiner Klasse; deine eigenen Todos findest du unter „Todos“.",
    noClassRoleTitle: "Keine Klasse für dieses Konto",
    noClassRoleDetail: "Dieses Konto hat keine Rolle als Schüler:in und ist in keiner Klasse.",
    classPendingTitle: "Deine Klasse wird geprüft",
    classPendingDetail: "POKYH fragt WebUntis gerade neu nach deiner Klasse. Das passiert bei der nächsten Anmeldung von selbst, meist in wenigen Minuten.",
    noClassInUntisTitle: "WebUntis nennt keine Klasse",
    noClassInUntisDetail: "Dein WebUntis-Konto nennt keine Klasse. Wenn das nicht stimmt, wende dich an deine Schule.",
    sharedRecordTitle: "Deine Klasse wartet auf eine Prüfung",
    sharedRecordDetail: "Ein anderes Konto meldet sich auf demselben WebUntis-Schüler an. Ein Admin ordnet das bald zu.",
    remindersEmptyTitle: 'Keine Erinnerungen',
    remindersEmptySubtitle: 'Füge Hausaufgaben oder Erinnerungen für deine Klasse hinzu.',
    overdueHeader: 'FÄLLIG',
    upcomingHeader: 'KOMMEND',
    addReminder: 'Erinnerung hinzufügen',
    descriptionOptional: 'Beschreibung (optional)',
    chooseDateTime: 'Datum & Uhrzeit wählen *',
    memberOne: '{n} Mitglied',
    memberMany: '{n} Mitglieder',
    byUser: 'von {name}',
    deleteAsAdmin: 'Als Admin löschen',
    composePlaceholder: 'Was steht an?',
    moreDetails: 'Details',
    openTitle: 'Offen',
    doneTitle: 'Erledigt',
    overdue: 'Überfällig',
    deleteItem: 'Löschen',
    markDone: 'Als erledigt markieren',
    markOpen: 'Wieder öffnen',
    todosLead: '{n} offen · Erledigte verschwinden nach 24 Stunden',
    remindersLead: 'Für die ganze Klasse {klasse} sichtbar',
    newReminder: 'Neue Erinnerung',
    comments: 'Kommentare',
    whenLabel: 'Wann',
  },
  it: {
    dateTime: '{date} · {time}',
    titleRequired: 'Titolo *',
    add: 'Aggiungi',
    loadFailed: 'Errore durante il caricamento',
    saveFailed: 'Errore durante il salvataggio. Riprova.',
    you: 'Tu',
    todosTitle: 'To-do',
    todosLoadError: 'Errore durante il caricamento dei to-do.',
    todosEmptyTitle: 'Nessun to-do',
    todosEmptySubtitle: 'Aggiungi le tue prime attività.',
    open: 'Aperti ({n})',
    done: 'Completati ({n})',
    addTodo: 'Aggiungi to-do',
    detailsOptional: 'Dettagli (facoltativo)',
    dueOptional: 'Scegli una scadenza (facoltativo)',
    todayAt: 'Oggi {time}',
    remindersTitle: 'Promemoria',
    remindersLoadError: 'Errore durante il caricamento dei promemoria.',
    due: 'Scaduto',
    inDay: 'tra 1 giorno',
    inDays: 'tra {n} giorni',
    inHours: 'tra {n} h',
    soon: 'A breve',
    classNotFound: 'Classe non trovata',
    syncFailed: 'Sincronizzazione non riuscita. Riprova o effettua di nuovo l’accesso.',
    loginAgain: 'Accedi di nuovo',
    noClassParentTitle: "Gli account dei genitori non hanno una classe",
    noClassParentDetail: "I promemoria appartengono alla classe. Gli account dei genitori non sono in nessuna classe; i tuoi to-do sono sotto „To-do“.",
    noClassRoleTitle: "Nessuna classe per questo account",
    noClassRoleDetail: "Questo account non ha il ruolo di studente e non è in nessuna classe.",
    classPendingTitle: "Stiamo verificando la tua classe",
    classPendingDetail: "POKYH sta chiedendo di nuovo a WebUntis la tua classe. Succede da solo al prossimo accesso, di solito in pochi minuti.",
    noClassInUntisTitle: "WebUntis non indica una classe",
    noClassInUntisDetail: "Il tuo account WebUntis non indica nessuna classe. Se non è corretto, rivolgiti alla tua scuola.",
    sharedRecordTitle: "La tua classe è in attesa di verifica",
    sharedRecordDetail: "Un altro account accede con lo stesso studente WebUntis. Un amministratore lo assegnerà a breve.",
    remindersEmptyTitle: 'Nessun promemoria',
    remindersEmptySubtitle: 'Aggiungi compiti o promemoria per la tua classe.',
    overdueHeader: 'SCADUTI',
    upcomingHeader: 'IN ARRIVO',
    addReminder: 'Aggiungi promemoria',
    descriptionOptional: 'Descrizione (facoltativa)',
    chooseDateTime: 'Scegli data e ora *',
    memberOne: '{n} membro',
    memberMany: '{n} membri',
    byUser: 'di {name}',
    deleteAsAdmin: 'Elimina come admin',
    composePlaceholder: 'Cosa devi fare?',
    moreDetails: 'Dettagli',
    openTitle: 'Aperti',
    doneTitle: 'Completati',
    overdue: 'Scaduto',
    deleteItem: 'Elimina',
    markDone: 'Segna come fatto',
    markOpen: 'Riapri',
    todosLead: '{n} aperti · i completati spariscono dopo 24 ore',
    remindersLead: 'Visibili a tutta la classe {klasse}',
    newReminder: 'Nuovo promemoria',
    comments: 'Commenti',
    whenLabel: 'Quando',
  },
  en: {
    dateTime: '{date} · {time}',
    titleRequired: 'Title *',
    add: 'Add',
    loadFailed: 'Failed to load',
    saveFailed: 'Failed to save. Please try again.',
    you: 'You',
    todosTitle: 'To-dos',
    todosLoadError: 'Failed to load your to-dos.',
    todosEmptyTitle: 'No to-dos',
    todosEmptySubtitle: 'Add your first tasks.',
    open: 'Open ({n})',
    done: 'Done ({n})',
    addTodo: 'Add to-do',
    detailsOptional: 'Details (optional)',
    dueOptional: 'Choose a due date (optional)',
    todayAt: 'Today {time}',
    remindersTitle: 'Reminders',
    remindersLoadError: 'Failed to load reminders.',
    due: 'Due',
    inDay: 'in 1 day',
    inDays: 'in {n} days',
    inHours: 'in {n} h',
    soon: 'Soon',
    classNotFound: 'Class not found',
    syncFailed: 'Sync failed. Try again or log in again.',
    loginAgain: 'Log in again',
    noClassParentTitle: "Parent accounts have no class",
    noClassParentDetail: "Reminders belong to a class. Parent accounts aren’t in any class; your own to-dos are under “To-dos”.",
    noClassRoleTitle: "No class for this account",
    noClassRoleDetail: "This account has no student role and isn’t in any class.",
    classPendingTitle: "Checking your class",
    classPendingDetail: "POKYH is asking WebUntis for your class again. It happens on its own at your next sign-in, usually within a few minutes.",
    noClassInUntisTitle: "WebUntis names no class",
    noClassInUntisDetail: "Your WebUntis account doesn’t name a class. If that’s wrong, contact your school.",
    sharedRecordTitle: "Your class is waiting for a check",
    sharedRecordDetail: "Another account signs in as the same WebUntis student. An admin will sort it out soon.",
    remindersEmptyTitle: 'No reminders',
    remindersEmptySubtitle: 'Add homework or reminders for your class.',
    overdueHeader: 'DUE',
    upcomingHeader: 'UPCOMING',
    addReminder: 'Add reminder',
    descriptionOptional: 'Description (optional)',
    chooseDateTime: 'Choose date & time *',
    memberOne: '{n} member',
    memberMany: '{n} members',
    byUser: 'by {name}',
    deleteAsAdmin: 'Delete as admin',
    composePlaceholder: 'What do you need to do?',
    moreDetails: 'Details',
    openTitle: 'Open',
    doneTitle: 'Done',
    overdue: 'Overdue',
    deleteItem: 'Delete',
    markDone: 'Mark as done',
    markOpen: 'Reopen',
    todosLead: '{n} open · done ones disappear after 24 hours',
    remindersLead: 'Visible to the whole class {klasse}',
    newReminder: 'New reminder',
    comments: 'Comments',
    whenLabel: 'When',
  },
  lld: {
    dateTime: "{date} · ai {time}",
    titleRequired: "Titul *",
    add: "Junté",
    loadFailed: "Fal tl ciarië",
    saveFailed: "Fal tl salvé. Prova mo n iede.",
    you: "Tu",
    todosTitle: "To-do",
    todosLoadError: "Fal tl ciarië i to-do.",
    todosEmptyTitle: "Deguni to-do",
    todosEmptySubtitle: "Junta ti prim lëures.",
    open: "Davierc ({n})",
    done: "Fac ({n})",
    addTodo: "Junté n to-do",
    detailsOptional: "Detaies (facoltatif)",
    dueOptional: "Cerni n termin (facoltatif)",
    todayAt: "Ncuei ai {time}",
    remindersTitle: "Recurdanzes",
    remindersLoadError: "Fal tl ciarië la recurdanzes.",
    due: "Scadù",
    inDay: "danter 1 di",
    inDays: "danter {n} dis",
    inHours: "danter {n} ëures",
    soon: "Tosc",
    classNotFound: "Tlas nia giapeda",
    syncFailed: "La sincronisazion ne n’ie nia juda. Prova mo n iede o va ite de nuef.",
    loginAgain: "Jì ite de nuef",
    noClassParentTitle: "I conc di genitores ne à deguna tlas",
    noClassParentDetail: "La recurdanzes tol pea ala tlas. I conc di genitores ne ie te deguna tlas; ti to-do ies giapes sota „To-do“.",
    noClassRoleTitle: "Deguna tlas per chësc cont",
    noClassRoleDetail: "Chësc cont ne à nia la rola de scolaa o scolé y ne ie te deguna tlas.",
    classPendingTitle: "Tia tlas vën cuntrulëda",
    classPendingDetail: "POKYH damanda mo n iede WebUntis tia tlas. Chësc suzed da se nstës l’iede che vën che te vas ite, de regula danter n valguni minuc.",
    noClassInUntisTitle: "WebUntis ne dij deguna tlas",
    noClassInUntisDetail: "Tie cont WebUntis ne dij deguna tlas. Sce chësc ne n’ie nia giut, damanda la scola.",
    sharedRecordTitle: "Tia tlas aspieta n cuntrol",
    sharedRecordDetail: "N auter cont va ite cun l medem scolé de WebUntis. N admin mët a puest chësc tosc.",
    remindersEmptyTitle: "Deguna recurdanzes",
    remindersEmptySubtitle: "Junta lëures da cësa o recurdanzes per tia tlas.",
    overdueHeader: "SCADUDES",
    upcomingHeader: "CHE VËN",
    addReminder: "Junté na recurdanza",
    descriptionOptional: "Descrizion (facoltativa)",
    chooseDateTime: "Cerni data y ëura *",
    memberOne: "{n} member",
    memberMany: "{n} members",
    byUser: "da {name}",
    deleteAsAdmin: "Scancelé coche admin",
  },
};
