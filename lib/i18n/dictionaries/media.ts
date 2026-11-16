import type { Dictionary } from '../dictionary';

// The note under photos from other sites (lib/external-media.ts), shown only
// when a dish's photo is still a link to another site: where they come from, and the switch to hide them (or show them again). The link says
// where it goes (the privacy notice), never just "more".
export type MediaKey = 'title' | 'text' | 'allow' | 'revoke' | 'on' | 'more';

export const mediaDict: Dictionary<MediaKey> = {
  de: {
    title: 'Fotos ausgeblendet',
    text: 'Einige Fotos der Gerichte liegen auf externen Rezeptseiten. Beim Anzeigen erhalten diese Seiten deine IP-Adresse.',
    allow: 'Fotos anzeigen',
    revoke: 'Fotos ausblenden',
    on: 'Einige Fotos stammen von externen Rezeptseiten; diese erhalten beim Laden deine IP-Adresse.',
    more: 'Datenschutzerklärung',
  },
  it: {
    title: 'Foto nascoste',
    text: 'Alcune foto dei piatti si trovano su siti esterni di ricette. Mostrandole, questi siti ricevono il tuo indirizzo IP.',
    allow: 'Mostra le foto',
    revoke: 'Nascondi le foto',
    on: 'Alcune foto provengono da siti esterni di ricette, che al caricamento ricevono il tuo indirizzo IP.',
    more: 'Informativa sulla privacy',
  },
  en: {
    title: 'Photos hidden',
    text: 'Some dish photos are hosted on external recipe sites. Showing them sends your IP address to those sites.',
    allow: 'Show photos',
    revoke: 'Hide photos',
    on: 'Some photos come from external recipe sites, which receive your IP address when they load.',
    more: 'Privacy policy',
  },
};
