'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { notFoundDict } from '@/lib/i18n/dictionaries/notFound';
import Pixel404 from './Pixel404';

// Unknown pages, inside the site's own frame (header and footer around it):
// a big 404 in pixel art, one sentence, and the way back.

export default function NotFoundView() {
  const t = useT(notFoundDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const home = localize(user ? '/home' : '/');

  // Back where the visitor came from when that was a page of this site;
  // otherwise to the start page.
  const goBack = () => {
    const sameSite = document.referrer.startsWith(window.location.origin);
    if (sameSite && window.history.length > 1) window.history.back();
    else window.location.assign(home);
  };

  return (
    <section className="wrap flex min-h-[calc(92*var(--svh))] flex-col items-center justify-center pb-16 pt-28 text-center md:pt-32">
      <Pixel404 className="rise block w-[min(680px,94vw)]" label="404" />
      <h1 className="rise mt-8 max-w-[18ch] text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.06] tracking-[-0.045em] [animation-delay:80ms] md:mt-10">
        {t('title')}
      </h1>
      <p className="rise mt-4 max-w-[44ch] text-[17px] leading-[1.6] text-ink-2 [animation-delay:140ms] md:text-[19px]">{t('hint')}</p>
      <div className="rise mt-9 flex flex-wrap justify-center gap-3 [animation-delay:200ms]">
        <button type="button" onClick={goBack} className="key key-lg key-indigo">
          <ArrowLeft size={18} weight="bold" aria-hidden="true" />
          {t('back')}
        </button>
        <Link href={home} className="key key-lg key-line">{t('home')}</Link>
      </div>
    </section>
  );
}
