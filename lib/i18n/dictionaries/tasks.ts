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
  | 'deleteAsAdmin';

export const tasksDict: Dictionary<TasksKey> = {
  de: {
    dateTime: '{date} · {time} Uhr',
    titleRequired: 'Titel *',
    add: 'Hinzufügen',
    loadFailed: 'Fehler beim Laden',
    saveFailed: 'Fehler beim Speichern. Bitte erneut versuchen.',
    you: 'Du',
    todosTitle: 'Todos',
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
