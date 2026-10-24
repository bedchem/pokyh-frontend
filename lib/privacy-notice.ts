// The privacy notice's current version, the one place it is set. The website
// reads it through lib/privacy-consent.ts, the iOS and Android apps through
// GET /api/privacy-notice.
//
// Raise PRIVACY_NOTICE_VERSION whenever the privacy notice changes in a way
// people should see again; everyone is then asked once more, on the website
// and in the apps. A short tag after the date tells two versions of one day
// apart ("2026-10-15b").

export const PRIVACY_NOTICE_VERSION = '2026-10-24';
// The day shown with the notice ("Stand"), YYYY-MM-DD.
export const PRIVACY_NOTICE_DAY = '2026-10-24';

// Whether an acknowledged version covers this one: the same or a later one.
// Versions sort as text (a date, then the tag), so whichever client asks,
// the website, beta or an app that reads an older deployment, an account
// that already confirmed a newer notice is not asked again for an older one.
export function noticeCovers(acknowledged: string | null | undefined, current: string = PRIVACY_NOTICE_VERSION): boolean {
  return !!acknowledged && acknowledged >= current;
}
