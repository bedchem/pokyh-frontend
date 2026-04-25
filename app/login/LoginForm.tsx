'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
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

  // Redirect if already logged in (cookie present)
  useEffect(() => {
    if (user) {
      const next = params.get('next') ?? '/home';
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

      // Firebase anonymous auth (non-blocking, best-effort)
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
      const next = params.get('next') ?? '/home';
      router.replace(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--app-bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* App icon */}
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 rounded-[22px] mx-auto mb-5 flex items-center justify-center text-3xl font-bold text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)' }}
          >
            P
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
            POKYH
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-secondary)' }}>
            LBS Brixen – WebUntis Login
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3" noValidate>
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-[14px]"
            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
          >
            <User size={18} color="var(--app-text-tertiary)" />
            <input
              type="text"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:opacity-60"
              style={{ color: 'var(--app-text-primary)' }}
            />
          </div>

          <div
            className="flex items-center gap-3 rounded-xl px-4 py-[14px]"
            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
          >
            <Lock size={18} color="var(--app-text-tertiary)" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:opacity-60"
              style={{ color: 'var(--app-text-primary)' }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1} className="p-0.5">
              {showPw
                ? <EyeOff size={18} color="var(--app-text-tertiary)" />
                : <Eye size={18} color="var(--app-text-tertiary)" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-[52px] w-full rounded-xl text-white font-semibold text-[17px] tracking-tight press-scale disabled:opacity-50 flex items-center justify-center transition-opacity"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? <Spinner size={20} /> : 'Anmelden'}
          </button>
        </form>

        <p className="text-[11px] text-center mt-8 leading-5" style={{ color: 'var(--app-text-tertiary)' }}>
          Deine Zugangsdaten werden ausschließlich verschlüsselt
          <br />
          an lbs-brixen.webuntis.com übertragen.
        </p>
      </div>
    </div>
  );
}
