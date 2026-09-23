'use client';

import { useSyncExternalStore } from 'react';

const THEME_INIT = `(function(){var t=localStorage.getItem('pockyh_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')})()`;

const noopSubscribe = () => () => {};

/**
 * Sets the `dark` class before first paint.
 *
 * The script is rendered on the server and while hydrating (so the markup
 * matches), but never when the root layout mounts fresh in the browser (e.g.
 * dev hot reload): React can't run a <script> it creates itself and warns about
 * it. `useSyncExternalStore` tells the two apart — the server snapshot (`true`)
 * is used for SSR and hydration, the client snapshot (`false`) otherwise.
 */
export default function ThemeScript() {
  const fromServerHtml = useSyncExternalStore(noopSubscribe, () => false, () => true);
  if (!fromServerHtml) return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
