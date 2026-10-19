'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChartBar, Key, MagnifyingGlass, Moon, PencilSimple, Translate, UserMinus, X } from '@phosphor-icons/react';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { useApp } from '@/providers/AppProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { shellDict, type ShellKey } from '@/lib/i18n/dictionaries/shell';
import { DEST, TONE_CLASS, type AppDestination, type AppTone } from './nav';
import { useAppActions } from './actions';
import { useMensaAvailable } from './hooks';
import { loadSearchContent, searchSourceCount, type ContentDoc } from './searchContent';
import PixelState from './PixelState';

// The search behind the top bar ("/", or Ctrl/⌘ K), in two parts: "Seiten" — the
// places and actions of the app — and "Inhalte" — what is on those pages
// (class duties, class register entries, homework, grades, lessons, messages,
// reminders, to-dos, dishes), each row naming the page it comes from.
// Everything is matched on the device, word by word and without accents.

interface PageItem {
  id: string;
  title: string;
  icon: ReactNode;
  keywords: string;
  run: () => void;
}

interface Row {
  id: string;
  section: 'pages' | 'content';
  title: string;
  subtitle?: string;
  icon: ReactNode;
  tag?: string;
  run: () => void;
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function score(title: string, rest: string, words: string[]): number {
  const t = fold(title);
  const r = fold(rest);
  let total = 0;
  for (const w of words) {
    if (t.startsWith(w)) total += 4;
    else if (t.includes(` ${w}`) || t.includes(`-${w}`)) total += 3;
    else if (t.includes(w)) total += 2;
    else if (r.includes(w)) total += 1;
    else return 0;
  }
  return total;
}

/** Where a content source lives, for its icon tone. */
const SOURCE_TONE: Partial<Record<ShellKey, AppTone>> = {
  srcClassService: 'sage',
  srcClassreg: 'butter',
  srcHomework: 'sage',
  srcExam: 'butter',
  srcReminder: 'blush',
  srcTodo: 'sage',
  srcSubject: 'periwinkle',
  srcGrade: 'periwinkle',
  srcLesson: 'periwinkle',
  srcMessage: 'periwinkle',
  srcDish: 'butter',
};

const SOURCE_DEST: Partial<Record<ShellKey, AppDestination>> = {
  srcClassService: DEST.class,
  srcClassreg: DEST.classregevents,
  srcHomework: DEST.class,
  srcExam: DEST.timetable,
  srcReminder: DEST.reminders,
  srcTodo: DEST.todos,
  srcSubject: DEST.grades,
  srcGrade: DEST.grades,
  srcLesson: DEST.timetable,
  srcMessage: DEST.messages,
  srcDish: DEST.mensa,
};

function ToneIcon({ tone, children }: { tone: AppTone | 'neutral'; children: ReactNode }) {
  return (
    <span className={`grid size-full place-items-center rounded-[11px] ${tone === 'neutral' ? 'bg-inset text-ink' : TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

export default function SearchPalette({ open, onClose: close }: { open: boolean; onClose: () => void }) {
  const t = useT(shellDict);
  const router = useRouter();
  const localize = useLocalizeHref();
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const { user } = useSession();
  const { classId } = useApp();
  const { resolved, setTheme } = useTheme();
  const { openCompose, openReport } = useAppActions();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [content, setContent] = useState<Record<string, ContentDoc[]>>({});
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
  const untis = user?.isUntisUser !== false;
  const mensa = useMensaAvailable() !== false;

  const onClose = useCallback(() => {
    setQuery('');
    setActive(0);
    close();
  }, [close]);

  const go = useCallback((href: string) => {
    onClose();
    router.push(localize(href));
  }, [onClose, router, localize]);

  useEffect(() => {
    if (!open || !user) return;
    loadSearchContent(
      { username: user.username, classId, untis, locale, tag },
      (source, docs) => setContent((prev) => (prev[source] === docs ? prev : { ...prev, [source]: docs })),
    );
  }, [open, user, classId, untis, locale, tag]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const id = requestAnimationFrame(() => input.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  const pages = useMemo<PageItem[]>(() => {
    const out: PageItem[] = [];
    const page = (d: AppDestination, keywords: string) => {
      if (d.untis && !untis) return;
      const { Icon } = d;
      out.push({ id: `page:${d.href}`, title: t(d.key), keywords, icon: <ToneIcon tone={d.tone}><Icon size={18} weight="bold" /></ToneIcon>, run: () => go(d.href) });
    };
    page(DEST.home, 'dashboard start übersicht panoramica');
    page(DEST.timetable, 'plan stunden lessons orario');
    page(DEST.grades, 'voti marks durchschnitt media');
    page(DEST.messages, 'mail post inbox messaggi');
    if (mensa) page(DEST.mensa, 'essen menu speiseplan cafeteria');
    page(DEST.absences, 'fehlstunden assenze');
    page(DEST.classregevents, 'klassenbuch registro einträge vermerk');
    page(DEST.todos, 'aufgaben tasks');
    page(DEST.reminders, 'termine promemoria');
    page(DEST.class, 'mitschüler classe klassendienste dienste hausaufgaben');
    page(DEST.school, 'hub übersicht');
    page(DEST.profile, 'konto account');
    out.push({ id: 'page:/profile/stats', title: t('profileStats'), keywords: 'aktivität activity online tage anmeldungen', icon: <ToneIcon tone="periwinkle"><ChartBar size={18} weight="bold" /></ToneIcon>, run: () => go('/profile/stats') });
    page(DEST.settings, 'einstellungen impostazioni darstellung theme');

    const action = (id: string, title: string, icon: ReactNode, run: () => void, keywords: string) =>
      out.push({ id, title, icon: <ToneIcon tone="neutral">{icon}</ToneIcon>, run, keywords });
    if (untis) action('act:compose', t('actionCompose'), <PencilSimple size={18} weight="bold" />, () => { onClose(); openCompose(); }, 'nachricht schreiben senden lehrer');
    if (openReport) action('act:report', t('actionReport'), <UserMinus size={18} weight="bold" />, () => { onClose(); openReport(); }, 'krank fehlen abwesend');
    action('act:theme', t('actionTheme'), <Moon size={18} weight="bold" />, () => { onClose(); setTheme(resolved === 'dark' ? 'light' : 'dark'); }, 'dark mode dunkel hell theme farbe');
    if (untis) action('act:password', t('actionPassword'), <Key size={18} weight="bold" />, () => go('/settings?open=password'), 'passwort password reset vergessen');
    action('act:language', t('actionLanguage'), <Translate size={18} weight="bold" />, () => go('/settings#appearance'), 'sprache lingua deutsch italiano english');
    return out;
  }, [untis, mensa, t, go, onClose, openCompose, openReport, setTheme, resolved]);

  const words = useMemo(() => fold(query).split(/\s+/).filter(Boolean), [query]);
  const loadedSources = Object.keys(content).length;

  const rows = useMemo<Row[]>(() => {
    if (words.length === 0) {
      return pages.map((p) => ({ id: p.id, section: 'pages', title: p.title, icon: p.icon, run: p.run }));
    }
    const pageRows = pages
      .map((p) => ({ p, s: score(p.title, p.keywords, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map<Row>(({ p }) => ({ id: p.id, section: 'pages', title: p.title, icon: p.icon, run: p.run }));

    const contentRows = Object.values(content)
      .flat()
      .map((d) => ({ d, s: score(d.title, `${d.subtitle ?? ''} ${d.keywords ?? ''} ${t(d.source)}`, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map<Row>(({ d }) => {
        const dest = SOURCE_DEST[d.source];
        const Icon = dest?.Icon;
        return {
          id: d.id,
          section: 'content',
          title: d.title,
          subtitle: d.subtitle,
          tag: t(d.source),
          icon: <ToneIcon tone={SOURCE_TONE[d.source] ?? 'neutral'}>{Icon && <Icon size={18} weight="bold" />}</ToneIcon>,
          run: () => go(d.href),
        };
      });

    return [...pageRows, ...contentRows];
  }, [words, pages, content, t, go]);

  const activeIndex = Math.min(active, Math.max(0, rows.length - 1));

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(rows.length - 1, activeIndex + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, activeIndex - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); rows[activeIndex]?.run(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }

  if (typeof document === 'undefined') return null;

  const pageRows = rows.filter((r) => r.section === 'pages');
  const contentRows = rows.filter((r) => r.section === 'content');
  const stillLoading = words.length > 0 && !!user && loadedSources < searchSourceCount({ untis, classId, username: user.username });

  const renderRow = (row: Row, i: number) => {
    const selected = i === activeIndex;
    return (
      <button
        key={row.id}
        type="button"
        id={`${listId}-${i}`}
        data-index={i}
        role="option"
        aria-selected={selected}
        onMouseMove={() => { if (!selected) setActive(i); }}
        onClick={() => row.run()}
        className="relative flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left"
      >
        {selected && (
          <motion.span
            layoutId="search-active"
            className="absolute inset-0 rounded-[14px] bg-inset"
            transition={{ type: 'spring', stiffness: 700, damping: 45 }}
            aria-hidden="true"
          />
        )}
        <span className="relative size-9 shrink-0" aria-hidden="true">{row.icon}</span>
        <span className="relative min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{row.title}</span>
          {row.subtitle && <span className="block truncate text-[13px] text-ink-2">{row.subtitle}</span>}
        </span>
        {row.tag && (
          <span className="relative shrink-0 rounded-full bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] px-2.5 py-1 text-[12px] font-semibold text-ink-2">
            {row.tag}
          </span>
        )}
      </button>
    );
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center sm:px-6 sm:pt-[10vh]" onKeyDown={onKey}>
          <motion.div
            className="absolute inset-0 bg-[#0b0b0d]/40"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('search')}
            className="relative flex h-full w-full flex-col overflow-hidden bg-surface text-ink shadow-[var(--shadow-float)] sm:h-auto sm:max-h-[min(680px,80vh)] sm:max-w-[680px] sm:rounded-[26px]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 480, damping: 36, mass: 0.8 }}
          >
            <div className="flex items-center gap-3 px-5 pb-2 pt-[max(14px,var(--safe-top))] sm:pt-3.5">
              <MagnifyingGlass size={21} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
              <input
                ref={input}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                placeholder={t('searchPlaceholder')}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={rows[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                aria-describedby={`${listId}-hint`}
                className="h-12 min-w-0 flex-1 bg-transparent text-[17px] font-medium outline-none placeholder:text-ink-3"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="go"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label={t('searchClose')}
                className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-inset hover:text-ink"
              >
                <X size={19} weight="bold" />
              </button>
            </div>
            <span id={`${listId}-hint`} className="visually-hidden">{t('searchNav')}</span>
            <div ref={list} id={listId} role="listbox" aria-label={t('search')} className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(16px,var(--safe-bottom))]">
              {words.length === 0 && <p className="px-3 pb-1 pt-2 text-[14px] text-ink-2">{t('searchEmpty')}</p>}

              {pageRows.length > 0 && (
                <div role="group" aria-label={t('groupPages')}>
                  <p className="flex items-center justify-between px-3 pb-1.5 pt-4 text-[13px] font-bold text-ink-3">{t('groupPages')}</p>
                  {pageRows.map((row) => renderRow(row, rows.indexOf(row)))}
                </div>
              )}

              {words.length > 0 && (
                <div role="group" aria-label={t('groupContent')}>
                  <p className="flex items-center justify-between gap-3 px-3 pb-1.5 pt-5 text-[13px] font-bold text-ink-3">
                    {t('groupContent')}
                    {stillLoading && <span className="font-medium">{t('searchingContent')}</span>}
                  </p>
                  {contentRows.map((row) => renderRow(row, rows.indexOf(row)))}
                  {contentRows.length === 0 && !stillLoading && pageRows.length === 0 && (
                    <PixelState compact sprite="search" title={t('noResults', { q: query })} />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
