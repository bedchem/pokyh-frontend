'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeftRight, CornerDownRight, Clock, MapPin, User, Users, UserX, FileText, X } from 'lucide-react';
import type { AbsenceEntry, TimetableEntry } from '@/lib/types';
import { absenceRangeText, lessonAbsence, type AbsenceMark } from '@/lib/absences';
import { useT } from '@/providers/LocaleProvider';
import { timetableDict, type TimetableKey } from '@/lib/i18n/dictionaries/timetable';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { BRAND, fmtTime, toMins, statusTone, subjectTone, toneVars, type MergedSlot, type Tone } from '@/lib/timetable-logic';
import { TagChip } from './parts';
import { resolveSubjectImageSrc, subjectImageKey } from '@/lib/subject-image-preload';
import s from './timetable.module.css';

type HWItem = { id: number; text: string };

/** What the lesson's detail (calendar-entry/detail) adds to the timetable's own fields. */
interface DetailExtras {
  texts: Array<{ label: TimetableKey; text: string }>;
  classes: string[];
  group: string;
  examName: string;
}

const NO_EXTRAS: DetailExtras = { texts: [], classes: [], group: '', examName: '' };

/** Plain text from WebUntis' rich text: line breaks kept, tags and entities resolved. */
function plain(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) return '';
  if (!/[<&]/.test(v)) return v.trim();
  const html = v.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n');
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function names(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (x && typeof x === 'object' ? plain((x as Record<string, unknown>).displayName ?? (x as Record<string, unknown>).name ?? (x as Record<string, unknown>).shortName) : ''))
    .filter(Boolean);
}

/**
 * The texts WebUntis keeps on a lesson besides the timetable's: lesson content,
 * the teacher's note for everyone, the lesson info and the substitution text,
 * plus the classes and the group. Every field is optional; whatever is missing
 * is simply not shown.
 */
function detailExtras(entries: Array<Record<string, unknown>>): DetailExtras {
  const texts: DetailExtras['texts'] = [];
  const classes = new Set<string>();
  let group = '';
  let examName = '';
  for (const e of entries) {
    for (const [label, key] of [['teachingContent', 'teachingContent'], ['notesAll', 'notesAll'], ['note', 'lessonInfo'], ['substitutionText', 'substText']] as Array<[TimetableKey, string]>) {
      const text = plain(e[key]);
      if (text) texts.push({ label, text });
    }
    names(e.klasses).forEach((k) => classes.add(k));
    const mainGroup = e.mainStudentGroup && typeof e.mainStudentGroup === 'object' ? e.mainStudentGroup as Record<string, unknown> : null;
    group ||= plain(mainGroup?.name ?? mainGroup?.displayName);
    const exam = e.exam && typeof e.exam === 'object' ? e.exam as Record<string, unknown> : null;
    examName ||= plain(exam?.name);
  }
  return { texts, classes: [...classes], group, examName };
}

/** The same text once, whichever field it came from. */
const sameText = (a: string, b: string) => a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();

function tagsFor(slot: MergedSlot): Array<[TimetableKey, string]> {
  const d = slot.display;
  const tags: Array<[TimetableKey, string]> = [];
  if (d.isCancelled) tags.push(['cancelled', BRAND.danger]);
  if (slot.kind === 'replacement') tags.push(['substitution', BRAND.orange]);
  if (d.isExam) tags.push(['exam', BRAND.warning]);
  if (d.isSubstitution && !d.isCancelled && slot.kind !== 'replacement') tags.push(['substitution', BRAND.orange]);
  if (slot.kind === 'event') tags.push(['event', BRAND.accent]);
  return tags;
}

/** `display` is always the lesson that was tapped, the grid gives each half of a substitution its own slot. */
function detailTone(slot: MergedSlot): Tone {
  const d = slot.display;
  if (d.isCancelled) return statusTone(BRAND.danger);
  if (d.isExam) return statusTone(BRAND.warning);
  if (slot.kind === 'event') return statusTone(BRAND.accentSoft);
  if (!d.subjectName) return statusTone(BRAND.accent);
  return subjectTone(d.subjectName);
}

