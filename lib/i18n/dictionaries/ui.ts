import type { Dictionary } from '../dictionary';

export type UiKey =
  // DateTimePicker
  | 'dtTitle'
  | 'dtDate'
  | 'dtTime'
  | 'dtDatePlaceholder'
  | 'dtDateFormat'
  | 'dtTimeFormat'
  | 'dtEndAfterStart'
  | 'dtSelected'
  | 'dtConfirm'
  | 'dtPreview'
  // CommentSection
  | 'justNow'
  | 'minutesAgo'
  | 'hoursAgo'
  | 'dayAgo'
  | 'daysAgo'
  | 'you'
  | 'edited'
  | 'writeComment'
  | 'comments'
  | 'noComments'
  | 'editComment'
  | 'deleteComment'
  | 'send'
  // AnnouncementPopup
  | 'next'
  | 'gotIt'
  // LoadingCover
  | 'loadingPokyh';

export const uiDict: Dictionary<UiKey> = {
  de: {
    dtTitle: 'Datum & Uhrzeit',
    dtDate: 'Datum',
    dtTime: 'Uhrzeit',
    dtDatePlaceholder: 'TT.MM.JJJJ',
    dtDateFormat: 'Format: TT.MM.JJJJ',
    dtTimeFormat: 'Format: HH:MM (z.B. 08:30)',
    dtEndAfterStart: 'Das Ende muss nach dem Start liegen.',
    dtSelected: 'Ausgewählt',
    dtConfirm: 'Bestätigen',
    dtPreview: '{date}, {time} Uhr',
    justNow: 'Gerade eben',
    minutesAgo: 'vor {n} Min.',
    hoursAgo: 'vor {n} Std.',
    dayAgo: 'vor 1 Tag',
    daysAgo: 'vor {n} Tagen',
    you: 'Du',
    edited: 'bearbeitet',
    writeComment: 'Kommentar schreiben…',
    comments: 'Kommentare',
    noComments: 'Noch keine Kommentare',
    editComment: 'Bearbeiten',
    deleteComment: 'Löschen',
    send: 'Senden',
    next: 'Weiter ({n})',
    gotIt: 'Verstanden',
    loadingPokyh: 'POKYH lädt',
  },
  it: {
    dtTitle: 'Data e ora',
    dtDate: 'Data',
    dtTime: 'Ora',
    dtDatePlaceholder: 'GG.MM.AAAA',
    dtDateFormat: 'Formato: GG.MM.AAAA',
    dtTimeFormat: 'Formato: HH:MM (es. 08:30)',
    dtEndAfterStart: 'La fine deve essere dopo l’inizio.',
    dtSelected: 'Selezionato',
    dtConfirm: 'Conferma',
    dtPreview: '{date}, ore {time}',
    justNow: 'Proprio ora',
    minutesAgo: '{n} min fa',
    hoursAgo: '{n} h fa',
    dayAgo: '1 giorno fa',
    daysAgo: '{n} giorni fa',
    you: 'Tu',
    edited: 'modificato',
    writeComment: 'Scrivi un commento…',
    comments: 'Commenti',
    noComments: 'Ancora nessun commento',
    editComment: 'Modifica',
    deleteComment: 'Elimina',
    send: 'Invia',
    next: 'Avanti ({n})',
    gotIt: 'Ho capito',
    loadingPokyh: 'POKYH si sta caricando',
  },
  en: {
    dtTitle: 'Date & time',
    dtDate: 'Date',
    dtTime: 'Time',
    dtDatePlaceholder: 'DD.MM.YYYY',
    dtDateFormat: 'Format: DD.MM.YYYY',
    dtTimeFormat: 'Format: HH:MM (e.g. 08:30)',
    dtEndAfterStart: 'The end must be after the start.',
    dtSelected: 'Selected',
    dtConfirm: 'Confirm',
    dtPreview: '{date}, {time}',
    justNow: 'Just now',
    minutesAgo: '{n} min ago',
    hoursAgo: '{n} h ago',
    dayAgo: '1 day ago',
    daysAgo: '{n} days ago',
    you: 'You',
    edited: 'edited',
    writeComment: 'Write a comment…',
    comments: 'Comments',
    noComments: 'No comments yet',
    editComment: 'Edit',
    deleteComment: 'Delete',
    send: 'Send',
    next: 'Next ({n})',
    gotIt: 'Got it',
    loadingPokyh: 'POKYH is loading',
  },
  lld: {
    dtTitle: "Data y ëura",
    dtDate: "Data",
    dtTime: "Ëura",
    dtDatePlaceholder: "DD.MM.AAAA",
    dtDateFormat: "Format: DD.MM.AAAA",
    dtTimeFormat: "Format: HH:MM (per ejëmpl 08:30)",
    dtEndAfterStart: "La fin muessa vester do l scumenciamënt.",
    dtSelected: "Cernù",
    dtConfirm: "Cunfermé",
    dtPreview: "{date}, ai {time}",
    justNow: "Sëuraldut",
    minutesAgo: "dant {n} min.",
    hoursAgo: "dant {n} ëures",
    dayAgo: "dant 1 di",
    daysAgo: "dant {n} dis",
    you: "Tu",
    edited: "mudà",
    writeComment: "Scrij n cumënt…",
    comments: "Cumenc",
    noComments: "Mo deguni cumenc",
    editComment: "Mudé",
    deleteComment: "Scancelé",
    send: "Mandé",
    next: "Inant ({n})",
    gotIt: "Capì",
    loadingPokyh: "POKYH se cëria",
  },
};
