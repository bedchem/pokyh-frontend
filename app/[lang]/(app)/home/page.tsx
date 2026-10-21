'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
import { PencilSimple, UserMinus, WifiSlash } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Page, Section, SectionLink } from '@/components/app/Page';
import { Line } from '@/components/app/Skeleton';
import { useFirstName } from '@/components/app/hooks';
import { useAppActions } from '@/components/app/actions';
import { DEST } from '@/components/app/nav';
import {
  ExamCard, GradeList, ListCard, MensaCard, MessageList, QuickTile,
  type DashDish, type RecentGrade,
} from '@/components/dashboard/widgets';
import { useSession, loginPath } from '@/providers/SessionProvider';
import { useApp } from '@/providers/AppProvider';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { api } from '@/lib/api-client';
import {
  fetchAbsences, fetchExams, fetchGrades, fetchMensa, fetchMessages, fetchTimetable,
  getAbsencesStale, getExamsStale, getGradesStale, getMessagesStale, getTimetableStale,
} from '@/lib/api';
import { dateNumOf, isoDate, mondayOf, nextUpcomingExam, parseTimetable } from '@/lib/timetable-logic';
import { schoolClock } from '@/lib/school-day';
import { averageRating, dietOf, dishesFrom, isTodayKey, localized, upcomingDays } from '@/lib/mensa';
import { messageIsRead, untisDate } from '@/lib/untis-parse';
import { parseAbsences } from '@/lib/absences';
import { absenceSummary, readAbsenceCalc, schoolYearOf } from '@/lib/absence-calc';
import type { MessagePreview, TimetableEntry } from '@/lib/types';
import { homeDict } from '@/lib/i18n/dictionaries/home';
import { messagesDict } from '@/lib/i18n/dictionaries/messages';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { formatDate, formatTime } from '@/lib/i18n/dateLocale';

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseExamResult(json: unknown): TimetableEntry[] {
  const root = json && typeof json === 'object' ? json as Record<string, unknown> : {};
  const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : root;
  const exams = Array.isArray(data.exams) ? data.exams : [];
  return exams.map((raw, index) => {
    const exam = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    const rooms = Array.isArray(exam.rooms) ? exam.rooms.filter((r): r is string => typeof r === 'string') : [];
    const startTime = typeof exam.startTime === 'number' ? exam.startTime : 0;
    const endTime = typeof exam.endTime === 'number' && exam.endTime > 0 ? exam.endTime : (startTime > 0 ? startTime : 2359);
    const subject = typeof exam.subject === 'string' ? exam.subject : '';
    const id = typeof exam.id === 'number' ? exam.id : -(index + 1);
    return {
      id, lessonId: id,
      date: typeof exam.examDate === 'number' ? exam.examDate : 0,
      startTime, endTime,
      subjectName: subject, subjectLong: subject,
      teacherName: '', roomName: rooms[0] ?? '',
      cellState: 'STANDARD', isExam: true, isCancelled: false, isSubstitution: false, isAdditional: false,
    } satisfies TimetableEntry;
  }).filter((e) => e.date > 0 && e.subjectName.length > 0);
}

interface GradeSummary { avg: number | null; subjects: number; recent: RecentGrade[] }

function parseGrades(json: unknown): GradeSummary {
  try {
    const subjects = ((json as Record<string, unknown>)?.subjects ?? []) as Array<Record<string, unknown>>;
    const values: number[] = [];
    const recent: RecentGrade[] = [];
    for (const s of subjects) {
      for (const g of (s.grades ?? []) as Array<Record<string, unknown>>) {
        const v = (g.markDisplayValue as number) ?? 0;
        if (!v) continue;
        values.push(v);
        recent.push({
          id: g.id as number,
          subjectName: (s.subjectName as string) ?? '',
          subjectLessonId: (s.lessonId as number) ?? 0,
          markDisplayValue: v,
          date: g.date as number,
          examType: (g.examType as string) ?? '',
        });
      }
    }
    return {
      avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
      subjects: subjects.length,
      recent: recent.sort((a, b) => b.date - a.date).slice(0, 3),
    };
  } catch {
    return { avg: null, subjects: 0, recent: [] };
  }
}

