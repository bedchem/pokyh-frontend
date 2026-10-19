'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SortAscending } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import ErrorView from '@/components/ui/ErrorView';
import { Page, PageHeader, Section, Segmented } from '@/components/app/Page';
import { Line, RowsSkeleton } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import PickMenu from '@/components/app/PickMenu';
import { fetchClassregEvents, getClassregEventsStale } from '@/lib/api';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { classPagesDict } from '@/lib/i18n/dictionaries/classPages';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import { formatDate } from '@/lib/i18n/dateLocale';
import { EntryRow, TONE_BAR, categoryTone, dateOf, parseClassregRows, type ClassregEvent } from '@/components/class/ClassregEntry';

// The class register (Klassenbuch): what teachers noted for the class in a
// school year. Four figures and how the entries split by category on top,
// then the entries by month — or by subject or category, when sorted so —
// each on a calendar tile in the tone of its category.

type FilterMode = 'all' | '1m' | '3m';
type SortMode = 'date-desc' | 'date-asc' | 'subject' | 'category';

const _now = new Date();
const CURRENT_SCHOOL_YEAR = _now.getMonth() >= 8 ? _now.getFullYear() : _now.getFullYear() - 1;
const AVAILABLE_YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_SCHOOL_YEAR - i);

function ClassregContent() {
  const router = useRouter();
  const t = useT(classPagesDict);
  const ts = useT(shellDict);
  const { tag } = useDateLocale();
  const [selectedYear, setSelectedYear] = useState(CURRENT_SCHOOL_YEAR);
  const [events, setEvents] = useState<ClassregEvent[]>(() => {
    const stale = getClassregEventsStale(CURRENT_SCHOOL_YEAR);
    return stale ? parseClassregRows(stale) : [];
  });
  const [loading, setLoading] = useState(() => !getClassregEventsStale(CURRENT_SCHOOL_YEAR));
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');

  const load = useCallback(async () => {
    const stale = getClassregEventsStale(selectedYear);
    if (stale) setEvents(parseClassregRows(stale));
    else setLoading(true);
    setError('');
    try {
      setEvents(parseClassregRows(await fetchClassregEvents(selectedYear)));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') router.replace('/login');
      else setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }, [router, selectedYear]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => {
    const subjects = new Set(events.map((e) => e.subjectName).filter(Boolean)).size;
    const latest = events.reduce((max, e) => (e.createDate > max ? e.createDate : max), 0);
    const counts = new Map<string, { n: number; tone: ReturnType<typeof categoryTone> }>();
    for (const e of events) {
      const name = e.categoryName || t('noCategory');
      counts.set(name, { n: (counts.get(name)?.n ?? 0) + 1, tone: categoryTone(e.categoryName, e.eventReasonName) });
    }
    const categories = [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
    const named = categories.filter(([name]) => name !== t('noCategory'));
    return { total: events.length, subjects, latest, categories, top: named[0]?.[0] ?? '' };
  }, [events, t]);

  const groups = useMemo(() => {
    let cutoff = 0;
    if (filter !== 'all') {
      const d = new Date();
      d.setMonth(d.getMonth() - (filter === '1m' ? 1 : 3));
      cutoff = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }
    const list = events.filter((e) => e.createDate >= cutoff);
    const byDate = (a: ClassregEvent, b: ClassregEvent) => b.createDate - a.createDate || b.createTime - a.createTime;
    list.sort(sortMode === 'date-asc' ? (a, b) => -byDate(a, b) : byDate);

    const keyOf = (e: ClassregEvent) => {
      if (sortMode === 'subject') return e.subjectName || '-';
      if (sortMode === 'category') return e.categoryName || t('noCategory');
      return String(Math.floor(e.createDate / 100));
    };
    const out = new Map<string, ClassregEvent[]>();
    for (const e of list) {
      const k = keyOf(e);
      if (!out.has(k)) out.set(k, []);
      out.get(k)!.push(e);
    }
    const entries = [...out.entries()];
    if (sortMode === 'subject' || sortMode === 'category') entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([key, items]) => ({
      key,
      title: sortMode === 'subject' || sortMode === 'category'
        ? key
        : formatDate(dateOf(items[0].createDate), tag, { month: 'long', year: 'numeric' }),
      items,
    }));
  }, [events, filter, sortMode, tag, t]);

  const yearLabel = `${selectedYear}/${selectedYear + 1}`;
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Page>
      <PageHeader
        title={ts('classregevents')}
        subtitle={
          !loading && !error
            ? `${stats.total === 1 ? t('entriesOne') : t('entriesMany', { n: stats.total })} · ${stats.subjects === 1 ? t('subjectsOne') : t('subjectsMany', { n: stats.subjects })}${stats.latest ? t('asOf', { date: formatDate(dateOf(stats.latest), tag, { day: 'numeric', month: 'long' }) }) : ''}`
            : t('schoolYear', { year: yearLabel })
        }
        actions={
          <PickMenu
            label={t('schoolYear', { year: '' }).trim()}
            value={selectedYear}
            onChange={setSelectedYear}
            options={AVAILABLE_YEARS.map((y) => ({ value: y, label: `${y}/${String(y + 1).slice(2)}` }))}
          />
        }
      />

      {loading ? (
        <div aria-hidden="true" className="flex flex-col gap-9 text-ink">
          <span className="squircle grid grid-cols-2 gap-5 rounded-[24px] bg-surface p-5 md:p-6 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="flex flex-col gap-2.5"><Line w={90} h={12} /><Line w={i === 3 ? 120 : 64} h={30} /></span>
            ))}
            <span className="col-span-2 lg:col-span-4"><Line w="100%" h={10} /></span>
          </span>
          <div className="flex flex-col gap-3"><Line w={140} h={20} /><RowsSkeleton rows={5} lead="square" trailing /></div>
        </div>
      ) : error ? (
        <div className="squircle rounded-[26px] bg-surface"><ErrorView message={error} onRetry={load} /></div>
      ) : events.length === 0 ? (
        <div className="squircle rounded-[26px] bg-surface"><PixelState sprite="empty" title={t('emptyTitle')} detail={t('emptySubtitle')} /></div>
      ) : (
        <div className="flex flex-col gap-9">
          {/* The year in four figures and the split by category */}
          <div className="rise squircle rounded-[24px] bg-surface p-5 md:p-6">
            <dl className={`grid grid-cols-2 gap-x-5 gap-y-6 ${stats.top ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              {[
                { label: t('totalEntries'), value: String(stats.total) },
                { label: t('subjects'), value: String(stats.subjects) },
                { label: t('lastEntry'), value: stats.latest ? formatDate(dateOf(stats.latest), tag, { day: 'numeric', month: 'short' }) : '-' },
                ...(stats.top ? [{ label: t('topCategory'), value: stats.top, small: true }] : []),
              ].map((f) => (
                <div key={f.label} className="min-w-0">
                  <dt className="text-[13.5px] font-semibold text-ink-2">{f.label}</dt>
                  <dd className={`mt-1.5 truncate font-extrabold tracking-[-0.04em] tnum ${f.small ? 'text-[22px] leading-[1.35] md:text-[24px]' : 'text-[34px] leading-none md:text-[40px]'}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
            {stats.categories.length > 1 && (
              <div className="mt-6">
                <span className="flex h-2.5 gap-[3px] overflow-hidden rounded-full" aria-hidden="true">
                  {stats.categories.map(([name, c]) => (
                    <span key={name} className={`rounded-full ${TONE_BAR[c.tone]}`} style={{ width: `${(c.n / stats.total) * 100}%` }} />
                  ))}
                </span>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-2">
                  {stats.categories.map(([name, c]) => (
                    <li key={name} className="flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${TONE_BAR[c.tone]}`} aria-hidden="true" />
                      {name}
                      <span className="font-bold text-ink tnum">{c.n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="-mx-1 max-w-full overflow-x-auto px-1 [scrollbar-width:none]">
                <Segmented<FilterMode>
                  label={t('entries')}
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'all', label: t('filterAll') },
                    { value: '1m', label: t('filter1m') },
                    { value: '3m', label: t('filter3m') },
                  ]}
                />
              </div>
              <PickMenu<SortMode>
                label={t('sortBy')}
                value={sortMode}
                onChange={setSortMode}
                icon={<SortAscending size={17} weight="bold" aria-hidden="true" />}
                options={[
                  { value: 'date-desc', label: t('sortDateDesc') },
                  { value: 'date-asc', label: t('sortDateAsc') },
                  { value: 'subject', label: t('sortSubject') },
                  { value: 'category', label: t('sortCategory') },
                ]}
              />
            </div>

            {shown === 0 ? (
              <div className="squircle rounded-[26px] bg-surface"><PixelState sprite="search" compact title={t('noEntriesRange')} /></div>
            ) : (
              groups.map((g) => (
                <Section
                  key={`${sortMode}-${g.key}`}
                  title={<span className="first-letter:uppercase">{g.title}</span>}
                  action={<span className="text-[14px] font-semibold text-ink-2 tnum">{g.items.length}</span>}
                  className="rise"
                >
                  <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">
                    {g.items.map((ev, i) => <EntryRow key={`${ev.id}-${i}`} ev={ev} tag={tag} />)}
                  </ul>
                </Section>
              ))
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

export default function ClassregEventsPage() {
  return (
    <AuthGuard>
      <UntisGuard>
        <ClassregContent />
      </UntisGuard>
    </AuthGuard>
  );
}
