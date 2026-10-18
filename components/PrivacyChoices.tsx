'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { privacyDict } from '@/lib/i18n/dictionaries/privacy';

// The privacy notice where it has to be seen: at sign-in and in PrivacyGate.
// Informing is what GDPR Art. 13 asks for, so this is a notice with a link,
// not a box to tick; the optional usage statistics are chosen in the cookie
// banner.
export default function PrivacyChoices() {
  const t = useT(privacyDict);
  const localize = useLocalizeHref();

  return (
    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>
      {t('loginNotice')}{' '}
      <Link
        href={localize('/legal/datenschutz')}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 font-semibold hover:underline"
        style={{ color: 'var(--accent)' }}
      >
        {t('readPolicy')}
        <ExternalLink size={12} />
      </Link>
    </p>
  );
}
