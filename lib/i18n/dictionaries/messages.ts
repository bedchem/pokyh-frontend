import type { Dictionary } from '../dictionary';

export type MessagesKey =
  // List page
  | 'title'
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'to'
  | 'unknown'
  | 'noSubject'
  | 'yesterday'
  | 'markAllRead'
  | 'compose'
  | 'emptySentTitle'
  | 'emptyDraftsTitle'
  | 'emptyInboxTitle'
  | 'emptySentText'
  | 'emptyDraftsText'
  | 'emptyInboxText'
  | 'deleteDraft'
  | 'draftOpenFailed'
  | 'draftDeleteFailed'
  // Detail page
  | 'message'
  | 'attachment'
  | 'attachmentsLoading'
  | 'oneAttachment'
  | 'nAttachments'
  | 'attachmentsError'
  | 'tapToReload'
  | 'externalLink'
  | 'leavingApp'
  | 'open'
  // Compose
  | 'errPickTeacher'
  | 'errSubject'
  | 'errText'
  | 'errSend'
  | 'errDraftEmpty'
  | 'errDraftSave'
  | 'choose'
  | 'unavailable'
  | 'nRecipients'
  | 'editDraft'
  | 'composeTitle'
  | 'send'
  | 'toLabel'
  | 'subject'
  | 'textPlaceholder'
  | 'savedInDraft'
  | 'removeFile'
  | 'addAttachment'
  | 'saveDraft'
  | 'recipientsLoadFailed'
  | 'messageSent'
  | 'draftSaved'
  // RecipientPicker
  | 'done'
  | 'recipients'
  | 'searchTeacher'
  | 'recipientsLoading'
  | 'classTeacher'
  | 'others';

