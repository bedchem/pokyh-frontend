import type { Dictionary } from '../dictionary';

// Writes that go to WebUntis: password, absence reasons, excuse letter, replies.
export type UntisActionKey =
  | 'pwTitle'
  | 'pwLead'
  | 'pwOld'
  | 'pwNew'
  | 'pwRepeat'
  | 'pwMismatch'
  | 'pwSave'
  | 'pwSaving'
  | 'pwDone'
  | 'show'
  | 'hide'
  | 'forgot'
  | 'resetTitle'
  | 'resetLead'
  | 'resetUser'
  | 'resetEmail'
  | 'resetSend'
  | 'resetSending'
  | 'resetDone'
  | 'resetOfficial'
  | 'exAction'
  | 'exTitle'
  | 'exLead'
  | 'exReason'
  | 'exChoose'
  | 'exAbsence'
  | 'exNote'
  | 'exPick'
  | 'exSave'
  | 'exSaving'
  | 'exDone'
  | 'exLetter'
  | 'exLetterHint'
  | 'deleteAction'
  | 'deleteConfirm'
  | 'reply'
  | 'replyTo'
  | 'replyUnavailable'
  | 'oneTeacher'
  | 'cancel'
  | 'close'
  | 'failed';

export const untisActionsDict: Dictionary<UntisActionKey> = {
  de: {
    pwTitle: 'WebUntis-Passwort ändern',
    pwLead: 'Ändert das Passwort deines WebUntis-Kontos. Es gilt danach überall, auch in der WebUntis-App.',
    pwOld: 'Aktuelles Passwort',
    pwNew: 'Neues Passwort',
    pwRepeat: 'Neues Passwort wiederholen',
    pwMismatch: 'Die neuen Passwörter stimmen nicht überein.',
    pwSave: 'Passwort ändern',
    pwSaving: 'Wird geändert …',
    pwDone: 'Dein WebUntis-Passwort wurde geändert.',
    show: 'Passwort anzeigen',
    hide: 'Passwort verbergen',
    forgot: 'Passwort vergessen?',
    resetTitle: 'Passwort vergessen',
    resetLead: 'WebUntis schickt dir einen Link zum Zurücksetzen an die E-Mail-Adresse, die in deinem Konto hinterlegt ist.',
    resetUser: 'WebUntis-Benutzername',
    resetEmail: 'E-Mail-Adresse',
    resetSend: 'Link anfordern',
    resetSending: 'Wird angefordert …',
    resetDone: 'WebUntis hat dir eine E-Mail mit dem Link zum Zurücksetzen geschickt.',
    resetOfficial: 'Stattdessen in WebUntis öffnen',
    exAction: 'Grund angeben',
    exTitle: 'Grund für die Abwesenheit',
    exLead: 'Grund und Notiz gehen direkt an WebUntis. Ob die Abwesenheit als entschuldigt gilt, entscheidet die Schule.',
    exReason: 'Grund',
    exChoose: 'Grund wählen',
    exAbsence: 'Abwesenheit',
    exNote: 'Notiz (optional)',
    exPick: 'Bitte einen Grund wählen.',
    exSave: 'In WebUntis speichern',
    exSaving: 'Wird gespeichert …',
    exDone: 'In WebUntis gespeichert.',
    exLetter: 'Entschuldigungsschreiben',
    exLetterHint: 'PDF aus WebUntis für die offenen Abwesenheiten',
    deleteAction: 'Löschen',
    deleteConfirm: 'Diese Abwesenheit in WebUntis löschen?',
    reply: 'Antworten',
    replyTo: 'An {name}',
    replyUnavailable: 'Auf diese Nachricht kann nicht geantwortet werden.',
    oneTeacher: 'WebUntis erlaubt pro Nachricht eine Lehrkraft.',
    cancel: 'Abbrechen',
    close: 'Schließen',
    failed: 'Das hat nicht geklappt. Bitte versuch es noch einmal.',
  },
  it: {
    pwTitle: 'Cambia la password di WebUntis',
    pwLead: 'Cambia la password del tuo account WebUntis. Vale ovunque, anche nell’app WebUntis.',
    pwOld: 'Password attuale',
    pwNew: 'Nuova password',
    pwRepeat: 'Ripeti la nuova password',
    pwMismatch: 'Le nuove password non coincidono.',
    pwSave: 'Cambia password',
    pwSaving: 'Modifica in corso …',
    pwDone: 'La tua password di WebUntis è stata cambiata.',
    show: 'Mostra password',
    hide: 'Nascondi password',
    forgot: 'Password dimenticata?',
    resetTitle: 'Password dimenticata',
    resetLead: 'WebUntis ti invia un link per reimpostarla all’indirizzo e-mail salvato nel tuo account.',
    resetUser: 'Nome utente WebUntis',
    resetEmail: 'Indirizzo e-mail',
    resetSend: 'Richiedi il link',
    resetSending: 'Richiesta in corso …',
    resetDone: 'WebUntis ti ha inviato un’e-mail con il link per reimpostare la password.',
    resetOfficial: 'Apri invece in WebUntis',
    exAction: 'Indica il motivo',
    exTitle: 'Motivo dell’assenza',
    exLead: 'Motivo e nota vanno direttamente a WebUntis. Se l’assenza è giustificata lo decide la scuola.',
    exReason: 'Motivo',
    exChoose: 'Scegli il motivo',
    exAbsence: 'Assenza',
    exNote: 'Nota (facoltativa)',
    exPick: 'Scegli un motivo.',
    exSave: 'Salva in WebUntis',
    exSaving: 'Salvataggio …',
    exDone: 'Salvato in WebUntis.',
    exLetter: 'Lettera di giustificazione',
    exLetterHint: 'PDF di WebUntis per le assenze aperte',
    deleteAction: 'Elimina',
    deleteConfirm: 'Eliminare questa assenza in WebUntis?',
    reply: 'Rispondi',
    replyTo: 'A {name}',
    replyUnavailable: 'A questo messaggio non si può rispondere.',
    oneTeacher: 'WebUntis consente un solo docente per messaggio.',
    cancel: 'Annulla',
    close: 'Chiudi',
    failed: 'Non ha funzionato. Riprova.',
  },
  en: {
    pwTitle: 'Change WebUntis password',
    pwLead: 'Changes the password of your WebUntis account. It then applies everywhere, including the WebUntis app.',
    pwOld: 'Current password',
    pwNew: 'New password',
    pwRepeat: 'Repeat new password',
    pwMismatch: 'The new passwords don’t match.',
    pwSave: 'Change password',
    pwSaving: 'Changing …',
    pwDone: 'Your WebUntis password has been changed.',
    show: 'Show password',
    hide: 'Hide password',
    forgot: 'Forgot password?',
    resetTitle: 'Forgot password',
    resetLead: 'WebUntis sends a reset link to the e-mail address stored in your account.',
    resetUser: 'WebUntis username',
    resetEmail: 'E-mail address',
    resetSend: 'Request link',
    resetSending: 'Requesting …',
    resetDone: 'WebUntis has sent you an e-mail with the reset link.',
    resetOfficial: 'Open in WebUntis instead',
    exAction: 'Give a reason',
    exTitle: 'Reason for the absence',
    exLead: 'Reason and note go straight to WebUntis. Whether the absence counts as excused is decided by the school.',
    exReason: 'Reason',
    exChoose: 'Choose a reason',
    exAbsence: 'Absence',
    exNote: 'Note (optional)',
    exPick: 'Please choose a reason.',
    exSave: 'Save in WebUntis',
    exSaving: 'Saving …',
    exDone: 'Saved in WebUntis.',
    exLetter: 'Excuse letter',
    exLetterHint: 'PDF from WebUntis for your open absences',
    deleteAction: 'Delete',
    deleteConfirm: 'Delete this absence in WebUntis?',
    reply: 'Reply',
    replyTo: 'To {name}',
    replyUnavailable: 'This message can’t be replied to.',
    oneTeacher: 'WebUntis allows one teacher per message.',
    cancel: 'Cancel',
    close: 'Close',
    failed: 'That didn’t work. Please try again.',
  },
};
