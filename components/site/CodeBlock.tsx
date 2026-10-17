'use client';

import { useState } from 'react';
import { Check, Copy } from '@phosphor-icons/react';

// A shell snippet with a copy button. Comment lines (#) are dimmed and left
// out of what gets copied. Always dark, in both themes.
export default function CodeBlock({ code, copyLabel, copiedLabel }: { code: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const copy = async () => {
    const text = lines.filter((l) => l.trim() && !l.trim().startsWith('#')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  return (
    <div className="squircle relative rounded-[20px] bg-[var(--night-2)] text-[#F2F2F4]">
      <pre className="overflow-x-auto px-5 py-5 pr-28 text-[14px] leading-[1.7]">
        <code className="mono">
          {lines.map((line, i) => (
            <span key={i} className={`block ${line.trim().startsWith('#') ? 'text-white/50' : ''}`}>
              {line.trim() && !line.trim().startsWith('#') && <span className="select-none text-white/40">$ </span>}
              {line || ' '}
            </span>
          ))}
        </code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/12 px-3.5 text-[13px] font-semibold text-white hover:bg-white/20 transition-colors"
        aria-live="polite"
      >
        {copied ? <Check size={15} weight="bold" aria-hidden="true" /> : <Copy size={15} weight="bold" aria-hidden="true" />}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
