'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, TrendingUp, BookOpen, MessageCircle, FileText, Star } from 'lucide-react';
import { useSession } from '@/providers/SessionProvider';
import { useFirebase } from '@/providers/FirebaseProvider';
import { api } from '@/lib/api-client';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import {
  fetchTimetable, fetchGrades, fetchMensa, fetchMessages,
  getTimetableStale, getGradesStale, getMessagesStale,
} from '@/lib/api';
import { subjectColor, averageColor } from '@/lib/colors';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TimetableEntry, MessagePreview, Dish } from '@/lib/types';

interface RecentGrade {
  id: number;
  subjectName: string;
  subjectLessonId: number;
  markDisplayValue: number;
  date: number;
  examType: string;
}

function parseTime(t: number): string {
  const s = t.toString().padStart(4, '0');
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

function toMins(t: number): number {
  const s = t.toString().padStart(4, '0');
  return parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(2, 4));
}

const SCHOOL_PERIODS = [
  { s: 470, e: 520 }, { s: 520, e: 570 }, { s: 570, e: 620 },
  { s: 635, e: 685 }, { s: 685, e: 735 }, { s: 735, e: 785 },
  { s: 795, e: 845 }, { s: 845, e: 895 }, { s: 905, e: 955 }, { s: 955, e: 1005 },
];

function countPeriods(entries: TimetableEntry[]): number {
  return SCHOOL_PERIODS.filter(p =>
    entries.some(e => toMins(e.startTime) <= p.s && toMins(e.endTime) >= p.e)
  ).length;
}

