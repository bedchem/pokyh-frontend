'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Bell as BellIcon, BellRinging, CheckSquare, EnvelopeSimple, Fire, Trash, X } from '@phosphor-icons/react';
import { useDateLocale, useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { bellDict, type BellKey } from '@/lib/i18n/dictionaries/bell';
import { uiDict, type UiKey } from '@/lib/i18n/dictionaries/ui';
import { messagesDict } from '@/lib/i18n/dictionaries/messages';
import { formatDate, formatTime } from '@/lib/i18n/dateLocale';
import type { BellItem } from '@/lib/bell-feed';
import { formatGrade, gradeTone } from '@/components/dashboard/widgets';
import { PixelSpriteArt } from './PixelState';
import { Line } from './Skeleton';
import { TONE_CLASS } from './nav';
import { useBell, type StreakView } from './useBell';
import s from './shell.module.css';

// The bell beside the messages in the top bar, as on YouTube: a count of what
// is new since the bell was last opened (a short ring when it goes up), and a
// panel with the streak on top, then what is due soon, then what happened
// lately (lib/bell-feed.ts). Opening it counts everything as seen; what was
// new keeps its dot while the panel stays open. Each item can be cleared away
// (its ×), or all of them at once; they slide out and the list closes up.
// Closes on a choice, a click elsewhere, Escape or leaving it with Tab.

const DAY = 86_400_000;
/** How long a cleared row takes to leave (shell.module.css .bellItem). */
const LEAVE_MS = 320;

type TBell = (key: BellKey, vars?: Record<string, string | number>) => string;
type TUi = (key: UiKey, vars?: Record<string, string | number>) => string;

function midnight(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "vor 5 Min.", "in 2 Std.", "morgen 08:00", "Gestern", "12. Okt." */
function when(item: BellItem, now: number, t: TBell, tu: TUi, tag: string): string {
  const days = Math.round((midnight(now) - midnight(item.at)) / DAY); // > 0: past
  const date = () => formatDate(new Date(item.at), tag, { day: 'numeric', month: 'short' });
  if (item.allDay) {
    if (days <= 0) return t('today');
    if (days === 1) return t('yesterday');
    return days < 7 ? tu('daysAgo', { n: days }) : date();
  }
  const time = formatTime(new Date(item.at), tag, { hour: '2-digit', minute: '2-digit' });
  const ahead = item.at - now;
  if (ahead > 0) {
    if (ahead < 3_600_000) return t('inMinutes', { n: Math.max(1, Math.round(ahead / 60_000)) });
    if (days === 0) return item.kind === 'todo' ? t('todayAt', { time }) : t('inHours', { n: Math.round(ahead / 3_600_000) });
    return days === -1 ? t('tomorrowAt', { time }) : `${date()} ${time}`;
  }
  const min = Math.floor(-ahead / 60_000);
  if (item.kind === 'todo') return days === 0 ? t('todayAt', { time }) : days === 1 ? t('yesterdayAt', { time }) : date();
  if (min < 1) return tu('justNow');
  if (min < 60) return tu('minutesAgo', { n: min });
  if (days === 0) return tu('hoursAgo', { n: Math.floor(min / 60) });
  if (days === 1) return t('yesterdayAt', { time });
  return days < 7 ? tu('daysAgo', { n: days }) : date();
}

export default function Bell() {
  const t = useT(bellDict);
  const path = useRoutePath();
  const bell = useBell();
  const [open, setOpen] = useState(false);
  // What was new when the panel opened: it keeps its dot while it is open.
  const [shown, setShown] = useState<ReadonlySet<string>>(() => new Set());
  // Cleared rows on their way out, and whether it was all of them.
  const [leaving, setLeaving] = useState<{ keys: ReadonlySet<string>; all: boolean }>(() => ({ keys: new Set(), all: false }));
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  // The bell rings once whenever the count goes up.
  const [count, setCount] = useState(bell.newCount);
  const [ring, setRing] = useState(0);
  if (count !== bell.newCount) {
    setCount(bell.newCount);
    if (bell.newCount > count) setRing((r) => r + 1);
  }

  // A new page closes it.
  const [shownFor, setShownFor] = useState(path);
  if (shownFor !== path) {
    setShownFor(path);
    setOpen(false);
  }

  const { seeAll, clear } = bell;
  const close = (focusButton = false) => {
    setOpen(false);
    seeAll();
    if (focusButton) button.current?.focus();
  };

  const toggle = () => {
    if (open) { close(); return; }
    setShown(bell.fresh);
    setOpen(true);
    bell.refresh();
    seeAll();
  };

  // The rows slide out first, then leave the feed; focus stays in the panel
  // (the × that was pressed goes with its row).
  const clearAway = (keys: string[], all = false) => {
    if (keys.length === 0) return;
    setLeaving((l) => ({ keys: new Set([...l.keys, ...keys]), all }));
    panel.current?.focus({ preventScroll: true });
    window.setTimeout(() => {
      clear(keys);
      setLeaving((l) => ({ keys: new Set([...l.keys].filter((k) => !keys.includes(k))), all: false }));
    }, LEAVE_MS);
  };

  // Seen again on the way out, for whatever arrived while it was open.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) seeAll();
    wasOpen.current = open;
  }, [open, seeAll]);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus({ preventScroll: true });
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const n = bell.newCount;
  const isNew = (key: string) => shown.has(key) || bell.fresh.has(key);
  const items = [...bell.feed.current, ...bell.feed.recent];
  const staying = items.filter((i) => !leaving.keys.has(i.key));
  const newShown = staying.filter((i) => isNew(i.key)).length;
  const empty = !bell.loading && items.length === 0;
  const row = (item: BellItem) => (
    <Row
      key={item.key}
      item={item}
      now={bell.now}
      fresh={isNew(item.key)}
      leaving={leaving.keys.has(item.key) ? (leaving.all ? 'all' : 'one') : undefined}
      onPick={() => close()}
      onClear={() => clearAway([item.key])}
    />
  );

  return (
    <div
      ref={root}
      className="relative shrink-0"
      onBlur={(e) => { if (open && e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
    >
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={n > 0 ? t('labelNew', { n }) : t('title')}
        className={`${s.iconBtn} ${open ? s.iconBtnOn : ''}`}
      >
        <span key={ring} className={ring > 0 ? s.ring : undefined} aria-hidden="true">
          <BellIcon size={20} weight={open ? 'fill' : 'bold'} />
        </span>
        {n > 0 && (
          <span key={`n${ring}`} className={`${s.pop} absolute -right-0.5 -top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent shadow-[0_0_0_2px_var(--canvas)]`}>
            {n > 9 ? '9+' : n}
          </span>
        )}
      </button>

      {open && (
        <div ref={panel} id={id} role="dialog" aria-label={t('title')} tabIndex={-1} className={`${s.bellPanel} lang-menu`}>
          <div className="flex min-h-[46px] flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-1 pl-4 pr-2 pt-2.5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[16.5px] font-bold tracking-[-0.015em]">{t('title')}</h2>
              {newShown > 0 && <span className="text-[13px] font-semibold text-accent-ink tnum">{t('newCount', { n: newShown })}</span>}
            </div>
            {staying.length > 0 && (
              <button
                type="button"
                onClick={() => clearAway(staying.map((i) => i.key), true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-inset hover:text-ink"
              >
                <Trash size={15} weight="bold" className="text-danger-ink" aria-hidden="true" />
                {t('clearAll')}
              </button>
            )}
          </div>

          <div className={s.bellScroll}>
            <Streak streak={bell.streak} />

            {bell.loading ? (
              <div className="flex flex-col gap-4 px-3 py-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="size-10 shrink-0 rounded-[12px] bg-inset" />
                    <span className="flex flex-1 flex-col gap-2"><Line w="70%" h={12} /><Line w="40%" h={10} /></span>
                  </div>
                ))}
              </div>
            ) : empty ? (
              <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
                <PixelSpriteArt sprite="bell" width="148px" />
                <p className="mt-2 text-[15px] font-bold">{t('emptyTitle')}</p>
                <p className="mt-1 max-w-[30ch] text-[13.5px] leading-snug text-ink-2">{t('emptyText')}</p>
              </div>
            ) : (
              <>
                {bell.feed.current.length > 0 && (
                  <ul className="flex flex-col p-1.5">{bell.feed.current.map(row)}</ul>
                )}
                {bell.feed.current.length > 0 && bell.feed.recent.length > 0 && <div className={s.menuRule} />}
                {bell.feed.recent.length > 0 && (
                  <ul className="flex flex-col p-1.5">{bell.feed.recent.map(row)}</ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** The streak on top: how many days in a row, the longest, and the last week as squares. */
function Streak({ streak }: { streak: StreakView | null | undefined }) {
  const t = useT(bellDict);
  const { tag } = useDateLocale();
  if (!streak) return null;
  const today = streak.week[streak.week.length - 1];
  const title = streak.days === 0 ? t('streakNone') : streak.days === 1 ? t('streakOne') : t('streakDays', { n: streak.days });
  const sub = today && !today.active && streak.days > 0 ? t('streakKeep') : t('streakLongest', { n: Math.max(streak.longest, streak.days) });

  return (
    <div className="mx-1.5 mb-1 mt-2 flex items-center gap-3 rounded-[16px] bg-inset px-3 py-3">
      <span className={`${s.flame} grid size-11 shrink-0 place-items-center rounded-[13px] ${TONE_CLASS.butter}`} data-lit={streak.days > 0} aria-hidden="true">
        <Fire size={23} weight="fill" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[15px] font-bold tnum">{title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] font-medium text-ink-2">{sub}</span>
      </span>
      <span className="flex shrink-0 gap-[3px]" aria-hidden="true">
        {streak.week.map((d, i) => (
          <span
            key={d.date}
            title={new Date(`${d.date}T12:00`).toLocaleDateString(tag, { weekday: 'short', day: 'numeric', month: 'short' })}
            className={`${s.weekDay} ${d.active ? 'bg-accent' : 'bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]'} ${i === streak.week.length - 1 ? s.weekToday : ''}`}
            style={{ animationDelay: `${i * 35}ms` }}
          />
        ))}
      </span>
      {today?.active && <span className="visually-hidden">, {t('streakToday')}</span>}
    </div>
  );
}

interface RowProps {
  item: BellItem;
  now: number;
  fresh: boolean;
  /** Cleared, on its way out: by itself or with all the others. */
  leaving?: 'one' | 'all';
  onPick: () => void;
  onClear: () => void;
}

function Row({ item, now, fresh, leaving, onPick, onClear }: RowProps) {
  const t = useT(bellDict);
  const tu = useT(uiDict);
  const tm = useT(messagesDict);
  const localize = useLocalizeHref();
  const { tag } = useDateLocale();
  const at = when(item, now, t, tu, tag);

  let tile: React.ReactNode;
  let title = item.title;
  let sub: string[] = [];
  switch (item.kind) {
    case 'grade':
      tile = <span className={`${s.bellTile} text-[15px] font-extrabold tnum ${gradeTone(item.value ?? 0)}`}>{formatGrade(item.value ?? 0)}</span>;
      title = t('gradeNew', { subject: item.title });
      sub = [item.sub, at];
      break;
    case 'message':
      tile = <span className={`${s.bellTile} ${TONE_CLASS.periwinkle}`}><EnvelopeSimple size={19} weight="bold" /></span>;
      title = item.title || tm('noSubject');
      sub = [item.sub, at];
      break;
    case 'reminder':
      tile = <span className={`${s.bellTile} ${TONE_CLASS.blush}`}><BellRinging size={19} weight="bold" /></span>;
      sub = [t('reminderBy', { name: item.sub }), at];
      break;
    case 'reminderSoon':
      tile = <span className={`${s.bellTile} ${TONE_CLASS.blush}`}><BellRinging size={19} weight="fill" /></span>;
      sub = [`${t('reminderSoon')} ${at}`, item.sub];
      break;
    case 'todo':
      tile = <span className={`${s.bellTile} ${TONE_CLASS.sage}`}><CheckSquare size={19} weight="bold" /></span>;
      sub = [item.overdue ? `${t('todoOverdue')} · ${at}` : `${t('todoDue')} ${at}`];
      break;
    case 'streak':
      tile = <span className={`${s.bellTile} ${TONE_CLASS.butter}`}><Fire size={19} weight="fill" /></span>;
      title = t('milestone', { n: item.value ?? 0 });
      sub = [t('milestoneSub'), at];
      break;
    case 'streakLost':
      // The flame gone out.
      tile = <span className={`${s.bellTile} bg-inset text-ink-3`}><Fire size={19} weight="bold" /></span>;
      title = t('streakLost', { n: item.value ?? 0 });
      sub = [t('streakLostSub'), at];
      break;
  }

  return (
    <li className={s.bellItem} data-leaving={leaving}>
      <div className="group relative py-px">
        <Link
          href={localize(item.href)}
          onClick={onPick}
          className={`${s.bellRow} flex items-center gap-3 rounded-[14px] py-2 pl-2.5 pr-11 outline-none transition-colors hover:bg-inset focus-visible:bg-inset`}
          data-fresh={fresh || undefined}
        >
          <span aria-hidden="true" className="shrink-0">{tile}</span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className={`block truncate text-[14.5px] ${fresh ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{title}</span>
            <span className={`mt-0.5 block truncate text-[12.5px] font-medium ${item.overdue ? 'text-danger-ink' : 'text-ink-2'}`}>
              {sub.filter(Boolean).join(' · ')}
            </span>
          </span>
          {fresh && (
            <>
              <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span className="visually-hidden">, {t('isNew')}</span>
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clearOne', { title })}
          title={t('clear')}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 transition-[background-color,color] hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-ink"
        >
          <X size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
