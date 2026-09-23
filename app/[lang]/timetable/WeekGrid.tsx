'use client';

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { AbsenceEntry, TimetableEntry } from '@/lib/types';
import { absenceBands } from '@/lib/absences';
import { useLocale, useT } from '@/providers/LocaleProvider';
import { timetableDict } from '@/lib/i18n/dictionaries/timetable';
import { dayLabelsMonSat, monthShort } from '@/lib/i18n/dateLocale';
import {
  CELL_GAP,

  GRID_GUTTER,
  MIN_CELL_HEIGHT,
  MIN_CELL_WIDTH,
  PX_PER_MINUTE,
  TEXT_MIN_CELL_WIDTH,
  TIMETABLE_PERIODS,
  buildGridCells,
  buildSlots,
  cellTone,
  changesOf,
  dayKind,
  fieldParts,
  hhmm,
  registerSubjects,
  toMins,
  toneVars,
  type GridCell,
  type MergedSlot,
  type PartMark,
} from './timetable-logic';
import { SpecialDayCard, lessonMarkIcon } from './parts';
import s from './timetable.module.css';

const PER_MILLE = 1000;

/**
 * The week grid — six day columns (Mo–Sa) against a time axis built from the week's own lesson
 * times. Untis Mobile's look in POKYH pastels: a lesson is one soft tinted block; an outline
 * means something (red = cancelled, yellow = exam); a changed room/teacher is only a chip.
 */
