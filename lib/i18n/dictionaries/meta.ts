import type { Dictionary } from '../dictionary';

/** Page titles & descriptions (browser tab, search results, link previews). */
export type MetaKey =
  | 'siteTitle'
  | 'siteDescription'
  | 'siteOgDescription'
  | 'landingTitle'
  | 'landingDescription'
  | 'landingOgTitle'
  | 'landingOgDescription'
  | 'loginTitle'
  | 'loginDescription'
  | 'loginOgTitle'
  | 'loginOgDescription'
  | 'notFound'
  | 'appDescription'
  | 'websiteDescription'
  | 'featureList'
  | 'offerDescription'
  | 'breadcrumbLogin'
  | 'seoBlurbAria'
  | 'seoBlurb';

export const metaDict: Dictionary<MetaKey> = {
  de: {
    siteTitle: 'POKYH – Schulapp LBS Brixen',
    siteDescription: 'POKYH ist die kostenlose Web-App für LBS Brixen Schüler. Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – alles übersichtlich an einem Ort.',
    siteOgDescription: 'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – schnell, modern, gratis.',
    landingTitle: 'POKYH – Schulapp LBS Brixen | Stundenplan, Noten & Mensa',
    landingDescription: 'POKYH ist die kostenlose Schulapp für LBS Brixen Schüler: Stundenplan mit Vertretungen, Noten mit Gesamtschnitt, Mensa-Plan, Abwesenheiten und Nachrichten — modern, schnell, gratis.',
    landingOgTitle: 'POKYH – Schulapp für LBS Brixen',
    landingOgDescription: 'Die kostenlose Schulapp für LBS Brixen: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – schnell, modern, gratis.',
    loginTitle: 'Anmelden – POKYH | Schulapp LBS Brixen',
    loginDescription: 'Melde dich bei POKYH an – der Schulapp für LBS Brixen Schüler. Stundenplan, Noten, Mensa und Nachrichten – schnell und sicher mit deinem Schulaccount.',
    loginOgTitle: 'Anmelden – POKYH Schulapp LBS Brixen',
    loginOgDescription: 'Melde dich bei POKYH an: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – die Schulapp für LBS Brixen.',
    notFound: 'Seite nicht gefunden',
    appDescription: "Kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen (Landesberufsschule Brixen, Südtirol). Stundenplan, Noten, Mensa, Abwesenheiten, Nachrichten und Klassen-Erinnerungen – alles übersichtlich an einem Ort.",
    websiteDescription: "Die Schulapp für LBS Brixen Schüler – Stundenplan, Noten, Mensa und mehr.",
    featureList: "Stundenplan (Tages- und Wochenansicht)|Prüfungen und Vertretungen im Stundenplan|Noten nach Fach mit automatischem Gesamtschnitt|Mensa-Speiseplan mit Nährwerten und Bewertungen|Nachrichten-Inbox mit Anhängen|Abwesenheiten & Fehlstunden mit Jahresübersicht|Klassenweite Erinnerungen für Prüfungen|Persönliche Todo-Liste|Dunkelmodus & Mobile-First Design|Kostenlos und werbefrei",
    offerDescription: "Vollständig kostenlos und werbefrei",
    breadcrumbLogin: "Anmelden",
    seoBlurbAria: "Über POKYH",
    seoBlurb: "**POKYH** ist die kostenlose **Schulapp** für Schülerinnen und Schüler des **Berufsbildungszentrums Christian Josef Tschuggmall** (**BFS Tschuggmall** / **BBZ Tschuggmall** / **LBS Brixen**, Landesberufsschule Brixen, Südtirol, Bressanone). Mit deinen Schulzugangsdaten direkt anmelden — kein separates Passwort. **Stundenplan Tschuggmall Brixen** mit Vertretungen und Prüfungen. **Noten und Notenschnitt** nach Fach, automatisch berechnet. **Mensa-Speiseplan Brixen** täglich aktuell. **Abwesenheiten und Fehlstunden** auf einen Blick. **Klassen-Erinnerungen** in Echtzeit. Auch gefunden unter: **Chr. J. Tschuggmall App**, **Christian Josef Tschuggmall Schüler**, **Tschuggmall Stundenplan**, **Schulapp Brixen**, **Berufsschule Brixen App**, **WebUntis Alternative Brixen**, **WebUntis Brixen**. POKYH steht in keiner offiziellen Verbindung zum offiziellen Schulportal. Kostenlos, werbefrei, open source — von Schülern für Schüler.",
  },
  it: {
    siteTitle: 'POKYH – App scolastica LBS Bressanone',
    siteDescription: 'POKYH è la web app gratuita per gli studenti della LBS Bressanone. Orario, voti, mensa, assenze e messaggi – tutto chiaro in un unico posto.',
    siteOgDescription: 'Web app gratuita per gli studenti della LBS Bressanone: orario, voti, mensa, assenze e messaggi – veloce, moderna, gratis.',
    landingTitle: 'POKYH – App scolastica LBS Bressanone | Orario, voti e mensa',
    landingDescription: 'POKYH è l’app scolastica gratuita per gli studenti della LBS Bressanone: orario con supplenze, voti con media, menù della mensa, assenze e messaggi — moderna, veloce, gratis.',
    landingOgTitle: 'POKYH – App scolastica per la LBS Bressanone',
    landingOgDescription: 'L’app scolastica gratuita per la LBS Bressanone: orario, voti, mensa, assenze e messaggi – veloce, moderna, gratis.',
    loginTitle: 'Accedi – POKYH | App scolastica LBS Bressanone',
    loginDescription: 'Accedi a POKYH – l’app scolastica per gli studenti della LBS Bressanone. Orario, voti, mensa e messaggi – veloce e sicuro con il tuo account scolastico.',
    loginOgTitle: 'Accedi – POKYH app scolastica LBS Bressanone',
    loginOgDescription: 'Accedi a POKYH: orario, voti, mensa, assenze e messaggi – l’app scolastica per la LBS Bressanone.',
    notFound: 'Pagina non trovata',
    appDescription: "Web app gratuita per le studentesse e gli studenti della LBS Bressanone (Scuola professionale provinciale di Bressanone, Alto Adige). Orario, voti, mensa, assenze, messaggi e promemoria di classe – tutto chiaro in un unico posto.",
    websiteDescription: "L’app scolastica per gli studenti della LBS Bressanone – orario, voti, mensa e altro.",
    featureList: "Orario (vista giornaliera e settimanale)|Verifiche e supplenze nell’orario|Voti per materia con media automatica|Menù della mensa con valori nutrizionali e valutazioni|Inbox dei messaggi con allegati|Assenze e ore perse con panoramica annuale|Promemoria per tutta la classe per le verifiche|Lista di to-do personale|Modalità scura e design mobile-first|Gratuita e senza pubblicità",
    offerDescription: "Completamente gratuita e senza pubblicità",
    breadcrumbLogin: "Accedi",
    seoBlurbAria: "Su POKYH",
    seoBlurb: "**POKYH** è l’**app scolastica** gratuita per le studentesse e gli studenti del **Centro di formazione professionale Christian Josef Tschuggmall** (**BFS Tschuggmall** / **LBS Bressanone**, Scuola professionale provinciale di Bressanone, Alto Adige, Brixen). Accedi direttamente con le tue credenziali scolastiche — nessuna password separata. **Orario Tschuggmall Bressanone** con supplenze e verifiche. **Voti e media** per materia, calcolati automaticamente. **Menù della mensa di Bressanone** aggiornato ogni giorno. **Assenze e ore perse** a colpo d’occhio. **Promemoria di classe** in tempo reale. Conosciuta anche come: **app Tschuggmall**, **orario Tschuggmall**, **app scolastica Bressanone**, **app scuola professionale Bressanone**, **alternativa WebUntis Bressanone**, **WebUntis Bressanone**. POKYH non ha alcun legame ufficiale con il portale scolastico ufficiale. Gratuita, senza pubblicità, open source — da studenti per studenti.",
  },
  en: {
    siteTitle: 'POKYH – School app LBS Brixen',
    siteDescription: 'POKYH is the free web app for LBS Brixen students. Timetable, grades, cafeteria, absences and messages – all clearly in one place.',
    siteOgDescription: 'Free web app for LBS Brixen students: timetable, grades, cafeteria, absences and messages – fast, modern, free.',
    landingTitle: 'POKYH – School app LBS Brixen | Timetable, grades & cafeteria',
    landingDescription: 'POKYH is the free school app for LBS Brixen students: timetable with substitutes, grades with overall average, cafeteria menu, absences and messages — modern, fast, free.',
    landingOgTitle: 'POKYH – School app for LBS Brixen',
    landingOgDescription: 'The free school app for LBS Brixen: timetable, grades, cafeteria, absences and messages – fast, modern, free.',
    loginTitle: 'Log in – POKYH | School app LBS Brixen',
    loginDescription: 'Log in to POKYH – the school app for LBS Brixen students. Timetable, grades, cafeteria and messages – fast and secure with your school account.',
    loginOgTitle: 'Log in – POKYH school app LBS Brixen',
    loginOgDescription: 'Log in to POKYH: timetable, grades, cafeteria, absences and messages – the school app for LBS Brixen.',
    notFound: 'Page not found',
    appDescription: "Free web app for students at LBS Brixen (the provincial vocational school in Brixen, South Tyrol). Timetable, grades, cafeteria, absences, messages and class reminders – all clearly in one place.",
    websiteDescription: "The school app for LBS Brixen students – timetable, grades, cafeteria and more.",
    featureList: "Timetable (day and week view)|Exams and substitutes in the timetable|Grades by subject with automatic overall average|Cafeteria menu with nutrition info and ratings|Message inbox with attachments|Absences & missed hours with yearly overview|Class-wide reminders for exams|Personal to-do list|Dark mode & mobile-first design|Free and ad-free",
    offerDescription: "Completely free and ad-free",
    breadcrumbLogin: "Log in",
    seoBlurbAria: "About POKYH",
    seoBlurb: "**POKYH** is the free **school app** for students of the **Christian Josef Tschuggmall vocational training centre** (**BFS Tschuggmall** / **LBS Brixen**, the provincial vocational school in Brixen/Bressanone, South Tyrol). Log in directly with your school credentials — no separate password. **Tschuggmall Brixen timetable** with substitutes and exams. **Grades and grade average** per subject, calculated automatically. **Brixen cafeteria menu** updated daily. **Absences and missed hours** at a glance. **Class reminders** in real time. Also known as: **Tschuggmall app**, **Tschuggmall timetable**, **Brixen school app**, **Brixen vocational school app**, **WebUntis alternative Brixen**, **WebUntis Brixen**. POKYH has no official connection to the official school portal. Free, ad-free, open source — by students for students.",
  },
  lld: {
    siteTitle: "POKYH – App dla scola LBS Porsenù",
    siteDescription: "POKYH ie la web app debant per i sculeies dla LBS Porsenù. Urar, notes, mensa, assënzes y nutizies – dut tl medem post.",
    siteOgDescription: "Web app debant per i sculeies dla LBS Porsenù: urar, notes, mensa, assënzes y nutizies – sveta, moderna, debant.",
    landingTitle: "POKYH – App dla scola LBS Porsenù | Urar, notes y mensa",
    landingDescription: "POKYH ie l’app dla scola debant per i sculeies dla LBS Porsenù: urar cun suplenzes, notes cun media, menu dla mensa, assënzes y nutizies — moderna, sveta, debant.",
    landingOgTitle: "POKYH – App dla scola per la LBS Porsenù",
    landingOgDescription: "L’app dla scola debant per la LBS Porsenù: urar, notes, mensa, assënzes y nutizies – sveta, moderna, debant.",
    loginTitle: "Jì ite – POKYH | App dla scola LBS Porsenù",
    loginDescription: "Va ite te POKYH – l’app dla scola per i sculeies dla LBS Porsenù. Urar, notes, mensa y nutizies – svelt y segur cun ti account dla scola.",
    loginOgTitle: "Jì ite – POKYH app dla scola LBS Porsenù",
    loginOgDescription: "Va ite te POKYH: urar, notes, mensa, assënzes y nutizies – l’app dla scola per la LBS Porsenù.",
    notFound: "Plata nia giapeda",
    appDescription: "Web app debant per la sculeies y i sculeies dla LBS Porsenù (Scola prufesciunela provinziela de Porsenù, Südtirol). Urar, notes, mensa, assënzes, nutizies y recurdanzes dla tlas – dut tlër tl medem post.",
    websiteDescription: "L’app dla scola per i sculeies dla LBS Porsenù – urar, notes, mensa y de plu.",
    featureList: "Urar (vista dl di y dl’ena)|Verifiches y suplenzes tl urar|Notes aldò dla materia cun media generela da sëula|Menu dla mensa cun valores nutritives y valutazions|Nbox dla nutizies cun alegac|Assënzes y ëures de assënza cun survista dl ann|Recurdanzes per duta la tlas per la verifiches|Lista de to-do personela|Modus scur y design mobile-first|Debant y zënza reclam",
    offerDescription: "Dut debant y zënza reclam",
    breadcrumbLogin: "Jì ite",
    seoBlurbAria: "Sun POKYH",
    seoBlurb: "**POKYH** ie l’**app dla scola** debant per la sculeies y i sculeies dl **Zënter de furmazion prufesciunela Christian Josef Tschuggmall** (**BFS Tschuggmall** / **LBS Porsenù**, Scola prufesciunela provinziela de Porsenù, Südtirol). Va ite diretamënter cun ti dac de azes dla scola — deguna password a pert. **Urar Tschuggmall Porsenù** cun suplenzes y verifiches. **Notes y media** aldò dla materia, calculedes da sëula. **Menu dla mensa de Porsenù** atualisà uni di. **Assënzes y ëures de assënza** te n’udleda. **Recurdanzes dla tlas** te tëmp real. POKYH ne n’à deguna lieia ufiziela cun l portal ufiziel dla scola. Debant, zënza reclam, open source — da sculeies per sculeies.",
  },
};
