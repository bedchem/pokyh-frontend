'use client';

import { useEffect } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import Intro from './Intro';
import Hero from './Hero';
import Manifest from './Manifest';
import Features from './Features';
import MensaToday from './MensaToday';
import AppOpen from './AppOpen';
import GetIn from './GetIn';

// The public homepage: fly through the tiles into the night, one sentence,
// the functions on the turning carousel, today's dish, and the app icon
// opening into the ways to get POKYH.

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
      <Intro />
      <Hero />
      <Manifest />
      <Features />
      <MensaToday />
      <AppOpen />
      <GetIn />
    </div>
  );
}