export default function WeekGrid({
  dayEntries,
  dates,
  dayNums,
  todayNum,
  weekNumber,
  minute,
  scale,
  onTap,
  absences = [],
}: {
  dayEntries: TimetableEntry[][];
  dates: Date[];
  dayNums: number[];
  todayNum: number;
  weekNumber: number;
  minute: number;
  scale: number;
  onTap: (slot: MergedSlot) => void;
  /** The student's Abwesenheiten — drawn as a labelled wash over the lessons they cover. */
  absences?: AbsenceEntry[];
}) {
  const t = useT(timetableDict);
  const { locale } = useLocale();
  const DAY_LABELS = dayLabelsMonSat(locale);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyWidth, setBodyWidth] = useState(0);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => setBodyWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pxPerMin = PX_PER_MINUTE * scale;
  const gutter = Math.round(GRID_GUTTER * Math.min(scale, 1.25));
  // Breathing room between days: tight on a phone, wider where there is width to spend.
  const colGap = scale > 1 ? 8 : 4;
  const colW = Math.max(0, (bodyWidth - gutter - colGap * 6) / 6);

  const anyDayHasEntries = dayEntries.some(d => d.length > 0);
  const daySlots = useMemo(() => dayEntries.map(d => buildSlots(d)), [dayEntries]);
  const dayKinds = useMemo(
    () => dayEntries.map((d, i) => dayKind(d, daySlots[i], anyDayHasEntries, i)),
    [dayEntries, daySlots, anyDayHasEntries],
  );
  const allEntries = useMemo(() => dayEntries.flat(), [dayEntries]);
  // Colours are handed out for the whole week before any cell asks for one — see registerSubjects.
  useMemo(() => registerSubjects(allEntries.map(e => e.subjectName)), [allEntries]);

  const minMins = allEntries.length ? Math.min(...allEntries.map(e => toMins(e.startTime))) : TIMETABLE_PERIODS[0].startMinute;
  const maxMins = allEntries.length ? Math.max(...allEntries.map(e => toMins(e.endTime))) : TIMETABLE_PERIODS[TIMETABLE_PERIODS.length - 1].endMinute;
  const totalHeight = Math.max(380 * scale, (maxMins - minMins) * pxPerMin);

  // Numbered only when the numbers are this school's.
  const visiblePeriods = useMemo(() => {
    const onGrid = allEntries.filter(e => TIMETABLE_PERIODS.some(p => p.startMinute === toMins(e.startTime))).length;
    if (allEntries.length > 0 && onGrid * 2 < allEntries.length) return [];
    return TIMETABLE_PERIODS.filter(p => p.endMinute > minMins && p.startMinute < maxMins);
  }, [allEntries, minMins, maxMins]);

  // Rules from the lessons themselves as well as the period table, so a cell edge lands on a line.
  const boundaryTimes = useMemo(() => {
    const set = new Set<number>();
    visiblePeriods.forEach(p => { set.add(p.startMinute); set.add(p.endMinute); });
    allEntries.forEach(e => { set.add(toMins(e.startTime)); set.add(toMins(e.endTime)); });
    return [...set].filter(m => m >= minMins - 2 && m <= maxMins + 2).sort((a, b) => a - b);
  }, [visiblePeriods, allEntries, minMins, maxMins]);

  const todayIndex = dayNums.indexOf(todayNum);
  const showNow = todayIndex >= 0 && minute >= minMins && minute <= maxMins && colW > 0;
  const nowY = (minute - minMins) * pxPerMin;

  return (
    <div className={s.grid} style={{ ['--s' as string]: scale } as CSSProperties}>
      {/* Header */}
      <div className={s.gridHeader} style={{ gap: colGap }}>
        <div className={s.gutterHead} style={{ width: gutter }}>
          <span className={s.gutterKw}>{t('cw')} {weekNumber}</span>
          {dates[0] && <span className={s.gutterMonth}>{monthShort(locale)[dates[0].getMonth()]}</span>}
        </div>
        {DAY_LABELS.map((label, d) => {
          const isToday = dayNums[d] === todayNum;
          return (
            <div key={label} className={s.dayHead}>
              <span className={`${s.dayHeadLabel} ${isToday ? s.dayHeadLabelToday : ''}`}>{label}</span>
              <span className={`${s.dayDisc} ${isToday ? s.dayDiscToday : ''}`}>{dates[d]?.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div ref={bodyRef} className={s.gridBody} style={{ height: totalHeight, gap: colGap }}>
        <div className={s.axis} style={{ width: gutter, height: totalHeight }}>
          {visiblePeriods.map(p => (
            <span
              key={`p${p.number}`}
              className={s.axisPeriod}
              style={{ top: ((p.startMinute + p.endMinute) / 2 - minMins) * pxPerMin - 9, width: gutter - 6 }}
            >
              {p.number}.
            </span>
          ))}
          {boundaryTimes.map(m => (
            <span key={`t${m}`} className={s.axisTime} style={{ top: (m - minMins) * pxPerMin - 6 }}>
              {hhmm(m)}
            </span>
          ))}
        </div>

        {DAY_LABELS.map((label, d) => (
          <DayColumn
            key={label}
            width={colW}
            height={totalHeight}
            boundaryTimes={boundaryTimes}
            minMins={minMins}
            pxPerMin={pxPerMin}
            scale={scale}
            kind={dayKinds[d]}
            slots={daySlots[d]}
            dayNum={dayNums[d]}
            todayNum={todayNum}
            minute={minute}
            onTap={onTap}
            absences={absences}
          />
        ))}

        {showNow && (
          <>
            <div className={s.nowFaint} style={{ left: gutter + colGap, right: 0, top: nowY - 0.75 }} />
            <div
              className={s.nowStrong}
              style={{ left: gutter + colGap + (colW + colGap) * todayIndex, width: colW, top: nowY - 0.75 }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function DayColumn({
  width,
  height,
  boundaryTimes,
  minMins,
  pxPerMin,
  scale,
  kind,
  slots,
  dayNum,
  todayNum,
  minute,
  onTap,
  absences,
}: {
  width: number;
  height: number;
  boundaryTimes: number[];
  minMins: number;
  pxPerMin: number;
  scale: number;
  kind: ReturnType<typeof dayKind>;
  slots: MergedSlot[];
  dayNum: number;
  todayNum: number;
  minute: number;
  onTap: (slot: MergedSlot) => void;
  absences: AbsenceEntry[];
}) {
  const t = useT(timetableDict);
  const markLabel = { preExcused: t('markPreExcused'), excused: t('markExcused'), absent: t('markAbsent') } as const;
  const markShort = { preExcused: t('markPreExcusedShort'), excused: t('markExcusedShort'), absent: t('markAbsentShort') } as const;
  const cells = useMemo(() => buildGridCells(slots), [slots]);
  const bands = useMemo(
    () => absenceBands(
      absences,
      dayNum,
      cells
        .filter(c => !(c.kind === 'cancelled' || c.entry.isCancelled))
        .map(c => ({ startMinute: c.startMinute, endMinute: c.endMinute })),
      todayNum,
      minute,
    ),
    [absences, dayNum, cells, todayNum, minute],
  );

  return (
    <div className={s.column} style={{ height }}>
      {boundaryTimes.map(m => (
        <div key={m} className={s.rule} style={{ top: (m - minMins) * pxPerMin }} />
      ))}

      {kind === 'weekend' ? null : kind !== 'normal' ? (
        <SpecialDayCard
          kind={kind}
          compact
          style={{ top: 2, height: height - 4 }}
          // A day that is cancelled outright opens nothing: the card already says everything the
          // popup would, and every lesson behind it is an Entfall.
          onClick={kind !== 'allCancelled' && slots[0] ? () => onTap(slots[0]) : undefined}
        />
      ) : (
        width > 0 && cells.map(cell => {
          const top = (cell.startMinute - minMins) * pxPerMin;
          const h = Math.max(MIN_CELL_HEIGHT * scale, (cell.endMinute - cell.startMinute) * pxPerMin);
          const sharing = cell.width < PER_MILLE;
          const left = (width * cell.start) / PER_MILLE + (cell.start > 0 ? CELL_GAP : 0);
          const right = (width * (cell.start + cell.width)) / PER_MILLE;
          const cellWidth = Math.max(MIN_CELL_WIDTH, right - left);
          const past = dayNum < todayNum || (dayNum === todayNum && cell.endMinute <= minute);
          return (
            <div
              key={cell.key}
              className={`${s.cellSlot} ${past ? s.cellPast : ''}`}
              style={{ top, left, width: cellWidth, height: h }}
            >
              <GridLessonCell cell={cell} height={h} width={cellWidth} dense={sharing} scale={scale} onTap={onTap} />
            </div>
          );
        })
      )}

      {kind === 'normal' && width > 0 && bands.map(band => {
        const top = (band.startMinute - minMins) * pxPerMin;
        const h = (band.endMinute - band.startMinute) * pxPerMin;
        return (
          <div
            key={`abs-${band.startMinute}`}
            className={`${s.absenceBand} ${band.mark === 'absent' ? s.absenceBandAbsent : ''}`}
            style={{ top, height: h }}
            aria-label={markLabel[band.mark]}
          >
            <span className={`${s.absenceLabel} ${s.absenceLabelFull}`}>{markLabel[band.mark]}</span>
            <span className={`${s.absenceLabel} ${s.absenceLabelShort}`} aria-hidden>{markShort[band.mark]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** One lesson block: pastel fill and up to three lines — subject, teacher, room — in that order. */
function GridLessonCell({ cell, height, width, dense, scale, onTap }: {
  cell: GridCell;
  height: number;
  width: number;
  dense: boolean;
  scale: number;
  onTap: (slot: MergedSlot) => void;
}) {
  const t = useT(timetableDict);
  const { entry, kind } = cell;
  const cancelled = kind === 'cancelled' || entry.isCancelled;
  const changes = changesOf(entry);
  const tone = cellTone(entry, kind);
  // Cancelled → red ring, exam → yellow ring. A substitution or room change is carried by its chip alone.
  const exam = !cancelled && (entry.isExam || kind === 'exam');
  const outline = cancelled ? s.cellOutlineDanger : exam ? s.cellOutlineWarning : '';

  const subjectText = entry.subjectName || entry.note || '—';
  const secondary: Array<{ parts: Array<[string, PartMark]>; className: string }> = [
    { parts: fieldParts(entry.teacherName, entry.addedTeachers ?? [], entry.originalTeacher, dense), className: s.lineTeacher },
    { parts: fieldParts(entry.roomName, entry.addedRooms ?? [], entry.originalRoom, dense), className: s.lineRoom },
  ].filter(l => l.parts.length > 0);
  const roomForLines = height > 42 * scale ? 2 : height > 28 * scale ? 1 : 0;
  const label = [subjectText, entry.teacherName, entry.roomName, cancelled ? t('cancelled') : ''].filter(Boolean).join(', ');

  return (
    <button
      type="button"
      className={`${s.cell} ${s.toned} ${outline}`}
      style={toneVars(tone) as CSSProperties}
      onClick={e => { e.stopPropagation(); onTap(cell.slot); }}
      onPointerDown={e => e.stopPropagation()}
      aria-label={label}
      title={label}
    >
      {width >= TEXT_MIN_CELL_WIDTH && (
        <span className={`${s.cellBody} ${dense ? s.cellDense : ''}`}>
          <ChangeableLine
            parts={[[subjectText, changes.subjectChanged ? 'added' : 'plain']]}
            className={s.lineSubject}
            struck={cancelled}
          />
          {secondary.slice(0, roomForLines).map((l, i) => (
            <ChangeableLine key={i} parts={l.parts} className={`${l.className} ${s.lineSecondary}`} struck={cancelled} />
          ))}
        </span>
      )}
      {width >= TEXT_MIN_CELL_WIDTH && (entry.icons?.length ?? 0) > 0 && (
        <span className={s.marks}>
          {entry.icons!.slice(0, 2).map((name, i) => {
            const Icon = lessonMarkIcon(name);
            return <Icon key={i} size={Math.round(9 * scale)} strokeWidth={2.4} />;
          })}
        </span>
      )}
    </button>
  );
}

/** One line of a cell; a changed part is a filled chip (accent = added, danger = removed). */
function ChangeableLine({ parts, className, struck }: { parts: Array<[string, PartMark]>; className: string; struck: boolean }) {
  return (
    <span className={`${s.line} ${className}`}>
      {parts.map(([text, mark], i) =>
        mark === 'plain' ? (
          <span key={i} className={`${s.part} ${struck ? s.struck : ''}`}>{text}</span>
        ) : (
          <span key={i} className={`${s.part} ${s.partChip} ${mark === 'added' ? s.partAdded : s.partRemoved}`}>{text}</span>
        ),
      )}
    </span>
  );
}

export function WeekGridSkeleton() {
  const t = useT(timetableDict);
  const pattern: Array<Array<[number, number]>> = [
    [[0, 0.18], [0.2, 0.26], [0.52, 0.16]],
    [[0, 0.26], [0.3, 0.18], [0.54, 0.28]],
    [[0.06, 0.2], [0.3, 0.34]],
    [[0, 0.16], [0.18, 0.22], [0.44, 0.3]],
    [[0.1, 0.3], [0.46, 0.18]],
    [[0, 0.22]],
  ];
  return (
    <div className={s.skelGrid} aria-busy="true" aria-label={t('loadingGrid')}>
      <div className={s.skelRow} style={{ paddingBottom: 12 }}>
        <div style={{ width: 36 }} />
        {pattern.map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className={s.skel} style={{ width: 18, height: 14 }} />
            <div className={s.skel} style={{ width: 22, height: 22, borderRadius: 999 }} />
          </div>
        ))}
      </div>
      <div className={s.skelRow}>
        <div style={{ width: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Array.from({ length: 6 }, (_, i) => <div key={i} className={s.skel} style={{ width: 26, height: 14 }} />)}
        </div>
        {pattern.map((blocks, i) => (
          <div key={i} className={s.skelCol}>
            {blocks.map(([start, h], j) => (
              <div
                key={j}
                className={s.skel}
                style={{ position: 'absolute', left: 0, right: 0, top: `${start * 100}%`, height: `${h * 100}%`, borderRadius: 12 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
