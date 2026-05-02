'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Cookie, Info } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import {
  hasDeclinedPasskey,
  saveSessionCredentials,
  storePasswordCredential,
  getPasswordCredential,
  isPasswordCredentialSupported,
} from '@/lib/passkey';

const STORAGE_KEY = 'pokyh_cookie_consent';

function hasCookieConsent(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// ── Inline SVG icons (no extra dep needed) ──────────────────────────────────
function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function GradCapIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.85)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [userFocus, setUserFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [cookieError, setCookieError] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    function checkConsent() { setConsentGiven(hasCookieConsent()); }
    checkConsent();
    window.addEventListener('storage', checkConsent);
    const iv = setInterval(checkConsent, 500);
    return () => { window.removeEventListener('storage', checkConsent); clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (!isPasswordCredentialSupported()) return;
    setAutoFilling(true);
    getPasswordCredential()
      .then((cred) => { if (cred) { setUsername(cred.username); setPassword(cred.password); } })
      .catch(() => {})
      .finally(() => setAutoFilling(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!consentGiven) {
      setCookieError(true);
      setTimeout(() => setCookieError(false), 3000);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Bitte Benutzername und Passwort eingeben.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Anmelden…');
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
        setLoadingMsg('');
        return;
      }

      setLoadingMsg('Fast fertig…');
      saveSessionCredentials(username.trim(), password);

      if (isPasswordCredentialSupported() && !hasDeclinedPasskey()) {
        storePasswordCredential(username.trim(), password).catch(() => {});
      }

      if (auth && db) {
        const normalUser = username.trim().toLowerCase();
        signInAnonymously(auth).then(async (fbResult) => {
          const fbUid = fbResult.user.uid;
          const userRef = doc(db!, 'users', normalUser);
          const existing = await getDoc(userRef);
          const stableUid = existing.exists() ? existing.data().stableUid : doc(db!, '_').id;
          if (!existing.exists()) {
            await setDoc(userRef, { stableUid, username: normalUser, webuntisKlasseId: data.klasseId, webuntisKlasseName: data.klasseName, createdAt: serverTimestamp() });
          } else {
            await setDoc(userRef, { webuntisKlasseId: data.klasseId, webuntisKlasseName: data.klasseName, updatedAt: serverTimestamp() }, { merge: true });
          }
          await setDoc(doc(db!, 'users', fbUid), { username: normalUser, stableUid, updatedAt: serverTimestamp() });
        }).catch(() => {});
      }

      const raw = params.get('next') ?? '';
      const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
      router.replace(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler.');
      setLoading(false);
      setLoadingMsg('');
    }
  }

  // ── Shared input border style ──────────────────────────────────────────────
  const inputBorder = (focused: boolean) => ({
    border: `1.5px solid ${focused ? 'rgba(139,92,246,0.6)' : 'var(--app-border)'}`,
    background: focused ? 'rgba(139,92,246,0.07)' : 'var(--app-card)',
  });

  const iconColor = (focused: boolean) =>
    focused ? 'rgba(139,92,246,1)' : 'var(--app-text-tertiary)';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex" style={{ background: 'var(--app-bg)' }}>

      {/* ── LEFT PANEL — desktop only ────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between flex-shrink-0 relative overflow-hidden"
        style={{
          width: 420,
          padding: '40px 44px',
          background: 'linear-gradient(155deg, #6D3FE8 0%, #8B5CF6 45%, #A78BFA 100%)',
        }}
      >
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -180, left: -180, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -120, right: -120, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', bottom: 200, left: -80, pointerEvents: 'none' }} />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
          }}>P</div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.95)' }}>
            POKYH
          </span>
        </div>

        {/* Middle — headline */}
        <div className="relative z-10">
          <div style={{
            width: 52, height: 52, borderRadius: 16, marginBottom: 28,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GradCapIcon />
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Deine Schule,<br />alles an einem Ort.
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', maxWidth: 280 }}>
            Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten für LBS Brixen Schüler.
          </p>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-2.5 relative z-10">
          {['Stundenplan & Vertretungen', 'Noten & Schnitt', 'Mensa-Plan', 'Klassen-Erinnerungen', 'Nachrichten & Anhänge'].map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── RIGHT PANEL — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-dvh">
        <div className="w-full max-w-[360px]">


          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,1)', marginBottom: 10 }}>
            POKYH
          </p>
          <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: '1.6rem', color: 'var(--app-text-primary)' }}>
            Willkommen zurück
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--app-text-secondary)' }}>
            Melde dich mit deinem WebUntis-Account an
          </p>

          {/* Cookie notice */}
          {!consentGiven && (
            <div
              className="rounded-xl px-4 py-3 text-sm mb-5 flex items-start gap-2.5 transition-all"
              style={{
                background: cookieError ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                border: `1px solid ${cookieError ? 'color-mix(in srgb, var(--warning) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)'}`,
                color: cookieError ? 'var(--warning)' : 'var(--app-text-secondary)',
              }}
            >
              <Cookie size={16} style={{ flexShrink: 0, marginTop: 1, color: cookieError ? 'var(--warning)' : 'var(--accent)' }} />
              <span>
                {cookieError
                  ? 'Bitte akzeptiere zuerst die Cookie-Einstellungen unten auf der Seite.'
                  : 'Zum Anmelden bitte zuerst die Cookie-Einstellungen bestätigen.'}
              </span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col" noValidate>

            {/* Username */}
            <label style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--app-text-tertiary)', marginBottom: 7 }}>
              Benutzername
            </label>
            <div
              className="flex items-center transition-all duration-150 mb-3"
              style={{ ...inputBorder(userFocus), borderRadius: 12, padding: '0 14px', height: 48 }}
            >
              <span style={{ color: iconColor(userFocus), display: 'flex', marginRight: 10, flexShrink: 0, transition: 'color 0.15s' }}>
                <UserIcon />
              </span>
              <input
                type="text"
                placeholder="Must-Maxi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUserFocus(true)}
                onBlur={() => setUserFocus(false)}
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-sm outline-none ring-0"
                style={{ color: 'var(--app-text-primary)' }}
              />
            </div>

            {/* Password */}
            <label style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--app-text-tertiary)', marginBottom: 7 }}>
              Passwort
            </label>
            <div
              className="flex items-center transition-all duration-150 mb-3"
              style={{ ...inputBorder(passFocus), borderRadius: 12, padding: '0 14px', height: 48 }}
            >
              <span style={{ color: iconColor(passFocus), display: 'flex', marginRight: 10, flexShrink: 0, transition: 'color 0.15s' }}>
                <LockIcon />
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                autoComplete="current-password"
                className="flex-1 bg-transparent text-sm outline-none ring-0"
                style={{ color: 'var(--app-text-primary)' }}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                tabIndex={-1}
                className="p-1 flex-shrink-0 transition-opacity hover:opacity-70"
                style={{ color: 'var(--app-text-tertiary)' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm mb-3"
                style={{
                  background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                  color: 'var(--danger)',
                  border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || autoFilling}
              className="mt-1 w-full text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
              style={{
                height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #5B3FD4, #8B5CF6)',
                border: 'none', cursor: 'pointer',
              }}
            >
              {loading || autoFilling
                ? <><Spinner size={18} /><span>{loadingMsg || 'Anmelden…'}</span></>
                : 'Anmelden'}
            </button>
          </form>

          {/* Hint box */}
          <div
            className="flex items-start gap-2.5 mt-5"
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: 'rgba(167,139,250,1)' }} />
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--app-text-tertiary)' }}>
              Zugangsdaten werden ausschließlich an{' '}
              <Link href="https://lbs-brixen.webuntis.com" className="font-semibold hover:underline" style={{ color: 'rgba(167,139,250,1)' }}>
                lbs-brixen.webuntis.com
              </Link>{' '}
              übertragen.
            </p>
          </div>

          {/* Legal */}
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
  );
}
