import type { Dictionary } from '../dictionary';

// The 404 page: the missing page shows up as a cancelled lesson in today's timetable.
export type NotFoundKey =
  | 'metaTitle' | 'title' | 'hint' | 'home' | 'login' | 'help'
  | 'more' | 'today' | 'cancelled' | 'lessons' | 'period';

export const notFoundDict: Dictionary<NotFoundKey> = {
  de: {
    metaTitle: 'Seite nicht gefunden',
    title: 'Diese Stunde fällt aus.',
    hint: 'Die Seite gibt es nicht, vielleicht ein Tippfehler oder ein veralteter Link. Von hier aus geht es weiter:',
    home: 'Zur Startseite',
    login: 'Anmelden',
    help: 'Häufige Fragen',
    more: 'Oft gesucht',
    today: 'Heute',
    cancelled: 'Entfall',
    lessons: 'Mathematik|Deutsch|Englisch|Geschichte',
    period: '{n}. Stunde',
  },
  it: {
    metaTitle: 'Pagina non trovata',
    title: 'Quest’ora è annullata.',
    hint: 'La pagina non esiste, forse un errore di battitura o un link non più valido. Da qui puoi continuare:',
    home: 'Alla pagina iniziale',
    login: 'Accedi',
    help: 'Domande frequenti',
    more: 'Cercati spesso',
    today: 'Oggi',
    cancelled: 'Annullata',
    lessons: 'Matematica|Italiano|Inglese|Storia',
    period: '{n}ª ora',
  },
  en: {
    metaTitle: 'Page not found',
    title: 'This lesson is cancelled.',
    hint: 'The page does not exist, maybe a typo or an old link. You can carry on from here:',
    home: 'To the home page',
    login: 'Sign in',
    help: 'Frequently asked questions',
    more: 'Often looked for',
    today: 'Today',
    cancelled: 'Cancelled',
    lessons: 'Maths|English|Science|History',
    period: 'Period {n}',
  },
};
