import type { Dictionary } from '../dictionary';

// Text of the link previews (lib/og/card.tsx).
export type OgKey = 'homeTitle' | 'homeLine' | 'loginTitle' | 'loginLine' | 'legalTitle' | 'legalLine' | 'chips';

export const ogDict: Dictionary<OgKey> = {
  de: {
    homeTitle: 'Deine Schule mit WebUntis. Übersichtlich.',
    homeLine: 'Stundenplan, Noten, Abwesenheiten und Nachrichten in einer App. Kostenlos, für jede Schule mit WebUntis.',
    loginTitle: 'Schule wählen. Anmelden. Fertig.',
    loginLine: 'Mit deinem WebUntis-Konto, für jede Schule mit WebUntis.',
    legalTitle: 'Impressum, Datenschutz und Nutzungsbedingungen',
    legalLine: 'Wer hinter POKYH steht und wie POKYH mit deinen Daten umgeht.',
    chips: 'Stundenplan|Noten|Abwesenheiten|Nachrichten',
  },
  it: {
    homeTitle: 'La tua scuola con WebUntis. Chiara.',
    homeLine: 'Orario, voti, assenze e messaggi in un’unica app. Gratuita, per ogni scuola con WebUntis.',
    loginTitle: 'Scegli la scuola. Accedi. Fatto.',
    loginLine: 'Con il tuo account WebUntis, per ogni scuola con WebUntis.',
    legalTitle: 'Note legali, privacy e condizioni d’uso',
    legalLine: 'Chi c’è dietro POKYH e come POKYH tratta i tuoi dati.',
    chips: 'Orario|Voti|Assenze|Messaggi',
  },
  en: {
    homeTitle: 'Your school on WebUntis. At a glance.',
    homeLine: 'Timetable, grades, absences and messages in one app. Free, for every school on WebUntis.',
    loginTitle: 'Pick your school. Sign in. Done.',
    loginLine: 'With your WebUntis account, for every school on WebUntis.',
    legalTitle: 'Imprint, privacy and terms of use',
    legalLine: 'Who is behind POKYH and how POKYH handles your data.',
    chips: 'Timetable|Grades|Absences|Messages',
  },
};
