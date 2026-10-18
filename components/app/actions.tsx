'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import ComposeMessageSheet from '@/components/messages/ComposeMessageSheet';
import ReportAbsenceSheet from '@/components/absences/ReportAbsenceSheet';
import { useSession } from '@/providers/SessionProvider';
import { useUntisPermissions } from './hooks';

// The two WebUntis writes a student reaches for from anywhere — writing to a
// teacher and reporting an absence — live in the frame, so the dashboard, the
// search and the pages all open the same sheet. Reporting is offered only
// where WebUntis allows it for the account (students of age, guardians).

interface AppActions {
  openCompose: () => void;
  /** null when WebUntis doesn't let this account report absences. */
  openReport: (() => void) | null;
}

const Ctx = createContext<AppActions>({ openCompose: () => {}, openReport: null });

export const ABSENCES_CHANGED = 'pokyh-absences-changed';
export const MESSAGES_CHANGED = 'pokyh-messages-changed';

export function AppActionsProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const perms = useUntisPermissions();
  const [compose, setCompose] = useState(false);
  const [report, setReport] = useState(false);
  const untis = !!user && user.isUntisUser !== false;
  const canReport = untis && !!perms?.canReportAbsence;

  const openCompose = useCallback(() => setCompose(true), []);
  const openReportFn = useCallback(() => setReport(true), []);
  const value = useMemo<AppActions>(
    () => ({ openCompose: untis ? openCompose : () => {}, openReport: canReport ? openReportFn : null }),
    [untis, canReport, openCompose, openReportFn],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {compose && (
        <ComposeMessageSheet
          onClose={() => setCompose(false)}
          onSent={() => window.dispatchEvent(new Event(MESSAGES_CHANGED))}
        />
      )}
      {report && (
        <ReportAbsenceSheet
          personName={perms?.personName ?? user?.username ?? ''}
          onClose={() => setReport(false)}
          onCreated={() => window.dispatchEvent(new Event(ABSENCES_CHANGED))}
        />
      )}
    </Ctx.Provider>
  );
}

export const useAppActions = () => useContext(Ctx);
