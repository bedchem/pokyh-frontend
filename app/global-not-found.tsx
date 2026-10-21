import type { Metadata } from 'next';
import Pixel404 from '@/components/site/Pixel404';
import { makeT } from '@/lib/i18n/dictionary';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { notFoundDict } from '@/lib/i18n/dictionaries/notFound';
import { ACTIVE_LOCALES, DEFAULT_LOCALE, htmlLang, type Locale } from '@/lib/i18n/locale';
import { localeRedirectScript } from '@/lib/locale-redirect';
import { SITE_URL } from '@/lib/site-url';

// The website is static: every address that is no page gets this one
// document (404.html), from the web server. An address without a language
// (/, /home, an old link) is sent on to the same address under the right
// language by the script in its head (lib/locale-redirect.ts) before anything
// is drawn. Everything else is a real 404, shown in the language of the
// address (or the one chosen before): the document carries all three, and
// the second script shows the matching one. It carries its own small styles
// on purpose: importing globals.css here as well made it a second root
// stylesheet (see app/[lang]/layout.tsx). The pixel 404 is the site's
// (components/site/Pixel404.tsx); it brings its own styles and palette.

const CSS = `
:root{color-scheme:light dark;--paper:#F5F2ED;--ink:#1C1A17;--ink2:#625B52;--indigo:#534AB7;--lilac:#DEDDFB;--lilacInk:#4A46A6;--accent:#6366F1;--danger:#EF4444;--star:#F5B301}
@media (prefers-color-scheme:dark){:root{--paper:#121215;--ink:#F2F2F4;--ink2:#ABABB2;--lilac:#2C2A5C;--lilacInk:#D3D1FB;--accent:#818CF8}}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{padding:40px 20px;max-width:720px;display:none;flex-direction:column;align-items:center;text-align:center}
${ACTIVE_LOCALES.map((l) => `html[data-l="${l}"] main[lang="${htmlLang(l)}"]`).join(',')}{display:flex}
svg{display:block;width:min(640px,88vw);height:auto}
h1{margin:40px 0 0;font-size:clamp(28px,5vw,44px);letter-spacing:-.04em;line-height:1.06}p{margin:14px 0 0;font-size:18px;line-height:1.6;color:var(--ink2)}
nav{margin-top:32px;display:flex;flex-wrap:wrap;justify-content:center;gap:12px}a{display:inline-flex;align-items:center;height:52px;padding:0 24px;border-radius:16px;font-weight:650;text-decoration:none}
a.p{background:var(--indigo);color:#fff}a.s{background:var(--lilac);color:var(--lilacInk)}`;

// Which of the three versions is shown: the address's language, else the one
// chosen before, else German. Also sets the document's language.
const SHOW_SCRIPT = `(function(a,d){var l=location.pathname.split('/')[1];if(a.indexOf(l)<0){var m=document.cookie.match(/(?:^|;\\s*)pokyh_locale=([^;]*)/);l=m&&a.indexOf(m[1])>=0?m[1]:d}var h=document.documentElement;h.setAttribute('data-l',l);h.lang=l})(${JSON.stringify(ACTIVE_LOCALES)},${JSON.stringify(DEFAULT_LOCALE)});`;

// The social preview images of this document resolve against the site's
// address (lib/site-url.ts), as in app/[lang]/layout.tsx, not against the
// build machine.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${makeT(metaDict, DEFAULT_LOCALE)('notFound')} | POKYH`,
  robots: { index: false, follow: true },
};

function Version({ locale }: { locale: Locale }) {
  const t = makeT(notFoundDict, locale);
  return (
    <main lang={htmlLang(locale)}>
      <Pixel404 label="404" />
      <h1>{t('title')}</h1>
      <p>{t('hint')}</p>
      <nav>
        <a className="p" href={`/${locale}/`}>{t('home')}</a>
        <a className="s" href={`/${locale}/faq/`}>{t('help')}</a>
      </nav>
    </main>
  );
}

export default function GlobalNotFound() {
  return (
    <html lang={htmlLang(DEFAULT_LOCALE)} data-l={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeRedirectScript() }} />
        <script dangerouslySetInnerHTML={{ __html: SHOW_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        {ACTIVE_LOCALES.map((locale) => <Version key={locale} locale={locale} />)}
      </body>
    </html>
  );
}
