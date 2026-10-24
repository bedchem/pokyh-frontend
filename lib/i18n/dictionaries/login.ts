import type { Dictionary } from '../dictionary';

// Sign-in page: pick the school, then sign in with the WebUntis account.
export type LoginKey =
  | 'home'
  | 'title'
  | 'subtitle'
  | 'serverShort'
  | 'ageShort'
  | 'privacyLink'
  | 'trust1'
  | 'trust2'
  | 'step1'
  | 'step2'
  | 'schoolLabel'
  | 'schoolPlaceholder'
  | 'schoolShort'
  | 'schoolTooMany'
  | 'schoolNone'
  | 'schoolError'
  | 'schoolRate'
  | 'schoolResults'
  | 'schoolLast'
  | 'schoolChange'
  | 'schoolClear'
  | 'loginTitle'
  | 'username'
  | 'password'
  | 'showPassword'
  | 'hidePassword'
  | 'login'
  | 'loggingIn'
  | 'almostDone'
  | 'checkingPokyh'
  | 'ageNote'
  | 'cookieHint'
  | 'cookieError'
  | 'errMissing'
  | 'errFailed'
  | 'errNetwork'
  | 'errBadCredentials'
  | 'errRefused'
  | 'errUnavailable'
  | 'errRate'
  | 'errSchool'
  | 'errAccount'
  | 'office'
  | 'or'
  | 'officeLead'
  | 'officeStep1'
  | 'officeStep2'
  | 'officeStep3'
  | 'officeOpenLogin'
  | 'officeOpenProfile'
  | 'officeAdmin'
  | 'officeUser'
  | 'officeKey'
  | 'officeKeyHint'
  | 'errKeyMissing'
  | 'errKeyBad'
  | 'errKeyInvalid'
  | 'imprint'
  | 'privacy'
  | 'terms'
  | 'mascotHello'
  | 'mascotHelloName'
  | 'mascotGo'
  | 'mascotOops'
  | 'mascotAngry'
  | 'mascotBack'
  | 'doorLabel'
  | 'roomLoading';

