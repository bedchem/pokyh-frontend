import type { ReactNode } from 'react';

// Rendered in the browser from the menu; each id is rendered on its first
// visit and served static from then on.
export function generateStaticParams() {
  return [];
}

export default function DishLayout({ children }: { children: ReactNode }) {
  return children;
}
