import type { Dictionary } from '../dictionary';

export type CommonKey =
  | 'back'
  | 'retry'
  | 'login'
  | 'cancel'
  | 'save'
  | 'delete'
  | 'close'
  | 'loading'
  | 'oclock'
  // ErrorView
  | 'errSessionTitle'
  | 'errSessionDetail'
  | 'errOfflineTitle'
  | 'errOfflineDetail'
  | 'errGenericTitle'
  | 'errGenericDetail'
  // UntisGuard
  | 'untisTitle'
  | 'untisText'
  | 'untisLogin'
  // GuestCommentsLock
  | 'guestCommentsLocked'
  | 'nope'
  // Cookies
  | 'cookieDialog'
  | 'cookieTitle'
  | 'cookieText'
  | 'cookieTextAnalytics'
  | 'cookieMore'
  | 'cookiePolicyLink'
  | 'cookiePrivacyLink'
  | 'cookieCloseNecessary'
  | 'cookieNecessaryTitle'
  | 'cookieNecessaryDesc'
  | 'cookieAlwaysOn'
  | 'cookieStatsTitle'
  | 'cookieStatsDesc'
  | 'cookieGaTitle'
  | 'cookieGaDesc'
  | 'cookieSaveSelection'
  | 'cookieSettings'
  | 'cookieNecessaryOnly'
  | 'cookieAcceptAll'
  | 'cookieOpenSettings'
  // Footer
  | 'footerDisclaimer'
  | 'footerMadeBy'
  | 'footerImprint'
  | 'footerPrivacy'
  | 'footerCookies'
  | 'footerComparison';