export const loginDict: Dictionary<LoginKey> = {
  de: {
    title: 'Anmelden',
    subtitle: 'Mit deinem WebUntis-Konto.',
    serverShort: 'Geht nur an {server}',
    ageShort: 'Ab 14 Jahren',
    privacyLink: 'Datenschutzerklärung',
    home: 'Zur Startseite',
    trust1: 'Dein Passwort geht nur an den WebUntis-Server deiner Schule.',
    trust2: 'Kostenlos, ohne Werbung, Open Source.',
    step1: 'Schule',
    step2: 'Anmelden',
    schoolLabel: 'Schule suchen',
    schoolPlaceholder: 'Schulname, Ort oder Adresse',
    schoolShort: 'Gib mindestens 3 Zeichen ein.',
    schoolTooMany: 'Zu viele Treffer. Ergänze den Ort oder die Postleitzahl.',
    schoolNone: 'Keine Schule gefunden. Prüf die Schreibweise oder such nach dem Ort.',
    schoolError: 'Die Schulsuche ist gerade nicht erreichbar. Versuch es gleich noch einmal.',
    schoolRate: 'Viele Suchen in kurzer Zeit. In einer Minute geht es weiter.',
    schoolResults: '{n} Schulen gefunden',
    schoolLast: 'Zuletzt gewählt',
    schoolChange: 'Andere Schule',
    schoolClear: 'Suche leeren',
    loginTitle: 'Melde dich an',
    username: 'Benutzername',
    password: 'Passwort',
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort verbergen',
    login: 'Anmelden',
    loggingIn: 'Anmelden…',
    almostDone: 'Fast fertig…',
    checkingPokyh: 'Prüfe POKYH-Konto…',
    ageNote: 'POKYH ist für Personen ab 14 Jahren. Bist du jünger, nutze POKYH nur mit dem Einverständnis deiner Eltern.',
    cookieHint: 'Bestätige zum Anmelden bitte zuerst die Cookie-Einstellungen unten.',
    cookieError: 'Bitte triff zuerst eine Auswahl in den Cookie-Einstellungen unten auf der Seite.',
    errMissing: 'Bitte Benutzername und Passwort eingeben.',
    errFailed: 'Die Anmeldung hat nicht geklappt.',
    errNetwork: 'Keine Verbindung. Prüf dein Internet und versuch es noch einmal.',
    mascotHello: 'Hallo!',
    mascotHelloName: 'Hallo, {name}!',
    mascotGo: "Los geht's!",
    mascotOops: 'Hoppla!',
    mascotAngry: 'Hey! So nicht!',
    mascotBack: 'Da bist du ja wieder!',
    doorLabel: 'Tür zu Raum A+2/05',
    roomLoading: 'Die Tür geht auf …',
    errBadCredentials: 'Benutzername oder Passwort ist falsch.',
    errRefused: 'WebUntis hat die Anmeldung abgelehnt. Melde dich einmal direkt bei WebUntis an, um den Grund zu sehen.',
    errUnavailable: 'WebUntis ist gerade nicht erreichbar. Versuch es später noch einmal.',
    errRate: 'Zu viele Versuche. Bitte warte 5 Minuten.',
    errSchool: 'Diese Schule ist nicht verfügbar. Wähle sie bitte neu aus.',
    errAccount: 'Dein Konto konnte bei POKYH nicht eingerichtet werden. Bitte wende dich an den Support.',
    office: 'Mit Office 365 anmelden',
    or: 'oder',
    officeLead: 'Dein Microsoft-Passwort braucht POKYH nicht. WebUntis gibt dir dafür einen Schlüssel für Apps:',
    officeStep1: 'Melde dich bei WebUntis mit „Office 365 Anmeldung“ an.',
    officeStep2: 'Öffne dein Profil, Reiter „Freigaben“. Tippe bei „Zugriff über Untis Mobile“ auf „Anzeigen“.',
    officeStep3: 'Übernimm „Benutzer“ und „Schlüssel“ hier. Du kannst auch alles auf einmal kopieren und einfügen.',
    officeOpenLogin: 'WebUntis öffnen',
    officeOpenProfile: 'Profil öffnen',
    officeAdmin: 'Steht dort, dass der Zugriff erst freigeschaltet werden muss, kann das nur deine Schule ändern.',
    officeUser: 'Benutzer',
    officeKey: 'Schlüssel',
    officeKeyHint: 'Geht nur an den WebUntis-Server deiner Schule.',
    errKeyMissing: 'Bitte Benutzer und Schlüssel eingeben.',
    errKeyBad: 'Benutzer oder Schlüssel ist falsch.',
    errKeyInvalid: 'Das ist kein gültiger Schlüssel. Kopiere ihn genau so, wie WebUntis ihn zeigt.',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
  },
  it: {
    title: 'Accedi',
    subtitle: 'Con il tuo account WebUntis.',
    serverShort: 'Va solo a {server}',
    ageShort: 'Dai 14 anni',
    privacyLink: 'Informativa sulla privacy',
    home: 'Alla pagina iniziale',
    trust1: 'La tua password va solo al server WebUntis della tua scuola.',
    trust2: 'Gratuita, senza pubblicità, open source.',
    step1: 'Scuola',
    step2: 'Accesso',
    schoolLabel: 'Cerca la scuola',
    schoolPlaceholder: 'Nome della scuola, città o indirizzo',
    schoolShort: 'Inserisci almeno 3 caratteri.',
    schoolTooMany: 'Troppi risultati. Aggiungi la città o il CAP.',
    schoolNone: 'Nessuna scuola trovata. Controlla come l’hai scritta o cerca per città.',
    schoolError: 'La ricerca delle scuole non è raggiungibile al momento. Riprova tra poco.',
    schoolRate: 'Molte ricerche in poco tempo. Tra un minuto puoi continuare.',
    schoolResults: '{n} scuole trovate',
    schoolLast: 'Scelta l’ultima volta',
    schoolChange: 'Altra scuola',
    schoolClear: 'Cancella ricerca',
    loginTitle: 'Accedi',
    username: 'Nome utente',
    password: 'Password',
    showPassword: 'Mostra password',
    hidePassword: 'Nascondi password',
    login: 'Accedi',
    loggingIn: 'Accesso in corso…',
    almostDone: 'Quasi fatto…',
    checkingPokyh: 'Verifica account POKYH…',
    ageNote: 'POKYH è per persone dai 14 anni in su. Se sei più giovane, usa POKYH solo con il consenso dei tuoi genitori.',
    cookieHint: 'Per accedere conferma prima le impostazioni dei cookie qui sotto.',
    cookieError: 'Fai prima una scelta nelle impostazioni dei cookie in fondo alla pagina.',
    errMissing: 'Inserisci nome utente e password.',
    errFailed: 'L’accesso non è riuscito.',
    errNetwork: 'Nessuna connessione. Controlla internet e riprova.',
    mascotHello: 'Ciao!',
    mascotHelloName: 'Ciao, {name}!',
    mascotGo: 'Si parte!',
    mascotOops: 'Ops!',
    mascotAngry: 'Ehi! Così no!',
    mascotBack: 'Eccoti di nuovo!',
    doorLabel: 'Porta dell’aula A+2/05',
    roomLoading: 'La porta si apre …',
    errBadCredentials: 'Nome utente o password errati.',
    errRefused: 'WebUntis ha rifiutato l’accesso. Accedi una volta direttamente a WebUntis per vedere il motivo.',
    errUnavailable: 'WebUntis non è raggiungibile al momento. Riprova più tardi.',
    errRate: 'Troppi tentativi. Attendi 5 minuti.',
    errSchool: 'Questa scuola non è disponibile. Selezionala di nuovo.',
    errAccount: 'Non è stato possibile configurare il tuo account su POKYH. Contatta il supporto.',
    office: 'Accedi con Office 365',
    or: 'oppure',
    officeLead: 'POKYH non ha bisogno della tua password Microsoft. WebUntis ti dà una chiave per le app:',
    officeStep1: 'Accedi a WebUntis con “Login Office 365”.',
    officeStep2: 'Apri il tuo profilo, scheda “Attivazioni”. In “Accesso da Untis Mobile” tocca “Mostrare”.',
    officeStep3: 'Riporta qui “Utente” e “Chiave”. Puoi anche copiare e incollare tutto in una volta.',
    officeOpenLogin: 'Apri WebUntis',
    officeOpenProfile: 'Apri il profilo',
    officeAdmin: 'Se lì c’è scritto che l’accesso deve prima essere attivato, solo la tua scuola può farlo.',
    officeUser: 'Utente',
    officeKey: 'Chiave',
    officeKeyHint: 'Va solo al server WebUntis della tua scuola.',
    errKeyMissing: 'Inserisci utente e chiave.',
    errKeyBad: 'Utente o chiave errati.',
    errKeyInvalid: 'Questa non è una chiave valida. Copiala esattamente come la mostra WebUntis.',
    imprint: 'Note legali',
    privacy: 'Privacy',
    terms: 'Condizioni d’uso',
  },
  en: {
    title: 'Sign in',
    subtitle: 'With your WebUntis account.',
    serverShort: 'Only sent to {server}',
    ageShort: 'Ages 14 and up',
    privacyLink: 'Privacy policy',
    home: 'To the home page',
    trust1: 'Your password only goes to your school’s WebUntis server.',
    trust2: 'Free, ad-free, open source.',
    step1: 'School',
    step2: 'Sign in',
    schoolLabel: 'Search for your school',
    schoolPlaceholder: 'School name, city or address',
    schoolShort: 'Type at least 3 characters.',
    schoolTooMany: 'Too many matches. Add the town or postcode.',
    schoolNone: 'No school found. Check the spelling or search by town.',
    schoolError: 'The school search is not reachable right now. Try again in a moment.',
    schoolRate: 'Lots of searches in a short time. You can carry on in a minute.',
    schoolResults: '{n} schools found',
    schoolLast: 'Picked last time',
    schoolChange: 'Other school',
    schoolClear: 'Clear search',
    loginTitle: 'Sign in',
    username: 'Username',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    login: 'Sign in',
    loggingIn: 'Signing in…',
    almostDone: 'Almost done…',
    checkingPokyh: 'Checking POKYH account…',
    ageNote: 'POKYH is for people aged 14 and over. If you are younger, only use POKYH with your parents’ consent.',
    cookieHint: 'To sign in, please confirm the cookie settings below first.',
    cookieError: 'Please make a choice in the cookie settings at the bottom of the page first.',
    errMissing: 'Please enter your username and password.',
    errFailed: 'Signing in did not work.',
    errNetwork: 'No connection. Check your internet and try again.',
    mascotHello: 'Hi!',
    mascotHelloName: 'Hi, {name}!',
    mascotGo: "Let's go!",
    mascotOops: 'Oops!',
    mascotAngry: 'Hey! Not cool!',
    mascotBack: 'There you are again!',
    doorLabel: 'Door to room A+2/05',
    roomLoading: 'The door opens …',
    errBadCredentials: 'Wrong username or password.',
    errRefused: 'WebUntis refused the sign-in. Sign in to WebUntis directly once to see why.',
    errUnavailable: 'WebUntis is not reachable right now. Try again later.',
    errRate: 'Too many attempts. Please wait 5 minutes.',
    errSchool: 'This school is not available. Please pick it again.',
    errAccount: 'Your account could not be set up at POKYH. Please contact support.',
    office: 'Sign in with Office 365',
    or: 'or',
    officeLead: 'POKYH does not need your Microsoft password. WebUntis gives you a key for apps instead:',
    officeStep1: 'Sign in to WebUntis with “Office 365 login”.',
    officeStep2: 'Open your profile, tab “Data access”. Under “Access via Untis Mobile”, tap “Display”.',
    officeStep3: 'Copy “User” and “Key” here. You can also copy and paste everything at once.',
    officeOpenLogin: 'Open WebUntis',
    officeOpenProfile: 'Open profile',
    officeAdmin: 'If it says the access has to be activated first, only your school can do that.',
    officeUser: 'User',
    officeKey: 'Key',
    officeKeyHint: 'Only sent to your school’s WebUntis server.',
    errKeyMissing: 'Please enter your user and key.',
    errKeyBad: 'Wrong user or key.',
    errKeyInvalid: 'That is not a valid key. Copy it exactly as WebUntis shows it.',
    imprint: 'Imprint',
    privacy: 'Privacy',
    terms: 'Terms of use',
  },
};
