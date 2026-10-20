'use client';

import { useSyncExternalStore } from 'react';

// The viewport heights the scroll scenes are built from (--lvh, --svh,
// --toolbar in app/globals.css), measured once before the first paint: the
// large viewport (a phone's browser bars hidden) and the small one (bars
// shown). On a touch device they are measured again only when the width
// changes (turning the phone), never while the bars slide in and out, so
// nothing on the page changes size while scrolling, even in a browser whose
// own lvh and svh move along with the bars. Elsewhere (a desktop window
// being resized) every resize measures them again. Without the script the
// CSS units themselves stand in.
const VIEWPORT_INIT = `(function(){var d=document.documentElement,touch=matchMedia('(hover: none), (pointer: coarse)').matches,w=-1;function probe(u){var e=document.createElement('div');e.style.cssText='position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:100'+u;d.appendChild(e);var h=e.offsetHeight;d.removeChild(e);return h}function set(){var L=probe('lvh')||probe('vh')||innerHeight,S=Math.min(L,probe('svh')||L);d.style.setProperty('--lvh',L/100+'px');d.style.setProperty('--svh',S/100+'px');d.style.setProperty('--toolbar',L-S+'px');w=innerWidth}set();addEventListener('resize',function(){if(!touch||innerWidth!==w)set()})})()`;

const noopSubscribe = () => () => {};

/** Sets the viewport heights before first paint; rendered with the server HTML only, like ThemeScript. */
export default function ViewportScript() {
  const fromServerHtml = useSyncExternalStore(noopSubscribe, () => false, () => true);
  if (!fromServerHtml) return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: VIEWPORT_INIT }} />;
}