function formatGradeDate(d: number): string {
  const s = d.toString();
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.`;
}

function gradePillTone(value: number): string {
  return value >= 6.5 ? '#28c281' : '#f3a53a';
}

function senderInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

function senderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash << 5) - hash + name.charCodeAt(i);
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
}

function formatMessageDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return date.toLocaleDateString('de', { weekday: 'short' });
    return date.toLocaleDateString('de', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
}

function parseTimetableResult(json: unknown): TimetableEntry[] {
  try {
    const root = json as { days?: any[] };
    if (!root.days) return [];

    const entries: TimetableEntry[] = [];

    for (const day of root.days) {
      if (!day.gridEntries?.length) continue;
      const dateNum = parseInt(day.date.replace(/-/g, ''), 10);

      for (const ge of day.gridEntries) {
        const [startH, startM] = ge.duration.start.split('T')[1].split(':').map(Number);
        const [endH, endM]     = ge.duration.end.split('T')[1].split(':').map(Number);
        const startTime = startH * 100 + startM;
        const endTime   = endH   * 100 + endM;

        const pos1 = ge.position1 ?? [];
        const pos2 = ge.position2 ?? [];
        const pos3 = ge.position3 ?? [];

        const activeTeachers      = pos1.filter((p: any) => p.current).map((p: any) => p.current!.displayName).filter(Boolean);
        const activeTeachersLong  = pos1.filter((p: any) => p.current).map((p: any) => p.current!.longName || p.current!.displayName).filter(Boolean);
        const removedTeachers     = pos1.filter((p: any) => p.removed).map((p: any) => p.removed!.displayName).filter(Boolean);
        const removedTeachersLong = pos1.filter((p: any) => p.removed).map((p: any) => p.removed!.longName || p.removed!.displayName).filter(Boolean);

        const activeSub  = pos2.find((p: any) => p.current)?.current ?? null;
        const removedSub = pos2.find((p: any) => p.removed)?.removed ?? null;

        const activeRooms  = pos3.filter((p: any) => p.current).map((p: any) => p.current!.displayName).filter(Boolean);
        const removedRooms = pos3.filter((p: any) => p.removed).map((p: any) => p.removed!.displayName).filter(Boolean);

        const isExam         = ge.type === 'EXAM';
        const isCancelled    = ge.status === 'CANCELLED';
        const isChanged      = ge.status === 'CHANGED';
        const isSubstitution = isChanged && removedTeachers.length > 0;

        entries.push({
          id:               ge.ids[0],
          lessonId:         ge.ids[0],
          date:             dateNum,
          startTime,
          endTime,
          subjectName:      activeSub?.shortName  ?? removedSub?.shortName  ?? '',
          subjectLong:      activeSub?.longName   ?? removedSub?.longName   ?? '',
          teacherName:      activeTeachers.join(', '),
          teacherLongName:  activeTeachersLong.join(', ') || undefined,
          roomName:         activeRooms.join(', '),
          cellState:        isCancelled ? 'CANCEL' : isChanged ? 'SUBSTITUTION' : 'STANDARD',
          isExam,
          isCancelled,
          isSubstitution,
          isAdditional:     ge.type === 'ADDITIONAL',
          originalSubject:     removedSub?.shortName ?? '',
          originalSubjectLong: removedSub?.longName  ?? '',
          originalTeacher:     removedTeachers.join(', '),
          originalTeacherLong: removedTeachersLong.join(', ') || undefined,
          originalRoom:     removedRooms.join(', '),
          note:             ge.lessonInfo || ge.lessonText || undefined,
        });
      }
    }

    return entries.sort((a, b) =>
      a.date !== b.date ? a.date - b.date : a.startTime - b.startTime,
    );
  } catch {
    return [];
  }
}

function parseGradesResult(json: unknown): { avg: number | null; subjectCount: number; recentGrades: RecentGrade[] } {
  try {
    const subjectsRaw = ((json as Record<string, unknown>)?.subjects ?? []) as Array<Record<string, unknown>>;
    const vals: number[] = [];
    const recent: RecentGrade[] = [];
    subjectsRaw.forEach((s) => {
      ((s.grades ?? []) as Array<Record<string, unknown>>).forEach((g) => {
        const mdv = (g.markDisplayValue as number) ?? 0;
        if (!mdv) return;
        vals.push(mdv);
        recent.push({ id: g.id as number, subjectName: (s.subjectName as string) ?? '', subjectLessonId: (s.lessonId as number) ?? 0, markDisplayValue: mdv, date: g.date as number, examType: (g.examType as string) ?? '' });
      });
    });
    return { avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, subjectCount: subjectsRaw.length, recentGrades: recent.sort((a, b) => b.date - a.date).slice(0, 3) };
  } catch { return { avg: null, subjectCount: 0, recentGrades: [] }; }
}

function parseMessagesResult(json: unknown): MessagePreview[] {
  try {
    const root = json as Record<string, unknown>;
    const arr = (root?.incomingMessages as unknown[]) ?? (root?.messages as unknown[]) ?? ((root?.data as Record<string, unknown>)?.incomingMessages as unknown[]) ?? (Array.isArray(root?.data) ? root.data as unknown[] : null) ?? [];
    return (arr as Record<string, unknown>[]).map((m) => {
      const sender = typeof m.sender === 'object' && m.sender !== null ? (m.sender as Record<string, unknown>) : null;
      const senderName = (sender?.displayName as string) ?? (sender?.name as string) ?? (m.senderName as string) ?? 'Unbekannt';
      const sentDate = (m.sentDateTime as string) ?? (m.sentDate as string) ?? (m.date as string) ?? '';
      return { id: m.id as number, subject: (m.subject as string) ?? '(Kein Betreff)', contentPreview: (m.contentPreview as string) ?? '', senderName, senderId: (sender?.userId as number) ?? 0, sentDate, isRead: (m.isRead as boolean) ?? true, hasAttachments: (m.hasAttachments as boolean) ?? false };
    });
  } catch { return []; }
}

function formatExamDate(d: number): string {
  const s = d.toString();
  const date = new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(4, 6)) - 1, parseInt(s.slice(6, 8)));
  return date.toLocaleDateString('de', { weekday: 'short', day: 'numeric', month: 'short' });
}

function daysUntilLabel(d: number): string {
  const s = d.toString();
  const date = new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(4, 6)) - 1, parseInt(s.slice(6, 8)));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  return `in ${diff} Tagen`;
}

function resolveName(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  const obj = raw as Record<string, string>;
  return obj.de ?? obj.it ?? obj.en ?? String(raw);
}

function prioritizedDishTags(tags?: string[]): string[] {
  if (!tags?.length) return [];
  const vegan: string[] = [];
  const vegetarian: string[] = [];
  const other: string[] = [];

  for (const tag of tags) {
    const normalized = tag.toLowerCase();
    if (normalized.includes('vegan')) {
      vegan.push(tag);
      continue;
    }
    if (normalized.includes('vegetar')) {
      vegetarian.push(tag);
      continue;
    }
    other.push(tag);
  }

  return [...vegan, ...vegetarian, ...other];
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  suppe:   'linear-gradient(135deg, #FF9F43 0%, #EE5A24 100%)',
  pasta:   'linear-gradient(135deg, #F8C291 0%, #E55039 100%)',
  fleisch: 'linear-gradient(135deg, #B8860B 0%, #8B4513 100%)',
  fisch:   'linear-gradient(135deg, #0066CC 0%, #003366 100%)',
  salat:   'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
  dessert: 'linear-gradient(135deg, #e84393 0%, #c0392b 100%)',
  vegan:   'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
  default: 'linear-gradient(135deg, #636e72 0%, #2d3436 100%)',
};

function dishPlaceholderBg(dish: Dish): string {
  const cat = (dish.category ?? '').toLowerCase();
  for (const key of Object.keys(CATEGORY_GRADIENTS)) {
    if (cat.includes(key)) return CATEGORY_GRADIENTS[key];
  }
  if (dish.tags?.some((t) => t.toLowerCase().includes('vegan'))) return CATEGORY_GRADIENTS.vegan;
  return CATEGORY_GRADIENTS.default;
}

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  vegan:       { bg: 'color-mix(in srgb, #30D158 18%, transparent)', fg: '#30D158' },
  vegetarisch: { bg: 'color-mix(in srgb, #4ED87A 18%, transparent)', fg: '#4ED87A' },
  vegetarian:  { bg: 'color-mix(in srgb, #4ED87A 18%, transparent)', fg: '#4ED87A' },
  glutenfrei:  { bg: 'color-mix(in srgb, #FFD60A 18%, transparent)', fg: '#B8950A' },
  halal:       { bg: 'color-mix(in srgb, #0A84FF 18%, transparent)', fg: '#0A84FF' },
};

function MensaTagBadge({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag.toLowerCase()] ?? {
    bg: 'color-mix(in srgb, var(--app-text-secondary) 15%, transparent)',
    fg: 'var(--app-text-secondary)',
  };
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.fg }}>
      {tag}
    </span>
  );
}

function MiniStars({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => {
          const fill = Math.min(1, Math.max(0, value - (s - 1)));
          return (
            <div key={s} className="relative" style={{ width: 11, height: 11 }}>
              <Star size={11} fill="none" color="var(--app-text-tertiary)" />
              {fill > 0 && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star size={11} fill="#FFD60A" color="#FFD60A" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-[11px] font-semibold" style={{ color: 'var(--app-text-secondary)' }}>
        {value.toFixed(1)}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--app-text-tertiary)' }}>
        ({count})
      </span>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
          Alle <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon: Icon, href }: { label: string; value: string; sub?: string; color: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; href?: string }) {
  const inner = (
    <div className="rounded-2xl p-4 fade-in card-hover h-full" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>
      <p className="text-2xl font-bold leading-none mb-1" style={{ color }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: 'var(--app-text-secondary)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-tertiary)' }}>{sub}</p>}
    </div>
  );
  if (href) return <Link href={href} className="block press-scale">{inner}</Link>;
  return inner;
}

export default function HomePage() {
  const { user } = useSession();
  const { stableUid } = useFirebase();
  const [allEntries, setAllEntries] = useState<TimetableEntry[]>([]);
  const [nextExam, setNextExam] = useState<TimetableEntry | null>(null);
  const [overallAvg, setOverallAvg] = useState<number | null>(null);
  const [subjectCount, setSubjectCount] = useState(0);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [messages, setMessages] = useState<MessagePreview[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishRatings, setDishRatings] = useState<Record<string, { value: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const ratingsFetched = useRef(false);

  const load = useCallback(async () => {
    // Phase 0: render instantly from localStorage cache (no spinner if data exists)
    const staleTt = getTimetableStale();
    const staleGr = getGradesStale();
    const staleMs = getMessagesStale();
    const todayNum = parseInt(format(new Date(), 'yyyyMMdd'));

    if (staleTt !== undefined || staleGr !== undefined || staleMs !== undefined) {
      if (staleTt !== undefined) {
        const entries = parseTimetableResult(staleTt);
        setAllEntries(entries);
        setNextExam(entries.filter((e) => e.isExam && !e.isCancelled && e.date >= todayNum).sort((a, b) => a.date - b.date || a.startTime - b.startTime)[0] ?? null);
      }
      if (staleGr !== undefined) {
        const { avg, subjectCount: sc, recentGrades: rg } = parseGradesResult(staleGr);
        setOverallAvg(avg); setSubjectCount(sc); setRecentGrades(rg);
      }
      if (staleMs !== undefined) setMessages(parseMessagesResult(staleMs));
      setLoading(false);
    }

    // Phase 1: fetch fresh critical data
    try {
      const [ttRes, grRes, msRes] = await Promise.allSettled([
        fetchTimetable(),
        fetchGrades(),
        fetchMessages(),
      ]);

      const anyExpired = [ttRes, grRes, msRes].some(
        (r) => r.status === 'rejected' && (r as PromiseRejectedResult).reason?.message === 'session_expired'
      );
      if (anyExpired) { window.location.replace('/login'); return; }

      if (ttRes.status === 'fulfilled') {
        const entries = parseTimetableResult(ttRes.value);
        setAllEntries(entries);
        setNextExam(entries.filter((e) => e.isExam && !e.isCancelled && e.date >= todayNum).sort((a, b) => a.date - b.date || a.startTime - b.startTime)[0] ?? null);
      }
      if (grRes.status === 'fulfilled') {
        const { avg, subjectCount: sc, recentGrades: rg } = parseGradesResult(grRes.value);
        setOverallAvg(avg); setSubjectCount(sc); setRecentGrades(rg);
      }
      if (msRes.status === 'fulfilled') setMessages(parseMessagesResult(msRes.value));
      setLoading(false);

      // Phase 2: mensa + extended timetable for exam detection (background)
      const [menRes, tt1Res, tt2Res] = await Promise.allSettled([
        fetchMensa(),
        fetchTimetable(format(addDays(new Date(), 7), 'yyyy-MM-dd')),
        fetchTimetable(format(addDays(new Date(), 14), 'yyyy-MM-dd')),
      ]);

      const examEntries = [ttRes, tt1Res, tt2Res]
        .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
        .flatMap((r) => parseTimetableResult(r.value))
        .filter((e) => e.isExam && !e.isCancelled && e.date >= todayNum)
        .sort((a, b) => a.date - b.date || a.startTime - b.startTime);
      setNextExam(examEntries[0] ?? null);

      if (menRes.status === 'fulfilled') {
        const raw = menRes.value as Record<string, unknown>;
        const arr = (Array.isArray(menRes.value) ? menRes.value : ((raw?.menu as Record<string, unknown>)?.dishes ?? raw?.dishes ?? raw?.data ?? [])) as Dish[];
        const todayIso = format(new Date(), 'yyyy-MM-dd');
        setDishes(arr.filter((d) => d.date?.startsWith(todayIso)).slice(0, 3));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!stableUid || dishes.length === 0 || ratingsFetched.current) return;
    ratingsFetched.current = true;

    const dishIds = dishes.map((dish) => dish.id);
    api.dishRatings.getBatch(dishIds)
      .then((batch) => {
        const ratings: Record<string, { value: number; count: number }> = {};
        for (const [dishId, data] of Object.entries(batch)) {
          const values = Object.values(data.ratings);
          ratings[dishId] = {
            value: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
            count: values.length,
          };
        }
        setDishRatings(ratings);
      })
      .catch((e) => console.error('[home] mensa ratings fetch error:', e));
  }, [stableUid, dishes]);

  const todayDateNum = parseInt(format(new Date(), 'yyyyMMdd'));
  const todayEntriesRaw = allEntries.filter((e) => e.date === todayDateNum);

  // Group entries sharing the same startTime to count "hours" correctly
  // (mirrors logic from timetable/page.tsx's buildSlots)
  const timeGroups = new Map<number, TimetableEntry[]>();
  todayEntriesRaw.forEach(e => {
    if (!timeGroups.has(e.startTime)) timeGroups.set(e.startTime, []);
    timeGroups.get(e.startTime)!.push(e);
  });
  
  // Create one slot per unique start time (prioritize active entries)
  const todayEntries = Array.from(timeGroups.entries())
    .map(([, group]) => {
      const active = group.find(e => !e.isCancelled);
      return active ?? group[0]; // fallback to cancelled if no active
    })
    .sort((a, b) => a.startTime - b.startTime);

  const activeTodayEntries = todayEntries.filter((e) => !e.isCancelled);
  const firstActive = activeTodayEntries[0] ?? null;
  const lastActive = activeTodayEntries[activeTodayEntries.length - 1] ?? null;
  const unreadCount = messages.filter((m) => !m.isRead).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : 'Guten Abend';

  return (
    <AuthGuard>
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">

            <div className="mb-6 fade-in">
              <p className="text-sm mb-1" style={{ color: 'var(--app-text-secondary)' }}>
                {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
              </p>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
                {greeting}, <span style={{ color: 'var(--accent)' }}>{user?.username ?? '…'}</span>
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Spinner size={28} /></div>
            ) : (
              <div className="flex flex-col gap-6">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-in">
                  <StatCard label="Unterrichtsende" value={lastActive ? parseTime(lastActive.endTime) : '–'} sub={firstActive ? `Start: ${parseTime(firstActive.startTime)}` : 'Kein Unterricht'} color="var(--accent)" icon={Clock} />
                  <StatCard label="Notenschnitt" value={overallAvg != null ? overallAvg.toFixed(2) : '–'} sub={`${subjectCount} ${subjectCount === 1 ? 'Fach' : 'Fächer'}`} color={overallAvg != null ? averageColor(overallAvg) : 'var(--app-text-secondary)'} icon={TrendingUp} href="/grades" />
                  <StatCard label="Stunden heute" value={String(countPeriods(activeTodayEntries))} sub={activeTodayEntries.length !== todayEntries.length ? `${activeTodayEntries.length} aktiv` : undefined} color="var(--tint)" icon={BookOpen} href="/timetable" />
                  <StatCard label="Nachrichten" value={String(messages.length)} sub={unreadCount > 0 ? `${unreadCount} ungelesen` : 'Alle gelesen'} color={unreadCount > 0 ? 'var(--danger)' : 'var(--app-text-secondary)'} icon={MessageCircle} href="/messages" />
                </div>

                {dishes.length > 0 && (
                  <section className="fade-in">
                    <SectionHeader title="Mensa heute" href="/mensa" />
                    <div className="flex flex-col gap-2.5">
                      {dishes.map((dish) => {
                        const name = resolveName(dish.name);
                        const desc = dish.description ? resolveName(dish.description) : null;
                        const rating = dishRatings[dish.id] ?? { value: 0, count: 0 };
                        return (
                          <Link
                            key={dish.id}
                            href="/mensa"
                            className="w-full rounded-2xl overflow-hidden press-scale flex"
                            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
                          >
                            <div className="relative flex-shrink-0" style={{ width: 100, height: 110 }}>
                              {dish.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={dish.imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full" style={{ background: dishPlaceholderBg(dish) }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-between" style={{ minHeight: 110 }}>
                              <div>
                                <p className="text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: 'var(--app-text-primary)' }}>
                                  {name}
                                </p>
                                {desc && (
                                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--app-text-secondary)' }}>
                                    {desc}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2 flex flex-col gap-1.5">
                                {rating.count > 0 ? (
                                  <MiniStars value={rating.value} count={rating.count} />
                                ) : (
                                  <div className="flex gap-0.5 items-center">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={11} fill="none" color="var(--app-text-tertiary)" />
                                    ))}
                                    <span className="text-[10px] ml-1" style={{ color: 'var(--app-text-tertiary)' }}>
                                      Noch keine Bewertung
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap gap-1">
                                    {prioritizedDishTags(dish.tags).slice(0, 2).map((tag) => <MensaTagBadge key={tag} tag={tag} />)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  <section className="fade-in">
                    <SectionHeader title={`Heute · ${format(new Date(), 'd. MMMM', { locale: de })}`} href="/timetable" />
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                      {todayEntries.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>Kein Unterricht heute</p>
                        </div>
                      ) : (
                        todayEntries.map((e, i) => {
                          const accentColor = e.isCancelled ? 'var(--danger)' : e.isExam ? 'var(--warning)' : e.isSubstitution ? 'var(--orange)' : subjectColor(e.subjectName);
                          return (
                            <Link key={e.id} href={`/timetable?open=${e.id}`} className="flex items-center gap-3 px-4 py-3 press-scale" style={{ borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none', display: 'flex' }}>
                              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: accentColor, minHeight: 32 }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--app-text-primary)', textDecoration: e.isCancelled ? 'line-through' : 'none', opacity: e.isCancelled ? 0.5 : 1 }}>
                                  {e.subjectLong || e.subjectName}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
                                  {parseTime(e.startTime)} – {parseTime(e.endTime)}{e.roomName ? ` · ${e.roomName}` : ''}
                                </p>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                {e.isExam && !e.isCancelled && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--warning) 20%, transparent)', color: 'var(--warning)' }}>Prüfung</span>}
                                {e.isCancelled && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}>Entfall</span>}
                                {e.isSubstitution && !e.isCancelled && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--orange) 20%, transparent)', color: 'var(--orange)' }}>Vertretung</span>}
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </section>

                  <div className="flex flex-col gap-6">

                    {nextExam && (
                      <section className="fade-in">
                        <SectionHeader title="Nächste Prüfung" href="/timetable" />
                        <Link href={`/timetable?open=${nextExam.id}&date=${nextExam.date}`} className="block rounded-2xl p-4 press-scale" style={{ background: 'var(--app-surface)', border: '1px solid color-mix(in srgb, var(--warning) 35%, var(--app-border))' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--warning) 18%, transparent)' }}>
                              <FileText size={20} color="var(--warning)" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>{nextExam.subjectLong || nextExam.subjectName}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
                                {formatExamDate(nextExam.date)} · {parseTime(nextExam.startTime)}{nextExam.roomName ? ` · ${nextExam.roomName}` : ''}
                              </p>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--warning) 18%, transparent)', color: 'var(--warning)' }}>
                              {daysUntilLabel(nextExam.date)}
                            </span>
                          </div>
                        </Link>
                      </section>
                    )}

                    {recentGrades.length > 0 && (
                      <section className="fade-in">
                        <SectionHeader title="Letzte Noten" href="/grades" />
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                          {recentGrades.map((g, i) => (
                            <Link key={g.id} href={`/grades/subject/${g.subjectLessonId}`} className="px-4 py-3 flex items-center gap-3 press-scale" style={{ borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none', display: 'flex' }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--app-text-primary)' }}>{g.subjectName || '–'}</p>
                                <p className="text-xs" style={{ color: 'var(--app-text-tertiary)' }}>{g.examType || 'Note'} · {formatGradeDate(g.date)}</p>
                              </div>
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ color: gradePillTone(g.markDisplayValue), background: `color-mix(in srgb, ${gradePillTone(g.markDisplayValue)} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${gradePillTone(g.markDisplayValue)} 55%, transparent)` }}>
                                {g.markDisplayValue}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {messages.length > 0 && (
                      <section className="fade-in">
                        <SectionHeader title="Nachrichten" href="/messages" />
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                          {messages.slice(0, 3).map((msg, i) => (
                            <Link key={msg.id} href={`/messages/${msg.id}`} className="px-4 py-3 flex items-center gap-3 press-scale" style={{ borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none', display: 'flex' }}>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: senderColor(msg.senderName) }}>
                                {senderInitial(msg.senderName)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate" style={{ color: 'var(--app-text-primary)', fontWeight: msg.isRead ? 400 : 600 }}>{msg.subject}</p>
                                <p className="text-xs truncate" style={{ color: 'var(--app-text-secondary)' }}>{msg.senderName}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <p className="text-xs" style={{ color: 'var(--app-text-tertiary)' }}>{formatMessageDate(msg.sentDate)}</p>
                                {!msg.isRead && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