export const messagesDict: Dictionary<MessagesKey> = {
  de: {
    title: 'Nachrichten',
    inbox: 'Posteingang',
    sent: 'Gesendet',
    drafts: 'Entwürfe',
    to: 'An: {names}',
    unknown: 'Unbekannt',
    noSubject: '(Kein Betreff)',
    yesterday: 'Gestern',
    markAllRead: 'Alle als gelesen',
    compose: 'Mitteilung verfassen',
    emptySentTitle: 'Nichts gesendet',
    emptyDraftsTitle: 'Keine Entwürfe',
    emptyInboxTitle: 'Keine Nachrichten',
    emptySentText: 'Du hast noch keine Nachrichten gesendet.',
    emptyDraftsText: 'Du hast noch keine Entwürfe gespeichert.',
    emptyInboxText: 'Du hast noch keine Nachrichten erhalten.',
    deleteDraft: 'Entwurf löschen',
    draftOpenFailed: 'Der Entwurf konnte nicht geöffnet werden.',
    draftDeleteFailed: 'Der Entwurf konnte nicht gelöscht werden.',
    message: 'Nachricht',
    attachment: 'Anhang',
    attachmentsLoading: 'Anhänge werden geladen…',
    oneAttachment: '1 Anhang',
    nAttachments: '{n} Anhänge',
    attachmentsError: 'Fehler beim Laden',
    tapToReload: 'Tippen zum erneuten Laden',
    externalLink: 'Externer Link',
    leavingApp: 'Du verlässt die POKYH App',
    open: 'Öffnen',
    errPickTeacher: 'Bitte mindestens eine Lehrkraft wählen.',
    errSubject: 'Bitte einen Betreff eingeben.',
    errText: 'Bitte einen Text eingeben.',
    errSend: 'Die Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.',
    errDraftEmpty: 'Bitte gib einen Betreff, Text, Empfänger oder Anhang an.',
    errDraftSave: 'Der Entwurf konnte nicht gespeichert werden. Bitte versuche es später erneut.',
    choose: 'Wählen',
    unavailable: 'Nicht verfügbar',
    nRecipients: '{n} Empfänger',
    editDraft: 'Entwurf bearbeiten',
    composeTitle: 'Mitteilung an Lehrkraft',
    send: 'Senden',
    toLabel: 'An',
    subject: 'Betreff',
    textPlaceholder: 'Text hier eingeben',
    savedInDraft: 'Im Entwurf gespeichert',
    removeFile: '{name} entfernen',
    addAttachment: 'Anhang hinzufügen',
    saveDraft: 'Als Entwurf speichern',
    recipientsLoadFailed: 'Empfänger konnten gerade nicht geladen werden. Bitte versuche es später erneut.',
    messageSent: 'Nachricht gesendet.',
    draftSaved: 'Entwurf gespeichert.',
    done: 'Fertig',
    recipients: 'Empfänger',
    searchTeacher: 'Lehrkraft suchen…',
    recipientsLoading: 'Empfänger werden geladen … falls dauerhaft leer, sind für dieses Konto keine Empfänger verfügbar.',
    classTeacher: 'Klassenlehrkraft',
    others: 'Andere',
  },
  it: {
    title: 'Messaggi',
    inbox: 'In arrivo',
    sent: 'Inviati',
    drafts: 'Bozze',
    to: 'A: {names}',
    unknown: 'Sconosciuto',
    noSubject: '(Nessun oggetto)',
    yesterday: 'Ieri',
    markAllRead: 'Segna tutti come letti',
    compose: 'Scrivi comunicazione',
    emptySentTitle: 'Nessun messaggio inviato',
    emptyDraftsTitle: 'Nessuna bozza',
    emptyInboxTitle: 'Nessun messaggio',
    emptySentText: 'Non hai ancora inviato messaggi.',
    emptyDraftsText: 'Non hai ancora salvato bozze.',
    emptyInboxText: 'Non hai ancora ricevuto messaggi.',
    deleteDraft: 'Elimina bozza',
    draftOpenFailed: 'Impossibile aprire la bozza.',
    draftDeleteFailed: 'Impossibile eliminare la bozza.',
    message: 'Messaggio',
    attachment: 'Allegato',
    attachmentsLoading: 'Caricamento allegati…',
    oneAttachment: '1 allegato',
    nAttachments: '{n} allegati',
    attachmentsError: 'Errore durante il caricamento',
    tapToReload: 'Tocca per ricaricare',
    externalLink: 'Link esterno',
    leavingApp: 'Stai lasciando l’app POKYH',
    open: 'Apri',
    errPickTeacher: 'Scegli almeno un docente.',
    errSubject: 'Inserisci un oggetto.',
    errText: 'Inserisci un testo.',
    errSend: 'Impossibile inviare il messaggio. Riprova più tardi.',
    errDraftEmpty: 'Inserisci un oggetto, un testo, un destinatario o un allegato.',
    errDraftSave: 'Impossibile salvare la bozza. Riprova più tardi.',
    choose: 'Scegli',
    unavailable: 'Non disponibile',
    nRecipients: '{n} destinatari',
    editDraft: 'Modifica bozza',
    composeTitle: 'Comunicazione al docente',
    send: 'Invia',
    toLabel: 'A',
    subject: 'Oggetto',
    textPlaceholder: 'Inserisci il testo qui',
    savedInDraft: 'Salvato nella bozza',
    removeFile: 'Rimuovi {name}',
    addAttachment: 'Aggiungi allegato',
    saveDraft: 'Salva come bozza',
    recipientsLoadFailed: 'Al momento non è stato possibile caricare i destinatari. Riprova più tardi.',
    messageSent: 'Messaggio inviato.',
    draftSaved: 'Bozza salvata.',
    done: 'Fatto',
    recipients: 'Destinatari',
    searchTeacher: 'Cerca docente…',
    recipientsLoading: 'Caricamento destinatari… se resta vuoto, per questo account non ci sono destinatari disponibili.',
    classTeacher: 'Coordinatore di classe',
    others: 'Altri',
  },
  en: {
    title: 'Messages',
    inbox: 'Inbox',
    sent: 'Sent',
    drafts: 'Drafts',
    to: 'To: {names}',
    unknown: 'Unknown',
    noSubject: '(No subject)',
    yesterday: 'Yesterday',
    markAllRead: 'Mark all as read',
    compose: 'Write a message',
    emptySentTitle: 'Nothing sent',
    emptyDraftsTitle: 'No drafts',
    emptyInboxTitle: 'No messages',
    emptySentText: 'You haven’t sent any messages yet.',
    emptyDraftsText: 'You haven’t saved any drafts yet.',
    emptyInboxText: 'You haven’t received any messages yet.',
    deleteDraft: 'Delete draft',
    draftOpenFailed: 'The draft couldn’t be opened.',
    draftDeleteFailed: 'The draft couldn’t be deleted.',
    message: 'Message',
    attachment: 'Attachment',
    attachmentsLoading: 'Loading attachments…',
    oneAttachment: '1 attachment',
    nAttachments: '{n} attachments',
    attachmentsError: 'Failed to load',
    tapToReload: 'Tap to reload',
    externalLink: 'External link',
    leavingApp: 'You’re leaving the POKYH app',
    open: 'Open',
    errPickTeacher: 'Please choose at least one teacher.',
    errSubject: 'Please enter a subject.',
    errText: 'Please enter a message.',
    errSend: 'The message couldn’t be sent. Please try again later.',
    errDraftEmpty: 'Please add a subject, text, recipient or attachment.',
    errDraftSave: 'The draft couldn’t be saved. Please try again later.',
    choose: 'Choose',
    unavailable: 'Not available',
    nRecipients: '{n} recipients',
    editDraft: 'Edit draft',
    composeTitle: 'Message to teacher',
    send: 'Send',
    toLabel: 'To',
    subject: 'Subject',
    textPlaceholder: 'Enter text here',
    savedInDraft: 'Saved in draft',
    removeFile: 'Remove {name}',
    addAttachment: 'Add attachment',
    saveDraft: 'Save as draft',
    recipientsLoadFailed: 'Recipients couldn’t be loaded right now. Please try again later.',
    messageSent: 'Message sent.',
    draftSaved: 'Draft saved.',
    done: 'Done',
    recipients: 'Recipients',
    searchTeacher: 'Search teacher…',
    recipientsLoading: 'Loading recipients… if this stays empty, no recipients are available for this account.',
    classTeacher: 'Class teacher',
    others: 'Others',
  },
  lld: {
    title: "Nutizies",
    inbox: "Nutizies ruvedes",
    sent: "Mandedes",
    drafts: "Sbozes",
    to: "A: {names}",
    unknown: "Nia cunesciù",
    noSubject: "(Zënza argumënt)",
    yesterday: "Ier",
    markAllRead: "Duc sciche liei",
    compose: "Scrì na nutizia",
    emptySentTitle: "Nia mandà",
    emptyDraftsTitle: "Deguna sboza",
    emptyInboxTitle: "Deguna nutizia",
    emptySentText: "Tu ne es mo nia mandà nutizies.",
    emptyDraftsText: "Tu ne es mo nia salvà sbozes.",
    emptyInboxText: "Tu ne es mo nia ruvà nutizies.",
    deleteDraft: "Scancelé la sboza",
    draftOpenFailed: "La sboza ne n’à nia pudù vester giaurida.",
    draftDeleteFailed: "La sboza ne n’à nia pudù vester scancelëda.",
    message: "Nutizia",
    attachment: "Alegat",
    attachmentsLoading: "I alegac se cëria…",
    oneAttachment: "1 alegat",
    nAttachments: "{n} alegac",
    attachmentsError: "Fal tl ciarië",
    tapToReload: "Tuca per ciarië de nuef",
    externalLink: "Link da ora",
    leavingApp: "Tu lasces l’app POKYH",
    open: "Giaurì",
    errPickTeacher: "Cerni almanco n nseniant.",
    errSubject: "Scrij n argumënt.",
    errText: "Scrij n test.",
    errSend: "La nutizia ne n’à nia pudù vester mandeda. Prova plu tert mo n iede.",
    errDraftEmpty: "Scrij n argumënt, n test, n destinatar o n alegat.",
    errDraftSave: "La sboza ne n’à nia pudù vester salveda. Prova plu tert mo n iede.",
    choose: "Cerni",
    unavailable: "Nia a dispuzion",
    nRecipients: "{n} destinatars",
    editDraft: "Mudé la sboza",
    composeTitle: "Nutizia al nseniant",
    send: "Mandé",
    toLabel: "A",
    subject: "Argumënt",
    textPlaceholder: "Scrij chilò l test",
    savedInDraft: "Salvà tla sboza",
    removeFile: "Tò demez {name}",
    addAttachment: "Junté n alegat",
    saveDraft: "Salvé coche sboza",
    recipientsLoadFailed: "I destinatars ne n’à nia pudù vester ciariei. Prova plu tert mo n iede.",
    messageSent: "Nutizia mandeda.",
    draftSaved: "Sboza salveda.",
    done: "Fat",
    recipients: "Destinatars",
    searchTeacher: "Crì n nseniant…",
    recipientsLoading: "I destinatars se cëria … sce la lista resta vuea, ne n’iel deguni destinatars per chësc account.",
    classTeacher: "Nseniant dla tlas",
    others: "Autri",
  },
};
