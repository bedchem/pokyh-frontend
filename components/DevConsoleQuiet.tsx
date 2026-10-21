'use client';

import { useSyncExternalStore } from 'react';

// Development only (`next dev`): keeps the browser console for what matters.
// The dev server's own chatter — "[Fast Refresh] rebuilding/done", "[HMR]
// connected" — and React's "Download the React DevTools" tip are dropped;
// warnings and errors are never touched (only log/info/debug are filtered).
// Next has no setting for these lines (logging.browserToTerminal only decides
// what reaches the terminal). Not part of the built website.
const QUIET = `(function(){var q=[/^\\[Fast Refresh\\]/,/^\\[HMR\\]/,/Download the React DevTools/];['log','info','debug'].forEach(function(m){var o=console[m];if(typeof o!=='function'||o.__pokyhQuiet)return;var w=function(){var a=arguments[0];if(typeof a==='string'){var s=a.replace(/^%c/,'');for(var i=0;i<q.length;i++)if(q[i].test(s))return}return o.apply(this,arguments)};w.__pokyhQuiet=1;console[m]=w})})()`;

const noopSubscribe = () => () => {};

/**
 * Rendered first in <head>, so it runs before the dev server's and React's
 * scripts log anything. Like ThemeScript, only in the server HTML (React
 * cannot run a <script> it creates itself on the client).
 */
export default function DevConsoleQuiet() {
  const fromServerHtml = useSyncExternalStore(noopSubscribe, () => false, () => true);
  if (!fromServerHtml) return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: QUIET }} />;
}
