// Dish photos at the size they are drawn. The API serves POKYH's own photos
// (GET /dishes/:id/image, 1254 px square) also as smaller copies (?w=96, 192,
// 384 or 768): a plate in the plan is about 36 to 90 px wide, and loading the
// whole picture for each of them made the menu slow to fill. Photos from
// anywhere else are left as they are.

const OWN_PHOTO = /\/dishes\/[^/?#]+\/image$/;
const WIDTHS = [96, 192, 384, 768] as const;

/** The photo at least [px] wide (device pixels), as small as the API has it; the original past 768. */
export function dishImageSrc(url: string | null | undefined, px: number): string | null {
  if (!url) return null;
  if (!OWN_PHOTO.test(url)) return url;
  const w = WIDTHS.find((x) => x >= px);
  return w ? `${url}?w=${w}` : url;
}

/** srcSet over the API's sizes and the original, for a photo whose drawn width varies with the screen. */
export function dishImageSrcSet(url: string | null | undefined): string | undefined {
  if (!url || !OWN_PHOTO.test(url)) return undefined;
  return [...WIDTHS.map((w) => `${url}?w=${w} ${w}w`), `${url} 1254w`].join(', ');
}

/** The plate sizes (lib/../components/mensa/PixelPlate.tsx): the plan's rows and the next dish. */
export const PLATE_PX = 192;
export const TABLE_PX = 768;

const preloaded = new Set<string>();

/**
 * Starts loading photos before they are shown (the browser keeps them), so the
 * plan's plates and the next dish appear at once instead of one by one.
 */
export function preloadDishImages(urls: Array<string | null | undefined>, px: number): void {
  if (typeof window === 'undefined') return;
  for (const url of urls) {
    const src = dishImageSrc(url, px);
    if (!src || preloaded.has(src)) continue;
    preloaded.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}
