'use client';

import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import { Page, PageHeader } from '@/components/app/Page';
import { useUnreadMessages } from '@/components/app/hooks';
import { DEST, HUB_ITEMS, TONE_CLASS, type AppDestination } from '@/components/app/nav';
import { useSession } from '@/providers/SessionProvider';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { schoolDict } from '@/lib/i18n/dictionaries/school';
import { shellDict } from '@/lib/i18n/dictionaries/shell';

// "Schule": everything that has no tab of its own in the bottom bar, as the
// Android app's hub — one coloured tile per place, each keeping its tone. On
// wide screens the sidebar lists the same places.

const HINT: Partial<Record<string, 'gradesSubtitle' | 'remindersSubtitle' | 'absencesSubtitle' | 'todosSubtitle'>> = {
  '/absences': 'absencesSubtitle',
  '/todos': 'todosSubtitle',
  '/reminders': 'remindersSubtitle',
};

function HubTile({ dest, label, note, index }: { dest: AppDestination; label: string; note?: string; index: number }) {
  const localize = useLocalizeHref();
  const { Icon } = dest;
  return (
    <Link
      href={localize(dest.href)}
      className={`squircle rise group flex min-h-[136px] flex-col justify-between rounded-[26px] p-5 transition-[filter] duration-300 hover:brightness-[0.97] dark:hover:brightness-110 ${TONE_CLASS[dest.tone]}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span className="flex items-start justify-between">
        <Icon size={28} weight="bold" aria-hidden="true" />
        <ArrowRight size={18} weight="bold" className="-translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[18px] font-bold leading-tight tracking-[-0.02em]">{label}</span>
        {note && <span className="mt-1 block text-[13.5px] font-semibold opacity-80">{note}</span>}
      </span>
    </Link>
  );
}

function SchoolContent() {
  const t = useT(shellDict);
  const ts = useT(schoolDict);
  const { user } = useSession();
  const unread = useUnreadMessages();
  const untis = user?.isUntisUser !== false;
  const items = HUB_ITEMS.filter((d) => untis || !d.untis);

  return (
    <Page>
      <PageHeader title={t('school')} subtitle={[user?.klasseName, 'LBS Brixen'].filter(Boolean).join(' · ')} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((d, i) => (
          <HubTile
            key={d.href}
            dest={d}
            index={i}
            label={t(d.key)}
            note={d === DEST.messages && unread > 0 ? t('unread', { n: unread }) : HINT[d.href] ? ts(HINT[d.href]!) : undefined}
          />
        ))}
      </div>

    </Page>
  );
}

export default function SchoolPage() {
  return (
    <AuthGuard>
      <SchoolContent />
    </AuthGuard>
  );
}
