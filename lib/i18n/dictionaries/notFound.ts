import type { Dictionary } from '../dictionary';

// The 404 page: a big 404 in pixel art, one sentence and the way back.
export type NotFoundKey = 'metaTitle' | 'title' | 'hint' | 'back' | 'home' | 'help';

export const notFoundDict: Dictionary<NotFoundKey> = {
  de: {
    metaTitle: 'Seite nicht gefunden',
    title: 'Diese Seite gibt es nicht.',
    hint: 'Vielleicht ein Tippfehler oder ein veralteter Link.',
    back: 'Zurück',
    home: 'Zur Startseite',
    help: 'Häufige Fragen',
  },
  it: {
    metaTitle: 'Pagina non trovata',
    title: 'Questa pagina non esiste.',
    hint: 'Forse un errore di battitura o un link non più valido.',
    back: 'Indietro',
    home: 'Alla pagina iniziale',
    help: 'Domande frequenti',
  },
  en: {
    metaTitle: 'Page not found',
    title: 'This page doesn’t exist.',
    hint: 'Maybe a typo or an old link.',
    back: 'Back',
    home: 'To the home page',
    help: 'Frequently asked questions',
  },
};
