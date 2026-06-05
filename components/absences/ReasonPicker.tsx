'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, Search, Check } from 'lucide-react';
import type { AbsenceReason } from '@/lib/types';

interface Props {
  reasons: AbsenceReason[];
  value: number | null;
  onSelect: (reason: AbsenceReason) => void;
  onBack: () => void;
}

// Full-screen reason chooser (modelled on the WebUntis "Abwesenheitsgrund" list).
export default function ReasonPicker({ reasons, value, onSelect, onBack }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reasons;
    return reasons.filter((r) => r.name.toLowerCase().includes(q));
  }, [reasons, query]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:px-4 sm:py-8"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onBack}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden flex flex-col rounded-t-[28px] sm:rounded-[28px] slide-up"
        style={{ background: 'var(--app-surface)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full press-scale flex-shrink-0"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
            aria-label="Zurück"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-[17px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
            Abwesenheitsgrund
          </h3>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div
            className="flex items-center gap-2 rounded-xl px-3 h-10"
            style={{ background: 'var(--app-card)' }}
          >
            <Search size={16} color="var(--app-text-tertiary)" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Grund suchen…"
              className="flex-1 bg-transparent outline-none text-[14px]"
              style={{ color: 'var(--app-text-primary)' }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] py-10" style={{ color: 'var(--app-text-tertiary)' }}>
              Keine Gründe gefunden.
            </p>
          ) : (
            filtered.map((r) => {
              const selected = r.id === value;
              return (
                <button
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl press-scale text-left"
                  style={{ background: selected ? 'color-mix(in srgb, var(--accent) 12%, var(--app-card))' : 'transparent' }}
                >
                  <span
                    className="text-[15px]"
                    style={{
                      color: selected ? 'var(--accent)' : 'var(--app-text-primary)',
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {r.name}
                  </span>
                  {selected && <Check size={18} color="var(--accent)" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
