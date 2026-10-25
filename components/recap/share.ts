'use client';

import { DEFAULT_SITE_URL, SITE_URL, isLocalAddress } from '@/lib/site-url';
import { CARD_H, CARD_W } from './ShareCard';

// The recap's card (./ShareCard.tsx) as a picture and its ways out: a PNG
// of 1080 × 1920 (a story's size, six picture pixels per card pixel, so the
// pixel art stays crisp), saved as a file or shared through the system's
// share sheet together with a line of text and POKYH's address — on a phone
// that is WhatsApp, Instagram and the rest with the picture attached. Where
// a browser can't share files, the text and the address go on their own, or
// to WhatsApp's web share; the picture can be saved next to it.

const SCALE = 6;

/** The address the shared text points to: the public website, never a local one. */
export function siteLink(): string {
  return isLocalAddress(SITE_URL) ? DEFAULT_SITE_URL : SITE_URL;
}

/** The card's drawing as a PNG, every colour written out (the sprites use CSS variables). */
export async function cardPng(svg: SVGSVGElement): Promise<Blob | null> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const originals = svg.querySelectorAll('*');
  const copies = copy.querySelectorAll('*');
  originals.forEach((el, i) => {
    const target = copies[i];
    if (!target || !(el instanceof SVGElement)) return;
    const fill = el.getAttribute('fill');
    if (fill?.startsWith('var(')) target.setAttribute('fill', getComputedStyle(el).fill);
    target.removeAttribute('class');
  });
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', String(CARD_W * SCALE));
  copy.setAttribute('height', String(CARD_H * SCALE));
  copy.removeAttribute('class');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('card')); img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W * SCALE;
    canvas.height = CARD_H * SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadPng(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported';

/**
 * Shares the picture with the text and the address (`text` already ends
 * with the address); without file sharing, the text and the address alone.
 * 'unsupported' when the browser has no share sheet at all.
 */
export async function shareCard(blob: Blob | null, fileName: string, title: string, text: string): Promise<ShareOutcome> {
  if (typeof navigator.share !== 'function') return 'unsupported';
  const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null;
  try {
    if (file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
    } else {
      await navigator.share({ title, text });
    }
    return 'shared';
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unsupported';
  }
}

/** WhatsApp's own share link, with the text (and the address in it). */
export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
