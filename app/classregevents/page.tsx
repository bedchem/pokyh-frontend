'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchClassregEvents } from '@/lib/api';

type ClassregEvent = {
  id: number;
  elementName: string;
  subjectName: string;
  creatorName: string;
  createDate: number;
  createTime: number;
  eventReasonName: string;
  categoryName: string;
  text: string;
  elemType: string;
};

type FilterMode = 'all' | '1m' | '3m';
type SortMode = 'date-desc' | 'date-asc' | 'subject' | 'category';

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function parseCreateDate(d: number): Date {
  const s = String(d);
  const year = parseInt(s.slice(0, 4));
  const month = parseInt(s.slice(4, 6)) - 1;
  const day = parseInt(s.slice(6, 8));
  return new Date(year, month, day);
}

function fmtDateShort(d: number): string {
  const dt = parseCreateDate(d);
  return `${dt.getDate()}. ${MONTH_SHORT[dt.getMonth()]}`;
}

function fmtDateLong(d: number): string {
  const dt = parseCreateDate(d);
  return `${dt.getDate()}. ${MONTH_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fmtTime(createTime: number): string {
  let minutes: number;
  if (createTime % 100 > 59) {
    minutes = createTime;
  } else {
    minutes = Math.floor(createTime / 100) * 60 + (createTime % 100);
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function categoryColor(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('täuschung') || lower.includes('betrug')) return 'var(--danger)';
  if (lower.includes('vermerk')) return 'var(--warning)';
  return 'var(--accent)';
}

function categoryBg(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('täuschung') || lower.includes('betrug'))
    return 'color-mix(in srgb, var(--danger) 14%, transparent)';
  if (lower.includes('vermerk'))
    return 'color-mix(in srgb, var(--warning) 14%, transparent)';
  return 'color-mix(in srgb, var(--accent) 14%, transparent)';
}

function parseRows(raw: unknown): ClassregEvent[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  const data = r.data as Record<string, unknown> | undefined;
  if (!data) return [];
  const rows = data.rows as ClassregEvent[] | undefined;
  return Array.isArray(rows) ? rows : [];
}

export default function ClassregEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ClassregEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'date-desc', label: 'Datum ↓' },
    { value: 'date-asc', label: 'Datum ↑' },
    { value: 'subject', label: 'Fach' },
    { value: 'category', label: 'Kategorie' },
  ];

  const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: '1m', label: 'Letzter Monat' },
    { value: '3m', label: 'Letzte 3 Monate' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchClassregEvents();
      setEvents(parseRows(res));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        router.replace('/login');
      } else {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const now = new Date();
  const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const schoolYearLabel = `${schoolYear} / ${schoolYear + 1}`;

  const stats = useMemo(() => {
    const total = events.length;
    const subjects = new Set(events.map((e) => e.subjectName)).size;
    const latest = events.reduce((max, e) => (e.createDate > max ? e.createDate : max), 0);
    const catCount: Record<string, number> = {};
    events.forEach((e) => {
      catCount[e.categoryName] = (catCount[e.categoryName] ?? 0) + 1;
    });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { total, subjects, latest, topCat };
  }, [events]);

  const cutoffDate = useMemo(() => {
    if (filter === 'all') return 0;
    const d = new Date();
    if (filter === '1m') d.setMonth(d.getMonth() - 1);
    else d.setMonth(d.getMonth() - 3);
    return (
      d.getFullYear() * 10000 +
      (d.getMonth() + 1) * 100 +
      d.getDate()
    );
  }, [filter]);

  const displayed = useMemo(() => {
    let list = filter === 'all' ? events : events.filter((e) => e.createDate >= cutoffDate);
    list = [...list];
    if (sortMode === 'date-desc') list.sort((a, b) => b.createDate - a.createDate || b.createTime - a.createTime);
    else if (sortMode === 'date-asc') list.sort((a, b) => a.createDate - b.createDate || a.createTime - b.createTime);
    else if (sortMode === 'subject') list.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    else if (sortMode === 'category') list.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    return list;
  }, [events, filter, sortMode, cutoffDate]);

  return (
    <AuthGuard>
      <UntisGuard>
        <div className="cr-wrap">
          {loading ? (
            <div className="cr-state">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <div className="cr-state">
              <ErrorView message={error} onRetry={load} />
            </div>
          ) : events.length === 0 ? (
            <div className="cr-state">
              <EmptyView
                icon={<BookOpen size={56} color="var(--app-text-tertiary)" />}
                title="Keine Einträge"
                subtitle="Es wurden noch keine Klassenbucheinträge erfasst."
              />
            </div>
          ) : (
            <main className="cr-dashboard">
              <div className="page-head">
                <div>
                  <h1 className="page-title">Schuljahr {schoolYearLabel}</h1>
                  <div className="page-sub">
                    {stats.total} Einträge · {stats.subjects} Fächer
                    {stats.latest ? ` · Stand ${fmtDateLong(stats.latest)}` : ''}
                  </div>
                </div>
              </div>

              <section className="kpis">
                <div className="card">
                  <div className="card-hd">
                    <div>
                      <div className="card-title">Total Einträge</div>
                      <div className="card-sub">Schuljahr gesamt</div>
                    </div>
                  </div>
                  <div className="kpi-value">{stats.total}</div>
                </div>

                <div className="card">
                  <div className="card-hd">
                    <div>
                      <div className="card-title">Fächer</div>
                      <div className="card-sub">Betroffene Fächer</div>
                    </div>
                  </div>
                  <div className="kpi-value">{stats.subjects}</div>
                </div>

                <div className="card">
                  <div className="card-hd">
                    <div>
                      <div className="card-title">Letzte Eintragung</div>
                      <div className="card-sub">Neuester Eintrag</div>
                    </div>
                  </div>
                  <div className="kpi-value kpi-date">{stats.latest ? fmtDateLong(stats.latest) : '—'}</div>
                </div>

                <div className="card">
                  <div className="card-hd">
                    <div>
                      <div className="card-title">Häufigste Kategorie</div>
                      <div className="card-sub">Nach Anzahl</div>
                    </div>
                  </div>
                  <div className="kpi-value kpi-cat">{stats.topCat}</div>
                </div>
              </section>

              <section className="timeline-wrap">
                <div className="timeline-head">
                  <div className="timeline-head-title">Einträge</div>
                  <div className="controls-wrap">
                    <div className="filter-chips">
                      {FILTER_OPTIONS.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          className={`chip ${filter === f.value ? 'chip-active' : ''}`}
                          onClick={() => setFilter(f.value)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="custom-select-container" ref={sortRef}>
                      <button
                        className={`sort-select ${isSortOpen ? 'open' : ''}`}
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isSortOpen}
                      >
                        {SORT_OPTIONS.find((o) => o.value === sortMode)?.label}
                        <ChevronDown
                          size={14}
                          className="sort-arrow"
                          style={{
                            transform: isSortOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}
                        />
                      </button>
                      {isSortOpen && (
                        <ul className="custom-select-dropdown fade-in" role="listbox">
                          {SORT_OPTIONS.map((opt) => (
                            <li
                              key={opt.value}
                              role="option"
                              aria-selected={sortMode === opt.value}
                              className={`custom-select-item ${sortMode === opt.value ? 'selected' : ''}`}
                              onClick={() => {
                                setSortMode(opt.value);
                                setIsSortOpen(false);
                              }}
                            >
                              {opt.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="timeline-list">
                  {displayed.length === 0 ? (
                    <div className="timeline-empty">Keine Einträge im gewählten Zeitraum</div>
                  ) : (
                    displayed.map((ev, idx) => (
                      <article key={`${ev.id}-${idx}`} className="timeline-item">
                        <div className="entry-row">
                          <div className="date-col">
                            <span className="date-day">{parseCreateDate(ev.createDate).getDate()}.</span>
                            <span className="date-month">{MONTH_SHORT[parseCreateDate(ev.createDate).getMonth()]}</span>
                          </div>
                          <div className="content-col">
                            <span className="entry-subject">{ev.subjectName}</span>
                            <span className="entry-text">{ev.text || ev.eventReasonName}</span>
                            <span className="entry-meta">
                              {ev.creatorName} · {fmtTime(ev.createTime)}
                            </span>
                          </div>
                          <div className="badge-col">
                            <span
                              className="category-badge"
                              style={{
                                color: categoryColor(ev.categoryName),
                                background: categoryBg(ev.categoryName),
                              }}
                            >
                              {ev.categoryName}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </main>
          )}
        </div>

        <style jsx>{`
          .cr-wrap {
            --g-bg: var(--app-bg);
            --g-surface: var(--app-surface);
            --g-line: var(--app-border);
            --g-line-2: color-mix(in srgb, var(--app-border) 70%, var(--app-text-tertiary));
            --g-ink: var(--app-text-primary);
            --g-ink-2: color-mix(in srgb, var(--app-text-primary) 86%, var(--app-text-secondary));
            --g-muted: var(--app-text-secondary);
            --g-muted-2: var(--app-text-tertiary);

            height: 100%;
            overflow: auto;
            background: var(--g-bg);
            color: var(--g-ink);
            font-feature-settings: 'ss01', 'cv11';
            text-rendering: optimizeLegibility;
            letter-spacing: -0.005em;
          }

          .cr-state {
            min-height: 100%;
            display: grid;
            place-items: center;
            padding: 24px;
          }

          .cr-dashboard {
            max-width: 1320px;
            margin: 0 auto;
            padding: 36px 28px 80px;
            font-family: var(--font-inter, 'Inter'), -apple-system, BlinkMacSystemFont, sans-serif;
          }

          .page-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 32px;
            margin-bottom: 28px;
          }

          .page-title {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
          }

          .page-sub {
            color: var(--g-muted);
            font-size: 13.5px;
            margin-top: 6px;
          }

          .kpis {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            margin-bottom: 32px;
          }

          .card {
            background: var(--g-surface);
            border: 1px solid var(--g-line);
            border-radius: 20px;
            padding: 22px 22px 20px;
            position: relative;
            transition: border-color 0.2s;
          }

          .card:hover {
            border-color: var(--g-line-2);
          }

          .card-hd {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
          }

          .card-title {
            font-size: 12.5px;
            color: var(--g-muted);
            font-weight: 600;
            letter-spacing: 0;
          }

          .card-sub {
            font-size: 11.5px;
            color: var(--g-muted-2);
            letter-spacing: 0;
          }

          .kpi-value {
            font-variant-numeric: tabular-nums;
            font-size: 44px;
            font-weight: 600;
            line-height: 1;
            letter-spacing: -0.04em;
            color: var(--g-ink);
          }

          .kpi-date {
            font-size: 22px;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .kpi-cat {
            font-size: 20px;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .timeline-wrap {
            background: var(--g-surface);
            border: 1px solid var(--g-line);
            border-radius: 12px;
            overflow: hidden;
          }

          .timeline-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 18px;
            border-bottom: 1px solid var(--g-line);
            gap: 12px;
            flex-wrap: wrap;
          }

          .timeline-head-title {
            font-size: 14.5px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: var(--g-ink);
          }

          .controls-wrap {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .filter-chips {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .chip {
            border: 1px solid var(--g-line);
            background: var(--g-bg);
            color: var(--g-muted);
            padding: 5px 10px;
            font-family: inherit;
            font-size: 12.5px;
            font-weight: 600;
            border-radius: 999px;
            cursor: pointer;
            transition: border-color 0.15s, color 0.15s, background 0.15s;
          }

          .chip:hover {
            border-color: var(--g-line-2);
            color: var(--g-ink);
          }

          .chip-active {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
          }

          .chip-active:hover {
            border-color: var(--accent);
            color: #fff;
          }

          .custom-select-container {
            position: relative;
          }

          .sort-select {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 130px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 500;
            color: var(--g-ink);
            background: var(--g-surface);
            border: 1px solid var(--g-line);
            border-radius: 8px;
            padding: 6px 12px;
            cursor: pointer;
            transition: border-color 0.15s, background-color 0.15s;
          }

          .sort-select:hover {
            background: color-mix(in srgb, var(--g-bg) 50%, transparent);
            border-color: var(--g-line-2);
          }

          .sort-select:focus,
          .sort-select.open {
            outline: none;
            border-color: var(--g-line-2);
          }

          .custom-select-dropdown {
            position: absolute;
            top: calc(100% + 6px);
            right: 0;
            width: 130px;
            background: var(--g-surface);
            border: 1px solid var(--g-line-2);
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            z-index: 50;
            padding: 6px;
            list-style: none;
            margin: 0;
          }

          .custom-select-item {
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 500;
            color: var(--g-ink);
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
          }

          .custom-select-item:hover {
            background: var(--g-bg);
          }

          .custom-select-item.selected {
            background: var(--accent);
            color: #fff;
            font-weight: 600;
          }

          .timeline-list {
            display: block;
          }

          .timeline-item {
            border-bottom: 1px solid var(--g-line);
          }

          .timeline-item:nth-child(odd) {
            background-color: color-mix(in srgb, var(--g-bg) 40%, transparent);
          }

          .timeline-item:last-child {
            border-bottom: 0;
          }

          .timeline-empty {
            padding: 32px 18px;
            text-align: center;
            color: var(--g-muted-2);
            font-size: 14px;
          }

          .entry-row {
            display: grid;
            grid-template-columns: 52px 1fr auto;
            align-items: center;
            gap: 16px;
            padding: 14px 18px;
            min-height: 72px;
            transition: background 0.16s;
          }

          .entry-row:hover {
            background: color-mix(in srgb, var(--g-bg) 75%, transparent);
          }

          .date-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }

          .date-day {
            font-size: 18px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.03em;
            color: var(--g-ink);
            line-height: 1;
          }

          .date-month {
            font-size: 11px;
            font-weight: 600;
            color: var(--g-muted);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-top: 2px;
          }

          .content-col {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }

          .entry-subject {
            font-size: 14.5px;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: var(--g-ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .entry-text {
            font-size: 13px;
            color: var(--g-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .entry-meta {
            font-size: 11.5px;
            color: var(--g-muted-2);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .badge-col {
            flex-shrink: 0;
            display: flex;
            align-items: center;
          }

          .category-badge {
            display: inline-flex;
            align-items: center;
            font-size: 11.5px;
            font-weight: 600;
            padding: 4px 9px;
            border-radius: 999px;
            white-space: nowrap;
          }

          @media (max-width: 1200px) {
            .kpis {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 900px) {
            .cr-dashboard {
              padding: 24px 16px 76px;
            }

            .page-head {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }
          }

          @media (max-width: 720px) {
            .kpis {
              grid-template-columns: 1fr;
            }

            .timeline-head {
              flex-direction: column;
              align-items: flex-start;
            }

            .entry-row {
              grid-template-columns: 44px 1fr;
              grid-template-rows: auto auto;
              min-height: unset;
              padding: 12px 14px;
            }

            .badge-col {
              grid-column: 2;
              grid-row: 2;
            }

            .date-col {
              grid-row: 1 / 3;
            }
          }

          @media (max-width: 480px) {
            .controls-wrap {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
      </UntisGuard>
    </AuthGuard>
  );
}
