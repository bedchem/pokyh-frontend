import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-disclaimer">
          POKYH ist ein eigenständiges Schülerprojekt und steht in keiner offiziellen Verbindung zur LBS Brixen, zum Berufsbildungszentrum Christian Josef Tschuggmall oder zu WebUntis / Untis GmbH. Die Anmeldung erfolgt über die WebUntis-Schnittstelle der LBS Brixen. Marken und Logos sind Eigentum ihrer jeweiligen Inhaber.
        </div>
        <div className="lp-footer-bar">
          <div>
            © 2026{' '}
            <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer">bedchem</a>
            {' '}· POKYH · Made by{' '}
            <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer">Plattnericus</a>
            {' '}&amp;{' '}
            <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer">Ryhox</a>
          </div>
          <div className="lp-footer-links">
            <Link href="/login">Anmelden</Link>
            <Link href="/about">About</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/vergleich">Vergleich</Link>
            <Link href="/howto">GET POKYH</Link>
            <Link href="/legal">Impressum</Link>
            <Link href="/legal#datenschutz">Datenschutz</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
