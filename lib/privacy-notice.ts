// The privacy notice's current version, the one place it is set. The website
// reads it through lib/privacy-consent.ts, the iOS and Android apps through
// GET /api/privacy-notice.
//
// Raise PRIVACY_NOTICE_VERSION whenever the privacy notice changes in a way
// people should see again; everyone is then asked once more, on the website
// and in the apps. A short tag after the date tells two versions of one day
// apart ("2026-10-15b").

export const PRIVACY_NOTICE_VERSION = '2026-10-19';
// The day shown with the notice ("Stand"), YYYY-MM-DD.
export const PRIVACY_NOTICE_DAY = '2026-10-19';
