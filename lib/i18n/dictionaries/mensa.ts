import type { Dictionary } from '../dictionary';

export type MensaKey =
  | 'title'
  | 'school'
  | 'today'
  | 'tomorrow'
  | 'noRatingYet'
  | 'loginRequired'
  | 'loginRequiredText'
  | 'rating'
  | 'ratingOne'
  | 'ratingMany'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'allergens'
  | 'loadError'
  | 'emptyTitle'
  | 'emptySubtitle';

export const mensaDict: Dictionary<MensaKey> = {
  de: {
    title: 'Mensa',
    school: 'LBS Brixen',
    today: 'Heute',
    tomorrow: 'Morgen',
    noRatingYet: 'Noch keine Bewertung',
    loginRequired: 'Anmeldung erforderlich',
    loginRequiredText: 'Zum Bewerten und Kommentieren musst du angemeldet sein',
    rating: 'Bewertung',
    ratingOne: '1 Bewertung',
    ratingMany: '{n} Bewertungen',
    protein: 'Protein',
    carbs: 'Kohlenh.',
    fat: 'Fett',
    allergens: 'Allergene',
    loadError: 'Fehler beim Laden der Speisekarte',
    emptyTitle: 'Kein Speiseplan',
    emptySubtitle: 'Es gibt aktuell nichts bei der Mensa.',
  },
  it: {
    title: 'Mensa',
    school: 'LBS Bressanone',
    today: 'Oggi',
    tomorrow: 'Domani',
    noRatingYet: 'Ancora nessuna valutazione',
    loginRequired: 'Accesso richiesto',
    loginRequiredText: 'Per valutare e commentare devi aver effettuato l’accesso',
    rating: 'Valutazione',
    ratingOne: '1 valutazione',
    ratingMany: '{n} valutazioni',
    protein: 'Proteine',
    carbs: 'Carboidr.',
    fat: 'Grassi',
    allergens: 'Allergeni',
    loadError: 'Errore durante il caricamento del menù',
    emptyTitle: 'Nessun menù',
    emptySubtitle: 'Al momento non c’è nulla in mensa.',
  },
  en: {
    title: 'Cafeteria',
    school: 'LBS Brixen',
    today: 'Today',
    tomorrow: 'Tomorrow',
    noRatingYet: 'No ratings yet',
    loginRequired: 'Login required',
    loginRequiredText: 'You need to be logged in to rate and comment',
    rating: 'Rating',
    ratingOne: '1 rating',
    ratingMany: '{n} ratings',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    allergens: 'Allergens',
    loadError: 'Failed to load the menu',
    emptyTitle: 'No menu',
    emptySubtitle: 'There’s nothing at the cafeteria right now.',
  },
  lld: {
    title: "Mensa",
    school: "LBS Porsenù",
    today: "Ncuei",
    tomorrow: "Doman",
    noRatingYet: "Mo deguna valutazion",
    loginRequired: "Ie de bujën de jì ite",
    loginRequiredText: "Per valuté y cumenté messes vester ite",
    rating: "Valutazion",
    ratingOne: "1 valutazion",
    ratingMany: "{n} valutazions",
    protein: "Proteines",
    carbs: "Idrac de carbon",
    fat: "Gras",
    allergens: "Alergeni",
    loadError: "Fal tl ciarië l menu",
    emptyTitle: "Deguna menu",
    emptySubtitle: "Al mumënt ne n’iel nia tla mensa.",
  },
};
