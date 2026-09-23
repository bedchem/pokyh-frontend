/**
 * Small inline SVG flags for the language switchers. Emoji regional-indicator
 * flags don't render as flags on Windows in most browsers (they fall back to
 * two-letter text), so these are plain SVGs instead. Ladin has no ISO country
 * code / emoji flag — this uses the actual Ladin flag (a horizontal
 * blue/white/green tricolour: sky, mountains, meadows), not a placeholder.
 */
import type { Locale } from '@/lib/i18n/locale';

type FlagProps = { size?: number; className?: string };

const VIEWBOX = '0 0 24 16';

function FlagDE({ size = 18, className }: FlagProps) {
  return (
    <svg viewBox={VIEWBOX} width={size} height={(size * 16) / 24} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#000000" />
      <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
      <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
    </svg>
  );
}

function FlagIT({ size = 18, className }: FlagProps) {
  return (
    <svg viewBox={VIEWBOX} width={size} height={(size * 16) / 24} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#FFFFFF" />
      <rect width="8" height="16" fill="#009246" />
      <rect x="16" width="8" height="16" fill="#CE2B37" />
    </svg>
  );
}

function FlagEN({ size = 18, className }: FlagProps) {
  return (
    <svg viewBox={VIEWBOX} width={size} height={(size * 16) / 24} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#00247D" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFFFFF" strokeWidth="3.2" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#CF142B" strokeWidth="1.3" />
      <path d="M12,0 V16 M0,8 H24" stroke="#FFFFFF" strokeWidth="5.4" />
      <path d="M12,0 V16 M0,8 H24" stroke="#CF142B" strokeWidth="2.1" />
    </svg>
  );
}

function FlagLD({ size = 18, className }: FlagProps) {
  return (
    <svg viewBox={VIEWBOX} width={size} height={(size * 16) / 24} className={className} aria-hidden="true">
      <rect width="24" height="5.33" fill="#1B4F9C" />
      <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
      <rect y="10.67" width="24" height="5.33" fill="#3BA655" />
    </svg>
  );
}

const FLAG_COMPONENTS: Record<Locale, (props: FlagProps) => React.ReactElement> = {
  de: FlagDE,
  it: FlagIT,
  en: FlagEN,
  lld: FlagLD,
};

export default function FlagIcon({ locale, size, className }: { locale: Locale; size?: number; className?: string }) {
  const Flag = FLAG_COMPONENTS[locale];
  return <Flag size={size} className={className} />;
}
