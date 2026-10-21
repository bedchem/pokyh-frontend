'use client';

import DishView from './DishView';
import { ROUTE_PLACEHOLDER, useRouteId } from '@/lib/route-id';

// The dish pages (/mensa/dish/<id>/, /canteen/dish/<id>/): the dish named by the
// address, once it is known in the browser (lib/route-id.ts).
export default function RouteDishView({ id, inApp = false }: { id: string; inApp?: boolean }) {
  const real = useRouteId(id);
  if (real === ROUTE_PLACEHOLDER) return null;
  return <DishView key={real} id={decodeURIComponent(real)} inApp={inApp} />;
}
