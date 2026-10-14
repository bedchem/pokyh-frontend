import type { Dictionary } from '../dictionary';

// The privacy-notice acknowledgement (sign-in and PrivacyGate) and the
// usage-statistics choice (also in the profile).
export type PrivacyKey =
  | 'gateTitle'
  | 'gateIntro'
  | 'readPolicy'
  | 'ackLabel'
  | 'ackRequired'
  | 'usageLabel'
  | 'usageDesc'
  | 'confirm'
  | 'saving'
  | 'saveError'
  | 'logout'
  | 'profileSection'
  | 'profileUsage'
  | 'profileUsageHint'
  | 'profileAck'
  | 'profileAckNever'
  | 'profilePolicy';

export const privacyDict: Dictionary<PrivacyKey> = {
  de: {
    gateTitle: 'Datenschutz',
    gateIntro: 'Bitte lies unsere Datenschutzerklärung (Stand {date}) und bestätige sie, um POKYH zu nutzen.',
    readPolicy: 'Datenschutzerklärung lesen',
    ackLabel: 'Ich habe die Datenschutzerklärung gelesen.',
    ackRequired: 'Bitte bestätige zuerst, dass du die Datenschutzerklärung gelesen hast.',
    usageLabel: 'Nutzungsstatistik erlauben (freiwillig)',
    usageDesc: 'POKYH misst dann, wie lange und auf welcher Plattform du es nutzt und welche Seiten du öffnest. Administratoren können das für dein Konto sehen. Du kannst es jederzeit im Profil ausschalten – dann werden diese Daten gelöscht. Unter 14 Jahren nur mit Erlaubnis deiner Eltern.',
    confirm: 'Bestätigen',
    saving: 'Wird gespeichert…',
    saveError: 'Das hat nicht geklappt. Bitte versuche es noch einmal.',
    logout: 'Abmelden',
    profileSection: 'Datenschutz',
    profileUsage: 'Nutzungsstatistik',
    profileUsageHint: 'Wie lange und auf welcher Plattform du POKYH nutzt und welche Seiten du öffnest; Administratoren können das für dein Konto sehen. Ausschalten löscht die bisherigen Daten.',
    profileAck: 'Datenschutzerklärung bestätigt',
    profileAckNever: 'noch nicht bestätigt',
    profilePolicy: 'Datenschutzerklärung',
  },
  it: {
    gateTitle: 'Privacy',
    gateIntro: 'Leggi la nostra informativa sulla privacy (versione del {date}) e confermala per usare POKYH.',
    readPolicy: 'Leggi l’informativa sulla privacy',
    ackLabel: 'Ho letto l’informativa sulla privacy.',
    ackRequired: 'Conferma prima di aver letto l’informativa sulla privacy.',
    usageLabel: 'Consenti le statistiche di utilizzo (facoltativo)',
    usageDesc: 'POKYH misura per quanto tempo e su quale piattaforma lo usi e quali pagine apri. Gli amministratori possono vederlo per il tuo account. Puoi disattivarlo in qualsiasi momento nel profilo: questi dati vengono allora cancellati. Sotto i 14 anni solo con il permesso dei genitori.',
    confirm: 'Conferma',
    saving: 'Salvataggio…',
    saveError: 'Non è andato a buon fine. Riprova.',
    logout: 'Esci',
    profileSection: 'Privacy',
    profileUsage: 'Statistiche di utilizzo',
    profileUsageHint: 'Per quanto tempo e su quale piattaforma usi POKYH e quali pagine apri; gli amministratori possono vederlo per il tuo account. Disattivandole i dati raccolti finora vengono cancellati.',
    profileAck: 'Informativa sulla privacy confermata',
    profileAckNever: 'non ancora confermata',
    profilePolicy: 'Informativa sulla privacy',
  },
  en: {
    gateTitle: 'Privacy',
    gateIntro: 'Please read our privacy notice (as of {date}) and confirm it to use POKYH.',
    readPolicy: 'Read the privacy notice',
    ackLabel: 'I have read the privacy notice.',
    ackRequired: 'Please confirm first that you have read the privacy notice.',
    usageLabel: 'Allow usage statistics (optional)',
    usageDesc: 'POKYH then measures how long and on which platform you use it and which pages you open. Administrators can see this for your account. You can turn it off in your profile at any time — this data is then deleted. Under 14 only with your parents’ permission.',
    confirm: 'Confirm',
    saving: 'Saving…',
    saveError: 'That didn’t work. Please try again.',
    logout: 'Sign out',
    profileSection: 'Privacy',
    profileUsage: 'Usage statistics',
    profileUsageHint: 'How long and on which platform you use POKYH and which pages you open; administrators can see this for your account. Turning it off deletes the data collected so far.',
    profileAck: 'Privacy notice confirmed',
    profileAckNever: 'not confirmed yet',
    profilePolicy: 'Privacy notice',
  },
  lld: {
    gateTitle: 'Privacy',
    gateIntro: 'Liej nosta nfurmazion sun la privacy (stat {date}) y cunfermela per adurvé POKYH.',
    readPolicy: 'Liej la nfurmazion sun la privacy',
    ackLabel: 'I é liet la nfurmazion sun la privacy.',
    ackRequired: 'Cunferma dant che t’as liet la nfurmazion sun la privacy.',
    usageLabel: 'Permëter la statistica de adurvanza (facoltatif)',
    usageDesc: 'POKYH mesurea pona tan giut y sun ciuna plataforma che tu l adurveies y ciuna plates che tu daurjes. I aministradëures po l udëi per ti account. Tu l pos destudé uni mumënt tl profil – pona vën chisc dac scancelei. Sota i 14 ani mé cun l permës de ti genitores.',
    confirm: 'Cunfermé',
    saving: 'Vën salvà…',
    saveError: 'Ne n’ie nia jit. Prova mo n’outa.',
    logout: 'Jì ora',
    profileSection: 'Privacy',
    profileUsage: 'Statistica de adurvanza',
    profileUsageHint: 'Tan giut y sun ciuna plataforma che tu adurveies POKYH y ciuna plates che tu daurjes; i aministradëures po l udëi per ti account. Destudé scancela i dac tëuc su nchin a sën.',
    profileAck: 'Nfurmazion sun la privacy cunfermeda',
    profileAckNever: 'mo nia cunfermeda',
    profilePolicy: 'Nfurmazion sun la privacy',
  },
};
