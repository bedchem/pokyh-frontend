import type { Dictionary } from '../dictionary';

export type ProfileKey =
  | 'title'
  | 'school'
  | 'copied'
  | 'light'
  | 'dark'
  | 'system'
  | 'account'
  | 'username'
  | 'studentId'
  | 'class'
  | 'schoolLabel'
  | 'userId'
  | 'classId'
  | 'appearance'
  | 'app'
  | 'version'
  | 'confirmLogout'
  | 'logout';

export const profileDict: Dictionary<ProfileKey> = {
  de: {
    title: 'Profil',
    school: 'LBS Brixen',
    copied: 'Kopiert ✓',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    account: 'Konto',
    username: 'Benutzername',
    studentId: 'Schüler-ID',
    class: 'Klasse',
    schoolLabel: 'Schule',
    userId: 'Benutzer-ID',
    classId: 'Klassen-ID',
    appearance: 'Darstellung',
    app: 'App',
    version: 'Version',
    confirmLogout: 'Wirklich abmelden?',
    logout: 'Abmelden',
  },
  it: {
    title: 'Profilo',
    school: 'LBS Bressanone',
    copied: 'Copiato ✓',
    light: 'Chiaro',
    dark: 'Scuro',
    system: 'Sistema',
    account: 'Account',
    username: 'Nome utente',
    studentId: 'ID studente',
    class: 'Classe',
    schoolLabel: 'Scuola',
    userId: 'ID utente',
    classId: 'ID classe',
    appearance: 'Aspetto',
    app: 'App',
    version: 'Versione',
    confirmLogout: 'Vuoi davvero uscire?',
    logout: 'Esci',
  },
  en: {
    title: 'Profile',
    school: 'LBS Brixen',
    copied: 'Copied ✓',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    account: 'Account',
    username: 'Username',
    studentId: 'Student ID',
    class: 'Class',
    schoolLabel: 'School',
    userId: 'User ID',
    classId: 'Class ID',
    appearance: 'Appearance',
    app: 'App',
    version: 'Version',
    confirmLogout: 'Really log out?',
    logout: 'Log out',
  },
  lld: {
    title: "Profil",
    school: "LBS Porsenù",
    copied: "Cupià ✓",
    light: "Cler",
    dark: "Scur",
    system: "Sistem",
    account: "Account",
    username: "Inuem dl utënt",
    studentId: "ID dl sculer",
    class: "Tlas",
    schoolLabel: "Scola",
    userId: "ID dl utënt",
    classId: "ID dla tlas",
    appearance: "Aspet",
    app: "App",
    version: "Verscion",
    confirmLogout: "Jì propi ora?",
    logout: "Jì ora",
  },
};
