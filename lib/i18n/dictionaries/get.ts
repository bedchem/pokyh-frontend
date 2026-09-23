import type { Dictionary } from '../dictionary';

/**
 * "Get POKYH" hub and its install guides. `**text**` marks bold parts
 * (rendered with `rich()`), `{icon}` marks where an inline icon goes.
 */
export type GetKey =
  // Hub
  | 'metaTitle'
  | 'metaDescription'
  | 'ogDescription'
  | 'twitterDescription'
  | 'tabsAria'
  | 'tabWeb'
  | 'webEyebrow'
  | 'webTitle'
  | 'webSub'
  | 'loginNow'
  | 'webNote'
  | 'appEyebrow'
  | 'appTitle'
  | 'appSubBefore'
  | 'appSubMiddle'
  | 'appSubAfter'
  | 'ipaHint'
  | 'apkHint'
  | 'appNote'
  | 'pwaEyebrow'
  | 'pwaTitle'
  | 'pwaWhat'
  | 'pwaWhatBody'
  | 'pwaChoose'
  | 'viaSafari'
  | 'viaChrome'
  | 'pwaNote'
  // Shared
  | 'back'
  | 'stepAlt'
  // Native app guides
  | 'iosMetaTitle'
  | 'iosMetaDescription'
  | 'iosOgTitle'
  | 'iosOgDescription'
  | 'iosTitle1'
  | 'iosTitle2'
  | 'iosSub'
  | 'androidMetaTitle'
  | 'androidMetaDescription'
  | 'androidOgTitle'
  | 'androidOgDescription'
  | 'androidTitle1'
  | 'androidTitle2'
  | 'androidSub'
  | 'appStep1Title'
  | 'appStep1Before'
  | 'appStep1After'
  | 'iosStep2Title'
  | 'iosStep2Body'
  | 'iosStep3Title'
  | 'iosStep3Body'
  | 'androidStep2Title'
  | 'androidStep2Body'
  | 'androidStep3Body'
  // PWA iOS
  | 'pwaIosMetaTitle'
  | 'pwaIosMetaDescription'
  | 'pwaIosOgTitle'
  | 'pwaIosOgDescription'
  | 'pwaIosSchemaName'
  | 'pwaIosSchemaDescription'
  | 'pwaIosTitle1'
  | 'pwaIosTitle2'
  | 'pwaIosSub'
  | 'pi1Title'
  | 'pi1Text'
  | 'pi1Body'
  | 'pi2Title'
  | 'pi2Text'
  | 'pi2Body'
  | 'pi3Title'
  | 'pi3Text'
  | 'pi3Body'
  | 'pi4Title'
  | 'pi4Text'
  | 'pi4Body'
  | 'pi5Title'
  | 'pi5Text'
  | 'pi5Body'
  // PWA Android
  | 'pwaAndroidMetaTitle'
  | 'pwaAndroidMetaDescription'
  | 'pwaAndroidOgTitle'
  | 'pwaAndroidOgDescription'
  | 'pwaAndroidSchemaName'
  | 'pwaAndroidSchemaDescription'
  | 'pwaAndroidTitle1'
  | 'pwaAndroidTitle2'
  | 'pwaAndroidSub'
  | 'pa1Title'
  | 'pa1Text'
  | 'pa1Body'
  | 'pa2Title'
  | 'pa2Text'
  | 'pa2Body'
  | 'pa3Title'
  | 'pa3Text'
  | 'pa3Body'
  | 'pa4Title'
  | 'pa4Text'
  | 'pa4Body';

