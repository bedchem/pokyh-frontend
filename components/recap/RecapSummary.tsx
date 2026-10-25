'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check, Copy, DownloadSimple, ShareNetwork, SlidersHorizontal, WhatsappLogo } from '@phosphor-icons/react';
import MascotFigure from '@/components/pixel/MascotFigure';
import type { RecapKey } from '@/lib/i18n/dictionaries/recap';
import type { SummaryItem } from '@/lib/recap-story';
import ShareCard, { CARD_POSES, CARD_SLOTS, POSTER_COLORS, warmPoses, type CardData, type CardPose } from './ShareCard';
import { REACTIONS } from './reactions';
import { cardPng, downloadPng, shareCard, siteLink, whatsappLink } from './share';
import s from './recap.module.css';

// The story's last page: the poster to share (./ShareCard.tsx) as large as
// the page allows. The arrows (or a swipe on the poster) change the
// mascot's pose; "Anpassen" opens a sheet for the pose, the colour, which
// figures it shows and whether the name is on it. "PNG" saves the picture;
// "Teilen" hands it to the system's share sheet with a line of text and
// POKYH's address (WhatsApp, Instagram …), or — where a browser can't —
// offers WhatsApp's web share, copying the text and saving.

type T = (key: RecapKey, vars?: Record<string, string | number>) => string;

const POSE_KEY: Record<CardPose, RecapKey> = {
  proud: 'poseProud', legend: 'poseLegend', wave: 'poseWave', cool: 'poseCool', party: 'poseParty',
  love: 'poseLove', cheer: 'poseCheer', zap: 'poseZap', sleepy: 'poseSleepy', angel: 'poseAngel',
};

function PoseIcon({ pose }: { pose: CardPose }) {
  const r = REACTIONS[pose];
  return (
    <svg viewBox="-4 -16 48 54" className="spr" shapeRendering="crispEdges" aria-hidden="true">
      <MascotFigure look={{ ...r.look, motion: 'bob', wave: false, mark: undefined, sweat: false, think: false, anger: false, zap: false }} motionKey={`pose-${pose}`} wear={r.wear} />
    </svg>
  );
}

export interface SummaryProps {
  t: T;
  title: string;
  firstName: string;
  items: SummaryItem[];
  onReplay: () => void;
}

