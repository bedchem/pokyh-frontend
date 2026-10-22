'use client';

import SiteShell from './SiteShell';
import NotFoundView from './NotFoundView';

// The 404 in the site's frame (header, footer, smooth scrolling). Loaded only
// through LazyNotFound, never imported by a page directly.
export default function NotFoundInFrame() {
  return (
    <SiteShell>
      <NotFoundView />
    </SiteShell>
  );
}
