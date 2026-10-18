import { Line, RowsSkeleton } from '@/components/app/Skeleton';

// Shown at once when a page of the app is opened (the sidebar and top bar
// stay), until the page itself is there. Prefetched with the sidebar links,
// so a click never waits on the network to show something.
export default function AppLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 pt-2">
      <Line w="34%" h={30} />
      <RowsSkeleton rows={4} />
    </div>
  );
}
