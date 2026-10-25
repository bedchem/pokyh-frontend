'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useT } from '@/providers/LocaleProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import Hero from './Hero';
import Manifest from './Manifest';
import { stretchCss } from '@/lib/scroll-pace';

// The sections after the first screens come in chunks of their own. They are
// in the page as built all the same; in the browser each comes alive in a
// task of its own once its code is there, instead of the whole page at once.
// (The manifest stays: the hero shows a copy of it on its dark screen.)
const Features = dynamic(() => import('./Features'));
const MensaToday = dynamic(() => import('./MensaToday'));
const AppOpen = dynamic(() => import('./AppOpen'));
const GetIn = dynamic(() => import('./GetIn'));

// The public homepage: the name assembles itself from five tiles, then a
// flight through the school-day tiles into the night, one sentence, the
// functions on the turning carousel, the next dish in the Mensa, and the app
// icon opening into the ways to get POKYH.

export default function Home() {
  const t = useT(frontpageDict);

  // When the tab is left alone, its title calls you back.
  useEffect(() => {
    const original = document.title;
    const away = t('tabAway');
    const onChange = () => { document.title = document.hidden ? away : original; };
    document.addEventListener('visibilitychange', onChange);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
      document.title = original;
    };
  }, [t]);

  return (
    <div className="home">
      {/* Longer scenes with a mouse or trackpad (lib/scroll-pace.ts); phones keep the base lengths. */}
      <style>{stretchCss('.home')}</style>
      <Hero />
      <Manifest />
      <Features />
      <MensaToday />
      <AppOpen />
      <GetIn />
    </div>
  );
}
