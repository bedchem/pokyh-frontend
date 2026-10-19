import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Pixel404 from '@/components/site/Pixel404';
import { makeT } from '@/lib/i18n/dictionary';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { notFoundDict } from '@/lib/i18n/dictionaries/notFound';
import { DEFAULT_LOCALE, LOCALE_COOKIE, htmlLang, isLocale } from '@/lib/i18n/locale';

// The root layout lives in app/[lang], so a URL that matches no route at all
// (rare: the proxy gives every page a language prefix, and unknown pages under
// one are handled by (site)/[...rest]) renders this standalone document. It
// carries its own small styles on purpose: importing globals.css here as well
// made it a second root stylesheet, and every style change in development
// then failed to find that stylesheet on the open page. The pixel 404 is the
// one of the site's 404 (components/site/Pixel404.tsx), animated the same way.

const CSS = `
:root{color-scheme:light dark;--paper:#F5F2ED;--ink:#1C1A17;--ink2:#625B52;--indigo:#534AB7;--lilac:#DEDDFB;--lilacInk:#4A46A6;--accent:#6366F1;--success:#10B981;--butter-ink:#7A5B14;--star:#F5B301}
@media (prefers-color-scheme:dark){:root{--paper:#121215;--ink:#F2F2F4;--ink2:#ABABB2;--lilac:#2C2A5C;--lilacInk:#D3D1FB;--accent:#818CF8;--butter-ink:#EBD79A}}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{padding:40px 20px;max-width:720px;display:flex;flex-direction:column;align-items:center;text-align:center}
svg{display:block;width:min(560px,88vw);height:auto}
h1{margin:40px 0 0;font-size:clamp(28px,5vw,44px);letter-spacing:-.04em;line-height:1.06}p{margin:14px 0 0;font-size:18px;line-height:1.6;color:var(--ink2)}
nav{margin-top:32px;display:flex;flex-wrap:wrap;justify-content:center;gap:12px}a{display:inline-flex;align-items:center;height:52px;padding:0 24px;border-radius:16px;font-weight:650;text-decoration:none}
a.p{background:var(--indigo);color:#fff}a.s{background:var(--lilac);color:var(--lilacInk)}
.nf-art{--nf-ink:var(--accent);--nf-depth:color-mix(in srgb,var(--accent) 48%,#000);--nf-faint:color-mix(in srgb,var(--ink) 20%,transparent);--nf-cactus:var(--success);--nf-weed:var(--butter-ink);--nf-star:var(--star);overflow:visible}
.nf-digit{animation:d .8s steps(8,end) both}@keyframes d{0%{opacity:0;transform:translateY(-12px)}12%{opacity:1}70%{transform:translateY(1px)}100%{opacity:1;transform:none}}
.nf-question{opacity:0;animation:q 2.4s steps(1,end) 1s infinite}@keyframes q{0%,30%{opacity:1}32%{opacity:0}36%,70%{opacity:1}72%,100%{opacity:0}}
.nf-tumble{animation:r 5.6s steps(56,end) .9s infinite both}@keyframes r{0%{transform:translateX(-10px)}90%,100%{transform:translateX(58px)}}
.nf-turn{transform-box:fill-box;transform-origin:center;animation:t .8s steps(4,end) infinite}@keyframes t{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.nf-digit,.nf-question,.nf-tumble,.nf-turn{animation:none;opacity:1}}`;

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
          <Pixel404 label="404" />
          <h1>{t('title')}</h1>
          <p>{t('hint')}</p>
          <nav>
            <a className="p" href={`/${l}/`}>{t('home')}</a>
            <a className="s" href={`/${l}/faq/`}>{t('help')}</a>
          </nav>
        </main>
      </body>
    </html>
  );
}
