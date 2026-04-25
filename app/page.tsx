// Root path — proxy.ts handles the redirect server-side.
// This page is never rendered but must exist for the App Router.
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}