function parseMessages(json: unknown, unknown: string, noSubject: string): MessagePreview[] {
  try {
    const root = json as Record<string, unknown>;
    const data = (root?.data ?? {}) as Record<string, unknown>;
    const arr = (root?.incomingMessages ?? root?.messages ?? data.incomingMessages ?? (Array.isArray(root?.data) ? root.data : [])) as Record<string, unknown>[];
    return arr.map((m) => {
      const sender = typeof m.sender === 'object' && m.sender !== null ? m.sender as Record<string, unknown> : null;
      return {
        id: m.id as number,
        subject: (m.subject as string) || noSubject,
        contentPreview: (m.contentPreview as string) ?? '',
        senderName: (sender?.displayName as string) ?? (sender?.name as string) ?? (m.senderName as string) ?? unknown,
        senderId: (sender?.userId as number) ?? 0,
        sentDate: (m.sentDateTime as string) ?? (m.sentDate as string) ?? (m.date as string) ?? '',
        isRead: messageIsRead(m),
        hasAttachments: (m.hasAttachments as boolean) ?? false,
      };
    });
  } catch {
    return [];
  }
}

function mergeEntries(lists: TimetableEntry[][]): TimetableEntry[] {
  const seen = new Set<string>();
  const out: TimetableEntry[] = [];
  for (const e of lists.flat()) {
    const key = `${e.id}-${e.date}-${e.startTime}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out.sort((a, b) => a.date - b.date || a.startTime - b.startTime);
}

/** The exams from today on, from the timetable weeks and the exam list, each once. */
function upcomingExams(weeks: TimetableEntry[][], list: TimetableEntry[], todayNum: number): TimetableEntry[] {
  const fromTimetable = mergeEntries(weeks).filter((e) => e.isExam && e.date >= todayNum);
  const seen = new Set<string>();
  return [...fromTimetable, ...list].filter((e) => {
    const key = `${e.date}-${e.startTime}-${e.subjectName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const daysBetween = (from: number, to: number) => Math.round((untisDate(to).getTime() - untisDate(from).getTime()) / 86_400_000);

// ── Page ──────────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user } = useSession();
  const { stableUid, classId } = useApp();
  const t = useT(homeDict);
  const tm = useT(messagesDict);
  const ts = useT(shellDict);
  const tc = useT(commonDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const firstName = useFirstName();
  const localize = useLocalizeHref();
  const { openCompose, openReport } = useAppActions();
  const untis = user?.isUntisUser !== false;

  const [exams, setExams] = useState<TimetableEntry[]>([]);
  const [grades, setGrades] = useState<GradeSummary>({ avg: null, subjects: 0, recent: [] });
  const [messages, setMessages] = useState<MessagePreview[]>([]);
  const [menu, setMenu] = useState<{ key: string; date: Date; dishes: DashDish[] } | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [quick, setQuick] = useState<{ absences?: string; todos?: string; reminders?: string }>({});
  const [ratings, setRatings] = useState<Record<string, { value: number; count: number }>>({});
  const [loading, setLoading] = useState(untis);
  // Grades and messages load on their own: a list shows its skeleton until it
  // has data, and "nothing here" only once it is known to be empty.
  const [gradesState, setGradesState] = useState<{ loading: boolean; failed?: string }>({ loading: untis });
  const [messagesState, setMessagesState] = useState<{ loading: boolean; failed?: string }>({ loading: untis });
  const [offline, setOffline] = useState(false);
  const [clock, setClock] = useState(() => ({ day: dateNumOf(new Date()), minute: schoolClock().minute }));
  const ratingsFor = useRef('');

  useEffect(() => {
    const id = setInterval(() => setClock({ day: dateNumOf(new Date()), minute: schoolClock().minute }), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    const today = new Date();
    // The school weeks (Monday to Saturday) the timetable and the app frame
    // load too, so one request serves all of them; three of them cover the
    // next two weeks' exams.
    const [thisWeek, nextWeek, laterWeek] = [0, 1, 2].map((w) => isoDate(mondayOf(w)));
    const examsFrom = format(today, 'yyyyMMdd');
    const examsTo = format(addDays(today, 14), 'yyyyMMdd');

    // Public data first: it doesn't wait for WebUntis.
    // The own school's menu; a school without one shows no Mensa here.
    fetchMensa('account').then((raw) => {
      const day = upcomingDays(dishesFrom(raw), today)[0];
      setMenu(day ? {
        key: day.key,
        date: day.date,
        dishes: day.dishes.slice(0, 3).map((d) => ({ id: d.id, name: localized(d.name, locale), imageUrl: d.imageUrl, diet: dietOf(d), rating: null })),
      } : null);
    }).catch(() => {}).finally(() => setMenuLoading(false));

    // The quick tiles' small print: open to-dos, upcoming class reminders,
    // and (WebUntis) missed hours with the absence rate.
    if (user) {
      api.todos.list(user.username)
        .then((list) => {
          const open = list.filter((td) => !td.done).length;
          setQuick((q) => ({ ...q, todos: t('todosNote', { n: open }) }));
        })
        .catch(() => {});
    }
    if (classId) {
      api.reminders.list(classId)
        .then((list) => {
          const now = Date.now();
          const upcoming = list.filter((r) => new Date(r.remindAt).getTime() >= now).length;
          setQuick((q) => ({ ...q, reminders: t('remindersNote', { n: upcoming }) }));
        })
        .catch(() => {});
    }
    if (untis && user) {
      const absenceNote = (raw: unknown) => {
        const { minutes, rate } = absenceSummary(parseAbsences(raw), readAbsenceCalc(user.studentId, schoolYearOf()));
        const hours = String(Math.round(minutes / 6) / 10).replace('.', locale === 'en' ? '.' : ',');
        setQuick((q) => ({
          ...q,
          absences: rate != null ? t('absencesNote', { rate: rate.toFixed(1).replace('.', locale === 'en' ? '.' : ','), hours }) : t('absencesHours', { hours }),
        }));
      };
      const storedAbsences = getAbsencesStale();
      if (storedAbsences !== undefined) absenceNote(storedAbsences);
      fetchAbsences().then(absenceNote).catch(() => {});
    }

    if (!untis) return;

    // 1. Instant: what this device stored last time.
    const todayNum = dateNumOf(today);
    const staleNow = getTimetableStale(thisWeek);
    const staleNext = getTimetableStale(nextWeek);
    const staleLater = getTimetableStale(laterWeek);
    const staleExamList = getExamsStale(examsFrom, examsTo);
    const staleGrades = getGradesStale();
    const staleMessages = getMessagesStale();
    if (staleNow !== undefined || staleNext !== undefined) {
      const weeks = [staleNow, staleNext, staleLater].filter((w) => w !== undefined).map(parseTimetable);
      setExams(upcomingExams(weeks, staleExamList !== undefined ? parseExamResult(staleExamList) : [], todayNum));
    }
    if (staleGrades !== undefined) { setGrades(parseGrades(staleGrades)); setGradesState({ loading: false }); }
    if (staleMessages !== undefined) { setMessages(parseMessages(staleMessages, tm('unknown'), tm('noSubject'))); setMessagesState({ loading: false }); }
    if (staleNow !== undefined && staleGrades !== undefined) setLoading(false);

    // 2. Live from WebUntis; the exam sources of step 3 start at once too.
    const examSources = Promise.allSettled([fetchTimetable(laterWeek), fetchExams(examsFrom, examsTo)]);
    const results = await Promise.allSettled([fetchTimetable(thisWeek), fetchTimetable(nextWeek), fetchGrades(), fetchMessages()]);
    const [ttNow, ttNext, gr, ms] = results;
    if (results.some((r) => r.status === 'rejected' && (r.reason as Error)?.message === 'session_expired')) {
      window.location.replace(loginPath());
      return;
    }
    setOffline(results.every((r) => r.status === 'rejected'));
    const weeks = [ttNow, ttNext].filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled').map((r) => parseTimetable(r.value));
    const reason = (r: PromiseRejectedResult) => (r.reason instanceof Error ? r.reason.message : String(r.reason));
    if (gr.status === 'fulfilled') { setGrades(parseGrades(gr.value)); setGradesState({ loading: false }); }
    else setGradesState((st) => (st.loading ? { loading: false, failed: reason(gr) } : st));
    if (ms.status === 'fulfilled') { setMessages(parseMessages(ms.value, tm('unknown'), tm('noSubject'))); setMessagesState({ loading: false }); }
    else setMessagesState((st) => (st.loading ? { loading: false, failed: reason(ms) } : st));
    setLoading(false);

    // 3. Exams of the next two weeks, from the timetable and the exam list.
    const [ttLater, examRes] = await examSources;
    const later = ttLater.status === 'fulfilled' ? [parseTimetable(ttLater.value)] : [];
    setExams(upcomingExams([...weeks, ...later], examRes.status === 'fulfilled' ? parseExamResult(examRes.value) : [], todayNum));
  }, [untis, user, classId, locale, t, tm]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Star ratings of the shown dishes, kept live while anyone rates.
  useEffect(() => {
    if (!stableUid || !menu?.dishes.length) return;
    const ids = menu.dishes.map((d) => d.id);
    const key = ids.join(',');
    if (ratingsFor.current === key) return;
    ratingsFor.current = key;
    api.dishRatings.getBatch(ids)
      .then((batch) => {
        const next: Record<string, { value: number; count: number }> = {};
        for (const [id, data] of Object.entries(batch)) next[id] = averageRating(data.ratings);
        setRatings(next);
      })
      .catch(() => {});
  }, [stableUid, menu]);

  useEffect(() => {
    if (!stableUid) return;
    return api.dishRatings.subscribeAll((dishId, data) => {
      setRatings((prev) => ({ ...prev, [dishId]: averageRating(data.ratings) }));
    });
  }, [stableUid]);


  const nextExam = useMemo(() => nextUpcomingExam(exams, clock.day, clock.minute), [exams, clock]);
  const examWhen = nextExam ? (() => {
    const diff = daysBetween(clock.day, nextExam.date);
    return diff <= 0 ? t('today') : diff === 1 ? t('tomorrow') : t('inDays', { n: diff });
  })() : '';

  const hour = new Date().getHours();
  const greeting = hour < 11 ? t('morning') : hour < 17 ? t('day') : t('evening');
  const dateLine = [formatDate(new Date(), tag, { weekday: 'long', day: 'numeric', month: 'long' }), user?.klasseName].filter(Boolean).join(' · ');

  const messageDate = useCallback((s: string) => {
    if (!s) return '';
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return '';
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0) return formatTime(date, tag, { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return t('yesterday');
    if (days < 7) return formatDate(date, tag, { weekday: 'short' });
    return formatDate(date, tag, { day: '2-digit', month: '2-digit' });
  }, [tag, t]);

  const gradeDate = useCallback((d: number) => (d ? formatDate(untisDate(d), tag, { day: 'numeric', month: 'short' }) : ''), [tag]);
  const dishes = (menu?.dishes ?? []).map((d) => ({ ...d, rating: ratings[d.id] ?? null }));
  const menuTitle = menu && !isTodayKey(menu.key) ? `${t('mensaNext')} · ${formatDate(menu.date, tag, { weekday: 'long' })}` : t('mensaToday');

  const actions = untis && (
    <>
      <Button variant="tone" onClick={openCompose} className="min-w-0 !px-3 !text-[14px] sm:!px-5 sm:!text-[15px]">
        <PencilSimple size={18} weight="bold" className="hidden shrink-0 min-[400px]:block" aria-hidden="true" />
        <span className="truncate">{t('writeMessage')}</span>
      </Button>
      {openReport && (
        <Button variant="quiet" onClick={openReport} className="min-w-0 !px-3 !text-[14px] sm:!px-5 sm:!text-[15px]">
          <UserMinus size={18} weight="bold" className="hidden shrink-0 min-[400px]:block" aria-hidden="true" />
          <span className="truncate">{t('reportAbsence')}</span>
        </Button>
      )}
    </>
  );

  const showMensa = menuLoading || dishes.length > 0;

  return (
    <Page width="wide">
      <header className="rise flex flex-col gap-5 pt-3 pb-8 md:flex-row md:items-end md:justify-between md:pt-6 md:pb-9">
        <div className="min-w-0">
          <h1 className="text-[clamp(32px,4vw,48px)] font-extrabold leading-[1.04] tracking-[-0.05em]">
            {greeting}
            {firstName ? (
              <>, <span className="text-accent [animation:rise_0.5s_var(--ease-out)_both]">{firstName}</span></>
            ) : untis && !user?.isParent ? (
              <span className="ml-3 inline-block align-middle" aria-hidden="true"><Line w={150} h={32} className="text-ink" /></span>
            ) : null}
          </h1>
          <p className="mt-2 text-[15px] text-ink-2 md:text-[17px]">{dateLine}</p>
        </div>
        {actions && <div className={`grid gap-2 md:flex md:shrink-0 ${openReport ? 'grid-cols-2' : 'grid-cols-1'}`}>{actions}</div>}
      </header>

      {offline && (
        <p role="status" className="rise mb-6 inline-flex items-center gap-2 rounded-full bg-butter px-3.5 py-2 text-[13.5px] font-semibold text-butter-ink">
          <WifiSlash size={16} weight="bold" aria-hidden="true" />
          {t('offline')}
        </p>
      )}

      {untis ? (
        <div className="flex flex-col gap-12">
          <div className="rise grid grid-cols-2 gap-3 [animation-delay:60ms] md:gap-4 lg:grid-cols-4">
            <QuickTile dest={DEST.grades} label={ts('grades')} note={grades.avg != null ? `Ø ${grades.avg.toFixed(2)} · ${grades.subjects === 1 ? t('subjectOne', { n: 1 }) : t('subjectMany', { n: grades.subjects })}` : undefined} index={0} />
            <QuickTile dest={DEST.absences} label={ts('absences')} note={quick.absences} index={1} />
            <QuickTile dest={DEST.todos} label={ts('todos')} note={quick.todos} index={2} />
            <QuickTile dest={DEST.reminders} label={ts('reminders')} note={quick.reminders} index={3} />
          </div>

          <div className="rise grid gap-12 [animation-delay:120ms] lg:grid-cols-12 lg:gap-6">
            <Section className="flex flex-col lg:col-span-5" title={t('nextExam')}>
              <div className="flex-1">
                <ExamCard
                  exam={nextExam}
                  when={examWhen}
                  date={nextExam ? formatDate(untisDate(nextExam.date), tag, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                  loading={loading}
                />
              </div>
            </Section>
            <Section className="lg:col-span-7" title={t('recentGrades')} action={<SectionLink href="/grades">{t('all')}</SectionLink>}>
              <ListCard>
                <GradeList
                  grades={grades.recent}
                  dateText={gradeDate}
                  loading={gradesState.loading}
                  failed={gradesState.failed}
                  emptyText={gradesState.failed ? t('loadFailed') : t('noGrades')}
                  average={grades.avg}
                  averageLabel={t('gradeAvg')}
                  subjectsText={grades.subjects === 1 ? t('subjectOne', { n: 1 }) : t('subjectMany', { n: grades.subjects })}
                />
              </ListCard>
            </Section>
          </div>

          <div className="rise grid gap-12 [animation-delay:180ms] lg:grid-cols-12 lg:gap-6">
            <Section className="lg:col-span-7" title={t('messages')} action={<SectionLink href="/messages">{t('all')}</SectionLink>}>
              <ListCard>
                <MessageList messages={messages.slice(0, 4)} dateText={messageDate} loading={messagesState.loading} failed={messagesState.failed} emptyText={messagesState.failed ? t('loadFailed') : t('noMessages')} />
              </ListCard>
            </Section>
            {showMensa && (
              <Section className="lg:col-span-5" title={menuTitle} action={<SectionLink href="/canteen">{ts('mensa')}</SectionLink>}>
                <MensaCard dishes={dishes} loading={menuLoading} noRating={t('noRatingYet')} />
              </Section>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-6">
          <div className="rise squircle flex flex-col justify-between gap-6 rounded-[26px] bg-periwinkle p-6 text-periwinkle-ink md:p-7">
            <span>
              <span className="block text-[26px] font-extrabold tracking-[-0.04em] md:text-[32px]">{tc('untisTitle')}</span>
              <span className="mt-2 block max-w-[46ch] text-[15px] font-medium opacity-85">{tc('untisText')}</span>
            </span>
            <span className="grid grid-cols-2 gap-2">
              <ButtonLink href={localize('/todos')} variant="ink">{ts('todos')}</ButtonLink>
              <ButtonLink href={localize('/reminders')} variant="ink">{ts('reminders')}</ButtonLink>
            </span>
          </div>
          {showMensa && (
            <Section title={menuTitle} action={<SectionLink href="/canteen">{ts('mensa')}</SectionLink>}>
              <MensaCard dishes={dishes} loading={menuLoading} noRating={t('noRatingYet')} />
            </Section>
          )}
        </div>
      )}
    </Page>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
