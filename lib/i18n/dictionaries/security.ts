import type { Dictionary } from '../dictionary';

// Signed-in devices, the login history, two-factor sign-in, the WebUntis
// account's own settings and the data download (the settings page and
// app/[lang]/(app)/settings/devices).
export type SecurityKey =
  | 'security'
  | 'accountSecurity'
  | 'passwordTitle'
  | 'passwordCardHint'
  | 'passwordChange'
  | 'passwordForgot'
  | 'stateOn'
  | 'stateOff'
  | 'recommended'
  | 'missing'
  | 'devicesView'
  | 'twoFactorCardOff'
  | 'twoFactorCardOn'
  | 'emailCardHint'
  | 'stepOf'
  | 'account'
  | 'devices'
  | 'devicesHint'
  | 'devicesCount'
  | 'devicesOne'
  | 'twoFactor'
  | 'twoFactorOff'
  | 'twoFactorOn'
  | 'twoFactorRequired'
  | 'twoFactorSetup'
  | 'twoFactorDisable'
  | 'tfTitle'
  | 'tfIntro'
  | 'tfApps'
  | 'tfRenewNote'
  | 'tfStart'
  | 'tfScan'
  | 'tfManual'
  | 'tfCopy'
  | 'tfCopied'
  | 'tfCode'
  | 'tfCodeHint'
  | 'tfEnable'
  | 'tfEnabling'
  | 'tfDoneTitle'
  | 'tfDone'
  | 'tfDoneNote'
  | 'tfDisableTitle'
  | 'tfDisableText'
  | 'tfDisabling'
  | 'tfCodeFormat'
  | 'email'
  | 'emailNone'
  | 'emailChange'
  | 'emailAdd'
  | 'emailLead'
  | 'emailSave'
  | 'emailSaving'
  | 'emailSaved'
  | 'emailInvalid'
  | 'forward'
  | 'forwardHint'
  | 'forwardNeedsEmail'
  | 'untisLanguage'
  | 'untisLanguageHint'
  | 'accountError'
  | 'exportTitle'
  | 'exportHint'
  | 'exportButton'
  | 'exporting'
  | 'exportDone'
  | 'devicesTitle'
  | 'devicesLead'
  | 'backToSettings'
  | 'thisDevice'
  | 'otherDevices'
  | 'noOthers'
  | 'signOut'
  | 'signOutDevice'
  | 'signOutOthers'
  | 'signOutOthersConfirm'
  | 'signedOutOthers'
  | 'activeNow'
  | 'lastActive'
  | 'since'
  | 'unknownPlace'
  | 'unknownDevice'
  | 'clientApp'
  | 'clientWeb'
  | 'clientPwa'
  | 'clientOther'
  | 'history'
  | 'historyHint'
  | 'historyEmpty'
  | 'showMore'
  | 'methodWebuntis'
  | 'methodOffice'
  | 'methodLocal'
  | 'methodRegister'
  | 'methodQr'
  | 'methodPasskey'
  | 'unlockTitleIos'
  | 'unlockTitleAndroid'
  | 'unlockTitleOther'
  | 'unlockHintIos'
  | 'unlockHintAndroid'
  | 'unlockHintOther'
  | 'unlockOn'
  | 'unlockOff'
  | 'unlockOtherAccount'
  | 'unlockPasswordNeeded'
  | 'unlockFailed'
  | 'unlockTapAgain'
  | 'loadError'
  | 'retry'
  | 'failed'
  | 'cancel'
  | 'close';

