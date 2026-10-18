'use client';

import { addDays, format } from 'date-fns';
import {
  fetchClassServices, fetchClassregEvents, fetchExams, fetchHomeworkRange, fetchMensa,
  getGradesStale, getMessagesStale, getTimetableStale,
} from '@/lib/api';
import { api } from '@/lib/api-client';
import { fmtTime, parseTimetable } from '@/lib/timetable-logic';
import { dishesFrom, localized, upcomingDays } from '@/lib/mensa';
import { parseClassServices, parseClassregEvents, parseExams, parseHomework, schoolWeek, untisDate } from '@/lib/untis-parse';
import type { Locale } from '@/lib/i18n/locale';
import type { ShellKey } from '@/lib/i18n/dictionaries/shell';

// What the search finds inside the pages: each source is read once per page
// load and handed over as soon as it is there, so the first results show at
// once (from what the device already holds) and the rest fills in.

export interface ContentDoc {
  id: string;
  source: ShellKey;
  title: string;
  subtitle?: string;
  keywords?: string;
  href: string;
}

export interface ContentContext {
  username: string;
  classId: string | null;
  untis: boolean;
  locale: Locale;
  tag: string;
}

type Emit = (source: string, docs: ContentDoc[]) => void;

const loaded = new Map<string, ContentDoc[]>();
const pending = new Set<string>();

