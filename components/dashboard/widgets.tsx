'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle, ForkKnife, Star } from '@phosphor-icons/react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { homeDict } from '@/lib/i18n/dictionaries/home';
import { cellTone, fmtTime, toMins, toneVars, type MergedSlot } from '@/lib/timetable-logic';
import type { MessagePreview, TimetableEntry } from '@/lib/types';
import { Bone, Line, RowsSkeleton } from '@/components/app/Skeleton';
import { initialsOf } from '@/components/app/hooks';
import { useExternalMedia } from '@/lib/external-media';
import PixelState from '@/components/app/PixelState';
import { TONE_CLASS, type AppDestination } from '@/components/app/nav';
import { fmtDateShort, formatMark, gradeClass } from '@/lib/grades';

// The dashboard's building blocks (home/page.tsx): list cards under plain
// section headings, the exam as the one coloured block, the Mensa with its
// photo. Every card shares one radius; rows show a soft fill on hover.


const hoverRow = 'transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]';
const tileBase = 'squircle rounded-[26px]';

function subjectOf(e: TimetableEntry): string {
  return e.subjectLong || e.subjectName || e.note || '–';
}

/** The lesson that actually takes place in a slot (none for a cancelled one). */
export function lessonOf(slot: MergedSlot): TimetableEntry | null {
  if (slot.kind === 'cancelled') return null;
  return slot.replacement ?? slot.display;
}

// ── Card ──────────────────────────────────────────────────────────────────────

/** A surface card for a list; its heading sits above it on the page. */
export function ListCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${tileBase} flex flex-col bg-surface p-2 ${className}`}>{children}</div>;
}

/** Nothing to list (box) or the list couldn't be loaded (plug). */
function Empty({ children, failed }: { children: ReactNode; failed?: string }) {
  return failed
    ? <PixelState compact sprite="unplugged" title={String(children)} detail={failed} />
    : <PixelState compact sprite="empty" title={String(children)} />;
}

// ── Stunden ───────────────────────────────────────────────────────────────────

function Chip({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${className}`}>{children}</span>;
}

