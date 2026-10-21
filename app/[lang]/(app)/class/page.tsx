'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Exam, NotePencil, XCircle } from '@phosphor-icons/react';
import { useSession, loginPath } from '@/providers/SessionProvider';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import { Page, PageHeader, Section, SectionLink } from '@/components/app/Page';
import { RowsSkeleton } from '@/components/app/Skeleton';
import PixelState, { PixelSpriteArt } from '@/components/app/PixelState';
import { initialsOf } from '@/components/app/hooks';
import { EntryRow, dateOf, parseClassregRows, type ClassregEvent } from '@/components/class/ClassregEntry';
import {
  fetchAbsences,
  fetchClassregEvents,
  fetchClassServices,
  fetchExams,
  fetchHomeworkRange,
  getAbsencesStale,
  getClassregEventsStale,
  getClassServicesStale,
  getExamsStale,
  getHomeworkStale,
} from '@/lib/api';
import type { AbsenceEntry } from '@/lib/types';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { classPagesDict } from '@/lib/i18n/dictionaries/classPages';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { formatDate } from '@/lib/i18n/dateLocale';
import { schoolWeek } from '@/lib/untis-parse';

// The class at a glance: the newest class-register entries, the class duties,
// your own open absences, and the exams and homework of this and next week
// ("this week" moves on from Saturday evening, lib/school-week.ts). Every
// part loads on its own, so a slow one doesn't hold the others back.

type ClassRole = {
  id: number;
  personId: number;
  foreName: string;
  longName: string;
  duty: { id: number; label: string };
};

type ExamItem = {
  subject: string;
  examDate: number;
  startTime: number;
  endTime: number;
  rooms: string[];
  text: string;
};

type HomeworkRecord = {
  id: number;
  lessonId: number;
  dueDate: number;
  text: string;
  completed: boolean;
};

type Part<T> = { loading: boolean; failed: boolean; data: T };

const start = <T,>(data: T): Part<T> => ({ loading: true, failed: false, data });

function dataOf(raw: unknown): Record<string, unknown> {
  const r = (raw ?? {}) as Record<string, unknown>;
  return ((r.data ?? r) as Record<string, unknown>) ?? {};
}

function parseAbsences(raw: unknown): AbsenceEntry[] {
  const arr = (dataOf(raw).absences ?? []) as Record<string, unknown>[];
  return arr.map((a) => ({
    id: (a.id as number) ?? 0,
    startDate: (a.startDate as number) ?? 0,
    endDate: (a.endDate as number) ?? 0,
    startTime: (a.startTime as number) ?? 0,
    endTime: (a.endTime as number) ?? 0,
    isExcused: (a.isExcused as boolean) ?? false,
    reasonName: a.reasonName as string | undefined,
    absenceType: a.absenceType as string | undefined,
    hours: (a.hours as number) ?? 0,
    note: a.note as string | undefined,
    excuseNote: a.excuseNote as string | undefined,
    teacherName: a.teacherName as string | undefined,
    subjectName: a.subjectName as string | undefined,
  }));
}

