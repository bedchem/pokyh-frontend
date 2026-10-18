import type { ReactNode } from 'react';

// The page renders in the browser and needs nothing from the request, so each
// id is rendered once, on its first visit, and served static from then on.
export function generateStaticParams() {
  return [];
}

export default function DetailLayout({ children }: { children: ReactNode }) {
  return children;
}
