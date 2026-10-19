import type { Dictionary } from '../dictionary';

export type MensaKey =
  | 'title'
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
  | 'metaTitleOne'
  | 'metaDescriptionOne'
  | 'metaTitleMany'
  | 'metaDescriptionMany'
  | 'metaMore'
  | 'metaKeywords'
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
  | 'carbsLong'
  | 'backToPlan'
  | 'dishGone'
  | 'loading'
  | 'noMensaTitle'
  | 'noMensaText'
  | 'toHome'
  // The choice of canteen on the public page
  | 'chooseLead'
  | 'searchLabel'
  | 'searchPlaceholder'
  | 'searchClear'
  | 'noMatch'
  | 'canteenCount'
  | 'canteenOne'
  | 'changeCanteen'
  | 'yourSchool'
  | 'otherSchoolComments'
  | 'otherSchoolRating';

export const mensaDict: Dictionary<MensaKey> = {
  de: {
    title: 'Mensa',
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
    // Search engines: the canteens' names come from pokyh-backend (app/[lang]/(site)/mensa/page.tsx).
    metaTitle: 'Mensa: Speiseplan mit Bewertungen',
    metaDescription: 'Was es in der Schulmensa gibt: der Speiseplan der nächsten Tage mit Fotos, Allergenen, Nährwerten und Bewertungen von Schülern.',
    metaTitleOne: '{canteen}: Speiseplan mit Bewertungen',
    metaDescriptionOne: '{canteen} ({schools}): der Speiseplan der nächsten Tage mit Fotos, Allergenen, Nährwerten und Bewertungen von Schülern.',
    metaTitleMany: 'Mensa-Speisepläne mit Bewertungen',
    metaDescriptionMany: 'Die Speisepläne der Schulmensen auf POKYH ({names}): die Gerichte der nächsten Tage mit Fotos, Allergenen, Nährwerten und Bewertungen von Schülern.',
    metaMore: '{n} weitere',
    metaKeywords: 'Mensa Speiseplan|Schulmensa Speiseplan|Mensa Bewertungen|POKYH Mensa',
    pageTitle: 'Was gibt’s in der Mensa?',
    pageLead: 'Der Speiseplan deiner Mensa, mit Bewertungen deiner Mitschüler. Zum Bewerten und Kommentieren meldest du dich an.',
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
    backToPlan: 'Zum Speiseplan',
    dishGone: 'Dieses Gericht steht nicht mehr auf dem Plan.',
    loading: 'Der Speiseplan wird geladen …',
    noMensaTitle: 'Deine Schule hat in POKYH keine Mensa.',
    noMensaText: 'Sobald es für deine Schule einen Speiseplan gibt, steht er hier.',
    toHome: 'Zu Home',
    chooseLead: 'POKYH kennt die Speisepläne mehrerer Mensen. Such deine Schule und schau, was es gibt.',
    searchLabel: 'Mensa oder Schule suchen',
    searchPlaceholder: 'Schule oder Mensa',
    searchClear: 'Suche leeren',
    noMatch: 'Keine Mensa passt zu „{q}“.',
    canteenCount: '{n} Mensen',
    canteenOne: '1 Mensa',
    changeCanteen: 'Andere Mensa',
    yourSchool: 'Deine Schule',
    otherSchoolComments: 'Die Kommentare dieser Mensa sehen nur Konten ihrer Schule.',
    otherSchoolRating: 'Bewerten können nur Konten dieser Schule.',
  },
  it: {
    title: 'Mensa',
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
    metaTitle: 'Mensa: menù con valutazioni',
    metaDescription: 'Cosa c’è nella mensa scolastica: il menù dei prossimi giorni con foto, allergeni, valori nutrizionali e valutazioni degli studenti.',
    metaTitleOne: '{canteen}: menù con valutazioni',
    metaDescriptionOne: '{canteen} ({schools}): il menù dei prossimi giorni con foto, allergeni, valori nutrizionali e valutazioni degli studenti.',
    metaTitleMany: 'Menù delle mense con valutazioni',
    metaDescriptionMany: 'I menù delle mense scolastiche su POKYH ({names}): i piatti dei prossimi giorni con foto, allergeni, valori nutrizionali e valutazioni degli studenti.',
    metaMore: 'altre {n}',
    pageTitle: 'Cosa c’è in mensa?',
    pageLead: 'Il menù della tua mensa, con le valutazioni dei tuoi compagni. Per valutare e commentare accedi.',
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
    backToPlan: 'Al menù',
    dishGone: 'Questo piatto non è più nel menù.',
    loading: 'Caricamento del menù …',
    noMensaTitle: 'La tua scuola non ha una mensa su POKYH.',
    noMensaText: 'Appena ci sarà un menù per la tua scuola, lo troverai qui.',
    toHome: 'Alla home',
    chooseLead: 'POKYH conosce i menù di più mense. Cerca la tua scuola e guarda cosa c’è.',
    searchLabel: 'Cerca mensa o scuola',
    searchPlaceholder: 'Scuola o mensa',
    searchClear: 'Cancella la ricerca',
    noMatch: 'Nessuna mensa corrisponde a «{q}».',
    canteenCount: '{n} mense',
    canteenOne: '1 mensa',
    changeCanteen: 'Altra mensa',
    yourSchool: 'La tua scuola',
    otherSchoolComments: 'I commenti di questa mensa li vedono solo gli account della sua scuola.',
    otherSchoolRating: 'Possono valutare solo gli account di questa scuola.',
  },
  en: {
    title: 'Cafeteria',
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
    metaTitle: 'Cafeteria: menu with ratings',
    metaDescription: 'What’s on at the school cafeteria: the menu for the coming days with photos, allergens, nutrition facts and ratings from students.',
    metaTitleOne: '{canteen}: menu with ratings',
    metaDescriptionOne: '{canteen} ({schools}): the menu for the coming days with photos, allergens, nutrition facts and ratings from students.',
    metaTitleMany: 'School cafeteria menus with ratings',
    metaDescriptionMany: 'The school cafeteria menus on POKYH ({names}): the dishes of the coming days with photos, allergens, nutrition facts and ratings from students.',
    metaMore: '{n} more',
    pageTitle: 'What’s in the cafeteria?',
    pageLead: 'The menu of your cafeteria, with ratings from your classmates. Sign in to rate and comment.',
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
    backToPlan: 'Back to the menu',
    dishGone: 'This dish is no longer on the menu.',
    loading: 'Loading the menu …',
    noMensaTitle: 'Your school has no cafeteria on POKYH.',
    noMensaText: 'As soon as there is a menu for your school, you will find it here.',
    toHome: 'To Home',
    chooseLead: 'POKYH knows the menus of several cafeterias. Search for your school and see what’s on.',
    searchLabel: 'Search cafeteria or school',
    searchPlaceholder: 'School or cafeteria',
    searchClear: 'Clear search',
    noMatch: 'No cafeteria matches “{q}”.',
    canteenCount: '{n} cafeterias',
    canteenOne: '1 cafeteria',
    changeCanteen: 'Other cafeteria',
    yourSchool: 'Your school',
    otherSchoolComments: 'Only accounts of its school can see this cafeteria’s comments.',
    otherSchoolRating: 'Only accounts of this school can rate.',
  },
  lld: {
    title: "Mensa",
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
