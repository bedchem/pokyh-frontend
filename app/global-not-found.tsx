import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { makeT } from '@/lib/i18n/dictionary';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { notFoundDict } from '@/lib/i18n/dictionaries/notFound';
import { DEFAULT_LOCALE, LOCALE_COOKIE, htmlLang, isLocale } from '@/lib/i18n/locale';

// The root layout lives in app/[lang], so a URL that matches no route at all
// (rare: the proxy gives every page a language prefix, and unknown pages under
// one are handled by (site)/[...rest]) renders this standalone document. It
// carries its own small styles on purpose: importing globals.css here as well
// made it a second root stylesheet, and every style change in development
// then failed to find that stylesheet on the open page.

const CSS = `
:root{color-scheme:light dark;--paper:#F5F2ED;--ink:#1C1A17;--ink2:#625B52;--indigo:#534AB7;--lilac:#DEDDFB;--lilacInk:#4A46A6}
@media (prefers-color-scheme:dark){:root{--paper:#121215;--ink:#F2F2F4;--ink2:#ABABB2;--lilac:#2C2A5C;--lilacInk:#D3D1FB}}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{padding:40px 20px;max-width:720px}p.n{margin:0;font-size:clamp(110px,24vw,220px);font-weight:800;letter-spacing:-.06em;line-height:.82;color:var(--lilacInk)}
h1{margin:24px 0 0;font-size:clamp(30px,5vw,52px);letter-spacing:-.04em;line-height:1.05}p.h{margin:16px 0 0;font-size:18px;line-height:1.6;color:var(--ink2)}
nav{margin-top:32px;display:flex;flex-wrap:wrap;gap:12px}a{display:inline-flex;align-items:center;height:52px;padding:0 24px;border-radius:16px;font-weight:650;text-decoration:none}
a.p{background:var(--indigo);color:#fff}a.s{background:var(--lilac);color:var(--lilacInk)}`;

async function locale() {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) && saved !== 'lld' ? saved : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = makeT(metaDict, await locale());
  return { title: `${t('notFound')} | POKYH`, robots: { index: false, follow: true } };
}

export default async function GlobalNotFound() {
  const l = await locale();
  const t = makeT(notFoundDict, l);
  return (
    <html lang={htmlLang(l)}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        <main>
          <p className="n" aria-hidden="true">404</p>
          <h1>{t('title')}</h1>
          <p className="h">{t('hint')}</p>
          <nav>
            <a className="p" href={`/${l}/`}>{t('home')}</a>
            <a className="s" href={`/${l}/faq/`}>{t('help')}</a>
          </nav>
        </main>
      </body>
    </html>
  );
}
