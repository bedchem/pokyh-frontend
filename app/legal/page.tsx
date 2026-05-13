import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, Shield, Mail, ArrowLeft, ChevronRight, ExternalLink, Cookie } from 'lucide-react';

type View = 'impressum' | 'datenschutz' | 'cookies' | null;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}): Promise<Metadata> {
  const { view } = await searchParams;
  if (view === 'impressum') {
    return {
      title: 'Impressum',
      description: 'Impressum der POKYH Schulapp für LBS Brixen. Angaben gemäß § 5 ECG (Österreich) & § 25 MedienG.',
      robots: { index: true, follow: false },
      alternates: { canonical: '/legal?view=impressum' },
    };
  }
  if (view === 'datenschutz') {
    return {
      title: 'Datenschutzerklärung',
      description: 'Datenschutzerklärung der POKYH Schulapp gemäß DSGVO. Informationen zu Datenverarbeitung, Cookies und Ihren Rechten.',
      robots: { index: true, follow: false },
      alternates: { canonical: '/legal?view=datenschutz' },
    };
  }
  if (view === 'cookies') {
    return {
      title: 'Cookie-Richtlinie',
      description: 'Cookie-Richtlinie der POKYH Schulapp. Welche Cookies wir verwenden und wie du deine Einwilligung verwalten kannst.',
      robots: { index: true, follow: false },
      alternates: { canonical: '/legal?view=cookies' },
    };
  }
  return {
    title: 'Impressum & Datenschutz',
    description: 'Impressum und Datenschutzerklärung der POKYH Schulapp für LBS Brixen.',
    robots: { index: true, follow: true },
    alternates: { canonical: '/legal' },
  };
}

export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {view === 'impressum' ? (
          <ImpressumView />
        ) : view === 'datenschutz' ? (
          <DatenschutzView />
        ) : view === 'cookies' ? (
          <CookiesView />
        ) : (
          <LandingView />
        )}
      </div>
    </div>
  );
}

/* ─── Landing ─────────────────────────────────────────────────────────────── */

function LandingView() {
  return (
    <div className="fade-in">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press-scale transition-opacity hover:opacity-70"
          style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}
        >
          <ArrowLeft size={15} />
          Zurück
        </Link>
      </div>

      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--app-text-primary)' }}>
        Rechtliches
      </h1>
      <p className="text-sm mb-10" style={{ color: 'var(--app-text-secondary)' }}>
        Impressum und Datenschutzerklärung der POKYH App
      </p>

      <div className="flex flex-col gap-4">
        <Link
          href="/legal?view=impressum"
          className="group rounded-2xl p-6 flex items-center gap-5 press-scale transition-all duration-200 hover:scale-[1.01]"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
          >
            <Scale size={26} color="var(--accent)" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: 'var(--app-text-primary)' }}>Impressum</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              Angaben zum Betreiber, Kontakt und Haftungsausschluss
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--app-text-tertiary)' }} className="flex-shrink-0" />
        </Link>

        <Link
          href="/legal?view=datenschutz"
          className="group rounded-2xl p-6 flex items-center gap-5 press-scale transition-all duration-200 hover:scale-[1.01]"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--tint) 14%, transparent)' }}
          >
            <Shield size={26} color="var(--tint)" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: 'var(--app-text-primary)' }}>Datenschutzerklärung</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              DSGVO-Informationen zu Datenverarbeitung und deinen Rechten
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--app-text-tertiary)' }} className="flex-shrink-0" />
        </Link>

        <Link
          href="/legal?view=cookies"
          className="group rounded-2xl p-6 flex items-center gap-5 press-scale transition-all duration-200 hover:scale-[1.01]"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, #f97316 14%, transparent)' }}
          >
            <Cookie size={26} color="#f97316" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: 'var(--app-text-primary)' }}>Cookie-Richtlinie</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              Welche Cookies wir verwenden und wie du deine Einwilligung verwaltest
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--app-text-tertiary)' }} className="flex-shrink-0" />
        </Link>
      </div>

      <p className="text-center text-xs mt-12" style={{ color: 'var(--app-text-tertiary)' }}>
        Stand: Mai 2026 · POKYH v{process.env.npm_package_version ?? '1.0'}
      </p>
    </div>
  );
}

/* ─── Impressum ───────────────────────────────────────────────────────────── */

