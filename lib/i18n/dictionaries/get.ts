import type { Dictionary } from '../dictionary';

type PiStep = 1 | 2 | 3 | 4 | 5;
type PaStep = 1 | 2 | 3 | 4;

export type GetKey =
  | 'metaTitle'
  | 'metaDescription'
  | 'ogDescription'
  | 'twitterDescription'
  | 'title'
  | 'lead'
  | 'recommended'
  | 'webTitle'
  | 'webBody'
  | 'webCta'
  | 'androidTitle'
  | 'androidBody'
  | 'iosTitle'
  | 'iosBody'
  | 'guide'
  | 'releases'
  | 'pwaTitle'
  | 'pwaBody'
  | 'pwaIos'
  | 'pwaAndroid'
  | 'pwaWhatTitle'
  | 'pwaWhatBody'
  | 'back'
  | 'stepAlt'
  | 'iosMetaTitle'
  | 'iosMetaDescription'
  | 'iosOgTitle'
  | 'iosOgDescription'
  | 'androidMetaTitle'
  | 'androidMetaDescription'
  | 'androidOgTitle'
  | 'androidOgDescription'
  | 'appIosTitle'
  | 'appIosLead'
  | 'appAndroidTitle'
  | 'appAndroidLead'
  | 'appStep1Title'
  | 'appStep1Body'
  | 'iosStep2Title'
  | 'iosStep2Body'
  | 'iosStep3Title'
  | 'iosStep3Body'
  | 'androidStep2Title'
  | 'androidStep2Body'
  | 'androidStep3Title'
  | 'androidStep3Body'
  | 'pwaIosMetaTitle'
  | 'pwaIosMetaDescription'
  | 'pwaIosOgTitle'
  | 'pwaIosOgDescription'
  | 'pwaIosSchemaName'
  | 'pwaIosSchemaDescription'
  | 'pwaIosTitle'
  | 'pwaIosLead'
  | 'pwaAndroidMetaTitle'
  | 'pwaAndroidMetaDescription'
  | 'pwaAndroidOgTitle'
  | 'pwaAndroidOgDescription'
  | 'pwaAndroidSchemaName'
  | 'pwaAndroidSchemaDescription'
  | 'pwaAndroidTitle'
  | 'pwaAndroidLead'
  | `pi${PiStep}Title`
  | `pi${PiStep}Text`
  | `pi${PiStep}Body`
  | `pa${PaStep}Title`
  | `pa${PaStep}Text`
  | `pa${PaStep}Body`;

