'use client';

import { useEffect } from 'react';
import { useSession } from '@/providers/SessionProvider';
import { fetchTimetable } from '@/lib/api';
import { preloadSubjectImages } from '@/lib/subject-image-preload';
import { isoDate, mondayOf, parseTimetable } from '@/app/timetable/timetable-logic';

const REFRESH_MS = 6 * 60 * 60 * 1000;

/**
 * Mounted once for the whole app. As soon as a WebUntis user is signed in it loads this and next
 * week's timetable in the background (the same cached request the timetable page uses), tells the
 * backend which subjects exist, and downloads their header images — so the lesson sheet opens
 * with its photo no matter which screen the app was started on.
 */
export default function SubjectImagePreloader() {
  const { user, isLoading } = useSession();
  const enabled = !isLoading && !!user && user.isUntisUser !== false;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      const subjects: Array<{ subjectName: string; subjectLong: string }> = [];
      for (const offset of [0, 1]) {
        try {
          subjects.push(...parseTimetable(await fetchTimetable(isoDate(mondayOf(offset)))));
        } catch {
          // Offline or session trouble — the timetable page handles that itself.
        }
        if (cancelled) return;
      }
      if (!subjects.length) return;
      const { api } = await import('@/lib/api-client');
      await api.subjectImages.reportSubjects(subjects).catch(() => {});
      if (!cancelled) await preloadSubjectImages(subjects).catch(() => {});
    };

    // Off the critical path: let the current screen render and load first.
    const timeout = window.setTimeout(() => { void run(); }, 2500);
    const interval = window.setInterval(() => { void run(); }, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [enabled]);

  return null;
}
