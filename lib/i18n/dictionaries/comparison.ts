import type { Dictionary } from '../dictionary';

export type ComparisonKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogTitle'
  | 'ogDescription'
  | 'eyebrow'
  | 'heroSub'
  | 'noteStrong'
  | 'note'
  | 'pokyhSub'
  | 'recommended'
  | 'webuntisSub'
  | 'original'
  | 'available'
  | 'partial'
  | 'missing'
  | 'legendAvailable'
  | 'legendLimited'
  | 'legendUnavailable'
  | 'summaryTitle'
  | 'sumPokyhTitle'
  | 'sumPokyhBody'
  | 'sumWebuntisTitle'
  | 'sumWebuntisBody'
  | 'sumTogether'
  | 'sumTogetherTitle'
  | 'sumTogetherBody'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin'
  | 'ctaFaq'
  // sections
  | 'secGeneral'
  | 'secDesign'
  | 'secFeatures'
  | 'secPlatform'
  // rows
  | 'rFree'
  | 'rAdFree'
  | 'rNoAccount'
  | 'rModern'
  | 'rDark'
  | 'rMobileFirst'
  | 'rMobileApp'
  | 'rTimetable'
  | 'rSubst'
  | 'rGrades'
  | 'rMensa'
  | 'rMessages'
  | 'rAbsences'
  | 'rReminders'
  | 'rTodos'
  | 'rWebApp'
  | 'rNativeApps'
  | 'rTeachers'
  | 'rOfficial'
  | 'rOpenSource';

