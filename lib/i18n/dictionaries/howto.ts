import type { Dictionary } from '../dictionary';

export type HowtoKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogTitle'
  | 'ogDescription'
  | 'title'
  | 'lead'
  | 'repoFrontend'
  | 'repoBackend'
  | 'stepsTitle'
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
  | 'needsTitle'
  | 'n1'
  | 'n2'
  | 'n3'
  | 'copy'
  | 'copied'
  | 'ctaTitle'
  | 'ctaLead'
  | 'ctaLogin';

export const howtoDict: Dictionary<HowtoKey> = {
  de: {
    metaTitle: 'POKYH selbst hosten – Anleitung',
    metaDescription: 'POKYH ist Open Source. So betreibst du die Web-App auf deinem eigenen Rechner oder Server: Repository klonen, konfigurieren, starten.',
    ogTitle: 'POKYH selbst hosten',
    ogDescription: 'Die Web-App von POKYH lokal oder auf deinem Server betreiben.',
    title: 'POKYH selbst betreiben.',
    lead: 'Der Code ist offen. Wenn du an POKYH mitbauen oder es für eine andere Schule ausprobieren willst, läuft die Web-App in wenigen Minuten bei dir.',
    repoFrontend: 'Web-App',
    repoBackend: 'Backend',
    stepsTitle: 'In vier Schritten',
    s1Title: 'Repository klonen',
    s1Body: 'Lade den Code der Web-App von GitHub.',
    s2Title: 'Pakete installieren',
    s2Body: 'Node.js ab Version 20.9 wird gebraucht.',
    s3Title: 'Konfigurieren',
    s3Body: 'Lege eine .env.local an und trage WebUntis-Adresse, Schule und deine Backend-Schlüssel ein.',
    s3Comment: '# Werte in .env.local eintragen',
    s4Title: 'Starten',
    s4Body: 'Der Entwicklungsserver läuft auf Port 3001.',
    s4Comment: '# für den Betrieb:',
    needsTitle: 'Was du brauchst',
    n1: 'Node.js 20.9 oder neuer',
    n2: 'Eine laufende Instanz des POKYH-Backends (Express, Prisma, MySQL)',
    n3: 'Die WebUntis-Adresse und den Kurznamen deiner Schule',
    copy: 'Kopieren',
    copied: 'Kopiert',
    ctaTitle: 'Lieber einfach nutzen?',
    ctaLead: 'Ohne Installation, mit deinem WebUntis-Konto.',
    ctaLogin: 'Anmelden',
  },
  it: {
    metaTitle: 'Self-hosting di POKYH – Guida',
    metaDescription: 'POKYH è open source. Ecco come far girare la web app sul tuo computer o server: clona il repository, configura, avvia.',
    ogTitle: 'Self-hosting di POKYH',
    ogDescription: 'Far girare la web app di POKYH in locale o sul tuo server.',
    title: 'Far girare POKYH in proprio.',
    lead: 'Il codice è aperto. Se vuoi contribuire a POKYH o provarlo per un’altra scuola, la web app gira da te in pochi minuti.',
    repoFrontend: 'Web app',
    repoBackend: 'Backend',
    stepsTitle: 'In quattro passi',
    s1Title: 'Clonare il repository',
    s1Body: 'Scarica il codice della web app da GitHub.',
    s2Title: 'Installare i pacchetti',
    s2Body: 'Serve Node.js dalla versione 20.9.',
    s3Title: 'Configurare',
    s3Body: 'Crea un file .env.local e inserisci indirizzo WebUntis, scuola e le chiavi del tuo backend.',
    s3Comment: '# inserisci i valori in .env.local',
    s4Title: 'Avviare',
    s4Body: 'Il server di sviluppo gira sulla porta 3001.',
    s4Comment: '# per la produzione:',
    needsTitle: 'Cosa ti serve',
    n1: 'Node.js 20.9 o più recente',
    n2: 'Un’istanza del backend di POKYH (Express, Prisma, MySQL)',
    n3: 'L’indirizzo WebUntis e il nome breve della tua scuola',
    copy: 'Copia',
    copied: 'Copiato',
    ctaTitle: 'Meglio usarla e basta?',
    ctaLead: 'Senza installazione, con il tuo account WebUntis.',
    ctaLogin: 'Accedi',
  },
  en: {
    metaTitle: 'Self-hosting POKYH – Guide',
    metaDescription: 'POKYH is open source. Here’s how to run the web app on your own computer or server: clone the repository, configure, start.',
    ogTitle: 'Self-hosting POKYH',
    ogDescription: 'Run the POKYH web app locally or on your own server.',
    title: 'Run POKYH yourself.',
    lead: 'The code is open. If you want to build on POKYH or try it for another school, the web app runs on your machine in a few minutes.',
    repoFrontend: 'Web app',
    repoBackend: 'Backend',
    stepsTitle: 'In four steps',
    s1Title: 'Clone the repository',
    s1Body: 'Get the web app’s code from GitHub.',
    s2Title: 'Install packages',
    s2Body: 'Node.js 20.9 or newer is required.',
    s3Title: 'Configure',
    s3Body: 'Create a .env.local and fill in the WebUntis address, school and your backend keys.',
    s3Comment: '# fill in the values in .env.local',
    s4Title: 'Start',
    s4Body: 'The development server runs on port 3001.',
    s4Comment: '# for production:',
    needsTitle: 'What you need',
    n1: 'Node.js 20.9 or newer',
    n2: 'A running instance of the POKYH backend (Express, Prisma, MySQL)',
    n3: 'Your school’s WebUntis address and short name',
    copy: 'Copy',
    copied: 'Copied',
    ctaTitle: 'Rather just use it?',
    ctaLead: 'No installation, with your WebUntis account.',
    ctaLogin: 'Sign in',
  },
};
