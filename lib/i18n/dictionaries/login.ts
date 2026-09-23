import type { Dictionary } from '../dictionary';

export type LoginKey =
  | 'errMissing'
  | 'loggingIn'
  | 'almostDone'
  | 'checkingPokyh'
  | 'errFailed'
  | 'errNetwork'
  | 'headline1'
  | 'headline2'
  | 'tagline'
  | 'f1'
  | 'f2'
  | 'f3'
  | 'f4'
  | 'f5'
  | 'welcome'
  | 'subtitle'
  | 'cookieError'
  | 'cookieHint'
  | 'username'
  | 'password'
  | 'usernamePlaceholder'
  | 'showPassword'
  | 'hidePassword'
  | 'login'
  | 'hintBefore'
  | 'hintAfter'
  | 'imprint'
  | 'privacy';

export const loginDict: Dictionary<LoginKey> = {
  de: {
    errMissing: 'Bitte Benutzername und Passwort eingeben.',
    loggingIn: 'Anmelden…',
    almostDone: 'Fast fertig…',
    checkingPokyh: 'Prüfe POKYH-Konto…',
    errFailed: 'Anmeldung fehlgeschlagen.',
    errNetwork: 'Netzwerkfehler.',
    headline1: 'Deine Schule,',
    headline2: 'alles an einem Ort.',
    tagline: 'Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten für LBS Brixen Schüler.',
    f1: 'Stundenplan & Vertretungen',
    f2: 'Noten & Schnitt',
    f3: 'Mensa-Plan',
    f4: 'Klassen-Erinnerungen',
    f5: 'Nachrichten & Anhänge',
    welcome: 'Willkommen zurück',
    subtitle: 'Melde dich mit deinem WebUntis-Account an',
    cookieError: 'Bitte akzeptiere zuerst die Cookie-Einstellungen unten auf der Seite.',
    cookieHint: 'Zum Anmelden bitte zuerst die Cookie-Einstellungen bestätigen.',
    username: 'Benutzername',
    password: 'Passwort',
    usernamePlaceholder: 'Must-Maxi',
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort verbergen',
    login: 'Anmelden',
    hintBefore: 'Zugangsdaten werden ausschließlich an',
    hintAfter: 'übertragen. Ohne Schulaccount kannst du dich mit einem POKYH-Konto anmelden.',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
  },
  it: {
    errMissing: 'Inserisci nome utente e password.',
    loggingIn: 'Accesso in corso…',
    almostDone: 'Quasi fatto…',
    checkingPokyh: 'Verifica account POKYH…',
    errFailed: 'Accesso non riuscito.',
    errNetwork: 'Errore di rete.',
    headline1: 'La tua scuola,',
    headline2: 'tutto in un unico posto.',
    tagline: 'Orario, voti, mensa, assenze e messaggi per gli studenti della LBS Bressanone.',
    f1: 'Orario e supplenze',
    f2: 'Voti e media',
    f3: 'Menù della mensa',
    f4: 'Promemoria di classe',
    f5: 'Messaggi e allegati',
    welcome: 'Bentornato',
    subtitle: 'Accedi con il tuo account WebUntis',
    cookieError: 'Accetta prima le impostazioni dei cookie in fondo alla pagina.',
    cookieHint: 'Per accedere conferma prima le impostazioni dei cookie.',
    username: 'Nome utente',
    password: 'Password',
    usernamePlaceholder: 'Rossi-Mario',
    showPassword: 'Mostra password',
    hidePassword: 'Nascondi password',
    login: 'Accedi',
    hintBefore: 'Le credenziali vengono trasmesse esclusivamente a',
    hintAfter: '. Senza account scolastico puoi accedere con un account POKYH.',
    imprint: 'Note legali',
    privacy: 'Privacy',
  },
  en: {
    errMissing: 'Please enter your username and password.',
    loggingIn: 'Logging in…',
    almostDone: 'Almost done…',
    checkingPokyh: 'Checking POKYH account…',
    errFailed: 'Login failed.',
    errNetwork: 'Network error.',
    headline1: 'Your school,',
    headline2: 'all in one place.',
    tagline: 'Timetable, grades, cafeteria, absences and messages for LBS Brixen students.',
    f1: 'Timetable & substitutes',
    f2: 'Grades & average',
    f3: 'Cafeteria menu',
    f4: 'Class reminders',
    f5: 'Messages & attachments',
    welcome: 'Welcome back',
    subtitle: 'Log in with your WebUntis account',
    cookieError: 'Please accept the cookie settings at the bottom of the page first.',
    cookieHint: 'To log in, please confirm the cookie settings first.',
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'Doe-John',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    login: 'Log in',
    hintBefore: 'Your credentials are only sent to',
    hintAfter: '. Without a school account you can log in with a POKYH account.',
    imprint: 'Imprint',
    privacy: 'Privacy',
  },
  lld: {
    errMissing: "Scrij tl inuem dl utënt y la password.",
    loggingIn: "Se va ite…",
    almostDone: "Belau fat…",
    checkingPokyh: "Cntrol dl account POKYH…",
    errFailed: "Jì ite ne n’ie nia jit.",
    errNetwork: "Fal de rë.",
    headline1: "Tia scola,",
    headline2: "dut tl medem post.",
    tagline: "Urar, notes, mensa, assënzes y nutizies per i sculeies dla LBS Porsenù.",
    f1: "Urar y suplenzes",
    f2: "Notes y media",
    f3: "Menu dla mensa",
    f4: "Recurdanzes dla tlas",
    f5: "Nutizies y alegac",
    welcome: "Bënuni zeruch",
    subtitle: "Va ite cun ti account WebUntis",
    cookieError: "Azeta dant la mpustazions di cookies ju dala plata.",
    cookieHint: "Per jì ite cunfermea dant la mpustazions di cookies.",
    username: "Inuem dl utënt",
    password: "Password",
    usernamePlaceholder: "Must-Maxi",
    showPassword: "Mustré la password",
    hidePassword: "Scuende la password",
    login: "Jì ite",
    hintBefore: "I dac de azes vën mandei mé a",
    hintAfter: ". Zënza account dla scola pos jì ite cun n account POKYH.",
    imprint: "Impressum",
    privacy: "Privacy",
  },
};
