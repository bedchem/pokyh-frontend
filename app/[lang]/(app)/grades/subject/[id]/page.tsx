'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowCounterClockwise, ArrowRight, EyeSlash, Minus, Plus, Target, TrendDown, TrendUp, X } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Page, PageHeader, Section } from '@/components/app/Page';
import { Bone, Line } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import TrendChart from '@/components/grades/TrendChart';
import ErrorView from '@/components/ui/ErrorView';
import { fetchGrades, getGradesStale } from '@/lib/api';
import type { SubjectGrades } from '@/lib/types';
import {
  parseGrades,
  fmtNum,
  fmtDateShort,
  fmtUntisDateLong,
  untisDateToJs,
  gradeDisplay,
  formatMark,
  round2,
  averageOf,
  parseGradeInput,
} from '@/lib/grades';
import { useDateLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { gradesDict } from '@/lib/i18n/dictionaries/grades';
import { shellDict } from '@/lib/i18n/dictionaries/shell';

import type { GradesKey } from '@/lib/i18n/dictionaries/grades';
import { loginPath } from '@/providers/SessionProvider';
import { ROUTE_PLACEHOLDER, useRouteId } from '@/lib/route-id';

type DraftState = {
  removedTeacherGradeIds: number[];
  customGrades: number[];
};

const STORAGE_KEY = 'pokyh_grade_drafts_v1';

function loadDrafts(): Record<number, DraftState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveDrafts(d: Record<number, DraftState>) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore quota errors
  }
}

function relativeDay(date: number, t: (key: GradesKey, vars?: Record<string, number>) => string): string {
  const js = untisDateToJs(date);
  if (!js) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(js);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return t('today');
  if (diff === 1) return t('yesterday');
  if (diff < 7) return t('daysAgo', { n: diff });
  if (diff < 30) return t('weeksAgo', { n: Math.round(diff / 7) });
  if (diff < 365) return t('monthsAgo', { n: Math.round(diff / 30) });
  return t('yearsAgo', { n: Math.round(diff / 365) });
}

// The subject named by the address, once it is known in the browser (lib/route-id.ts).
export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = useRouteId(use(params).id);
  if (id === ROUTE_PLACEHOLDER) return null;
  return <SubjectDetailView key={id} idParam={id} />;
}

