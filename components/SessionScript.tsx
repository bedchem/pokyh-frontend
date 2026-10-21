'use client';

import { useSyncExternalStore } from 'react';
import { ACTIVE_LOCALES } from '@/lib/i18n/locale';
import { PROTECTED_APP_ROUTES } from '@/lib/routes';
import { SESSION_MS } from '@/providers/SessionProvider';

// Where a page load belongs, decided before the first paint from the sign-in
// cookie (pokyh_user, providers/SessionProvider.tsx): a page of the app
// without a sign-in goes to the sign-in page (the app's Mensa to the public
// one), the sign-in page with one goes on into the app. So the installed app,
// opened again after hours, neither draws the dashboard of a sign-in that has
// run out nor loads the sign-in page only to leave it. A sign-in older than
// 4 hours counts as over, and its cookie goes. The pages check the same once
// they run; this only spares the trip through a page that is not the one.
const SESSION_INIT = `(function(){var l=location,m=l.pathname.match(/^\\/(${ACTIVE_LOCALES.join('|')})(\\/.*)?$/);if(!m)return;var lang=m[1],path=(m[2]||'/').replace(/\\/+$/,'')||'/',c=document.cookie.match(/(?:^|;\\s*)pokyh_user=([^;]*)/),u=null;try{u=c&&JSON.parse(decodeURIComponent(c[1]))}catch(e){}var on=!!u&&!(typeof u.loginAt==='number'&&Date.now()-u.loginAt>${SESSION_MS});if(c&&!on)document.cookie='pokyh_user=; Path=/; Max-Age=0; SameSite=Strict'+(l.protocol==='https:'?'; Secure':'');function go(to){document.documentElement.style.visibility='hidden';l.replace(to)}if(!on&&${JSON.stringify(PROTECTED_APP_ROUTES)}.some(function(r){return path===r||path.indexOf(r+'/')===0})){go(/^\\/canteen(\\/|$)/.test(path)?l.pathname.replace(/^(\\/[a-z]{2,3})\\/canteen(?=\\/|$)/,'$1/mensa')+l.search:'/'+lang+'/login/?next='+encodeURIComponent(l.pathname+l.search));return}if(on&&path==='/login'){var n=new URLSearchParams(l.search).get('next')||'';go(n.charAt(0)==='/'&&n.charAt(1)!=='/'?n:'/'+lang+'/home/')}})()`;

const noopSubscribe = () => () => {};

/** Sends a page load where it belongs before first paint; rendered with the server HTML only, like ThemeScript. */
export default function SessionScript() {
  const fromServerHtml = useSyncExternalStore(noopSubscribe, () => false, () => true);
  if (!fromServerHtml) return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: SESSION_INIT }} />;
}
