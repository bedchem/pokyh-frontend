'use client';

import { useRouter } from 'next/navigation';
import { BarChart2, Bell, CheckSquare, UserX, ChevronRight } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';

interface HubCard {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  href: string;
}

const HUB_CARDS: HubCard[] = [
  {
    title: 'Noten',
    subtitle: 'Alle Fächer & Bewertungen',
    icon: <BarChart2 size={24} color="var(--accent)" />,
    accent: 'var(--accent)',
    href: '/grades',
  },
  {
    title: 'Erinnerungen',
    subtitle: 'Hausaufgaben & Klassen-Erinnerungen',
    icon: <Bell size={24} color="var(--tint)" />,
    accent: 'var(--tint)',
    href: '/reminders',
  },
  {
    title: 'Abwesenheiten',
    subtitle: 'Fehlstunden & Entschuldigungen',
    icon: <UserX size={24} color="var(--orange)" />,
    accent: 'var(--orange)',
    href: '/absences',
  },
  {
    title: 'Todos',
    subtitle: 'Persönliche Aufgabenliste',
    icon: <CheckSquare size={24} color="var(--accent-soft)" />,
    accent: 'var(--accent-soft)',
    href: '/todos',
  },
];

export default function SchoolPage() {
  const router = useRouter();

  return (
    <AuthGuard>
      <div
        className="h-dvh flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)', paddingBottom: 'var(--nav-h)' }}
      >
        {/* Header */}
        <div className="px-5 pt-14 pb-5 fade-in flex-shrink-0">
          <h1
            className="text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            Schule
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
            LBS Brixen
          </p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-3.5 pb-4 overflow-auto">
          {HUB_CARDS.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className="w-full p-5 rounded-[18px] flex items-center gap-4 press-scale text-left fade-in"
              style={{
                background: 'var(--app-surface)',
                border: `1px solid color-mix(in srgb, ${card.accent} 15%, transparent)`,
              }}
            >
              <div
                className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                style={{ background: `color-mix(in srgb, ${card.accent} 12%, transparent)` }}
              >
                {card.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[18px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                  {card.title}
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
                  {card.subtitle}
                </p>
              </div>

              <ChevronRight size={18} color="var(--app-text-tertiary)" />
            </button>
          ))}
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