export const comparisonDict: Dictionary<ComparisonKey> = {
  de: {
    metaTitle: 'POKYH vs. WebUntis – Funktionsvergleich | Schulapp Tschuggmall Brixen',
    metaDescription: 'POKYH vs. WebUntis: Was bietet POKYH zusätzlich? Mensa, automatischer Notenschnitt, Klassen-Erinnerungen — kostenlos für Schüler des BFS Tschuggmall / LBS Brixen.',
    ogTitle: 'POKYH vs. WebUntis – Funktionsvergleich',
    ogDescription: 'Was bietet POKYH zusätzlich zu WebUntis? Eine ehrliche Gegenüberstellung für Schüler des BFS Tschuggmall / LBS Brixen.',
    eyebrow: 'Transparent & fair',
    heroSub: 'POKYH und WebUntis ergänzen sich — POKYH nutzt die WebUntis-API und bringt deine Schuldaten des BFS Tschuggmall in einer moderneren Oberfläche.',
    noteStrong: 'Wichtig:',
    note: 'POKYH ist kein offizieller Ersatz für WebUntis und steht in keiner Verbindung zur Untis GmbH. Die Anmeldung erfolgt weiterhin mit deinem WebUntis-Benutzernamen und Passwort. POKYH liest dieselben Daten über die offizielle WebUntis-Schnittstelle — und zeigt sie dir übersichtlicher.',
    pokyhSub: 'Für Schüler · LBS Brixen',
    recommended: 'Empfehlung',
    webuntisSub: 'Offiziell · Untis GmbH',
    original: 'Original',
    available: 'verfügbar',
    partial: 'teilweise',
    missing: 'fehlt',
    legendAvailable: 'Verfügbar',
    legendLimited: 'Eingeschränkt',
    legendUnavailable: 'Nicht verfügbar',
    summaryTitle: 'Kurz zusammengefasst',
    sumPokyhTitle: 'Für Schüler',
    sumPokyhBody: 'Modernes Design, automatischer Notenschnitt, Mensa, Erinnerungen und Todos — optimiert für den Schulalltag an der LBS Brixen.',
    sumWebuntisTitle: 'Die offizielle Plattform',
    sumWebuntisBody: 'Die offizielle App von Untis GmbH — mit iOS- und Android-App, Funktionen für Lehrkräfte und offizieller Unterstützung.',
    sumTogether: 'Zusammen',
    sumTogetherTitle: 'Beide ergänzen sich',
    sumTogetherBody: 'Du meldest dich in POKYH mit deinem WebUntis-Account an. POKYH und WebUntis widersprechen sich nicht — du kannst beide nutzen.',
    ctaTitle: 'Überzeug dich selbst.',
    ctaLead: 'Kostenlos. Mit deinem WebUntis-Account oder POKYH-Konto.',
    ctaLogin: 'Jetzt anmelden',
    ctaFaq: 'Zu den FAQ',
    secGeneral: 'Allgemein',
    secDesign: 'Design & UX',
    secFeatures: 'Funktionen',
    secPlatform: 'Plattform',
    rFree: 'Kostenlos',
    rAdFree: 'Werbefrei',
    rNoAccount: 'Kein Account nötig',
    rModern: 'Modernes Design',
    rDark: 'Dark Mode',
    rMobileFirst: 'Mobile-First',
    rMobileApp: 'Mobile App / Download',
    rTimetable: 'Stundenplan',
    rSubst: 'Vertretungen & Entfall',
    rGrades: 'Noten mit Schnitt',
    rMensa: 'Mensa-Speiseplan',
    rMessages: 'Nachrichten mit Anhängen',
    rAbsences: 'Abwesenheiten',
    rReminders: 'Klassen-Erinnerungen',
    rTodos: 'Persönliche Todos',
    rWebApp: 'Web-App',
    rNativeApps: 'iOS & Android App',
    rTeachers: 'Für Lehrkräfte',
    rOfficial: 'Offizielle Plattform',
    rOpenSource: 'Open Source',
  },
  it: {
    metaTitle: 'POKYH vs. WebUntis – Confronto delle funzioni | App scolastica Tschuggmall Bressanone',
    metaDescription: 'POKYH vs. WebUntis: cosa offre in più POKYH? Mensa, media automatica, promemoria di classe — gratis per gli studenti del BFS Tschuggmall / LBS Bressanone.',
    ogTitle: 'POKYH vs. WebUntis – Confronto delle funzioni',
    ogDescription: 'Cosa offre POKYH in più rispetto a WebUntis? Un confronto onesto per gli studenti del BFS Tschuggmall / LBS Bressanone.',
    eyebrow: 'Trasparente e corretto',
    heroSub: 'POKYH e WebUntis si completano — POKYH usa l’API di WebUntis e mostra i tuoi dati scolastici del BFS Tschuggmall in un’interfaccia più moderna.',
    noteStrong: 'Importante:',
    note: 'POKYH non è un sostituto ufficiale di WebUntis e non ha alcun legame con Untis GmbH. L’accesso avviene sempre con il tuo nome utente e la tua password di WebUntis. POKYH legge gli stessi dati tramite l’interfaccia ufficiale di WebUntis — e te li mostra in modo più chiaro.',
    pokyhSub: 'Per studenti · LBS Bressanone',
    recommended: 'Consigliato',
    webuntisSub: 'Ufficiale · Untis GmbH',
    original: 'Originale',
    available: 'disponibili',
    partial: 'parziali',
    missing: 'mancanti',
    legendAvailable: 'Disponibile',
    legendLimited: 'Limitato',
    legendUnavailable: 'Non disponibile',
    summaryTitle: 'In breve',
    sumPokyhTitle: 'Per studenti',
    sumPokyhBody: 'Design moderno, media automatica, mensa, promemoria e to-do — ottimizzato per la vita scolastica alla LBS Bressanone.',
    sumWebuntisTitle: 'La piattaforma ufficiale',
    sumWebuntisBody: 'L’app ufficiale di Untis GmbH — con app per iOS e Android, funzioni per i docenti e supporto ufficiale.',
    sumTogether: 'Insieme',
    sumTogetherTitle: 'Si completano a vicenda',
    sumTogetherBody: 'In POKYH accedi con il tuo account WebUntis. POKYH e WebUntis non si escludono — puoi usarli entrambi.',
    ctaTitle: 'Convinciti da solo.',
    ctaLead: 'Gratis. Con il tuo account WebUntis o un account POKYH.',
    ctaLogin: 'Accedi ora',
    ctaFaq: 'Vai alle FAQ',
    secGeneral: 'Generale',
    secDesign: 'Design e UX',
    secFeatures: 'Funzioni',
    secPlatform: 'Piattaforma',
    rFree: 'Gratuito',
    rAdFree: 'Senza pubblicità',
    rNoAccount: 'Nessun account necessario',
    rModern: 'Design moderno',
    rDark: 'Modalità scura',
    rMobileFirst: 'Mobile-first',
    rMobileApp: 'App mobile / download',
    rTimetable: 'Orario',
    rSubst: 'Supplenze e ore annullate',
    rGrades: 'Voti con media',
    rMensa: 'Menù della mensa',
    rMessages: 'Messaggi con allegati',
    rAbsences: 'Assenze',
    rReminders: 'Promemoria di classe',
    rTodos: 'To-do personali',
    rWebApp: 'Web app',
    rNativeApps: 'App iOS e Android',
    rTeachers: 'Per i docenti',
    rOfficial: 'Piattaforma ufficiale',
    rOpenSource: 'Open source',
  },
  en: {
    metaTitle: 'POKYH vs. WebUntis – Feature comparison | School app Tschuggmall Brixen',
    metaDescription: 'POKYH vs. WebUntis: what does POKYH add? Cafeteria, automatic grade average, class reminders — free for students at BFS Tschuggmall / LBS Brixen.',
    ogTitle: 'POKYH vs. WebUntis – Feature comparison',
    ogDescription: 'What does POKYH add on top of WebUntis? An honest side-by-side for students at BFS Tschuggmall / LBS Brixen.',
    eyebrow: 'Transparent & fair',
    heroSub: 'POKYH and WebUntis complement each other — POKYH uses the WebUntis API and shows your BFS Tschuggmall school data in a more modern interface.',
    noteStrong: 'Important:',
    note: 'POKYH isn’t an official replacement for WebUntis and has no connection to Untis GmbH. You still log in with your WebUntis username and password. POKYH reads the same data through the official WebUntis interface — and shows it to you more clearly.',
    pokyhSub: 'For students · LBS Brixen',
    recommended: 'Recommended',
    webuntisSub: 'Official · Untis GmbH',
    original: 'Original',
    available: 'available',
    partial: 'partial',
    missing: 'missing',
    legendAvailable: 'Available',
    legendLimited: 'Limited',
    legendUnavailable: 'Not available',
    summaryTitle: 'In short',
    sumPokyhTitle: 'For students',
    sumPokyhBody: 'Modern design, automatic grade average, cafeteria, reminders and to-dos — built for everyday school life at LBS Brixen.',
    sumWebuntisTitle: 'The official platform',
    sumWebuntisBody: 'The official app by Untis GmbH — with iOS and Android apps, features for teachers and official support.',
    sumTogether: 'Together',
    sumTogetherTitle: 'They complement each other',
    sumTogetherBody: 'You log in to POKYH with your WebUntis account. POKYH and WebUntis don’t conflict — you can use both.',
    ctaTitle: 'See for yourself.',
    ctaLead: 'Free. With your WebUntis account or a POKYH account.',
    ctaLogin: 'Log in now',
    ctaFaq: 'Go to the FAQ',
    secGeneral: 'General',
    secDesign: 'Design & UX',
    secFeatures: 'Features',
    secPlatform: 'Platform',
    rFree: 'Free',
    rAdFree: 'Ad-free',
    rNoAccount: 'No account needed',
    rModern: 'Modern design',
    rDark: 'Dark mode',
    rMobileFirst: 'Mobile-first',
    rMobileApp: 'Mobile app / download',
    rTimetable: 'Timetable',
    rSubst: 'Substitutes & cancellations',
    rGrades: 'Grades with average',
    rMensa: 'Cafeteria menu',
    rMessages: 'Messages with attachments',
    rAbsences: 'Absences',
    rReminders: 'Class reminders',
    rTodos: 'Personal to-dos',
    rWebApp: 'Web app',
    rNativeApps: 'iOS & Android app',
    rTeachers: 'For teachers',
    rOfficial: 'Official platform',
    rOpenSource: 'Open source',
  },
  lld: {
    metaTitle: "POKYH vs. WebUntis – Cunfront dla funzions | App dla scola Tschuggmall Porsenù",
    metaDescription: "POKYH vs. WebUntis: ci à POKYH de plu? Mensa, media dla notes da sëula, recurdanzes dla tlas — debant per i sculeies dl BFS Tschuggmall / LBS Porsenù.",
    ogTitle: "POKYH vs. WebUntis – Cunfront dla funzions",
    ogDescription: "Ci à POKYH de plu che WebUntis? N cunfront onest per i sculeies dl BFS Tschuggmall / LBS Porsenù.",
    eyebrow: "Trasparënt y onest",
    heroSub: "POKYH y WebUntis se cumpleta — POKYH adurvea l’API de WebUntis y mostra ti dac dla scola dl BFS Tschuggmall te n’interfacia plu moderna.",
    noteStrong: "Mpurtant:",
    note: "POKYH ne n’ie nia n sostitut ufiziel de WebUntis y ne n’à deguna lieia cun Untis GmbH. Tu vas mo for ite cun ti inuem dl utënt y password de WebUntis. POKYH liej i medemi dac tres la interfacia ufiziela de WebUntis — y te i mostra plu tler.",
    pokyhSub: "Per sculeies · LBS Porsenù",
    recommended: "Cunsià",
    webuntisSub: "Ufiziel · Untis GmbH",
    original: "Uriginel",
    available: "a dispuzion",
    partial: "n pert",
    missing: "mancia",
    legendAvailable: "A dispuzion",
    legendLimited: "Limità",
    legendUnavailable: "Nia a dispuzion",
    summaryTitle: "Tl curt",
    sumPokyhTitle: "Per sculeies",
    sumPokyhBody: "Design modern, media dla notes da sëula, mensa, recurdanzes y to-do — otimisà per la vita de uni di tla LBS Porsenù.",
    sumWebuntisTitle: "La plataforma ufiziela",
    sumWebuntisBody: "L’app ufiziela de Untis GmbH — cun app per iOS y Android, funzions per i nseniant y sustëni ufiziel.",
    sumTogether: "Adum",
    sumTogetherTitle: "I se cumpleta",
    sumTogetherBody: "Te POKYH vas ite cun ti account WebUntis. POKYH y WebUntis ne se contradij nia — tu pos i adurvé duc doi.",
    ctaTitle: "Cunvëinzete tu nstës.",
    ctaLead: "Debant. Cun ti account WebUntis o n account POKYH.",
    ctaLogin: "Jì ite sën",
    ctaFaq: "Ala FAQ",
    secGeneral: "Generel",
    secDesign: "Design y UX",
    secFeatures: "Funzions",
    secPlatform: "Plataforma",
    rFree: "Debant",
    rAdFree: "Zënza reclam",
    rNoAccount: "Nia de bujën de n account",
    rModern: "Design modern",
    rDark: "Modus scur",
    rMobileFirst: "Mobile-first",
    rMobileApp: "App mobila / download",
    rTimetable: "Urar",
    rSubst: "Suplenzes y ëures suspendudes",
    rGrades: "Notes cun media",
    rMensa: "Menu dla mensa",
    rMessages: "Nutizies cun alegac",
    rAbsences: "Assënzes",
    rReminders: "Recurdanzes dla tlas",
    rTodos: "To-do personei",
    rWebApp: "Web app",
    rNativeApps: "App iOS y Android",
    rTeachers: "Per i nseniant",
    rOfficial: "Plataforma ufiziela",
    rOpenSource: "Open source",
  },
};
