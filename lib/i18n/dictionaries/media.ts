import type { Dictionary } from '../dictionary';

// The note under photos from other sites (lib/external-media.ts): where they
// come from, and the switch to hide them (or show them again).
export type MediaKey = 'title' | 'text' | 'allow' | 'revoke' | 'on' | 'more';

export const mediaDict: Dictionary<MediaKey> = {
  de: {
    title: 'Fotos ausgeblendet',
    text: 'Die Fotos der Gerichte liegen auf externen Rezeptseiten. Beim Anzeigen erhalten diese Seiten deine IP-Adresse.',
    allow: 'Fotos anzeigen',
    revoke: 'Fotos ausblenden',
    on: 'Fotos von externen Rezeptseiten; diese erhalten beim Laden deine IP-Adresse.',
    more: 'Mehr dazu',
  },
  it: {
    title: 'Foto nascoste',
    text: 'Le foto dei piatti si trovano su siti esterni di ricette. Mostrandole, questi siti ricevono il tuo indirizzo IP.',
    allow: 'Mostra le foto',
    revoke: 'Nascondi le foto',
    on: 'Foto da siti esterni di ricette, che al caricamento ricevono il tuo indirizzo IP.',
    more: 'Maggiori informazioni',
  },
  en: {
    title: 'Photos hidden',
    text: 'The dish photos are hosted on external recipe sites. Showing them sends your IP address to those sites.',
    allow: 'Show photos',
    revoke: 'Hide photos',
    on: 'Photos from external recipe sites, which receive your IP address when they load.',
    more: 'Learn more',
  },
};
