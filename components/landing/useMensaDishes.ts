'use client';

import { useEffect, useState } from 'react';
import { dishesFrom, type MenuDish } from '@/lib/mensa';

// The school's Mensa plan, loaded once per page and shared by every section
// of the homepage that shows dishes.
let request: Promise<MenuDish[]> | null = null;

function load(): Promise<MenuDish[]> {
  request ??= fetch('/api/mensa')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((json) => dishesFrom(json))
    .catch(() => {
      request = null;
      return [];
    });
  return request;
}

export function useMensaDishes(): MenuDish[] | null {
  const [dishes, setDishes] = useState<MenuDish[] | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((d) => { if (alive) setDishes(d); });
    return () => { alive = false; };
  }, []);
  return dishes;
}
