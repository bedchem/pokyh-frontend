import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, Shield, Mail, ChevronRight, ExternalLink, Cookie } from 'lucide-react';
import { CookieSettingsButton } from '@/components/CookieSettingsButton';
import LegalBackButton from '@/components/ui/LegalBackButton';
import LocaleSwitcher from '@/components/legal/LocaleSwitcher';
import { legalLocale, type LegalLocale } from '@/components/legal/legalLocale';
import { getLegalIdentity, type LegalIdentity } from '@/lib/legal-identity';
import { routeLocale } from '@/lib/i18n/server';
import { ACTIVE_LOCALES } from '@/lib/i18n/locale';
import { ogLocale } from '@/lib/i18n/seo';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ view?: string; lang?: string }>;
}): Promise<Metadata> {
  const { view } = await searchParams;
  const locale = await routeLocale(params);
  const copy = landingCopy[locale];
  const known = view === 'impressum' || view === 'datenschutz' || view === 'cookies' || view === 'learn';
  const query = known ? `?view=${view}` : '';
  const alternates = {
    canonical: `/${locale}/legal/${query}`,
    languages: {
      ...Object.fromEntries(ACTIVE_LOCALES.map((l) => [l, `/${l}/legal/${query}`])),
      'x-default': `/de/legal/${query}`,
    },
  };
  const [title, description] =
    view === 'impressum' ? [copy.impressumTitle, copy.impressumDesc]
    : view === 'datenschutz' ? [copy.datenschutzTitle, copy.datenschutzDesc]
    : view === 'cookies' ? [copy.cookiesTitle, copy.cookiesDesc]
    : view === 'learn' ? [copy.learnTitle, copy.learnDesc]
    : [copy.title, copy.subtitle];
  return {
    title,
    description,
    robots: { index: true, follow: !known },
    alternates,
    openGraph: { title, description, ...ogLocale(locale) },
  };
}

export default async function LegalPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ view?: string; lang?: string }>;
}) {
  const { view, lang } = await searchParams;
  const { lang: routeLang } = await params;
  const locale = legalLocale(lang ?? routeLang);
  const identity = getLegalIdentity();

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {view === 'impressum' ? (
          <ImpressumView locale={locale} identity={identity} />
        ) : view === 'datenschutz' ? (
          <DatenschutzView locale={locale} identity={identity} />
        ) : view === 'cookies' ? (
          <CookiesView locale={locale} identity={identity} />
        ) : view === 'learn' ? (
          <LearnPrivacyView locale={locale} identity={identity} />
        ) : (
          <LandingView locale={locale} />
        )}
      </div>
    </div>
  );
}

/* ─── Shared UI chrome (back-button labels, landing screen) ─────────────────── */

const backLabelsCopy: Record<LegalLocale, { toLegal: string; backToLegal: string; topBack: string }> = {
  de: { toLegal: 'Rechtliches', backToLegal: 'Zurück zu Rechtliches', topBack: 'Zurück' },
  it: { toLegal: 'Note legali', backToLegal: 'Torna a Note legali', topBack: 'Indietro' },
  en: { toLegal: 'Legal', backToLegal: 'Back to Legal', topBack: 'Back' },
  lld: { toLegal: 'Nfurmazions giuridiches', backToLegal: 'Zeruch ala nfurmazions giuridiches', topBack: 'Zeruch' },
};

const landingCopy: Record<LegalLocale, {
  title: string;
  subtitle: string;
  impressumTitle: string;
  impressumDesc: string;
  datenschutzTitle: string;
  datenschutzDesc: string;
  cookiesTitle: string;
  cookiesDesc: string;
  learnTitle: string;
  learnDesc: string;
  footerLine: string;
}> = {
  de: {
    title: 'Rechtliches',
    subtitle: 'Impressum und Datenschutzerklärung der POKYH App',
    impressumTitle: 'Impressum',
    impressumDesc: 'Angaben zum Betreiber, Kontakt und Haftungsausschluss',
    datenschutzTitle: 'Datenschutzerklärung',
    datenschutzDesc: 'DSGVO-Informationen zu Datenverarbeitung und deinen Rechten',
    cookiesTitle: 'Cookie-Richtlinie',
    cookiesDesc: 'Welche Cookies wir verwenden und wie du deine Einwilligung verwaltest',
    learnTitle: 'Pokyh Learn · Privacy',
    learnDesc: 'Informationen zur WebUntis-Verifizierung und zum digitalen Lernen',
    footerLine: 'Stand: September 2026',
  },
  it: {
    title: 'Note legali',
    subtitle: 'Impressum e informativa sulla privacy dell’app POKYH',
    impressumTitle: 'Impressum',
    impressumDesc: 'Dati sul gestore, contatti ed esclusione di responsabilità',
    datenschutzTitle: 'Informativa sulla privacy',
    datenschutzDesc: 'Informazioni GDPR sul trattamento dei dati e sui tuoi diritti',
    cookiesTitle: 'Informativa sui cookie',
    cookiesDesc: 'Quali cookie utilizziamo e come gestire il tuo consenso',
    learnTitle: 'Pokyh Learn · Privacy',
    learnDesc: 'Informativa per la verifica WebUntis e l’apprendimento digitale',
    footerLine: 'Versione: settembre 2026',
  },
  en: {
    title: 'Legal',
    subtitle: 'Imprint and privacy notice of the POKYH app',
    impressumTitle: 'Imprint',
    impressumDesc: 'Operator details, contact, and disclaimer',
    datenschutzTitle: 'Privacy notice',
    datenschutzDesc: 'GDPR information on data processing and your rights',
    cookiesTitle: 'Cookie policy',
    cookiesDesc: 'Which cookies we use and how to manage your consent',
    learnTitle: 'Pokyh Learn · Privacy',
    learnDesc: 'Information on WebUntis verification and digital learning',
    footerLine: 'Version: September 2026',
  },
  lld: {
    title: 'Nfurmazions giuridiches',
    subtitle: 'Impressum y nfurmazion sun la privacy dl’app POKYH',
    impressumTitle: 'Impressum',
    impressumDesc: 'Dac sun l gestor, cuntat y esclujion dla respunsabltà',
    datenschutzTitle: 'Nfurmazion sun la privacy',
    datenschutzDesc: 'Nfurmazions GDPR sun l tratamënt di dac y sun ti dërc',
    cookiesTitle: 'Regules di cookies',
    cookiesDesc: 'Cie cookies che nëus adurvon y coche tu pos ministré ti cunsëntimënt',
    learnTitle: 'Pokyh Learn · Privacy',
    learnDesc: 'Nfurmazions sun la verifica WebUntis y sun l mparé digitel',
    footerLine: 'Stat: setëmber 2026',
  },
};

/* ─── Landing ─────────────────────────────────────────────────────────────── */

function LandingView({ locale }: { locale: LegalLocale }) {
  const copy = landingCopy[locale];
  const back = backLabelsCopy[locale];
  return (
    <div className="fade-in">
      <div className="mb-8 flex items-center justify-between gap-4">
        <LegalBackButton label={back.topBack} />
        <LocaleSwitcher view="landing" locale={locale} />
      </div>

      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--app-text-primary)' }}>
        {copy.title}
      </h1>
      <p className="text-sm mb-10" style={{ color: 'var(--app-text-secondary)' }}>
        {copy.subtitle}
      </p>

      <div className="flex flex-col gap-4">
        <Link
          href={`/${locale}/legal/?view=impressum`}
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
            <h2 className="text-lg font-bold" style={{ color: 'var(--app-text-primary)' }}>{copy.impressumTitle}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              {copy.impressumDesc}
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--app-text-tertiary)' }} className="flex-shrink-0" />
        </Link>

        <Link
          href={`/${locale}/legal/?view=datenschutz`}
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
            <h2 className="text-lg font-bold" style={{ color: 'var(--app-text-primary)' }}>{copy.datenschutzTitle}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              {copy.datenschutzDesc}
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--app-text-tertiary)' }} className="flex-shrink-0" />
        </Link>

        <Link
          href={`/${locale}/legal/?view=cookies`}
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
            <h2 className="text-lg font-bold" style={{ color: 'var(--app-text-primary)' }}>{copy.cookiesTitle}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              {copy.cookiesDesc}
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--app-text-tertiary)' }} className="flex-shrink-0" />
        </Link>

        <Link
          href={`/${locale}/legal/?view=learn`}
          className="group rounded-2xl p-6 flex items-center gap-5 press-scale transition-all duration-200 hover:scale-[1.01]"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
          >
            <Shield size={26} color="var(--accent)" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: 'var(--app-text-primary)' }}>{copy.learnTitle}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              {copy.learnDesc}
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--app-text-tertiary)' }} className="flex-shrink-0" />
        </Link>
      </div>

      <p className="text-center text-xs mt-12" style={{ color: 'var(--app-text-tertiary)' }}>
        {copy.footerLine} · POKYH v{process.env.npm_package_version ?? '1.0'}
      </p>
    </div>
  );
}

/* ─── Impressum ───────────────────────────────────────────────────────────── */

const impressumCopy: Record<LegalLocale, {
  title: string;
  badge: string;
  ownerLabel: string;
  contactLabel: string;
  purposeLabel: string;
  purpose: string;
  operationLabel: string;
  operation: string;
  disclaimerLabel: string;
  disclaimer: string;
  copyrightLabel: string;
  copyright: string;
}> = {
  de: {
    title: 'Impressum',
    badge: 'Angaben zum Betreiber und Verantwortlichen (Art. 13 DSGVO) · kostenloses, nicht-kommerzielles Projekt',
    ownerLabel: 'Betreiber',
    contactLabel: 'Kontakt',
    purposeLabel: 'Zweck der Website',
    purpose: 'Digitales Informations- und Lernangebot für berechtigte Nutzerinnen und Nutzer. Schul- oder Drittanbieter-Integrationen werden nur im jeweils freigegebenen Umfang aktiviert; die konkret genutzten Daten und Dienste sind in der Datenschutzerklärung beschrieben.',
    operationLabel: 'Technischer Betrieb',
    operation: 'Die technische Bereitstellung erfolgt im Auftrag des in diesem Impressum genannten Betreibers. Aktive Hosting-, Sicherheits- und Analyse-Dienste sowie die jeweils zutreffenden Empfänger sind in der Datenschutzerklärung aufgeführt.',
    disclaimerLabel: 'Haftungsausschluss',
    disclaimer: 'POKYH ist unabhängig von Untis und Schulen. Ein Zugriff auf WebUntis- oder schulische Schnittstellen darf ausschließlich nach dokumentierter Freigabe durch die zuständige Schule bzw. den Verantwortlichen und unter den jeweils geltenden Vertrags- und Datenschutzvorgaben aktiviert werden. Ohne diese Freigabe bleibt eine entsprechende Integration deaktiviert.',
    copyrightLabel: 'Urheberrecht',
    copyright: 'Der Quellcode der POKYH App steht unter einer Open-Source-Lizenz auf GitHub zur Verfügung. Die verwendeten Bibliotheken unterliegen ihren jeweiligen Lizenzen.',
  },
  it: {
    title: 'Impressum',
    badge: 'Informazioni sul gestore e titolare del trattamento (art. 13 GDPR) · progetto gratuito e non commerciale',
    ownerLabel: 'Gestore del sito',
    contactLabel: 'Contatto',
    purposeLabel: 'Finalità del sito',
    purpose: 'Servizio digitale di informazione e apprendimento per utenti autorizzati. Le integrazioni scolastiche o di terze parti sono attivate solo nell’ambito autorizzato; i dati e i servizi effettivamente utilizzati sono descritti nell’informativa privacy.',
    operationLabel: 'Gestione tecnica',
    operation: 'La fornitura tecnica avviene per conto del gestore indicato in questo Impressum. I servizi di hosting, sicurezza e analisi attivi e i relativi destinatari sono indicati nell’informativa privacy.',
    disclaimerLabel: 'Esclusione di responsabilità',
    disclaimer: 'POKYH è indipendente da Untis e dalle scuole. L’accesso a WebUntis o alle interfacce scolastiche può essere attivato esclusivamente dopo un’autorizzazione documentata da parte della scuola competente o del titolare, nel rispetto delle condizioni contrattuali e di protezione dei dati applicabili. In assenza di tale autorizzazione, la relativa integrazione resta disattivata.',
    copyrightLabel: 'Diritto d’autore',
    copyright: 'Il codice sorgente dell’app POKYH è disponibile su GitHub con licenza open source. Le librerie utilizzate sono soggette alle rispettive licenze.',
  },
  en: {
    title: 'Imprint',
    badge: 'Operator and controller information (GDPR Art. 13) · free, non-commercial project',
    ownerLabel: 'Site operator',
    contactLabel: 'Contact',
    purposeLabel: 'Purpose of the website',
    purpose: 'A digital information and learning service for authorised users. School or third-party integrations are enabled only within their authorised scope; the data and services actually used are described in the privacy notice.',
    operationLabel: 'Technical operation',
    operation: 'Technical delivery is carried out on behalf of the operator named in this imprint. Active hosting, security, and analytics services and the applicable recipients are listed in the privacy notice.',
    disclaimerLabel: 'Disclaimer',
    disclaimer: 'POKYH is independent from Untis and schools. Access to WebUntis or other school interfaces may only be activated after documented authorisation from the responsible school or controller, under the applicable contractual and data-protection terms. Without that authorisation, the corresponding integration remains disabled.',
    copyrightLabel: 'Copyright',
    copyright: 'The POKYH app source code is available under an open-source licence on GitHub. The libraries used are subject to their respective licences.',
  },
  lld: {
    title: 'Impressum',
    badge: 'Nfurmazions sun l gestor y l titular dl tratamënt (art. 13 GDPR) · proiet debant y nia comerziel',
    ownerLabel: 'Gestor',
    contactLabel: 'Cuntat',
    purposeLabel: 'Fin dla plata web',
    purpose: 'Servisc digitel de nfurmazion y de mparé per utënc autorisei. Integrazions cun la scola o cun furnidëures terzi vën ativedes mé tl ambit autorisà; i dac y i servijes che vën adurvei dassënn ie descric tla nfurmazion sun la privacy.',
    operationLabel: 'Gestion tecnica',
    operation: 'La metuda a dispuzion tecnica suzed per cont dl gestor numinà te chësc Impressum. I servijes de hosting, segurëza y analisa atifs y i destinatars che vel per ei ie listei sù tla nfurmazion sun la privacy.',
    disclaimerLabel: 'Esclujion dla respunsabltà',
    disclaimer: 'POKYH ie ndependënt da Untis y dala scoles. L’azes a WebUntis o a interfacies dla scola possa vester ativà mé do n’autorisazion documenteda dla scola cumpetënta o dl titular y aldò dla cundizions de cuntrat y de prutezion di dac che vel. Zënza chësta autorisazion resta la integrazion curispundënta destudeda.',
    copyrightLabel: 'Dërt de autor',
    copyright: 'L codesc sorgënt dl’app POKYH ie a dispuzion sun GitHub cun na licënza open source. La librarìes adurvedes ie sotmetudes a si licënzes.',
  },
};

