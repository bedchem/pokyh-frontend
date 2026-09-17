'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowLeftRight,
  Backpack,
  BookMarked,
  CalendarDays,
  CircleX,
  ClipboardList,
  FileText,
  Info,
  Paperclip,
  Sun,
  Umbrella,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { BRAND, type DayKind, type MergedSlot } from './timetable-logic';
import s from './timetable.module.css';

export function TagChip({ text, color, large = false, icon }: { text: string; color: string; large?: boolean; icon?: ReactNode }) {
  return (
    <span className={`${s.tag} ${large ? s.tagLarge : ''}`} style={{ ['--tag-color' as string]: color } as CSSProperties}>
      {icon}
      {text}
    </span>
  );
}

/** Badge next to a lesson title in day mode. */
export function SlotBadge({ slot }: { slot: MergedSlot }) {
  const d = slot.display;
  if (d.isCancelled) return <TagChip text="Entfall" color={BRAND.danger} />;
  if (d.isExam) return <TagChip text="Prüfung" color={BRAND.warning} />;
  if (slot.kind === 'replacement') return <TagChip text="Vertretung" color={BRAND.orange} />;
  if (slot.kind === 'event') return <TagChip text="Veranstaltung" color={BRAND.accent} />;
  return null;
}

/** One of WebUntis's period icon names → the glyph drawn for it. Matched loosely, never dropped. */
export function lessonMarkIcon(untisIconName: string): LucideIcon {
  const name = untisIconName.toUpperCase();
  const has = (...keys: string[]) => keys.some(k => name.includes(k));
  if (has('HOMEWORK')) return Backpack;
  if (has('EXAM', 'TEST')) return ClipboardList;
  if (has('ATTACH', 'FILE', 'DOCUMENT')) return Paperclip;
  if (has('SUBSTITUT', 'STANDIN', 'STAND_IN')) return ArrowLeftRight;
  if (has('ONLINE', 'VIDEO', 'TEAMS', 'ZOOM')) return Zap;
  if (has('CLASSREG', 'CLASS_REG', 'REGISTER')) return BookMarked;
  if (has('NOTE', 'INFO', 'TEXT', 'COMMENT')) return FileText;
  return Info;
}

interface SpecialSpec { Icon: LucideIcon; color: string; title: string; subtitle: string }

export function specialDaySpecFor(kind: DayKind): SpecialSpec {
  switch (kind) {
    case 'holiday': return { Icon: Umbrella, color: BRAND.orange, title: 'Ferien', subtitle: 'Kein Unterricht' };
    case 'weekend': return { Icon: Sun, color: BRAND.success, title: 'Wochenende', subtitle: 'Frei' };
    case 'allCancelled': return { Icon: CircleX, color: BRAND.danger, title: 'Entfall', subtitle: 'Alle Stunden ausgefallen' };
    case 'allReplacement': return { Icon: ArrowLeftRight, color: BRAND.accent, title: 'Vertretung', subtitle: 'Tag durchgehend ersetzt' };
    case 'fullDayEvent': return { Icon: CalendarDays, color: BRAND.accent, title: 'Veranstaltung', subtitle: 'Ganztägig' };
    default: return { Icon: CalendarDays, color: BRAND.accent, title: '', subtitle: '' };
  }
}

/** Shown instead of lessons when a whole day has none — glyph disc, title, one line. No plate. */
export function SpecialDayCard({ kind, compact = false, style, onClick }: {
  kind: DayKind;
  compact?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const spec = specialDaySpecFor(kind);
  const className = `${s.special} ${compact ? s.specialCompact : ''}`;
  const inner = (
    <div className={s.specialInner}>
      <div className={s.specialDisc}>
        <spec.Icon size={compact ? 16 : 32} />
      </div>
      <p className={s.specialTitle}>{spec.title}</p>
      <p className={s.specialSub}>{spec.subtitle}</p>
    </div>
  );
  const fullStyle = { ...style, ['--special-color' as string]: spec.color } as CSSProperties;
  if (onClick) {
    return <button type="button" className={className} style={fullStyle} onClick={onClick}>{inner}</button>;
  }
  return <div className={className} style={fullStyle}>{inner}</div>;
}
