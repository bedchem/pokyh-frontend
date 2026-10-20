'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import { STAR, itemSprite } from '@/components/pixel/collectibles';
import {
  COIN, FLAP, GLASS_BOX, GLASS_SHEEN, KEYS, KEY_BOXES, SIGN_BULBS, SLOTS, VM_H, VM_W,
  displayText, roomBackdrop, slotFrame, spiralTurn, vendingFront, vendingItems, type Key,
} from '@/components/pixel/vending';
import { useT } from '@/providers/LocaleProvider';
import { roomDict, type RoomKey } from '@/lib/i18n/dictionaries/room';
import { prefersReducedMotion } from '@/lib/motion';
import { ITEMS, SECRET_CODE, STUCK_ODDS, itemByCode, itemById, type Item } from './catalog';
import { purchase, roomSnapshot, unlock, useRoomSave } from './store';
import { ItemIcon, StarIcon } from './parts';
import s from './room.module.css';

// The vending machine of room 2B up close. Choose a slot (a click, or its
// code on the keypad or the keyboard: a letter, then a number), pay with
// gold stars, watch the spiral turn and the thing drop, take it out of the
// flap. Now and then something gets stuck and wants a shake; now and then a
// crown falls out as well. The room's number typed on the keypad does
// something too. Snacks and drinks go to the mascot; hats, glasses and
// decorations are kept (components/room/store.ts).

type Phase = 'idle' | 'paying' | 'turning' | 'stuck' | 'falling' | 'tray' | 'taken';

const PRICES = Object.fromEntries(ITEMS.filter((i) => i.code).map((i) => [i.code, i.price]));
const IN_SLOTS = Object.fromEntries(ITEMS.filter((i) => i.code).map((i) => [i.code, i.id]));
const FRONT = vendingFront(PRICES);
const TRAY: [number, number] = [FLAP[0] + 23, FLAP[1] - 1];