function ImpressumView({ locale, identity }: { locale: LegalLocale; identity: LegalIdentity }) {
  const copy = impressumCopy[locale];
  const back = backLabelsCopy[locale];
  return (
    <div className="fade-in">
      <div className="mb-8 flex items-center justify-between gap-4">
        <LegalBackButton label={back.toLegal} fallbackUrl={`/${locale}/legal/`} />
        <LocaleSwitcher view="impressum" locale={locale} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
        >
          <Scale size={20} color="var(--accent)" />
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
          {copy.title}
        </h1>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-6"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--app-text-tertiary)' }}>
            {copy.badge}
          </p>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>
            {copy.ownerLabel}
          </p>
          <LegalIdentityDetails locale={locale} identity={identity} includeContact={false} />
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>{copy.contactLabel}</p>
          <a
            href={`mailto:${identity.contactEmail}`}
            className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <Mail size={13} />
            {identity.contactEmail}
          </a>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>{copy.purposeLabel}</p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            {copy.purpose}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>{copy.operationLabel}</p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            {copy.operation}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>
            {copy.disclaimerLabel}
          </p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            {copy.disclaimer}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text-primary)' }}>
            {copy.copyrightLabel}
          </p>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            {copy.copyright}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Datenschutz ─────────────────────────────────────────────────────────── */

type DataItemCopy = { label: string; desc: string };
type ThirdPartyCopy = { name: string; purpose: string; url: string };
type CookieRowCopy = { name: string; kind: CookieKind; desc: string };

const datenschutzCopy: Record<LegalLocale, {
  title: string;
  s1Title: string;
  s1Controller: string;
  s1ContactLabel: string;
  s1Dpo: string;
  s2Title: string;
  dataItems: DataItemCopy[];
  s3Title: string;
  s3: string;
  s4Title: string;
  thirdParties: ThirdPartyCopy[];
  thirdPartyLinkLabel: string;
  s5Title: string;
  s5: string;
  s6Title: string;
  s6: string;
  s7Title: string;
  rightsIntro: string;
  rights: string[];
  rightsContactLabel: string;
  complaintPrefix: string;
  s8Title: string;
  s8: string;
  s9Title: string;
  cookieKindLabels: Record<CookieKind, string>;
  cookieRows: CookieRowCopy[];
  s10Title: string;
  s10Before: string;
  s10After: string;
}> = {
  de: {
    title: 'Datenschutzerklärung',
    s1Title: '1. Verantwortlicher',
    s1Controller: 'Verantwortliche Stelle im Sinne der DSGVO (EU) 2016/679 ist:',
    s1ContactLabel: 'Kontakt:',
    s1Dpo: 'Für Fragen zum Datenschutz ist die oben genannte Kontaktstelle erreichbar. Falls ein Datenschutzbeauftragter bestellt ist oder bestellt werden muss, werden dessen verifizierte Kontaktdaten hier veröffentlicht.',
    s2Title: '2. Welche Daten verarbeiten wir?',
    dataItems: [
      { label: 'Schulzugangsdaten (Stundenplan-Login)', desc: 'Dein Benutzername und Passwort werden ausschließlich zur Authentifizierung am Stundenplan-Server deiner Schule verwendet und nie auf POKYH-Servern gespeichert. Damit eine abgelaufene Sitzung automatisch erneuert werden kann, bleiben sie auf der Website nur im Sitzungsspeicher (sessionStorage) des geöffneten Browser-Tabs und werden beim Schließen des Tabs gelöscht. Das Session-Token wird AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert.' },
      { label: 'Session-Cookie (pockyh_session)', desc: 'Verschlüsseltes httpOnly-Cookie mit dem Schulportal-Session-Token. Läuft beim Logout oder nach 4 Stunden ab. Nicht für JavaScript zugänglich (XSS-Schutz).' },
      { label: 'POKYH-Konto (alternative Anmeldung)', desc: 'Nutzer ohne Schulaccount können sich mit einem POKYH-eigenen Konto registrieren (Benutzername + Passwort). Das Passwort wird bcrypt-gehasht gespeichert. Ein Klartext-Passwort wird niemals gespeichert.' },
      { label: 'Benutzer-Cookie (pockyh_user)', desc: 'Enthält nicht-sensible Anzeigeinformationen (Benutzername, Klasse) für die Darstellung in der App. Kein Passwort, kein Token.' },
      { label: 'POKYH-Backend (Todos & Erinnerungen)', desc: 'Todos und Klassen-Erinnerungen werden auf dem eigenen POKYH-Backend gespeichert: Titel, Details, Zeitstempel, Benutzername. Löschung jederzeit selbst möglich. Es werden keine externen Cloud-Dienste für diese Funktionen genutzt.' },
      { label: 'Mensa-Bewertungen & Kommentare', desc: 'Wenn du ein Gericht bewertest oder kommentierst, speichert das POKYH-Backend Sternebewertung bzw. Kommentartext, Benutzername, interne Benutzer-ID und Zeitstempel. Kommentare sind mit deinem Benutzernamen für andere angemeldete Nutzer sichtbar; Bewertungen erscheinen nur als Durchschnitt und Anzahl. Eigene Kommentare kannst du jederzeit löschen.' },
      { label: 'Push-Benachrichtigungen (Website, optional)', desc: 'Nur wenn du Benachrichtigungen im Browser erlaubst: Das POKYH-Backend speichert die Push-Adresse (Endpoint) deines Browsers zusammen mit deiner Benutzer-ID. Zugestellt werden die Benachrichtigungen über den Push-Dienst deines Browser-Herstellers (z. B. Google, Mozilla oder Apple). Widerruf jederzeit in den Browser-Einstellungen.' },
      { label: 'Google Analytics 4 (GA4)', desc: 'Diese Website verwendet Google Analytics 4 (Google LLC), aber ausschließlich nach deiner ausdrücklichen Einwilligung im Cookie-Banner. GA4 erhebt anonymisierte Nutzungsdaten (Seitenaufrufe, Gerätekategorie, Herkunftsland). Die IP-Adresse wird vor Übermittlung an Google anonymisiert (IP-Masking). Es werden keine Werbedaten erhoben. Rechtsgrundlage: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit über das Cookie-Banner widerrufen oder der Datenerhebung zusätzlich unter analytics.google.com/analytics/optout widersprechen.' },
      { label: 'Cloudflare Tunnel (Cloudflare, Inc.)', desc: 'Zur öffentlichen Erreichbarkeit des selbst gehosteten Servers wird Cloudflare Tunnel verwendet. Cloudflare verarbeitet dabei Netzwerk-Metadaten (IP-Adressen, Anfrage-Header) zur Weiterleitung des Datenverkehrs. Es werden keine Inhalte dauerhaft gespeichert. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) für den sicheren Serverbetrieb.' },
      { label: 'Server-Protokollierung (Request Logs)', desc: 'Der POKYH-Backend-Server speichert automatisch Zugriffsprotokolle: IP-Adresse, HTTP-Methode, aufgerufener Pfad, HTTP-Statuscode, Antwortdauer, Benutzername und User-Agent. Zweck: Sicherheit, Fehlerdiagnose und Missbrauchserkennung. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Logs werden spätestens nach 30 Tagen gelöscht.' },
      { label: 'Mobile App (iOS & Android)', desc: 'Die nativen POKYH-Apps speichern Zugangsdaten ausschließlich verschlüsselt auf dem Gerät (iOS-Keychain bzw. mit einem Schlüssel aus dem Android Keystore), damit die Anmeldung erneuert werden kann; auf POKYH-Servern werden sie nicht gespeichert. iCloud-Synchronisierung ist deaktiviert. Es werden keine Analysedaten durch die App erhoben. Für die Offline-Nutzung legt die App zuletzt geladene Daten (z. B. Stundenplan, Noten, Abwesenheiten, Mensa) im privaten App-Speicher des Geräts ab. Erinnerungen werden als lokale Gerätebenachrichtigungen ausgeliefert (kein Remote-Push). Update-Prüfungen erfolgen über die öffentliche GitHub-API; dabei erhält GitHub technisch bedingt die IP-Adresse, aber keine Konto- oder Schuldaten.' },
      { label: 'Lokaler Speicher (localStorage)', desc: 'Für Einstellungen (Theme, Sidebar-Status) und als Zwischenspeicher zuletzt geladener Schuldaten (Stundenplan, Noten, Abwesenheiten, Nachrichten) für eine schnellere Anzeige wird localStorage genutzt. Diese Daten verlassen nie das Gerät.' },
    ],
    s3Title: '3. Zweck und Rechtsgrundlage',
    s3: 'Die Verarbeitung erfolgt zur Erbringung des Dienstes (Art. 6 Abs. 1 lit. b DSGVO). Optionale Analytics-Daten werden ausschließlich auf Grundlage deiner ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) verarbeitet, die du im Cookie-Banner erteilst oder ablehnst. Notwendige Sicherheitsmaßnahmen (z. B. Netzwerkweiterleitung, Zugriffsprotokolle) stützen sich auf berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO).',
    s4Title: '4. Drittanbieter',
    thirdParties: [
      { name: 'Untis (Schulportal)', purpose: 'Stundenplan, Noten, Abwesenheiten und Nachrichten – nur bei Schulaccount-Login', url: 'https://www.webuntis.com/privacy-policy' },
      { name: 'POKYH Backend (pokyh-backend)', purpose: 'Eigener Server für Todos, Erinnerungen, Klassen-Features und Echtzeit-Updates', url: 'https://github.com/bedchem/pokyh' },
      { name: 'Google Analytics 4 (Google LLC)', purpose: 'Anonymisierte Nutzungsstatistiken zur Verbesserung des Dienstes – nur nach Einwilligung', url: 'https://policies.google.com/privacy' },
      { name: 'Cloudflare, Inc.', purpose: 'Netzwerkweiterleitung via Cloudflare Tunnel für den selbst gehosteten Server', url: 'https://www.cloudflare.com/privacypolicy/' },
      { name: 'Mensa API (plattnericus.dev)', purpose: 'Quelle des Mensa-Speiseplans – wird vom POKYH-Server abgerufen, dein Gerät verbindet sich nicht direkt', url: 'https://plattnericus.dev' },
      { name: 'Push-Dienste der Browser-Hersteller', purpose: 'Zustellung von Web-Push-Benachrichtigungen – nur wenn du sie erlaubst', url: 'https://developer.mozilla.org/docs/Web/API/Push_API' },
      { name: 'GitHub API (GitHub, Inc.)', purpose: 'Update-Prüfung der mobilen Apps – es werden keine personenbezogenen Daten übertragen', url: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement' },
    ],
    thirdPartyLinkLabel: 'Datenschutz',
    s5Title: '5. Datentransfer in Drittländer',
    s5: 'Google LLC und Cloudflare, Inc. sind in den USA ansässig. Der Datentransfer erfolgt auf Basis von Standardvertragsklauseln (Art. 46 DSGVO) sowie – im Fall von Google – auf Basis des EU-US Data Privacy Framework. Cloudflare ist nach ISO 27001 zertifiziert.',
    s6Title: '6. Speicherdauer',
    s6: 'Anmelde-Cookies werden beim Logout gelöscht und laufen sonst automatisch ab (Sitzung 4 Stunden, API-Token 8 Stunden, Refresh-Token 30 Tage). Todos, Erinnerungen, Mensa-Bewertungen und Kommentare werden auf dem POKYH-Backend gespeichert, bis du sie selbst löschst. Server-Protokolle werden nach 30 Tagen, Datenbank-Sicherungen nach 7 Tagen gelöscht. Abgeschlossene Todos werden nach 24 Stunden automatisch ausgeblendet. Google Analytics-Daten werden, sofern du zugestimmt hast, nach 14 Monaten gelöscht.',
    s7Title: '7. Deine Rechte (DSGVO)',
    rightsIntro: 'Du hast folgende Rechte bezüglich deiner personenbezogenen Daten:',
    rights: [
      'Auskunft (Art. 15 DSGVO)',
      'Berichtigung unrichtiger Daten (Art. 16 DSGVO)',
      'Löschung / Recht auf Vergessenwerden (Art. 17 DSGVO)',
      'Einschränkung der Verarbeitung (Art. 18 DSGVO)',
      'Datenübertragbarkeit (Art. 20 DSGVO)',
      'Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen (Art. 21 DSGVO)',
      'Widerruf einer Einwilligung',
    ],
    rightsContactLabel: 'Kontakt:',
    complaintPrefix: 'Beschwerde bei der zuständigen Aufsichtsbehörde: Garante per la protezione dei dati personali (Italien),',
    s8Title: '8. Datensicherheit',
    s8: 'Alle Verbindungen erfolgen über HTTPS/TLS (bereitgestellt via Cloudflare Tunnel). WebUntis-Session-Tokens werden serverseitig AES-GCM-verschlüsselt und ausschließlich in httpOnly-Cookies gespeichert (kein JavaScript-Zugriff). Passwörter werden nie auf POKYH-Servern gespeichert. Eingaben werden serverseitig validiert. Der Server wird auf privater Hardware betrieben und ist ausschließlich über den verschlüsselten Cloudflare-Tunnel zugänglich.',
    s9Title: '9. Cookies & Lokaler Speicher',
    cookieKindLabels: { necessary: 'Notwendig', setting: 'Einstellung', analytics: 'Analytics' },
    cookieRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Verschlüsseltes Schulportal-Session-Token (httpOnly, AES-GCM, 4 Stunden)' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Nicht-sensible Benutzerinfo zur Anzeige (kein Token, kein Passwort, 4 Stunden)' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'POKYH Backend JWT für API-Zugriff (nicht httpOnly, 8 Stunden)' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'POKYH Backend Refresh-Token zum automatischen Erneuern des API-Tokens (httpOnly, 30 Tage)' },
      { name: 'pockyh_theme', kind: 'setting', desc: 'Gespeichertes Farbschema (localStorage, kein Cookie)' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Sidebar-Status (localStorage, kein Cookie)' },
      { name: 'passkey_declined', kind: 'setting', desc: 'Merkt sich, dass du das Speichern der Anmeldung im Browser abgelehnt hast (Cookie, 1 Jahr)' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Zwischenspeicher zuletzt geladener Schuldaten für schnellere Anzeige (localStorage, verlässt das Gerät nicht)' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Zugangsdaten zur automatischen Sitzungserneuerung, nur im geöffneten Tab (sessionStorage, beim Schließen gelöscht)' },
      { name: '_ga, _ga_*', kind: 'analytics', desc: 'Google Analytics 4 – anonymisierte Nutzungsstatistiken (nur bei Einwilligung), 1–2 Jahre Laufzeit' },
    ],
    s10Title: '10. Änderungen dieser Erklärung',
    s10Before: 'Diese Datenschutzerklärung kann bei Bedarf angepasst werden. Die aktuelle Version ist stets unter',
    s10After: 'abrufbar. Stand: September 2026.',
  },
  it: {
    title: 'Informativa sulla privacy',
    s1Title: '1. Titolare del trattamento',
    s1Controller: 'Il titolare del trattamento ai sensi del GDPR (UE) 2016/679 è:',
    s1ContactLabel: 'Contatto:',
    s1Dpo: 'Per richieste sulla protezione dei dati è disponibile il contatto indicato sopra. Se è stato nominato o deve essere nominato un responsabile della protezione dei dati (DPO), i relativi recapiti verificati saranno pubblicati qui.',
    s2Title: '2. Quali dati trattiamo?',
    dataItems: [
      { label: 'Credenziali scolastiche (accesso all’orario)', desc: 'Il tuo nome utente e la password vengono utilizzati esclusivamente per l’autenticazione presso il server dell’orario della tua scuola e non vengono mai salvati sui server di POKYH. Per rinnovare automaticamente una sessione scaduta, sul sito restano solo nella memoria di sessione (sessionStorage) della scheda del browser aperta e vengono eliminati alla chiusura della scheda. Il token di sessione viene cifrato con AES-GCM e conservato in un cookie httpOnly.' },
      { label: 'Cookie di sessione (pockyh_session)', desc: 'Cookie httpOnly cifrato contenente il token di sessione del portale scolastico. Scade al logout o dopo 4 ore. Non accessibile da JavaScript (protezione XSS).' },
      { label: 'Account POKYH (accesso alternativo)', desc: 'Chi non ha un account scolastico può registrarsi con un account proprio di POKYH (nome utente + password). La password viene memorizzata con hash bcrypt. Una password in chiaro non viene mai salvata.' },
      { label: 'Cookie utente (pockyh_user)', desc: 'Contiene informazioni di visualizzazione non sensibili (nome utente, classe) per la presentazione nell’app. Nessuna password, nessun token.' },
      { label: 'Backend POKYH (cose da fare e promemoria)', desc: 'Le attività e i promemoria di classe vengono salvati sul backend proprio di POKYH: titolo, dettagli, timestamp, nome utente. Puoi eliminarli tu stesso in qualsiasi momento. Per queste funzioni non vengono utilizzati servizi cloud esterni.' },
      { label: 'Valutazioni e commenti della mensa', desc: 'Quando valuti o commenti un piatto, il backend di POKYH salva la valutazione in stelle o il testo del commento, il nome utente, l’ID utente interno e la data. I commenti sono visibili con il tuo nome utente agli altri utenti registrati; le valutazioni compaiono solo come media e numero. Puoi eliminare i tuoi commenti in qualsiasi momento.' },
      { label: 'Notifiche push (sito web, facoltative)', desc: 'Solo se consenti le notifiche nel browser: il backend di POKYH salva l’indirizzo push (endpoint) del tuo browser insieme al tuo ID utente. Le notifiche vengono recapitate tramite il servizio push del produttore del browser (ad es. Google, Mozilla o Apple). Puoi revocarle in qualsiasi momento nelle impostazioni del browser.' },
      { label: 'Google Analytics 4 (GA4)', desc: 'Questo sito utilizza Google Analytics 4 (Google LLC), ma solo previo tuo consenso esplicito espresso nel banner dei cookie. GA4 raccoglie dati d’uso anonimizzati (visualizzazioni di pagina, categoria del dispositivo, paese di origine). L’indirizzo IP viene anonimizzato prima della trasmissione a Google (IP masking). Non vengono raccolti dati pubblicitari. Base giuridica: il tuo consenso (art. 6, par. 1, lett. a GDPR). Puoi revocare il consenso in qualsiasi momento tramite il banner dei cookie oppure opporti ulteriormente alla raccolta dati su analytics.google.com/analytics/optout.' },
      { label: 'Cloudflare Tunnel (Cloudflare, Inc.)', desc: 'Per la raggiungibilità pubblica del server autogestito viene utilizzato Cloudflare Tunnel. Cloudflare tratta metadati di rete (indirizzi IP, intestazioni delle richieste) per l’inoltro del traffico. Nessun contenuto viene conservato in modo permanente. Base giuridica: legittimo interesse (art. 6, par. 1, lett. f GDPR) per la gestione sicura del server.' },
      { label: 'Registrazione dei log del server (request log)', desc: 'Il server backend di POKYH registra automaticamente i log di accesso: indirizzo IP, metodo HTTP, percorso richiesto, codice di stato HTTP, tempo di risposta, nome utente e user agent. Finalità: sicurezza, diagnosi degli errori e individuazione di abusi. Base giuridica: legittimo interesse (art. 6, par. 1, lett. f GDPR). I log vengono cancellati al più tardi dopo 30 giorni.' },
      { label: 'App mobile (iOS e Android)', desc: 'Le app native di POKYH memorizzano le credenziali esclusivamente in forma cifrata sul dispositivo (Keychain di iOS o con una chiave dell’Android Keystore), per poter rinnovare l’accesso; non vengono salvate sui server di POKYH. La sincronizzazione con iCloud è disattivata. L’app non raccoglie alcun dato di analisi. Per l’uso offline l’app conserva gli ultimi dati caricati (ad es. orario, voti, assenze, mensa) nella memoria privata dell’app sul dispositivo. I promemoria vengono recapitati come notifiche locali del dispositivo (nessun push remoto). I controlli degli aggiornamenti avvengono tramite l’API pubblica di GitHub; per motivi tecnici GitHub riceve l’indirizzo IP, ma nessun dato dell’account o scolastico.' },
      { label: 'Memoria locale (localStorage)', desc: 'Il localStorage viene utilizzato per le impostazioni (tema, stato della barra laterale) e come memoria temporanea degli ultimi dati scolastici caricati (orario, voti, assenze, messaggi) per una visualizzazione più rapida. Questi dati non lasciano mai il dispositivo.' },
    ],
    s3Title: '3. Finalità e base giuridica',
    s3: 'Il trattamento avviene per l’erogazione del servizio (art. 6, par. 1, lett. b GDPR). I dati analitici opzionali vengono trattati esclusivamente sulla base del tuo consenso esplicito (art. 6, par. 1, lett. a GDPR), che presti o rifiuti tramite il banner dei cookie. Le misure di sicurezza necessarie (ad es. instradamento di rete, log di accesso) si basano sul legittimo interesse (art. 6, par. 1, lett. f GDPR).',
    s4Title: '4. Fornitori terzi',
    thirdParties: [
      { name: 'Untis (portale scolastico)', purpose: 'Orario, voti, assenze e messaggi – solo con accesso tramite account scolastico', url: 'https://www.webuntis.com/privacy-policy' },
      { name: 'Backend POKYH (pokyh-backend)', purpose: 'Server proprio per attività, promemoria, funzioni di classe e aggiornamenti in tempo reale', url: 'https://github.com/bedchem/pokyh' },
      { name: 'Google Analytics 4 (Google LLC)', purpose: 'Statistiche d’uso anonimizzate per migliorare il servizio – solo previo consenso', url: 'https://policies.google.com/privacy' },
      { name: 'Cloudflare, Inc.', purpose: 'Instradamento di rete tramite Cloudflare Tunnel per il server autogestito', url: 'https://www.cloudflare.com/privacypolicy/' },
      { name: 'Mensa API (plattnericus.dev)', purpose: 'Fonte del menu della mensa – consultata dal server POKYH, il tuo dispositivo non si collega direttamente', url: 'https://plattnericus.dev' },
      { name: 'Servizi push dei produttori di browser', purpose: 'Recapito delle notifiche web push – solo se le consenti', url: 'https://developer.mozilla.org/docs/Web/API/Push_API' },
      { name: 'API GitHub (GitHub, Inc.)', purpose: 'Verifica degli aggiornamenti delle app mobili – non vengono trasmessi dati personali', url: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement' },
    ],
    thirdPartyLinkLabel: 'Informativa',
    s5Title: '5. Trasferimento dei dati verso paesi terzi',
    s5: 'Google LLC e Cloudflare, Inc. hanno sede negli Stati Uniti. Il trasferimento dei dati avviene sulla base delle clausole contrattuali standard (art. 46 GDPR) e, nel caso di Google, anche sulla base del Data Privacy Framework UE-USA. Cloudflare è certificata ISO 27001.',
    s6Title: '6. Periodo di conservazione',
    s6: 'I cookie di accesso vengono eliminati al logout e altrimenti scadono automaticamente (sessione 4 ore, token API 8 ore, token di refresh 30 giorni). Attività, promemoria, valutazioni e commenti della mensa restano sul backend di POKYH finché non li elimini tu stesso. I log del server vengono cancellati dopo 30 giorni, i backup del database dopo 7 giorni. Le attività completate vengono nascoste automaticamente dopo 24 ore. I dati di Google Analytics vengono cancellati, se hai prestato il consenso, dopo 14 mesi.',
    s7Title: '7. I tuoi diritti (GDPR)',
    rightsIntro: 'Hai i seguenti diritti riguardo ai tuoi dati personali:',
    rights: [
      'Accesso (art. 15 GDPR)',
      'Rettifica dei dati inesatti (art. 16 GDPR)',
      'Cancellazione / diritto all’oblio (art. 17 GDPR)',
      'Limitazione del trattamento (art. 18 GDPR)',
      'Portabilità dei dati (art. 20 GDPR)',
      'Opposizione al trattamento basato sul legittimo interesse (art. 21 GDPR)',
      'Revoca del consenso',
    ],
    rightsContactLabel: 'Contatto:',
    complaintPrefix: 'Reclamo all’autorità di controllo competente: Garante per la protezione dei dati personali,',
    s8Title: '8. Sicurezza dei dati',
    s8: 'Tutte le connessioni avvengono tramite HTTPS/TLS (fornito tramite Cloudflare Tunnel). I token di sessione WebUntis vengono cifrati lato server con AES-GCM e conservati esclusivamente in cookie httpOnly (nessun accesso da JavaScript). Le password non vengono mai salvate sui server di POKYH. Gli input vengono validati lato server. Il server è gestito su hardware privato ed è raggiungibile esclusivamente tramite il tunnel Cloudflare cifrato.',
    s9Title: '9. Cookie e memoria locale',
    cookieKindLabels: { necessary: 'Necessario', setting: 'Impostazione', analytics: 'Analytics' },
    cookieRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Token di sessione cifrato del portale scolastico (httpOnly, AES-GCM, 4 ore)' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Informazioni utente non sensibili per la visualizzazione (nessun token, nessuna password, 4 ore)' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'JWT del backend POKYH per l’accesso alle API (non httpOnly, 8 ore)' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'Token di refresh del backend POKYH per rinnovare automaticamente il token API (httpOnly, 30 giorni)' },
      { name: 'pockyh_theme', kind: 'setting', desc: 'Schema colori salvato (localStorage, non è un cookie)' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Stato della barra laterale (localStorage, non è un cookie)' },
      { name: 'passkey_declined', kind: 'setting', desc: 'Ricorda che hai rifiutato di salvare l’accesso nel browser (cookie, 1 anno)' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Memoria temporanea degli ultimi dati scolastici caricati per una visualizzazione più rapida (localStorage, non lascia il dispositivo)' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Credenziali per il rinnovo automatico della sessione, solo nella scheda aperta (sessionStorage, eliminate alla chiusura)' },
      { name: '_ga, _ga_*', kind: 'analytics', desc: 'Google Analytics 4 – statistiche d’uso anonimizzate (solo con consenso), durata 1–2 anni' },
    ],
    s10Title: '10. Modifiche alla presente informativa',
    s10Before: 'Questa informativa sulla privacy può essere aggiornata in caso di necessità. La versione più recente è sempre disponibile su',
    s10After: '. Versione: settembre 2026.',
  },
  en: {
    title: 'Privacy notice',
    s1Title: '1. Controller',
    s1Controller: 'The controller within the meaning of GDPR (EU) 2016/679 is:',
    s1ContactLabel: 'Contact:',
    s1Dpo: 'The contact listed above is available for data-protection questions. If a Data Protection Officer (DPO) has been appointed or must be appointed, their verified contact details will be published here.',
    s2Title: '2. What data do we process?',
    dataItems: [
      { label: 'School access credentials (timetable login)', desc: 'Your username and password are used solely to authenticate with your school’s timetable server and are never stored on POKYH servers. So that an expired session can be renewed automatically, the website keeps them only in the session storage (sessionStorage) of the open browser tab; they are deleted when the tab is closed. The session token is AES-GCM encrypted and kept in an httpOnly cookie.' },
      { label: 'Session cookie (pockyh_session)', desc: 'Encrypted httpOnly cookie holding the school-portal session token. Expires on logout or after 4 hours. Not accessible to JavaScript (XSS protection).' },
      { label: 'POKYH account (alternative sign-in)', desc: 'Users without a school account can register with a POKYH-only account (username + password). The password is stored bcrypt-hashed. A plaintext password is never stored.' },
      { label: 'User cookie (pockyh_user)', desc: 'Contains non-sensitive display information (username, class) for rendering in the app. No password, no token.' },
      { label: 'POKYH backend (to-dos & reminders)', desc: 'To-dos and class reminders are stored on POKYH’s own backend: title, details, timestamp, username. You can delete them yourself at any time. No external cloud services are used for these features.' },
      { label: 'Canteen ratings & comments', desc: 'When you rate or comment on a dish, the POKYH backend stores the star rating or comment text, your username, internal user ID, and a timestamp. Comments are visible with your username to other signed-in users; ratings appear only as an average and count. You can delete your own comments at any time.' },
      { label: 'Push notifications (website, optional)', desc: 'Only if you allow notifications in your browser: the POKYH backend stores your browser’s push address (endpoint) together with your user ID. Notifications are delivered through your browser vendor’s push service (e.g. Google, Mozilla, or Apple). You can revoke this at any time in your browser settings.' },
      { label: 'Google Analytics 4 (GA4)', desc: 'This website uses Google Analytics 4 (Google LLC), but only after your explicit consent in the cookie banner. GA4 collects anonymised usage data (page views, device category, country of origin). The IP address is anonymised before transmission to Google (IP masking). No advertising data is collected. Legal basis: your consent (Art. 6(1)(a) GDPR). You can withdraw consent at any time via the cookie banner, or additionally opt out of data collection at analytics.google.com/analytics/optout.' },
      { label: 'Cloudflare Tunnel (Cloudflare, Inc.)', desc: 'Cloudflare Tunnel is used for the public reachability of the self-hosted server. Cloudflare processes network metadata (IP addresses, request headers) to forward traffic. No content is stored permanently. Legal basis: legitimate interest (Art. 6(1)(f) GDPR) for secure server operation.' },
      { label: 'Server logging (request logs)', desc: 'The POKYH backend server automatically records access logs: IP address, HTTP method, requested path, HTTP status code, response time, username, and user agent. Purpose: security, error diagnosis, and abuse detection. Legal basis: legitimate interest (Art. 6(1)(f) GDPR). Logs are deleted after 30 days at the latest.' },
      { label: 'Mobile app (iOS & Android)', desc: 'The native POKYH apps store credentials only encrypted on the device (iOS Keychain, or with a key from the Android Keystore) so the sign-in can be renewed; they are not stored on POKYH servers. iCloud sync is disabled. The app collects no analytics data. For offline use the app keeps the most recently loaded data (e.g. timetable, grades, absences, canteen) in the app’s private storage on the device. Reminders are delivered as local device notifications (no remote push). Update checks use the public GitHub API; for technical reasons GitHub receives the IP address, but no account or school data.' },
      { label: 'Local storage (localStorage)', desc: 'localStorage is used for settings (theme, sidebar state) and as a cache of recently loaded school data (timetable, grades, absences, messages) for faster display. This data never leaves your device.' },
    ],
    s3Title: '3. Purpose and legal basis',
    s3: 'Processing takes place to provide the service (Art. 6(1)(b) GDPR). Optional analytics data is processed only on the basis of your explicit consent (Art. 6(1)(a) GDPR), which you grant or decline via the cookie banner. Necessary security measures (e.g. network routing, access logs) rely on legitimate interests (Art. 6(1)(f) GDPR).',
    s4Title: '4. Third-party providers',
    thirdParties: [
      { name: 'Untis (school portal)', purpose: 'Timetable, grades, absences, and messages — only with school-account sign-in', url: 'https://www.webuntis.com/privacy-policy' },
      { name: 'POKYH backend (pokyh-backend)', purpose: 'Own server for to-dos, reminders, class features, and real-time updates', url: 'https://github.com/bedchem/pokyh' },
      { name: 'Google Analytics 4 (Google LLC)', purpose: 'Anonymised usage statistics to improve the service — only with consent', url: 'https://policies.google.com/privacy' },
      { name: 'Cloudflare, Inc.', purpose: 'Network routing via Cloudflare Tunnel for the self-hosted server', url: 'https://www.cloudflare.com/privacypolicy/' },
      { name: 'Canteen API (plattnericus.dev)', purpose: 'Source of the canteen menu — fetched by the POKYH server, your device does not connect to it directly', url: 'https://plattnericus.dev' },
      { name: 'Browser vendors’ push services', purpose: 'Delivery of web push notifications — only if you allow them', url: 'https://developer.mozilla.org/docs/Web/API/Push_API' },
      { name: 'GitHub API (GitHub, Inc.)', purpose: 'Update checks for the mobile apps — no personal data is transmitted', url: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement' },
    ],
    thirdPartyLinkLabel: 'Privacy policy',
    s5Title: '5. International data transfers',
    s5: 'Google LLC and Cloudflare, Inc. are based in the United States. Data transfer relies on Standard Contractual Clauses (Art. 46 GDPR) and, in Google’s case, additionally on the EU-US Data Privacy Framework. Cloudflare is ISO 27001 certified.',
    s6Title: '6. Retention period',
    s6: 'Sign-in cookies are deleted on logout and otherwise expire automatically (session 4 hours, API token 8 hours, refresh token 30 days). To-dos, reminders, canteen ratings, and comments remain on the POKYH backend until you delete them yourself. Server logs are deleted after 30 days, database backups after 7 days. Completed to-dos are automatically hidden after 24 hours. Google Analytics data is deleted, where you have consented, after 14 months.',
    s7Title: '7. Your rights (GDPR)',
    rightsIntro: 'You have the following rights regarding your personal data:',
    rights: [
      'Access (Art. 15 GDPR)',
      'Rectification of inaccurate data (Art. 16 GDPR)',
      'Erasure / right to be forgotten (Art. 17 GDPR)',
      'Restriction of processing (Art. 18 GDPR)',
      'Data portability (Art. 20 GDPR)',
      'Objection to processing based on legitimate interests (Art. 21 GDPR)',
      'Withdrawal of consent',
    ],
    rightsContactLabel: 'Contact:',
    complaintPrefix: 'Complaint to the competent supervisory authority: the Italian Garante per la protezione dei dati personali,',
    s8Title: '8. Data security',
    s8: 'All connections use HTTPS/TLS (provided via Cloudflare Tunnel). WebUntis session tokens are encrypted server-side with AES-GCM and stored only in httpOnly cookies (no JavaScript access). Passwords are never stored on POKYH servers. Input is validated server-side. The server runs on private hardware and is reachable only through the encrypted Cloudflare Tunnel.',
    s9Title: '9. Cookies & local storage',
    cookieKindLabels: { necessary: 'Necessary', setting: 'Setting', analytics: 'Analytics' },
    cookieRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Encrypted school-portal session token (httpOnly, AES-GCM, 4 hours)' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Non-sensitive display info (no token, no password, 4 hours)' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'POKYH backend JWT for API access (not httpOnly, 8 hours)' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'POKYH backend refresh token to automatically renew the API token (httpOnly, 30 days)' },
      { name: 'pockyh_theme', kind: 'setting', desc: 'Saved colour scheme (localStorage, not a cookie)' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Sidebar collapsed/expanded state (localStorage, not a cookie)' },
      { name: 'passkey_declined', kind: 'setting', desc: 'Remembers that you declined saving the sign-in in the browser (cookie, 1 year)' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Cache of recently loaded school data for faster display (localStorage, never leaves the device)' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Credentials for automatic session renewal, only in the open tab (sessionStorage, deleted when closed)' },
      { name: '_ga, _ga_*', kind: 'analytics', desc: 'Google Analytics 4 — anonymised usage statistics (only with consent), 1–2 year lifetime' },
    ],
    s10Title: '10. Changes to this notice',
    s10Before: 'This privacy notice may be updated as needed. The current version is always available at',
    s10After: '. Version: September 2026.',
  },
  lld: {
    title: 'Nfurmazion sun la privacy',
    s1Title: '1. Titular dl tratamënt',
    s1Controller: 'Titular dl tratamënt aldò dl GDPR (UE) 2016/679 ie:',
    s1ContactLabel: 'Cuntat:',
    s1Dpo: 'Per dumandes sun la prutezion di dac se pòn se reverì al post de cuntat numinà sëura. Sce n respunsabl per la prutezion di dac (DPO) ie numinà o muessa vester numinà, vën si dac de cuntat verificai publichei chilò.',
    s2Title: '2. Cie dac tratons pa?',
    dataItems: [
      { label: 'Dac de azes dla scola (login per l urar)', desc: 'Ti inuem dl utënt y tia password vën adurvei mé per l’autenticazion al server dl urar de tia scola y ne vën mai salvei sun i server de POKYH. Ajache na sesion finida posse vester renuveda da sëula, resta i dac sun la plata web mé tla memoria dla sesion (sessionStorage) dla scheda dl browser daverta y vën scancelei canche la scheda vën stluta. L token de sesion vën zifrà cun AES-GCM y salvà te n cookie httpOnly.' },
      { label: 'Cookie de sesion (pockyh_session)', desc: 'Cookie httpOnly zifrà cun l token de sesion dl portal dla scola. Scadësc cun l logout o do 4 ëures. Nia arjonjibl per JavaScript (prutezion XSS).' },
      { label: 'Account POKYH (azes alternatif)', desc: 'Utënc zënza account dla scola se pò registré cun n account de POKYH (inuem dl utënt + password). La password vën salveda cun n hash bcrypt. Na password lieibla ne vën mai salveda.' },
      { label: 'Cookie dl utënt (pockyh_user)', desc: 'Cuntën nfurmazions nia sensibles per la vijualisazion (inuem dl utënt, tlas) tl’app. Deguna password, degun token.' },
      { label: 'Backend POKYH (to-do y recurdanzes)', desc: 'I to-do y la recurdanzes dla tlas vën salvei sun l backend de POKYH: titul, detaies, ëura y data, inuem dl utënt. Tu i pos scancelé uni mumënt. Per chësta funzions ne vën adurvei deguni servijes cloud da ora.' },
      { label: 'Valutazions y cumenc dla mensa', desc: 'Canche tu valutes o cumentes n plat, salva l backend de POKYH la valutazion cun la stëiles o l test dl cumënt, ti inuem dl utënt, l ID dl utënt intern y ëura y data. I cumenc se vëija cun ti inuem dl utënt per d’autri utënc ite; la valutazions cumpar mé coche media y numer. Ti cumenc i pos scancelé uni mumënt.' },
      { label: 'Nutificazions push (plata web, facoltatif)', desc: 'Mé sce tu lasces tlo nutificazions tl browser: l backend de POKYH salva l’adressa push (endpoint) de ti browser adum cun ti ID dl utënt. La nutificazions vën mandedes tres l servisc push dl prudutëur de ti browser (p.ej. Google, Mozilla o Apple). Tu pos l tò zeruch uni mumënt tla mpustazions dl browser.' },
      { label: 'Google Analytics 4 (GA4)', desc: 'Chësta plata web adurvea Google Analytics 4 (Google LLC), ma mé do ti cunsëntimënt esplizit tl banner di cookies. GA4 tol su dac de adurvanza anonimisei (plates ududes, categoria dl dispusitif, pajëisc de urigin). L’adressa IP vën anonimiseda dan che la vën mandeda a Google (IP masking). Ne vën tëutes su deguni dac de reclam. Basa giuridica: ti cunsëntimënt (art. 6 par. 1 lett. a GDPR). Tu pos tò zeruch ti cunsëntimënt uni mumënt tres l banner di cookies o te opuné nce ala cuiuda di dac sot analytics.google.com/analytics/optout.' },
      { label: 'Cloudflare Tunnel (Cloudflare, Inc.)', desc: 'Per che l server ospità da nëus nstësc se lasce arjonjer publicamënter vën adurvà Cloudflare Tunnel. Cloudflare trata metadac de rë (adresses IP, header dla dumandes) per mené inant l trafich di dac. Deguni cuntenuc ne vën salvei a dilunch. Basa giuridica: nteres legitim (art. 6 par. 1 lett. f GDPR) per na gestion segura dl server.' },
      { label: 'Protocol dl server (request logs)', desc: 'L server backend de POKYH salva da sëul i protocoi di azesc: adressa IP, metoda HTTP, streda cherdeda, codesc de stat HTTP, tëmp de resposta, inuem dl utënt y user agent. Fin: segurëza, analisa di fai y cunescimënt de abusc. Basa giuridica: nteres legitim (art. 6 par. 1 lett. f GDPR). I log vën scancelei al plu tert do 30 dis.' },
      { label: 'App mobila (iOS y Android)', desc: 'La app natives de POKYH salva i dac de azes mé zifrei sun l dispusitif (iOS Keychain o cun na tlé dl Android Keystore), ajache l azes posse vester renuvà; sun i server de POKYH ne vëni nia salvei. La sincronisazion cun iCloud ie destudeda. L’app ne tol su deguni dac de analisa. Per l’adurvanza offline salva l’app i ultimi dac ciariei (p.ej. urar, notes, assënzes, mensa) tla memoria privata dl’app sun l dispusitif. La recurdanzes vën mandedes coche nutificazions locales dl dispusitif (degun push da dalonc). I cuntroi di atualisamënc suzed tres l’API publica de GitHub; per rejons tecniches ruva GitHub l’adressa IP, ma deguni dac dl account o dla scola.' },
      { label: 'Memoria locala (localStorage)', desc: 'Per la mpustazions (tema, stat dla sidebar) y coche memoria temporena di ultimi dac dla scola ciariei (urar, notes, assënzes, nutizies) per na vijualisazion plu sveta vën adurvà l localStorage. Chisc dac ne lascia mai l dispusitif.' },
    ],
    s3Title: '3. Fin y basa giuridica',
    s3: 'L tratamënt suzed per purté l servisc (art. 6 par. 1 lett. b GDPR). I dac de analisa facoltatifs vën tratei mé sun la basa de ti cunsëntimënt esplizit (art. 6 par. 1 lett. a GDPR), che tu des o refudes tl banner di cookies. Mesures de segurëza necessares (p.ej. mené inant la rë, protocoi di azesc) se basea sun nteresc legitims (art. 6 par. 1 lett. f GDPR).',
    s4Title: '4. Furnidëures terzi',
    thirdParties: [
      { name: 'Untis (portal dla scola)', purpose: 'Urar, notes, assënzes y nutizies – mé cun login cun l account dla scola', url: 'https://www.webuntis.com/privacy-policy' },
      { name: 'POKYH Backend (pokyh-backend)', purpose: 'Server nosc per to-do, recurdanzes, funzions dla tlas y atualisazions te tëmp real', url: 'https://github.com/bedchem/pokyh' },
      { name: 'Google Analytics 4 (Google LLC)', purpose: 'Statistiches de adurvanza anonimisedes per miuré l servisc – mé do cunsëntimënt', url: 'https://policies.google.com/privacy' },
      { name: 'Cloudflare, Inc.', purpose: 'Mené inant la rë tres Cloudflare Tunnel per l server ospità da nëus nstësc', url: 'https://www.cloudflare.com/privacypolicy/' },
      { name: 'Mensa API (plattnericus.dev)', purpose: 'Fontana dl menu dla mensa – vën cherdeda dal server de POKYH, ti dispusitif ne se lieia nia diretamënter', url: 'https://plattnericus.dev' },
      { name: 'Servijes push di prudutëures di browser', purpose: 'Mandé nutificazions web push – mé sce tu li lasces tlo', url: 'https://developer.mozilla.org/docs/Web/API/Push_API' },
      { name: 'GitHub API (GitHub, Inc.)', purpose: 'Cuntrol di atualisamënc dla app mobiles – ne vën mandei deguni dac persunei', url: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement' },
    ],
    thirdPartyLinkLabel: 'Privacy',
    s5Title: '5. Trasferimënt di dac te pajëisc terzi',
    s5: 'Google LLC y Cloudflare, Inc. à si sënta ti Stac Unii. L trasferimënt di dac suzed sun la basa de clausules de cuntrat standard (art. 46 GDPR) y – per Google – sun la basa dl EU-US Data Privacy Framework. Cloudflare ie certificà aldò de ISO 27001.',
    s6Title: '6. Durazion dla cunservazion',
    s6: 'I cookies de azes vën scancelei cun l logout y scadësc sunì da sëuli (sesion 4 ëures, token API 8 ëures, refresh token 30 dis). To-do, recurdanzes, valutazions y cumenc dla mensa vën salvei sun l backend de POKYH nchin che tu i scancelëies tu nstës. I protocoi dl server vën scancelei do 30 dis, i backup dla database do 7 dis. I to-do fac vën scuendui da sëuli do 24 ëures. I dac de Google Analytics vën scancelei, sce tu ies stat d’acordo, do 14 mëisc.',
    s7Title: '7. Ti dërc (GDPR)',
    rightsIntro: 'Tu es chisc dërc per ti dac persunei:',
    rights: [
      'Nfurmazion (art. 15 GDPR)',
      'Curezion de dac nia drëc (art. 16 GDPR)',
      'Scancelamënt / dërt de vester desmincià (art. 17 GDPR)',
      'Limitazion dl tratamënt (art. 18 GDPR)',
      'Purtabltà di dac (art. 20 GDPR)',
      'Uposizion al tratamënt sun la basa de nteresc legitims (art. 21 GDPR)',
      'Tò zeruch n cunsëntimënt',
    ],
    rightsContactLabel: 'Cuntat:',
    complaintPrefix: 'Reclam pra l’autorità de cuntrol cumpetënta: Garante per la protezione dei dati personali (Talia),',
    s8Title: '8. Segurëza di dac',
    s8: 'Duta la cunescions suzed tres HTTPS/TLS (tres Cloudflare Tunnel). I token de sesion de WebUntis vën zifrei dal server cun AES-GCM y salvei mé te cookies httpOnly (degun azes tres JavaScript). La passwords ne vën mai salvedes sun i server de POKYH. I dac scric ite vën cuntrolei dal server. L server jirà sun hardware privat y se lascia arjonjer mé tres l tunnel zifrà de Cloudflare.',
    s9Title: '9. Cookies y memoria locala',
    cookieKindLabels: { necessary: 'Necessar', setting: 'Mpustazion', analytics: 'Analisa' },
    cookieRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Token de sesion zifrà dl portal dla scola (httpOnly, AES-GCM, 4 ëures)' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Nfurmazions nia sensibles dl utënt per la vijualisazion (degun token, deguna password, 4 ëures)' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'JWT dl backend POKYH per l azes al’API (nia httpOnly, 8 ëures)' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'Refresh token dl backend POKYH per renuvé da sëul l token API (httpOnly, 30 dis)' },
      { name: 'pockyh_theme', kind: 'setting', desc: 'Schem de culëures salvà (localStorage, degun cookie)' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Stat dla sidebar (localStorage, degun cookie)' },
      { name: 'passkey_declined', kind: 'setting', desc: 'Se tën a ment che tu es refudà de salvé l login tl browser (cookie, 1 ann)' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Memoria temporena di ultimi dac dla scola ciariei per na vijualisazion plu sveta (localStorage, ne lascia nia l dispusitif)' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Dac de azes per renuvé da sëul la sesion, mé tla scheda daverta (sessionStorage, scancelei canche la vën stluta)' },
      { name: '_ga, _ga_*', kind: 'analytics', desc: 'Google Analytics 4 – statistiches de adurvanza anonimisedes (mé cun cunsëntimënt), durazion 1–2 ani' },
    ],
    s10Title: '10. Mudamënc de chësta nfurmazion',
    s10Before: 'Chësta nfurmazion sun la privacy possa vester adateda sce l ie de bujën. La verscion atuela se ciafa for sot',
    s10After: '. Stat: setëmber 2026.',
  },
};

function DatenschutzView({ locale, identity }: { locale: LegalLocale; identity: LegalIdentity }) {
  const copy = datenschutzCopy[locale];
  const back = backLabelsCopy[locale];
  return (
    <div className="fade-in">
      <div className="mb-8 flex items-center justify-between gap-4">
        <LegalBackButton label={back.toLegal} fallbackUrl={`/${locale}/legal/`} />
        <LocaleSwitcher view="datenschutz" locale={locale} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--tint) 14%, transparent)' }}
        >
          <Shield size={20} color="var(--tint)" />
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
          {copy.title}
        </h1>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-6"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <LegalSection title={copy.s1Title}>
          <p>{copy.s1Controller}</p>
          <LegalIdentityDetails locale={locale} identity={identity} includeContact={false} />
          <p className="mt-2">
            {copy.s1ContactLabel}{' '}
            <a href={`mailto:${identity.privacyEmail}`} style={{ color: 'var(--accent)' }}>{identity.privacyEmail}</a>
          </p>
          <p className="mt-2">{copy.s1Dpo}</p>
        </LegalSection>

        <LegalSection title={copy.s2Title}>
          <div className="flex flex-col gap-2">
            {copy.dataItems.map((item) => (
              <DataItem key={item.label} label={item.label} desc={item.desc} />
            ))}
          </div>
        </LegalSection>

        <LegalSection title={copy.s3Title}>
          <p>{copy.s3}</p>
        </LegalSection>

        <LegalSection title={copy.s4Title}>
          <div className="flex flex-col gap-2">
            {copy.thirdParties.map((tp) => (
              <ThirdParty key={tp.name} name={tp.name} purpose={tp.purpose} url={tp.url} linkLabel={copy.thirdPartyLinkLabel} />
            ))}
          </div>
        </LegalSection>

        <LegalSection title={copy.s5Title}>
          <p>{copy.s5}</p>
        </LegalSection>

        <LegalSection title={copy.s6Title}>
          <p>{copy.s6}</p>
        </LegalSection>

        <LegalSection title={copy.s7Title}>
          <p className="mb-2">{copy.rightsIntro}</p>
          <ul className="flex flex-col gap-1">
            {copy.rights.map(r => (
              <li key={r} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--tint)' }} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            {copy.rightsContactLabel}{' '}
            <a href={`mailto:${identity.privacyEmail}`} style={{ color: 'var(--accent)' }}>{identity.privacyEmail}</a>
          </p>
          <p className="mt-2">
            {copy.complaintPrefix}{' '}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              www.garanteprivacy.it
            </a>
          </p>
        </LegalSection>

        <LegalSection title={copy.s8Title}>
          <p>{copy.s8}</p>
        </LegalSection>

        <LegalSection title={copy.s9Title}>
          <div className="flex flex-col gap-2 mb-3">
            {copy.cookieRows.map((row) => (
              <CookieRow key={row.name} name={row.name} kind={row.kind} kindLabel={copy.cookieKindLabels[row.kind]} desc={row.desc} />
            ))}
          </div>
        </LegalSection>

        <LegalSection title={copy.s10Title}>
          <p>
            {copy.s10Before}{' '}
            <strong style={{ color: 'var(--app-text-primary)' }}>/legal?view=datenschutz</strong>{' '}
            {copy.s10After}
          </p>
        </LegalSection>
      </div>

      <div className="flex justify-center mt-8">
        <LegalBackButton label={back.backToLegal} fallbackUrl={`/${locale}/legal/`} />
      </div>
    </div>
  );
}

/* ─── Pokyh Learn privacy notice ─────────────────────────────────────────── */

const learnPrivacyCopy: Record<LegalLocale, {
  title: string;
  intro: string;
  controllerTitle: string;
  controller: string;
  dataTitle: string;
  data: string;
  legalTitle: string;
  legal: string;
  recipientsTitle: string;
  recipients: string;
  retentionTitle: string;
  retention: string;
  rightsTitle: string;
  rights: string;
  gateTitle: string;
  gate: string;
  sourceLabel: string;
}> = {
  it: {
    title: 'Informativa privacy · Pokyh Learn',
    intro: 'Informazioni trasparenti sull’accesso con WebUntis e sull’uso di Pokyh Learn. Versione: 12 settembre 2026.',
    controllerTitle: '1. Titolare e autorizzazione della scuola',
    controller: 'Il titolare e i contatti pubblici sono indicati nell’Impressum POKYH. Prima dell’attivazione, il titolare deve ottenere e documentare l’autorizzazione della scuola o dell’ente competente per l’integrazione WebUntis e, se applicabile, il rapporto previsto dall’art. 28 GDPR. L’accettazione da parte dell’utente non sostituisce tale autorizzazione.',
    dataTitle: '2. Dati e finalità',
    data: 'Per verificare l’accesso vengono trattati il nome utente WebUntis e i dati minimi restituiti per associare un account POKYH esistente. Per il servizio di apprendimento vengono trattati preferenze, contenuti creati dall’utente, autorizzazioni, progressi, tentativi di quiz e dati tecnici strettamente necessari alla sicurezza. La password WebUntis è inviata solo tramite una connessione protetta per la verifica lato server: non viene salvata, registrata nei log né inserita nello spazio di archiviazione del browser.',
    legalTitle: '3. Base giuridica e trasparenza',
    legal: 'Il titolare deve indicare, prima della raccolta, la finalità concreta, la base giuridica, i destinatari, l’eventuale DPO, i trasferimenti e il periodo di conservazione nel proprio registro e nella presente informativa. La casella mostrata al login documenta la presa visione dell’informativa; non trasforma automaticamente il consenso nella base giuridica del trattamento.',
    recipientsTitle: '4. Destinatari e fornitori',
    recipients: 'WebUntis è contattato esclusivamente per la verifica dell’account. Il backend POKYH e i fornitori tecnici autorizzati trattano i dati solo per fornire e proteggere il servizio. Un dizionario esterno, se attivato dal titolare, riceve esclusivamente la parola richiesta e la coppia linguistica quando un editor lo chiede espressamente; non riceve password WebUntis, token, profili o cronologie di apprendimento.',
    retentionTitle: '5. Conservazione e minimizzazione',
    retention: 'I dati di apprendimento restano separati dai dati della scuola e sono conservati soltanto per il tempo definito e pubblicato dal titolare. Un export personale è limitato ai contenuti e progressi propri; ruoli, team, credenziali e dati altrui sono esclusi. Il titolare deve definire una procedura verificabile per cancellazione, archiviazione e risposta alle richieste.',
    rightsTitle: '6. Diritti e reclamo in Italia',
    rights: 'Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità o opposizione nei casi previsti dagli artt. 15–21 GDPR rivolgendoti al titolare. Hai inoltre diritto di proporre reclamo al Garante per la protezione dei dati personali. Se è stato designato un DPO, i suoi contatti devono essere resi disponibili dal titolare.',
    gateTitle: '7. Blocco di attivazione',
    gate: 'L’accesso Learn in produzione è progettato per restare disabilitato finché l’operatore non configura una versione di questa informativa e un riferimento non segreto all’autorizzazione WebUntis. Prima del rilascio sono necessari anche una revisione giuridica del titolare/scuola e la verifica delle misure tecniche e organizzative effettivamente adottate.',
    sourceLabel: 'Fonti ufficiali di riferimento',
  },
  de: {
    title: 'Datenschutzhinweise · Pokyh Learn',
    intro: 'Transparente Informationen zur WebUntis-Anmeldung und Nutzung von Pokyh Learn. Stand: 12. September 2026.',
    controllerTitle: '1. Verantwortlicher und Schulfreigabe',
    controller: 'Der Verantwortliche und seine öffentlichen Kontaktdaten stehen im POKYH-Impressum. Vor einer Aktivierung muss der Verantwortliche die Freigabe der zuständigen Schule bzw. Stelle für die WebUntis-Integration dokumentieren und – soweit erforderlich – das Verhältnis nach Art. 28 DSGVO regeln. Eine Bestätigung durch Nutzende ersetzt diese Freigabe nicht.',
    dataTitle: '2. Daten und Zweck',
    data: 'Zur Zugangsprüfung werden der WebUntis-Benutzername und die minimalen Rückgabedaten zur Zuordnung zu einem bestehenden POKYH-Konto verarbeitet. Für den Lerndienst verarbeitet POKYH Präferenzen, selbst erstellte Inhalte, Berechtigungen, Fortschritt, Quizversuche und strikt notwendige technische Sicherheitsdaten. Das WebUntis-Passwort wird nur über eine geschützte Verbindung für die serverseitige Prüfung übermittelt; es wird nicht gespeichert, nicht geloggt und nicht im Browser-Persistenzspeicher abgelegt.',
    legalTitle: '3. Rechtsgrundlage und Transparenz',
    legal: 'Der Verantwortliche muss vor der Erhebung den konkreten Zweck, die Rechtsgrundlage, Empfänger, einen gegebenenfalls vorhandenen Datenschutzbeauftragten, Drittlandtransfers und die Speicherdauer in seinem Verzeichnis und dieser Information benennen. Die Login-Bestätigung dokumentiert die Kenntnisnahme; sie macht eine Einwilligung nicht automatisch zur Rechtsgrundlage.',
    recipientsTitle: '4. Empfänger und Dienste',
    recipients: 'WebUntis wird ausschließlich für die Kontoprüfung angesprochen. Das POKYH-Backend und autorisierte technische Dienstleister verarbeiten Daten nur zur Bereitstellung und Absicherung des Dienstes. Ein optionales Wörterbuch erhält – falls vom Verantwortlichen aktiviert und von einem Editor ausdrücklich angefragt – nur das abgefragte Wort und die Sprachrichtung; keine WebUntis-Passwörter, Tokens, Profile oder Lernhistorien.',
    retentionTitle: '5. Aufbewahrung und Datenminimierung',
    retention: 'Lerndaten bleiben von den Schuldaten getrennt und werden nur für die vom Verantwortlichen festgelegte und veröffentlichte Dauer gespeichert. Ein persönlicher Export enthält ausschließlich eigene Inhalte und Lernstände; Rollen, Teams, Zugangsdaten und fremde Daten bleiben ausgeschlossen. Der Verantwortliche muss ein überprüfbares Verfahren für Löschung, Archivierung und Betroffenenanfragen festlegen.',
    rightsTitle: '6. Rechte und Beschwerde in Italien',
    rights: 'Du kannst Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit oder Widerspruch nach Art. 15–21 DSGVO beim Verantwortlichen verlangen. Außerdem kannst du dich beim italienischen Garante per la protezione dei dati personali beschweren. Gibt es einen Datenschutzbeauftragten, müssen seine Kontaktdaten vom Verantwortlichen veröffentlicht werden.',
    gateTitle: '7. Aktivierungssperre',
    gate: 'Der Learn-Zugang in Produktion ist so ausgelegt, dass er deaktiviert bleibt, bis der Betreiber eine Version dieser Information und einen nicht geheimen Verweis auf die WebUntis-Freigabe konfiguriert. Vor Freischaltung sind zusätzlich die Rechtsprüfung durch Verantwortliche/Schule sowie die Prüfung der tatsächlich umgesetzten technischen und organisatorischen Maßnahmen erforderlich.',
    sourceLabel: 'Offizielle Referenzen',
  },
  en: {
    title: 'Privacy notice · Pokyh Learn',
    intro: 'Transparent information about WebUntis sign-in and Pokyh Learn. Version: 12 September 2026.',
    controllerTitle: '1. Controller and school authorisation',
    controller: 'The controller and public contact details are listed in the POKYH imprint. Before activation, the controller must document authorisation from the responsible school or body for the WebUntis integration and, where applicable, put the Article 28 GDPR processor relationship in place. A user acknowledgement does not replace that authorisation.',
    dataTitle: '2. Data and purpose',
    data: 'To verify access, the service processes the WebUntis username and the minimum returned data needed to associate an existing POKYH account. For learning, it processes preferences, user-created content, permissions, progress, quiz attempts, and strictly necessary technical security data. The WebUntis password is transmitted only over a protected connection for server-side verification; it is not stored, logged, or put in browser persistent storage.',
    legalTitle: '3. Legal basis and transparency',
    legal: 'Before collection, the controller must state the concrete purpose, legal basis, recipients, any data protection officer, international transfers, and retention period in its records and this notice. The login acknowledgement records that the notice was read; it does not automatically turn consent into the legal basis.',
    recipientsTitle: '4. Recipients and providers',
    recipients: 'WebUntis is contacted only to verify the account. The POKYH backend and authorised technical providers process data solely to provide and protect the service. If enabled by the controller and explicitly requested by an editor, an optional dictionary receives only the requested word and language pair—not WebUntis passwords, tokens, profiles, or learning history.',
    retentionTitle: '5. Retention and minimisation',
    retention: 'Learning data remains separate from school data and is retained only for the period defined and published by the controller. A personal export is limited to the user’s own content and progress; roles, teams, credentials, and other people’s data are excluded. The controller must maintain a verifiable deletion, archive, and data-subject request process.',
    rightsTitle: '6. Rights and complaint in Italy',
    rights: 'You may request access, rectification, erasure, restriction, portability, or objection under Articles 15–21 GDPR from the controller. You may also lodge a complaint with the Italian Garante per la protezione dei dati personali. If a data protection officer is appointed, the controller must publish their contact details.',
    gateTitle: '7. Activation gate',
    gate: 'Production Learn access is designed to remain disabled until the operator configures a version of this notice and a non-secret reference to the WebUntis authorisation. A legal review by the controller/school and verification of the actual technical and organisational measures are still required before launch.',
    sourceLabel: 'Official references',
  },
  lld: {
    title: 'Nfurmazions sun la privacy · Pokyh Learn',
    intro: 'Nfurmazions trasparëntes sun l login WebUntis y sun l’adurvanza de Pokyh Learn. Stat: 12 de setëmber 2026.',
    controllerTitle: '1. Titular y autorisazion dla scola',
    controller: 'L titular y si dac de cuntat publics ie tl Impressum de POKYH. Dan la ativazion muessa l titular documenté l’autorisazion dla scola o dl ufize cumpetënt per la integrazion WebUntis y – sce l ie de bujën – regulé l rapurt aldò dl art. 28 GDPR. Na cunferma di utënc ne sostituesc nia chësta autorisazion.',
    dataTitle: '2. Dac y fin',
    data: 'Per l cuntrol dl azes vën tratei l inuem dl utënt WebUntis y i dac minims de resposta per l assegné a n account POKYH che ie bele. Per l servisc de mparé trata POKYH preferënzes, cuntenuc fac da se nstësc, dërc de azes, prugresc, pruves di quiz y dac tecnics de segurëza strictamënter necessars. La password WebUntis vën mandeda mé tres na cunescion segura per l cuntrol dal server; la ne vën nia salveda, nia protocoleda y nia metuda tla memoria permanënta dl browser.',
    legalTitle: '3. Basa giuridica y trasparënza',
    legal: 'Dan la cuiuda di dac muessa l titular numiné tl si register y te chësta nfurmazion l fin concret, la basa giuridica, i destinatars, n respunsabl per la prutezion di dac, sce l ie, i trasferimënc te pajëisc terzi y la durazion dla cunservazion. La cunferma dl login documentea che la nfurmazion ie unida cunesciuda; la ne fej nia da sëula dl cunsëntimënt la basa giuridica.',
    recipientsTitle: '4. Destinatars y servijes',
    recipients: 'WebUntis vën cherdà mé per l cuntrol dl account. L backend de POKYH y furnidëures tecnics autorisei trata dac mé per purté y segurà l servisc. N dizionar facoltatif ciafa – sce l ie ativà dal titular y dumandà esplizitamënter da n editor – mé la parola dumandeda y la direzion dl lingaz; deguna password WebUntis, deguni token, profii o storia dl mparé.',
    retentionTitle: '5. Cunservazion y minimisazion di dac',
    retention: 'I dac dl mparé resta spartii dai dac dla scola y vën salvei mé per la durazion fissada y publicheda dal titular. N esport persunel cuntën mé i cuntenuc y i stac de mparé propi; roles, team, dac de azes y dac de d’autri resta lascei ora. L titular muessa fissé n prucedimënt che se lascia cuntrolé per l scancelamënt, l’archiviazion y la dumandes dla persones nteressedes.',
    rightsTitle: '6. Dërc y reclam te Talia',
    rights: 'Tu pos dumandé al titular nfurmazion, curezion, scancelamënt, limitazion, purtabltà di dac o fé uposizion aldò di art. 15–21 GDPR. Pona pos fé n reclam pra l Garante per la protezione dei dati personali talian. Sce l ie n respunsabl per la prutezion di dac, muessa l titular publiché si dac de cuntat.',
    gateTitle: '7. Bloch dla ativazion',
    gate: 'L azes a Learn te produzion ie fat nsci che l resta destudà nchin che l gestor à cunfigurà na verscion de chësta nfurmazion y n renviamënt nia segret al’autorisazion WebUntis. Dan la ativazion ie ënghe de bujën l cuntrol giuridich dal titular o dala scola y l cuntrol dla mesures tecniches y organisatives metudes n droa dassënn.',
    sourceLabel: 'Referënzes ufizieles',
  },
};

function LearnPrivacyView({ locale, identity }: { locale: LegalLocale; identity: LegalIdentity }) {
  const copy = learnPrivacyCopy[locale];
  const back = backLabelsCopy[locale];
  return (
    <div className="fade-in">
      <div className="mb-8 flex items-center justify-between gap-4">
        <LegalBackButton label={back.toLegal} fallbackUrl={`/${locale}/legal/`} />
        <LocaleSwitcher view="learn" locale={locale} />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}>
          <Shield size={20} color="var(--accent)" />
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>{copy.title}</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--app-text-secondary)' }}>{copy.intro}</p>

      <div className="rounded-2xl p-6 flex flex-col gap-6" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
        <LegalSection title={copy.controllerTitle}>
          <p>{copy.controller}</p>
          <LegalIdentityDetails locale={locale} identity={identity} />
        </LegalSection>
        <LegalSection title={copy.dataTitle}><p>{copy.data}</p></LegalSection>
        <LegalSection title={copy.legalTitle}><p>{copy.legal}</p></LegalSection>
        <LegalSection title={copy.recipientsTitle}><p>{copy.recipients}</p></LegalSection>
        <LegalSection title={copy.retentionTitle}><p>{copy.retention}</p></LegalSection>
        <LegalSection title={copy.rightsTitle}><p>{copy.rights}</p></LegalSection>
        <LegalSection title={copy.gateTitle}><p>{copy.gate}</p></LegalSection>
        <LegalSection title={copy.sourceLabel}>
          <div className="flex flex-col gap-2">
            <a className="text-sm flex items-center gap-1.5" href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/?locale=it" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}><ExternalLink size={13} /> Regolamento (UE) 2016/679</a>
            <a className="text-sm flex items-center gap-1.5" href="https://www.garanteprivacy.it/temi/trasparenza-ai-sensi-del-gdpr" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}><ExternalLink size={13} /> Garante per la protezione dei dati personali</a>
            <a className="text-sm flex items-center gap-1.5" href="https://www.untis.at/datenschutz-wu-integrationen" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}><ExternalLink size={13} /> Untis · integrazioni WebUntis</a>
          </div>
        </LegalSection>
      </div>
    </div>
  );
}

