import type { ReactNode } from 'react';

export default function EmptyView({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-center">
      <div className="opacity-40">{icon}</div>
      <p className="text-base font-semibold" style={{ color: 'var(--app-text-primary)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
