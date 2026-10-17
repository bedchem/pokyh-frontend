'use client';

import { useSyncExternalStore } from 'react';

// Before reading the theme, keys saved under the old misspelt prefix
// (pockyh_*) move to pokyh_* once, in local and session storage.
const MIGRATE = `try{[localStorage,sessionStorage].forEach(function(s){for(var i=s.length;i--;){var k=s.key(i);if(k&&k.indexOf('pockyh_')===0){var n='pokyh_'+k.slice(7);if(s.getItem(n)===null)s.setItem(n,s.getItem(k));s.removeItem(k)}}})}catch(e){}`;

const THEME_INIT = `(function(){${MIGRATE}var t=localStorage.getItem('pokyh_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')})()`;

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
