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
  | 'dtPrevMonth'
  | 'dtNextMonth'
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
  | 'reportComment'
  | 'reportSubject'
  | 'reportBody'
  | 'send'
  | 'ratedStars'
  | 'noCommentsHint'
  | 'commentFailed'
  | 'saveComment'
  | 'cancelEdit'
  // MediaViewer
  | 'viewerDownload'
  | 'viewerClose'
  | 'viewerLoading'
  | 'viewerFailed'
  | 'viewerNoPreview'
  | 'viewerRetry'
  | 'viewerPages'
  | 'viewerOpenPicture'
  | 'viewerOpenFile'
  // AnnouncementPopup
  | 'popupLabel'
  | 'popupNext'
  | 'popupDone'
  | 'popupStep'
  | 'popupWait'
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
    dtPrevMonth: 'Vorheriger Monat',
    dtNextMonth: 'Nächster Monat',
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
    reportComment: 'Kommentar melden',
    reportSubject: 'Meldung eines Inhalts auf POKYH',
    reportBody: 'Hallo POKYH-Team,\n\nich melde diesen Inhalt (Art. 16 Digital Services Act):\n\nWo: {url}\nKommentar von „{author}“ vom {date} (ID {id}):\n„{text}“\n\nWarum der Inhalt rechtswidrig ist oder gegen die Nutzungsbedingungen verstößt:\n\n\nMein Name und meine E-Mail-Adresse:\n\n\nIch bestätige, dass meine Angaben nach bestem Wissen richtig und vollständig sind.',
    send: 'Senden',
    ratedStars: 'Bewertet mit {n} von 5 Sternen',
    noCommentsHint: 'Schreib den ersten.',
    commentFailed: 'Das hat nicht geklappt. Versuch es noch einmal.',
    saveComment: 'Speichern',
    cancelEdit: 'Abbrechen',
    viewerDownload: 'Herunterladen',
    viewerClose: 'Schließen',
    viewerLoading: 'Wird geladen …',
    viewerFailed: 'Die Datei konnte gerade nicht geladen werden.',
    viewerNoPreview: 'Für diese Datei gibt es hier keine Vorschau. Du kannst sie herunterladen.',
    viewerRetry: 'Nochmal versuchen',
    viewerPages: '{n} Seiten',
    viewerOpenPicture: 'Profilbild groß ansehen',
    viewerOpenFile: '{name} ansehen',
    popupLabel: 'Mitteilung',
    popupNext: 'Weiter',
    popupDone: 'Fertig',
    popupStep: 'Mitteilung {n} von {total}',
    popupWait: 'Schließen in {n} Sekunden möglich',
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
    dtPrevMonth: 'Mese precedente',
    dtNextMonth: 'Mese successivo',
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
    reportComment: 'Segnala commento',
    reportSubject: 'Segnalazione di un contenuto su POKYH',
    reportBody: 'Ciao team di POKYH,\n\nsegnalo questo contenuto (art. 16 Digital Services Act):\n\nDove: {url}\nCommento di «{author}» del {date} (ID {id}):\n«{text}»\n\nPerché il contenuto è illegale o viola le condizioni d’uso:\n\n\nIl mio nome e il mio indirizzo e-mail:\n\n\nConfermo che le mie indicazioni sono esatte e complete secondo scienza e coscienza.',
    send: 'Invia',
    ratedStars: 'Valutato con {n} stelle su 5',
    noCommentsHint: 'Scrivi il primo.',
    commentFailed: 'Non è andato a buon fine. Riprova.',
    saveComment: 'Salva',
    cancelEdit: 'Annulla',
    viewerDownload: 'Scarica',
    viewerClose: 'Chiudi',
    viewerLoading: 'Caricamento …',
    viewerFailed: 'Al momento il file non può essere caricato.',
    viewerNoPreview: 'Per questo file non c’è un’anteprima. Puoi scaricarlo.',
    viewerRetry: 'Riprova',
    viewerPages: '{n} pagine',
    viewerOpenPicture: 'Vedi la foto del profilo in grande',
    viewerOpenFile: 'Apri {name}',
    popupLabel: 'Comunicazione',
    popupNext: 'Avanti',
    popupDone: 'Fatto',
    popupStep: 'Comunicazione {n} di {total}',
    popupWait: 'Chiudibile tra {n} secondi',
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
    dtPrevMonth: 'Previous month',
    dtNextMonth: 'Next month',
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
    reportComment: 'Report comment',
    reportSubject: 'Report of content on POKYH',
    reportBody: 'Hello POKYH team,\n\nI am reporting this content (Art. 16 Digital Services Act):\n\nWhere: {url}\nComment by “{author}” on {date} (ID {id}):\n“{text}”\n\nWhy the content is illegal or breaks the terms of use:\n\n\nMy name and e-mail address:\n\n\nI confirm that my information is accurate and complete to the best of my knowledge.',
    send: 'Send',
    ratedStars: 'Rated {n} out of 5 stars',
    noCommentsHint: 'Write the first one.',
    commentFailed: 'That didn’t work. Please try again.',
    saveComment: 'Save',
    cancelEdit: 'Cancel',
    viewerDownload: 'Download',
    viewerClose: 'Close',
    viewerLoading: 'Loading …',
    viewerFailed: 'The file couldn’t be loaded right now.',
    viewerNoPreview: 'There’s no preview for this file here. You can download it.',
    viewerRetry: 'Try again',
    viewerPages: '{n} pages',
    viewerOpenPicture: 'View profile picture full size',
    viewerOpenFile: 'Open {name}',
    popupLabel: 'Announcement',
    popupNext: 'Next',
    popupDone: 'Done',
    popupStep: 'Announcement {n} of {total}',
    popupWait: 'Can be closed in {n} seconds',
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
    popupLabel: "Nutizia",
    popupNext: "Inant",
    popupDone: "Fat",
    popupStep: "Nutizia {n} de {total}",
    loadingPokyh: "POKYH se cëria",
  },
};
