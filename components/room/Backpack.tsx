'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import MascotFigure from '@/components/pixel/MascotFigure';
import { roomBackdrop } from '@/components/pixel/vending';
import { useT } from '@/providers/LocaleProvider';
import { roomDict, type RoomKey } from '@/lib/i18n/dictionaries/room';
import { DISCOVERIES, GAME_IDS, ITEMS, type ItemId } from './catalog';
import { resetRoom, toggleDecor, useRoomSave, wear } from './store';
import { GameIcon, ItemIcon, StarIcon } from './parts';
import s from './room.module.css';

// The backpack: everything collected in room 2B. What the mascot wears (a
// hat, something on its face) and which decorations stand in the room, both
// to change; the secrets found so far, the games' records, the snacks eaten,
// and a way to forget it all.

const IDLE = { pose: { eyes: 'open' as const, look: [0, 0] as [number, number], mouth: 'smile' as const, arms: 'down' as const }, blink: true, motion: 'bob' as const };

export default function Backpack({ onClose }: { onClose: () => void }) {
  const t = useT(roomDict);
  const save = useRoomSave();
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [asking, setAsking] = useState(false);
  const backdrop = useMemo(() => roomBackdrop(240, 170, 118), []);

  useEffect(() => {
    root.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const owned = (kind: string) => ITEMS.filter((i) => i.kind === kind && save.owned.includes(i.id));
  const heads = owned('head');
  const faces = owned('face');
  const decor = owned('decor');
  const eaten = ITEMS.filter((i) => i.kind === 'snack' && (save.eaten[i.id] ?? 0) > 0);
  const name = (id: string) => t(`item_${id}` as RoomKey);

  const wardrobe = (slot: 'head' | 'face', list: typeof heads) => (
    <div className={s.bagRow} role="group" aria-label={t(slot === 'head' ? 'bagHead' : 'bagFace')}>
      <button type="button" className={s.bagItem} aria-pressed={!save.wear[slot]} onClick={() => wear(slot, null)}>
        <span className={s.bagNone} aria-hidden="true">–</span>
        <span>{t('bagNothing')}</span>
      </button>
      {list.map((i) => (
        <button key={i.id} type="button" className={s.bagItem} aria-pressed={save.wear[slot] === i.id} onClick={() => wear(slot, i.id as ItemId)}>
          <ItemIcon id={i.id} className={s.bagIcon} />
          <span>{name(i.id)}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div ref={root} className={s.sub} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <SpritePalette />
      <svg viewBox="0 0 240 170" preserveAspectRatio="xMidYMax slice" className={`spr ${s.backdrop}`} shapeRendering="crispEdges" aria-hidden="true">
        <Paths sprite={backdrop} />
      </svg>
      <div className={s.bag}>
        <div className={s.bagHeader}>
          <svg viewBox="-2 -16 44 54" className={`spr ${s.bagMascot}`} shapeRendering="crispEdges" aria-hidden="true">
            <MascotFigure look={IDLE} motionKey="bag" wear={save.wear} />
          </svg>
          <div className="min-w-0">
            <h2 id={titleId} tabIndex={-1} className={s.bagTitle}>{t('bagTitle')}</h2>
            <p className={s.bagLead}>
              <StarIcon className={s.inlineStar} /> {t('starsLabel', { n: save.stars })} · {t('foundLabel', { n: save.found.length, total: DISCOVERIES.length })}
            </p>
          </div>
        </div>

        <section className={s.bagSection}>
          <h3 className={s.bagHeading}>{t('bagHead')}</h3>
          {heads.length ? wardrobe('head', heads) : <p className={s.bagEmpty}>{t('bagNoHead')}</p>}
        </section>
        <section className={s.bagSection}>
          <h3 className={s.bagHeading}>{t('bagFace')}</h3>
          {faces.length ? wardrobe('face', faces) : <p className={s.bagEmpty}>{t('bagNoFace')}</p>}
        </section>
        <section className={s.bagSection}>
          <h3 className={s.bagHeading}>{t('bagDecor')}</h3>
          {decor.length ? (
            <div className={s.bagRow}>
              {decor.map((i) => (
                <button key={i.id} type="button" className={s.bagItem} aria-pressed={save.decor.includes(i.id)} onClick={() => toggleDecor(i.id)}>
                  <ItemIcon id={i.id} className={s.bagIcon} />
                  <span>{name(i.id)}</span>
                </button>
              ))}
            </div>
          ) : <p className={s.bagEmpty}>{t('bagNoDecor')}</p>}
        </section>

        <section className={s.bagSection}>
          <h3 className={s.bagHeading}>{t('bagFound', { n: save.found.length, total: DISCOVERIES.length })}</h3>
          <ul className={s.bagFound}>
            {DISCOVERIES.map((d) => (
              <li key={d} data-on={save.found.includes(d) ? '' : undefined}>
                {save.found.includes(d) ? t(`found_${d}` as RoomKey) : <span aria-label={t('bagSecret')}>???</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className={s.bagSection}>
          <h3 className={s.bagHeading}>{t('bagRecords')}</h3>
          <ul className={s.bagRecords}>
            {GAME_IDS.map((g) => (
              <li key={g}>
                <GameIcon id={g} className={s.bagGame} />
                <span className="min-w-0 flex-1 truncate">{t(`game_${g}` as RoomKey)}</span>
                <span className={s.tnum}>{save.best[g] !== undefined ? t(`score_${g}` as RoomKey, { n: save.best[g]! }) : '–'}</span>
                <span className={s.bagStars} aria-label={t('starsOf', { n: save.rated[g] ?? 0 })}>
                  {[1, 2, 3].map((n) => <span key={n} data-on={(save.rated[g] ?? 0) >= n ? '' : undefined}>★</span>)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {eaten.length > 0 && (
          <section className={s.bagSection}>
            <h3 className={s.bagHeading}>{t('bagSnacks')}</h3>
            <p className={s.bagEmpty}>{eaten.map((i) => `${save.eaten[i.id]}× ${name(i.id)}`).join(' · ')}</p>
          </section>
        )}

        <section className={s.bagSection}>
          <p className={s.bagEmpty}>{t('bagPrivacy')}</p>
          {asking ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="key key-sm" onClick={() => setAsking(false)}>{t('bagKeep')}</button>
              <button type="button" className={`key key-sm ${s.danger}`} onClick={() => { resetRoom(); setAsking(false); }}>{t('bagResetSure')}</button>
            </div>
          ) : (
            <button type="button" className={`key key-sm mt-3 ${s.quiet}`} onClick={() => setAsking(true)}>{t('bagReset')}</button>
          )}
        </section>
      </div>
    </div>
  );
}