export const securityDict: Dictionary<SecurityKey> = {
  de: {
    accountSecurity: "Konto & Sicherheit",
    passwordTitle: "Passwort",
    passwordCardHint: "Dein WebUntis-Passwort. Es gilt auch in der WebUntis-App.",
    passwordChange: "Ändern",
    passwordForgot: "Vergessen?",
    stateOn: "An",
    stateOff: "Aus",
    recommended: "Empfohlen",
    missing: "Fehlt",
    devicesView: "Ansehen",
    twoFactorCardOff: "Schützt dein Konto mit einem Code aus einer App, auch wenn jemand dein Passwort kennt.",
    twoFactorCardOn: "Bei jeder Anmeldung brauchst du den Code aus deiner App.",
    emailCardHint: "Für das Zurücksetzen deines Passworts und Nachrichten per E-Mail.",
    stepOf: "Schritt {n} von {total}",
    security: 'Sicherheit',
    account: 'Konto',
    devices: 'Geräte & Anmeldungen',
    devicesHint: 'Wo du angemeldet bist, mit Ort und Zeit. Du kannst jedes Gerät abmelden.',
    devicesCount: 'Auf {n} Geräten angemeldet.',
    devicesOne: 'Nur auf diesem Gerät angemeldet.',
    twoFactor: 'Zwei-Faktor-Anmeldung',
    twoFactorOff: 'Aus. Mit einem Code aus einer App ist dein Konto deutlich besser geschützt.',
    twoFactorOn: 'An. Bei der Anmeldung brauchst du den Code aus deiner App.',
    twoFactorRequired: 'An. Deine Schule verlangt sie für dein Konto.',
    twoFactorSetup: 'Einrichten',
    twoFactorDisable: 'Ausschalten',
    tfTitle: 'Zwei-Faktor-Anmeldung',
    tfIntro: 'Zusätzlich zum Passwort brauchst du bei der Anmeldung einen 6-stelligen Code. Eine App auf deinem Handy erzeugt ihn alle 30 Sekunden neu. Wer nur dein Passwort kennt, kommt so nicht in dein Konto.',
    tfApps: 'Du brauchst eine Authenticator-App, zum Beispiel Google Authenticator, Microsoft Authenticator oder 2FAS.',
    tfRenewNote: 'Das gilt für WebUntis und für POKYH. POKYH fragt dich nach dem Code, wenn du dich neu anmeldest.',
    tfStart: 'Weiter',
    tfScan: 'Scanne den QR-Code mit deiner Authenticator-App.',
    tfManual: 'Kein Scannen möglich? Gib diesen Schlüssel in der App ein:',
    tfCopy: 'Kopieren',
    tfCopied: 'Kopiert',
    tfCode: 'Code aus der App',
    tfCodeHint: 'Der 6-stellige Code, den die App gerade zeigt.',
    tfEnable: 'Einschalten',
    tfEnabling: 'Wird eingeschaltet…',
    tfDoneTitle: 'Eingeschaltet',
    tfDone: 'Ab jetzt fragen WebUntis und POKYH bei der Anmeldung nach dem Code aus deiner App.',
    tfDoneNote: 'Lösche den Eintrag in der App nicht. Ohne ihn kommst du nicht mehr in dein Konto.',
    tfDisableTitle: 'Zwei-Faktor-Anmeldung ausschalten?',
    tfDisableText: 'Dann reicht zur Anmeldung wieder dein Passwort. Dein Konto ist damit schlechter geschützt.',
    tfDisabling: 'Wird ausgeschaltet…',
    tfCodeFormat: 'Der Code hat 6 Ziffern.',
    email: 'E-Mail-Adresse',
    emailNone: 'Keine hinterlegt. Ohne E-Mail-Adresse kannst du dein Passwort nicht zurücksetzen.',
    emailChange: 'Ändern',
    emailAdd: 'Hinzufügen',
    emailLead: 'Hierhin schickt WebUntis Links zum Zurücksetzen deines Passworts und, wenn du willst, deine Nachrichten.',
    emailSave: 'Speichern',
    emailSaving: 'Wird gespeichert…',
    emailSaved: 'Gespeichert. Schickt WebUntis dir eine Bestätigung, öffne den Link in der E-Mail.',
    emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    forward: 'Nachrichten auch per E-Mail',
    forwardHint: 'WebUntis schickt dir neue Nachrichten zusätzlich an deine E-Mail-Adresse.',
    forwardNeedsEmail: 'Dafür brauchst du zuerst eine E-Mail-Adresse.',
    untisLanguage: 'Sprache in WebUntis',
    untisLanguageHint: 'Für WebUntis selbst und seine E-Mails. POKYH hat oben seine eigene Sprache.',
    accountError: 'Dein WebUntis-Konto konnte gerade nicht geladen werden.',
    exportTitle: 'Meine Daten herunterladen',
    exportHint: 'Alles, was POKYH über dich speichert, sofort als Datei. Stundenplan, Noten und Nachrichten speichert POKYH nicht.',
    exportButton: 'Herunterladen',
    exporting: 'Wird erstellt…',
    exportDone: 'Heruntergeladen',
    devicesTitle: 'Geräte & Anmeldungen',
    devicesLead: 'Hier siehst du, wo du bei POKYH angemeldet bist. Kennst du ein Gerät nicht? Melde es ab und ändere dein Passwort.',
    backToSettings: 'Einstellungen',
    thisDevice: 'Dieses Gerät',
    otherDevices: 'Andere Geräte',
    noOthers: 'Du bist auf keinem anderen Gerät angemeldet.',
    signOut: 'Abmelden',
    signOutDevice: '{name} abmelden',
    signOutOthers: 'Alle anderen abmelden',
    signOutOthersConfirm: 'Wirklich abmelden?',
    signedOutOthers: 'Alle anderen Geräte sind abgemeldet.',
    activeNow: 'Gerade aktiv',
    lastActive: 'Zuletzt aktiv {when}',
    since: 'Angemeldet seit {date}',
    unknownPlace: 'Ort unbekannt',
    unknownDevice: 'Unbekanntes Gerät',
    clientApp: 'POKYH-App',
    clientWeb: 'Browser',
    clientPwa: 'Installierte Website',
    clientOther: 'Sonstiges',
    history: 'Anmeldungen',
    historyHint: 'Deine Anmeldungen der letzten {days} Tage.',
    historyEmpty: 'Noch keine Anmeldungen gespeichert.',
    showMore: 'Mehr anzeigen',
    methodWebuntis: 'mit Passwort',
    methodOffice: 'mit Office 365',
    methodLocal: 'mit POKYH-Passwort',
    methodRegister: 'Konto erstellt',
    methodQr: 'mit der POKYH-App (QR-Code)',
    methodPasskey: 'mit der Gerätesperre',
    unlockTitleIos: 'Anmelden mit Face ID',
    unlockTitleAndroid: 'Anmelden mit Fingerabdruck',
    unlockTitleOther: 'Anmelden mit der Gerätesperre',
    unlockHintIos: 'Statt des Passworts reicht Face ID, Touch ID oder der Code deines Geräts. Gilt nur hier, in der App auf dem Startbildschirm.',
    unlockHintAndroid: 'Statt des Passworts reicht dein Fingerabdruck, dein Gesicht oder die PIN deines Handys. Gilt nur hier, in der App auf dem Startbildschirm.',
    unlockHintOther: 'Statt des Passworts reicht die Sperre dieses Geräts. Gilt nur hier, in der App auf dem Startbildschirm.',
    unlockOn: 'Einschalten',
    unlockOff: 'Ausschalten',
    unlockOtherAccount: 'Auf diesem Gerät ist es gerade für {name} eingeschaltet. Schaltest du es ein, gilt es stattdessen für dich.',
    unlockPasswordNeeded: 'Melde dich einmal ab und mit deinem Passwort wieder an, dann lässt es sich einschalten.',
    unlockFailed: 'Das hat nicht geklappt. Versuche es noch einmal.',
    unlockTapAgain: 'Tippe bitte noch einmal auf „Einschalten“.',
    loadError: 'Konnte gerade nicht geladen werden.',
    retry: 'Nochmal versuchen',
    failed: 'Das hat nicht geklappt. Versuch es noch einmal.',
    cancel: 'Abbrechen',
    close: 'Schließen',
  },
  it: {
    accountSecurity: "Account e sicurezza",
    passwordTitle: "Password",
    passwordCardHint: "La tua password di WebUntis. Vale anche nell’app di WebUntis.",
    passwordChange: "Cambia",
    passwordForgot: "Dimenticata?",
    stateOn: "Attivo",
    stateOff: "Disattivo",
    recommended: "Consigliato",
    missing: "Manca",
    devicesView: "Vedi",
    twoFactorCardOff: "Protegge il tuo account con un codice da un’app, anche se qualcuno conosce la tua password.",
    twoFactorCardOn: "A ogni accesso ti serve il codice della tua app.",
    emailCardHint: "Per reimpostare la password e ricevere i messaggi via e-mail.",
    stepOf: "Passo {n} di {total}",
    security: 'Sicurezza',
    account: 'Account',
    devices: 'Dispositivi e accessi',
    devicesHint: 'Dove sei connesso, con luogo e ora. Puoi disconnettere ogni dispositivo.',
    devicesCount: 'Connesso su {n} dispositivi.',
    devicesOne: 'Connesso solo su questo dispositivo.',
    twoFactor: 'Accesso a due fattori',
    twoFactorOff: 'Disattivato. Con un codice da un’app il tuo account è molto più protetto.',
    twoFactorOn: 'Attivo. All’accesso ti serve il codice della tua app.',
    twoFactorRequired: 'Attivo. La tua scuola lo richiede per il tuo account.',
    twoFactorSetup: 'Configura',
    twoFactorDisable: 'Disattiva',
    tfTitle: 'Accesso a due fattori',
    tfIntro: 'Oltre alla password, all’accesso ti serve un codice di 6 cifre. Un’app sul telefono lo genera ogni 30 secondi. Chi conosce solo la tua password non entra nel tuo account.',
    tfApps: 'Ti serve un’app di autenticazione, per esempio Google Authenticator, Microsoft Authenticator o 2FAS.',
    tfRenewNote: 'Vale per WebUntis e per POKYH. POKYH ti chiede il codice quando accedi di nuovo.',
    tfStart: 'Avanti',
    tfScan: 'Scansiona il codice QR con la tua app di autenticazione.',
    tfManual: 'Non puoi scansionare? Inserisci questa chiave nell’app:',
    tfCopy: 'Copia',
    tfCopied: 'Copiato',
    tfCode: 'Codice dell’app',
    tfCodeHint: 'Il codice di 6 cifre che l’app mostra adesso.',
    tfEnable: 'Attiva',
    tfEnabling: 'Attivazione…',
    tfDoneTitle: 'Attivato',
    tfDone: 'D’ora in poi WebUntis e POKYH chiedono all’accesso il codice della tua app.',
    tfDoneNote: 'Non eliminare la voce nell’app. Senza di essa non entri più nel tuo account.',
    tfDisableTitle: 'Disattivare l’accesso a due fattori?',
    tfDisableText: 'Per accedere basterà di nuovo la password. Il tuo account sarà meno protetto.',
    tfDisabling: 'Disattivazione…',
    tfCodeFormat: 'Il codice ha 6 cifre.',
    email: 'Indirizzo e-mail',
    emailNone: 'Nessuno. Senza e-mail non puoi reimpostare la password.',
    emailChange: 'Modifica',
    emailAdd: 'Aggiungi',
    emailLead: 'Qui WebUntis invia i link per reimpostare la password e, se vuoi, i tuoi messaggi.',
    emailSave: 'Salva',
    emailSaving: 'Salvataggio…',
    emailSaved: 'Salvato. Se WebUntis ti invia una conferma, apri il link nell’e-mail.',
    emailInvalid: 'Inserisci un indirizzo e-mail valido.',
    forward: 'Messaggi anche via e-mail',
    forwardHint: 'WebUntis ti invia i nuovi messaggi anche al tuo indirizzo e-mail.',
    forwardNeedsEmail: 'Prima ti serve un indirizzo e-mail.',
    untisLanguage: 'Lingua in WebUntis',
    untisLanguageHint: 'Per WebUntis e le sue e-mail. POKYH ha la sua lingua più sopra.',
    accountError: 'Il tuo account WebUntis non si è potuto caricare.',
    exportTitle: 'Scarica i miei dati',
    exportHint: 'Tutto ciò che POKYH salva su di te, subito come file. Orario, voti e messaggi POKYH non li salva.',
    exportButton: 'Scarica',
    exporting: 'Creazione…',
    exportDone: 'Scaricato',
    devicesTitle: 'Dispositivi e accessi',
    devicesLead: 'Qui vedi dove sei connesso a POKYH. Non riconosci un dispositivo? Disconnettilo e cambia la password.',
    backToSettings: 'Impostazioni',
    thisDevice: 'Questo dispositivo',
    otherDevices: 'Altri dispositivi',
    noOthers: 'Non sei connesso su nessun altro dispositivo.',
    signOut: 'Disconnetti',
    signOutDevice: 'Disconnetti {name}',
    signOutOthers: 'Disconnetti tutti gli altri',
    signOutOthersConfirm: 'Disconnettere davvero?',
    signedOutOthers: 'Tutti gli altri dispositivi sono disconnessi.',
    activeNow: 'Attivo ora',
    lastActive: 'Ultima attività {when}',
    since: 'Connesso dal {date}',
    unknownPlace: 'Luogo sconosciuto',
    unknownDevice: 'Dispositivo sconosciuto',
    clientApp: 'App POKYH',
    clientWeb: 'Browser',
    clientPwa: 'Sito installato',
    clientOther: 'Altro',
    history: 'Accessi',
    historyHint: 'I tuoi accessi degli ultimi {days} giorni.',
    historyEmpty: 'Nessun accesso salvato finora.',
    showMore: 'Mostra di più',
    methodWebuntis: 'con password',
    methodOffice: 'con Office 365',
    methodLocal: 'con password POKYH',
    methodRegister: 'Account creato',
    methodQr: 'con l’app POKYH (codice QR)',
    methodPasskey: 'con il blocco del dispositivo',
    unlockTitleIos: 'Accesso con Face ID',
    unlockTitleAndroid: 'Accesso con l’impronta',
    unlockTitleOther: 'Accesso con il blocco del dispositivo',
    unlockHintIos: 'Al posto della password bastano Face ID, Touch ID o il codice del dispositivo. Vale solo qui, nell’app sulla schermata Home.',
    unlockHintAndroid: 'Al posto della password bastano la tua impronta, il tuo volto o il PIN del telefono. Vale solo qui, nell’app sulla schermata Home.',
    unlockHintOther: 'Al posto della password basta il blocco di questo dispositivo. Vale solo qui, nell’app sulla schermata Home.',
    unlockOn: 'Attiva',
    unlockOff: 'Disattiva',
    unlockOtherAccount: 'Su questo dispositivo è attivo per {name}. Se lo attivi, varrà invece per te.',
    unlockPasswordNeeded: 'Esci e accedi di nuovo con la password, poi puoi attivarlo.',
    unlockFailed: 'Non ha funzionato. Riprova.',
    unlockTapAgain: 'Tocca di nuovo «Attiva», per favore.',
    loadError: 'Non è stato possibile caricare.',
    retry: 'Riprova',
    failed: 'Non è andato a buon fine. Riprova.',
    cancel: 'Annulla',
    close: 'Chiudi',
  },
  en: {
    accountSecurity: "Account & security",
    passwordTitle: "Password",
    passwordCardHint: "Your WebUntis password. It also applies in the WebUntis app.",
    passwordChange: "Change",
    passwordForgot: "Forgot it?",
    stateOn: "On",
    stateOff: "Off",
    recommended: "Recommended",
    missing: "Missing",
    devicesView: "View",
    twoFactorCardOff: "Protects your account with a code from an app, even if someone knows your password.",
    twoFactorCardOn: "Every sign-in needs the code from your app.",
    emailCardHint: "For resetting your password and getting messages by e-mail.",
    stepOf: "Step {n} of {total}",
    security: 'Security',
    account: 'Account',
    devices: 'Devices & sign-ins',
    devicesHint: 'Where you are signed in, with place and time. You can sign out any device.',
    devicesCount: 'Signed in on {n} devices.',
    devicesOne: 'Signed in on this device only.',
    twoFactor: 'Two-factor sign-in',
    twoFactorOff: 'Off. A code from an app protects your account much better.',
    twoFactorOn: 'On. Signing in needs the code from your app.',
    twoFactorRequired: 'On. Your school requires it for your account.',
    twoFactorSetup: 'Set up',
    twoFactorDisable: 'Turn off',
    tfTitle: 'Two-factor sign-in',
    tfIntro: 'Besides your password, signing in needs a 6-digit code. An app on your phone makes a new one every 30 seconds. Someone who only knows your password can’t get into your account.',
    tfApps: 'You need an authenticator app, for example Google Authenticator, Microsoft Authenticator or 2FAS.',
    tfRenewNote: 'This applies to WebUntis and POKYH. POKYH asks for the code when you sign in again.',
    tfStart: 'Continue',
    tfScan: 'Scan the QR code with your authenticator app.',
    tfManual: 'Can’t scan? Enter this key in the app:',
    tfCopy: 'Copy',
    tfCopied: 'Copied',
    tfCode: 'Code from the app',
    tfCodeHint: 'The 6-digit code the app shows right now.',
    tfEnable: 'Turn on',
    tfEnabling: 'Turning on…',
    tfDoneTitle: 'Turned on',
    tfDone: 'From now on WebUntis and POKYH ask for the code from your app when you sign in.',
    tfDoneNote: 'Don’t delete the entry in the app. Without it you can’t get into your account.',
    tfDisableTitle: 'Turn off two-factor sign-in?',
    tfDisableText: 'Your password alone will be enough to sign in again. Your account will be less protected.',
    tfDisabling: 'Turning off…',
    tfCodeFormat: 'The code has 6 digits.',
    email: 'E-mail address',
    emailNone: 'None yet. Without an e-mail address you can’t reset your password.',
    emailChange: 'Change',
    emailAdd: 'Add',
    emailLead: 'WebUntis sends password reset links here and, if you like, your messages.',
    emailSave: 'Save',
    emailSaving: 'Saving…',
    emailSaved: 'Saved. If WebUntis sends you a confirmation, open the link in the e-mail.',
    emailInvalid: 'Please enter a valid e-mail address.',
    forward: 'Messages by e-mail too',
    forwardHint: 'WebUntis also sends new messages to your e-mail address.',
    forwardNeedsEmail: 'You need an e-mail address for this first.',
    untisLanguage: 'Language in WebUntis',
    untisLanguageHint: 'For WebUntis itself and its e-mails. POKYH has its own language above.',
    accountError: 'Your WebUntis account could not be loaded right now.',
    exportTitle: 'Download my data',
    exportHint: 'Everything POKYH keeps about you, right away as a file. POKYH doesn’t keep your timetable, grades or messages.',
    exportButton: 'Download',
    exporting: 'Preparing…',
    exportDone: 'Downloaded',
    devicesTitle: 'Devices & sign-ins',
    devicesLead: 'This is where you are signed in to POKYH. Don’t recognise a device? Sign it out and change your password.',
    backToSettings: 'Settings',
    thisDevice: 'This device',
    otherDevices: 'Other devices',
    noOthers: 'You aren’t signed in on any other device.',
    signOut: 'Sign out',
    signOutDevice: 'Sign out {name}',
    signOutOthers: 'Sign out all others',
    signOutOthersConfirm: 'Really sign out?',
    signedOutOthers: 'All other devices are signed out.',
    activeNow: 'Active now',
    lastActive: 'Last active {when}',
    since: 'Signed in since {date}',
    unknownPlace: 'Unknown place',
    unknownDevice: 'Unknown device',
    clientApp: 'POKYH app',
    clientWeb: 'Browser',
    clientPwa: 'Installed website',
    clientOther: 'Other',
    history: 'Sign-ins',
    historyHint: 'Your sign-ins of the last {days} days.',
    historyEmpty: 'No sign-ins saved yet.',
    showMore: 'Show more',
    methodWebuntis: 'with password',
    methodOffice: 'with Office 365',
    methodLocal: 'with POKYH password',
    methodRegister: 'Account created',
    methodQr: 'with the POKYH app (QR code)',
    methodPasskey: 'with the device lock',
    unlockTitleIos: 'Sign in with Face ID',
    unlockTitleAndroid: 'Sign in with your fingerprint',
    unlockTitleOther: 'Sign in with the device lock',
    unlockHintIos: 'Instead of your password, Face ID, Touch ID or your device passcode is enough. Only here, in the app on your home screen.',
    unlockHintAndroid: 'Instead of your password, your fingerprint, your face or your phone’s PIN is enough. Only here, in the app on your home screen.',
    unlockHintOther: 'Instead of your password, this device’s lock is enough. Only here, in the app on your home screen.',
    unlockOn: 'Turn on',
    unlockOff: 'Turn off',
    unlockOtherAccount: 'On this device it is on for {name}. Turning it on makes it yours instead.',
    unlockPasswordNeeded: 'Sign out and back in with your password once, then you can turn it on.',
    unlockFailed: 'That didn’t work. Try again.',
    unlockTapAgain: 'Please tap “Turn on” again.',
    loadError: 'Could not be loaded right now.',
    retry: 'Try again',
    failed: 'That didn’t work. Please try again.',
    cancel: 'Cancel',
    close: 'Close',
  },
  lld: {
    accountSecurity: "Account y segurëza",
    passwordTitle: "Password",
    passwordCardHint: "Tia password de WebUntis. La vel nce tla app de WebUntis.",
    passwordChange: "Mudé",
    passwordForgot: "Desmenteda?",
    stateOn: "Mpià",
    stateOff: "Destudà",
    recommended: "Cunsià",
    missing: "Mancia",
    devicesView: "Udëi",
    twoFactorCardOff: "Prutej ti account cun n codesc da na app, nce sce valgugn cunësc tia password.",
    twoFactorCardOn: "Per uni jida ite te uel l codesc de tia app.",
    emailCardHint: "Per mëter zeruch la password y per nutizies per e-mail.",
    stepOf: "Pas {n} de {total}",
    security: 'Segurëza',
    account: 'Account',
    devices: 'Aparac y jides ite',
    devicesHint: 'Ulache tu ies ite, cun luech y ëura. Tu pos fé jì ora uni aparat.',
    devicesCount: 'Ite sun {n} aparac.',
    devicesOne: 'Mé ite sun chësc aparat.',
    twoFactor: 'Azes a doi fatores',
    twoFactorOff: 'Destudà. Cun n codesc da na app ie ti account dassën miec prutegì.',
    twoFactorOn: 'Mpià. Per jì ite te uel l codesc de tia app.',
    twoFactorRequired: 'Mpià. Tia scola l uel per ti account.',
    twoFactorSetup: 'Mpusté',
    twoFactorDisable: 'Destudé',
    tfTitle: 'Azes a doi fatores',
    tfIntro: 'Dancà dla password te uel per jì ite n codesc de 6 zifres. Na app sun ti telefonin fej uni 30 secundes n codesc nuef. Chi che cunësc mé tia password ne vën nia te ti account.',
    tfApps: 'Te uel na app de autenticazion, per ejëmpl Google Authenticator, Microsoft Authenticator o 2FAS.',
    tfRenewNote: 'Chësc vel per WebUntis y per POKYH. POKYH te damanda l codesc canche tu ves inò ite.',
    tfStart: 'Inant',
    tfScan: 'Scanerëia l codesc QR cun tia app de autenticazion.',
    tfManual: 'Ne pòs nia scanerië? Scrij chësta tlef tla app:',
    tfCopy: 'Cupië',
    tfCopied: 'Cupià',
    tfCode: 'Codesc dla app',
    tfCodeHint: 'L codesc de 6 zifres che la app mustra sën.',
    tfEnable: 'Mpië',
    tfEnabling: 'Vën mpià…',
    tfDoneTitle: 'Mpià',
    tfDone: 'Da sën inant damanda WebUntis y POKYH per jì ite l codesc de tia app.',
    tfDoneNote: 'Ne scancelé nia la vëija tla app. Zënza ne vëns nia plu te ti account.',
    tfDisableTitle: 'Destudé l azes a doi fatores?',
    tfDisableText: 'Per jì ite basta pona inò tia password. Ti account ie nscì manco prutegì.',
    tfDisabling: 'Vën destudà…',
    tfCodeFormat: 'L codesc à 6 zifres.',
    email: 'Adressa e-mail',
    emailNone: 'Deguna. Zënza adressa e-mail ne pòs nia mëter zeruch tia password.',
    emailChange: 'Mudé',
    emailAdd: 'Junté',
    emailLead: 'Chilò ti manda WebUntis i link per mëter zeruch la password y, sce tu ues, tia nutizies.',
    emailSave: 'Salvé',
    emailSaving: 'Vën salvà…',
    emailSaved: 'Salvà. Sce WebUntis te manda na cunferma, giaurì l link tla e-mail.',
    emailInvalid: 'Scrij n’adressa e-mail che va.',
    forward: 'Nutizies nce per e-mail',
    forwardHint: 'WebUntis te manda la nutizies nueves nce a tia adressa e-mail.',
    forwardNeedsEmail: 'Per chësc te uel dant n’adressa e-mail.',
    untisLanguage: 'Lingaz te WebUntis',
    untisLanguageHint: 'Per WebUntis y si e-mail. POKYH à si lingaz sëura.',
    accountError: 'Ti account WebUntis ne n’à nia pudù vester ciarià.',
    exportTitle: 'Ciarië ju mi dac',
    exportHint: 'Dut chël che POKYH salva sun te, sobito coche file. Urar, notes y nutizies ne salva POKYH nia.',
    exportButton: 'Ciarië ju',
    exporting: 'Vën fat…',
    exportDone: 'Ciarià ju',
    devicesTitle: 'Aparac y jides ite',
    devicesLead: 'Chilò ves ulache tu ies ite te POKYH. Ne cunëssus nia n aparat? Fal jì ora y muda tia password.',
    backToSettings: 'Mpustazions',
    thisDevice: 'Chësc aparat',
    otherDevices: 'D’autri aparac',
    noOthers: 'Tu ne ies sun degun auter aparat ite.',
    signOut: 'Jì ora',
    signOutDevice: 'Fé jì ora {name}',
    signOutOthers: 'Fé jì ora duc i autri',
    signOutOthersConfirm: 'Propi fé jì ora?',
    signedOutOthers: 'Duc i autri aparac ie jic ora.',
    activeNow: 'Sën atif',
    lastActive: 'Ultima ota atif {when}',
    since: 'Ite dal {date}',
    unknownPlace: 'Luech nia cunesciù',
    unknownDevice: 'Aparat nia cunesciù',
    clientApp: 'App POKYH',
    clientWeb: 'Browser',
    clientPwa: 'Plata web nstaleda',
    clientOther: 'Auter',
    history: 'Jides ite',
    historyHint: 'Tia jides ite di ultimi {days} dis.',
    historyEmpty: 'Mo deguna jida ite salveda.',
    showMore: 'Mustré de plu',
    methodWebuntis: 'cun password',
    methodOffice: 'cun Office 365',
    methodLocal: 'cun password POKYH',
    methodRegister: 'Account fat',
    methodQr: 'cun l’app POKYH (code QR)',
    loadError: 'Ne n’à nia pudù vester ciarià.',
    retry: 'Pruvé mo n iede',
    failed: 'Ne n’ie nia jit. Prova mo n iede.',
    cancel: 'Anulé',
    close: 'Stlù',
  },
};
