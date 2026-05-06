'use client';

import { useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const FAQ_ITEMS = [
  {
    q: 'Was ist POKYH?',
    a: 'POKYH ist eine kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen (Landesberufsschule Brixen, Südtirol). Sie bündelt alle wichtigen Schulinformationen – Stundenplan, Noten, Abwesenheiten, Nachrichten und Mensa – in einer modernen, übersichtlichen Oberfläche.',
  },
  {
    q: 'Wer kann POKYH nutzen?',
    a: 'POKYH steht ausschließlich Schülerinnen und Schülern des Berufsbildungszentrums Christian Josef Tschuggmall (LBS Brixen) zur Verfügung, die einen aktiven Schulaccount haben.',
  },
  {
    q: 'Ist POKYH kostenlos?',
    a: 'Ja, POKYH ist vollständig kostenlos und werbefrei. Die App ist ein nicht-kommerzielles, von Schülern entwickeltes Open-Source-Projekt ohne Abo-Kosten.',
  },
  {
    q: 'Welche Funktionen bietet POKYH?',
    a: 'POKYH bietet: Stundenplan (Tages- und Wochenansicht mit Prüfungen und Vertretungen), Notenübersicht mit automatischem Gesamtschnitt, Mensa-Speiseplan mit Nährwerten und Bewertungen, Nachrichten-Inbox mit Anhängen, Abwesenheits-Tracking mit Jahresübersicht, klassenweite Erinnerungen für Prüfungen und eine persönliche Todo-Liste.',
  },
  {
    q: 'Wie melde ich mich bei POKYH an?',
    a: 'Die Anmeldung bei POKYH erfolgt mit deinen Schulzugangsdaten (Benutzername und Passwort) — denselben, die du für WebUntis verwendest. Dein Passwort wird niemals gespeichert – nur ein verschlüsseltes Session-Token.',
  },
  {
    q: 'Ist POKYH sicher?',
    a: 'Ja. POKYH speichert keine Passwörter. Das Session-Token wird serverseitig AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert, auf das JavaScript keinen Zugriff hat. Alle API-Aufrufe erfolgen serverseitig.',
  },
  {
    q: 'Was ist der Unterschied zwischen POKYH und WebUntis?',
    a: 'POKYH verwendet die WebUntis-API, um dieselben Schuldaten – Stundenplan, Noten, Abwesenheiten und Nachrichten – in einer moderneren, schnellen und übersichtlicheren Oberfläche darzustellen. POKYH ist ein inoffizielles, von Schülern entwickeltes Open-Source-Projekt und steht in keiner offiziellen Verbindung zur WebUntis GmbH.',
  },
  {
    q: 'Speichert POKYH mein WebUntis-Passwort?',
    a: 'Nein. POKYH speichert dein Passwort niemals. Das WebUntis-Session-Token wird serverseitig AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert, das für JavaScript nicht zugänglich ist. Nur dein Benutzername wird intern für Klassen-Funktionen verwendet.',
  },
  {
    q: 'Funktioniert POKYH auf dem Smartphone?',
    a: 'Ja, POKYH ist vollständig für Mobile optimiert und funktioniert auf iPhone, Android und allen modernen Smartphones. Pokyh bietet eine Kostenlose Open-Source App zum download an.',
  },
  {
    q: 'Zeigt POKYH auch Vertretungen und Stundenplanänderungen an?',
    a: 'Ja. POKYH zeigt alle Stundenplanänderungen in Echtzeit an – Vertretungen, Entfälle und zusätzliche Stunden sind farblich klar gekennzeichnet.',
  },
  {
    q: 'Wo befindet sich die LBS Brixen?',
    a: 'Die LBS Brixen (Landesberufsschule, auch Berufsbildungszentrum Christian Josef Tschuggmall) befindet sich in Brixen, Südtirol, Italien. POKYH ist speziell für Schülerinnen und Schüler dieser Schule entwickelt worden.',
  },
  {
    q: 'Kann ich den Quellcode von POKYH einsehen?',
    a: 'Ja! POKYH ist vollständig Open Source. Den Quellcode findest du auf GitHub unter github.com/bedchem/pokyh — unter der MIT-Lizenz. Du kannst POKYH auch selbst hosten.',
  },
];

export default function FaqClient() {
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen(prev => (prev === i ? null : i));

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">Häufige Fragen</div>
        <h1 className="lp-page-hero-h1">FAQ</h1>
        <p className="lp-page-hero-sub">
          Alles, was du über POKYH wissen musst — von der Anmeldung bis zur Sicherheit.
        </p>
      </div>

      <div className="lp-page-content">
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`lp-faq-item${open === i ? ' open' : ''}`}>
              <button className="lp-faq-q" onClick={() => toggle(i)} aria-expanded={open === i}>
                <span className="lp-faq-q-text">{item.q}</span>
                <span className="lp-faq-q-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </button>
              <div className="lp-faq-a" aria-hidden={open !== i}>
                <div className="lp-faq-a-inner">{item.a}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '72px 0 40px' }}>
          <h2 className="lp-h2">Noch Fragen?</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            Melde dich einfach an und probier es aus — kostenlos, jederzeit.
          </p>
          <div style={{ display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/login" className="lp-btn">Mit WebUntis anmelden</Link>
            <a href="https://github.com/bedchem/pokyh" target="_blank" rel="noopener noreferrer" className="lp-alink">GitHub</a>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