function day(d: number, tag: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  return d ? untisDate(d).toLocaleDateString(tag, opts) : '';
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function run(name: string, emit: Emit, task: () => Promise<ContentDoc[]> | ContentDoc[]) {
  const hit = loaded.get(name);
  if (hit) { emit(name, hit); return; }
  if (pending.has(name)) return;
  pending.add(name);
  Promise.resolve()
    .then(task)
    .then((docs) => { loaded.set(name, docs); emit(name, docs); })
    .catch(() => emit(name, []))
    .finally(() => pending.delete(name));
}

/** How many sources loadSearchContent reports for this account. */
export function searchSourceCount(ctx: Pick<ContentContext, 'untis' | 'classId' | 'username'>): number {
  return (ctx.untis ? 7 : 0) + (ctx.classId ? 1 : 0) + (ctx.username ? 1 : 0) + 1;
}

/** Starts (or replays) every source; `emit` is called once per source. */
export function loadSearchContent(ctx: ContentContext, emit: Emit): void {
  const sources: Array<[string, () => Promise<ContentDoc[]> | ContentDoc[]]> = [];

  if (ctx.untis) {
    sources.push(['grades', () => {
      const raw = getGradesStale() as { subjects?: Array<Record<string, unknown>> } | undefined;
      const docs: ContentDoc[] = [];
      for (const s of raw?.subjects ?? []) {
        const name = String(s.subjectName ?? '');
        const lessonId = Number(s.lessonId ?? 0);
        if (!name || !lessonId) continue;
        docs.push({ id: `subject:${lessonId}`, source: 'srcSubject', title: name, subtitle: String(s.teacherName ?? ''), href: `/grades/subject/${lessonId}` });
        for (const g of (s.grades ?? []) as Array<Record<string, unknown>>) {
          const value = g.markDisplayValue ?? g.markName;
          if (!value) continue;
          docs.push({
            id: `grade:${String(g.id)}`,
            source: 'srcGrade',
            title: `${String(value)} · ${name}`,
            subtitle: [String(g.examType ?? ''), String(g.text ?? ''), day(Number(g.date ?? 0), ctx.tag)].filter(Boolean).join(' · '),
            href: `/grades/subject/${lessonId}`,
          });
        }
      }
      return docs;
    }]);

    sources.push(['lessons', () => {
      const docs: ContentDoc[] = [];
      const seen = new Set<string>();
      for (const e of parseTimetable(getTimetableStale())) {
        if (e.isCancelled) continue;
        const key = `${e.date}-${e.startTime}`;
        if (seen.has(key)) continue;
        seen.add(key);
        docs.push({
          id: `lesson:${key}`,
          source: 'srcLesson',
          title: e.subjectLong || e.subjectName || e.note || '–',
          subtitle: [`${day(e.date, ctx.tag, { weekday: 'short' })} ${fmtTime(e.startTime)}`, e.roomName, e.teacherLongName || e.teacherName].filter(Boolean).join(' · '),
          keywords: `${e.subjectName} ${e.teacherName} ${e.note ?? ''}`,
          href: `/timetable?open=${e.id}&date=${e.date}`,
        });
      }
      return docs;
    }]);

    sources.push(['messages', () => {
      const raw = getMessagesStale() as { incomingMessages?: Array<Record<string, unknown>> } | undefined;
      return (raw?.incomingMessages ?? []).map((m) => ({
        id: `msg:${String(m.id)}`,
        source: 'srcMessage' as ShellKey,
        title: String(m.subject || '–'),
        subtitle: String((m.sender as Record<string, unknown> | undefined)?.displayName ?? ''),
        keywords: stripHtml(String(m.contentPreview ?? '')),
        href: `/messages/${String(m.id)}`,
      }));
    }]);

    sources.push(['services', async () => parseClassServices(await fetchClassServices()).map((r) => ({
      id: `duty:${r.personId}-${r.duty?.id}`,
      source: 'srcClassService' as ShellKey,
      title: r.duty?.label ?? '–',
      subtitle: `${r.foreName} ${r.longName}`.trim(),
      href: '/class',
    }))]);

    sources.push(['classreg', async () => parseClassregEvents(await fetchClassregEvents()).map((e) => ({
      id: `event:${e.id}`,
      source: 'srcClassreg' as ShellKey,
      title: e.text || e.categoryName || e.eventReasonName || '–',
      subtitle: [e.categoryName, e.subjectName, day(e.createDate, ctx.tag)].filter(Boolean).join(' · '),
      keywords: `${e.eventReasonName} ${e.creatorName} ${e.elementName}`,
      href: '/classregevents',
    }))]);

    sources.push(['homework', async () => {
      const { homeworks, lessons } = parseHomework(await fetchHomeworkRange(schoolWeek(0).startStr, schoolWeek(1).endStr));
      return homeworks.filter((h) => h.text).map((h) => {
        const subject = lessons.find((l) => l.id === h.lessonId)?.subject.split(' (')[0] ?? '';
        return {
          id: `hw:${h.id}`,
          source: 'srcHomework' as ShellKey,
          title: stripHtml(h.text),
          subtitle: [subject, day(h.dueDate, ctx.tag)].filter(Boolean).join(' · '),
          href: '/class',
        };
      });
    }]);

    sources.push(['exams', async () => {
      const now = new Date();
      return parseExams(await fetchExams(format(now, 'yyyyMMdd'), format(addDays(now, 42), 'yyyyMMdd'))).map((x, i) => ({
        id: `exam:${x.id ?? i}`,
        source: 'srcExam' as ShellKey,
        title: x.subject || '–',
        subtitle: [day(x.examDate, ctx.tag), x.startTime ? fmtTime(x.startTime) : '', x.text].filter(Boolean).join(' · '),
        href: `/timetable?date=${x.examDate}`,
      }));
    }]);
  }

  if (ctx.classId) {
    const classId = ctx.classId;
    sources.push(['reminders', async () => (await api.reminders.list(classId)).map((r) => ({
      id: `rem:${r.id}`,
      source: 'srcReminder' as ShellKey,
      title: r.title,
      subtitle: [new Date(r.remindAt).toLocaleDateString(ctx.tag, { weekday: 'short', day: 'numeric', month: 'short' }), r.createdByName].filter(Boolean).join(' · '),
      keywords: r.body,
      href: '/reminders',
    }))]);
  }

  if (ctx.username) {
    sources.push(['todos', async () => (await api.todos.list(ctx.username)).map((td) => ({
      id: `todo:${td.id}`,
      source: 'srcTodo' as ShellKey,
      title: td.title,
      subtitle: td.dueAt ? new Date(td.dueAt).toLocaleDateString(ctx.tag, { weekday: 'short', day: 'numeric', month: 'short' }) : undefined,
      keywords: td.details,
      href: '/todos',
    }))]);
  }

  sources.push(['mensa', async () => {
    const days = upcomingDays(dishesFrom(await fetchMensa()));
    return days.flatMap((d) => d.dishes.map((dish) => ({
      id: `dish:${dish.id}`,
      source: 'srcDish' as ShellKey,
      title: localized(dish.name, ctx.locale),
      subtitle: d.date.toLocaleDateString(ctx.tag, { weekday: 'long', day: 'numeric', month: 'short' }),
      keywords: `${dish.category ?? ''} ${(dish.tags ?? []).join(' ')}`,
      href: '/canteen',
    })));
  }]);

  for (const [name, task] of sources) run(name, emit, task);
}
