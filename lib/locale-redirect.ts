import { ACTIVE_LOCALES, FALLBACK_LOCALE, LOCALE_COOKIE, RETIRED_LOCALES } from './i18n/locale';

// Every page lives under a language: /de/about/. The website is static, so a
// visit to an address without one (/, /home, /legal/datenschutz, an old link)
// is answered by a page that runs this script: it picks the language — the
// one chosen before (pokyh_locale), else the browser's, else the fallback —
// and goes to the same address under it, keeping query and fragment. A
// retired language (Ladin) lands on the German page. nginx does the same on
// the server already (deploy/nginx.conf); this covers every other host.
//
// Addresses under an active language that do not exist stay on the 404 page,
// and file names (with an extension) are never treated as pages.

export function localeRedirectScript(): string {
  const config = JSON.stringify({ active: ACTIVE_LOCALES, retired: RETIRED_LOCALES, fallback: FALLBACK_LOCALE, cookie: LOCALE_COOKIE });
  return `(function(c){var p=location.pathname.split('/').filter(Boolean);var ok=function(v){return c.active.indexOf(v)>=0};
if(p.length&&ok(p[0]))return;
var tail=function(parts){var r=parts.join('/');return(r?r+'/':'')+location.search+location.hash};
if(p.length&&c.retired.indexOf(p[0])>=0){p.shift();location.replace('/de/'+tail(p));return}
if(p.length&&/\\.[a-z0-9]+$/i.test(p[p.length-1]))return;
var m=document.cookie.match(new RegExp('(?:^|;\\\\s*)'+c.cookie+'=([^;]*)'));var l=m&&ok(m[1])?m[1]:null;
if(!l){var n=navigator.languages||[navigator.language||''];for(var i=0;i<n.length&&!l;i++){var k=String(n[i]).toLowerCase().split('-')[0];if(ok(k))l=k}}
location.replace('/'+(l||c.fallback)+'/'+tail(p))})(${config});`;
}
