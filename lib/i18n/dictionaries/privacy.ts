import type { Dictionary } from '../dictionary';

// The privacy-notice acknowledgement (sign-in and PrivacyGate) and the
// personal usage statistics in the profile (chosen first in the cookie banner).
export type PrivacyKey =
  | 'gateTitle'
  | 'gateIntro'
  | 'readPolicy'
  | 'loginNotice'
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
    gateTitle: 'Datenschutzerklärung aktualisiert',
    gateIntro: 'Wir haben unsere Datenschutzerklärung aktualisiert (Stand {date}).',
    readPolicy: 'Datenschutzerklärung lesen',
    loginNotice: 'Wie POKYH mit deinen Daten umgeht, steht in der Datenschutzerklärung.',
    confirm: 'Verstanden',
    saving: 'Wird gespeichert…',
    saveError: 'Das hat nicht geklappt. Bitte versuche es noch einmal.',
    logout: 'Abmelden',
    profileSection: 'Datenschutz',
    profileUsage: 'Persönliche Nutzungsstatistik',
    profileUsageHint: 'Administratoren sehen für dein Konto, wie lange und auf welcher Plattform du POKYH nutzt, welche Seiten du öffnest und von welchen IP-Adressen und Orten du die Website und die Apps nutzt. Ausgeschaltet wird ohne deinen Namen gezählt, und dein Name wird aus den bisherigen Einträgen entfernt.',
    profileAck: 'Datenschutzerklärung angezeigt',
    profileAckNever: 'noch nicht angezeigt',
    profilePolicy: 'Datenschutzerklärung',
  },
  it: {
    gateTitle: 'Informativa sulla privacy aggiornata',
    gateIntro: 'Abbiamo aggiornato la nostra informativa sulla privacy (versione del {date}).',
    readPolicy: 'Leggi l’informativa sulla privacy',
    loginNotice: 'Come POKYH tratta i tuoi dati è spiegato nell’informativa sulla privacy.',
    confirm: 'Ho capito',
    saving: 'Salvataggio…',
    saveError: 'Non è andato a buon fine. Riprova.',
    logout: 'Esci',
    profileSection: 'Privacy',
    profileUsage: 'Statistiche di utilizzo personali',
    profileUsageHint: 'Gli amministratori vedono per il tuo account per quanto tempo e su quale piattaforma usi POKYH, quali pagine apri e da quali indirizzi IP e luoghi usi il sito e le app. Se disattivate, l’uso viene contato senza il tuo nome e il tuo nome viene rimosso dai dati raccolti finora.',
    profileAck: 'Informativa sulla privacy mostrata',
    profileAckNever: 'non ancora mostrata',
    profilePolicy: 'Informativa sulla privacy',
  },
  en: {
    gateTitle: 'Privacy notice updated',
    gateIntro: 'We have updated our privacy notice (as of {date}).',
    readPolicy: 'Read the privacy notice',
    loginNotice: 'How POKYH handles your data is explained in the privacy notice.',
    confirm: 'Got it',
    saving: 'Saving…',
    saveError: 'That didn’t work. Please try again.',
    logout: 'Sign out',
    profileSection: 'Privacy',
    profileUsage: 'Personal usage statistics',
    profileUsageHint: 'Administrators see for your account how long and on which platform you use POKYH, which pages you open and from which IP addresses and places you use the website and the apps. Turned off, use is counted without your name and your name is removed from what was collected so far.',
    profileAck: 'Privacy notice shown',
    profileAckNever: 'not shown yet',
    profilePolicy: 'Privacy notice',
  },
  lld: {
    gateTitle: 'Nfurmazion sun la privacy atualiseda',
    gateIntro: 'Nëus on atualisà nosta nfurmazion sun la privacy (stat {date}).',
    readPolicy: 'Liej la nfurmazion sun la privacy',
    loginNotice: 'Coche POKYH trata ti dac stà tla nfurmazion sun la privacy.',
    confirm: 'Capì',
    saving: 'Vën salvà…',
    saveError: 'Ne n’ie nia jit. Prova mo n’outa.',
    logout: 'Jì ora',
    profileSection: 'Privacy',
    profileUsage: 'Statistica de adurvanza persunela',
    profileUsageHint: 'I aministradëures ued per ti account tan giut y sun ciuna plataforma che tu adurveies POKYH, ciuna plates che tu daurjes y da ciuna adresses IP y luesc che tu adurveies la plata web y la app. Destudeda vëniel cuntà zënza ti inuem y ti inuem vën tut ora di dac tëuc su nchin a sën.',
    profileAck: 'Nfurmazion sun la privacy mustreda',
    profileAckNever: 'mo nia mustreda',
    profilePolicy: 'Nfurmazion sun la privacy',
  },
};
