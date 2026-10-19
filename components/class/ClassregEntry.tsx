'use client';

import { formatDate } from '@/lib/i18n/dateLocale';

// One class-register (Klassenbuch) entry as WebUntis sends it, and its row:
// a calendar tile in the tone of the category, what was noted and by whom.
// Used by the Klassenbuch page and the class overview.

export type ClassregEvent = {
  id: number;
  elementName: string;
  subjectName: string;
  creatorName: string;
  createDate: number;
  createTime: number;
  eventReasonName: string;
  categoryName: string;
  text: string;
};

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeClassregEvent(value: unknown, index: number): ClassregEvent {
  const event = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    id: typeof event.id === 'number' ? event.id : index,
    elementName: textValue(event.elementName),
    subjectName: textValue(event.subjectName),
    creatorName: textValue(event.creatorName),
    createDate: typeof event.createDate === 'number' ? event.createDate : 0,
    createTime: typeof event.createTime === 'number' ? event.createTime : 0,
    eventReasonName: textValue(event.eventReasonName),
    categoryName: textValue(event.categoryName),
    text: textValue(event.text),
  };
}

export function parseClassregRows(raw: unknown): ClassregEvent[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  const data = (r.data ?? r) as Record<string, unknown>;
  const rows = data?.rows;
  return Array.isArray(rows) ? rows.map(normalizeClassregEvent) : [];
}

export function dateOf(d: number): Date {
  const s = String(d);
  return new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
}

/** WebUntis gives the time as HHMM, sometimes as minutes since midnight. */
export function entryTime(createTime: number): string {
  const minutes = createTime % 100 > 59 ? createTime : Math.floor(createTime / 100) * 60 + (createTime % 100);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export type EntryTone = 'blush' | 'butter' | 'periwinkle';

/** Misconduct in the danger tone, notes in butter, everything else periwinkle. */
export function categoryTone(category: string, reason = ''): EntryTone {
  const l = `${category} ${reason}`.toLowerCase();
  if (/täuschung|betrug|disziplin|discipl|verweis|richiamo|cheat/.test(l)) return 'blush';
  if (l.includes('vermerk') || l.includes('nota') || l.includes('note')) return 'butter';
  return 'periwinkle';
}

export const TONE_FILL: Record<EntryTone, string> = {
  blush: 'bg-blush text-blush-ink',
  butter: 'bg-butter text-butter-ink',
  periwinkle: 'bg-periwinkle text-periwinkle-ink',
};

export const TONE_BAR: Record<EntryTone, string> = {
  blush: 'bg-blush-ink',
  butter: 'bg-butter-ink',
  periwinkle: 'bg-periwinkle-ink',
};

/** One entry: a calendar tile, what was noted and by whom, the category. */
export function EntryRow({ ev, tag }: { ev: ClassregEvent; tag: string }) {
  const day = dateOf(ev.createDate);
  const tone = categoryTone(ev.categoryName, ev.eventReasonName);
  const body = ev.text || ev.eventReasonName;
  return (
    <li className="relative px-3 py-3.5 before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line first:before:hidden">
      <div className="flex items-start gap-3.5 md:gap-4">
        <span className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-[14px] leading-none ${TONE_FILL[tone]}`}>
          <span className="text-[18px] font-extrabold tracking-[-0.03em] tnum">{day.getDate()}</span>
          <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.04em] opacity-80">{formatDate(day, tag, { month: 'short' }).replace('.', '')}</span>
        </span>
        <div className="min-w-0 flex-1 md:flex md:items-start md:gap-6">
          <div className="min-w-0 md:flex-1">
            <p className="text-[15.5px] font-semibold leading-snug">{ev.subjectName || ev.elementName || ev.categoryName}</p>
            {body && <p className="mt-0.5 text-[14px] leading-snug text-ink-2 [overflow-wrap:anywhere]">{body}</p>}
            <p className="mt-1 text-[12.5px] text-ink-3 tnum">{[ev.creatorName, entryTime(ev.createTime)].filter(Boolean).join(' · ')}</p>
          </div>
          {(ev.categoryName || ev.eventReasonName) && (
            <span className={`mt-2.5 inline-flex max-w-full flex-col rounded-[12px] px-3 py-1.5 leading-tight md:mt-0 md:shrink-0 md:items-end md:text-right ${TONE_FILL[tone]}`}>
              {ev.categoryName && <span className="text-[11.5px] font-semibold opacity-75">{ev.categoryName}</span>}
              {ev.eventReasonName && ev.eventReasonName !== body && <span className="text-[13px] font-bold">{ev.eventReasonName}</span>}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