export const getDict: Dictionary<GetKey> = {
  de: {
    metaTitle: 'App holen: Browser, Web-App, iPhone und Android',
    metaDescription: 'POKYH nutzen: direkt im Browser anmelden, als App auf iPhone und Android installieren oder als Web-App auf den Homescreen legen.',
    ogDescription: 'POKYH im Browser nutzen oder als App auf iPhone und Android installieren.',
    twitterDescription: 'POKYH im Browser oder als App auf iPhone und Android.',
    title: 'POKYH holen.',
    lead: 'Im Browser, als App für Android und iPhone oder als Web-App auf dem Homescreen. Überall dasselbe Konto.',
    recommended: 'Am einfachsten',
    webTitle: 'Im Browser',
    webBody: 'pokyh.com öffnen und mit deinem WebUntis-Konto anmelden. Kein Download, funktioniert auf jedem Gerät.',
    webCta: 'Anmelden',
    androidTitle: 'Android-App',
    androidBody: 'Die native App für Android als APK-Datei, direkt aus den Releases auf GitHub.',
    iosTitle: 'iPhone-App',
    iosBody: 'Die native App für iOS als IPA-Datei. Installiert wird sie mit einem Sideloading-Tool.',
    guide: 'Anleitung',
    releases: 'Releases auf GitHub',
    pwaTitle: 'Web-App auf dem Homescreen',
    pwaBody: 'POKYH wie eine App installieren, ohne App Store. Eigenes Symbol, kein Browserfenster, Updates kommen automatisch.',
    pwaIos: 'iPhone, mit Safari',
    pwaAndroid: 'Android, mit Chrome',
    pwaWhatTitle: 'Was ist eine Web-App?',
    pwaWhatBody: 'Eine Website, die sich wie eine App installieren lässt. Sie bekommt ein Symbol auf dem Homescreen, öffnet ohne Adressleiste und lädt schnell. Neue Versionen kommen von selbst, du musst nichts aktualisieren.',
    back: 'Alle Wege',
    stepAlt: 'Schritt {num}: {title}',
    iosMetaTitle: 'POKYH auf dem iPhone installieren: Anleitung für iOS',
    iosMetaDescription: 'POKYH für iPhone und iPad: die aktuelle App für iOS direkt von GitHub laden und installieren. Stundenplan, Noten und Nachrichten aus WebUntis, kostenlos.',
    iosOgTitle: 'POKYH auf dem iPhone installieren',
    iosOgDescription: 'Die aktuelle POKYH App für iOS herunterladen.',
    androidMetaTitle: 'POKYH auf Android installieren: Anleitung',
    androidMetaDescription: 'POKYH für Android: die aktuelle App direkt von GitHub laden und installieren. Stundenplan, Noten und Nachrichten aus WebUntis, kostenlos und ohne Werbung.',
    androidOgTitle: 'POKYH auf Android installieren',
    androidOgDescription: 'Die aktuelle POKYH App für Android herunterladen.',
    appIosTitle: 'POKYH auf dem iPhone installieren.',
    appIosLead: 'Die native iOS-App gibt es als IPA-Datei in den Releases auf GitHub.',
    appAndroidTitle: 'POKYH auf Android installieren.',
    appAndroidLead: 'Die native Android-App gibt es als APK-Datei in den Releases auf GitHub.',
    appStep1Title: 'Releases öffnen',
    appStep1Body: 'Öffne die Releases-Seite auf GitHub in deinem Browser: {link}',
    iosStep2Title: 'IPA herunterladen',
    iosStep2Body: 'Nimm den neuesten Release und lade die **.ipa**-Datei herunter.',
    iosStep3Title: 'Installieren',
    iosStep3Body: 'Installiere die Datei mit einem Sideloading-Tool wie AltStore, Sideloadly oder TrollStore. Danach startet POKYH wie jede andere App.',
    androidStep2Title: 'APK herunterladen',
    androidStep2Body: 'Nimm den neuesten Release und lade die **.apk**-Datei herunter.',
    androidStep3Title: 'Installieren',
    androidStep3Body: 'Öffne die Datei und folge der Installation. Eventuell musst du Apps aus unbekannten Quellen erlauben.',
    pwaIosMetaTitle: 'POKYH als Web-App auf dem iPhone installieren: Anleitung',
    pwaIosMetaDescription: 'POKYH als Progressive Web App auf iPhone oder iPad installieren, direkt über Safari und ohne App Store. Kostenlos, mit automatischen Updates.',
    pwaIosOgTitle: 'POKYH als Web-App auf dem iPhone',
    pwaIosOgDescription: 'POKYH auf dem iPhone installieren, ohne App Store, direkt über Safari.',
    pwaIosSchemaName: 'POKYH als Web-App auf dem iPhone installieren',
    pwaIosSchemaDescription: 'POKYH als Progressive Web App auf iPhone oder iPad über Safari installieren, ohne App Store.',
    pwaIosTitle: 'POKYH auf den Homescreen deines iPhones.',
    pwaIosLead: 'Mit Safari in einer Minute. Die App landet als Symbol auf dem Homescreen und aktualisiert sich selbst.',
    pwaAndroidMetaTitle: 'POKYH als Web-App auf Android installieren: Anleitung',
    pwaAndroidMetaDescription: 'POKYH als Progressive Web App auf Android installieren, direkt über Chrome und ohne App Store. Kostenlos, mit automatischen Updates.',
    pwaAndroidOgTitle: 'POKYH als Web-App auf Android',
    pwaAndroidOgDescription: 'POKYH auf Android installieren, ohne App Store, direkt über Chrome.',
    pwaAndroidSchemaName: 'POKYH als Web-App auf Android installieren',
    pwaAndroidSchemaDescription: 'POKYH als Progressive Web App auf Android über Chrome installieren, ohne App Store.',
    pwaAndroidTitle: 'POKYH auf den Startbildschirm deines Android-Handys.',
    pwaAndroidLead: 'Mit Chrome in einer Minute. Die App landet als Symbol auf dem Startbildschirm und aktualisiert sich selbst.',
    pi1Title: 'Safari öffnen',
    pi1Text: 'Öffne Safari und rufe pokyh.com auf.',
    pi1Body: 'Öffne **Safari** auf deinem iPhone oder iPad und rufe **pokyh.com** auf. Auf iOS klappt die Installation nur in Safari.',
    pi2Title: 'Teilen tippen',
    pi2Text: 'Tippe auf das Teilen-Symbol in der Safari-Leiste.',
    pi2Body: 'Tippe auf das **Teilen-Symbol** {icon}, das Kästchen mit dem Pfeil nach oben. Auf dem iPhone ist es unten in der Mitte.',
    pi3Title: '„Zum Home-Bildschirm“',
    pi3Text: 'Wähle im Teilen-Menü „Zum Home-Bildschirm“.',
    pi3Body: 'Scrolle im Menü nach unten und tippe auf **„Zum Home-Bildschirm“**.',
    pi4Title: 'Hinzufügen',
    pi4Text: 'Tippe oben rechts auf „Hinzufügen“.',
    pi4Body: 'Den Namen kannst du anpassen. Tippe dann oben rechts auf **„Hinzufügen“**.',
    pi5Title: 'Fertig',
    pi5Text: 'POKYH liegt jetzt als Symbol auf deinem Homescreen.',
    pi5Body: 'POKYH liegt als Symbol auf deinem Homescreen und startet im Vollbild, ohne Adressleiste. Updates kommen automatisch.',
    pa1Title: 'Chrome öffnen',
    pa1Text: 'Öffne Chrome und rufe pokyh.com auf.',
    pa1Body: 'Öffne **Google Chrome** auf deinem Android-Gerät und rufe **pokyh.com** auf.',
    pa2Title: 'Menü öffnen',
    pa2Text: 'Tippe auf die drei Punkte und wähle „App installieren“.',
    pa2Body: 'Tippe oben rechts auf die **drei Punkte (⋮)** und wähle **„Zum Startbildschirm hinzufügen“** oder **„App installieren“**.',
    pa3Title: 'Bestätigen',
    pa3Text: 'Tippe auf „Installieren“.',
    pa3Body: 'Tippe im Dialog auf **„Installieren“** oder **„Hinzufügen“**.',
    pa4Title: 'Fertig',
    pa4Text: 'POKYH liegt jetzt auf deinem Startbildschirm.',
    pa4Body: 'POKYH liegt als Symbol auf deinem Startbildschirm und öffnet ohne Adressleiste. Updates kommen automatisch.',
  },
  it: {
    metaTitle: 'Ottieni l’app: browser, web app, iPhone e Android',
    metaDescription: 'Usare POKYH: accedi nel browser, installa l’app su iPhone e Android o aggiungi la web app alla schermata Home.',
    ogDescription: 'Usa POKYH nel browser o installa l’app su iPhone e Android.',
    twitterDescription: 'POKYH nel browser o come app su iPhone e Android.',
    title: 'Scarica POKYH.',
    lead: 'Nel browser, come app per Android e iPhone o come web app sulla schermata Home. Sempre lo stesso account.',
    recommended: 'Il modo più semplice',
    webTitle: 'Nel browser',
    webBody: 'Apri pokyh.com e accedi con il tuo account WebUntis. Nessun download, funziona su ogni dispositivo.',
    webCta: 'Accedi',
    androidTitle: 'App Android',
    androidBody: 'L’app nativa per Android come file APK, direttamente dalle release su GitHub.',
    iosTitle: 'App iPhone',
    iosBody: 'L’app nativa per iOS come file IPA. Si installa con uno strumento di sideloading.',
    guide: 'Guida',
    releases: 'Release su GitHub',
    pwaTitle: 'Web app sulla schermata Home',
    pwaBody: 'Installa POKYH come un’app, senza App Store. Icona propria, nessuna finestra del browser, aggiornamenti automatici.',
    pwaIos: 'iPhone, con Safari',
    pwaAndroid: 'Android, con Chrome',
    pwaWhatTitle: 'Cos’è una web app?',
    pwaWhatBody: 'Un sito che si installa come un’app. Ha un’icona sulla schermata Home, si apre senza barra degli indirizzi e si carica velocemente. Le nuove versioni arrivano da sole.',
    back: 'Tutte le opzioni',
    stepAlt: 'Passo {num}: {title}',
    iosMetaTitle: 'Installare POKYH su iPhone: guida per iOS',
    iosMetaDescription: 'POKYH per iPhone e iPad: scarica e installa l’ultima app per iOS direttamente da GitHub. Orario, voti e messaggi da WebUntis, gratis.',
    iosOgTitle: 'Installare POKYH su iPhone',
    iosOgDescription: 'Scarica l’ultima app POKYH per iOS.',
    androidMetaTitle: 'Installare POKYH su Android: guida',
    androidMetaDescription: 'POKYH per Android: scarica e installa l’ultima app direttamente da GitHub. Orario, voti e messaggi da WebUntis, gratis e senza pubblicità.',
    androidOgTitle: 'Installare POKYH su Android',
    androidOgDescription: 'Scarica l’ultima app POKYH per Android.',
    appIosTitle: 'Installare POKYH su iPhone.',
    appIosLead: 'L’app nativa per iOS è disponibile come file IPA nelle release su GitHub.',
    appAndroidTitle: 'Installare POKYH su Android.',
    appAndroidLead: 'L’app nativa per Android è disponibile come file APK nelle release su GitHub.',
    appStep1Title: 'Aprire le release',
    appStep1Body: 'Apri la pagina delle release su GitHub nel browser: {link}',
    iosStep2Title: 'Scaricare l’IPA',
    iosStep2Body: 'Prendi la release più recente e scarica il file **.ipa**.',
    iosStep3Title: 'Installare',
    iosStep3Body: 'Installa il file con uno strumento di sideloading come AltStore, Sideloadly o TrollStore. Poi POKYH si avvia come ogni altra app.',
    androidStep2Title: 'Scaricare l’APK',
    androidStep2Body: 'Prendi la release più recente e scarica il file **.apk**.',
    androidStep3Title: 'Installare',
    androidStep3Body: 'Apri il file e segui l’installazione. Potrebbe essere necessario consentire app da origini sconosciute.',
    pwaIosMetaTitle: 'Installare POKYH come web app su iPhone: guida',
    pwaIosMetaDescription: 'Installa POKYH come Progressive Web App su iPhone o iPad, tramite Safari e senza App Store. Gratis, con aggiornamenti automatici.',
    pwaIosOgTitle: 'POKYH come web app su iPhone',
    pwaIosOgDescription: 'Installa POKYH su iPhone senza App Store, tramite Safari.',
    pwaIosSchemaName: 'Installare POKYH come web app su iPhone',
    pwaIosSchemaDescription: 'Installa POKYH come Progressive Web App su iPhone o iPad tramite Safari, senza App Store.',
    pwaIosTitle: 'POKYH sulla schermata Home del tuo iPhone.',
    pwaIosLead: 'Con Safari in un minuto. L’app finisce come icona sulla schermata Home e si aggiorna da sola.',
    pwaAndroidMetaTitle: 'Installare POKYH come web app su Android: guida',
    pwaAndroidMetaDescription: 'Installa POKYH come Progressive Web App su Android, tramite Chrome e senza App Store. Gratis, con aggiornamenti automatici.',
    pwaAndroidOgTitle: 'POKYH come web app su Android',
    pwaAndroidOgDescription: 'Installa POKYH su Android senza App Store, tramite Chrome.',
    pwaAndroidSchemaName: 'Installare POKYH come web app su Android',
    pwaAndroidSchemaDescription: 'Installa POKYH come Progressive Web App su Android tramite Chrome, senza App Store.',
    pwaAndroidTitle: 'POKYH sulla schermata Home del tuo Android.',
    pwaAndroidLead: 'Con Chrome in un minuto. L’app finisce come icona sulla schermata Home e si aggiorna da sola.',
    pi1Title: 'Aprire Safari',
    pi1Text: 'Apri Safari e vai su pokyh.com.',
    pi1Body: 'Apri **Safari** sul tuo iPhone o iPad e vai su **pokyh.com**. Su iOS l’installazione funziona solo in Safari.',
    pi2Title: 'Toccare Condividi',
    pi2Text: 'Tocca l’icona Condividi nella barra di Safari.',
    pi2Body: 'Tocca l’**icona Condividi** {icon}, il riquadro con la freccia verso l’alto. Su iPhone è in basso al centro.',
    pi3Title: '«Aggiungi alla schermata Home»',
    pi3Text: 'Scegli «Aggiungi alla schermata Home».',
    pi3Body: 'Scorri il menù verso il basso e tocca **«Aggiungi alla schermata Home»**.',
    pi4Title: 'Aggiungi',
    pi4Text: 'Tocca «Aggiungi» in alto a destra.',
    pi4Body: 'Puoi modificare il nome. Poi tocca **«Aggiungi»** in alto a destra.',
    pi5Title: 'Fatto',
    pi5Text: 'POKYH è ora un’icona sulla tua schermata Home.',
    pi5Body: 'POKYH è un’icona sulla schermata Home e si apre a schermo intero, senza barra degli indirizzi. Gli aggiornamenti arrivano da soli.',
    pa1Title: 'Aprire Chrome',
    pa1Text: 'Apri Chrome e vai su pokyh.com.',
    pa1Body: 'Apri **Google Chrome** sul tuo dispositivo Android e vai su **pokyh.com**.',
    pa2Title: 'Aprire il menù',
    pa2Text: 'Tocca i tre puntini e scegli «Installa app».',
    pa2Body: 'Tocca i **tre puntini (⋮)** in alto a destra e scegli **«Aggiungi a schermata Home»** o **«Installa app»**.',
    pa3Title: 'Confermare',
    pa3Text: 'Tocca «Installa».',
    pa3Body: 'Nella finestra tocca **«Installa»** o **«Aggiungi»**.',
    pa4Title: 'Fatto',
    pa4Text: 'POKYH è ora sulla tua schermata Home.',
    pa4Body: 'POKYH è un’icona sulla schermata Home e si apre senza barra degli indirizzi. Gli aggiornamenti arrivano da soli.',
  },
  en: {
    metaTitle: 'Get the app: browser, web app, iPhone and Android',
    metaDescription: 'Use POKYH: sign in in the browser, install the app on iPhone and Android, or add the web app to your home screen.',
    ogDescription: 'Use POKYH in the browser or install the app on iPhone and Android.',
    twitterDescription: 'POKYH in the browser or as an app on iPhone and Android.',
    title: 'Get POKYH.',
    lead: 'In the browser, as an app for Android and iPhone, or as a web app on your home screen. Same account everywhere.',
    recommended: 'Easiest',
    webTitle: 'In the browser',
    webBody: 'Open pokyh.com and sign in with your WebUntis account. No download, works on any device.',
    webCta: 'Sign in',
    androidTitle: 'Android app',
    androidBody: 'The native Android app as an APK file, straight from the releases on GitHub.',
    iosTitle: 'iPhone app',
    iosBody: 'The native iOS app as an IPA file, installed with a sideloading tool.',
    guide: 'Guide',
    releases: 'Releases on GitHub',
    pwaTitle: 'Web app on your home screen',
    pwaBody: 'Install POKYH like an app, without an app store. Its own icon, no browser window, automatic updates.',
    pwaIos: 'iPhone, with Safari',
    pwaAndroid: 'Android, with Chrome',
    pwaWhatTitle: 'What’s a web app?',
    pwaWhatBody: 'A website you can install like an app. It gets a home screen icon, opens without an address bar and loads quickly. New versions arrive on their own.',
    back: 'All options',
    stepAlt: 'Step {num}: {title}',
    iosMetaTitle: 'Install POKYH on iPhone - iOS guide',
    iosMetaDescription: 'POKYH for iPhone and iPad: download and install the latest iOS app straight from GitHub. Timetable, grades and messages from WebUntis, free.',
    iosOgTitle: 'Install POKYH on iPhone',
    iosOgDescription: 'Download the latest POKYH app for iOS.',
    androidMetaTitle: 'Install POKYH on Android: guide',
    androidMetaDescription: 'POKYH for Android: download and install the latest app straight from GitHub. Timetable, grades and messages from WebUntis, free and without ads.',
    androidOgTitle: 'Install POKYH on Android',
    androidOgDescription: 'Download the latest POKYH app for Android.',
    appIosTitle: 'Install POKYH on iPhone.',
    appIosLead: 'The native iOS app is available as an IPA file in the releases on GitHub.',
    appAndroidTitle: 'Install POKYH on Android.',
    appAndroidLead: 'The native Android app is available as an APK file in the releases on GitHub.',
    appStep1Title: 'Open the releases',
    appStep1Body: 'Open the releases page on GitHub in your browser: {link}',
    iosStep2Title: 'Download the IPA',
    iosStep2Body: 'Take the latest release and download the **.ipa** file.',
    iosStep3Title: 'Install',
    iosStep3Body: 'Install the file with a sideloading tool such as AltStore, Sideloadly or TrollStore. Then POKYH starts like any other app.',
    androidStep2Title: 'Download the APK',
    androidStep2Body: 'Take the latest release and download the **.apk** file.',
    androidStep3Title: 'Install',
    androidStep3Body: 'Open the file and follow the installation. You may need to allow apps from unknown sources.',
    pwaIosMetaTitle: 'Install POKYH as a web app on iPhone: guide',
    pwaIosMetaDescription: 'Install POKYH as a Progressive Web App on iPhone or iPad, via Safari and without an app store. Free, with automatic updates.',
    pwaIosOgTitle: 'POKYH as a web app on iPhone',
    pwaIosOgDescription: 'Install POKYH on iPhone without an app store, via Safari.',
    pwaIosSchemaName: 'Install POKYH as a web app on iPhone',
    pwaIosSchemaDescription: 'Install POKYH as a Progressive Web App on iPhone or iPad via Safari, without an app store.',
    pwaIosTitle: 'POKYH on your iPhone’s home screen.',
    pwaIosLead: 'One minute with Safari. The app lands on your home screen as an icon and updates itself.',
    pwaAndroidMetaTitle: 'Install POKYH as a web app on Android: guide',
    pwaAndroidMetaDescription: 'Install POKYH as a Progressive Web App on Android, via Chrome and without an app store. Free, with automatic updates.',
    pwaAndroidOgTitle: 'POKYH as a web app on Android',
    pwaAndroidOgDescription: 'Install POKYH on Android without an app store, via Chrome.',
    pwaAndroidSchemaName: 'Install POKYH as a web app on Android',
    pwaAndroidSchemaDescription: 'Install POKYH as a Progressive Web App on Android via Chrome, without an app store.',
    pwaAndroidTitle: 'POKYH on your Android home screen.',
    pwaAndroidLead: 'One minute with Chrome. The app lands on your home screen as an icon and updates itself.',
    pi1Title: 'Open Safari',
    pi1Text: 'Open Safari and go to pokyh.com.',
    pi1Body: 'Open **Safari** on your iPhone or iPad and go to **pokyh.com**. On iOS, installing only works in Safari.',
    pi2Title: 'Tap Share',
    pi2Text: 'Tap the Share icon in the Safari bar.',
    pi2Body: 'Tap the **Share icon** {icon}, the square with the arrow pointing up. On iPhone it’s at the bottom centre.',
    pi3Title: '“Add to Home Screen”',
    pi3Text: 'Choose “Add to Home Screen”.',
    pi3Body: 'Scroll down in the menu and tap **“Add to Home Screen”**.',
    pi4Title: 'Add',
    pi4Text: 'Tap “Add” in the top right.',
    pi4Body: 'You can change the name. Then tap **“Add”** in the top right.',
    pi5Title: 'Done',
    pi5Text: 'POKYH is now an icon on your home screen.',
    pi5Body: 'POKYH is an icon on your home screen and opens full screen, without an address bar. Updates arrive automatically.',
    pa1Title: 'Open Chrome',
    pa1Text: 'Open Chrome and go to pokyh.com.',
    pa1Body: 'Open **Google Chrome** on your Android device and go to **pokyh.com**.',
    pa2Title: 'Open the menu',
    pa2Text: 'Tap the three dots and choose “Install app”.',
    pa2Body: 'Tap the **three dots (⋮)** in the top right and choose **“Add to Home screen”** or **“Install app”**.',
    pa3Title: 'Confirm',
    pa3Text: 'Tap “Install”.',
    pa3Body: 'In the dialog, tap **“Install”** or **“Add”**.',
    pa4Title: 'Done',
    pa4Text: 'POKYH is now on your home screen.',
    pa4Body: 'POKYH is an icon on your home screen and opens without an address bar. Updates arrive automatically.',
  },
};
