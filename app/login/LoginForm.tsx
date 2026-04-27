'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, ShieldCheck, Key, X } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useSession } from '@/providers/SessionProvider';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import {
  hasDeclinedPasskey,
  setPasskeyDeclined,
  saveSessionCredentials,
  storePasswordCredential,
  getPasswordCredential,
  isPasswordCredentialSupported,
} from '@/lib/passkey';

function PasskeyPrompt({
  username,
  password,
  onClose,
}: {
  username: string;
  password: string;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await storePasswordCredential(username, password);
    setSaved(true);
    setSaving(false);
    setTimeout(onClose, 1200);
  }

  function handleDecline() {
    setPasskeyDeclined();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full rounded-t-2xl px-6 pt-2 pb-10 slide-up"
        style={{ background: 'var(--app-surface)', maxWidth: 480, margin: '0 auto' }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: 'var(--app-border)' }} />

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
          >
            <Key size={22} color="var(--accent)" />
          </div>
          <div>
            <p className="font-bold text-[17px]" style={{ color: 'var(--app-text-primary)' }}>
              Anmeldedaten speichern?
            </p>
            <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
              Für schnellen Zugriff ohne Passwort
            </p>
          </div>
        </div>

        <p className="text-[14px] mb-5" style={{ color: 'var(--app-text-secondary)' }}>
          Deine Anmeldedaten werden sicher im Passwort-Manager deines Browsers gespeichert.
          Du kannst dich damit beim nächsten Mal schneller anmelden.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="h-12 w-full rounded-xl text-white font-semibold text-sm press-scale disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            {saving ? <Spinner size={18} /> : saved ? 'Gespeichert ✓' : 'Speichern'}
          </button>
          <button
            onClick={handleDecline}
            className="h-12 w-full rounded-xl font-medium text-sm press-scale"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
          >
            Nein, danke
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refreshUser } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [userFocus, setUserFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [passkeyUsername, setPasskeyUsername] = useState('');
  const [passkeyPassword, setPasskeyPassword] = useState('');
  const [autoFilling, setAutoFilling] = useState(false);

  useEffect(() => {
    if (user) {
      const raw = params.get('next') ?? '';
      const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
      router.replace(next);
    }
  }, [user, router, params]);

  // Try to auto-fill saved credentials
  useEffect(() => {
    if (!isPasswordCredentialSupported()) return;
    setAutoFilling(true);
    getPasswordCredential()
      .then((cred) => {
        if (cred) {
          setUsername(cred.username);
          setPassword(cred.password);
        }
      })
      .catch(() => {})
      .finally(() => setAutoFilling(false));
  }, []);

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

      // Store credentials in sessionStorage so profile page can offer to save them
      saveSessionCredentials(username.trim(), password);

      // Firebase is non-blocking
      if (auth && db) {
        signInAnonymously(auth).then(async (fbResult) => {
          const fbUid = fbResult.user.uid;
          const userRef = doc(db!, 'users', username.trim());
          const existing = await getDoc(userRef);
          const stableUid = existing.exists() ? existing.data().stableUid : doc(db!, '_').id;
          if (!existing.exists()) {
            await setDoc(userRef, {
              stableUid,
              username: username.trim(),
              webuntisKlasseId: data.klasseId,
              webuntisKlasseName: data.klasseName,
              createdAt: serverTimestamp(),
            });
          }
          await setDoc(doc(db!, 'users', fbUid), {
            username: username.trim(),
            stableUid,
            updatedAt: serverTimestamp(),
          });
        }).catch(() => { /* non-fatal */ });
      }

      refreshUser();

      // Show passkey prompt if supported and not declined
      if (isPasswordCredentialSupported() && !hasDeclinedPasskey()) {
        setPasskeyUsername(username.trim());
        setPasskeyPassword(password);
        setShowPasskeyPrompt(true);
        setLoading(false);
        return;
      }

      const raw = params.get('next') ?? '';
      const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
      router.replace(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler.');
      setLoading(false);
    }
  }

  function handlePasskeyClose() {
    setShowPasskeyPrompt(false);
    const raw = params.get('next') ?? '';
    const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
    router.replace(next);
  }

  return (
    <>
      <div className="min-h-dvh flex" style={{ background: 'var(--app-bg)' }}>
        {/* Left panel — branding, desktop only */}
        <div
          className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #6366F1 0%, #8B5CF6 60%, #4F46E5 100%)' }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-32 -left-16 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)' }}
          />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-base">
              P
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">POKYH</span>
          </div>

          <div className="relative z-10">
            <GraduationCap size={44} color="rgba(255,255,255,0.7)" className="mb-5" />
            <h2 className="text-[2.2rem] font-bold text-white leading-tight mb-3">
              Deine Schule,<br />
              <span className="text-white/60">alles an einem Ort.</span>
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed">
              Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten für LBS Brixen Schüler.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 relative z-10">
            {['Stundenplan & Vertretungen', 'Noten & Schnitt', 'Mensa-Plan', 'Klassen-Erinnerungen', 'Nachrichten & Anhänge'].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                <span className="text-white/60 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-dvh">
          <div className="w-full max-w-[360px]">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-10">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                P
              </div>
              <p className="text-xl font-bold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
                POKYH
              </p>
            </div>

            <h1 className="text-[1.6rem] font-bold tracking-tight mb-1" style={{ color: 'var(--app-text-primary)' }}>
              Willkommen zurück
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--app-text-secondary)' }}>
              Melde dich mit deinem WebUntis-Account an
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-3" noValidate>
              {/* Username */}
              <div
                className="flex items-center gap-3 rounded-xl px-4 h-12 transition-all duration-150"
                style={{
                  background: 'var(--app-surface)',
                  border: `1.5px solid ${userFocus ? 'var(--accent)' : 'var(--app-border)'}`,
                  boxShadow: userFocus ? '0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent)' : 'none',
                }}
              >
                <input
                  type="text"
                  placeholder="Benutzername"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUserFocus(true)}
                  onBlur={() => setUserFocus(false)}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent text-sm outline-none ring-0 placeholder:opacity-40"
                  style={{ color: 'var(--app-text-primary)' }}
                />
              </div>

              {/* Password */}
              <div
                className="flex items-center gap-3 rounded-xl px-4 h-12 transition-all duration-150"
                style={{
                  background: 'var(--app-surface)',
                  border: `1.5px solid ${passFocus ? 'var(--accent)' : 'var(--app-border)'}`,
                  boxShadow: passFocus ? '0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent)' : 'none',
                }}
              >
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-sm outline-none ring-0 placeholder:opacity-40"
                  style={{ color: 'var(--app-text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  tabIndex={-1}
                  className="p-1 flex-shrink-0 transition-opacity hover:opacity-70"
                >
                  {showPw
                    ? <EyeOff size={16} style={{ color: 'var(--app-text-tertiary)' }} />
                    : <Eye size={16} style={{ color: 'var(--app-text-tertiary)' }} />}
                </button>
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                    color: 'var(--danger)',
                    border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || autoFilling}
                className="mt-1 h-12 w-full rounded-xl text-white font-semibold text-sm press-scale disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                {loading || autoFilling ? <Spinner size={18} /> : 'Anmelden'}
              </button>
            </form>

            {/* Security note */}
            <div className="flex items-center gap-2 mt-5 justify-center">
              <ShieldCheck size={13} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
              <p className="text-[11px] leading-4 text-center" style={{ color: 'var(--app-text-tertiary)' }}>
                Zugangsdaten werden verschlüsselt an lbs-brixen.webuntis.com übertragen
              </p>
            </div>

            {/* Legal links */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/legal" className="text-xs transition-opacity hover:opacity-70" style={{ color: 'var(--app-text-tertiary)' }}>
                Impressum
              </Link>
              <span style={{ color: 'var(--app-text-tertiary)' }} className="text-xs">·</span>
              <Link href="/legal#datenschutz" className="text-xs transition-opacity hover:opacity-70" style={{ color: 'var(--app-text-tertiary)' }}>
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Passkey save prompt */}
      {showPasskeyPrompt && (
        <PasskeyPrompt
          username={passkeyUsername}
          password={passkeyPassword}
          onClose={handlePasskeyClose}
        />
      )}
    </>
  );
}
