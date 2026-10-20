'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import MascotFigure from '@/components/pixel/MascotFigure';
import { roomBackdrop } from '@/components/pixel/vending';
import { useT } from '@/providers/LocaleProvider';
import { roomDict, type RoomKey } from '@/lib/i18n/dictionaries/room';
import { DISCOVERIES, GAME_IDS, ITEMS, type Item, type ItemId } from './catalog';
import { resetRoom, toggleDecor, useRoomSave, wear } from './store';
import { GameIcon, ItemIcon, StarIcon } from './parts';
import s from './room.module.css';

// The backpack, as a game's inventory: the mascot with a slot for its head
// and one for its face; a grid with a slot for everything that can be kept
// (hats, glasses and eyes, decorations, the rare things), the ones not found
// yet as dark shapes; a panel for the chosen thing (what it is, putting it
// on or up). A second tab lists the secrets found, a third the console's
// records, the snacks eaten and a way to forget it all. A click on a slot
// chooses it, a double click (or the button) puts it on or takes it off.

const IDLE = { pose: { eyes: 'open' as const, look: [0, 0] as [number, number], mouth: 'smile' as const, arms: 'down' as const }, blink: true, motion: 'bob' as const };

/** Everything to keep, in the inventory's order: on the head, on the face, in the room, just kept. */
const KEEP: Item[] = (['head', 'face', 'decor', 'keep'] as const).flatMap((kind) => ITEMS.filter((i) => i.kind === kind));

type Tab = 'items' | 'secrets' | 'records';
const TABS: Array<{ id: Tab; label: RoomKey }> = [{ id: 'items', label: 'tabItems' }, { id: 'secrets', label: 'tabSecrets' }, { id: 'records', label: 'tabRecords' }];