export default function Vending({ onClose, onFed, onToast, onFound }: {
  onClose: () => void;
  /** A snack or a drink bought: the mascot has it back in the room. */
  onFed: (item: Item, name: string) => void;
  onToast: (text: string, stars: number) => void;
  onFound: (id: 'code' | 'stuck') => void;
}) {
  const t = useT(roomDict);
  const save = useRoomSave();
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ W: number; H: number } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [drop, setDrop] = useState<{ item: Item; lucky: boolean; secret?: boolean; n: number } | null>(null);
  const [shake, setShake] = useState(0);
  const [note, setNote] = useState<{ key: RoomKey; vars?: Record<string, string | number> } | null>(null);
  const [lcdNote, setLcdNote] = useState<string[] | null>(null);
  const shakesNeeded = useRef(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ W: e.contentRect.width, H: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Focus moves into the machine; Escape goes back to the room.
  useEffect(() => {
    root.current?.querySelector<HTMLElement>('[data-first]')?.focus({ preventScroll: true });
  }, []);

  const item = sel ? itemByCode(sel) ?? null : null;
  const owned = useMemo(() => new Set(save.owned), [save.owned]);
  const stocked = useMemo(() => vendingItems(IN_SLOTS, owned), [owned]);
  const busy = phase === 'paying' || phase === 'turning' || phase === 'falling' || phase === 'stuck';

  const choose = useCallback((code: string) => {
    if (busy) return;
    setSel(code);
    setTyped('');
    setNote(null);
    setLcdNote(null);
    if (phase === 'taken') setPhase('idle');
  }, [busy, phase]);

  // The steps of a purchase, one after the other.
  useEffect(() => {
    const quick = prefersReducedMotion();
    let id = 0;
    if (phase === 'paying') id = window.setTimeout(() => setPhase('turning'), quick ? 0 : 420);
    else if (phase === 'turning') id = window.setTimeout(() => setPhase(shakesNeeded.current > 0 ? 'stuck' : 'falling'), quick ? 0 : 700);
    else if (phase === 'falling') id = window.setTimeout(() => setPhase('tray'), quick ? 0 : 560);
    return () => window.clearTimeout(id);
  }, [phase]);

  const buy = () => {
    if (!item || busy) return;
    const res = purchase(item);
    if (!res.ok) {
      setLcdNote(res.reason === 'stars' ? ['NO', '★'] : ['HAVE', 'IT']);
      setNote(res.reason === 'stars' ? { key: 'vmMissing', vars: { n: item.price - roomSnapshot().stars } } : { key: 'vmOwned' });
      return;
    }
    shakesNeeded.current = Math.random() < 1 / STUCK_ODDS ? 1 + Math.floor(Math.random() * 3) : 0;
    setDrop({ item, lucky: res.lucky, n: Date.now() });
    setNote(null);
    setLcdNote(null);
    setPhase('paying');
  };

  const doShake = () => {
    if (phase !== 'stuck') return;
    setShake((n) => n + 1);
    shakesNeeded.current -= 1;
    if (shakesNeeded.current <= 0) {
      onFound('stuck');
      window.setTimeout(() => setPhase('falling'), prefersReducedMotion() ? 0 : 260);
    }
  };

  const take = () => {
    if (phase !== 'tray' || !drop) return;
    setPhase('taken');
    const name = t(`item_${drop.item.id}` as RoomKey);
    if (drop.item.kind === 'snack') onFed(drop.item, name);
    else onToast(t('toastItem', { name }), 0);
    if (drop.lucky) onToast(t('toastItem', { name: t('item_crown') }), 0);
  };

  // The keypad: a letter and a number choose a slot; the room's number is a secret.
  const press = (k: Key) => {
    if (busy) return;
    if (k === 'X') { setTyped(''); setLcdNote(null); setNote(null); return; }
    if (k === 'OK') {
      if (typed) enterCode(typed);
      else buy();
      return;
    }
    const next = (typed + k).slice(-2);
    setTyped(next);
    setLcdNote(null);
    if (next.length === 2) enterCode(next);
  };
  const enterCode = (code: string) => {
    setTyped('');
    if (code === SECRET_CODE) {
      onFound('code');
      if (unlock('disco')) {
        shakesNeeded.current = 0;
        setDrop({ item: itemById('disco')!, lucky: false, secret: true, n: Date.now() });
        setSel(null);
        setNote({ key: 'vmCode' });
        setPhase('turning');
      } else {
        setLcdNote(['HI', ':)']);
        setNote({ key: 'vmCodeAgain' });
      }
      return;
    }
    if (itemByCode(code)) choose(code);
    else {
      setLcdNote(['ERR', code]);
      setNote({ key: 'vmNoSlot', vars: { code } });
    }
  };

  // Keys of the keyboard work the keypad.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
      const k = e.key.toUpperCase();
      if ((KEYS as readonly string[]).includes(k) && k !== 'OK' && k !== 'X') { e.preventDefault(); press(k as Key); }
      else if (e.key === 'Backspace') { e.preventDefault(); press('X'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Sizes ──────────────────────────────────────────────────────────────
  const wide = box ? box.W >= 680 : true;
  // Narrow: the machine on top, leaving the panel below room for a name, a line and a button.
  const px = box ? (wide ? Math.min((box.H * 0.86) / VM_H, (box.W * 0.48) / VM_W) : Math.min((box.H - 58 - 190) / VM_H, (box.H * 0.6) / VM_H, (box.W * 0.92) / VM_W)) : 4;
  const bw = box ? Math.ceil(box.W / px) + 2 : 0;
  const bh = box ? Math.ceil(box.H / px) + 2 : 0;
  const backdrop = useMemo(() => (bw && bh ? roomBackdrop(bw, bh, Math.round(bh * 0.72)) : null), [bw, bh]);

  // What the display shows.
  const lcd = lcdNote ?? (busy ? ['....', ''] : phase === 'tray' ? ['TAKE', 'ME!'] : typed ? [`${typed}_`, ''] : item ? [item.code!, `${item.price}★`] : ['HI!', '']);
  const slot = drop?.item.code ? SLOTS.find((x) => x.code === drop.item.code) : null;
  const from = slot ? slot.item : [32, 30];
  const spirals = drop?.item.code ? spiralTurn(drop.item.code) : null;

  const message = (() => {
    if (note) return t(note.key, note.vars);
    if (!drop || phase === 'idle') return null;
    if (phase === 'paying' || phase === 'turning' || phase === 'falling') return drop.secret ? t('vmCode') : t('vmTurning');
    if (phase === 'stuck') return t('vmStuck');
    if (phase === 'tray') return t('vmTray');
    const name = t(`item_${drop.item.id}` as RoomKey);
    const got = drop.item.kind === 'snack' ? t(drop.item.drink ? 'vmGotDrink' : 'vmGotSnack', { name }) : t(`vmGot_${drop.item.kind}` as RoomKey, { name });
    return drop.lucky ? `${got} ${t('vmLucky')}` : got;
  })();

  return (
    <div ref={root} className={s.sub} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <SpritePalette />
      {backdrop && (
        <svg viewBox={`0 0 ${bw} ${bh}`} preserveAspectRatio="xMidYMax slice" className={`spr ${s.backdrop}`} shapeRendering="crispEdges" aria-hidden="true">
          <Paths sprite={backdrop} />
        </svg>
      )}
      <h2 id={titleId} className="visually-hidden">{t('vmTitle')}</h2>
      <div className={s.vmLayout} data-wide={wide ? '' : undefined}>
        <div className={s.machine} style={{ width: VM_W * px, height: VM_H * px }} data-shake={shake || undefined} key={`m${shake}`}>
          <svg viewBox={`0 0 ${VM_W} ${VM_H}`} className="spr absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
            <Paths sprite={FRONT} />
            <g className={s.bulbs}>
              <g className={s.frameA}><Paths sprite={SIGN_BULBS[0]} /></g>
              <g className={s.frameB}><Paths sprite={SIGN_BULBS[1]} /></g>
            </g>
            <Paths sprite={stocked} />
            {spirals && phase === 'turning' && (
              <g>
                <g className={s.frameA}><Paths sprite={spirals[0]} /></g>
                <g className={s.frameB}><Paths sprite={spirals[1]} /></g>
              </g>
            )}
            {/* The thing on its way: pushed forward, stuck, falling to the flap. */}
            {drop && (phase === 'turning' || phase === 'stuck' || phase === 'falling') && (
              <g
                key={`${drop.n}-${phase}`}
                className={phase === 'falling' ? s.fall : phase === 'stuck' ? s.stuck : s.push}
                style={{ '--dx': `${TRAY[0] - from[0]}px`, '--dy': `${TRAY[1] - from[1]}px` } as React.CSSProperties}
              >
                <g transform={`translate(${from[0]} ${from[1]})`}><Paths sprite={itemSprite(drop.item.id)} /></g>
              </g>
            )}
            {/* A CSS animation replaces an element's own transform: the moving part sits inside the placed one. */}
            {drop && phase === 'tray' && <g transform={`translate(${TRAY[0]} ${TRAY[1]})`}><g className={s.landed}><Paths sprite={itemSprite(drop.item.id)} /></g></g>}
            {phase === 'paying' && <g transform={`translate(${COIN[0] + 4} ${COIN[1] - 6})`}><g className={s.coin}><Paths sprite={STAR} /></g></g>}
            <Paths sprite={GLASS_SHEEN} />
            {sel && !busy && <g className={s.blink}><Paths sprite={slotFrame(sel)} /></g>}
            <Paths sprite={displayText(lcd)} />
          </svg>

          {SLOTS.map((slot, i) => {
            const it = itemByCode(slot.code)!;
            const name = t(`item_${it.id}` as RoomKey);
            const [x, y, w, h] = slot.box;
            return (
              <button
                key={slot.code}
                type="button"
                data-first={i === 0 ? '' : undefined}
                className={s.vmSlot}
                onClick={() => choose(slot.code)}
                aria-pressed={sel === slot.code}
                aria-label={t('slotLabel', { code: slot.code, name, n: it.price }) + (owned.has(it.id) ? `, ${t('vmOwnedShort')}` : '')}
                style={{ left: x * px, top: y * px, width: w * px, height: h * px }}
              />
            );
          })}
          {KEYS.map((k) => {
            const [x, y, w, h] = KEY_BOXES[k];
            return (
              <button
                key={k}
                type="button"
                className={s.vmKey}
                onClick={() => press(k)}
                aria-label={k === 'X' ? t('keyClear') : k === 'OK' ? t('keyOk') : t('keyLabel', { k })}
                style={{ left: (x - 0.5) * px, top: (y - 0.5) * px, width: (w + 1) * px, height: (h + 1) * px }}
              />
            );
          })}
          <span className="visually-hidden" aria-live="polite">{lcd.join(' ')}</span>
          {phase === 'tray' && (
            <button type="button" className={s.vmFlap} onClick={take} aria-label={t('vmTake')} style={{ left: FLAP[0] * px, top: FLAP[1] * px, width: FLAP[2] * px, height: FLAP[3] * px }} />
          )}
          {phase === 'stuck' && (
            <button type="button" className={s.vmGlass} onClick={doShake} aria-label={t('vmShake')} style={{ left: GLASS_BOX[0] * px, top: GLASS_BOX[1] * px, width: GLASS_BOX[2] * px, height: GLASS_BOX[3] * px }} />
          )}
        </div>

        <div className={s.panel} aria-live="polite">
          {phase === 'taken' && drop ? (
            <div className={s.reveal}>
              <ItemIcon id={drop.item.id} className={s.revealIcon} />
              {drop.lucky && <ItemIcon id="crown" className={s.revealIcon} />}
              <p className={s.panelTitle}>{t(`item_${drop.item.id}` as RoomKey)}</p>
              <p className={s.panelText}>{message}</p>
              <button type="button" className="key key-sm key-lilac" onClick={() => { setPhase('idle'); setDrop(null); }}>{t('vmAgain')}</button>
            </div>
          ) : item ? (
            <>
              <div className={s.panelHead}>
                <ItemIcon id={item.id} className={s.panelIcon} />
                <div className="min-w-0">
                  <p className={s.panelTitle}>{t(`item_${item.id}` as RoomKey)}</p>
                  <p className={s.panelKind}>{item.code} · {t(item.drink ? 'kind_drink' : `kind_${item.kind}` as RoomKey)}</p>
                </div>
              </div>
              <p className={s.panelText}>{message ?? t(`desc_${item.id}` as RoomKey)}</p>
              <div className={s.panelActions}>
                {phase === 'stuck' ? (
                  <button type="button" className="key key-sm key-lilac" onClick={doShake}>{t('vmShake')}</button>
                ) : busy ? null : phase === 'tray' ? (
                  <button type="button" className="key key-sm key-lilac" onClick={take}>{t('vmTake')}</button>
                ) : item.kind !== 'snack' && owned.has(item.id) ? (
                  <span className={s.panelNote}>{t('vmOwned')}</span>
                ) : (
                  <button type="button" className="key key-sm key-lilac" onClick={buy} disabled={busy} aria-disabled={save.stars < item.price || undefined}>
                    {t('vmBuy')}
                    <span className={s.price}><StarIcon className={s.priceStar} />{item.price}</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className={s.panelTitle}>{t('vmTitle')}</p>
              <p className={s.panelText}>{message ?? t('vmHint')}</p>
              {phase === 'stuck' && <div className={s.panelActions}><button type="button" className="key key-sm key-lilac" onClick={doShake}>{t('vmShake')}</button></div>}
              {phase === 'tray' && <div className={s.panelActions}><button type="button" className="key key-sm key-lilac" onClick={take}>{t('vmTake')}</button></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
