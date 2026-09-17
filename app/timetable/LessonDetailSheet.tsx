'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeftRight, ArrowRight, Clock, MapPin, User, X } from 'lucide-react';
import type { TimetableEntry } from '@/lib/types';
import { BRAND, fmtTime, statusTone, subjectTone, toneVars, type MergedSlot, type Tone } from './timetable-logic';
import { TagChip } from './parts';
import { resolveSubjectImageSrc, subjectImageKey } from '@/lib/subject-image-preload';
import s from './timetable.module.css';

type HWItem = { id: number; text: string };

function tagsFor(slot: MergedSlot): Array<[string, string]> {
  const d = slot.display;
  const tags: Array<[string, string]> = [];
  if (d.isCancelled) tags.push(['Entfall', BRAND.danger]);
  if (slot.kind === 'replacement') tags.push(['Vertretung', BRAND.orange]);
  if (d.isExam) tags.push(['Prüfung', BRAND.warning]);
  if (d.isSubstitution && !d.isCancelled && slot.kind !== 'replacement') tags.push(['Vertretung', BRAND.orange]);
  if (slot.kind === 'event') tags.push(['Veranstaltung', BRAND.accent]);
  return tags;
}

/** `display` is always the lesson that was tapped — the grid gives each half of a substitution its own slot. */
function detailTone(slot: MergedSlot): Tone {
  const d = slot.display;
  if (d.isCancelled) return statusTone(BRAND.danger);
  if (d.isExam) return statusTone(BRAND.warning);
  if (slot.kind === 'event') return statusTone(BRAND.accentSoft);
  if (!d.subjectName) return statusTone(BRAND.accent);
  return subjectTone(d.subjectName);
}

export default function LessonDetailSheet({ slot, onClose }: { slot: MergedSlot; onClose: () => void }) {
  const d = slot.display;
  const tone = detailTone(slot);
  const headerName = d.subjectLong || d.subjectName || d.note || 'Stunde';
  const short = d.subjectName;
  const tags = tagsFor(slot);

  const imageSubject = subjectImageKey(d.subjectLong, d.subjectName);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [examDescription, setExamDescription] = useState<string | null>(d.examDescription ?? null);
  const [homeworks, setHomeworks] = useState<HWItem[]>([]);

  useEffect(() => {
    let alive = true;
    if (!imageSubject) return;
    import('@/lib/api-client').then(({ api }) =>
      api.subjectImages.getCache().then(async cache => {
        if (!cache.has(imageSubject)) return;
        // Usually already downloaded in the background by SubjectImagePreloader.
        const src = await resolveSubjectImageSrc(api.subjectImages.imageUrl(imageSubject));
        if (alive) setImageUrl(src);
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
        <div className={s.sheetHeader}>
          {/* Monogram is what shows while a photo is still on its way — the header is never blank. */}
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
              {tags.map(([text, color]) => <TagChip key={text} text={text} color={color} large />)}
            </div>
          )}
          <button type="button" className={s.sheetClose} onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <div className={s.sheetBody}>
          <div className={s.sheetTitleBlock}>
            <h2 className={s.sheetTitle}>{headerName}</h2>
            {short && short.toLowerCase() !== headerName.toLowerCase() && <p className={s.sheetShort}>{short}</p>}
            <div className={s.sheetTime}>
              <Clock size={15} />
              {fmtTime(d.startTime)} – {fmtTime(d.endTime)}
            </div>
          </div>

          <DetailsCard d={d} />
          {slot.replacement && <InsteadCard other={slot.replacement} />}
          {d.note?.trim() && <SectionCard title="Notiz">{d.note}</SectionCard>}
          {d.lessonText?.trim() && d.lessonText !== d.note && <SectionCard title="Stundentext">{d.lessonText}</SectionCard>}
          {d.substitutionText?.trim() && <SectionCard title="Vertretungstext">{d.substitutionText}</SectionCard>}
          {d.isExam && examDescription && <SectionCard title="Prüfungsinhalt">{examDescription}</SectionCard>}
          {homeworks.length > 0 && (
            <div className={s.card}>
              <p className={s.label} style={{ marginBottom: 8 }}>Hausaufgaben</p>
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

function DetailsCard({ d }: { d: TimetableEntry }) {
  const teacher = d.teacherLongName || d.teacherName;
  const origTeacher = d.originalTeacherLong || d.originalTeacher || '';
  const room = d.roomName;
  const origRoom = d.originalRoom || '';
  const hasTeacher = !!teacher || !!origTeacher;
  const hasRoom = !!room || !!origRoom;
  if (!hasTeacher && !hasRoom) return null;

  return (
    <div className={`${s.card} ${s.cardFlush}`}>
      {hasTeacher && (origTeacher && origTeacher !== teacher
        ? <ChangeRow label="Lehrer" from={origTeacher} to={teacher} icon={<User size={20} />} />
        : <DetailRow label="Lehrer" value={teacher || origTeacher} icon={<User size={20} />} />)}
      {hasRoom && (origRoom && origRoom !== room
        ? <ChangeRow label="Raum" from={origRoom} to={room} icon={<MapPin size={20} />} />
        : <DetailRow label="Raum" value={room || origRoom} icon={<MapPin size={20} />} />)}
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className={s.detailRow}>
      <span className={s.detailIcon}>{icon}</span>
      <div className={s.detailText}>
        <p className={s.label}>{label}</p>
        <p className={s.body}>{value}</p>
      </div>
    </div>
  );
}

function ChangeRow({ label, from, to, icon }: { label: string; from: string; to: string; icon: ReactNode }) {
  return (
    <div className={s.detailRow}>
      <span className={s.detailIcon}>{icon}</span>
      <div className={s.detailText}>
        <p className={s.label}>{label}</p>
        <div className={s.changeLine}>
          <span className={s.changeFrom}>{from}</span>
          <ArrowRight size={13} style={{ color: 'var(--app-text-tertiary)' }} />
          <span className={s.changeTo}>{to || '—'}</span>
        </div>
      </div>
    </div>
  );
}

/** "Stattdessen" from the cancelled original, "Statt" from the replacement. */
function InsteadCard({ other }: { other: TimetableEntry }) {
  const cancelled = other.isCancelled;
  const meta = [other.teacherName, other.roomName].filter(Boolean).join(' · ');
  return (
    <div className={s.card}>
      <div className={s.insteadHead}>
        <ArrowLeftRight size={14} />
        <p className={s.label}>{cancelled ? 'Statt' : 'Stattdessen'}</p>
      </div>
      <p
        className={s.insteadTitle}
        style={cancelled ? { color: 'var(--app-text-tertiary)', textDecoration: 'line-through' } : undefined}
      >
        {other.subjectLong || other.subjectName || other.note || '—'}
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