function parseClassServices(raw: unknown): ClassRole[] {
  const roles = (dataOf(raw).classRoles ?? []) as ClassRole[];
  const seen = new Set<string>();
  return roles.filter((role) => {
    const key = `${role.personId}-${role.duty?.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseExams(raw: unknown): ExamItem[] {
  const list = (dataOf(raw).exams ?? []) as ExamItem[];
  return [...list].sort((a, b) => a.examDate - b.examDate || a.startTime - b.startTime);
}

function parseHomework(raw: unknown): { homeworks: HomeworkRecord[]; lessons: { id: number; subject: string }[] } {
  const data = dataOf(raw);
  return {
    homeworks: [...((data.homeworks as HomeworkRecord[]) ?? []), ...((data.records as HomeworkRecord[]) ?? [])],
    lessons: (data.lessons ?? []) as { id: number; subject: string }[],
  };
}

type WeekHomework = { now: HomeworkRecord[]; next: HomeworkRecord[]; subjects: Map<number, string> };

type SchoolWeek = ReturnType<typeof schoolWeek>;

/** The open homework of this and next week, with the subject of each lesson. */
function homeworkOf(raw: unknown, now: SchoolWeek, next: SchoolWeek): WeekHomework {
  const { homeworks, lessons } = parseHomework(raw);
  const open = homeworks.filter((h) => !h.completed && h.dueDate > 0).sort((a, b) => a.dueDate - b.dueDate);
  return {
    now: open.filter((h) => h.dueDate >= now.startNum && h.dueDate <= now.endNum),
    next: open.filter((h) => h.dueDate >= next.startNum && h.dueDate <= next.endNum),
    subjects: new Map(lessons.map((l) => [l.id, l.subject.split(' (')[0]])),
  };
}

/** Your open absences, newest first. */
function openAbsencesOf(raw: unknown): AbsenceEntry[] {
  return parseAbsences(raw).filter((a) => !a.isExcused).sort((a, b) => b.startDate - a.startDate);
}

/**
 * A part shown at once from what this device stored last time (the live
 * answer replaces it), or a skeleton until the live answer is there.
 */
function storedPart<T>(stored: unknown, parse: (raw: unknown) => T, empty: T): Part<T> {
  return stored === undefined ? start(empty) : { loading: false, failed: false, data: parse(stored) };
}

function recentOf(events: ClassregEvent[]): ClassregEvent[] {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  const cutoff = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return events
    .filter((e) => e.createDate >= cutoff)
    .sort((a, b) => b.createDate - a.createDate || b.createTime - a.createTime)
    .slice(0, 5);
}

const hhmm = (t: number) => {
  const s = String(t).padStart(4, '0');
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
};

const rowLine = 'relative px-3 py-3 before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line first:before:hidden';

/** A list card, its skeleton while loading and a short sentence when it is empty or failed. */
function ListBody<T>({ part, rows = 3, empty, failed, children }: {
  part: Part<T[]>;
  rows?: number;
  empty: string;
  failed: string;
  children: (items: T[]) => ReactNode;
}) {
  if (part.loading && part.data.length === 0) return <RowsSkeleton rows={rows} lead="square" />;
  if (part.data.length === 0) {
    return (
      <div className="squircle rounded-[24px] bg-surface">
        <PixelState compact sprite={part.failed ? 'unplugged' : 'empty'} title={part.failed ? failed : empty} />
      </div>
    );
  }
  return <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">{children(part.data)}</ul>;
}

/** A small calendar tile: weekday over the day of the month. */
function DayTile({ date, tone, tag }: { date: Date; tone: string; tag: string }) {
  return (
    <span className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-[14px] leading-none ${tone}`}>
      <span className="text-[10.5px] font-bold uppercase tracking-[0.04em] opacity-80">{formatDate(date, tag, { weekday: 'short' }).replace('.', '')}</span>
      <span className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] tnum">{date.getDate()}</span>
    </span>
  );
}