function ImpressumView() {
  return (
    <div className="fade-in">
      <div className="mb-8">
        <Link
          href="/legal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press-scale transition-opacity hover:opacity-70"
          style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}
        >
          <ArrowLeft size={15} />
          Rechtliches
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
        >
          <Scale size={20} color="var(--accent)" />
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
          Impressum
        </h1>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-6"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--app-text-tertiary)' }}>
            Angaben gemäß § 5 ECG (Österreich) &amp; § 25 MedienG
          </p>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>
            Medieninhaber &amp; Betreiber
          </p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            Felix Plattner<br />
            Strange 12<br />
            39042 Brixen (BZ), Südtirol, Italien
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>Kontakt</p>
          <a
            href="mailto:contact@pokyh.com"
            className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <Mail size={13} />
            contact@pokyh.com
          </a>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>Zweck der Website</p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            Nicht-kommerzielles Schüler-Informationssystem für Schülerinnen und Schüler der LBS Brixen
            (Landesberufsschule Brixen, Südtirol/Italien). Die App stellt schulische Daten (Stundenplan,
            Noten, Abwesenheiten, Nachrichten) über die offizielle Schulportal-API sowie schulbezogene
            Funktionen (Mensa, Todos, Erinnerungen) übersichtlich dar.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>Technischer Betrieb</p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            Diese Website und das zugehörige Backend werden auf einem eigenen Server von Felix Plattner
            (Privatperson, Brixen, Italien) selbst betrieben. Die öffentliche Erreichbarkeit erfolgt über
            Cloudflare Tunnel, einen Dienst von Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107,
            USA. Cloudflare fungiert dabei als Auftragsverarbeiter gemäß Art. 28 DSGVO für die Weiterleitung
            des Netzwerkverkehrs und hat keinen Zugriff auf verschlüsselte Nutzdaten.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>
            Haftungsausschluss
          </p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            Die POKYH App ist ein inoffizielles, nicht-kommerzielles Projekt und steht in keiner
            Verbindung zur Untis GmbH oder zur LBS Brixen. Die Nutzung der schulischen Stundenplan-API
            erfolgt mit ausdrücklicher Genehmigung der Untis GmbH. Alle Stunden-, Noten- und
            Abwesenheitsdaten werden direkt über den offiziellen API-Zugang abgerufen und nicht dauerhaft
            auf unseren Servern gespeichert.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>
            Urheberrecht
          </p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            Der Quellcode der POKYH App steht unter einer Open-Source-Lizenz auf GitHub zur Verfügung.
            Die verwendeten Bibliotheken unterliegen ihren jeweiligen Lizenzen.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Datenschutz ─────────────────────────────────────────────────────────── */

function DatenschutzView() {
  return (
    <div className="fade-in">
      <div className="mb-8">
        <Link
          href="/legal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press-scale transition-opacity hover:opacity-70"
          style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}
        >
          <ArrowLeft size={15} />
          Rechtliches
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--tint) 14%, transparent)' }}
        >
          <Shield size={20} color="var(--tint)" />
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
          Datenschutzerklärung
        </h1>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-6"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <LegalSection title="1. Verantwortlicher">
          <p>
            Verantwortliche Stelle im Sinne der DSGVO (EU 2016/679) ist Felix Plattner, Strange 12, 39042
            Brixen, Italien. Kontakt:{' '}
            <a href="mailto:contact@pokyh.com" style={{ color: 'var(--accent)' }}>contact@pokyh.com</a>
          </p>
        </LegalSection>

        <LegalSection title="2. Welche Daten verarbeiten wir?">
          <div className="flex flex-col gap-2">
            <DataItem
              label="Schulzugangsdaten (Stundenplan-Login)"
              desc="Dein Benutzername und Passwort werden ausschließlich zur Authentifizierung an deiner Schule's Stundenplan-Server verwendet. Weder Passwort noch Klartext-Zugangsdaten werden gespeichert. Das Session-Token wird AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert."
            />
            <DataItem
              label="Session-Cookie (pockyh_session)"
              desc="Verschlüsseltes httpOnly-Cookie mit dem Schulportal-Session-Token. Läuft beim Logout oder nach 4 Stunden ab. Nicht für JavaScript zugänglich (XSS-Schutz)."
            />
            <DataItem
              label="POKYH-Konto (Alternative Login)"
              desc="Nutzer ohne Schulaccount können sich mit einem POKYH-eigenen Konto registrieren (Benutzername + Passwort). Das Passwort wird bcrypt-gehasht gespeichert. Ein Klartext-Passwort wird niemals gespeichert."
            />
            <DataItem
              label="Benutzer-Cookie (pockyh_user)"
              desc="Enthält nicht-sensible Anzeigeinformationen (Benutzername, Klasse) für die Darstellung in der App. Kein Passwort, kein Token."
            />
            <DataItem
              label="POKYH-Backend (Todos & Erinnerungen)"
              desc="Todos und Klassen-Erinnerungen werden auf dem eigenen POKYH-Backend gespeichert: Titel, Details, Zeitstempel, Benutzername. Löschung jederzeit selbst möglich. Es werden keine externen Cloud-Dienste für diese Funktionen genutzt."
            />
            <DataItem
              label="Google Analytics 4 (GA4)"
              desc="Diese Website verwendet Google Analytics 4 (Google LLC). GA4 erhebt anonymisierte Nutzungsdaten (Seitenaufrufe, Gerätekategorie, Herkunftsland). Die IP-Adresse wird vor Übermittlung an Google anonymisiert (IP-Masking). Es werden keine Werbedaten erhoben. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) zur Verbesserung des Dienstes. Du kannst der Datenerhebung durch Google Analytics unter analytics.google.com/analytics/optout widersprechen."
            />
            <DataItem
              label="Cloudflare Tunnel (Cloudflare, Inc.)"
              desc="Zur öffentlichen Erreichbarkeit des selbst gehosteten Servers wird Cloudflare Tunnel verwendet. Cloudflare verarbeitet dabei Netzwerk-Metadaten (IP-Adressen, Anfrage-Header) zur Weiterleitung des Datenverkehrs. Es werden keine Inhalte dauerhaft gespeichert. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) für den sicheren Serverbetrieb."
            />
            <DataItem
              label="Server-Protokollierung (Request Logs)"
              desc="Der POKYH-Backend-Server speichert automatisch Zugriffsprotokolle: IP-Adresse, HTTP-Methode, aufgerufener Pfad, HTTP-Statuscode, Antwortdauer, Benutzername und User-Agent. Zweck: Sicherheit, Fehlerdiagnose und Missbrauchserkennung. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Logs werden spätestens nach 30 Tagen gelöscht."
            />
            <DataItem
              label="Mobile App (iOS & Android)"
              desc="Die nativen POKYH-Apps speichern Zugangsdaten ausschließlich im verschlüsselten OS-Keychain (iOS) bzw. Android Keystore. iCloud-Synchronisierung ist deaktiviert. Firebase Analytics ist deaktiviert – es werden keine Analysedaten durch die App erhoben. Erinnerungen werden als lokale Gerätbenachrichtigungen ausgeliefert (kein Remote-Push). Update-Prüfungen erfolgen über die öffentliche GitHub-API (kein personenbezogenes Datum übertragen)."
            />
            <DataItem
              label="Lokaler Speicher (localStorage)"
              desc="Für Einstellungen (Theme, Sidebar-Status) wird localStorage genutzt. Diese Daten verlassen nie das Gerät."
            />
          </div>
        </LegalSection>

        <LegalSection title="3. Zweck und Rechtsgrundlage">
          <p>
            Die Verarbeitung erfolgt zur Erbringung des Dienstes (Art. 6 Abs. 1 lit. b DSGVO) sowie auf
            Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Analytics-Daten werden auf
            Grundlage berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO) verarbeitet.
          </p>
        </LegalSection>

        <LegalSection title="4. Drittanbieter">
          <div className="flex flex-col gap-2">
            <ThirdParty
              name="Untis GmbH (Schulportal)"
              purpose="Stundenplan, Noten, Abwesenheiten und Nachrichten – nur bei Schulaccount-Login"
              url="https://www.webuntis.com/privacy-policy"
            />
            <ThirdParty
              name="POKYH Backend (pokyh-backend)"
              purpose="Eigener Server für Todos, Erinnerungen, Klassen-Features und Echtzeit-Updates"
              url="https://github.com/bedchem/pokyh"
            />
            <ThirdParty
              name="Google Analytics 4 (Google LLC)"
              purpose="Anonymisierte Nutzungsstatistiken zur Verbesserung des Dienstes"
              url="https://policies.google.com/privacy"
            />
            <ThirdParty
              name="Cloudflare, Inc."
              purpose="Netzwerkweiterleitung via Cloudflare Tunnel für den selbst gehosteten Server"
              url="https://www.cloudflare.com/privacypolicy/"
            />
            <ThirdParty
              name="Mensa API (plattnericus.dev)"
              purpose="Anzeige des Mensa-Speiseplans"
              url="https://plattnericus.dev"
            />
            <ThirdParty
              name="GitHub API (GitHub, Inc.)"
              purpose="Update-Prüfung der mobilen Apps – es werden keine personenbezogenen Daten übertragen"
              url="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            />
          </div>
        </LegalSection>

        <LegalSection title="5. Datentransfer in Drittländer">
          <p>
            Google LLC und Cloudflare, Inc. sind in den USA ansässig. Der Datentransfer erfolgt auf Basis von
            Standardvertragsklauseln (Art. 46 DSGVO) sowie – im Fall von Google – auf Basis des EU-US
            Data Privacy Framework. Cloudflare ist nach ISO 27001 zertifiziert.
          </p>
        </LegalSection>

        <LegalSection title="6. Speicherdauer">
          <p>
            Session-Cookies werden beim Logout oder nach 30 Minuten gelöscht. Todos und Erinnerungen
            werden auf dem POKYH-Backend gespeichert, bis du sie selbst löschst. Abgeschlossene Todos
            werden nach 24 Stunden automatisch ausgeblendet. Google Analytics-Daten werden nach
            14 Monaten gelöscht.
          </p>
        </LegalSection>

        <LegalSection title="7. Deine Rechte (DSGVO)">
          <p className="mb-2">Du hast folgende Rechte bezüglich deiner personenbezogenen Daten:</p>
          <ul className="flex flex-col gap-1">
            {[
              'Auskunft (Art. 15 DSGVO)',
              'Berichtigung unrichtiger Daten (Art. 16 DSGVO)',
              'Löschung / Recht auf Vergessenwerden (Art. 17 DSGVO)',
              'Einschränkung der Verarbeitung (Art. 18 DSGVO)',
              'Datenübertragbarkeit (Art. 20 DSGVO)',
              'Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen (Art. 21 DSGVO)',
              'Widerruf einer Einwilligung',
            ].map(r => (
              <li key={r} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--tint)' }} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Kontakt:{' '}
            <a href="mailto:contact@pokyh.com" style={{ color: 'var(--accent)' }}>contact@pokyh.com</a>
          </p>
          <p className="mt-2">
            Beschwerde bei der Datenschutzbehörde: In Österreich{' '}
            <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              www.dsb.gv.at
            </a>{' '}· In Italien{' '}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              www.garanteprivacy.it
            </a>
          </p>
        </LegalSection>

        <LegalSection title="8. Datensicherheit">
          <p>
            Alle Verbindungen erfolgen über HTTPS/TLS (bereitgestellt via Cloudflare Tunnel). WebUntis-Session-Tokens
            werden serverseitig AES-GCM-verschlüsselt und ausschließlich in httpOnly-Cookies gespeichert
            (kein JavaScript-Zugriff). Passwörter werden nie gespeichert. Eingaben werden serverseitig validiert.
            Der Server wird auf privater Hardware betrieben und ist ausschließlich über den verschlüsselten
            Cloudflare-Tunnel zugänglich.
          </p>
        </LegalSection>

        <LegalSection title="9. Cookies & Lokaler Speicher">
          <div className="flex flex-col gap-2 mb-3">
            <CookieRow name="pockyh_session" type="Notwendig" desc="Verschlüsseltes Schulportal-Session-Token (httpOnly, AES-GCM, 4 Stunden)" />
            <CookieRow name="pockyh_user" type="Notwendig" desc="Nicht-sensible Benutzerinfo zur Anzeige (kein Token, kein Passwort, 4 Stunden)" />
            <CookieRow name="pockyh_api_token" type="Notwendig" desc="POKYH Backend JWT für API-Zugriff (nicht httpOnly, 8 Stunden)" />
            <CookieRow name="pockyh_api_refresh" type="Notwendig" desc="POKYH Backend Refresh-Token zum automatischen Erneuern des API-Tokens (httpOnly, 30 Tage)" />
            <CookieRow name="pockyh_theme" type="Einstellung" desc="Gespeichertes Farbschema (localStorage, kein Cookie)" />
            <CookieRow name="pockyh_sidebar_collapsed" type="Einstellung" desc="Sidebar-Status (localStorage, kein Cookie)" />
            <CookieRow name="_ga, _ga_*" type="Analytics" desc="Google Analytics 4 – anonymisierte Nutzungsstatistiken (nur bei Einwilligung), 1–2 Jahre Laufzeit" />
          </div>
        </LegalSection>

        <LegalSection title="10. Änderungen dieser Erklärung">
          <p>
            Diese Datenschutzerklärung kann bei Bedarf angepasst werden. Die aktuelle Version ist stets
            unter <strong style={{ color: 'var(--app-text-primary)' }}>/legal?view=datenschutz</strong> abrufbar.
            Stand: Mai 2026.
          </p>
        </LegalSection>
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/legal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press-scale transition-opacity hover:opacity-70"
          style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}
        >
          <ArrowLeft size={15} />
          Zurück zu Rechtliches
        </Link>
      </div>
    </div>
  );
}

