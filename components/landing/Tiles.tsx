'use client';

import { useT } from '@/providers/LocaleProvider';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import Image from 'next/image';

// Small objects of a school day, used as the floating tiles of the hero and
// the inner ring of the carousel. Sample content only. Sizes are in container
// units so a tile reads the same at every size.

export type TileKind = 'time' | 'cancel' | 'grade' | 'plate' | 'message' | 'mark' | 'exam' | 'week';
export const TILE_KINDS: TileKind[] = ['time', 'plate', 'grade', 'message', 'cancel', 'week', 'exam', 'mark'];

// Pasta on the plate: an Archimedean spiral, rounded so server and client match.
const SPIRAL = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2 * 4.2;
    const r = 3 + (i / 120) * 25;
    pts.push(`${Math.round((60 + Math.cos(a) * r) * 10) / 10},${Math.round((60 + Math.sin(a) * r) * 10) / 10}`);
  }
  return pts.join(' ');
})();

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const r = (v: number) => Math.round(v * 10) / 10;
  return { x1: r(60 + Math.sin(a) * 40), y1: r(60 - Math.cos(a) * 40), x2: r(60 + Math.sin(a) * 44), y2: r(60 - Math.cos(a) * 44) };
});

const WEEK: { h: number; tone: string }[][] = [
  [{ h: 22, tone: 'var(--periwinkle)' }, { h: 14, tone: 'var(--butter)' }, { h: 26, tone: 'var(--sage)' }],
  [{ h: 30, tone: 'var(--blush)' }, { h: 18, tone: 'var(--periwinkle)' }, { h: 12, tone: 'var(--butter)' }],
  [{ h: 16, tone: 'var(--sage)' }, { h: 24, tone: '#FFFFFF' }, { h: 20, tone: 'var(--blush)' }],
  [{ h: 26, tone: 'var(--butter)' }, { h: 14, tone: 'var(--sage)' }, { h: 18, tone: 'var(--periwinkle)' }],
  [{ h: 20, tone: 'var(--periwinkle)' }, { h: 22, tone: 'var(--blush)' }],
];

export default function Tile({ kind }: { kind: TileKind }) {
  const t = useT(homepageDict);

  switch (kind) {
    case 'time':
      return (
        <div className="tile flex h-full w-full flex-col justify-between bg-[var(--periwinkle)] p-[9cqw] text-[var(--periwinkle-ink)]">
          <span className="text-[10cqw] font-semibold leading-tight">{t('tPeriod')}</span>
          <span className="font-display text-[36cqw] leading-[0.8] tracking-[-0.04em]">07:55</span>
          <span className="text-[9.5cqw] font-medium leading-tight">
            {t('tSubject')}
            <span className="block opacity-60">{t('tRoom')}</span>
          </span>
        </div>
      );
    case 'cancel':
      return (
        <div className="tile flex h-full w-full flex-col items-center justify-center gap-[3cqw] bg-[var(--night)] text-white">
          <span className="font-display relative text-[24cqw] leading-none">
            {t('tCancel')}
            <span className="absolute -inset-x-[6%] top-[56%] h-[1.2cqw] -rotate-[5deg] rounded-full bg-[#FF8D7A]" />
          </span>
          <span className="text-[6cqw] font-medium opacity-60">{t('tCancelSub')}</span>
        </div>
      );
    case 'grade':
      return (
        <div className="tile relative flex h-full w-full flex-col justify-between bg-[var(--sage)] p-[9cqw] text-[var(--sage-ink)]">
          <span className="text-[9.5cqw] font-semibold leading-tight">{t('tGradeSubject')}</span>
          <span className="font-display absolute right-[10cqw] top-[6cqw] text-[78cqw] leading-none">9</span>
          <span className="text-[8.5cqw] font-medium opacity-70">{t('tAverage')}</span>
        </div>
      );
    case 'plate':
      return (
        <div className="tile flex h-full w-full flex-col bg-[var(--butter)] p-[8cqw] text-[var(--butter-ink)]">
          <svg viewBox="0 0 120 120" className="mx-auto w-[86%] flex-none" aria-hidden="true">
            <circle cx="60" cy="60" r="48" fill="#FFFDF5" />
            <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.45">
              {TICKS.map((k, i) => <line key={i} {...k} />)}
            </g>
            <polyline points={SPIRAL} fill="none" stroke="#D9863B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="52" cy="52" r="3.2" fill="#B5462A" />
            <circle cx="69" cy="63" r="2.6" fill="#B5462A" />
            <circle cx="58" cy="71" r="2.2" fill="#6E8B3D" />
          </svg>
          <span className="mt-auto text-[10cqw] font-semibold leading-tight">Pasta al ragù</span>
          <span className="mt-[2cqw] flex gap-[1.5cqw] text-[8cqw] leading-none" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <svg key={i} viewBox="0 0 24 24" className="size-[8cqw]" fill={i < 4 ? '#E9A400' : 'currentColor'} opacity={i < 4 ? 1 : 0.25}>
                <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
              </svg>
            ))}
          </span>
        </div>
      );
    case 'message':
      return (
        <div className="tile flex h-full w-full flex-col gap-[5cqw] bg-[var(--blush)] p-[8cqw] text-[var(--blush-ink)]">
          <span className="text-[9cqw] font-semibold leading-tight">{t('tMsgFrom')}</span>
          <span className="rounded-[7cqw] rounded-bl-[2cqw] bg-white/75 p-[7cqw] text-[9.5cqw] font-medium leading-[1.3] text-ink">
            {t('tMsgText')}
          </span>
          <span className="mt-auto text-[8cqw] font-medium opacity-60">07:41</span>
        </div>
      );
    case 'mark':
      return (
        <div className="tile relative h-full w-full bg-[#5B54D6]">
          <Image src="/POKYH_Logo.png" alt="" fill sizes="200px" className="object-cover" />
        </div>
      );
    case 'exam':
      return (
        <div className="tile flex h-full w-full flex-col bg-white text-ink">
          <span className="bg-[#E5553F] px-[8cqw] py-[5cqw] text-[8.5cqw] font-semibold text-white">{t('tExamDay')}</span>
          <span className="font-display flex-1 px-[8cqw] text-[52cqw] leading-[1.05]">23</span>
          <span className="px-[8cqw] pb-[8cqw] text-[8.5cqw] font-medium leading-tight text-ink-2">{t('tExam')}</span>
        </div>
      );
    case 'week': {
      const days = t('tWeekdays').split('|');
      return (
        <div className="tile relative grid h-full w-full grid-cols-5 gap-[2.4cqw] bg-[var(--periwinkle-ink)] p-[5cqw] text-white">
          {WEEK.map((col, i) => (
            <div key={i} className="flex flex-col gap-[1.6cqw]">
              <span className="text-[4.2cqw] font-semibold opacity-70">{days[i]}</span>
              {col.map((b, j) => (
                <span key={j} className="block rounded-[1.6cqw]" style={{ height: `${b.h}cqh`, background: b.tone, opacity: 0.92 }} />
              ))}
            </div>
          ))}
          <span className="absolute inset-x-[3cqw] top-[47%] flex items-center gap-[1.5cqw]">
            <span className="rounded-full bg-[#FF8D7A] px-[1.8cqw] py-[0.6cqw] text-[3.6cqw] font-semibold text-[var(--night)]">{t('tNow')}</span>
            <span className="h-[0.5cqw] flex-1 rounded-full bg-[#FF8D7A]" />
          </span>
        </div>
      );
    }
  }
}
