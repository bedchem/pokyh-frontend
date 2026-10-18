// Lengths of the homepage scroll scenes, shared by the sections that hand over
// to each other. In large-viewport units (--lvh, see globals.css), so a phone
// whose browser bars collapse while scrolling keeps the same layout. The
// numbers live in lib/scroll-pace.ts with the rest of the scroll feel.

import { SCROLL } from '@/lib/scroll-pace';

/** Height of the hero; it is pinned for all but the last screen of it. */
export const HERO_LVH = SCROLL.length.hero;

/** Scroll progress of the hero at which its dark screen fills the view. */
export const ARRIVE = 0.92;

/**
 * The manifest starts this far above the end of the hero, so that its pinned
 * sentence reaches the top exactly at ARRIVE, where the hero hands over.
 */
export const MANIFEST_PULL_LVH = HERO_LVH - ARRIVE * (HERO_LVH - 100);

/** `n` large-viewport units as a CSS length. */
export const lvh = (n: number) => `calc(${n} * var(--lvh))`;
