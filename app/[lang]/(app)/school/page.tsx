'use client';

import { useRouter } from 'next/navigation';
import { BarChart2, Bell, CheckSquare, UserX, ChevronRight } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { schoolDict, type SchoolKey } from '@/lib/i18n/dictionaries/school';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';

interface HubCard {
  title: SchoolKey;
  subtitle: SchoolKey;
  icon: React.ReactNode;
  accent: string;
  href: string;
}

const HUB_CARDS: HubCard[] = [
  {
    title: 'gradesTitle',
    subtitle: 'gradesSubtitle',
    icon: <BarChart2 size={24} color="var(--accent)" />,
    accent: 'var(--accent)',
    href: '/grades',
  },
  {
    title: 'remindersTitle',
    subtitle: 'remindersSubtitle',
    icon: <Bell size={24} color="var(--tint)" />,
    accent: 'var(--tint)',
    href: '/reminders',
  },
  {
    title: 'absencesTitle',
    subtitle: 'absencesSubtitle',
    icon: <UserX size={24} color="var(--orange)" />,
    accent: 'var(--orange)',
    href: '/absences',
  },
  {
    title: 'todosTitle',
    subtitle: 'todosSubtitle',
    icon: <CheckSquare size={24} color="var(--accent-soft)" />,
    accent: 'var(--accent-soft)',
    href: '/todos',
  },
];

export default function SchoolPage() {
  const router = useRouter();
  const t = useT(schoolDict);
  const tm = useT(mensaDict);
  const localize = useLocalizeHref();

  return (
    <AuthGuard>
      <div
        className="h-full flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-5 fade-in flex-shrink-0">
          <h1
            className="text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            {t('pageTitle')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
            {tm('school')}
          </p>
        </div>

        <div className="flex-1 px-4 pb-6 overflow-auto">
          <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HUB_CARDS.map((card) => (
              <button
                key={card.href}
                onClick={() => router.push(localize(card.href))}
                className="p-5 rounded-2xl flex items-center gap-4 press-scale text-left fade-in card-hover"
                style={{
                  background: 'var(--app-surface)',
                  border: `1px solid color-mix(in srgb, ${card.accent} 15%, var(--app-border))`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${card.accent} 12%, transparent)` }}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-base font-semibold" style={{ color: 'var(--app-text-primary)' }}>
                    {t(card.title)}
                  </p>
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--app-text-secondary)' }}>
                    {t(card.subtitle)}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