function SubjectDetailView({ idParam }: { idParam: string }) {
  const lessonId = parseInt(idParam, 10);
  const t = useT(gradesDict);
  const ts = useT(shellDict);
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();

  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drafts, setDrafts] = useState<Record<number, DraftState>>({});
  const [newGradeInput, setNewGradeInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const draftsHydrated = useRef(false);

  useEffect(() => {
    // Stored simulations are read after the first render (localStorage).
    const timer = window.setTimeout(() => {
      setDrafts(loadDrafts());
      draftsHydrated.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftsHydrated.current) return;
    saveDrafts(drafts);
  }, [drafts]);

  const load = useCallback(async () => {
    // Stored grades (from the dashboard or the grades page) show at once.
    const now = new Date();
    const stale = getGradesStale() ?? getGradesStale(now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1);
    if (stale !== undefined) setSubjects(parseGrades(stale));
    setLoading(stale === undefined);
    setError('');
    try {
      const res = await fetchGrades();
      setSubjects(parseGrades(res));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        window.location.replace(loginPath());
      } else {
        setError(e instanceof Error ? e.message : 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const subject = useMemo(
    () => subjects.find((s) => s.lessonId === lessonId) ?? null,
    [subjects, lessonId]
  );

  const draft = useMemo(() => drafts[lessonId] ?? { removedTeacherGradeIds: [], customGrades: [] }, [drafts, lessonId]);

  const teacherRows = useMemo(() => {
    if (!subject) return [] as Array<{ id: number; label: string; date: number; value: number; removed: boolean }>;
    const removed = new Set(draft.removedTeacherGradeIds);
    return [...subject.grades]
      .sort((a, b) => b.date - a.date)
      .map((g) => ({
        id: g.id,
        label: gradeDisplay(g, t('exam')),
        date: g.date,
        value: round2(g.markDisplayValue),
        removed: removed.has(g.id),
      }));
  }, [subject, draft, t]);

  const liveValues = useMemo(() => {
    const teacher = teacherRows.filter((r) => !r.removed).map((r) => r.value);
    return [...teacher, ...draft.customGrades];
  }, [teacherRows, draft]);

  const liveAvg = averageOf(liveValues);
  const positive = liveValues.filter((v) => v >= 6).length;
  const negative = liveValues.filter((v) => v < 6).length;
  const passRate = liveValues.length ? (positive / liveValues.length) * 100 : 0;

  const teacherAvg = useMemo(() => {
    if (!subject) return 0;
    const vals = subject.grades.map((g) => g.markDisplayValue).filter((v) => v > 0);
    return averageOf(vals);
  }, [subject]);

  // Trend in chronological order for the chart
  const chronological = useMemo(() => {
    if (!subject) return [] as Array<{ value: number; date: number; label: string; isCustom: boolean }>;
    const removed = new Set(draft.removedTeacherGradeIds);
    const teacher = subject.grades
      .filter((g) => !removed.has(g.id))
      .map((g) => ({
        value: round2(g.markDisplayValue),
        date: g.date,
        label: gradeDisplay(g, t('exam')),
        isCustom: false,
      }));
    const customs = draft.customGrades.map((v) => ({
      value: v,
      date: 99999999,
      label: t('own'),
      isCustom: true,
    }));
    return [...teacher.sort((a, b) => a.date - b.date), ...customs];
  }, [subject, draft, t]);

  const trendDirection = useMemo(() => {
    if (chronological.length < 2) return 'flat' as const;
    const first = chronological[0].value;
    const last = chronological[chronological.length - 1].value;
    const diff = last - first;
    if (Math.abs(diff) < 0.3) return 'flat' as const;
    return diff > 0 ? 'up' : 'down';
  }, [chronological]);

  const GRADE_STEP = 0.5;

  const roundToGradeStep = (value: number, mode: 'up' | 'down') => {
    const factor = 1 / GRADE_STEP;
    const scaled = value * factor;
    const rounded = mode === 'up'
      ? Math.ceil(scaled - 1e-9)
      : Math.floor(scaled + 1e-9);
    return round2(Math.min(10, Math.max(4, rounded / factor)));
  };

  const targetResult = useMemo(() => {
    const target = parseGradeInput(targetInput);
    if (target === null || liveValues.length === 0) return null;
    const sum = liveValues.reduce((a, b) => a + b, 0);
    const n = liveValues.length;
    const currentAvg = sum / n;

    if (Math.abs(currentAvg - target) < 1e-6) {
      return { target, status: 'reached' as const, count: 0, needed: 0 };
    }

    if (currentAvg < target) {
      // Schnitt anheben: kleinste k Noten ≤ 10 finden
      for (let k = 1; k <= 50; k++) {
        const perGrade = (target * (n + k) - sum) / k;
        if (perGrade <= 10) {
          const neededRaw = Math.max(4, perGrade);
          return {
            target,
            status: 'reachable' as const,
            count: k,
            needed: roundToGradeStep(neededRaw, 'up'),
          };
        }
      }
      return { target, status: 'impossible' as const, count: 0, needed: 0 };
    } else {
      // Schnitt senken: perGrade(k) nähert sich target von unten an
      // Minimum-Note ist 4, also k_min = ceil((sum - target*n) / (target - 4))
      if (target <= 4 + 1e-6) {
        return { target, status: 'impossible' as const, count: 0, needed: 0 };
      }
      const kMin = Math.ceil((sum - target * n) / (target - 4) - 1e-9);
      if (kMin <= 0 || kMin > 50) {
        return { target, status: 'impossible' as const, count: 0, needed: 0 };
      }
      const perGrade = (target * (n + kMin) - sum) / kMin;
      const neededRaw = Math.max(4, perGrade);
      return {
        target,
        status: 'reachable' as const,
        count: kMin,
        needed: roundToGradeStep(neededRaw, 'down'),
      };
    }
  }, [targetInput, liveValues]);

  const updateDraft = (updater: (prev: DraftState) => DraftState) => {
    setDrafts((prev) => {
      const current = prev[lessonId] ?? { removedTeacherGradeIds: [], customGrades: [] };
      return { ...prev, [lessonId]: updater(current) };
    });
  };

  const removeTeacherGrade = (gradeId: number) => {
    updateDraft((d) => {
      if (d.removedTeacherGradeIds.includes(gradeId)) return d;
      return { ...d, removedTeacherGradeIds: [...d.removedTeacherGradeIds, gradeId] };
    });
  };

  const restoreTeacherGrade = (gradeId: number) => {
    updateDraft((d) => ({
      ...d,
      removedTeacherGradeIds: d.removedTeacherGradeIds.filter((x) => x !== gradeId),
    }));
  };

  const removeCustomGrade = (index: number) => {
    updateDraft((d) => {
      const next = [...d.customGrades];
      next.splice(index, 1);
      return { ...d, customGrades: next };
    });
  };

  const addCustomGrade = () => {
    const parsed = parseGradeInput(newGradeInput);
    if (parsed === null) return;
    updateDraft((d) => ({ ...d, customGrades: [...d.customGrades, parsed] }));
    setNewGradeInput('');
  };

  const resetDraft = () => {
    updateDraft(() => ({ removedTeacherGradeIds: [], customGrades: [] }));
    setNewGradeInput('');
    setTargetInput('');
  };

  const hasDraft = draft.removedTeacherGradeIds.length > 0 || draft.customGrades.length > 0;

  const back = { href: '/grades', label: ts('grades') };

  if (loading) {
    return (
      <AuthGuard>
        <Page>
          <div aria-hidden="true" className="flex flex-col gap-10 pt-6 text-ink md:pt-11">
            <div className="flex flex-col gap-3"><Line w={90} h={14} /><Line w={260} h={40} /><Line w={160} h={14} /></div>
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="squircle flex min-h-[150px] flex-col justify-between rounded-[24px] bg-surface p-5"><Line w="45%" h={12} /><Line w={100} h={40} /></span>
              ))}
            </div>
            <Bone className="h-[300px] w-full !rounded-[26px]" />
          </div>
        </Page>
      </AuthGuard>
    );
  }

  if (error || !subject) {
    return (
      <AuthGuard>
        <Page>
          <PageHeader title={t('subject')} back={back} />
          <div className="squircle rounded-[26px] bg-surface">
            {error ? (
              <ErrorView message={error} onRetry={load} />
            ) : (
              <PixelState
                sprite="search"
                title={t('subjectNotFound')}
                action={<ButtonLink href={localize('/grades')} variant="quiet">{t('allSubjects')}</ButtonLink>}
              />
            )}
          </div>
        </Page>
      </AuthGuard>
    );
  }

  const teacherDelta = liveAvg && teacherAvg ? liveAvg - teacherAvg : 0;
  const avgTone = !liveAvg ? 'bg-surface text-ink' : liveAvg >= 6.4 ? 'bg-sage text-sage-ink' : liveAvg >= 6 ? 'bg-butter text-butter-ink' : 'bg-blush text-blush-ink';
  const directionChip = trendDirection === 'up'
    ? { Icon: TrendUp, text: t('rising'), cls: 'bg-sage text-sage-ink' }
    : trendDirection === 'down'
      ? { Icon: TrendDown, text: t('falling'), cls: 'bg-blush text-blush-ink' }
      : { Icon: Minus, text: t('stable'), cls: 'bg-inset text-ink-2' };
  const gradeChip = (v: number) => (v >= 6.4 ? 'bg-sage text-sage-ink' : v >= 6 ? 'bg-butter text-butter-ink' : 'bg-blush text-blush-ink');

  return (
    <AuthGuard>
      <Page>
        <PageHeader
          title={subject.subjectName}
          subtitle={[subject.teacherName, teacherRows[0] ? `${t('lastGrade')} ${fmtUntisDateLong(teacherRows[0].date, tag)}` : ''].filter(Boolean).join(' · ')}
          back={back}
        />

        <div className="flex flex-col gap-12">
          <section className="rise grid gap-3 md:grid-cols-3 md:gap-4">
            <div className={`squircle flex min-h-[170px] flex-col justify-between rounded-[26px] p-6 transition-colors duration-500 ${avgTone}`}>
              <div className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-[15px] font-bold">{t('average')}</span>
                  <span className="block text-[13px] font-semibold opacity-75">
                    {liveValues.length === 1 ? t('gradeOne', { n: 1 }) : t('gradeMany', { n: liveValues.length })}{hasDraft ? ` · ${t('simulation')}` : ''}
                  </span>
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-bold ${directionChip.cls}`}>
                  <directionChip.Icon size={14} weight="bold" aria-hidden="true" />
                  {directionChip.text}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <span className="text-[52px] font-extrabold leading-none tracking-[-0.055em] tnum">{liveAvg ? fmtNum(liveAvg, 2) : '—'}</span>
                {hasDraft && Math.abs(teacherDelta) > 0.005 ? (
                  <span className="pb-1 text-right text-[12.5px] font-semibold opacity-80">
                    {t('teacherAvg')} {fmtNum(teacherAvg, 2)}
                    <span className="block text-[14px] font-extrabold">{teacherDelta >= 0 ? '+' : '−'}{fmtNum(Math.abs(teacherDelta), 2)}</span>
                  </span>
                ) : liveValues.length > 0 ? (
                  <span className="pb-1 text-[13px] font-semibold opacity-80">{t('best', { grade: formatMark(Math.max(...liveValues)) })}</span>
                ) : null}
              </div>
            </div>

            <div className="squircle flex min-h-[170px] flex-col justify-between rounded-[26px] bg-surface p-6">
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-[15px] font-bold">{t('ratioTitle')}</span>
                  <span className="block text-[13px] text-ink-2">{t('ratioSub')}</span>
                </span>
                <span className="rounded-full bg-inset px-2.5 py-1 text-[12.5px] font-bold text-ink-2 tnum">{Math.round(passRate)} %</span>
              </span>
              <span>
                <span className="flex items-baseline gap-2.5">
                  <span className="text-[44px] font-extrabold leading-none tracking-[-0.05em] text-success-ink tnum">{positive}</span>
                  <span className="text-[24px] text-ink-3">/</span>
                  <span className="text-[32px] font-extrabold leading-none tracking-[-0.05em] text-danger-ink tnum">{negative}</span>
                </span>
                <span className="mt-4 flex h-2 gap-[3px] overflow-hidden rounded-full">
                  <span className="rounded-full bg-success transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: `${passRate}%` }} />
                  <span className="rounded-full bg-danger transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: `${100 - passRate}%` }} />
                </span>
              </span>
            </div>

            <div className="squircle flex min-h-[170px] flex-col justify-between gap-4 rounded-[26px] bg-periwinkle p-6 text-periwinkle-ink">
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-[15px] font-bold">{t('whatDoINeed')}</span>
                  <span className="block text-[13px] font-semibold opacity-75">{t('targetCalc')}</span>
                </span>
                <Target size={20} weight="bold" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={t('target')}
                  value={targetInput}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    if (/^\d{0,2}([.,]\d{0,2})?$/.test(v)) setTargetInput(v);
                  }}
                  aria-label={t('targetGrade')}
                  className="h-12 w-24 rounded-[14px] bg-[color-mix(in_srgb,currentColor_12%,transparent)] px-3 text-center text-[20px] font-extrabold tnum outline-none placeholder:text-[15px] placeholder:font-semibold placeholder:text-[color-mix(in_srgb,currentColor_55%,transparent)] focus:bg-[color-mix(in_srgb,currentColor_18%,transparent)]"
                />
                <ArrowRight size={20} weight="bold" aria-hidden="true" />
                <span className="text-[30px] font-extrabold leading-none tracking-[-0.045em] tnum">
                  {!targetResult ? '-'
                    : targetResult.status === 'reached' ? '✓'
                    : targetResult.status === 'impossible' ? '✕'
                    : <>{targetResult.count > 1 && <span className="mr-1 text-[18px] opacity-75">{targetResult.count}×</span>}{fmtNum(targetResult.needed, 2)}</>}
                </span>
              </span>
              <span className="text-[13px] font-semibold opacity-80">
                {!targetResult ? t('hintEnter')
                  : targetResult.status === 'reached' ? t('hintReached')
                  : targetResult.status === 'impossible' ? t('hintImpossible')
                  : targetResult.count === 1 ? t('hintNext')
                  : t('hintMany', { n: targetResult.count, grade: fmtNum(targetResult.needed, 2) })}
              </span>
            </div>
          </section>

          <Section
            className="rise [animation-delay:80ms]"
            title={t('trend')}
            action={hasDraft && (
              <Button variant="quiet" size="sm" onClick={resetDraft}>
                <ArrowCounterClockwise size={15} weight="bold" aria-hidden="true" />
                {t('reset')}
              </Button>
            )}
          >
            <div className="squircle rounded-[26px] bg-surface px-3 pb-2 pt-4 md:px-5 md:pt-5">
              {chronological.length === 0 ? (
                <PixelState compact sprite="empty" title={t('noGradesYet')} />
              ) : (
                <TrendChart
                  points={chronological}
                  dateText={(d) => fmtDateShort(d)}
                  averageLabel={t('average')}
                  ownLabel={t('ownGrade')}
                  gradesLabel={t('trendGrades')}
                  passLabel={t('trendPass')}
                />
              )}
            </div>
            <p className="mt-2.5 px-1 text-[13px] text-ink-3">{t('trendSub')}</p>
          </Section>

          <div className="rise grid gap-12 [animation-delay:140ms] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
            <Section
              title={t('gradeList')}
              action={<span className="text-[13.5px] font-semibold text-ink-2">{t('activeExcluded', { active: teacherRows.filter((r) => !r.removed).length, excluded: teacherRows.filter((r) => r.removed).length })}</span>}
            >
              <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">
                {teacherRows.length === 0 ? (
                  <li><PixelState compact sprite="empty" title={t('noGradesRecorded')} /></li>
                ) : teacherRows.map((row, i) => (
                  <li key={row.id} className={`relative ${i > 0 ? 'before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line' : ''}`}>
                    <div className={`flex items-center gap-3.5 rounded-[18px] px-3 py-3 transition-opacity duration-300 ${row.removed ? 'opacity-45' : ''}`}>
                      <span className={`grid h-11 min-w-[52px] shrink-0 place-items-center rounded-[13px] px-2 text-[16px] font-extrabold tnum ${row.removed ? 'bg-inset text-ink-3 line-through' : gradeChip(row.value)}`}>
                        {formatMark(row.value)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15.5px] font-semibold">{row.label}</span>
                        <span className="block text-[13px] text-ink-2">{fmtDateShort(row.date)} · {relativeDay(row.date, t)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => (row.removed ? restoreTeacherGrade(row.id) : removeTeacherGrade(row.id))}
                        aria-label={row.removed ? t('restoreGrade') : t('excludeGrade')}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink"
                      >
                        {row.removed ? <ArrowCounterClockwise size={17} weight="bold" /> : <EyeSlash size={17} weight="bold" />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={t('avgCalc')}>
              <div className="squircle flex flex-col gap-4 rounded-[24px] bg-surface p-5">
                <p className="text-[13.5px] text-ink-2">{t('avgCalcSub')}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={t('examplePlaceholder')}
                    value={newGradeInput}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      if (/^\d{0,2}([.,]\d{0,2})?$/.test(v)) setNewGradeInput(v);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') addCustomGrade(); }}
                    className="h-11 min-w-0 flex-1 rounded-[14px] bg-inset px-4 text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-ink-3 focus:shadow-[0_0_0_2px_var(--accent)]"
                  />
                  <Button onClick={addCustomGrade} aria-label={t('addGrade')}><Plus size={18} weight="bold" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label={t('quickTest')}>
                  {[4, 5, 6, 7, 8, 9, 10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateDraft((d) => ({ ...d, customGrades: [...d.customGrades, v] }))}
                      className={`h-10 min-w-10 flex-1 rounded-[12px] text-[15px] font-extrabold tnum transition-[filter] hover:brightness-95 ${gradeChip(v)}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {draft.customGrades.length === 0 ? (
                  <p className="text-[13.5px] text-ink-3">{t('noOwnGrades')}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.customGrades.map((value, idx) => (
                      <button
                        key={`custom-${idx}`}
                        type="button"
                        onClick={() => removeCustomGrade(idx)}
                        aria-label={`${t('removeOwnGrade')}: ${formatMark(value)}`}
                        className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-inset pl-3 pr-2 text-[14px] font-bold tnum transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]"
                      >
                        {formatMark(value)}
                        <X size={13} weight="bold" className="text-ink-3 group-hover:text-danger-ink" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          </div>
        </div>
      </Page>
    </AuthGuard>
  );
}
