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
  | 'cookieCloseNecessary'
  | 'cookieChoice'
  | 'cookieChoiceText'
  | 'cookieChoiceAnalytics'
  | 'cookieChoiceNoAnalytics'
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
    cookieText: 'Wir verwenden notwendige Cookies für den Betrieb der App.',
    cookieTextAnalytics: 'Wir verwenden notwendige Cookies für den Betrieb der App sowie optionale Analytics-Cookies zur Verbesserung unseres Dienstes.',
    cookieMore: 'Mehr erfahren',
    cookieCloseNecessary: 'Nur notwendige Cookies verwenden und schließen',
    cookieChoice: 'Deine Auswahl',
    cookieChoiceText: 'Notwendige Cookies bleiben für Anmeldung, Sicherheit und die gewählten Einstellungen aktiv.',
    cookieChoiceAnalytics: 'Analytics bleibt nur mit deiner ausdrücklichen Zustimmung aktiv und kann hier jederzeit wieder deaktiviert werden.',
    cookieChoiceNoAnalytics: 'Analytics ist für diese Bereitstellung nicht aktiviert.',
    cookieSettings: 'Einstellungen',
    cookieNecessaryOnly: 'Nur notwendige',
    cookieAcceptAll: 'Alles akzeptieren',
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
    cookieText: 'Utilizziamo cookie necessari per il funzionamento dell’app.',
    cookieTextAnalytics: 'Utilizziamo cookie necessari per il funzionamento dell’app e cookie analitici facoltativi per migliorare il nostro servizio.',
    cookieMore: 'Scopri di più',
    cookieCloseNecessary: 'Usa solo i cookie necessari e chiudi',
    cookieChoice: 'La tua scelta',
    cookieChoiceText: 'I cookie necessari restano attivi per accesso, sicurezza e impostazioni scelte.',
    cookieChoiceAnalytics: 'Gli analytics restano attivi solo con il tuo consenso esplicito e possono essere disattivati qui in qualsiasi momento.',
    cookieChoiceNoAnalytics: 'Gli analytics non sono attivi per questa installazione.',
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
    cookieText: 'We use necessary cookies to run the app.',
    cookieTextAnalytics: 'We use necessary cookies to run the app and optional analytics cookies to improve our service.',
    cookieMore: 'Learn more',
    cookieCloseNecessary: 'Use necessary cookies only and close',
    cookieChoice: 'Your choice',
    cookieChoiceText: 'Necessary cookies stay active for login, security and your chosen settings.',
    cookieChoiceAnalytics: 'Analytics only stays active with your explicit consent and can be turned off here at any time.',
    cookieChoiceNoAnalytics: 'Analytics isn’t enabled for this deployment.',
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
    cookieText: "Nëus adurvon cookies necessars per l funzionamënt dl’app.",
    cookieTextAnalytics: "Nëus adurvon cookies necessars per l funzionamënt dl’app y cookies de analisa facoltatives per miuré nosc servisc.",
    cookieMore: "Plu nfurmazions",
    cookieCloseNecessary: "Adurvé mé cookies necessars y stlù",
    cookieChoice: "Tia cërnuda",
    cookieChoiceText: "I cookies necessars resta atifs per jì ite, per la segurëza y per la mpustazions cernudes.",
    cookieChoiceAnalytics: "L’analisa resta atira mé cun ti cunsëntimënt esplizit y tu la pos destudé chilò uni mumënt.",
    cookieChoiceNoAnalytics: "L’analisa ne n’ie nia atira per chësta nstalazion.",
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