/* ─── Cookies ─────────────────────────────────────────────────────────────── */

const cookiesCopy: Record<LegalLocale, {
  title: string;
  whatTitle: string;
  what: string;
  necessaryTitle: string;
  necessaryIntro: string;
  necessaryRows: CookieRowCopy[];
  analyticsTitle: string;
  analyticsBefore: string;
  analyticsBold: string;
  analyticsAfter: string;
  analyticsRows: CookieRowCopy[];
  storageTitle: string;
  storageIntro: string;
  storageRows: CookieRowCopy[];
  cookieKindLabels: Record<CookieKind, string>;
  revokeTitle: string;
  revokeIntro: string;
  revokeButtonLabel: string;
  optOutPrefix: string;
  optOutLabel: string;
  legalTitle: string;
  legal: string;
  contactTitle: string;
  contactPrefix: string;
  contactSuffix: string;
}> = {
  de: {
    title: 'Cookie-Richtlinie',
    whatTitle: 'Was sind Cookies?',
    what: 'Cookies sind kleine Textdateien, die beim Besuch einer Website auf deinem Gerät gespeichert werden. Sie ermöglichen es uns, dich wiederzuerkennen, deine Einstellungen zu speichern und den Dienst bereitzustellen. Neben Cookies verwenden wir auch den lokalen Browserspeicher (localStorage) für Einstellungen, die ausschließlich auf deinem Gerät verbleiben.',
    necessaryTitle: 'Notwendige Cookies',
    necessaryIntro: 'Diese Cookies sind für den Betrieb der App zwingend erforderlich. Ohne sie funktioniert die Anmeldung und Sitzungsverwaltung nicht. Sie können nicht abgelehnt werden.',
    necessaryRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Verschlüsseltes WebUntis-Session-Token (AES-GCM, httpOnly). Enthält keine persönlichen Daten im Klartext. Läuft nach 4 Stunden ab.' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Nicht-sensible Anzeigeinformationen (Benutzername, Klasse). Kein Passwort, kein Session-Token. Läuft nach 4 Stunden ab.' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'Zugangstoken (JWT) für das POKYH-Backend. Läuft nach 8 Stunden ab.' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'Refresh-Token zum automatischen Erneuern des Zugangstokens (httpOnly). Läuft nach 30 Tagen ab.' },
      { name: 'passkey_declined', kind: 'necessary', desc: 'Merkt sich, dass du das Speichern der Anmeldung im Browser abgelehnt hast. Läuft nach 1 Jahr ab.' },
    ],
    analyticsTitle: 'Analytics-Cookies (optional)',
    analyticsBefore: 'Diese Cookies werden nur gesetzt, wenn du',
    analyticsBold: '„Alles akzeptieren“',
    analyticsAfter: 'wählst. Sie helfen uns, die App zu verbessern, indem sie anonymisierte Nutzungsdaten erfassen.',
    analyticsRows: [
      { name: '_ga', kind: 'analytics', desc: 'Google Analytics 4 – eindeutiger Zähler für Websitebesuche. Läuft nach 2 Jahren ab. IP-Adresse wird vor Übermittlung anonymisiert.' },
      { name: '_ga_*', kind: 'analytics', desc: 'Google Analytics 4 – Session-Status und Seitenzähler. Läuft nach 2 Jahren ab.' },
    ],
    storageTitle: 'Lokaler Speicher (localStorage)',
    storageIntro: 'Diese Einträge werden nur lokal in deinem Browser gespeichert (localStorage bzw. sessionStorage) und verlassen niemals dein Gerät. Sie sind keine Cookies im rechtlichen Sinne, werden aber der Vollständigkeit halber aufgeführt.',
    storageRows: [
      { name: 'pockyh_theme', kind: 'setting', desc: 'Gespeichertes Farbschema (hell/dunkel/System). Kein Ablaufdatum.' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Sidebar ein- oder ausgeklappt. Kein Ablaufdatum.' },
      { name: 'pokyh_cookie_consent', kind: 'setting', desc: 'Deine Cookie-Entscheidung („all“ oder „necessary“). Wird gesetzt, sobald du eine Wahl triffst. Kein Ablaufdatum.' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Zwischenspeicher zuletzt geladener Schuldaten (Stundenplan, Noten, Abwesenheiten, Nachrichten) für schnellere Anzeige.' },
      { name: 'pockyh_abscalc_*', kind: 'necessary', desc: 'Zwischengespeicherte Berechnung der Fehlstunden.' },
      { name: 'pockyh_grade_drafts_v1', kind: 'setting', desc: 'Von dir eingegebene Noten-Entwürfe für die Durchschnittsberechnung.' },
      { name: 'pockyh_popups_seen', kind: 'setting', desc: 'Welche Hinweis-Popups du bereits gesehen hast.' },
      { name: 'pokyh_app_icon', kind: 'setting', desc: 'Gewähltes App-Symbol.' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Zugangsdaten zur automatischen Sitzungserneuerung – nur im sessionStorage des geöffneten Tabs, beim Schließen gelöscht.' },
    ],
    cookieKindLabels: { necessary: 'Notwendig', setting: 'Einstellung', analytics: 'Analytics' },
    revokeTitle: 'Einwilligung widerrufen',
    revokeIntro: 'Du kannst deine Auswahl jederzeit mit derselben Leichtigkeit ändern. Öffne dafür die Cookie-Einstellungen und wähle „Nur notwendige“, um optionale Analytics zu widerrufen.',
    revokeButtonLabel: 'Cookie-Einstellungen öffnen',
    optOutPrefix: 'Alternativ kannst du Google Analytics dauerhaft deaktivieren:',
    optOutLabel: 'Google Analytics Opt-out',
    legalTitle: 'Rechtsgrundlage',
    legal: 'Notwendige Cookies werden auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) gesetzt. Analytics-Cookies werden nur auf Basis deiner ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) gesetzt. Du kannst deine Einwilligung jederzeit widerrufen, ohne dass die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung berührt wird.',
    contactTitle: 'Kontakt',
    contactPrefix: 'Bei Fragen zur Cookie-Nutzung wende dich an:',
    contactSuffix: '. Stand: September 2026.',
  },
  it: {
    title: 'Informativa sui cookie',
    whatTitle: 'Cosa sono i cookie?',
    what: 'I cookie sono piccoli file di testo che vengono salvati sul tuo dispositivo quando visiti un sito web. Ci permettono di riconoscerti, memorizzare le tue preferenze e fornire il servizio. Oltre ai cookie, utilizziamo anche la memoria locale del browser (localStorage) per le impostazioni che restano esclusivamente sul tuo dispositivo.',
    necessaryTitle: 'Cookie necessari',
    necessaryIntro: 'Questi cookie sono indispensabili per il funzionamento dell’app. Senza di essi l’accesso e la gestione della sessione non funzionano. Non possono essere rifiutati.',
    necessaryRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Token di sessione WebUntis cifrato (AES-GCM, httpOnly). Non contiene dati personali in chiaro. Scade dopo 4 ore.' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Informazioni di visualizzazione non sensibili (nome utente, classe). Nessuna password, nessun token di sessione. Scade dopo 4 ore.' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'Token di accesso (JWT) per il backend POKYH. Scade dopo 8 ore.' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'Token di refresh per rinnovare automaticamente il token di accesso (httpOnly). Scade dopo 30 giorni.' },
      { name: 'passkey_declined', kind: 'necessary', desc: 'Ricorda che hai rifiutato di salvare l’accesso nel browser. Scade dopo 1 anno.' },
    ],
    analyticsTitle: 'Cookie di analisi (opzionali)',
    analyticsBefore: 'Questi cookie vengono impostati solo se scegli',
    analyticsBold: '«Accetta tutto»',
    analyticsAfter: '. Ci aiutano a migliorare l’app raccogliendo dati d’uso anonimizzati.',
    analyticsRows: [
      { name: '_ga', kind: 'analytics', desc: 'Google Analytics 4 – contatore univoco delle visite al sito. Scade dopo 2 anni. L’indirizzo IP viene anonimizzato prima della trasmissione.' },
      { name: '_ga_*', kind: 'analytics', desc: 'Google Analytics 4 – stato della sessione e conteggio delle pagine. Scade dopo 2 anni.' },
    ],
    storageTitle: 'Memoria locale (localStorage)',
    storageIntro: 'Queste voci vengono salvate solo localmente nel tuo browser (localStorage o sessionStorage) e non lasciano mai il dispositivo. Non sono cookie in senso giuridico, ma vengono elencate per completezza.',
    storageRows: [
      { name: 'pockyh_theme', kind: 'setting', desc: 'Schema colori salvato (chiaro/scuro/sistema). Nessuna scadenza.' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Barra laterale espansa o compressa. Nessuna scadenza.' },
      { name: 'pokyh_cookie_consent', kind: 'setting', desc: 'La tua scelta sui cookie («all» o «necessary»). Viene impostata non appena effettui una scelta. Nessuna scadenza.' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Memoria temporanea degli ultimi dati scolastici caricati (orario, voti, assenze, messaggi) per una visualizzazione più rapida.' },
      { name: 'pockyh_abscalc_*', kind: 'necessary', desc: 'Calcolo delle ore di assenza memorizzato temporaneamente.' },
      { name: 'pockyh_grade_drafts_v1', kind: 'setting', desc: 'Bozze di voti inserite da te per il calcolo della media.' },
      { name: 'pockyh_popups_seen', kind: 'setting', desc: 'Quali popup informativi hai già visto.' },
      { name: 'pokyh_app_icon', kind: 'setting', desc: 'Icona dell’app scelta.' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Credenziali per il rinnovo automatico della sessione – solo nel sessionStorage della scheda aperta, eliminate alla chiusura.' },
    ],
    cookieKindLabels: { necessary: 'Necessario', setting: 'Impostazione', analytics: 'Analytics' },
    revokeTitle: 'Revocare il consenso',
    revokeIntro: 'Puoi modificare la tua scelta in qualsiasi momento con la stessa facilità. Apri le impostazioni dei cookie e scegli «Solo necessari» per revocare gli analytics opzionali.',
    revokeButtonLabel: 'Apri impostazioni cookie',
    optOutPrefix: 'In alternativa puoi disattivare Google Analytics in modo permanente:',
    optOutLabel: 'Opt-out di Google Analytics',
    legalTitle: 'Base giuridica',
    legal: 'I cookie necessari vengono impostati sulla base dell’art. 6, par. 1, lett. b GDPR (esecuzione del contratto). I cookie di analisi vengono impostati solo sulla base del tuo consenso esplicito (art. 6, par. 1, lett. a GDPR). Puoi revocare il consenso in qualsiasi momento, senza che ciò pregiudichi la liceità del trattamento effettuato prima della revoca.',
    contactTitle: 'Contatto',
    contactPrefix: 'Per domande sull’uso dei cookie scrivi a:',
    contactSuffix: '. Versione: settembre 2026.',
  },
  en: {
    title: 'Cookie policy',
    whatTitle: 'What are cookies?',
    what: 'Cookies are small text files stored on your device when you visit a website. They let us recognise you, save your preferences, and provide the service. Besides cookies, we also use the browser’s local storage (localStorage) for settings that stay exclusively on your device.',
    necessaryTitle: 'Necessary cookies',
    necessaryIntro: 'These cookies are strictly required for the app to operate. Without them, sign-in and session management do not work. They cannot be declined.',
    necessaryRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Encrypted WebUntis session token (AES-GCM, httpOnly). Contains no personal data in plaintext. Expires after 4 hours.' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Non-sensitive display information (username, class). No password, no session token. Expires after 4 hours.' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'Access token (JWT) for the POKYH backend. Expires after 8 hours.' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'Refresh token to renew the access token automatically (httpOnly). Expires after 30 days.' },
      { name: 'passkey_declined', kind: 'necessary', desc: 'Remembers that you declined saving the sign-in in the browser. Expires after 1 year.' },
    ],
    analyticsTitle: 'Analytics cookies (optional)',
    analyticsBefore: 'These cookies are only set if you choose',
    analyticsBold: '“Accept all”',
    analyticsAfter: '. They help us improve the app by collecting anonymised usage data.',
    analyticsRows: [
      { name: '_ga', kind: 'analytics', desc: 'Google Analytics 4 — unique counter for site visits. Expires after 2 years. The IP address is anonymised before transmission.' },
      { name: '_ga_*', kind: 'analytics', desc: 'Google Analytics 4 — session state and page counter. Expires after 2 years.' },
    ],
    storageTitle: 'Local storage (localStorage)',
    storageIntro: 'These entries are stored only locally in your browser (localStorage or sessionStorage) and never leave your device. They are not cookies in the legal sense but are listed here for completeness.',
    storageRows: [
      { name: 'pockyh_theme', kind: 'setting', desc: 'Saved colour scheme (light/dark/system). No expiry.' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Sidebar collapsed or expanded state. No expiry.' },
      { name: 'pokyh_cookie_consent', kind: 'setting', desc: 'Your cookie choice (“all” or “necessary”). Set as soon as you make a choice. No expiry.' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Cache of recently loaded school data (timetable, grades, absences, messages) for faster display.' },
      { name: 'pockyh_abscalc_*', kind: 'necessary', desc: 'Cached calculation of absence hours.' },
      { name: 'pockyh_grade_drafts_v1', kind: 'setting', desc: 'Grade drafts you entered for the average calculation.' },
      { name: 'pockyh_popups_seen', kind: 'setting', desc: 'Which notice popups you have already seen.' },
      { name: 'pokyh_app_icon', kind: 'setting', desc: 'Chosen app icon.' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Credentials for automatic session renewal — only in the open tab’s sessionStorage, deleted when it is closed.' },
    ],
    cookieKindLabels: { necessary: 'Necessary', setting: 'Setting', analytics: 'Analytics' },
    revokeTitle: 'Withdrawing consent',
    revokeIntro: 'You can change your choice at any time just as easily. Open cookie settings and choose “Necessary only” to withdraw optional analytics.',
    revokeButtonLabel: 'Open cookie settings',
    optOutPrefix: 'Alternatively, you can permanently disable Google Analytics:',
    optOutLabel: 'Google Analytics opt-out',
    legalTitle: 'Legal basis',
    legal: 'Necessary cookies are set on the basis of Art. 6(1)(b) GDPR (performance of a contract). Analytics cookies are set only on the basis of your explicit consent (Art. 6(1)(a) GDPR). You can withdraw consent at any time, without affecting the lawfulness of processing carried out before the withdrawal.',
    contactTitle: 'Contact',
    contactPrefix: 'For questions about cookie use, contact:',
    contactSuffix: '. Version: September 2026.',
  },
  lld: {
    title: 'Regules di cookies',
    whatTitle: 'Ci ie pa i cookies?',
    what: 'I cookies ie pitli file de test che vën salvei sun ti dispusitif canche tu ves a ciaté na plata web. I nes lascia te recunëscer, salvé tia mpustazions y purté l servisc. Dlongia i cookies adurvons nce la memoria locala dl browser (localStorage) per mpustazions che resta mé sun ti dispusitif.',
    necessaryTitle: 'Cookies necessars',
    necessaryIntro: 'Chisc cookies ie dassënn necessars per l funzionamënt dl’app. Zënza chisc ne funzionea nia l login y la gestion dla sesion. I ne se lascia nia refudé.',
    necessaryRows: [
      { name: 'pockyh_session', kind: 'necessary', desc: 'Token de sesion WebUntis zifrà (AES-GCM, httpOnly). Ne cuntën deguni dac persunei lieibli. Scadësc do 4 ëures.' },
      { name: 'pockyh_user', kind: 'necessary', desc: 'Nfurmazions de vijualisazion nia sensibles (inuem dl utënt, tlas). Deguna password, degun token de sesion. Scadësc do 4 ëures.' },
      { name: 'pockyh_api_token', kind: 'necessary', desc: 'Token de azes (JWT) per l backend de POKYH. Scadësc do 8 ëures.' },
      { name: 'pockyh_api_refresh', kind: 'necessary', desc: 'Refresh token per renuvé da sëul l token de azes (httpOnly). Scadësc do 30 dis.' },
      { name: 'passkey_declined', kind: 'necessary', desc: 'Se tën a ment che tu es refudà de salvé l login tl browser. Scadësc do 1 ann.' },
    ],
    analyticsTitle: 'Cookies de analisa (facoltatifs)',
    analyticsBefore: 'Chisc cookies vën metui mé sce tu ciernes',
    analyticsBold: '„Azeté dut“',
    analyticsAfter: '. I nes juda a miuré l’app cun l tò su dac de adurvanza anonimisei.',
    analyticsRows: [
      { name: '_ga', kind: 'analytics', desc: 'Google Analytics 4 – cuntadëur unich per la vijites dla plata web. Scadësc do 2 ani. L’adressa IP vën anonimiseda dan che la vën mandeda.' },
      { name: '_ga_*', kind: 'analytics', desc: 'Google Analytics 4 – stat dla sesion y cuntadëur dla plates. Scadësc do 2 ani.' },
    ],
    storageTitle: 'Memoria locala (localStorage)',
    storageIntro: 'Chësta nfurmazions vën salvedes mé localmënter te ti browser (localStorage o sessionStorage) y ne lascia mai ti dispusitif. Ëles ne n’ie nia cookies tl sëns giuridich, ma les lisson sù per la cumpletëza.',
    storageRows: [
      { name: 'pockyh_theme', kind: 'setting', desc: 'Schem de culëures salvà (cler/scur/sistem). Deguna data de scadënza.' },
      { name: 'pockyh_sidebar_collapsed', kind: 'setting', desc: 'Sidebar giaurida o stluta. Deguna data de scadënza.' },
      { name: 'pokyh_cookie_consent', kind: 'setting', desc: 'Tia cërnuda di cookies („all“ o „necessary“). Vën metuda sibe che tu ciernes. Deguna data de scadënza.' },
      { name: 'pokyh_cache_*', kind: 'necessary', desc: 'Memoria temporena di ultimi dac dla scola ciariei (urar, notes, assënzes, nutizies) per na vijualisazion plu sveta.' },
      { name: 'pockyh_abscalc_*', kind: 'necessary', desc: 'Calcul dla ëures de assënza salvà temporenamënter.' },
      { name: 'pockyh_grade_drafts_v1', kind: 'setting', desc: 'Sbozes de notes scrites ite da te per l calcul dla media.' },
      { name: 'pockyh_popups_seen', kind: 'setting', desc: 'Cie popup cun avisc che tu es bele udù.' },
      { name: 'pokyh_app_icon', kind: 'setting', desc: 'Icona dl’app cernuda.' },
      { name: 'pockyh_creds', kind: 'necessary', desc: 'Dac de azes per renuvé da sëul la sesion – mé tl sessionStorage dla scheda daverta, scancelei canche la vën stluta.' },
    ],
    cookieKindLabels: { necessary: 'Necessar', setting: 'Mpustazion', analytics: 'Analisa' },
    revokeTitle: 'Tò zeruch l cunsëntimënt',
    revokeIntro: 'Tu pos mudé tia cërnuda uni mumënt tl medem muet saurì. Giaurësc per chël la mpustazions di cookies y cerni „Mé necessars“ per tò zeruch la analisa facoltativa.',
    revokeButtonLabel: 'Giaurì la mpustazions di cookies',
    optOutPrefix: 'Autramënter pos destudé Google Analytics per for:',
    optOutLabel: 'Opt-out de Google Analytics',
    legalTitle: 'Basa giuridica',
    legal: 'I cookies necessars vën metui sun la basa dl art. 6 par. 1 lett. b GDPR (adimplimënt dl cuntrat). I cookies de analisa vën metui mé sun la basa de ti cunsëntimënt esplizit (art. 6 par. 1 lett. a GDPR). Tu pos tò zeruch ti cunsëntimënt uni mumënt, zënza che la legitimità dl tratamënt fat nchin a chël mumënt vënie tucheda.',
    contactTitle: 'Cuntat',
    contactPrefix: 'Per dumandes sun l’adurvanza di cookies reverësc te a:',
    contactSuffix: '. Stat: setëmber 2026.',
  },
};

function CookiesView({ locale, identity }: { locale: LegalLocale; identity: LegalIdentity }) {
  const copy = cookiesCopy[locale];
  const back = backLabelsCopy[locale];
  return (
    <div className="fade-in">
      <div className="mb-8 flex items-center justify-between gap-4">
        <LegalBackButton label={back.toLegal} fallbackUrl={`/${locale}/legal/`} />
        <LocaleSwitcher view="cookies" locale={locale} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, #f97316 14%, transparent)' }}
        >
          <Cookie size={20} color="#f97316" />
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
          {copy.title}
        </h1>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-6"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <LegalSection title={copy.whatTitle}>
          <p>{copy.what}</p>
        </LegalSection>

        <LegalSection title={copy.necessaryTitle}>
          <p className="mb-3">{copy.necessaryIntro}</p>
          <div className="flex flex-col gap-2">
            {copy.necessaryRows.map((row) => (
              <CookieRow key={row.name} name={row.name} kind={row.kind} kindLabel={copy.cookieKindLabels[row.kind]} desc={row.desc} />
            ))}
          </div>
        </LegalSection>

        <LegalSection title={copy.analyticsTitle}>
          <p className="mb-3">
            {copy.analyticsBefore} <strong style={{ color: 'var(--app-text-primary)' }}>{copy.analyticsBold}</strong>{' '}
            {copy.analyticsAfter}
          </p>
          <div className="flex flex-col gap-2">
            {copy.analyticsRows.map((row) => (
              <CookieRow key={row.name} name={row.name} kind={row.kind} kindLabel={copy.cookieKindLabels[row.kind]} desc={row.desc} />
            ))}
          </div>
        </LegalSection>

        <LegalSection title={copy.storageTitle}>
          <p className="mb-3">{copy.storageIntro}</p>
          <div className="flex flex-col gap-2">
            {copy.storageRows.map((row) => (
              <CookieRow key={row.name} name={row.name} kind={row.kind} kindLabel={copy.cookieKindLabels[row.kind]} desc={row.desc} />
            ))}
          </div>
        </LegalSection>

        <LegalSection title={copy.revokeTitle}>
          <p className="mb-3">{copy.revokeIntro}</p>
          <CookieSettingsButton label={copy.revokeButtonLabel} />
          <p className="mt-3">
            {copy.optOutPrefix}{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              {copy.optOutLabel} <ExternalLink size={11} />
            </a>
          </p>
        </LegalSection>

        <LegalSection title={copy.legalTitle}>
          <p>{copy.legal}</p>
        </LegalSection>

        <LegalSection title={copy.contactTitle}>
          <p>
            {copy.contactPrefix}{' '}
            <a href={`mailto:${identity.privacyEmail}`} style={{ color: 'var(--accent)' }}>{identity.privacyEmail}</a>
            {copy.contactSuffix}
          </p>
        </LegalSection>
      </div>

      <div className="flex justify-center mt-8">
        <LegalBackButton label={back.backToLegal} fallbackUrl={`/${locale}/legal/`} />
      </div>
    </div>
  );
}

/* ─── Shared components ──────────────────────────────────────────────────── */

const legalIdentityLabels: Record<LegalLocale, {
  representative: string;
  vatId: string;
  companyRegister: string;
  reaNumber: string;
  pec: string;
  missingRegistration: string;
}> = {
  de: {
    representative: 'Gesetzliche Vertretung',
    vatId: 'Umsatzsteuer-ID',
    companyRegister: 'Handelsregister',
    reaNumber: 'REA-Nummer',
    pec: 'PEC',
    missingRegistration: 'Vor einer öffentlichen kommerziellen Bereitstellung müssen die verifizierten Angaben zur gesetzlichen Vertretung, Umsatzsteuer-ID und Handelsregistereintragung in der Produktionskonfiguration ergänzt werden.',
  },
  it: {
    representative: 'Rappresentante legale',
    vatId: 'Partita IVA',
    companyRegister: 'Registro delle imprese',
    reaNumber: 'Numero REA',
    pec: 'PEC',
    missingRegistration: 'Prima della pubblicazione commerciale, i dati verificati su rappresentante legale, partita IVA e registro delle imprese devono essere completati nella configurazione di produzione.',
  },
  en: {
    representative: 'Legal representative',
    vatId: 'VAT ID',
    companyRegister: 'Company register',
    reaNumber: 'REA number',
    pec: 'PEC',
    missingRegistration: 'Before commercial public release, the verified legal representative, VAT ID, and company-register information must be completed in the production configuration.',
  },
  lld: {
    representative: 'Raprejentanza legala',
    vatId: 'Numer IVA',
    companyRegister: 'Register dl cumerz',
    reaNumber: 'Numer REA',
    pec: 'PEC',
    missingRegistration: 'Dan na metuda a dispuzion publica y comerziela muessa vester cumpletei tla cunfigurazion de produzion i dac verificei sun la raprejentanza legala, l numer IVA y la registrazion tl register dl cumerz.',
  },
};

function LegalIdentityDetails({
  locale,
  identity,
  includeContact = true,
  showReadiness = false,
}: {
  locale: LegalLocale;
  identity: LegalIdentity;
  includeContact?: boolean;
  showReadiness?: boolean;
}) {
  const labels = legalIdentityLabels[locale];
  const optionalRows = [
    [labels.representative, identity.legalRepresentative],
    [labels.vatId, identity.vatId],
    [labels.companyRegister, identity.companyRegister],
    [labels.reaNumber, identity.reaNumber],
    [labels.pec, identity.pec],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;

  return (
    <div className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
      <p>
        <strong style={{ color: 'var(--app-text-primary)' }}>{identity.name}</strong><br />
        {identity.addressLines.map((line) => <span key={line}>{line}<br /></span>)}
      </p>
      {includeContact && (
        <a
          href={`mailto:${identity.contactEmail}`}
          className="mt-2 inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          <Mail size={13} />
          {identity.contactEmail}
        </a>
      )}
      {optionalRows.length > 0 && (
        <dl className="mt-2 grid gap-1">
          {optionalRows.map(([label, value]) => (
            <div key={label} className="flex flex-wrap gap-x-1.5">
              <dt className="font-semibold" style={{ color: 'var(--app-text-primary)' }}>{label}:</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {showReadiness && !identity.isCompanyRegistrationComplete && (
        <p className="mt-3 rounded-xl p-3 text-[13px]" role="note" style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}>
          {labels.missingRegistration}
        </p>
      )}
    </div>
  );
}

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

function ThirdParty({ name, purpose, url, linkLabel }: { name: string; purpose: string; url: string; linkLabel: string }) {
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
        {linkLabel} <ExternalLink size={10} />
      </a>
    </div>
  );
}

type CookieKind = 'necessary' | 'setting' | 'analytics';

function CookieRow({ name, kind, kindLabel, desc }: { name: string; kind: CookieKind; kindLabel: string; desc: string }) {
  const typeColor = kind === 'necessary'
    ? { bg: 'color-mix(in srgb, var(--tint) 15%, transparent)', text: 'var(--tint)' }
    : kind === 'analytics'
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
          {kindLabel}
        </span>
      </div>
      <p className="text-[13px]" style={{ color: 'var(--app-text-secondary)' }}>{desc}</p>
    </div>
  );
}
