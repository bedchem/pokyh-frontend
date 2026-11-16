// Google Analytics runs only when the build names a measurement id
// (NEXT_PUBLIC_GA_ID). The cookie banner, the loader and the legal texts all
// follow this one switch, so the texts never mention a service the build
// does not use.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || undefined;

export const analyticsEnabled = /^G-[A-Z0-9]+$/i.test(GA_ID ?? '');
