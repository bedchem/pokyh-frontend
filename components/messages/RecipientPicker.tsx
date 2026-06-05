'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, Search, Check } from 'lucide-react';
import type { MessageRecipient } from '@/lib/types';

interface Props {
  recipients: MessageRecipient[];
  selectedIds: number[];
  onToggle: (r: MessageRecipient) => void;
  onBack: () => void;
}

// Recipient chooser (modelled on the WebUntis "Mitteilung an Lehrkraft" picker):
// grouped into Klassenlehrkraft / Andere, multi-select with avatar initials.
export default function RecipientPicker({ recipients, selectedIds, onToggle, onBack }: Props) {
  const [query, setQuery] = useState('');
  const sel = new Set(selectedIds);

  const { classTeachers, others } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (r: MessageRecipient) => !q || r.name.toLowerCase().includes(q);
    return {
      classTeachers: recipients.filter((r) => r.category === 'classTeacher' && match(r)),
      others: recipients.filter((r) => r.category !== 'classTeacher' && match(r)),
    };
  }, [recipients, query]);

  function Group({ title, items }: { title: string; items: MessageRecipient[] }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-1.5" style={{ color: 'var(--app-text-tertiary)' }}>
          {title}
        </p>
        {items.map((r) => {
          const isSel = sel.has(r.id);
          return (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => onToggle(r)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl press-scale text-left"
              style={{ background: isSel ? 'color-mix(in srgb, var(--accent) 12%, var(--app-card))' : 'transparent' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                {r.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] truncate" style={{ color: 'var(--app-text-primary)', fontWeight: isSel ? 600 : 400 }}>
                  {r.name}
                </p>
                {r.role && (
                  <p className="text-[12px] truncate" style={{ color: 'var(--app-text-secondary)' }}>{r.role}</p>
                )}
              </div>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: isSel ? 'var(--accent)' : 'transparent',
                  border: isSel ? 'none' : '1.5px solid var(--app-text-tertiary)',
                }}
              >
                {isSel && <Check size={13} color="#fff" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

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
            aria-label="Fertig"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="flex-1 text-[17px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
            Empfänger
          </h3>
          <button
            onClick={onBack}
            className="text-[14px] font-semibold press-scale"
            style={{ color: 'var(--accent)' }}
          >
            Fertig{selectedIds.length ? ` (${selectedIds.length})` : ''}
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 rounded-xl px-3 h-10" style={{ background: 'var(--app-card)' }}>
            <Search size={16} color="var(--app-text-tertiary)" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Lehrkraft suchen…"
              className="flex-1 bg-transparent outline-none text-[14px]"
              style={{ color: 'var(--app-text-primary)' }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {recipients.length === 0 ? (
            <p className="text-center text-[13px] py-10" style={{ color: 'var(--app-text-tertiary)' }}>
              Keine Empfänger verfügbar.
            </p>
          ) : (
            <>
              <Group title="Klassenlehrkraft" items={classTeachers} />
              <Group title="Andere" items={others} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
