'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import DeviceFrame from './DeviceFrame';

// The steps of an install guide next to a phone that shows each step. On wide
// screens the phone stays in place while the steps scroll past, and its
// screen changes to the step in the middle of the view; on narrow screens
// every step has its own phone below the text. Screenshots follow the theme
// (light captures in the light theme, dark ones in the dark theme).

export interface PhoneStep {
  key: string;
  num: string;
  title: string;
  body: ReactNode;
  imgLight: string;
  imgDark: string;
  alt: string;
}

function Screen({ step, eager, className = '' }: { step: PhoneStep; eager?: boolean; className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={step.imgLight} alt={step.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={`absolute inset-0 h-full w-full object-cover dark:hidden ${className}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={step.imgDark} alt={step.alt} loading="lazy" decoding="async" className={`absolute inset-0 hidden h-full w-full object-cover dark:block ${className}`} />
    </>
  );
}

export default function PhoneSteps({ platform, steps }: { platform: 'ios' | 'android'; steps: PhoneStep[] }) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);

  // The step crossing the middle of the view is the one on the screen.
  useEffect(() => {
    const items = list.current?.querySelectorAll<HTMLElement>('[data-step]');
    if (!items?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step)); });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="wrap grid gap-10 pb-24 md:pb-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-20">
      <ol ref={list}>
        {steps.map((s, i) => (
          <li
            key={s.key}
            data-step={i}
            className="flex flex-col justify-center border-t border-line py-12 first:border-t-0 first:pt-0 lg:min-h-[72vh] lg:py-16 lg:first:pt-16"
          >
            <span
              aria-hidden="true"
              className={`grid size-11 place-items-center rounded-full text-[16px] font-bold tnum transition-colors duration-300 ${
                active === i ? 'bg-ink text-[var(--paper)]' : 'bg-inset text-ink-2'
              }`}
            >
              {i + 1}
            </span>
            <h2 className="mt-5 max-w-[18ch] text-[clamp(28px,3.4vw,44px)] font-extrabold leading-[1.04] tracking-[-0.04em] text-ink">{s.title}</h2>
            <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.7] text-ink-2 md:text-[19px]">{s.body}</p>
            <div className="mt-10 flex justify-center lg:hidden">
              <DeviceFrame platform={platform} className="w-[min(70vw,290px)]">
                <Screen step={s} eager={i === 0} />
              </DeviceFrame>
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block" aria-hidden="true">
        <div className="sticky top-[104px] py-4">
          {/* As large as fits between the header and the bottom of the view */}
          <DeviceFrame platform={platform} className="mx-auto w-[min(25vw,330px,calc((100svh-190px)/2.1))]">
            {steps.map((s, i) => (
              <div key={s.key} className={`absolute inset-0 transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-0'}`}>
                <Screen step={s} eager={i === 0} />
              </div>
            ))}
          </DeviceFrame>
          <div className="mt-8 flex justify-center gap-2">
            {steps.map((s, i) => (
              <span key={s.key} className={`h-2 rounded-full transition-all duration-300 ${active === i ? 'w-6 bg-ink' : 'w-2 bg-line'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
