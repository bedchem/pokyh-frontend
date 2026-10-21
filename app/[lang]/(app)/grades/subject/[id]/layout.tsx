import type { ReactNode } from 'react';
import { placeholderParams } from '@/lib/route-placeholder';

// Built once, for the placeholder id: the page renders in the browser and
// reads the real id from the address (lib/route-id.ts); the web server
// answers every id with this one page.
export const generateStaticParams = placeholderParams;

export default function DetailLayout({ children }: { children: ReactNode }) {
  return children;
}
