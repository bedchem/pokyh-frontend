import type { Dictionary } from '../dictionary';

export type HowtoKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogTitle'
  | 'ogDescription'
  | 'eyebrow'
  | 'title'
  | 'sub'
  | 'recommended'
  | 'onlineTitle'
  | 'onlineSub'
  | 'loginNow'
  | 'selfTitle'
  | 'selfSub'
  | 'guideTitle'
  | 'guideSub'
  | 's1Title'
  | 's1Body'
  | 's2Title'
  | 's2Body'
  | 's3Title'
  | 's3Body'
  | 's3Comment'
  | 's4Title'
  | 's4Body'
  | 's4Comment'
  | 'techTitle'
  | 'techSub'
  | 'tFramework'
  | 'tFrameworkDesc'
  | 'tLanguage'
  | 'tLanguageDesc'
  | 'tStyling'
  | 'tStylingDesc'
  | 'tBackend'
  | 'tBackendDesc'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin';

export const howtoDict: Dictionary<HowtoKey> = {
  de: {
    metaTitle: 'GET POKYH – Herunterladen & Selbst hosten',
    metaDescription: 'Hol dir POKYH: Nutze die gehostete Version direkt auf pokyh.com oder lade den Open-Source-Code von GitHub und betreibe POKYH auf deinem eigenen Server.',
    ogTitle: 'GET POKYH – Download & Selbst hosten',
    ogDescription: 'Nutze POKYH direkt im Browser oder lade den Quellcode von GitHub und hoste es selbst.',
    eyebrow: 'Open Source · MIT Lizenz',
    title: 'Hol dir POKYH',
    sub: 'Nutze POKYH direkt im Browser — oder lade den Quellcode von GitHub und hoste es auf deinem eigenen Server. Kostenlos, werbefrei, Open Source.',
    recommended: 'Empfohlen',
    onlineTitle: 'Direkt online nutzen',
    onlineSub: 'Melde dich auf pokyh.com mit deinem WebUntis-Account an — kein Download, keine Konfiguration, sofort loslegen.',
    loginNow: 'Jetzt anmelden',
    selfTitle: 'Selbst hosten',
    selfSub: 'Lade den vollständigen Quellcode von GitHub herunter und betreibe POKYH auf deinem eigenen Server oder lokal auf deinem Rechner.',
    guideTitle: 'Self-Hosting Anleitung',
    guideSub: 'In wenigen Minuten läuft POKYH lokal oder auf deinem Server.',
    s1Title: 'Repository klonen',
    s1Body: 'Lade den POKYH-Quellcode von GitHub herunter.',
    s2Title: 'Abhängigkeiten installieren',
    s2Body: 'Installiere alle Node.js-Pakete mit npm.',
    s3Title: 'Umgebungsvariablen konfigurieren',
    s3Body: 'Kopiere die Beispielkonfiguration und passe sie an deine Umgebung an.',
    s3Comment: '# .env.local mit deinen Werten befüllen',
    s4Title: 'Starten',
    s4Body: 'Starte den Entwicklungsserver — oder baue für die Produktion.',
    s4Comment: '# Für Produktion:',
    techTitle: 'Tech Stack',
    techSub: 'Gebaut mit modernen Webtechnologien.',
    tFramework: 'Framework',
    tFrameworkDesc: 'App Router, Server Components und optimierter Build.',
    tLanguage: 'Sprache',
    tLanguageDesc: 'Vollständig typisiert für Wartbarkeit und weniger Bugs.',
    tStyling: 'Styling',
    tStylingDesc: 'Utility-first CSS für konsistentes, schnelles Styling.',
    tBackend: 'API & Echtzeit',
    tBackendDesc: 'Eigener Node.js-Server mit SSE für Todos, Erinnerungen und Klassen-Features.',
    ctaTitle: 'Lieber einfach anmelden?',
    ctaLead: 'Keine Installation. Direkt mit deinem WebUntis-Account loslegen.',
    ctaLogin: 'Mit WebUntis anmelden',
  },
  it: {
    metaTitle: 'GET POKYH – Scarica e ospita in autonomia',
    metaDescription: 'Ottieni POKYH: usa la versione ospitata direttamente su pokyh.com oppure scarica il codice open source da GitHub e fai girare POKYH sul tuo server.',
    ogTitle: 'GET POKYH – Download e self-hosting',
    ogDescription: 'Usa POKYH direttamente nel browser oppure scarica il codice sorgente da GitHub e ospitalo tu stesso.',
    eyebrow: 'Open source · Licenza MIT',
    title: 'Ottieni POKYH',
    sub: 'Usa POKYH direttamente nel browser — oppure scarica il codice sorgente da GitHub e ospitalo sul tuo server. Gratis, senza pubblicità, open source.',
    recommended: 'Consigliato',
    onlineTitle: 'Usalo direttamente online',
    onlineSub: 'Accedi su pokyh.com con il tuo account WebUntis — nessun download, nessuna configurazione, si parte subito.',
    loginNow: 'Accedi ora',
    selfTitle: 'Ospitalo tu stesso',
    selfSub: 'Scarica il codice sorgente completo da GitHub e fai girare POKYH sul tuo server o in locale sul tuo computer.',
    guideTitle: 'Guida al self-hosting',
    guideSub: 'In pochi minuti POKYH gira in locale o sul tuo server.',
    s1Title: 'Clona il repository',
    s1Body: 'Scarica il codice sorgente di POKYH da GitHub.',
    s2Title: 'Installa le dipendenze',
    s2Body: 'Installa tutti i pacchetti Node.js con npm.',
    s3Title: 'Configura le variabili d’ambiente',
    s3Body: 'Copia la configurazione di esempio e adattala al tuo ambiente.',
    s3Comment: '# Compila .env.local con i tuoi valori',
    s4Title: 'Avvia',
    s4Body: 'Avvia il server di sviluppo — oppure compila per la produzione.',
    s4Comment: '# Per la produzione:',
    techTitle: 'Tech stack',
    techSub: 'Costruito con tecnologie web moderne.',
    tFramework: 'Framework',
    tFrameworkDesc: 'App Router, Server Components e build ottimizzata.',
    tLanguage: 'Linguaggio',
    tLanguageDesc: 'Completamente tipizzato per manutenibilità e meno bug.',
    tStyling: 'Stile',
    tStylingDesc: 'CSS utility-first per uno stile coerente e veloce.',
    tBackend: 'API e tempo reale',
    tBackendDesc: 'Server Node.js proprio con SSE per to-do, promemoria e funzioni di classe.',
    ctaTitle: 'Preferisci accedere e basta?',
    ctaLead: 'Nessuna installazione. Parti subito con il tuo account WebUntis.',
    ctaLogin: 'Accedi con WebUntis',
  },
  en: {
    metaTitle: 'GET POKYH – Download & self-host',
    metaDescription: 'Get POKYH: use the hosted version right on pokyh.com or download the open-source code from GitHub and run POKYH on your own server.',
    ogTitle: 'GET POKYH – Download & self-host',
    ogDescription: 'Use POKYH right in your browser or download the source code from GitHub and host it yourself.',
    eyebrow: 'Open source · MIT licence',
    title: 'Get POKYH',
    sub: 'Use POKYH right in your browser — or download the source code from GitHub and host it on your own server. Free, ad-free, open source.',
    recommended: 'Recommended',
    onlineTitle: 'Use it online',
    onlineSub: 'Log in on pokyh.com with your WebUntis account — no download, no setup, get started right away.',
    loginNow: 'Log in now',
    selfTitle: 'Self-host',
    selfSub: 'Download the complete source code from GitHub and run POKYH on your own server or locally on your computer.',
    guideTitle: 'Self-hosting guide',
    guideSub: 'Get POKYH running locally or on your server in a few minutes.',
    s1Title: 'Clone the repository',
    s1Body: 'Download the POKYH source code from GitHub.',
    s2Title: 'Install dependencies',
    s2Body: 'Install all Node.js packages with npm.',
    s3Title: 'Configure environment variables',
    s3Body: 'Copy the example configuration and adapt it to your environment.',
    s3Comment: '# Fill .env.local with your values',
    s4Title: 'Start',
    s4Body: 'Start the development server — or build for production.',
    s4Comment: '# For production:',
    techTitle: 'Tech stack',
    techSub: 'Built with modern web technologies.',
    tFramework: 'Framework',
    tFrameworkDesc: 'App Router, Server Components and an optimised build.',
    tLanguage: 'Language',
    tLanguageDesc: 'Fully typed for maintainability and fewer bugs.',
    tStyling: 'Styling',
    tStylingDesc: 'Utility-first CSS for consistent, fast styling.',
    tBackend: 'API & real time',
    tBackendDesc: 'Our own Node.js server with SSE for to-dos, reminders and class features.',
    ctaTitle: 'Rather just log in?',
    ctaLead: 'No installation. Get started right away with your WebUntis account.',
    ctaLogin: 'Log in with WebUntis',
  },
  lld: {
    metaTitle: "GET POKYH – Ciarië ju y fé jì da te",
    metaDescription: "Tol POKYH: adurvea la verscion online diretamënter sun pokyh.com o ciarieia ju l codesc open source da GitHub y fej jì POKYH sun ti server.",
    ogTitle: "GET POKYH – Download y self-hosting",
    ogDescription: "Adurvea POKYH diretamënter tl browser o ciarieia ju l codesc sorgënt da GitHub y fejl jì da te.",
    eyebrow: "Open source · Licënza MIT",
    title: "Tol POKYH",
    sub: "Adurvea POKYH diretamënter tl browser — o ciarieia ju l codesc sorgënt da GitHub y fejl jì sun ti server. Debant, zënza reclam, open source.",
    recommended: "Cunsià",
    onlineTitle: "Adurvé diretamënter online",
    onlineSub: "Va ite sun pokyh.com cun ti account WebUntis — zënza download, zënza cunfigurazion, sibe pront.",
    loginNow: "Jì ite sën",
    selfTitle: "Fé jì da te",
    selfSub: "Ciarieia ju l codesc sorgënt cumplet da GitHub y fej jì POKYH sun ti server o sun ti computer.",
    guideTitle: "Istruzions per l self-hosting",
    guideSub: "Te puec minuc va POKYH sun ti computer o sun ti server.",
    s1Title: "Cloné l repository",
    s1Body: "Ciarieia ju l codesc sorgënt de POKYH da GitHub.",
    s2Title: "Nstalé la dependënzes",
    s2Body: "Nstalea duc i pachec Node.js cun npm.",
    s3Title: "Cunfiguré la variables de ambient",
    s3Body: "Copiea la cunfigurazion de ejëmpl y adatela a ti ambient.",
    s3Comment: "# Mplenësc .env.local cun ti valores",
    s4Title: "Nvië",
    s4Body: "Nviea l server de svilup — o compilea per la produzion.",
    s4Comment: "# Per la produzion:",
    techTitle: "Tech stack",
    techSub: "Fat cun tecnologies web modernes.",
    tFramework: "Framework",
    tFrameworkDesc: "App Router, Server Components y n build otimisà.",
    tLanguage: "Lingaz",
    tLanguageDesc: "Dut tipisà per la manutenzion y manco bug.",
    tStyling: "Stil",
    tStylingDesc: "CSS utility-first per n stil cunsistënt y svelt.",
    tBackend: "API y tëmp real",
    tBackendDesc: "Server Node.js nosc cun SSE per to-do, recurdanzes y funzions dla tlas.",
    ctaTitle: "Plutosc mé jì ite?",
    ctaLead: "Zënza nstalazion. Scumëncia sibe cun ti account WebUntis.",
    ctaLogin: "Jì ite cun WebUntis",
  },
};
