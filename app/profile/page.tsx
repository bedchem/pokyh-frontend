'use client';

import { useState } from 'react';
import { ChevronLeft, LogOut, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import { useSession } from '@/providers/SessionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useFirebase } from '@/providers/FirebaseProvider';

type Theme = 'light' | 'dark' | 'system';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <p
      className="px-1 mb-1.5 text-[13px] font-semibold uppercase tracking-wider"
      style={{ color: 'var(--app-text-secondary)' }}
    >
      {label}
    </p>
  );
}

function InfoRow({
  label,
  value,
  copyable,
  separator = true,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  separator?: boolean;
}) {
  const [flash, setFlash] = useState(false);

  async function handleCopy() {
    if (!copyable) return;
    try {
      await navigator.clipboard.writeText(value);
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    } catch {/* ignore */}
  }

  return (
    <div
      className={`px-4 flex items-center gap-3 ${copyable ? 'press-scale cursor-pointer active:opacity-70' : ''}`}
      style={{
        minHeight: 44,
        borderBottom: separator ? '1px solid var(--app-separator)' : 'none',
      }}
      onClick={copyable ? handleCopy : undefined}
    >
      <p className="flex-1 text-[15px]" style={{ color: 'var(--app-text-primary)' }}>
        {label}
      </p>
      <p
        className="text-[15px] transition-colors"
        style={{ color: flash ? 'var(--tint)' : 'var(--app-text-secondary)' }}
      >
        {flash ? 'Kopiert ✓' : value}
      </p>
    </div>
  );
}

const THEME_OPTS: {
  value: Theme;
  label: string;
  bg: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    value: 'light',
    label: 'Hell',
    bg: '#FF9F0A',
    icon: (a) => <Sun size={16} color={a ? '#fff' : 'var(--app-text-secondary)'} />,
  },
  {
    value: 'dark',
    label: 'Dunkel',
    bg: '#636366',
    icon: (a) => <Moon size={16} color={a ? '#fff' : 'var(--app-text-secondary)'} />,
  },
  {
    value: 'system',
    label: 'System',
    bg: '#0A84FF',
    icon: (a) => <Monitor size={16} color={a ? '#fff' : 'var(--app-text-secondary)'} />,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useSession();
  const { theme, setTheme } = useTheme();
  const { stableUid, classId } = useFirebase();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleLogout() {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    setLoggingOut(true);
    await logout();
  }

  const initials = (user?.username ?? 'ME').slice(0, 2).toUpperCase();

  return (
    <AuthGuard>
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)' }}
      >
        {/* Nav bar */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3 fade-in flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full press-scale"
            style={{ background: 'var(--app-surface)' }}
          >
            <ChevronLeft size={20} color="var(--accent)" />
          </button>
          <h1
            className="flex-1 text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            Profil
          </h1>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Avatar hero */}
          <div className="flex flex-col items-center pt-5 pb-8 px-5 fade-in">
            <div
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-[30px] font-bold text-white mb-4"
              style={{
                background: 'linear-gradient(145deg, var(--accent) 0%, #5E5CE6 100%)',
                boxShadow: '0 8px 28px color-mix(in srgb, var(--accent) 40%, transparent)',
              }}
            >
              {initials}
            </div>
            <h2
              className="text-[20px] font-bold tracking-tight"
              style={{ color: 'var(--app-text-primary)' }}
            >
              {user?.username ?? '–'}
            </h2>
            <p className="text-[15px] mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              LBS Brixen{user?.klasseName ? ` · ${user.klasseName}` : ''}
            </p>
          </div>

          <div className="flex flex-col gap-6 px-4 pb-12">
            {/* Account */}
            <section className="fade-in delay-1">
              <SectionHeader label="Konto" />
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--app-surface)' }}
              >
                <InfoRow label="Benutzername" value={user?.username ?? '–'} copyable />
                <InfoRow label="Schüler-ID" value={String(user?.studentId ?? '–')} copyable />
                <InfoRow label="Klasse" value={user?.klasseName ?? '–'} copyable />
                <InfoRow label="Schule" value="LBS Brixen" />
                <InfoRow label="Firebase UID" value={stableUid ?? '…'} copyable />
                <InfoRow label="Klassen-ID" value={classId ?? '…'} copyable separator={false} />
              </div>
            </section>

            {/* Appearance */}
            <section className="fade-in delay-2">
              <SectionHeader label="Darstellung" />
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--app-surface)' }}
              >
                {THEME_OPTS.map((opt, i) => {
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className="w-full px-4 flex items-center gap-3 press-scale"
                      style={{
                        minHeight: 44,
                        borderBottom:
                          i < THEME_OPTS.length - 1
                            ? '1px solid var(--app-separator)'
                            : 'none',
                      }}
                    >
                      {/* SF-symbol style colored icon square */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: active ? opt.bg : 'var(--app-card)' }}
                      >
                        {opt.icon(active)}
                      </div>
                      <span
                        className="flex-1 text-left text-[15px]"
                        style={{ color: 'var(--app-text-primary)' }}
                      >
                        {opt.label}
                      </span>
                      {active && (
                        <Check size={18} color="var(--accent)" strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* App info */}
            <section className="fade-in delay-3">
              <SectionHeader label="App" />
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--app-surface)' }}
              >
                <InfoRow label="App" value="POKYH" />
                <InfoRow label="Version" value="1.0.0" separator={false} />
              </div>
            </section>

            {/* Logout */}
            <section className="fade-in delay-4">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--app-surface)' }}
              >
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full px-4 flex items-center justify-center gap-2 press-scale disabled:opacity-50"
                  style={{ minHeight: 44 }}
                >
                  {loggingOut ? (
                    <Spinner size={18} />
                  ) : (
                    <LogOut size={17} color="var(--danger)" />
                  )}
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: 'var(--danger)' }}
                  >
                    {confirmLogout ? 'Wirklich abmelden?' : 'Abmelden'}
                  </span>
                </button>
              </div>
              {confirmLogout && !loggingOut && (
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="w-full mt-2 text-[15px] py-1.5 press-scale text-center"
                  style={{ color: 'var(--app-text-secondary)' }}
                >
                  Abbrechen
                </button>
              )}
            </section>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
