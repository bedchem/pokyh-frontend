// Lengths of the homepage scroll scenes, shared by the sections that hand over
// to each other. In large-viewport units (--lvh, see globals.css), so a phone
// whose browser bars collapse while scrolling keeps the same layout, and
// stretched on desktops by --stretch-<scene> (Home.tsx). The numbers live in
// lib/scroll-pace.ts with the rest of the scroll feel.

import { SCROLL } from '@/lib/scroll-pace';

/** Height of the hero; it is pinned for all but the last screen of it. */
export const HERO_LVH = SCROLL.length.hero;

/** Scroll progress of the hero at which its dark screen fills the view. */
export const ARRIVE = 0.92;

/**
 * The manifest starts this far above the end of the hero, so that its pinned
 * sentence reaches the top exactly at ARRIVE, where the hero hands over:
 * H − ARRIVE·(H − 100) with H the (stretched) hero length, as a CSS length.
 */
export const MANIFEST_PULL = `calc((${1 - ARRIVE} * ${HERO_LVH} * var(--stretch-hero, 1) + ${ARRIVE * 100}) * var(--lvh))`;

/** `n` large-viewport units as a CSS length. */
export const lvh = (n: number) => `calc(${n} * var(--lvh))`;