export default function RecapSummary({ t, title, firstName, items, onReplay }: SummaryProps) {
  const [pose, setPose] = useState<CardPose>(CARD_POSES[0]);
  const [color, setColor] = useState<string>(POSTER_COLORS[0]);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [showName, setShowName] = useState(!!firstName);
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const swipe = useRef<number | null>(null);

  // Every pose drawn while the page settles, so the arrows and the sheet are instant.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => warmPoses());
    return () => cancel(id);
  }, []);

  // At the start the most telling figures, as many as the poster has room for.
  const picked = chosen ?? items.slice(0, CARD_SLOTS).map((i) => i.id);
  const shown = useMemo(
    () => picked.map((id) => items.find((i) => i.id === id)).filter((i): i is SummaryItem => !!i).slice(0, CARD_SLOTS),
    [picked, items],
  );
  const data: CardData = {
    title,
    name: showName ? firstName : '',
    items: shown.map((i) => ({ label: t(i.label), value: i.value })),
    pose,
    color,
  };

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 2200);
    return () => window.clearTimeout(id);
  }, [note]);

  const step = (by: number) => {
    const i = CARD_POSES.indexOf(pose);
    setPose(CARD_POSES[(i + by + CARD_POSES.length) % CARD_POSES.length]!);
  };

  // At most CARD_SLOTS figures: the others wait until one is taken off.
  function toggle(id: string) {
    setChosen((current) => {
      const list = (current ?? picked).filter((x) => items.some((i) => i.id === x));
      if (list.includes(id)) return list.filter((x) => x !== id);
      return list.length < CARD_SLOTS ? [...list, id] : list;
    });
  }

  const fileName = 'pokyh-recap.png';
  const shareText = t('shareText', { title, url: siteLink() });

  async function picture(): Promise<Blob | null> {
    return svg.current ? cardPng(svg.current) : null;
  }

  async function save() {
    setBusy(true);
    const blob = await picture();
    setBusy(false);
    if (blob) {
      downloadPng(blob, fileName);
      setNote(t('shareSaved'));
    }
  }

  async function share() {
    setBusy(true);
    const blob = await picture();
    const outcome = await shareCard(blob, fileName, title, shareText);
    setBusy(false);
    if (outcome === 'unsupported') setMenu(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setNote(t('shareCopied'));
    } catch { /* clipboard blocked */ }
    setMenu(false);
  }

  const order = picked.filter((id) => items.some((i) => i.id === id));

  return (
    <>
      <div
        className={s.stage}
        onPointerDown={(e) => { swipe.current = e.clientX; }}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }}
      >
        <ShareCard ref={svg} data={data} className={`${s.preview} ${s.px}`} label={title} />
      </div>

      {note && <p className={`${s.note} ${s.px}`} role="status">{note}</p>}

      <div className={s.switcher}>
        <button type="button" className={`${s.square} ${s.px}`} onClick={() => step(-1)} aria-label={t('prevPose')}>
          <CaretLeft size={20} weight="bold" aria-hidden="true" />
        </button>
        <span className={s.designName} aria-live="polite">{t(POSE_KEY[pose])}</span>
        <button type="button" className={`${s.square} ${s.px}`} onClick={() => step(1)} aria-label={t('nextPose')}>
          <CaretRight size={20} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className={`${s.customize} ${s.px}`} onClick={() => { setMenu(false); setSheet(true); }} aria-expanded={sheet}>
          <SlidersHorizontal size={17} weight="bold" aria-hidden="true" />{t('customize')}
        </button>
      </div>

      <div className={s.bottom}>
        <button type="button" className={`${s.back} ${s.px}`} onClick={onReplay} aria-label={t('replay')}>
          <ArrowCounterClockwise size={21} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className={`${s.quiet} ${s.px}`} onClick={() => void save()} disabled={busy} aria-label={t('downloadPngLong')}>
          <DownloadSimple size={19} weight="bold" aria-hidden="true" />{t('downloadPng')}
        </button>
        <button type="button" className={`${s.next} ${s.px}`} onClick={() => void share()} disabled={busy}>
          <ShareNetwork size={19} weight="bold" aria-hidden="true" />{t('share')}
        </button>
      </div>

      {menu && (
        <div className={`${s.menu} ${s.px}`} role="dialog" aria-label={t('share')}>
          <p className={s.menuHint}>{t('shareHint')}</p>
          <a className={`${s.quiet} ${s.px}`} href={whatsappLink(shareText)} target="_blank" rel="noopener noreferrer" onClick={() => { void save(); setMenu(false); }}>
            <WhatsappLogo size={19} weight="bold" aria-hidden="true" />{t('shareWhatsapp')}
          </a>
          <button type="button" className={`${s.quiet} ${s.px}`} onClick={() => void copy()}>
            <Copy size={18} weight="bold" aria-hidden="true" />{t('shareCopy')}
          </button>
          <button type="button" className={`${s.quiet} ${s.px}`} onClick={() => { void save(); setMenu(false); }}>
            <DownloadSimple size={18} weight="bold" aria-hidden="true" />{t('downloadPngLong')}
          </button>
          <button type="button" className={`${s.next} ${s.px}`} onClick={() => setMenu(false)}>{t('close')}</button>
        </div>
      )}

      {sheet && (
        <div className={s.sheet} role="dialog" aria-label={t('customize')}>
          <div className={s.sheetBody}>
            <div className={s.group}>
              <p className={s.label}>{t('customizePose')}</p>
              <div className={s.chips}>
                {CARD_POSES.map((p) => (
                  <button key={p} type="button" className={`${s.chip} ${s.px}`} aria-pressed={p === pose} onClick={() => setPose(p)}>
                    <PoseIcon pose={p} />{t(POSE_KEY[p])}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.group}>
              <p className={s.label}>{t('customizeColor')}</p>
              <div className={s.chips}>
                {POSTER_COLORS.map((c) => (
                  <button key={c} type="button" className={`${s.chip} ${s.swatch} ${s.px}`} aria-pressed={c === color} aria-label={c} onClick={() => setColor(c)} style={{ '--c': c } as React.CSSProperties}>
                    <span className={s.px} />
                  </button>
                ))}
              </div>
            </div>
            <div className={s.group}>
              <p className={s.label}><span>{t('customizeFigures')}</span><span>{t('customizeRoom', { n: CARD_SLOTS })}</span></p>
              <div className={s.figures}>
                {items.map((item) => {
                  const on = order.includes(item.id);
                  const full = !on && order.length >= CARD_SLOTS;
                  return (
                    <button key={item.id} type="button" role="checkbox" aria-checked={on} disabled={full} className={`${s.figure2} ${s.px}`} onClick={() => toggle(item.id)}>
                      <span className={s.box} data-on={on ? '' : undefined}>{on && <Check size={12} weight="bold" aria-hidden="true" />}</span>
                      <span>{t(item.label)}</span>
                      <span>{item.value}</span>
                    </button>
                  );
                })}
              </div>
              {firstName && (
                <button type="button" role="checkbox" aria-checked={showName} className={`${s.figure2} ${s.toggleRow} ${s.px}`} onClick={() => setShowName((v) => !v)}>
                  <span className={s.box} data-on={showName ? '' : undefined}>{showName && <Check size={12} weight="bold" aria-hidden="true" />}</span>
                  <span>{t('customizeName')}</span>
                  <span>{firstName}</span>
                </button>
              )}
            </div>
          </div>
          <div className={s.sheetFoot}>
            <button type="button" className={`${s.next} ${s.px}`} onClick={() => setSheet(false)}>{t('done')}</button>
          </div>
        </div>
      )}
    </>
  );
}