export const commonDict: Dictionary<CommonKey> = {
  de: {
    back: 'Zurück',
    retry: 'Erneut versuchen',
    login: 'Anmelden',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    close: 'Schließen',
    loading: 'Wird geladen…',
    oclock: 'Uhr',
    errSessionTitle: 'Sitzung abgelaufen',
    errSessionDetail: 'Bitte melde dich erneut an.',
    errOfflineTitle: 'Keine Verbindung',
    errOfflineDetail: 'Überprüfe deine Internetverbindung und versuche es erneut.',
    errGenericTitle: 'Daten konnten nicht geladen werden',
    errGenericDetail: 'WebUntis ist gerade nicht erreichbar. Bitte versuche es später erneut.',
    untisTitle: 'Schulaccount erforderlich',
    untisText: 'Diese Funktion ist nur mit einem WebUntis-Schulaccount verfügbar. Melde dich mit deinem Schulaccount an, um Stundenplan, Noten und mehr zu sehen.',
    untisLogin: 'Mit Schulaccount anmelden',
    guestCommentsLocked: 'Melde dich an, um die Kommentare zu sehen',
    nope: 'Nö.',
    cookieDialog: 'Cookie-Einstellungen',
    cookieTitle: 'Cookies & Datenschutz',
    cookieText: 'POKYH nutzt notwendige Cookies für Anmeldung und Sicherheit und zählt anonym, wie es genutzt wird – ohne deinen Namen. Mit „Alle akzeptieren“ erlaubst du zusätzlich die persönliche Nutzungsstatistik; das hilft uns, POKYH zu verbessern.',
    cookieTextAnalytics: 'POKYH nutzt notwendige Cookies für Anmeldung und Sicherheit und zählt anonym, wie es genutzt wird – ohne deinen Namen. Mit „Alle akzeptieren“ erlaubst du zusätzlich die persönliche Nutzungsstatistik und Google Analytics; das hilft uns, POKYH zu verbessern.',
    cookieMore: 'Mehr erfahren',
    cookiePolicyLink: 'Cookie-Richtlinie',
    cookiePrivacyLink: 'Datenschutzerklärung',
    cookieCloseNecessary: 'Nur notwendige Cookies verwenden und schließen',
    cookieNecessaryTitle: 'Notwendig',
    cookieNecessaryDesc: 'Anmeldung, Sicherheit, deine Einstellungen und die anonyme Zählung ohne Namen.',
    cookieAlwaysOn: 'Immer aktiv',
    cookieStatsTitle: 'Persönliche Nutzungsstatistik',
    cookieStatsDesc: 'Administratoren sehen für dein Konto, wie lange und auf welcher Plattform du POKYH nutzt und welche Seiten du öffnest. Jederzeit widerrufbar. Unter 14 nur mit Erlaubnis deiner Eltern.',
    cookieGaTitle: 'Google Analytics',
    cookieGaDesc: 'Statistik über Google mit Cookies; Daten können in die USA übertragen werden.',
    cookieSaveSelection: 'Auswahl speichern',
    cookieSettings: 'Einstellungen',
    cookieNecessaryOnly: 'Nur notwendige',
    cookieAcceptAll: 'Alle akzeptieren',
    cookieOpenSettings: 'Cookie-Einstellungen öffnen',
    footerDisclaimer: 'POKYH ist ein eigenständiges Schülerprojekt und steht in keiner offiziellen Verbindung zur LBS Brixen, zum Berufsbildungszentrum Christian Josef Tschuggmall oder zu WebUntis / Untis GmbH. Die Anmeldung erfolgt über die WebUntis-Schnittstelle der LBS Brixen. Marken und Logos sind Eigentum ihrer jeweiligen Inhaber.',
    footerMadeBy: 'Made by',
    footerImprint: 'Impressum',
    footerPrivacy: 'Datenschutz',
    footerCookies: 'Cookies',
    footerComparison: 'Vergleich',
  },
  it: {
    back: 'Indietro',
    retry: 'Riprova',
    login: 'Accedi',
    cancel: 'Annulla',
    save: 'Salva',
    delete: 'Elimina',
    close: 'Chiudi',
    loading: 'Caricamento…',
    oclock: '',
    errSessionTitle: 'Sessione scaduta',
    errSessionDetail: 'Effettua di nuovo l’accesso.',
    errOfflineTitle: 'Nessuna connessione',
    errOfflineDetail: 'Controlla la tua connessione a Internet e riprova.',
    errGenericTitle: 'Impossibile caricare i dati',
    errGenericDetail: 'WebUntis al momento non è raggiungibile. Riprova più tardi.',
    untisTitle: 'Account scolastico richiesto',
    untisText: 'Questa funzione è disponibile solo con un account scolastico WebUntis. Accedi con il tuo account scolastico per vedere orario, voti e altro.',
    untisLogin: 'Accedi con l’account scolastico',
    guestCommentsLocked: 'Accedi per vedere i commenti',
    nope: 'Eh no.',
    cookieDialog: 'Impostazioni cookie',
    cookieTitle: 'Cookie e privacy',
    cookieText: 'POKYH usa cookie necessari per l’accesso e la sicurezza e conta in forma anonima come viene usato, senza il tuo nome. Con «Accetta tutto» consenti anche le statistiche di utilizzo personali, che ci aiutano a migliorare POKYH.',
    cookieTextAnalytics: 'POKYH usa cookie necessari per l’accesso e la sicurezza e conta in forma anonima come viene usato, senza il tuo nome. Con «Accetta tutto» consenti anche le statistiche di utilizzo personali e Google Analytics, che ci aiutano a migliorare POKYH.',
    cookieMore: 'Scopri di più',
    cookiePolicyLink: 'Informativa sui cookie',
    cookiePrivacyLink: 'Informativa sulla privacy',
    cookieCloseNecessary: 'Usa solo i cookie necessari e chiudi',
    cookieNecessaryTitle: 'Necessari',
    cookieNecessaryDesc: 'Accesso, sicurezza, le tue impostazioni e il conteggio anonimo senza nome.',
    cookieAlwaysOn: 'Sempre attivi',
    cookieStatsTitle: 'Statistiche di utilizzo personali',
    cookieStatsDesc: 'Gli amministratori vedono per il tuo account per quanto tempo e su quale piattaforma usi POKYH e quali pagine apri. Revocabile in qualsiasi momento. Sotto i 14 anni solo con il permesso dei genitori.',
    cookieGaTitle: 'Google Analytics',
    cookieGaDesc: 'Statistiche tramite Google con cookie; i dati possono essere trasferiti negli USA.',
    cookieSaveSelection: 'Salva selezione',
    cookieSettings: 'Impostazioni',
    cookieNecessaryOnly: 'Solo necessari',
    cookieAcceptAll: 'Accetta tutto',
    cookieOpenSettings: 'Apri impostazioni cookie',
    footerDisclaimer: 'POKYH è un progetto studentesco indipendente e non ha alcun legame ufficiale con la LBS Bressanone, il Centro di formazione professionale Christian Josef Tschuggmall o WebUntis / Untis GmbH. L’accesso avviene tramite l’interfaccia WebUntis della LBS Bressanone. Marchi e loghi appartengono ai rispettivi proprietari.',
    footerMadeBy: 'Realizzato da',
    footerImprint: 'Note legali',
    footerPrivacy: 'Privacy',
    footerCookies: 'Cookie',
    footerComparison: 'Confronto',
  },
  en: {
    back: 'Back',
    retry: 'Try again',
    login: 'Log in',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    loading: 'Loading…',
    oclock: '',
    errSessionTitle: 'Session expired',
    errSessionDetail: 'Please log in again.',
    errOfflineTitle: 'No connection',
    errOfflineDetail: 'Check your internet connection and try again.',
    errGenericTitle: 'Couldn’t load data',
    errGenericDetail: 'WebUntis is currently unreachable. Please try again later.',
    untisTitle: 'School account required',
    untisText: 'This feature is only available with a WebUntis school account. Log in with your school account to see your timetable, grades and more.',
    untisLogin: 'Log in with school account',
    guestCommentsLocked: 'Log in to see the comments',
    nope: 'Nope.',
    cookieDialog: 'Cookie settings',
    cookieTitle: 'Cookies & privacy',
    cookieText: 'POKYH uses necessary cookies for sign-in and security and counts anonymously how it is used — without your name. With “Accept all” you also allow the personal usage statistics, which help us improve POKYH.',
    cookieTextAnalytics: 'POKYH uses necessary cookies for sign-in and security and counts anonymously how it is used — without your name. With “Accept all” you also allow the personal usage statistics and Google Analytics, which help us improve POKYH.',
    cookieMore: 'Learn more',
    cookiePolicyLink: 'Cookie policy',
    cookiePrivacyLink: 'Privacy notice',
    cookieCloseNecessary: 'Use necessary cookies only and close',
    cookieNecessaryTitle: 'Necessary',
    cookieNecessaryDesc: 'Sign-in, security, your settings and the anonymous count without names.',
    cookieAlwaysOn: 'Always on',
    cookieStatsTitle: 'Personal usage statistics',
    cookieStatsDesc: 'Administrators see for your account how long and on which platform you use POKYH and which pages you open. Can be withdrawn at any time. Under 14 only with your parents’ permission.',
    cookieGaTitle: 'Google Analytics',
    cookieGaDesc: 'Statistics through Google with cookies; data may be transferred to the USA.',
    cookieSaveSelection: 'Save selection',
    cookieSettings: 'Settings',
    cookieNecessaryOnly: 'Necessary only',
    cookieAcceptAll: 'Accept all',
    cookieOpenSettings: 'Open cookie settings',
    footerDisclaimer: 'POKYH is an independent student project and has no official connection to LBS Brixen, the Christian Josef Tschuggmall vocational training centre or WebUntis / Untis GmbH. Login is handled through LBS Brixen’s WebUntis interface. Trademarks and logos belong to their respective owners.',
    footerMadeBy: 'Made by',
    footerImprint: 'Imprint',
    footerPrivacy: 'Privacy',
    footerCookies: 'Cookies',
    footerComparison: 'Comparison',
  },
  lld: {
    back: "Zeruch",
    retry: "Pruvé mo n iede",
    login: "Jì ite",
    cancel: "Anulé",
    save: "Salvé",
    delete: "Scancelé",
    close: "Stlù",
    loading: "Se cëria…",
    oclock: "",
    errSessionTitle: "Sesion finida",
    errSessionDetail: "Va mo n iede ite.",
    errOfflineTitle: "Deguna cunescion",
    errOfflineDetail: "Cntrolea tia cunescion a Internet y prova mo n iede.",
    errGenericTitle: "I dac ne n’à nia pudù vester ciariei",
    errGenericDetail: "WebUntis ne n’ie al mumënt nia arjonjibel. Prova plu tert mo n iede.",
    untisTitle: "Ie de bujën de n account dla scola",
    untisText: "Chësta funzion ie mé a dispuzion cun n account dla scola de WebUntis. Va ite cun ti account dla scola per udëi urar, notes y de plu.",
    untisLogin: "Jì ite cun l account dla scola",
    guestCommentsLocked: "Va ite per udëi i cumenc",
    nope: "No.",
    cookieDialog: "Mpustazions di cookies",
    cookieTitle: "Cookies y privacy",
    cookieText: "POKYH adurvea cookies necessars per jì ite y per la segurëza y conta anonimamënter coche l vën adurvà – zënza ti inuem. Cun „Azeté dut“ permëtes nce la statistica de adurvanza persunela, che nes juda a miuré POKYH.",
    cookieTextAnalytics: "POKYH adurvea cookies necessars per jì ite y per la segurëza y conta anonimamënter coche l vën adurvà – zënza ti inuem. Cun „Azeté dut“ permëtes nce la statistica de adurvanza persunela y Google Analytics, che nes juda a miuré POKYH.",
    cookieMore: "Plu nfurmazions",
    cookiePolicyLink: "Regules di cookies",
    cookiePrivacyLink: "Nfurmazion sun la privacy",
    cookieCloseNecessary: "Adurvé mé cookies necessars y stlù",
    cookieNecessaryTitle: "Necessars",
    cookieNecessaryDesc: "Jì ite, segurëza, tia mpustazions y la cunta anonima zënza inuem.",
    cookieAlwaysOn: "For atif",
    cookieStatsTitle: "Statistica de adurvanza persunela",
    cookieStatsDesc: "I aministradëures ued per ti account tan giut y sun ciuna plataforma che tu adurveies POKYH y ciuna plates che tu daurjes. Tu la pos tò zeruch uni mumënt. Sota i 14 ani mé cun l permës de ti genitores.",
    cookieGaTitle: "Google Analytics",
    cookieGaDesc: "Statistica tres Google cun cookies; i dac po unì trasferii ti USA.",
    cookieSaveSelection: "Salvé la cërnuda",
    cookieSettings: "Mpustazions",
    cookieNecessaryOnly: "Mé necessars",
    cookieAcceptAll: "Azeté dut",
    cookieOpenSettings: "Giaurì la mpustazions di cookies",
    footerDisclaimer: "POKYH ie n proiet autonom de sculeies y ne n’à deguna lieia ufiziela cun la LBS Porsenù, cun l Zënter de furmazion Christian Josef Tschuggmall o cun WebUntis / Untis GmbH. L’azes suzed tres la interfacia WebUntis dla LBS Porsenù. Marches y logo ie dla pruprietà di sies titulars.",
    footerMadeBy: "Fat da",
    footerImprint: "Impressum",
    footerPrivacy: "Privacy",
    footerCookies: "Cookies",
    footerComparison: "Cunfront",
  },
};