function ClassContent() {
  const { user } = useSession();
  const t = useT(classPagesDict);
  const tc = useT(commonDict);
  const { tag } = useDateLocale();

  const [events, setEvents] = useState<Part<ClassregEvent[]>>(() => {
    const stale = getClassregEventsStale();
    return { loading: true, failed: false, data: stale ? recentOf(parseClassregRows(stale)) : [] };
  });
  const [services, setServices] = useState<Part<ClassRole[]>>(() => storedPart(getClassServicesStale(), parseClassServices, []));
  const [absences, setAbsences] = useState<Part<AbsenceEntry[]>>(() => storedPart(getAbsencesStale(), openAbsencesOf, []));
  const [exams, setExams] = useState<Part<{ now: ExamItem[]; next: ExamItem[] }>>(() => {
    const now = schoolWeek(0);
    const next = schoolWeek(1);
    const storedNow = getExamsStale(now.startStr, now.endStr);
    const storedNext = getExamsStale(next.startStr, next.endStr);
    return storedNow === undefined || storedNext === undefined
      ? start({ now: [], next: [] })
      : { loading: false, failed: false, data: { now: parseExams(storedNow), next: parseExams(storedNext) } };
  });
  const [homework, setHomework] = useState<Part<WeekHomework>>(() => {
    const now = schoolWeek(0);
    const next = schoolWeek(1);
    return storedPart(getHomeworkStale(now.startStr, next.endStr), (raw) => homeworkOf(raw, now, next), { now: [], next: [], subjects: new Map() });
  });

  const thisWeek = schoolWeek(0);
  const nextWeek = schoolWeek(1);

  const load = useCallback(() => {
    const now = schoolWeek(0);
    const next = schoolWeek(1);
    const expired = (e: unknown) => {
      if (e instanceof Error && e.message === 'session_expired') { window.location.replace(loginPath()); return true; }
      return false;
    };

    fetchClassregEvents()
      .then((raw) => setEvents({ loading: false, failed: false, data: recentOf(parseClassregRows(raw)) }))
      .catch((e) => { if (!expired(e)) setEvents((p) => ({ ...p, loading: false, failed: true })); });
    fetchClassServices()
      .then((raw) => setServices({ loading: false, failed: false, data: parseClassServices(raw) }))
      .catch((e) => { if (!expired(e)) setServices((p) => ({ ...p, loading: false, failed: true })); });
    fetchAbsences()
      .then((raw) => setAbsences({ loading: false, failed: false, data: openAbsencesOf(raw) }))
      .catch((e) => { if (!expired(e)) setAbsences((p) => ({ ...p, loading: false, failed: true })); });
    Promise.all([fetchExams(now.startStr, now.endStr), fetchExams(next.startStr, next.endStr)])
      .then(([a, b]) => setExams({ loading: false, failed: false, data: { now: parseExams(a), next: parseExams(b) } }))
      .catch((e) => { if (!expired(e)) setExams((p) => ({ ...p, loading: false, failed: true })); });
    fetchHomeworkRange(now.startStr, next.endStr)
      .then((raw) => setHomework({ loading: false, failed: false, data: homeworkOf(raw, now, next) }))
      .catch((e) => { if (!expired(e)) setHomework((p) => ({ ...p, loading: false, failed: true })); });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const now = new Date();
  const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const range = (w: { monday: Date; friday: Date }) => t('weekRange', {
    from: formatDate(w.monday, tag, { day: 'numeric', month: 'short' }),
    to: formatDate(w.friday, tag, { day: 'numeric', month: 'short' }),
  });
  const shortDate = (d: number) => formatDate(dateOf(d), tag, { weekday: 'short', day: 'numeric', month: 'short' });

  const weekBlock = (
    label: string,
    when: string,
    loading: boolean,
    failed: boolean,
    count: number,
    emptyText: string,
    rows: ReactNode,
  ) => (
    <div>
      <p className="flex items-baseline justify-between gap-3 px-1 pb-2.5">
        <span className="text-[14.5px] font-bold">{label}</span>
        <span className="text-[13px] font-semibold text-ink-3 tnum">{when}</span>
      </p>
      {loading ? (
        <RowsSkeleton rows={2} lead="square" />
      ) : count === 0 ? (
        <div role="status" className="squircle flex items-center gap-4 rounded-[20px] bg-surface px-4 py-3">
          <PixelSpriteArt sprite={failed ? 'unplugged' : 'sun'} className="w-[60px] shrink-0" />
          <p className="text-[14px] text-ink-2">{failed ? tc('errGenericTitle') : emptyText}</p>
        </div>
      ) : (
        <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">{rows}</ul>
      )}
    </div>
  );

  const examRows = (list: ExamItem[]) => list.map((exam, i) => (
    <li key={`${exam.examDate}-${exam.startTime}-${i}`} className={rowLine}>
      <div className="flex items-start gap-3.5">
        <DayTile date={dateOf(exam.examDate)} tone="bg-butter text-butter-ink" tag={tag} />
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold leading-snug">{exam.subject}</p>
          <p className="mt-0.5 text-[13.5px] text-ink-2 tnum">
            {hhmm(exam.startTime)} – {hhmm(exam.endTime)}{exam.rooms?.length ? ` · ${exam.rooms.join(', ')}` : ''}
          </p>
          {exam.text && <p className="mt-1 text-[13.5px] leading-snug text-ink-2 [overflow-wrap:anywhere]">{exam.text}</p>}
        </div>
      </div>
    </li>
  ));

  const homeworkRows = (list: HomeworkRecord[]) => list.map((hw) => (
    <li key={hw.id} className={rowLine}>
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-sage text-sage-ink" aria-hidden="true">
          <NotePencil size={22} weight="bold" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold leading-snug">{homework.data.subjects.get(hw.lessonId) ?? '-'}</p>
          {hw.text && <p className="mt-0.5 whitespace-pre-line text-[14px] leading-snug text-ink-2 [overflow-wrap:anywhere]">{hw.text}</p>}
          <p className="mt-1.5 inline-flex rounded-full bg-inset px-2.5 py-0.5 text-[12.5px] font-bold text-ink-2">{t('dueOn', { date: shortDate(hw.dueDate) })}</p>
        </div>
      </div>
    </li>
  ));

  return (
    <Page>
      <PageHeader
        title={user?.klasseName ? t('classTitle', { name: user.klasseName }) : t('myClass')}
        subtitle={t('schoolYear', { year: `${schoolYear}/${schoolYear + 1}` })}
      />

      <div className="flex flex-col gap-12">
        <div className="rise grid gap-12 lg:grid-cols-12 lg:gap-6">
          <Section className="lg:col-span-7" title={t('recentEntries')} action={<SectionLink href="/classregevents">{t('all')}</SectionLink>}>
            <ListBody part={events} rows={4} empty={t('noEntries3m')} failed={tc('errGenericTitle')}>
              {(list) => list.map((ev, i) => <EntryRow key={`${ev.id}-${i}`} ev={ev} tag={tag} />)}
            </ListBody>
          </Section>

          <div className="flex flex-col gap-12 lg:col-span-5">
            <Section title={t('classServices')}>
              <ListBody part={services} rows={2} empty={t('noClassServices')} failed={tc('errGenericTitle')}>
                {(list) => list.map((role, i) => (
                  <li key={`${role.id}-${i}`} className={rowLine}>
                    <div className="flex items-center gap-3.5">
                      <span
                        aria-hidden="true"
                        className={`grid size-11 shrink-0 place-items-center rounded-full text-[14px] font-bold ${i % 2 ? 'bg-sage text-sage-ink' : 'bg-periwinkle text-periwinkle-ink'}`}
                      >
                        {initialsOf(`${role.foreName} ${role.longName}`)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15.5px] font-semibold">{role.foreName} {role.longName}</span>
                        <span className="block truncate text-[13.5px] text-ink-2">{role.duty?.label}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ListBody>
            </Section>

            <Section title={t('openAbsences')} action={<SectionLink href="/absences">{t('all')}</SectionLink>}>
              <ListBody part={{ ...absences, data: absences.data.slice(0, 4) }} rows={2} empty={t('noOpenAbsences')} failed={tc('errGenericTitle')}>
                {(list) => (
                  <>
                    {list.map((a) => (
                      <li key={a.id} className={rowLine}>
                        <div className="flex items-center gap-3.5">
                          <DayTile date={dateOf(a.startDate)} tone="bg-blush text-blush-ink" tag={tag} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15.5px] font-semibold leading-snug">
                              {a.endDate !== a.startDate ? `${shortDate(a.startDate)} – ${shortDate(a.endDate)}` : shortDate(a.startDate)}
                            </span>
                            {(a.subjectName || a.reasonName) && <span className="block truncate text-[13.5px] text-ink-2">{a.subjectName || a.reasonName}</span>}
                          </span>
                          <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-blush px-2.5 text-[12.5px] font-bold text-blush-ink">
                            <XCircle size={14} weight="bold" aria-hidden="true" />
                            {t('open')}
                          </span>
                        </div>
                      </li>
                    ))}
                    {absences.data.length > 4 && (
                      <li className="px-3 pb-1 pt-2 text-[13.5px] font-semibold text-ink-2">{t('more', { n: absences.data.length - 4 })}</li>
                    )}
                  </>
                )}
              </ListBody>
            </Section>
          </div>
        </div>

        <div className="rise grid gap-12 [animation-delay:60ms] lg:grid-cols-2 lg:gap-6">
          <Section title={<span className="inline-flex items-center gap-2"><Exam size={22} weight="bold" className="text-butter-ink" aria-hidden="true" />{t('exams')}</span>}>
            <div className="flex flex-col gap-6">
              {weekBlock(t('thisWeek'), range(thisWeek), exams.loading, exams.failed, exams.data.now.length, t('noExamsThisWeek'), examRows(exams.data.now))}
              {weekBlock(t('nextWeek'), range(nextWeek), exams.loading, exams.failed, exams.data.next.length, t('noExamsNextWeek'), examRows(exams.data.next))}
            </div>
          </Section>
          <Section title={<span className="inline-flex items-center gap-2"><NotePencil size={22} weight="bold" className="text-sage-ink" aria-hidden="true" />{t('homework')}</span>}>
            <div className="flex flex-col gap-6">
              {weekBlock(t('thisWeek'), range(thisWeek), homework.loading, homework.failed, homework.data.now.length, t('noHwThisWeek'), homeworkRows(homework.data.now))}
              {weekBlock(t('nextWeek'), range(nextWeek), homework.loading, homework.failed, homework.data.next.length, t('noHwNextWeek'), homeworkRows(homework.data.next))}
            </div>
          </Section>
        </div>
      </div>
    </Page>
  );
}

export default function ClassPage() {
  return (
    <AuthGuard>
      <UntisGuard>
        <ClassContent />
      </UntisGuard>
    </AuthGuard>
  );
}
