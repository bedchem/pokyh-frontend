// Parsers for WebUntis responses that more than one screen reads (the class
// page, the class register, the search). Each takes the proxied JSON as it
// comes and returns plain, typed rows; anything unexpected becomes empty.

import { currentWeekMonday } from './school-week';

export interface ClassRole {
  id: number;
  personId: number;
  foreName: string;
  longName: string;
  duty: { id: number; label: string };
  klasse: { id: number; name: string };
}

export interface ExamRow {
  id?: number;
  subject: string;
  examDate: number;
  startTime: number;
  endTime: number;
  rooms: string[];
  text: string;
  examType?: string;
}

export interface HomeworkLesson {
  id: number;
  subject: string;
}

export interface HomeworkRecord {
  id: number;
  lessonId: number;
  date: number;
  dueDate: number;
  text: string;
  completed: boolean;
}

export interface ClassregEvent {
  id: number;
  elementName: string;
  subjectName: string;
  categoryName: string;
  text: string;
  eventReasonName: string;
  createDate: number;
  createTime: number;
  creatorName: string;
}

function dataOf(raw: unknown): Record<string, unknown> {
  const r = (raw ?? {}) as Record<string, unknown>;
  return ((r.data && typeof r.data === 'object' ? r.data : r) ?? {}) as Record<string, unknown>;
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown, fallback = 0) => (typeof v === 'number' ? v : fallback);

/** Class duties (Klassensprecher, …), one per person and duty. */
export function parseClassServices(raw: unknown): ClassRole[] {
  const roles = (dataOf(raw).classRoles ?? []) as ClassRole[];
  if (!Array.isArray(roles)) return [];
  const seen = new Set<string>();
  return roles.filter((role) => {
    const key = `${role.personId}-${role.duty?.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseExams(raw: unknown): ExamRow[] {
  const exams = dataOf(raw).exams;
  return Array.isArray(exams) ? (exams as ExamRow[]) : [];
}

export function parseHomework(raw: unknown): { homeworks: HomeworkRecord[]; lessons: HomeworkLesson[] } {
  const data = dataOf(raw);
  const homeworks = [...((data.homeworks as HomeworkRecord[]) ?? []), ...((data.records as HomeworkRecord[]) ?? [])];
  return { homeworks, lessons: (data.lessons ?? []) as HomeworkLesson[] };
}

export function parseClassregEvents(raw: unknown): ClassregEvent[] {
  const rows = dataOf(raw).rows;
  if (!Array.isArray(rows)) return [];
  return rows.map((value, index) => {
    const e = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
    return {
      id: num(e.id, index),
      elementName: text(e.elementName),
      subjectName: text(e.subjectName),
      categoryName: text(e.categoryName),
      text: text(e.text),
      eventReasonName: text(e.eventReasonName),
      createDate: num(e.createDate),
      createTime: num(e.createTime),
      creatorName: text(e.creatorName),
    };
  });
}

/** YYYYMMDD → local Date. */
export function untisDate(d: number): Date {
  return new Date(Math.floor(d / 10000), (Math.floor(d / 100) % 100) - 1, d % 100);
}

/** Date → YYYYMMDD. */
export function untisNum(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Date → "YYYYMMDD". */
export function untisStr(d: Date): string {
  return String(untisNum(d));
}

/**
 * Monday and Friday of the school week `offset` weeks from "this week", which
 * moves on to the next week from Saturday evening (lib/school-week.ts).
 */
export function schoolWeek(offset: number, now = new Date()) {
  const monday = currentWeekMonday(now);
  monday.setDate(monday.getDate() + offset * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { monday, friday, startNum: untisNum(monday), endNum: untisNum(friday), startStr: untisStr(monday), endStr: untisStr(friday) };
}

/**
 * Whether a WebUntis message counts as read. WebUntis sends `isMessageRead`;
 * the other names cover older response shapes.
 */
export function messageIsRead(m: Record<string, unknown>): boolean {
  const raw = m.isMessageRead ?? m.isRead ?? m.read ?? m.isread ?? m.readFlag ?? m.readStatus;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') return raw.toLowerCase() === 'true' || raw === '1';
  return true;
}
