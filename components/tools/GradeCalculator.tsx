'use client';

import { useId, useMemo, useState, useSyncExternalStore } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { useLocale, useT } from '@/providers/LocaleProvider';
import { toolsDict, type ToolsKey } from '@/lib/i18n/dictionaries/tools';
import type { Locale } from '@/lib/i18n/locale';
import {
  GRADE_SCALES, SCALE_IDS, SIGN_STEPS, isPassing, neededGrade, parseGrade, parseWeight, weightedAverage,
  type ScaleId, type WeightedGrade,
} from '@/lib/school-math';
import { NumberField, SelectField, formatNumber } from './fields';

// Grade average with weights and the grade the next test needs. Everything
// stays in this component's state: nothing is stored or sent.

const SCALE_LABEL: Record<ScaleId, ToolsKey> = {
  it: 'scaleIt', de: 'scaleDe', de15: 'scaleDe15', at: 'scaleAt', ch: 'scaleCh',
};

/** The scale most people reading this language use, before the browser says more. */
const LOCALE_SCALE: Record<Locale, ScaleId> = { de: 'de', it: 'it', en: 'it', lld: 'it' };

/** The scale of the visitor's country, from the browser's language list (de-AT → Austria). */
function regionScale(): ScaleId | null {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const [lang, region] = tag.toLowerCase().split('-');
    if (region === 'it' || (lang === 'it' && !region)) return 'it';
    if (region === 'at') return 'at';
    if (region === 'ch') return 'ch';
    if (region === 'de') return 'de';
  }
  return null;
}

const noSubscribe = () => () => {};

/** Rounds to two decimals on the safe side, so the shown grade is really enough. */
function towardsBetter(value: number, id: ScaleId): number {
  return GRADE_SCALES[id].best === 'high' ? Math.ceil(value * 100 - 1e-9) / 100 : Math.floor(value * 100 + 1e-9) / 100;
}

type Row = { id: number; grade: string; weight: string };

