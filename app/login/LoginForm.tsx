'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User, GraduationCap } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useSession } from '@/providers/SessionProvider';
import Spinner from '@/components/ui/Spinner';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refreshUser } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const raw = params.get('next') ?? '';
      // Prevent open redirect: only accept relative paths, never protocol-relative URLs
      const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
      router.replace(next);
    }
  }, [user, router, params]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Bitte Benutzername und Passwort eingeben.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/webuntis/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'same-origin',
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Anmeldung fehlgeschlagen.');
        setLoading(false);
        return;
      }

      try {
        const fbResult = await signInAnonymously(auth);
        const fbUid = fbResult.user.uid;
        const userRef = doc(db, 'users', username.trim());
        const existing = await getDoc(userRef);
        const stableUid = existing.exists() ? existing.data().stableUid : doc(db, '_').id;
        if (!existing.exists()) {
          await setDoc(userRef, {
            stableUid,
            username: username.trim(),
            webuntisKlasseId: data.klasseId,
            webuntisKlasseName: data.klasseName,
            createdAt: serverTimestamp(),
          });
        }
        await setDoc(doc(db, 'users', fbUid), {
          username: username.trim(),
          stableUid,
          updatedAt: serverTimestamp(),
        });
      } catch {
        /* Firebase errors are non-fatal */
      }

      refreshUser();
      const raw = params.get('next') ?? '';
      const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
      router.replace(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex"
      style={{ background: 'var(--app-bg)' }}
    >
      {/* Left panel - branding (hidden on mobile) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12"
        style={{
          background: 'linear-gradient(160deg, #6366F1 0%, #8B5CF6 60%, #4F46E5 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-base">
            P
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">POKYH</span>
        </div>

        <div>
          <GraduationCap size={48} color="rgba(255,255,255,0.8)" className="mb-6" />
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Deine Schule,<br />
            <span className="text-white/70">alles an einem Ort.</span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – alles für LBS Brixen Schüler.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {['Stundenplan', 'Noten & Simulator', 'Mensa-Plan', 'Klassen-Erinnerungen'].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-white/70 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              P
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
              POKYH
            </h1>
          </div>

          <h2 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
            Willkommen zurück
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--app-text-secondary)' }}>
            Melde dich mit deinem WebUntis-Account an
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3" noValidate>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>
                Username
              </label>
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <User size={16} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                  style={{ color: 'var(--app-text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>
                Passwort
              </label>
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <Lock size={16} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                  style={{ color: 'var(--app-text-primary)' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1} className="p-0.5 flex-shrink-0">
                  {showPw
                    ? <EyeOff size={16} style={{ color: 'var(--app-text-tertiary)' }} />
                    : <Eye size={16} style={{ color: 'var(--app-text-tertiary)' }} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-12 w-full rounded-xl text-white font-semibold text-sm press-scale disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              {loading ? <Spinner size={18} /> : 'Anmelden'}
            </button>
          </form>

          <p className="text-[11px] text-center mt-6 leading-5" style={{ color: 'var(--app-text-tertiary)' }}>
            Zugangsdaten werden verschlüsselt an lbs-brixen.webuntis.com übertragen.
          </p>
        </div>
      </div>
    </div>
  );
}
