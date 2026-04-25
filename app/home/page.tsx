'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/providers/SessionProvider';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/ui/Spinner';
import { fetchTimetable, fetchGrades, fetchMensa, fetchMessages } from '@/lib/api';
import { subjectColor, gradeColor, averageColor } from '@/lib/colors';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TimetableEntry, MessagePreview, Dish } from '@/lib/types';

interface RecentGrade {
  id: number;
  subjectName: string;
  markDisplayValue: number;
  date: number;
  examType: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Parsers ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h2
        className="text-[17px] font-semibold"
        style={{ color: 'var(--app-text-primary)' }}
      >
        {title}
      </h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 press-scale">
          <span className="text-sm" style={{ color: 'var(--accent)' }}>
            Alle
          </span>
          <ChevronRight size={16} color="var(--accent)" />
        </Link>
      )}
    </div>
  );
}

function TodayLessonRow({
  entry,
  style,
}: {
  entry: TimetableEntry;
  style?: React.CSSProperties;
}) {
  const accentColor = entry.isCancelled
    ? 'var(--danger)'
    : entry.isExam
    ? 'var(--warning)'
    : entry.isSubstitution
    ? 'var(--orange)'
    : subjectColor(entry.subjectName);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 fade-in"
      style={style}
    >
      <div
        className="w-[3px] self-stretch rounded-full flex-shrink-0"
        style={{ background: accentColor, minHeight: 36 }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-[15px] truncate"
          style={{
            color: 'var(--app-text-primary)',
            textDecoration: entry.isCancelled ? 'line-through' : 'none',
            opacity: entry.isCancelled ? 0.5 : 1,
          }}
        >
          {entry.subjectLong || entry.subjectName}
        </p>
        <p
          className="text-xs mt-0.5 truncate"
          style={{ color: 'var(--app-text-secondary)' }}
        >
          {parseTime(entry.startTime)} – {parseTime(entry.endTime)}
          {entry.roomName ? ` · ${entry.roomName}` : ''}
        </p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {entry.isExam && !entry.isCancelled && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--warning) 20%, transparent)',
              color: 'var(--warning)',
            }}
          >
            Prüfung
          </span>
        )}
        {entry.isCancelled && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
              color: 'var(--danger)',
            }}
          >
            Entfall
          </span>
        )}
        {entry.isSubstitution && !entry.isCancelled && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--orange) 20%, transparent)',
              color: 'var(--orange)',
            }}
          >
            Vertretung
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useSession();
  const router = useRouter();
  const [allEntries, setAllEntries] = useState<TimetableEntry[]>([]);
  const [overallAvg, setOverallAvg] = useState<number | null>(null);
  const [subjectCount, setSubjectCount] = useState(0);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [messages, setMessages] = useState<MessagePreview[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ttRes, grRes, msRes, menRes] = await Promise.allSettled([
        fetchTimetable(),
        fetchGrades(),
        fetchMessages(),
        fetchMensa(),
      ]);

      // If ANY WebUntis API fails with session_expired → redirect to login
      const anyExpired = [ttRes, grRes, msRes].some(
        (r) => r.status === 'rejected' && r.reason?.message === 'session_expired'
      );
      if (anyExpired) {
        router.replace('/login');
        return;
      }

      if (ttRes.status === 'fulfilled')
        setAllEntries(parseTimetableResult(ttRes.value));

      if (grRes.status === 'fulfilled') {
        const { avg, subjectCount: sc, recentGrades: rg } = parseGradesResult(
          grRes.value
        );
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

  useEffect(() => {
    load();
  }, [load]);

  const todayDateNum = parseInt(format(new Date(), 'yyyyMMdd'));
  const todayEntries = allEntries
    .filter((e) => e.date === todayDateNum)
    .sort((a, b) => a.startTime - b.startTime);

  const activeTodayEntries = todayEntries.filter((e) => !e.isCancelled);
  const firstActive = activeTodayEntries[0] ?? null;
  const lastActive = activeTodayEntries[activeTodayEntries.length - 1] ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : 'Guten Abend';

  return (
    <AuthGuard>
      <div
        className="h-dvh flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)', paddingBottom: 'var(--nav-h)' }}
      >
        {/* Header */}
        <div className="px-5 pt-14 pb-5 fade-in">
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight mt-0.5"
            style={{ color: 'var(--app-text-primary)' }}
          >
            {greeting}, {user?.username ?? '…'}
          </h1>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-5 pb-4 overflow-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner size={28} />
            </div>
          ) : (
            <>
              {/* Today's schedule */}
              <section className="fade-in delay-1">
                <SectionHeader
                  title={`Heute · ${format(new Date(), 'd. MMMM', { locale: de })}`}
                  href="/timetable"
                />
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--app-surface)' }}
                >
                  {todayEntries.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
                        Kein Unterricht heute
                      </p>
                    </div>
                  ) : (
                    todayEntries.map((e, i) => (
                      <TodayLessonRow
                        key={e.id}
                        entry={e}
                        style={{
                          borderTop: i > 0 ? '1px solid var(--app-separator)' : 'none',
                          animationDelay: `${80 + i * 40}ms`,
                        }}
                      />
                    ))
                  )}
                </div>
              </section>

              {/* Stat cards */}
              <div className="flex gap-3 fade-in delay-2">
                <div
                  className="flex-1 rounded-2xl p-4"
                  style={{ background: 'var(--app-surface)' }}
                >
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    Unterrichtsende
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {lastActive ? parseTime(lastActive.endTime) : '–'}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--app-text-tertiary)' }}
                  >
                    {firstActive
                      ? `Start: ${parseTime(firstActive.startTime)}`
                      : 'Kein Unterricht'}
                  </p>
                </div>
                <Link href="/grades" className="press-scale flex-1">
                  <div
                    className="rounded-2xl p-4 h-full"
                    style={{ background: 'var(--app-surface)' }}
                  >
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Notenschnitt
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        color:
                          overallAvg != null
                            ? averageColor(overallAvg)
                            : 'var(--app-text-secondary)',
                      }}
                    >
                      {overallAvg != null ? overallAvg.toFixed(1) : '–'}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--app-text-tertiary)' }}
                    >
                      {subjectCount} {subjectCount === 1 ? 'Fach' : 'Fächer'}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Recent grades */}
              {recentGrades.length > 0 && (
                <section className="fade-in delay-3">
                  <SectionHeader title="Letzte Noten" href="/grades" />
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--app-surface)' }}
                  >
                    {recentGrades.map((g, i) => (
                      <div
                        key={g.id}
                        className="px-4 py-3 flex items-center gap-3"
                        style={{
                          borderTop:
                            i > 0 ? '1px solid var(--app-separator)' : 'none',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--app-text-primary)' }}
                          >
                            {g.subjectName || '–'}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--app-text-tertiary)' }}
                          >
                            {g.examType || 'Note'} · {formatGradeDate(g.date)}
                          </p>
                        </div>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: gradeColor(g.markDisplayValue) }}
                        >
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
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--app-surface)' }}
                  >
                    {messages.slice(0, 3).map((msg, i) => (
                      <Link
                        key={msg.id}
                        href={`/messages/${msg.id}`}
                        className="px-4 py-3 flex items-center gap-3 press-scale"
                        style={{
                          borderTop:
                            i > 0 ? '1px solid var(--app-separator)' : 'none',
                          display: 'flex',
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: senderColor(msg.senderName) }}
                        >
                          {senderInitial(msg.senderName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm truncate"
                            style={{
                              color: 'var(--app-text-primary)',
                              fontWeight: msg.isRead ? 400 : 600,
                            }}
                          >
                            {msg.subject}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: 'var(--app-text-secondary)' }}
                          >
                            {msg.senderName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p
                            className="text-xs"
                            style={{ color: 'var(--app-text-tertiary)' }}
                          >
                            {formatMessageDate(msg.sentDate)}
                          </p>
                          {!msg.isRead && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: 'var(--accent)' }}
                            />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Mensa heute */}
              {dishes.length > 0 && (
                <section className="fade-in delay-5">
                  <SectionHeader title="Mensa heute" href="/mensa" />
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--app-surface)' }}
                  >
                    {dishes.map((dish, i) => (
                      <div
                        key={dish.id}
                        className="px-4 py-3 flex items-center gap-3"
                        style={{
                          borderTop:
                            i > 0 ? '1px solid var(--app-separator)' : 'none',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm truncate"
                            style={{ color: 'var(--app-text-primary)' }}
                          >
                            {typeof dish.name === 'object'
                              ? ((dish.name as Record<string, string>).de ??
                                String(dish.name))
                              : dish.name}
                          </p>
                          {dish.price != null && (
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: 'var(--app-text-secondary)' }}
                            >
                              €{dish.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                        {dish.tags && dish.tags.length > 0 && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background:
                                'color-mix(in srgb, var(--tint) 15%, transparent)',
                              color: 'var(--tint)',
                            }}
                          >
                            {dish.tags[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
