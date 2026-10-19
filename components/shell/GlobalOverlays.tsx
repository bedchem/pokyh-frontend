'use client';

import dynamic from 'next/dynamic';
import { useRoutePath } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { DEST } from '@/components/app/nav';

const AnnouncementPopup = dynamic(() => import('@/components/AnnouncementPopup'), { ssr: false });
const PrivacyGate = dynamic(() => import('@/components/PrivacyGate'), { ssr: false });
const MotionNotice = dynamic(() => import('@/components/MotionNotice'), { ssr: false });

// Routes inside the signed-in frame (its phone tab bar sits at the bottom).
const APP_ROUTES = Object.values(DEST).map((d) => d.href);

// Overlays that belong to the whole site, rendered once at the root so moving
// between public pages and the app never remounts them mid-stack.
//
// Admin popups: guests see the "guests" audience, signed-in users the "users"
// audience; keyed so signing in or out starts a fresh check, and held back on
// the sign-in form so nothing covers it. The current privacy notice is shown to
// signed-in accounts until acknowledged; it is hidden (not closed) on the
// sign-in form and on the privacy notice itself. Devices set to reduce motion
// are told what they are seeing (also held back on the sign-in form).
export default function GlobalOverlays() {
  const path = useRoutePath();
  const { user, isLoading } = useSession();

  if (isLoading) return null;

  return (
    <>
      <AnnouncementPopup
        key={user ? 'user' : 'guest'}
        audience={user ? 'user' : 'guest'}
        route={path}
        paused={path === '/login'}
      />
      {user && <PrivacyGate key={user.username} paused={path === '/login' || path === '/legal'} />}
      <MotionNotice
        paused={path === '/login'}
        inApp={APP_ROUTES.some((href) => path === href || path.startsWith(`${href}/`))}
      />
    </>
  );
}