/**
 * The lesson detail, built like the Android app's bottom sheet: the sheet is the page canvas and
 * everything on it is a card, a hero card (subject photo or monogram, title, time pill), the
 * Lehrer/Raum list with pastel icon tiles, then one card per note.
 */
export default function LessonDetailSheet({
  slot,
  onClose,
  absences = [],
  todayNum = 0,
  minute = 0,
}: {
  slot: MergedSlot;
  onClose: () => void;
  absences?: AbsenceEntry[];
  todayNum?: number;
  minute?: number;
}) {
  const t = useT(timetableDict);
  const tc = useT(commonDict);
  const d = slot.display;
  const absence = d.isCancelled
    ? null
    : lessonAbsence(absences, d.date, toMins(d.startTime), toMins(d.endTime), todayNum, minute);
  const tone = detailTone(slot);
  const headerName = d.subjectLong || d.subjectName || d.note || t('lesson');
  const short = d.subjectName;
  const tags = tagsFor(slot);

  const imageSubject = subjectImageKey(d.subjectLong, d.subjectName);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [examDescription, setExamDescription] = useState<string | null>(d.examDescription ?? null);
  const [homeworks, setHomeworks] = useState<HWItem[]>([]);
  const [extras, setExtras] = useState<DetailExtras>(NO_EXTRAS);

  useEffect(() => {
    let alive = true;
    if (!imageSubject) return;
    import('@/lib/api-client').then(({ api }) =>
      api.subjectImages.getCache().then(async cache => {
        if (!cache.has(imageSubject)) return;
        // Usually already downloaded in the background by SubjectImagePreloader.
        const src = await resolveSubjectImageSrc(api.subjectImages.imageUrl(imageSubject));
        if (alive && src) setImageUrl(src);
      }),
    ).catch(() => {});
    return () => { alive = false; };
  }, [imageSubject]);

  useEffect(() => {
    let alive = true;
    if (d.isCancelled) return;
    fetch(`/api/webuntis/lesson-detail?date=${d.date}&startTime=${d.startTime}&endTime=${d.endTime}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive || !data) return;
        const calEntries: Array<Record<string, unknown>> = data?.calendarEntries ?? [];
        const calEntry = calEntries.find(e => e?.exam) ?? calEntries[0];
        const desc = (calEntry?.exam as { description?: string } | undefined)?.description;
        if (d.isExam && typeof desc === 'string' && desc.trim()) setExamDescription(prev => prev || desc.trim());
        const hw = calEntries.flatMap(e => (Array.isArray(e?.homeworks) ? (e.homeworks as HWItem[]) : []));
        setHomeworks(hw.filter(h => h?.text));
        setExtras(detailExtras(calEntries.filter(e => e && typeof e === 'object')));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [d.date, d.startTime, d.endTime, d.isExam, d.isCancelled, d.examDescription]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const showPhoto = !!imageUrl && !imageFailed;

  // Every text of the lesson once: the timetable's own first, then what the
  // detail adds, then any further text type WebUntis sent with the period.
  const notes: Array<{ label: TimetableKey; text: string }> = [];
  const addNote = (label: TimetableKey, text: string | undefined) => {
    const v = text?.trim();
    if (v && !notes.some(n => sameText(n.text, v))) notes.push({ label, text: v });
  };
  addNote('note', d.note);
  addNote('lessonText', d.lessonText);
  addNote('substitutionText', d.substitutionText);
  extras.texts.forEach(x => addNote(x.label, x.text));
  (d.texts ?? []).forEach(x => addNote(x.type === 'SUBSTITUTION' ? 'substitutionText' : x.type === 'LESSON_TEXT' ? 'lessonText' : x.type === 'LESSON_INFO' ? 'note' : 'info', x.text));

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div
        className={`${s.sheet} ${s.toned} fade-in`}
        style={{ ...toneVars(tone), animationDuration: '0.22s' } as CSSProperties}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={headerName}
      >
        <div className={s.sheetHandle} aria-hidden="true" />

        <div className={s.sheetBody}>
          {/* Hero card: header image (or monogram), then title and time on the card itself. */}
          <div className={s.heroCard}>
            <div className={s.sheetHeader}>
              {/* Monogram is what shows while a photo is still on its way, the header is never blank. */}
              <div className={s.monogram} aria-hidden="true">{(headerName.trim().slice(0, 2) || '?').toUpperCase()}</div>
              {showPhoto && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={s.sheetImg} src={imageUrl!} alt="" aria-hidden="true" onError={() => setImageFailed(true)} />
                  <div className={s.sheetShade} />
                </>
              )}
              {tags.length > 0 && (
                <div className={s.sheetTags}>
                  {/* A card-coloured backing under each tinted chip, so it reads the same over a photo or the pastel. */}
                  {tags.map(([text, color]) => (
                    <span key={text} className={s.sheetTagBacking}><TagChip text={t(text)} color={color} large /></span>
                  ))}
                </div>
              )}
              <button type="button" className={s.sheetClose} onClick={onClose} aria-label={tc('close')}>
                <X size={16} />
              </button>
            </div>

            <div className={s.sheetTitleBlock}>
              <h2 className={s.sheetTitle}>{headerName}</h2>
              {short && short.toLowerCase() !== headerName.toLowerCase() && <p className={s.sheetShort}>{short}</p>}
              <span className={s.timePill}>
                <Clock size={14} />
                {fmtTime(d.startTime)} - {fmtTime(d.endTime)}
              </span>
            </div>
          </div>

          <DetailsCard d={d} classes={extras.classes} group={extras.group} />
          {absence && <AbsenceCard mark={absence.mark} covering={absence.covering} />}
          {slot.replacement && <InsteadCard other={slot.replacement} />}
          {notes.map((n, i) => <SectionCard key={`${n.label}-${i}`} title={t(n.label)}>{n.text}</SectionCard>)}
          {d.isExam && (examDescription || extras.examName) && (
            <SectionCard title={t('examContent')}>
              {[extras.examName, examDescription].filter((x, i, all) => x && all.indexOf(x) === i).join('\n')}
            </SectionCard>
          )}
          {homeworks.length > 0 && (
            <div className={s.card}>
              <p className={s.label} style={{ marginBottom: 8 }}>{t('homework')}</p>
              {homeworks.map((hw, i) => (
                <p key={hw.id ?? i} className={`${s.body} ${s.hwItem}`}>{hw.text}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** "Abwesend": the status (Vorentschuldigung / Entschuldigt / Unentschuldigt) and from when to when. */
function AbsenceCard({ mark, covering }: { mark: AbsenceMark; covering: AbsenceEntry[] }) {
  const t = useT(timetableDict);
  const markLabel = { preExcused: t('markPreExcused'), excused: t('markExcused'), absent: t('markAbsent') } as const;
  const color = mark === 'absent' ? 'var(--danger)' : 'var(--tint)';
  const reasons = [...new Set(covering.map((a) => a.reasonName).filter(Boolean))] as string[];
  return (
    <div className={`${s.card} ${s.cardFlush}`}>
      <div className={s.detailRow}>
        <span className={s.detailTile} style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
          <UserX size={19} />
        </span>
        <div className={s.detailText}>
          <p className={s.label}>{t('absent')}</p>
          <p className={s.body} style={{ color, fontWeight: 600 }}>{markLabel[mark]}</p>
        </div>
      </div>
      <div className={s.detailRow}>
        <span className={s.detailTile}><Clock size={19} /></span>
        <div className={s.detailText}>
          <p className={s.label}>{t('period')}</p>
          {covering.map((a) => <p key={a.id} className={s.body}>{absenceRangeText(a, t('wholeDay'))}</p>)}
        </div>
      </div>
      {reasons.length > 0 && (
        <div className={s.detailRow}>
          <span className={s.detailTile}><FileText size={19} /></span>
          <div className={s.detailText}>
            <p className={s.label}>{t('reason')}</p>
            <p className={s.body}>{reasons.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsCard({ d, classes, group }: { d: TimetableEntry; classes: string[]; group: string }) {
  const t = useT(timetableDict);
  const teacher = d.teacherLongName || d.teacherName;
  const origTeacher = d.originalTeacherLong || d.originalTeacher || '';
  const room = d.roomName;
  const origRoom = d.originalRoom || '';
  const hasTeacher = !!teacher || !!origTeacher;
  const hasRoom = !!room || !!origRoom;
  if (!hasTeacher && !hasRoom && classes.length === 0 && !group) return null;

  return (
    <div className={`${s.card} ${s.cardFlush}`}>
      {hasTeacher && (origTeacher && origTeacher !== teacher
        ? <ChangeRow label={t('teacher')} from={origTeacher} to={teacher} icon={<User size={19} />} />
        : <DetailRow label={t('teacher')} value={teacher || origTeacher} icon={<User size={19} />} />)}
      {hasRoom && (origRoom && origRoom !== room
        ? <ChangeRow label={t('room')} from={origRoom} to={room} icon={<MapPin size={19} />} />
        : <DetailRow label={t('room')} value={room || origRoom} icon={<MapPin size={19} />} />)}
      {classes.length > 0 && <DetailRow label={t('classes')} value={classes.join(', ')} icon={<Users size={19} />} />}
      {group && <DetailRow label={t('group')} value={group} icon={<Users size={19} />} />}
    </div>
  );
}

/** The row's glyph on the subject's pastel, so the list belongs to the lesson it describes. */
function DetailTile({ icon }: { icon: ReactNode }) {
  return <span className={s.detailTile}>{icon}</span>;
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className={s.detailRow}>
      <DetailTile icon={icon} />
      <div className={s.detailText}>
        <p className={s.label}>{label}</p>
        <p className={s.body}>{value}</p>
      </div>
    </div>
  );
}

/** Old and new on their own lines: side by side, two full teacher names ran out of width. */
function ChangeRow({ label, from, to, icon }: { label: string; from: string; to: string; icon: ReactNode }) {
  return (
    <div className={s.detailRow}>
      <DetailTile icon={icon} />
      <div className={s.detailText}>
        <p className={s.label}>{label}</p>
        <p className={`${s.body} ${s.changeFrom}`}>{from}</p>
        <div className={s.changeLine}>
          <CornerDownRight size={13} style={{ color: 'var(--app-text-tertiary)' }} />
          <span className={s.changeTo}>{to || '-'}</span>
        </div>
      </div>
    </div>
  );
}

/** "Stattdessen" from the cancelled original, "Statt" from the replacement. */
function InsteadCard({ other }: { other: TimetableEntry }) {
  const t = useT(timetableDict);
  const cancelled = other.isCancelled;
  const meta = [other.teacherName, other.roomName].filter(Boolean).join(' · ');
  return (
    <div className={s.card}>
      <div className={s.insteadHead}>
        <ArrowLeftRight size={14} />
        <p className={s.label}>{cancelled ? t('insteadOf') : t('instead')}</p>
      </div>
      <p
        className={s.insteadTitle}
        style={cancelled ? { color: 'var(--app-text-tertiary)', textDecoration: 'line-through' } : undefined}
      >
        {other.subjectLong || other.subjectName || other.note || '-'}
      </p>
      {meta && <p className={s.insteadMeta}>{meta}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={s.card}>
      <p className={s.label} style={{ marginBottom: 8 }}>{title}</p>
      <p className={s.body}>{children}</p>
    </div>
  );
}
