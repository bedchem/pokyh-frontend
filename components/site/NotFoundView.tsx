'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { notFoundDict } from '@/lib/i18n/dictionaries/notFound';
import { siteDict, type SiteKey } from '@/lib/i18n/dictionaries/site';

// Unknown pages, inside the site's own frame (header and footer around it):
// today's timetable, where the lesson of the missing page is cancelled.

const TIMES = ['07:55', '08:45', '09:35', '10:40', '11:30'];
/** Row of the timetable that holds the missing page. */
const MISSING_ROW = 3;
const TONES = [
  'bg-periwinkle text-periwinkle-ink',
  'bg-butter text-butter-ink',
  'bg-sage text-sage-ink',
  '',
  'bg-[var(--mint)] text-[var(--mint-ink)]',
];

const LINKS: { key: SiteKey; href: string }[] = [
  { key: 'navTools', href: '/tools' },
  { key: 'navWebuntis', href: '/webuntis' },
  { key: 'navMensa', href: '/mensa' },
  { key: 'navGet', href: '/get' },
  { key: 'navAbout', href: '/about' },
];

/** The requested path without the language prefix, decoded when it can be. */
function readablePath(pathname: string): string {
  let path = pathname;
  try { path = decodeURIComponent(pathname); } catch { /* keep it encoded */ }
  return path.replace(/^\/(de|it|en)(?=\/|$)/, '') || '/';
}

export default function NotFoundView() {
  const t = useT(notFoundDict);
  const ts = useT(siteDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const path = readablePath(usePathname() ?? '/');
  const lessons = t('lessons').split('|');
  const rows = TIMES.map((time, i) => (i === MISSING_ROW ? null : lessons[i > MISSING_ROW ? i - 1 : i] ?? ''));

  return (
    <section className="wrap grid min-h-[calc(84*var(--svh))] items-center gap-14 pb-20 pt-32 md:pt-40 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
      <div className="min-w-0">
        <p aria-hidden="true" className="rise font-display text-[clamp(96px,17vw,220px)] leading-[0.82] text-[var(--lilac-ink)]">404</p>
        <h1 className="rise mt-6 max-w-[14ch] text-[clamp(34px,4.6vw,60px)] font-extrabold leading-[1.04] tracking-[-0.045em] [animation-delay:60ms]">{t('title')}</h1>
        <p className="rise mt-5 max-w-[46ch] text-[17px] leading-[1.6] text-ink-2 md:text-[19px] [animation-delay:120ms]">{t('hint')}</p>
        <div className="rise mt-8 flex flex-wrap gap-3 [animation-delay:180ms]">
          <Link href={localize(user ? '/home' : '/')} className="key key-lg key-indigo">
            {t('home')}
            <span aria-hidden="true" className="key-arrow">→</span>
          </Link>
          {!user && <Link href={localize('/login')} className="key key-lg key-lilac">{t('login')}</Link>}
          <Link href={localize('/faq')} className="key key-lg key-line">{t('help')}</Link>
        </div>
        <nav aria-label={t('more')} className="rise mt-10 [animation-delay:240ms]">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-3">{t('more')}</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[16px] font-semibold">
            {LINKS.map((l) => (
              <li key={l.key}>
                <Link href={localize(l.href)} className="text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline">{ts(l.key)}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Today's timetable; the missing page is the cancelled lesson */}
      <div aria-hidden="true" className="rise mx-auto w-full max-w-[440px] [animation-delay:200ms]">
        <div className="card -rotate-[2.5deg] p-4 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.35)] transition-transform duration-700 ease-[var(--ease-out)] hover:rotate-0 sm:p-5">
          <div className="flex items-center justify-between px-2 pb-3 pt-1">
            <span className="text-[15px] font-bold">{t('today')}</span>
            <span className="text-[13px] font-semibold text-ink-3">{TIMES[0]} - 12:20</span>
          </div>
          <ol className="flex flex-col gap-2">
            {rows.map((subject, i) => (
              <li
                key={TIMES[i]}
                className={`flex items-center gap-3 rounded-[16px] px-3.5 py-3 ${
                  subject === null ? 'translate-x-3 rotate-[2deg] bg-[var(--blush)] text-[var(--blush-ink)] shadow-[0_14px_28px_-16px_rgb(0_0_0/0.35)]' : TONES[i]
                }`}
              >
                <span className="w-[52px] shrink-0 text-[13px] font-semibold tabular-nums opacity-75">{TIMES[i]}</span>
                {subject === null ? (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold opacity-75">{t('period', { n: i + 1 })}</span>
                      <span className="block truncate text-[15.5px] font-bold line-through decoration-2">{path}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[var(--blush-ink)] px-2.5 py-1 text-[12px] font-bold text-[var(--blush)]">{t('cancelled')}</span>
                  </>
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold opacity-75">{t('period', { n: i + 1 })}</span>
                    <span className="block truncate text-[15.5px] font-bold">{subject}</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