export const getDict: Dictionary<GetKey> = {
  de: {
    metaTitle: 'POKYH – Web & App | LBS Brixen',
    metaDescription: 'POKYH nutzen: Direkt im Browser anmelden oder als App auf iPhone und Android installieren. Einfach die .apk oder .ipa von GitHub laden.',
    ogDescription: 'POKYH im Browser nutzen oder als App auf iPhone und Android installieren.',
    twitterDescription: 'POKYH im Browser oder als App auf iPhone und Android.',
    tabsAria: 'Inhaltsauswahl',
    tabWeb: 'Web Login',
    webEyebrow: 'Sofort loslegen',
    webTitle: 'POKYH im Browser nutzen',
    webSub: 'Kein Download, keine Installation. Melde dich mit deinem **WebUntis-Account** an — kostenlos und sofort einsatzbereit.',
    loginNow: 'Jetzt anmelden',
    webNote: 'Funktioniert auf jedem Gerät · Kein Passwort gespeichert',
    appEyebrow: 'Mobile App',
    appTitle: 'POKYH installieren',
    appSubBefore: 'Lade die App direkt von GitHub: die **.apk** für Android unter',
    appSubMiddle: 'und die **.ipa** für iOS unter',
    appSubAfter: '.',
    ipaHint: '.ipa Datei herunterladen',
    apkHint: '.apk Datei herunterladen',
    appNote: 'Kostenlos · Open Source · Immer aktuell',
    pwaEyebrow: 'Progressive Web App',
    pwaTitle: 'POKYH als PWA installieren',
    pwaWhat: 'Was ist eine PWA?',
    pwaWhatBody: 'Eine **Progressive Web App (PWA)** ist eine Website, die du direkt auf deinem Gerät installieren kannst — ganz ohne App Store oder APK-Datei. POKYH verhält sich danach wie eine native App: eigenes Icon auf dem Startbildschirm, kein sichtbares Browserfenster, schnelles Laden. Updates geschehen automatisch im Hintergrund — du musst nie manuell updaten.',
    pwaChoose: 'Wähle dein Betriebssystem für die Schritt-für-Schritt-Anleitung:',
    viaSafari: 'Installation über Safari',
    viaChrome: 'Installation über Chrome',
    pwaNote: 'Kein App Store · Automatische Updates · Kostenlos',
    back: 'Zurück',
    stepAlt: 'Schritt {num}: {title}',
    iosMetaTitle: 'POKYH auf iPhone installieren – iOS Anleitung',
    iosMetaDescription: 'Lade die aktuelle POKYH App für iOS herunter — direkt von GitHub.',
    iosOgTitle: 'POKYH auf iPhone installieren',
    iosOgDescription: 'Lade dir die aktuelle POKYH App für iOS herunter.',
    iosTitle1: 'POKYH auf iPhone',
    iosTitle2: 'installieren',
    iosSub: 'Lade dir die aktuelle POKYH App für iOS herunter — direkt von GitHub.',
    androidMetaTitle: 'POKYH auf Android installieren – Android Anleitung',
    androidMetaDescription: 'Lade die aktuelle POKYH App für Android herunter — direkt von GitHub.',
    androidOgTitle: 'POKYH auf Android installieren',
    androidOgDescription: 'Lade dir die aktuelle POKYH App für Android herunter.',
    androidTitle1: 'POKYH auf Android',
    androidTitle2: 'installieren',
    androidSub: 'Lade dir die aktuelle POKYH App für Android herunter — direkt von GitHub.',
    appStep1Title: 'Release öffnen',
    appStep1Before: 'Gehe auf',
    appStep1After: 'in deinem Browser.',
    iosStep2Title: '.ipa herunterladen',
    iosStep2Body: 'Suche den neuesten Release und lade die **.ipa** Datei (iOS) herunter.',
    iosStep3Title: 'Installieren & Ausführen',
    iosStep3Body: 'Installiere die .ipa Datei über Sideloading Tools (z.B. AltStore, Sideloadly oder TrollStore) auf deinem iPhone. Danach kannst du die POKYH App ausführen.',
    androidStep2Title: '.apk herunterladen',
    androidStep2Body: 'Suche den neuesten Release und lade die **.apk** Datei (Android) herunter.',
    androidStep3Body: 'Öffne die heruntergeladene Datei und folge den Anweisungen zur Installation (ggf. Apps aus unbekannten Quellen zulassen). Danach kannst du die POKYH App ausführen.',
    pwaIosMetaTitle: 'POKYH PWA auf iPhone installieren – Schritt-für-Schritt iOS Anleitung',
    pwaIosMetaDescription: 'Installiere POKYH als Progressive Web App auf deinem iPhone oder iPad — direkt über Safari, ohne App Store. Kostenlos, automatische Updates.',
    pwaIosOgTitle: 'POKYH PWA auf iPhone installieren',
    pwaIosOgDescription: 'Installiere POKYH als PWA auf dem iPhone — ohne App Store, direkt über Safari.',
    pwaIosSchemaName: 'POKYH als PWA auf iPhone installieren',
    pwaIosSchemaDescription: 'Installiere POKYH als Progressive Web App auf iPhone oder iPad über Safari — ohne App Store.',
    pwaIosTitle1: 'POKYH auf iPhone',
    pwaIosTitle2: 'als PWA installieren',
    pwaIosSub: 'Installiere POKYH direkt über Safari — kein App Store, keine Umwege. Die App landet als Icon auf deinem Home-Bildschirm und aktualisiert sich automatisch.',
    pi1Title: 'Safari öffnen',
    pi1Text: 'Öffne Safari auf deinem iPhone oder iPad und rufe pokyh.com auf. Nur Safari unterstützt PWA-Installation auf iOS.',
    pi1Body: 'Öffne **Safari** auf deinem iPhone oder iPad und rufe **pokyh.com** auf. Wichtig: Die PWA-Installation funktioniert auf iOS **ausschließlich in Safari** — andere Browser wie Chrome oder Firefox unterstützen dies nicht.',
    pi2Title: 'Teilen-Button tippen',
    pi2Text: 'Tippe auf das Teilen-Symbol (Kästchen mit Pfeil nach oben) unten in der Safari-Leiste.',
    pi2Body: 'Tippe auf das **Teilen-Symbol** in der Safari-Menüleiste — das ist das Kästchen mit dem Pfeil nach oben ({icon}). Auf dem iPhone findest du es unten in der Mitte der Safari-Leiste.',
    pi3Title: '„Zum Home-Bildschirm" wählen',
    pi3Text: 'Scrolle im Teilen-Menü nach unten und tippe auf „Zum Home-Bildschirm".',
    pi3Body: 'Scrolle im Teilen-Menü nach unten und tippe auf **„Zum Home-Bildschirm"**. Der Eintrag befindet sich in der unteren Liste der Aktionen — ggf. etwas nach unten scrollen.',
    pi4Title: 'Namen prüfen & bestätigen',
    pi4Text: 'Tippe oben rechts auf „Hinzufügen", um die Installation abzuschließen.',
    pi4Body: 'iOS zeigt dir einen Dialog mit dem Namen der App. Du kannst ihn bei Bedarf anpassen. Tippe oben rechts auf **„Hinzufügen"**, um die Installation abzuschließen.',
    pi5Title: 'Fertig — POKYH starten',
    pi5Text: 'POKYH erscheint als Icon auf deinem Home-Bildschirm und startet im Vollbildmodus ohne Browser-Adressleiste.',
    pi5Body: 'POKYH erscheint jetzt als Icon auf deinem Home-Bildschirm. Tippe darauf, um die App zu öffnen — sie startet im Vollbildmodus ohne Browser-Adressleiste, genau wie eine native App. Updates werden automatisch geladen, sobald du online bist.',
    pwaAndroidMetaTitle: 'POKYH PWA auf Android installieren – Schritt-für-Schritt Anleitung',
    pwaAndroidMetaDescription: 'Installiere POKYH als Progressive Web App auf deinem Android-Gerät — direkt über Chrome, ohne App Store. Kostenlos, automatische Updates.',
    pwaAndroidOgTitle: 'POKYH PWA auf Android installieren',
    pwaAndroidOgDescription: 'Installiere POKYH als PWA auf Android — ohne App Store, direkt über Chrome.',
    pwaAndroidSchemaName: 'POKYH als PWA auf Android installieren',
    pwaAndroidSchemaDescription: 'Installiere POKYH als Progressive Web App auf Android über Chrome — ohne App Store.',
    pwaAndroidTitle1: 'POKYH auf Android',
    pwaAndroidTitle2: 'als PWA installieren',
    pwaAndroidSub: 'Installiere POKYH direkt über Chrome — kein App Store, kein APK-Download. Die App landet als Icon auf deinem Startbildschirm und aktualisiert sich automatisch.',
    pa1Title: 'pokyh.com in Chrome öffnen',
    pa1Text: 'Öffne Google Chrome auf deinem Android-Gerät und rufe pokyh.com auf.',
    pa1Body: 'Öffne **Google Chrome** auf deinem Android-Gerät und rufe **pokyh.com** auf. Die PWA-Installation funktioniert am zuverlässigsten in Chrome.',
    pa2Title: 'Menü öffnen & „Zum Startbildschirm hinzufügen" wählen',
    pa2Text: 'Tippe auf die drei Punkte oben rechts und wähle „Zum Startbildschirm hinzufügen" oder „App installieren".',
    pa2Body: 'Tippe auf die **drei Punkte (⋮)** oben rechts in der Chrome-Adressleiste und wähle im Menü **„Zum Startbildschirm hinzufügen"** oder **„App installieren"**. Der genaue Name kann je nach Chrome-Version leicht variieren.',
    pa3Title: 'Installation bestätigen',
    pa3Text: 'Tippe im Dialog auf „Hinzufügen" oder „Installieren".',
    pa3Body: 'Im erscheinenden Dialog tippst du auf **„Hinzufügen"** oder **„Installieren"**. Android fügt POKYH daraufhin deinem Startbildschirm hinzu.',
    pa4Title: 'Fertig — POKYH starten',
    pa4Text: 'POKYH erscheint als Icon auf deinem Startbildschirm und startet ohne Adressleiste.',
    pa4Body: 'POKYH erscheint jetzt als Icon auf deinem Startbildschirm. Tippe darauf, um die App zu öffnen — sie startet ohne Adressleiste, genau wie eine native App. Updates werden automatisch im Hintergrund geladen.',
  },
  it: {
    metaTitle: 'POKYH – Web e app | LBS Bressanone',
    metaDescription: 'Usa POKYH: accedi direttamente dal browser o installalo come app su iPhone e Android. Basta scaricare il file .apk o .ipa da GitHub.',
    ogDescription: 'Usa POKYH nel browser o installalo come app su iPhone e Android.',
    twitterDescription: 'POKYH nel browser o come app su iPhone e Android.',
    tabsAria: 'Selezione contenuto',
    tabWeb: 'Login web',
    webEyebrow: 'Inizia subito',
    webTitle: 'Usa POKYH nel browser',
    webSub: 'Nessun download, nessuna installazione. Accedi con il tuo **account WebUntis** — gratis e subito pronto.',
    loginNow: 'Accedi ora',
    webNote: 'Funziona su ogni dispositivo · Nessuna password salvata',
    appEyebrow: 'App mobile',
    appTitle: 'Installa POKYH',
    appSubBefore: 'Scarica l’app direttamente da GitHub: il file **.apk** per Android su',
    appSubMiddle: 'e il file **.ipa** per iOS su',
    appSubAfter: '.',
    ipaHint: 'Scarica il file .ipa',
    apkHint: 'Scarica il file .apk',
    appNote: 'Gratis · Open source · Sempre aggiornata',
    pwaEyebrow: 'Progressive Web App',
    pwaTitle: 'Installa POKYH come PWA',
    pwaWhat: 'Cos’è una PWA?',
    pwaWhatBody: 'Una **Progressive Web App (PWA)** è un sito web che puoi installare direttamente sul tuo dispositivo — senza app store né file APK. POKYH si comporta poi come un’app nativa: icona propria nella schermata home, nessuna finestra del browser visibile, caricamento veloce. Gli aggiornamenti avvengono automaticamente in background — non devi mai aggiornare a mano.',
    pwaChoose: 'Scegli il tuo sistema operativo per la guida passo passo:',
    viaSafari: 'Installazione tramite Safari',
    viaChrome: 'Installazione tramite Chrome',
    pwaNote: 'Nessun app store · Aggiornamenti automatici · Gratis',
    back: 'Indietro',
    stepAlt: 'Passo {num}: {title}',
    iosMetaTitle: 'Installa POKYH su iPhone – Guida iOS',
    iosMetaDescription: 'Scarica l’ultima app POKYH per iOS — direttamente da GitHub.',
    iosOgTitle: 'Installa POKYH su iPhone',
    iosOgDescription: 'Scarica l’ultima app POKYH per iOS.',
    iosTitle1: 'Installa POKYH',
    iosTitle2: 'su iPhone',
    iosSub: 'Scarica l’ultima app POKYH per iOS — direttamente da GitHub.',
    androidMetaTitle: 'Installa POKYH su Android – Guida Android',
    androidMetaDescription: 'Scarica l’ultima app POKYH per Android — direttamente da GitHub.',
    androidOgTitle: 'Installa POKYH su Android',
    androidOgDescription: 'Scarica l’ultima app POKYH per Android.',
    androidTitle1: 'Installa POKYH',
    androidTitle2: 'su Android',
    androidSub: 'Scarica l’ultima app POKYH per Android — direttamente da GitHub.',
    appStep1Title: 'Apri la release',
    appStep1Before: 'Vai su',
    appStep1After: 'nel tuo browser.',
    iosStep2Title: 'Scarica il file .ipa',
    iosStep2Body: 'Cerca la release più recente e scarica il file **.ipa** (iOS).',
    iosStep3Title: 'Installa e avvia',
    iosStep3Body: 'Installa il file .ipa sul tuo iPhone tramite strumenti di sideloading (ad es. AltStore, Sideloadly o TrollStore). Dopodiché puoi avviare l’app POKYH.',
    androidStep2Title: 'Scarica il file .apk',
    androidStep2Body: 'Cerca la release più recente e scarica il file **.apk** (Android).',
    androidStep3Body: 'Apri il file scaricato e segui le istruzioni di installazione (se necessario consenti le app da origini sconosciute). Dopodiché puoi avviare l’app POKYH.',
    pwaIosMetaTitle: 'Installa la PWA di POKYH su iPhone – Guida iOS passo passo',
    pwaIosMetaDescription: 'Installa POKYH come Progressive Web App sul tuo iPhone o iPad — direttamente tramite Safari, senza App Store. Gratis, aggiornamenti automatici.',
    pwaIosOgTitle: 'Installa la PWA di POKYH su iPhone',
    pwaIosOgDescription: 'Installa POKYH come PWA su iPhone — senza App Store, direttamente tramite Safari.',
    pwaIosSchemaName: 'Installare POKYH come PWA su iPhone',
    pwaIosSchemaDescription: 'Installa POKYH come Progressive Web App su iPhone o iPad tramite Safari — senza App Store.',
    pwaIosTitle1: 'Installa POKYH su iPhone',
    pwaIosTitle2: 'come PWA',
    pwaIosSub: 'Installa POKYH direttamente tramite Safari — nessun App Store, nessuna deviazione. L’app appare come icona nella schermata home e si aggiorna automaticamente.',
    pi1Title: 'Apri Safari',
    pi1Text: 'Apri Safari sul tuo iPhone o iPad e vai su pokyh.com. Solo Safari supporta l’installazione di PWA su iOS.',
    pi1Body: 'Apri **Safari** sul tuo iPhone o iPad e vai su **pokyh.com**. Importante: su iOS l’installazione della PWA funziona **solo in Safari** — altri browser come Chrome o Firefox non la supportano.',
    pi2Title: 'Tocca il pulsante Condividi',
    pi2Text: 'Tocca l’icona Condividi (quadrato con freccia verso l’alto) nella barra di Safari.',
    pi2Body: 'Tocca l’**icona Condividi** nella barra dei menu di Safari — è il quadrato con la freccia verso l’alto ({icon}). Su iPhone la trovi in basso al centro della barra di Safari.',
    pi3Title: 'Scegli “Aggiungi alla schermata Home”',
    pi3Text: 'Scorri verso il basso nel menu Condividi e tocca “Aggiungi alla schermata Home”.',
    pi3Body: 'Scorri verso il basso nel menu Condividi e tocca **“Aggiungi alla schermata Home”**. La voce si trova nell’elenco inferiore delle azioni — se necessario scorri un po’ verso il basso.',
    pi4Title: 'Controlla il nome e conferma',
    pi4Text: 'Tocca “Aggiungi” in alto a destra per completare l’installazione.',
    pi4Body: 'iOS mostra una finestra con il nome dell’app. Se vuoi puoi modificarlo. Tocca **“Aggiungi”** in alto a destra per completare l’installazione.',
    pi5Title: 'Fatto — avvia POKYH',
    pi5Text: 'POKYH appare come icona nella schermata home e si avvia a schermo intero senza barra degli indirizzi.',
    pi5Body: 'Ora POKYH appare come icona nella schermata home. Toccala per aprire l’app — si avvia a schermo intero senza la barra degli indirizzi del browser, proprio come un’app nativa. Gli aggiornamenti vengono caricati automaticamente quando sei online.',
    pwaAndroidMetaTitle: 'Installa la PWA di POKYH su Android – Guida passo passo',
    pwaAndroidMetaDescription: 'Installa POKYH come Progressive Web App sul tuo dispositivo Android — direttamente tramite Chrome, senza app store. Gratis, aggiornamenti automatici.',
    pwaAndroidOgTitle: 'Installa la PWA di POKYH su Android',
    pwaAndroidOgDescription: 'Installa POKYH come PWA su Android — senza app store, direttamente tramite Chrome.',
    pwaAndroidSchemaName: 'Installare POKYH come PWA su Android',
    pwaAndroidSchemaDescription: 'Installa POKYH come Progressive Web App su Android tramite Chrome — senza app store.',
    pwaAndroidTitle1: 'Installa POKYH su Android',
    pwaAndroidTitle2: 'come PWA',
    pwaAndroidSub: 'Installa POKYH direttamente tramite Chrome — nessun app store, nessun download di APK. L’app appare come icona nella schermata home e si aggiorna automaticamente.',
    pa1Title: 'Apri pokyh.com in Chrome',
    pa1Text: 'Apri Google Chrome sul tuo dispositivo Android e vai su pokyh.com.',
    pa1Body: 'Apri **Google Chrome** sul tuo dispositivo Android e vai su **pokyh.com**. L’installazione della PWA funziona in modo più affidabile in Chrome.',
    pa2Title: 'Apri il menu e scegli “Aggiungi a schermata Home”',
    pa2Text: 'Tocca i tre puntini in alto a destra e scegli “Aggiungi a schermata Home” o “Installa app”.',
    pa2Body: 'Tocca i **tre puntini (⋮)** in alto a destra nella barra degli indirizzi di Chrome e scegli nel menu **“Aggiungi a schermata Home”** o **“Installa app”**. Il nome esatto può variare leggermente a seconda della versione di Chrome.',
    pa3Title: 'Conferma l’installazione',
    pa3Text: 'Nella finestra tocca “Aggiungi” o “Installa”.',
    pa3Body: 'Nella finestra che appare tocca **“Aggiungi”** o **“Installa”**. Android aggiunge quindi POKYH alla schermata home.',
    pa4Title: 'Fatto — avvia POKYH',
    pa4Text: 'POKYH appare come icona nella schermata home e si avvia senza barra degli indirizzi.',
    pa4Body: 'Ora POKYH appare come icona nella schermata home. Toccala per aprire l’app — si avvia senza barra degli indirizzi, proprio come un’app nativa. Gli aggiornamenti vengono caricati automaticamente in background.',
  },
  en: {
    metaTitle: 'POKYH – Web & app | LBS Brixen',
    metaDescription: 'Use POKYH: log in right in your browser or install it as an app on iPhone and Android. Just grab the .apk or .ipa from GitHub.',
    ogDescription: 'Use POKYH in your browser or install it as an app on iPhone and Android.',
    twitterDescription: 'POKYH in your browser or as an app on iPhone and Android.',
    tabsAria: 'Choose content',
    tabWeb: 'Web login',
    webEyebrow: 'Get started now',
    webTitle: 'Use POKYH in your browser',
    webSub: 'No download, no installation. Log in with your **WebUntis account** — free and ready right away.',
    loginNow: 'Log in now',
    webNote: 'Works on any device · No password stored',
    appEyebrow: 'Mobile app',
    appTitle: 'Install POKYH',
    appSubBefore: 'Download the app straight from GitHub: the **.apk** for Android at',
    appSubMiddle: 'and the **.ipa** for iOS at',
    appSubAfter: '.',
    ipaHint: 'Download the .ipa file',
    apkHint: 'Download the .apk file',
    appNote: 'Free · Open source · Always up to date',
    pwaEyebrow: 'Progressive Web App',
    pwaTitle: 'Install POKYH as a PWA',
    pwaWhat: 'What is a PWA?',
    pwaWhatBody: 'A **Progressive Web App (PWA)** is a website you can install right on your device — no app store or APK file needed. POKYH then behaves like a native app: its own icon on your home screen, no visible browser window, fast loading. Updates happen automatically in the background — you never have to update manually.',
    pwaChoose: 'Choose your operating system for the step-by-step guide:',
    viaSafari: 'Install via Safari',
    viaChrome: 'Install via Chrome',
    pwaNote: 'No app store · Automatic updates · Free',
    back: 'Back',
    stepAlt: 'Step {num}: {title}',
    iosMetaTitle: 'Install POKYH on iPhone – iOS guide',
    iosMetaDescription: 'Download the latest POKYH app for iOS — straight from GitHub.',
    iosOgTitle: 'Install POKYH on iPhone',
    iosOgDescription: 'Download the latest POKYH app for iOS.',
    iosTitle1: 'Install POKYH',
    iosTitle2: 'on iPhone',
    iosSub: 'Download the latest POKYH app for iOS — straight from GitHub.',
    androidMetaTitle: 'Install POKYH on Android – Android guide',
    androidMetaDescription: 'Download the latest POKYH app for Android — straight from GitHub.',
    androidOgTitle: 'Install POKYH on Android',
    androidOgDescription: 'Download the latest POKYH app for Android.',
    androidTitle1: 'Install POKYH',
    androidTitle2: 'on Android',
    androidSub: 'Download the latest POKYH app for Android — straight from GitHub.',
    appStep1Title: 'Open the release',
    appStep1Before: 'Go to',
    appStep1After: 'in your browser.',
    iosStep2Title: 'Download the .ipa',
    iosStep2Body: 'Find the latest release and download the **.ipa** file (iOS).',
    iosStep3Title: 'Install & run',
    iosStep3Body: 'Install the .ipa file on your iPhone using a sideloading tool (e.g. AltStore, Sideloadly or TrollStore). After that you can run the POKYH app.',
    androidStep2Title: 'Download the .apk',
    androidStep2Body: 'Find the latest release and download the **.apk** file (Android).',
    androidStep3Body: 'Open the downloaded file and follow the installation prompts (you may need to allow apps from unknown sources). After that you can run the POKYH app.',
    pwaIosMetaTitle: 'Install the POKYH PWA on iPhone – Step-by-step iOS guide',
    pwaIosMetaDescription: 'Install POKYH as a Progressive Web App on your iPhone or iPad — right from Safari, no App Store. Free, automatic updates.',
    pwaIosOgTitle: 'Install the POKYH PWA on iPhone',
    pwaIosOgDescription: 'Install POKYH as a PWA on iPhone — no App Store, right from Safari.',
    pwaIosSchemaName: 'Install POKYH as a PWA on iPhone',
    pwaIosSchemaDescription: 'Install POKYH as a Progressive Web App on iPhone or iPad via Safari — no App Store.',
    pwaIosTitle1: 'Install POKYH on iPhone',
    pwaIosTitle2: 'as a PWA',
    pwaIosSub: 'Install POKYH right from Safari — no App Store, no detours. The app lands as an icon on your home screen and updates itself automatically.',
    pi1Title: 'Open Safari',
    pi1Text: 'Open Safari on your iPhone or iPad and go to pokyh.com. Only Safari supports installing PWAs on iOS.',
    pi1Body: 'Open **Safari** on your iPhone or iPad and go to **pokyh.com**. Important: on iOS, installing the PWA works **only in Safari** — other browsers such as Chrome or Firefox don’t support it.',
    pi2Title: 'Tap the Share button',
    pi2Text: 'Tap the Share icon (square with an arrow pointing up) in the Safari toolbar.',
    pi2Body: 'Tap the **Share icon** in the Safari toolbar — it’s the square with the arrow pointing up ({icon}). On iPhone you’ll find it at the bottom centre of the Safari bar.',
    pi3Title: 'Choose “Add to Home Screen”',
    pi3Text: 'Scroll down in the Share menu and tap “Add to Home Screen”.',
    pi3Body: 'Scroll down in the Share menu and tap **“Add to Home Screen”**. It’s in the lower list of actions — you may need to scroll down a little.',
    pi4Title: 'Check the name & confirm',
    pi4Text: 'Tap “Add” in the top right to finish the installation.',
    pi4Body: 'iOS shows a dialog with the app’s name. You can change it if you like. Tap **“Add”** in the top right to finish the installation.',
    pi5Title: 'Done — launch POKYH',
    pi5Text: 'POKYH appears as an icon on your home screen and launches full screen without the browser address bar.',
    pi5Body: 'POKYH now appears as an icon on your home screen. Tap it to open the app — it launches full screen without the browser address bar, just like a native app. Updates load automatically whenever you’re online.',
    pwaAndroidMetaTitle: 'Install the POKYH PWA on Android – Step-by-step guide',
    pwaAndroidMetaDescription: 'Install POKYH as a Progressive Web App on your Android device — right from Chrome, no app store. Free, automatic updates.',
    pwaAndroidOgTitle: 'Install the POKYH PWA on Android',
    pwaAndroidOgDescription: 'Install POKYH as a PWA on Android — no app store, right from Chrome.',
    pwaAndroidSchemaName: 'Install POKYH as a PWA on Android',
    pwaAndroidSchemaDescription: 'Install POKYH as a Progressive Web App on Android via Chrome — no app store.',
    pwaAndroidTitle1: 'Install POKYH on Android',
    pwaAndroidTitle2: 'as a PWA',
    pwaAndroidSub: 'Install POKYH right from Chrome — no app store, no APK download. The app lands as an icon on your home screen and updates itself automatically.',
    pa1Title: 'Open pokyh.com in Chrome',
    pa1Text: 'Open Google Chrome on your Android device and go to pokyh.com.',
    pa1Body: 'Open **Google Chrome** on your Android device and go to **pokyh.com**. Installing the PWA works most reliably in Chrome.',
    pa2Title: 'Open the menu & choose “Add to Home screen”',
    pa2Text: 'Tap the three dots in the top right and choose “Add to Home screen” or “Install app”.',
    pa2Body: 'Tap the **three dots (⋮)** in the top right of the Chrome address bar and choose **“Add to Home screen”** or **“Install app”** from the menu. The exact name may vary slightly depending on your Chrome version.',
    pa3Title: 'Confirm the installation',
    pa3Text: 'In the dialog, tap “Add” or “Install”.',
    pa3Body: 'In the dialog that appears, tap **“Add”** or **“Install”**. Android then adds POKYH to your home screen.',
    pa4Title: 'Done — launch POKYH',
    pa4Text: 'POKYH appears as an icon on your home screen and launches without the address bar.',
    pa4Body: 'POKYH now appears as an icon on your home screen. Tap it to open the app — it launches without the address bar, just like a native app. Updates load automatically in the background.',
  },
  lld: {
    metaTitle: "POKYH – Web y app | LBS Porsenù",
    metaDescription: "Adurvé POKYH: jì ite diretamënter tl browser o l nstalé coche app sun iPhone y Android. Ciarieia mé ju l .apk o l .ipa da GitHub.",
    ogDescription: "Adurvea POKYH tl browser o nstalel coche app sun iPhone y Android.",
    twitterDescription: "POKYH tl browser o coche app sun iPhone y Android.",
    tabsAria: "Cërnuda dl cuntenut",
    tabWeb: "Login web",
    webEyebrow: "Scumencé sibe",
    webTitle: "Adurvé POKYH tl browser",
    webSub: "Zënza download, zënza nstalazion. Va ite cun ti **account WebUntis** — debant y sibe pront.",
    loginNow: "Jì ite sën",
    webNote: "Funzionea sun uni dispusitif · Deguna password salveda",
    appEyebrow: "App mobila",
    appTitle: "Nstalé POKYH",
    appSubBefore: "Ciarieia ju l’app diretamënter da GitHub: l **.apk** per Android sot",
    appSubMiddle: "y l **.ipa** per iOS sot",
    appSubAfter: ".",
    ipaHint: "Ciarië ju l file .ipa",
    apkHint: "Ciarië ju l file .apk",
    appNote: "Debant · Open source · For atualisà",
    pwaEyebrow: "Progressive Web App",
    pwaTitle: "Nstalé POKYH coche PWA",
    pwaWhat: "Ci ie pa na PWA?",
    pwaWhatBody: "Na **Progressive Web App (PWA)** ie na plata web che tu pos nstalé diretamënter sun ti dispusitif — zënza app store o file APK. POKYH se cumpurtea pona coche n’app nativa: icona sun l schermo de partënza, degun fenester dl browser, se cëria svelt. La atualisazions suzed da sëula tl fon — tu ne muesses mai atualisé a man.",
    pwaChoose: "Cerni ti sistem operatif per la istruzions pas per pas:",
    viaSafari: "Nstalazion tres Safari",
    viaChrome: "Nstalazion tres Chrome",
    pwaNote: "Degun app store · Atualisazions da sëula · Debant",
    back: "Zeruch",
    stepAlt: "Pas {num}: {title}",
    iosMetaTitle: "Nstalé POKYH sun l iPhone – Istruzions iOS",
    iosMetaDescription: "Ciarieia ju l’ultima app POKYH per iOS — diretamënter da GitHub.",
    iosOgTitle: "Nstalé POKYH sun l iPhone",
    iosOgDescription: "Ciarieia ju l’ultima app POKYH per iOS.",
    iosTitle1: "Nstalé POKYH",
    iosTitle2: "sun l iPhone",
    iosSub: "Ciarieia ju l’ultima app POKYH per iOS — diretamënter da GitHub.",
    androidMetaTitle: "Nstalé POKYH sun Android – Istruzions Android",
    androidMetaDescription: "Ciarieia ju l’ultima app POKYH per Android — diretamënter da GitHub.",
    androidOgTitle: "Nstalé POKYH sun Android",
    androidOgDescription: "Ciarieia ju l’ultima app POKYH per Android.",
    androidTitle1: "Nstalé POKYH",
    androidTitle2: "sun Android",
    androidSub: "Ciarieia ju l’ultima app POKYH per Android — diretamënter da GitHub.",
    appStep1Title: "Giaurì l release",
    appStep1Before: "Va sun",
    appStep1After: "te ti browser.",
    iosStep2Title: "Ciarië ju l .ipa",
    iosStep2Body: "Crì l release plu nuef y ciarieia ju l file **.ipa** (iOS).",
    iosStep3Title: "Nstalé y nvië",
    iosStep3Body: "Nstalea l file .ipa sun ti iPhone cun n strumënt de sideloading (p.ej. AltStore, Sideloadly o TrollStore). Pona pos nvië l’app POKYH.",
    androidStep2Title: "Ciarië ju l .apk",
    androidStep2Body: "Crì l release plu nuef y ciarieia ju l file **.apk** (Android).",
    androidStep3Body: "Giaurësc l file ciarià ju y va do la istruzions per la nstalazion (sce l ie de bujën lascia tlo app da fonc nia cunesciudes). Pona pos nvië l’app POKYH.",
    pwaIosMetaTitle: "Nstalé la PWA de POKYH sun l iPhone – Istruzions iOS pas per pas",
    pwaIosMetaDescription: "Nstalea POKYH coche Progressive Web App sun ti iPhone o iPad — diretamënter tres Safari, zënza App Store. Debant, atualisazions da sëula.",
    pwaIosOgTitle: "Nstalé la PWA de POKYH sun l iPhone",
    pwaIosOgDescription: "Nstalea POKYH coche PWA sun l iPhone — zënza App Store, diretamënter tres Safari.",
    pwaIosSchemaName: "Nstalé POKYH coche PWA sun l iPhone",
    pwaIosSchemaDescription: "Nstalea POKYH coche Progressive Web App sun iPhone o iPad tres Safari — zënza App Store.",
    pwaIosTitle1: "Nstalé POKYH sun l iPhone",
    pwaIosTitle2: "coche PWA",
    pwaIosSub: "Nstalea POKYH diretamënter tres Safari — zënza App Store, zënza fadies. L’app ruva coche icona sun ti schermo de partënza y se atualisea da sëula.",
    pi1Title: "Giaurì Safari",
    pi1Text: "Giaurësc Safari sun ti iPhone o iPad y va sun pokyh.com. Mé Safari sustën la nstalazion de PWA sun iOS.",
    pi1Body: "Giaurësc **Safari** sun ti iPhone o iPad y va sun **pokyh.com**. Mpurtant: sun iOS funzionea la nstalazion dla PWA **mé te Safari** — d’autri browser coche Chrome o Firefox ne l sustën nia.",
    pi2Title: "Tuché l bot Pertì",
    pi2Text: "Tuca l’icona Pertì (cheder cun na flecia sù) te la trat de Safari.",
    pi2Body: "Tuca l’**icona Pertì** te la trat di menu de Safari — l ie l cheder cun la flecia sù ({icon}). Sun l iPhone la ciafes ju tl mez dla trat de Safari.",
    pi3Title: "Cerni „Al schermo Home“",
    pi3Text: "Va ju tl menu Pertì y tuca „Al schermo Home“.",
    pi3Body: "Va ju tl menu Pertì y tuca **„Al schermo Home“**. La funzion ie tla lista dessot dla azions — sce l ie de bujën va mo n pue ju.",
    pi4Title: "Cntrolé l inuem y cunfermé",
    pi4Text: "Tuca de sëura a man drëta „Junté“ per fenì la nstalazion.",
    pi4Body: "iOS te mostra n dialog cun l inuem dl’app. Sce tu ues l pos mudé. Tuca de sëura a man drëta **„Junté“** per fenì la nstalazion.",
    pi5Title: "Fat — nvië POKYH",
    pi5Text: "POKYH cumpar coche icona sun ti schermo de partënza y se nviea sun dut l schermo zënza la barra dl browser.",
    pi5Body: "POKYH cumpar sën coche icona sun ti schermo de partënza. Tuchela per giaurì l’app — la se nviea sun dut l schermo zënza la barra dl browser, dantaldut coche n’app nativa. La atualisazions vën ciariedes da sëula canche tu ies online.",
    pwaAndroidMetaTitle: "Nstalé la PWA de POKYH sun Android – Istruzions pas per pas",
    pwaAndroidMetaDescription: "Nstalea POKYH coche Progressive Web App sun ti dispusitif Android — diretamënter tres Chrome, zënza app store. Debant, atualisazions da sëula.",
    pwaAndroidOgTitle: "Nstalé la PWA de POKYH sun Android",
    pwaAndroidOgDescription: "Nstalea POKYH coche PWA sun Android — zënza app store, diretamënter tres Chrome.",
    pwaAndroidSchemaName: "Nstalé POKYH coche PWA sun Android",
    pwaAndroidSchemaDescription: "Nstalea POKYH coche Progressive Web App sun Android tres Chrome — zënza app store.",
    pwaAndroidTitle1: "Nstalé POKYH sun Android",
    pwaAndroidTitle2: "coche PWA",
    pwaAndroidSub: "Nstalea POKYH diretamënter tres Chrome — zënza app store, zënza download de APK. L’app ruva coche icona sun ti schermo de partënza y se atualisea da sëula.",
    pa1Title: "Giaurì pokyh.com te Chrome",
    pa1Text: "Giaurësc Google Chrome sun ti dispusitif Android y va sun pokyh.com.",
    pa1Body: "Giaurësc **Google Chrome** sun ti dispusitif Android y va sun **pokyh.com**. La nstalazion dla PWA funzionea l miec te Chrome.",
    pa2Title: "Giaurì l menu y cerni „Junté al schermo de partënza“",
    pa2Text: "Tuca i trëi ponc de sëura a man drëta y cerni „Junté al schermo de partënza“ o „Nstalé l’app“.",
    pa2Body: "Tuca i **trëi ponc (⋮)** de sëura a man drëta tla barra de Chrome y cerni tl menu **„Junté al schermo de partënza“** o **„Nstalé l’app“**. L inuem esat pò mudé n pue aldò dla verscion de Chrome.",
    pa3Title: "Cunfermé la nstalazion",
    pa3Text: "Tuca tl dialog „Junté“ o „Nstalé“.",
    pa3Body: "Tl dialog che cumpar tuches **„Junté“** o **„Nstalé“**. Android junta pona POKYH a ti schermo de partënza.",
    pa4Title: "Fat — nvië POKYH",
    pa4Text: "POKYH cumpar coche icona sun ti schermo de partënza y se nviea zënza la barra dl browser.",
    pa4Body: "POKYH cumpar sën coche icona sun ti schermo de partënza. Tuchela per giaurì l’app — la se nviea zënza la barra dl browser, dantaldut coche n’app nativa. La atualisazions vën ciariedes da sëula tl fon.",
  },
};
