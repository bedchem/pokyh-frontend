import type { Dictionary } from '../dictionary';

// The notice for devices with "reduce motion" switched on
// (components/MotionNotice.tsx). The ways to the setting name the menus as the
// systems show them; Android differs between makers, so it names the option
// and its usual alternative.
export type MotionKey =
  | 'title'
  | 'body'
  | 'howTo'
  | 'windows'
  | 'mac'
  | 'ios'
  | 'android'
  | 'other'
  | 'reload'
  | 'ok'
  | 'close'
  | 'label';

export const motionDict: Dictionary<MotionKey> = {
  de: {
    title: 'Du siehst POKYH ohne Animationen',
    body: 'Auf deinem Gerät ist „Bewegung reduzieren“ eingeschaltet. Alles funktioniert und ist vollständig da, nur die Bewegungen der Seite fehlen.',
    howTo: 'Falls das nicht gewollt ist:',
    windows: 'Einstellungen → Barrierefreiheit → Visuelle Effekte → „Animationseffekte“ einschalten. Unter Windows 10: Erleichterte Bedienung → Anzeige → „Animationen in Windows anzeigen“.',
    mac: 'Systemeinstellungen → Bedienungshilfen → Anzeige → „Bewegung reduzieren“ ausschalten.',
    ios: 'Einstellungen → Bedienungshilfen → Bewegung → „Bewegung reduzieren“ ausschalten.',
    android: 'Einstellungen → Bedienungshilfen → „Animationen entfernen“ ausschalten (je nach Gerät auch „Animationen reduzieren“).',
    other: 'In den Einstellungen deines Geräts unter Bedienungshilfen oder Anzeige „Bewegung reduzieren“ ausschalten.',
    reload: 'Sobald du es änderst, lädt die Seite von selbst neu.',
    ok: 'Verstanden',
    close: 'Hinweis schließen',
    label: 'Hinweis zu Animationen',
  },
  it: {
    title: 'Stai vedendo POKYH senza animazioni',
    body: 'Sul tuo dispositivo è attiva l’opzione “Riduci movimento”. Tutto funziona ed è completo, mancano solo i movimenti della pagina.',
    howTo: 'Se non è voluto:',
    windows: 'Impostazioni → Accessibilità → Effetti visivi → attiva “Effetti animazione”. Su Windows 10: Accessibilità → Schermo → “Mostra animazioni in Windows”.',
    mac: 'Impostazioni di Sistema → Accessibilità → Schermo → disattiva “Riduci movimento”.',
    ios: 'Impostazioni → Accessibilità → Movimento → disattiva “Riduci movimento”.',
    android: 'Impostazioni → Accessibilità → disattiva “Rimuovi animazioni” (su alcuni dispositivi “Riduci animazioni”).',
    other: 'Nelle impostazioni del dispositivo, sotto Accessibilità o Schermo, disattiva “Riduci movimento”.',
    reload: 'Appena lo cambi, la pagina si ricarica da sola.',
    ok: 'Ho capito',
    close: 'Chiudi l’avviso',
    label: 'Avviso sulle animazioni',
  },
  en: {
    title: 'You’re seeing POKYH without animations',
    body: 'Reduce motion is switched on on your device. Everything works and is all there, only the movement of the page is missing.',
    howTo: 'If that isn’t on purpose:',
    windows: 'Settings → Accessibility → Visual effects → turn on “Animation effects”. On Windows 10: Ease of Access → Display → “Show animations in Windows”.',
    mac: 'System Settings → Accessibility → Display → turn off “Reduce motion”.',
    ios: 'Settings → Accessibility → Motion → turn off “Reduce Motion”.',
    android: 'Settings → Accessibility → turn off “Remove animations” (on some phones “Reduce animations”).',
    other: 'In your device’s settings, under Accessibility or Display, turn off “Reduce motion”.',
    reload: 'As soon as you change it, the page reloads by itself.',
    ok: 'Got it',
    close: 'Close the notice',
    label: 'Notice about animations',
  },
};