/* ─── Cookies ─────────────────────────────────────────────────────────────── */

function CookiesView() {
  return (
    <div className="fade-in">
      <div className="mb-8">
        <Link
          href="/legal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press-scale transition-opacity hover:opacity-70"
          style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}
        >
          <ArrowLeft size={15} />
          Rechtliches
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, #f97316 14%, transparent)' }}
        >
          <Cookie size={20} color="#f97316" />
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
          Cookie-Richtlinie
        </h1>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-6"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <LegalSection title="Was sind Cookies?">
          <p>
            Cookies sind kleine Textdateien, die beim Besuch einer Website auf deinem Gerät gespeichert
            werden. Sie ermöglichen es uns, dich wiederzuerkennen, deine Einstellungen zu speichern und
            den Dienst bereitzustellen. Neben Cookies verwenden wir auch den lokalen Browserspeicher
            (localStorage) für Einstellungen, die ausschließlich auf deinem Gerät verbleiben.
          </p>
        </LegalSection>

        <LegalSection title="Notwendige Cookies">
          <p className="mb-3">
            Diese Cookies sind für den Betrieb der App zwingend erforderlich. Ohne sie funktioniert die
            Anmeldung und Sitzungsverwaltung nicht. Sie können nicht abgelehnt werden.
          </p>
          <div className="flex flex-col gap-2">
            <CookieRow
              name="pockyh_session"
              type="Notwendig"
              desc="Verschlüsseltes WebUntis-Session-Token (AES-GCM, httpOnly). Enthält keine persönlichen Daten im Klartext. Läuft nach 4 Stunden ab."
            />
            <CookieRow
              name="pockyh_user"
              type="Notwendig"
              desc="Nicht-sensible Anzeigeinformationen (Benutzername, Klasse). Kein Passwort, kein Session-Token. Läuft nach 4 Stunden ab."
            />
          </div>
        </LegalSection>

        <LegalSection title="Analytics-Cookies (optional)">
          <p className="mb-3">
            Diese Cookies werden nur gesetzt, wenn du <strong style={{ color: 'var(--app-text-primary)' }}>„Alles akzeptieren"</strong> wählst.
            Sie helfen uns, die App zu verbessern, indem sie anonymisierte Nutzungsdaten erfassen.
          </p>
          <div className="flex flex-col gap-2">
            <CookieRow
              name="_ga"
              type="Analytics"
              desc="Google Analytics 4 – eindeutiger Zähler für Websitebesuche. Läuft nach 2 Jahren ab. IP-Adresse wird vor Übermittlung anonymisiert."
            />
            <CookieRow
              name="_ga_*"
              type="Analytics"
              desc="Google Analytics 4 – Session-Status und Seitenzähler. Läuft nach 2 Jahren ab."
            />
          </div>
        </LegalSection>

        <LegalSection title="Lokaler Speicher (localStorage)">
          <p className="mb-3">
            Diese Einträge werden nur lokal in deinem Browser gespeichert und verlassen niemals dein Gerät.
            Sie sind keine Cookies im rechtlichen Sinne, werden aber der Vollständigkeit halber aufgeführt.
          </p>
          <div className="flex flex-col gap-2">
            <CookieRow
              name="pockyh_theme"
              type="Einstellung"
              desc="Gespeichertes Farbschema (hell/dunkel/System). Kein Ablaufdatum."
            />
            <CookieRow
              name="pockyh_sidebar_collapsed"
              type="Einstellung"
              desc="Sidebar ein- oder ausgeklappt. Kein Ablaufdatum."
            />
            <CookieRow
              name="pokyh_cookie_consent"
              type="Einstellung"
              desc="Deine Cookie-Entscheidung (‚all' oder ‚necessary'). Wird gesetzt, sobald du eine Wahl triffst. Kein Ablaufdatum."
            />
          </div>
        </LegalSection>

        <LegalSection title="Einwilligung widerrufen">
          <p className="mb-3">
            Du kannst deine Einwilligung jederzeit widerrufen, indem du den gespeicherten Eintrag aus
            dem lokalen Speicher entfernst. Danach erscheint das Cookie-Banner erneut.
          </p>
          <div
            className="rounded-xl p-4 text-[13px] font-mono"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
          >
            Browserkonsole öffnen (F12) → Anwendung → Lokaler Speicher → Schlüssel{' '}
            <code style={{ color: 'var(--accent)' }}>pokyh_cookie_consent</code> löschen → Seite neu laden.
          </div>
          <p className="mt-3">
            Alternativ kannst du Google Analytics dauerhaft deaktivieren:{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              Google Analytics Opt-out <ExternalLink size={11} />
            </a>
          </p>
        </LegalSection>

        <LegalSection title="Rechtsgrundlage">
          <p>
            Notwendige Cookies werden auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            gesetzt. Analytics-Cookies werden nur auf Basis deiner ausdrücklichen Einwilligung
            (Art. 6 Abs. 1 lit. a DSGVO) gesetzt. Du kannst deine Einwilligung jederzeit widerrufen,
            ohne dass die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung berührt wird.
          </p>
        </LegalSection>

        <LegalSection title="Kontakt">
          <p>
            Bei Fragen zur Cookie-Nutzung wende dich an:{' '}
            <a href="mailto:contact@pokyh.com" style={{ color: 'var(--accent)' }}>contact@pokyh.com</a>.
            Stand: Mai 2026.
          </p>
        </LegalSection>
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/legal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press-scale transition-opacity hover:opacity-70"
          style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}
        >
          <ArrowLeft size={15} />
          Zurück zu Rechtliches
        </Link>
      </div>
    </div>
  );
}