export default function GradeCalculator() {
  const t = useT(toolsDict);
  const { locale } = useLocale();
  const uid = useId();
  const detected = useSyncExternalStore(noSubscribe, regionScale, () => null);
  const [picked, setPicked] = useState<ScaleId | null>(null);
  const scaleId = picked ?? detected ?? LOCALE_SCALE[locale];
  const scale = GRADE_SCALES[scaleId];
  const [step, setStep] = useState<number>(SIGN_STEPS[0]);
  const [rows, setRows] = useState<Row[]>(() => [1, 2, 3].map((id) => ({ id, grade: '', weight: '' })));
  const [target, setTarget] = useState('');
  const [nextWeight, setNextWeight] = useState('');

  const parsed = useMemo(
    () => rows.map((r) => {
      const empty = !r.grade.trim();
      const value = empty ? null : parseGrade(r.grade, scale, step);
      const weightValue = parseWeight(r.weight);
      return { ...r, empty, value, weightValue };
    }),
    [rows, scale, step],
  );
  const grades: WeightedGrade[] = parsed
    .filter((r) => r.value !== null && r.weightValue !== null)
    .map((r) => ({ value: r.value as number, weight: r.weightValue as number }));
  const average = weightedAverage(grades);
  const fmt = (n: number) => formatNumber(n, locale);

  const targetValue = target.trim() ? parseGrade(target, scale, step) : null;
  const targetWeight = parseWeight(nextWeight);
  const needed = targetValue !== null && targetWeight !== null && grades.length
    ? neededGrade(grades, targetValue, targetWeight, scale)
    : null;

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = () => setRows((rs) => [...rs, { id: Math.max(0, ...rs.map((r) => r.id)) + 1, grade: '', weight: '' }]);
  const remove = (id: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : [{ ...rs[0], grade: '', weight: '' }]));
  const placeholder = (i: number) => {
    const samples = scale.best === 'high' ? [scale.pass + 1, scale.pass, scale.pass + 2] : [scale.pass - 1, scale.pass - 2, scale.pass];
    return fmt(samples[i % samples.length]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <div className="card flex flex-col gap-6 p-5 sm:p-7 md:p-8">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <SelectField
            id={`${uid}-scale`}
            label={t('gScale')}
            value={scaleId}
            options={SCALE_IDS.map((id) => ({ value: id, label: t(SCALE_LABEL[id]) }))}
            onChange={setPicked}
          />
          <SelectField
            id={`${uid}-step`}
            label={t('gSigns')}
            value={String(step)}
            options={SIGN_STEPS.map((s) => ({ value: String(s), label: `± ${fmt(s)}` }))}
            onChange={(v) => setStep(Number(v))}
          />
        </div>

        <div>
          <div aria-hidden="true" className="mb-1.5 grid grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_40px] gap-3 px-1 text-[13.5px] font-semibold text-ink-2">
            <span>{t('gGrade')}</span>
            <span>{t('gWeight')}</span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {parsed.map((r, i) => (
              <li key={r.id}>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_40px] items-center gap-3">
                  <NumberField
                    id={`${uid}-g${r.id}`}
                    label={t('gRow', { n: i + 1 })}
                    hideLabel
                    value={r.grade}
                    placeholder={placeholder(i)}
                    invalid={!r.empty && r.value === null}
                    onChange={(e) => update(r.id, { grade: e.target.value })}
                    inputMode="text"
                    maxLength={6}
                  />
                  <NumberField
                    id={`${uid}-w${r.id}`}
                    label={`${t('gWeight')} ${i + 1}`}
                    hideLabel
                    value={r.weight}
                    placeholder="1"
                    invalid={r.weightValue === null}
                    onChange={(e) => update(r.id, { weight: e.target.value })}
                    maxLength={5}
                  />
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    aria-label={t('gRemove', { n: i + 1 })}
                    className="grid size-10 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink"
                  >
                    <X size={16} weight="bold" aria-hidden="true" />
                  </button>
                </div>
                {!r.empty && r.value === null && (
                  <p className="mt-1 px-1 text-[13px] font-medium text-[var(--danger)]">{t('gInvalid')}</p>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={add} className="key key-line">
              <Plus size={16} weight="bold" aria-hidden="true" />
              {t('gAdd')}
            </button>
            <button
              type="button"
              onClick={() => setRows([1, 2, 3].map((id) => ({ id, grade: '', weight: '' })))}
              className="rounded-full px-4 py-2.5 text-[14px] font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              {t('gClear')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <section aria-live="polite" className="card flex flex-col gap-2 p-6 sm:p-7 md:p-8">
          <h2 className="text-[15px] font-semibold text-ink-2">{t('gAverage')}</h2>
          {average === null ? (
            <p className="py-4 text-[16px] leading-[1.55] text-ink-3">{t('gEmpty')}</p>
          ) : (
            <>
              <p className="font-display text-[clamp(64px,9vw,104px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums">{fmt(average)}</p>
              <p className="flex flex-wrap items-center gap-2 text-[15px] text-ink-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${
                    isPassing(average, scale) ? 'bg-sage text-sage-ink' : 'bg-blush text-blush-ink'
                  }`}
                >
                  {isPassing(average, scale) ? t('gPass') : t('gFail')}
                </span>
                {t('gCount', { n: grades.length })}
              </p>
            </>
          )}
        </section>

        <section className="card flex flex-col gap-4 p-6 sm:p-7 md:p-8">
          <h2 className="text-[19px] font-bold tracking-[-0.02em]">{t('gTargetTitle')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id={`${uid}-target`}
              label={t('gTarget')}
              value={target}
              placeholder={fmt(scale.pass)}
              invalid={!!target.trim() && targetValue === null}
              onChange={(e) => setTarget(e.target.value)}
              maxLength={6}
            />
            <NumberField
              id={`${uid}-next`}
              label={t('gNextWeight')}
              value={nextWeight}
              placeholder="1"
              invalid={targetWeight === null}
              onChange={(e) => setNextWeight(e.target.value)}
              maxLength={5}
            />
          </div>
          <p aria-live="polite" className="min-h-[3em] text-[16px] font-medium leading-[1.5]">
            {!grades.length
              ? <span className="text-ink-3">{t('gEmpty')}</span>
              : needed === null
                ? <span className="text-ink-3">{t('gNeedEmpty')}</span>
                : needed.kind === 'any'
                  ? t('gNeedAny')
                  : needed.kind === 'impossible'
                    ? t('gNeedImpossible')
                    : t('gNeed', { x: fmt(towardsBetter(needed.value, scaleId)) })}
          </p>
        </section>

        <p className="px-2 text-[13.5px] leading-[1.55] text-ink-3">{t('privacy')} {t('disclaimer')}</p>
      </div>
    </div>
  );
}