export function DayList({ slots, minute, isToday, loading, emptyText }: { slots: MergedSlot[]; minute: number; isToday: boolean; loading: boolean; emptyText: string }) {
  const t = useT(homeDict);
  const localize = useLocalizeHref();

  if (loading) return <RowsSkeleton rows={5} lead="time" trailing bare />;
  if (slots.length === 0) return <Empty>{emptyText}</Empty>;

  return (
    <div className="rise flex flex-col gap-0.5">
      {slots.map((slot) => {
        const shown = slot.replacement ?? slot.display;
        const cancelled = slot.kind === 'cancelled';
        const running = isToday && !cancelled && toMins(shown.startTime) <= minute && minute < toMins(shown.endTime);
        const passed = isToday && minute >= toMins(shown.endTime);
        const details = [shown.roomName, shown.teacherLongName || shown.teacherName].filter(Boolean).join(' · ');
        return (
          <Link
            key={slot.id}
            href={localize(`/timetable?open=${shown.id}&date=${shown.date}`)}
            className={`flex items-center gap-3.5 rounded-[18px] px-3 py-2.5 ${hoverRow} ${running ? 'bg-inset' : ''}`}
          >
            <span className={`mono w-[46px] shrink-0 text-[13px] leading-[1.35] ${passed ? 'text-ink-3' : 'text-ink-2'}`}>
              <span className={`block font-medium ${passed ? '' : 'text-ink'}`}>{fmtTime(shown.startTime)}</span>
              {fmtTime(shown.endTime)}
            </span>
            <span className="tone-bar w-1.5 self-stretch rounded-full" style={toneVars(cellTone(slot.display, slot.kind))} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[15.5px] font-semibold ${cancelled ? 'text-ink-3 line-through' : passed ? 'text-ink-2' : 'text-ink'}`}>
                {subjectOf(shown)}
              </span>
              {details && <span className="block truncate text-[13.5px] text-ink-2">{details}</span>}
            </span>
            {running && <Chip className="bg-accent text-on-accent">{t('now')}</Chip>}
            {!running && shown.isExam && !cancelled && <Chip className="bg-butter text-butter-ink">{t('exam')}</Chip>}
            {cancelled && <Chip className="bg-blush text-blush-ink">{t('cancelled')}</Chip>}
            {!running && slot.kind === 'replacement' && !cancelled && <Chip className="bg-periwinkle text-periwinkle-ink">{t('substitution')}</Chip>}
          </Link>
        );
      })}
    </div>
  );
}

// ── Prüfung ───────────────────────────────────────────────────────────────────

/**
 * The next exam as the page's coloured block: the countdown set large, the
 * subject and where and when underneath. It fills the height of its row.
 */
export function ExamCard({
  exam,
  when,
  date,
  loading,
}: {
  exam: TimetableEntry | null;
  when: string;
  date: string;
  loading: boolean;
}) {
  const t = useT(homeDict);
  const localize = useLocalizeHref();
  const cls = `${tileBase} relative flex h-full min-h-[220px] flex-col items-start justify-center gap-4 bg-butter p-6 text-butter-ink md:p-7`;
  if (loading) {
    return (
      <div className={cls} aria-hidden="true">
        <Line w={110} h={24} />
        <Line w={150} h={44} />
        <span className="flex w-full flex-col gap-2.5"><Line w="60%" h={20} /><Line w="34%" h={12} /></span>
      </div>
    );
  }
  if (!exam) {
    return (
      <div className={cls}>
        <CheckCircle size={32} weight="fill" aria-hidden="true" />
        <span className="max-w-[22ch] text-[22px] font-extrabold leading-tight tracking-[-0.035em]">{t('noExam')}</span>
      </div>
    );
  }
  return (
    <Link href={localize(`/timetable?open=${exam.id}&date=${exam.date}`)} className={`${cls} group transition-[filter] duration-300 hover:brightness-[0.98] dark:hover:brightness-110`}>
      <ArrowRight size={20} weight="bold" className="absolute right-6 top-6 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
      <span className="rounded-full bg-[color-mix(in_srgb,currentColor_13%,transparent)] px-3 py-1 text-[13.5px] font-bold">{date}</span>
      <span className="rise flex flex-col items-start">
        <span className="block text-[clamp(38px,3.8vw,54px)] font-extrabold leading-none tracking-[-0.055em]">{when}</span>
        <span className="mt-3 block max-w-[24ch] text-[21px] font-bold leading-tight tracking-[-0.025em] underline decoration-2 underline-offset-[6px] [overflow-wrap:anywhere]">{subjectOf(exam)}</span>
        <span className="mt-1.5 block text-[14.5px] font-semibold opacity-80">
          {[exam.startTime ? fmtTime(exam.startTime) : '', exam.roomName].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
  );
}

// ── Noten ─────────────────────────────────────────────────────────────────────

export interface RecentGrade {
  id: number;
  subjectName: string;
  subjectLessonId: number;
  markDisplayValue: number;
  date: number;
  examType: string;
  /** When WebUntis says it was entered (epoch ms), for the order (lib/grade-order.ts). */
  enteredAt?: number | null;
}

/** Pass, borderline, fail, as category tones (thresholds of lib/colors.ts). */
export function gradeTone(v: number): string {
  if (v >= 6.4) return 'bg-sage text-sage-ink';
  if (v >= 6) return 'bg-butter text-butter-ink';
  return 'bg-blush text-blush-ink';
}

export function gradeInk(v: number): string {
  if (v >= 6.4) return 'text-success-ink';
  if (v >= 6) return 'text-warning-ink';
  return 'text-danger-ink';
}

export function formatGrade(v: number): string {
  // Marks keep their quarter steps: 7.25 stays 7.25, never 7.3.
  return String(Math.round(v * 100) / 100);
}

/** The mark's chip in the tones of the Noten page (lib/grades.ts gradeClass). */
const MARK_TONE: Record<ReturnType<typeof gradeClass>, string> = {
  'v-excellent': 'bg-sage text-sage-ink',
  'v-positive': 'bg-sage text-sage-ink',
  'v-negative': 'bg-butter text-butter-ink',
  'v-critical': 'bg-blush text-blush-ink',
};

/**
 * The grades added last, as the Noten page's "Kürzlich hinzugefügt" shows
 * them: subject and date, the mark on the right. A row opens the subject.
 */
export function GradeList({
  grades,
  loading,
  emptyText,
  failed,
}: {
  grades: RecentGrade[];
  loading: boolean;
  emptyText: string;
  /** Why the grades couldn't be loaded, when they couldn't. */
  failed?: string;
}) {
  const localize = useLocalizeHref();
  if (loading) return <RowsSkeleton rows={3} lead="none" trailing bare />;
  if (grades.length === 0) return <Empty failed={failed}>{emptyText}</Empty>;
  return (
    <div className="rise flex flex-col gap-0.5">
      {grades.map((g) => (
        <Link key={g.id} href={localize(`/grades/subject/${g.subjectLessonId}`)} className={`flex items-center gap-3.5 rounded-[18px] px-3 py-2.5 ${hoverRow}`}>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15.5px] font-semibold">{g.subjectName || '–'}</span>
            <span className="block truncate text-[13.5px] text-ink-3 tnum">{fmtDateShort(g.date)}</span>
          </span>
          <span className={`grid h-[38px] min-w-[48px] shrink-0 place-items-center rounded-[12px] px-2 text-[15px] font-extrabold tnum ${MARK_TONE[gradeClass(g.markDisplayValue)]}`}>
            {formatMark(g.markDisplayValue)}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Nachrichten ───────────────────────────────────────────────────────────────

export function MessageList({ messages, dateText, loading, emptyText, failed }: { messages: MessagePreview[]; dateText: (s: string) => string; loading: boolean; emptyText: string; failed?: string }) {
  const localize = useLocalizeHref();
  if (loading) return <RowsSkeleton rows={3} lead="round" trailing bare />;
  if (messages.length === 0) return <Empty failed={failed}>{emptyText}</Empty>;
  return (
    <div className="rise flex flex-col">
      {messages.map((m) => (
        <Link key={m.id} href={localize(`/messages/${m.id}`)} className={`relative before:pointer-events-none before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line before:transition-opacity first:before:hidden hover:before:opacity-0 [&:hover+a]:before:opacity-0 flex items-center gap-3.5 rounded-[18px] px-3 py-2.5 ${hoverRow}`}>
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-inset text-[14px] font-bold text-ink-2">
            {initialsOf(m.senderName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[15.5px] ${m.isRead ? 'font-medium' : 'font-bold'}`}>{m.subject}</span>
            <span className="block truncate text-[13.5px] text-ink-2">{m.senderName}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-[12.5px] text-ink-3">{dateText(m.sentDate)}</span>
            {!m.isRead && <span className="size-2.5 rounded-full bg-accent" />}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Mensa ─────────────────────────────────────────────────────────────────────

export interface DashDish {
  id: string;
  name: string;
  imageUrl?: string;
  diet: string | null;
  rating: { value: number; count: number } | null;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => {
        const fill = Math.min(1, Math.max(0, value - (s - 1)));
        return (
          <span key={s} className="relative" style={{ width: size, height: size }}>
            <Star size={size} weight="fill" className="absolute inset-0 text-[color-mix(in_srgb,var(--ink)_14%,transparent)]" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} weight="fill" className="text-star" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function RatingText({ rating, noRating }: { rating: DashDish['rating']; noRating: string }) {
  if (!rating || rating.count === 0) return <span>{noRating}</span>;
  return (
    <>
      <Stars value={rating.value} />
      <span className="font-semibold text-ink">{rating.value.toFixed(1)}</span>
      <span>({rating.count})</span>
    </>
  );
}

/** Today's (or the next) dishes: the first one large with its photo, the others as rows. */
export function MensaCard({ dishes, loading, noRating }: { dishes: DashDish[]; loading: boolean; noRating: string }) {
  const localize = useLocalizeHref();
  // Dish photos come from recipe sites: shown unless the visitor hid them (lib/external-media.ts).
  const photos = useExternalMedia();
  const [lead, ...rest] = dishes;
  const card = `${tileBase} flex flex-col gap-1 bg-surface p-2`;
  if (loading) {
    return (
      <div aria-hidden="true" className={`${card} text-ink`}>
        <span className="flex items-center gap-4 p-2">
          <Bone className="aspect-[4/3] w-32 shrink-0 !rounded-[16px]" />
          <span className="flex flex-1 flex-col gap-2.5"><Line w="80%" h={15} /><Line w="45%" h={11} /></span>
        </span>
      </div>
    );
  }
  if (!lead) return null;
  return (
    <div className={`${card} rise`}>
      <Link href={localize(`/canteen/dish/${encodeURIComponent(lead.id)}`)} className={`group flex items-center gap-4 rounded-[20px] p-2 ${hoverRow}`}>
        <span className="relative block aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-[16px] bg-butter text-butter-ink sm:w-44 xl:w-52">
          {lead.imageUrl && photos ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lead.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.05]" />
          ) : (
            <ForkKnife size={30} className="absolute inset-0 m-auto opacity-60" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[16.5px] font-bold leading-snug tracking-[-0.015em]">{lead.name}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2">
            <RatingText rating={lead.rating} noRating={noRating} />
            {lead.diet && <span className="rounded-full bg-sage px-2 py-0.5 text-[12px] font-bold text-sage-ink">{lead.diet}</span>}
          </span>
        </span>
      </Link>
      {rest.map((d) => (
        <Link key={d.id} href={localize(`/canteen/dish/${encodeURIComponent(d.id)}`)} className={`flex items-center gap-3 rounded-[18px] px-3 py-2 ${hoverRow}`}>
          <span className="relative size-11 shrink-0 overflow-hidden rounded-[12px] bg-butter text-butter-ink">
            {d.imageUrl && photos
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={d.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
              : <ForkKnife size={18} className="absolute inset-0 m-auto opacity-60" aria-hidden="true" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{d.name}</span>
            <span className="flex items-center gap-x-1.5 text-[12.5px] text-ink-2"><RatingText rating={d.rating} noRating={noRating} /></span>
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Schnellzugriff ────────────────────────────────────────────────────────────

/**
 * The Android app's quick select: one tile per place in its fixed tone, so the
 * grid can be learnt by colour as well as by name.
 */
export function QuickTile({ dest, label, note, index = 0 }: { dest: AppDestination; label: string; note?: string; index?: number }) {
  const localize = useLocalizeHref();
  const { Icon } = dest;
  return (
    <Link
      href={localize(dest.href)}
      className={`${tileBase} rise group flex min-h-[132px] min-w-0 flex-col justify-between p-4 transition-[filter] sm:min-h-[148px] sm:p-5 duration-300 hover:brightness-[0.97] dark:hover:brightness-110 ${TONE_CLASS[dest.tone]}`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span className="flex items-start justify-between">
        <Icon size={28} weight="bold" aria-hidden="true" />
        <ArrowRight size={18} weight="bold" className="-translate-x-1 opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-out)] group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[17px] font-bold leading-tight tracking-[-0.02em] sm:text-[19px]">{label}</span>
        {note && <span className="mt-1 block text-[13px] font-semibold leading-snug opacity-80 sm:text-[13.5px]">{note}</span>}
      </span>
    </Link>
  );
}
