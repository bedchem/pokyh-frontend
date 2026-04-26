'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, TrendingUp, BookOpen, MessageCircle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/providers/SessionProvider';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import { fetchTimetable, fetchGrades, fetchMensa, fetchMessages } from '@/lib/api';
import { subjectColor, gradeColor, averageColor } from '@/lib/colors';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TimetableEntry, MessagePreview, Dish } from '@/lib/types';

interface RecentGrade {
  id: number;
  subjectName: string;
  markDisplayValue: number;
  date: number;
  examType: string;
}

function parseTime(t: number): string {
  const s = t.toString().padStart(4, '0');
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

function formatGradeDate(d: number): string {
  const s = d.toString();
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.`;
}

function senderInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

function senderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash << 5) - hash + name.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

function formatMessageDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0)
      return date.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return date.toLocaleDateString('de', { weekday: 'short' });
    return date.toLocaleDateString('de', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

function parseTimetableResult(json: unknown): TimetableEntry[] {
  try {
    const root = json as Record<string, unknown>;
    const wData = (
      (root?.data as Record<string, unknown>)?.result as Record<string, unknown>
    )?.data as Record<string, unknown>;
    const elementPeriods = wData?.elementPeriods as Record<string, unknown[]>;
    const elements = wData?.elements as Array<Record<string, unknown>>;
    if (!elementPeriods || !elements) return [];

    const subjectMap: Record<number, { name: string; longName: string }> = {};
    const teacherMap: Record<number, string> = {};
    const roomMap: Record<number, string> = {};

    elements.forEach((el) => {
      if (el.type === 3)
        subjectMap[el.id as number] = {
          name: el.name as string,
          longName:
            (el.displayname as string) ??
            (el.longName as string) ??
            (el.name as string),
        };
      if (el.type === 2) teacherMap[el.id as number] = el.name as string;
      if (el.type === 4) roomMap[el.id as number] = el.name as string;
    });

    const entries: TimetableEntry[] = [];
    Object.values(elementPeriods)
      .flat()
      .forEach((period: unknown) => {
        const p = period as Record<string, unknown>;
        const refs = (p.elements as Array<Record<string, unknown>>) ?? [];
        const subRef = refs.find((r) => r.type === 3);
        const teaRef = refs.find((r) => r.type === 2);
        const roomRef = refs.find((r) => r.type === 4);
        const cellState = (p.cellState as string) ?? 'STANDARD';
        const isInfo = p.is as Record<string, unknown> | undefined;
        const isCancelled =
          cellState === 'CANCEL' || (isInfo?.cancelled as boolean) === true;
        entries.push({
          id: p.id as number,
          lessonId: p.lessonId as number,
          date: p.date as number,
          startTime: p.startTime as number,
          endTime: p.endTime as number,
          subjectName: subjectMap[subRef?.id as number]?.name ?? '',
          subjectLong: subjectMap[subRef?.id as number]?.longName ?? '',
          teacherName: teacherMap[teaRef?.id as number] ?? '',
          roomName: roomMap[roomRef?.id as number] ?? '',
          cellState: cellState as TimetableEntry['cellState'],
          isExam: (isInfo?.exam as boolean) === true,
          isCancelled,
          isSubstitution: cellState === 'SUBSTITUTION',
          isAdditional: cellState === 'ADDITIONAL',
        });
      });
    return entries.sort((a, b) => a.date - b.date || a.startTime - b.startTime);
  } catch {
    return [];
  }
}

function parseGradesResult(json: unknown): {
  avg: number | null;
  subjectCount: number;
  recentGrades: RecentGrade[];
} {
  try {
    const root = json as Record<string, unknown>;
    const subjectsRaw = (root?.subjects ?? []) as Array<Record<string, unknown>>;

    const vals: number[] = [];
    const recent: RecentGrade[] = [];

    subjectsRaw.forEach((s) => {
      const grades = (s.grades ?? []) as Array<Record<string, unknown>>;
      grades.forEach((g) => {
        const mdv = (g.markDisplayValue as number) ?? 0;
        if (mdv === 0) return;
        vals.push(mdv);
        recent.push({
          id: g.id as number,
          subjectName: (s.subjectName as string) ?? '',
          markDisplayValue: mdv,
          date: g.date as number,
          examType: (g.examType as string) ?? '',
        });
      });
    });

    return {
      avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      subjectCount: subjectsRaw.length,
      recentGrades: recent.sort((a, b) => b.date - a.date).slice(0, 3),
    };
  } catch {
    return { avg: null, subjectCount: 0, recentGrades: [] };
  }
}

function parseMessagesResult(json: unknown): MessagePreview[] {
  try {
    const root = json as Record<string, unknown>;
    const arr =
      (root?.incomingMessages as unknown[]) ??
      (root?.messages as unknown[]) ??
      ((root?.data as Record<string, unknown>)?.incomingMessages as unknown[]) ??
      (Array.isArray(root?.data) ? (root.data as unknown[]) : null) ??
      [];
    return (arr as Record<string, unknown>[]).map((m) => {
      const sender =
        typeof m.sender === 'object' && m.sender !== null
          ? (m.sender as Record<string, unknown>)
          : null;
      const senderName =
        (sender?.displayName as string) ??
        (sender?.name as string) ??
        (m.senderName as string) ??
        'Unbekannt';
      const sentDate =
        (m.sentDateTime as string) ??
        (m.sentDate as string) ??
        (m.date as string) ??
        '';
      return {
        id: m.id as number,
        subject: (m.subject as string) ?? '(Kein Betreff)',
        contentPreview: (m.contentPreview as string) ?? '',
        senderName,
        senderId: (sender?.userId as number) ?? 0,
        sentDate,
        isRead: (m.isRead as boolean) ?? true,
        hasAttachments: (m.hasAttachments as boolean) ?? false,
      };
    });
  } catch {
    return [];
  }
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

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>
        {title}
      </h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
          Alle <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  href?: string;
}) {
  const inner = (
    <div
      className="rounded-2xl p-4 fade-in card-hover h-full"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
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
  const router = useRouter();
  const [allEntries, setAllEntries] = useState<TimetableEntry[]>([]);
  const [nextExam, setNextExam] = useState<TimetableEntry | null>(null);
  const [overallAvg, setOverallAvg] = useState<number | null>(null);
  const [subjectCount, setSubjectCount] = useState(0);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [messages, setMessages] = useState<MessagePreview[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ttRes, grRes, msRes, menRes, tt1Res, tt2Res] = await Promise.allSettled([
        fetchTimetable(),
        fetchGrades(),
        fetchMessages(),
        fetchMensa(),
        fetchTimetable(format(addDays(new Date(), 7), 'yyyy-MM-dd')),
        fetchTimetable(format(addDays(new Date(), 14), 'yyyy-MM-dd')),
      ]);

      const anyExpired = [ttRes, grRes, msRes].some(
        (r) => r.status === 'rejected' && r.reason?.message === 'session_expired'
      );
      if (anyExpired) {
        router.replace('/login');
        return;
      }

      if (ttRes.status === 'fulfilled')
        setAllEntries(parseTimetableResult(ttRes.value));

      // Find next exam across current + next 2 weeks
      const todayNum = parseInt(format(new Date(), 'yyyyMMdd'));
      const examEntries = [ttRes, tt1Res, tt2Res]
        .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
        .flatMap((r) => parseTimetableResult(r.value))
        .filter((e) => e.isExam && !e.isCancelled && e.date >= todayNum)
        .sort((a, b) => a.date - b.date || a.startTime - b.startTime);
      setNextExam(examEntries[0] ?? null);

      if (grRes.status === 'fulfilled') {
        const { avg, subjectCount: sc, recentGrades: rg } = parseGradesResult(grRes.value);
        setOverallAvg(avg);
        setSubjectCount(sc);
        setRecentGrades(rg);
      }

      if (msRes.status === 'fulfilled')
        setMessages(parseMessagesResult(msRes.value));

      if (menRes.status === 'fulfilled') {
        const raw = menRes.value as Record<string, unknown>;
        const arr = (Array.isArray(menRes.value)
          ? menRes.value
          : ((raw?.menu as Record<string, unknown>)?.dishes ?? raw?.dishes ?? raw?.data ?? [])) as Dish[];
        const todayIso = format(new Date(), 'yyyy-MM-dd');
        const todayDishes = arr.filter((d) => d.date?.startsWith(todayIso));
        setDishes(todayDishes.slice(0, 3));
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const todayDateNum = parseInt(format(new Date(), 'yyyyMMdd'));
  const todayEntries = allEntries
    .filter((e) => e.date === todayDateNum)
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
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">

            {/* Welcome header */}
            <div className="mb-6 fade-in">
              <p className="text-sm mb-1" style={{ color: 'var(--app-text-secondary)' }}>
                {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
              </p>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
                {greeting}, <span style={{ color: 'var(--accent)' }}>{user?.username ?? '…'}</span>
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size={28} />
              </div>
            ) : (
              <div className="flex flex-col gap-6">

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-in delay-1">
                  <StatCard
                    label="Unterrichtsende"
                    value={lastActive ? parseTime(lastActive.endTime) : '–'}
                    sub={firstActive ? `Start: ${parseTime(firstActive.startTime)}` : 'Kein Unterricht'}
                    color="var(--accent)"
                    icon={Clock}
                  />
                  <StatCard
                    label="Notenschnitt"
                    value={overallAvg != null ? overallAvg.toFixed(2) : '–'}
                    sub={`${subjectCount} ${subjectCount === 1 ? 'Fach' : 'Fächer'}`}
                    color={overallAvg != null ? averageColor(overallAvg) : 'var(--app-text-secondary)'}
                    icon={TrendingUp}
                    href="/grades"
                  />
                  <StatCard
                    label="Stunden heute"
                    value={String(todayEntries.length)}
                    sub={activeTodayEntries.length !== todayEntries.length ? `${activeTodayEntries.length} aktiv` : undefined}
                    color="var(--tint)"
                    icon={BookOpen}
                    href="/timetable"
                  />
                  <StatCard
                    label="Nachrichten"
                    value={String(messages.length)}
                    sub={unreadCount > 0 ? `${unreadCount} ungelesen` : 'Alle gelesen'}
                    color={unreadCount > 0 ? 'var(--danger)' : 'var(--app-text-secondary)'}
                    icon={MessageCircle}
                    href="/messages"
                  />
                </div>

                {/* Two-column layout on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Today's schedule */}
                  <section className="fade-in delay-2">
                    <SectionHeader
                      title={`Heute · ${format(new Date(), 'd. MMMM', { locale: de })}`}
                      href="/timetable"
                    />
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                      {todayEntries.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>Kein Unterricht heute</p>
                        </div>
                      ) : (
                        todayEntries.map((e, i) => {
                          const accentColor = e.isCancelled ? 'var(--danger)' : e.isExam ? 'var(--warning)' : e.isSubstitution ? 'var(--orange)' : subjectColor(e.subjectName);
                          return (
                            <div
                              key={e.id}
                              className="flex items-center gap-3 px-4 py-3"
                              style={{ borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none' }}
                            >
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
                                {e.isExam && !e.isCancelled && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--warning) 20%, transparent)', color: 'var(--warning)' }}>Prüfung</span>
                                )}
                                {e.isCancelled && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}>Entfall</span>
                                )}
                                {e.isSubstitution && !e.isCancelled && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--orange) 20%, transparent)', color: 'var(--orange)' }}>Vertretung</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>

                  {/* Right column: exam + grades + messages */}
                  <div className="flex flex-col gap-6">

                    {/* Next exam */}
                    {nextExam && (
                      <section className="fade-in delay-2">
                        <SectionHeader title="Nächste Prüfung" href="/timetable" />
                        <div
                          className="rounded-2xl p-4"
                          style={{
                            background: 'var(--app-surface)',
                            border: '1px solid color-mix(in srgb, var(--warning) 35%, var(--app-border))',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'color-mix(in srgb, var(--warning) 18%, transparent)' }}
                            >
                              <FileText size={20} color="var(--warning)" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>
                                {nextExam.subjectLong || nextExam.subjectName}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
                                {formatExamDate(nextExam.date)} · {parseTime(nextExam.startTime)}
                                {nextExam.roomName ? ` · ${nextExam.roomName}` : ''}
                              </p>
                            </div>
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                              style={{ background: 'color-mix(in srgb, var(--warning) 18%, transparent)', color: 'var(--warning)' }}
                            >
                              {daysUntilLabel(nextExam.date)}
                            </span>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Recent grades */}
                    {recentGrades.length > 0 && (
                      <section className="fade-in delay-3">
                        <SectionHeader title="Letzte Noten" href="/grades" />
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                          {recentGrades.map((g, i) => (
                            <div
                              key={g.id}
                              className="px-4 py-3 flex items-center gap-3"
                              style={{ borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none' }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--app-text-primary)' }}>{g.subjectName || '–'}</p>
                                <p className="text-xs" style={{ color: 'var(--app-text-tertiary)' }}>{g.examType || 'Note'} · {formatGradeDate(g.date)}</p>
                              </div>
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: gradeColor(g.markDisplayValue) }}>
                                {g.markDisplayValue}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Messages preview */}
                    {messages.length > 0 && (
                      <section className="fade-in delay-4">
                        <SectionHeader title="Nachrichten" href="/messages" />
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                          {messages.slice(0, 3).map((msg, i) => (
                            <Link
                              key={msg.id}
                              href={`/messages/${msg.id}`}
                              className="px-4 py-3 flex items-center gap-3 press-scale"
                              style={{ borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none', display: 'flex' }}
                            >
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

                {/* Mensa heute */}
                {dishes.length > 0 && (
                  <section className="fade-in delay-5">
                    <SectionHeader title="Mensa heute" href="/mensa" />
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                      {dishes.map((dish, i) => (
                        <div
                          key={dish.id}
                          className="px-4 py-3 flex items-center gap-3"
                          style={{ borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate" style={{ color: 'var(--app-text-primary)' }}>
                              {typeof dish.name === 'object' ? ((dish.name as Record<string, string>).de ?? String(dish.name)) : dish.name}
                            </p>
                            {dish.price != null && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>€{dish.price.toFixed(2)}</p>
                            )}
                          </div>
                          {dish.tags && dish.tags.length > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--tint) 15%, transparent)', color: 'var(--tint)' }}>
                              {dish.tags[0]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
