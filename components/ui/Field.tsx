'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

// Labelled form controls: the label is always visible, errors are tied to the
// control with aria-describedby, and the inset fill follows the Android inputs.

const control =
  'w-full rounded-[14px] bg-inset px-4 text-[16px] text-ink placeholder:text-ink-3 outline-none ' +
  'transition-[box-shadow,background-color] focus:bg-surface focus:shadow-[0_0_0_2px_var(--accent)] aria-[invalid=true]:shadow-[0_0_0_2px_var(--danger)]';

export function TextField({
  label,
  hint,
  error,
  ...props
}: { label: string; hint?: ReactNode; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-semibold text-ink">{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={`${control} h-12`}
        {...props}
      />
      {hint && !error && <p id={`${id}-hint`} className="text-[13px] text-ink-2">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-[13px] font-medium text-danger-ink">{error}</p>}
    </div>
  );
}

export function PasswordField({
  label,
  showLabel,
  hideLabel,
  error,
  ...props
}: { label: string; showLabel: string; hideLabel: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-semibold text-ink">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`${control} h-12 pr-12`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-2 hover:text-ink"
        >
          {visible ? <EyeSlash size={19} weight="bold" /> : <Eye size={19} weight="bold" />}
        </button>
      </div>
      {error && <p id={`${id}-err`} className="text-[13px] font-medium text-danger-ink">{error}</p>}
    </div>
  );
}

export function TextArea({
  label,
  error,
  ...props
}: { label: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-semibold text-ink">{label}</label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${control} min-h-[110px] py-3 leading-[1.5] resize-y`}
        {...props}
      />
      {error && <p id={`${id}-err`} className="text-[13px] font-medium text-danger-ink">{error}</p>}
    </div>
  );
}

/** Status line under a form: success or failure, announced to screen readers. */
export function FormStatus({ kind, children }: { kind: 'success' | 'error'; children: ReactNode }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-[14px] px-4 py-3 text-[14px] font-medium ${
        kind === 'error' ? 'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger-ink' : 'bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success-ink'
      }`}
    >
      {children}
    </p>
  );
}
