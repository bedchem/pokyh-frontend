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
  | 'emptySubtitle'
  // Public page (app/[lang]/(site)/mensa)
  | 'metaTitle'
  | 'metaDescription'
  | 'pageTitle'
  | 'pageLead'
  | 'next'
  | 'rateAndComment'
  | 'thisWeek'
  | 'nextWeek'
  | 'fromDate'
  | 'comments'
  | 'retry'
  | 'yourRating'
  | 'rateLabels'
  | 'allDays'
  | 'nutrition'
  | 'carbsLong';

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
    metaTitle: 'Mensa der LBS Brixen: Speiseplan mit Bewertungen',
    metaDescription: 'Was es in der Mensa der LBS Brixen gibt: der Speiseplan der nächsten Tage mit Fotos, Allergenen, Nährwerten und Bewertungen von Schülern.',
    pageTitle: 'Was gibt’s in der Mensa?',
    pageLead: 'Der Speiseplan der LBS Brixen, mit Bewertungen deiner Mitschüler. Zum Bewerten und Kommentieren meldest du dich an.',
    next: 'Als Nächstes',
    rateAndComment: 'Bewerten und kommentieren',
    thisWeek: 'Diese Woche',
    nextWeek: 'Nächste Woche',
    fromDate: 'Ab {date}',
    comments: 'Kommentare',
    retry: 'Nochmal versuchen',
    yourRating: 'Deine Bewertung',
    rateLabels: 'Naja|Geht so|Gut|Sehr gut|Mega',
    allDays: 'Der ganze Plan',
    nutrition: 'Nährwerte',
    carbsLong: 'Kohlenhydrate',
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
    metaTitle: 'Mensa della LBS Bressanone: menù con valutazioni',
    metaDescription: 'Cosa c’è nella mensa della LBS Bressanone: il menù dei prossimi giorni con foto, allergeni, valori nutrizionali e valutazioni degli studenti.',
    pageTitle: 'Cosa c’è in mensa?',
    pageLead: 'Il menù della LBS Bressanone, con le valutazioni dei tuoi compagni. Per valutare e commentare accedi.',
    next: 'Prossimo',
    rateAndComment: 'Valuta e commenta',
    thisWeek: 'Questa settimana',
    nextWeek: 'Settimana prossima',
    fromDate: 'Dal {date}',
    comments: 'Commenti',
    retry: 'Riprova',
    yourRating: 'La tua valutazione',
    rateLabels: 'Mah|Così così|Buono|Molto buono|Top',
    allDays: 'Tutto il menù',
    nutrition: 'Valori nutrizionali',
    carbsLong: 'Carboidrati',
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
    metaTitle: 'LBS Brixen cafeteria: menu with ratings',
    metaDescription: 'What’s on at the LBS Brixen cafeteria: the menu for the coming days with photos, allergens, nutrition facts and ratings from students.',
    pageTitle: 'What’s in the cafeteria?',
    pageLead: 'The menu of LBS Brixen, with ratings from your classmates. Sign in to rate and comment.',
    next: 'Up next',
    rateAndComment: 'Rate and comment',
    thisWeek: 'This week',
    nextWeek: 'Next week',
    fromDate: 'From {date}',
    comments: 'Comments',
    retry: 'Try again',
    yourRating: 'Your rating',
    rateLabels: 'Meh|So-so|Good|Very good|Awesome',
    allDays: 'The whole plan',
    nutrition: 'Nutrition',
    carbsLong: 'Carbohydrates',
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