/* ─── Shared components ──────────────────────────────────────────────────── */

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[15px] font-bold mb-2" style={{ color: 'var(--app-text-primary)' }}>{title}</h3>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

function DataItem({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: 'var(--app-card)' }}>
      <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--app-text-primary)' }}>{label}</p>
      <p className="text-[13px]" style={{ color: 'var(--app-text-secondary)' }}>{desc}</p>
    </div>
  );
}

function ThirdParty({ name, purpose, url }: { name: string; purpose: string; url: string }) {
  return (
    <div className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: 'var(--app-card)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--app-text-primary)' }}>{name}</p>
        <p className="text-[13px]" style={{ color: 'var(--app-text-secondary)' }}>{purpose}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-[12px] flex-shrink-0 mt-0.5 transition-opacity hover:opacity-70"
        style={{ color: 'var(--accent)' }}
      >
        Datenschutz <ExternalLink size={10} />
      </a>
    </div>
  );
}

function CookieRow({ name, type, desc }: { name: string; type: 'Notwendig' | 'Einstellung' | 'Analytics'; desc: string }) {
  const typeColor = type === 'Notwendig'
    ? { bg: 'color-mix(in srgb, var(--tint) 15%, transparent)', text: 'var(--tint)' }
    : type === 'Analytics'
    ? { bg: 'color-mix(in srgb, var(--warning) 15%, transparent)', text: 'var(--warning)' }
    : { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', text: 'var(--accent)' };

  return (
    <div className="rounded-xl p-3.5" style={{ background: 'var(--app-card)' }}>
      <div className="flex items-center gap-2 mb-0.5">
        <code className="text-[12px] font-mono font-semibold" style={{ color: 'var(--accent)' }}>{name}</code>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: typeColor.bg, color: typeColor.text }}
        >
          {type}
        </span>
      </div>
      <p className="text-[13px]" style={{ color: 'var(--app-text-secondary)' }}>{desc}</p>
    </div>
  );
}
