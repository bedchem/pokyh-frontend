/**
 * The Ladin translation was machine-translated and verified by an automated
 * pass, but has not been reviewed by a native speaker yet — flag it wherever
 * Ladin is selectable in a dropdown list (not on the trigger button itself).
 */
export default function LadinWarningBadge() {
  return (
    <span className="relative inline-flex ml-auto flex-shrink-0 group/ladin">
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold leading-none cursor-help"
        style={{ background: 'var(--warning)', color: '#1a1a1a' }}
        aria-label="Warning: this Ladin translation may not be fully accurate"
      >
        !
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 mb-2 w-44 rounded-lg px-2.5 py-2 text-[11px] leading-snug opacity-0 scale-95 origin-bottom-right transition-all duration-150 group-hover/ladin:opacity-100 group-hover/ladin:scale-100 z-[60]"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          color: 'var(--app-text-primary)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
        }}
      >
        Ladin translation is machine-generated and hasn&apos;t been reviewed by a native speaker yet — it may contain errors.
        <span
          className="absolute top-full right-2 -mt-[5px] w-2.5 h-2.5 rotate-45"
          style={{ background: 'var(--app-surface)', borderRight: '1px solid var(--app-border)', borderBottom: '1px solid var(--app-border)' }}
        />
      </span>
    </span>
  );
}
