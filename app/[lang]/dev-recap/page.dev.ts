'use client';

import { createElement } from 'react';
import RecapPreview from '@/components/recap/RecapPreview';

// Development only: `next dev` registers the .dev.ts extension
// (next.config.ts), the static build never sees this page. /de/dev-recap/
// plays the recap story with made-up figures (components/recap/RecapPreview.tsx).

export default function RecapPreviewPage() {
  return createElement(RecapPreview);
}