export default function Backpack({ onClose }: { onClose: () => void }) {
  const t = useT(roomDict);
  const save = useRoomSave();
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>('items');
  const [sel, setSel] = useState<ItemId | null>(null);
  const [asking, setAsking] = useState(false);
  const backdrop = useMemo(() => roomBackdrop(240, 170, 118), []);

  useEffect(() => {
    root.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const owned = new Set(save.owned);
  const name = (id: string) => t(`item_${id}` as RoomKey);
  const isOn = (i: Item) => (i.kind === 'decor' ? save.decor.includes(i.id) : i.kind === 'keep' ? false : save.wear[i.kind as 'head' | 'face'] === i.id);
  const use = (i: Item) => {
    if (!owned.has(i.id) || i.kind === 'keep') return;
    if (i.kind === 'decor') toggleDecor(i.id);
    else wear(i.kind as 'head' | 'face', isOn(i) ? null : i.id);
  };
  const chosen = sel ? KEEP.find((i) => i.id === sel) ?? null : null;

  // Arrow keys move through the grid, a row at a time up and down.
  const onGridKey = (e: React.KeyboardEvent) => {
    const buttons = Array.from(grid.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    const cols = buttons.filter((b) => b.offsetTop === buttons[0].offsetTop).length || 1;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key];
    if (!step) return;
    e.preventDefault();
    buttons[Math.min(buttons.length - 1, Math.max(0, at + step))]?.focus();
  };

  const equip = (slot: 'head' | 'face') => {
    const id = save.wear[slot];
    return (
      <button
        type="button"
        className={s.equip}
        data-empty={id ? undefined : ''}
        onClick={() => { if (id) { wear(slot, null); setSel(id); } }}
        aria-label={`${t(slot === 'head' ? 'bagHead' : 'bagFace')}: ${id ? `${name(id)}, ${t('actTakeOff')}` : t('bagNothing')}`}
      >
        {id ? <ItemIcon id={id} className={s.slotIcon} /> : <ItemIcon id={slot === 'head' ? 'partyhat' : 'shades'} className={`${s.slotIcon} ${s.ghost}`} />}
      </button>
    );
  };

  return (
    <div ref={root} className={s.sub} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <SpritePalette />
      <svg viewBox="0 0 240 170" preserveAspectRatio="xMidYMax slice" className={`spr ${s.backdrop}`} shapeRendering="crispEdges" aria-hidden="true">
        <Paths sprite={backdrop} />
      </svg>
      <div className={s.inv}>
        <div className={s.invHead}>
          <h2 id={titleId} tabIndex={-1} className={s.invTitle}>{t('bagTitle')}</h2>
          <div role="tablist" aria-label={t('bagTitle')} className={s.tabs}>
            {TABS.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={s.tab} onClick={() => setTab(x.id)}>
                {t(x.label)}
              </button>
            ))}
          </div>
        </div>

        {tab === 'items' && (
          <div className={s.invBody} role="tabpanel">
            <div className={s.doll}>
              <svg viewBox="-4 -16 48 54" className={`spr ${s.dollMascot}`} shapeRendering="crispEdges" aria-hidden="true">
                <MascotFigure look={IDLE} motionKey="bag" wear={save.wear} />
              </svg>
              <div className={s.equips}>
                {equip('head')}
                {equip('face')}
              </div>
              <p className={s.dollStars}><StarIcon className={s.inlineStar} /> {t('starsLabel', { n: save.stars })}</p>
            </div>

            <div className={s.invMain}>
              <div ref={grid} className={s.slots} onKeyDown={onGridKey}>
                {KEEP.map((i) => {
                  const have = owned.has(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      className={s.slot}
                      data-locked={have ? undefined : ''}
                      data-on={have && isOn(i) ? '' : undefined}
                      aria-pressed={sel === i.id}
                      aria-label={have ? `${name(i.id)}${isOn(i) ? `, ${t(i.kind === 'decor' ? 'bagPlaced' : 'bagWorn')}` : ''}` : t('bagLocked')}
                      onClick={() => setSel(i.id)}
                      onDoubleClick={() => use(i)}
                    >
                      <ItemIcon id={i.id} className={s.slotIcon} />
                      {have && isOn(i) && <span className={s.slotOn} aria-hidden="true"><Check size={11} weight="bold" /></span>}
                    </button>
                  );
                })}
              </div>

              <div className={s.info} aria-live="polite">
                {!chosen ? (
                  <p className={s.infoHint}>{t('bagPick')}</p>
                ) : owned.has(chosen.id) ? (
                  <>
                    <ItemIcon id={chosen.id} className={s.infoIcon} />
                    <div className="min-w-0 flex-1">
                      <p className={s.infoName}>{name(chosen.id)}</p>
                      <p className={s.infoText}>{t(`desc_${chosen.id}` as RoomKey)}</p>
                    </div>
                    {chosen.kind !== 'keep' && (
                      <button type="button" className={`key key-sm ${isOn(chosen) ? s.quiet : 'key-lilac'}`} onClick={() => use(chosen)}>
                        {t(chosen.kind === 'decor' ? (isOn(chosen) ? 'actRemove' : 'actPlace') : isOn(chosen) ? 'actTakeOff' : 'actWear')}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <ItemIcon id={chosen.id} className={`${s.infoIcon} ${s.ghost}`} />
                    <div className="min-w-0 flex-1">
                      <p className={s.infoName}>???</p>
                      <p className={s.infoText}>{chosen.code ? t('bagLockedShop', { code: chosen.code }) : t('bagLockedRare')}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'secrets' && (
          <div role="tabpanel">
            <p className={s.panelSub}>{t('bagFound', { n: save.found.length, total: DISCOVERIES.length })}</p>
            <ul className={s.secrets}>
              {DISCOVERIES.map((d) => (
                <li key={d} data-on={save.found.includes(d) ? '' : undefined}>
                  {save.found.includes(d) ? t(`found_${d}` as RoomKey) : <span aria-label={t('bagSecret')}>???</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'records' && (
          <div role="tabpanel">
            <p className={s.panelSub}>{t('bagRecords')}</p>
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
            {ITEMS.some((i) => (save.eaten[i.id] ?? 0) > 0) && (
              <>
                <p className={s.panelSub}>{t('bagSnacks')}</p>
                <ul className={s.eaten}>
                  {ITEMS.filter((i) => (save.eaten[i.id] ?? 0) > 0).map((i) => (
                    <li key={i.id} aria-label={`${save.eaten[i.id]}× ${name(i.id)}`}>
                      <ItemIcon id={i.id} className={s.eatenIcon} />
                      <span aria-hidden="true">{save.eaten[i.id]}×</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className={s.bagEmpty}>{t('bagPrivacy')}</p>
            {asking ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="key key-sm" onClick={() => setAsking(false)}>{t('bagKeep')}</button>
                <button type="button" className={`key key-sm ${s.danger}`} onClick={() => { resetRoom(); setAsking(false); setSel(null); }}>{t('bagResetSure')}</button>
              </div>
            ) : (
              <button type="button" className={`key key-sm mt-3 ${s.quiet}`} onClick={() => setAsking(true)}>{t('bagReset')}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
