'use client';

import { useEffect, useState, type RefObject } from 'react';
import { dishesFrom, type MenuDish } from '@/lib/mensa';
import { apiUrl } from '@/lib/backend';

// The school's Mensa plan, loaded once per page and shared by every section
// of the homepage that shows dishes (the public menu, straight from the API).
let request: Promise<MenuDish[]> | null = null;

function load(): Promise<MenuDish[]> {
  request ??= fetch(apiUrl('/dishes'))
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((json) => dishesFrom(json))
    .catch(() => {
      request = null;
      return [];
    });
  return request;
}

/**
 * The plan, or null while it loads. With `near`, it is only asked for once
 * that element is within two screens of the view: a section far down the
 * homepage has no part in its first screen, so loading the page makes no
 * request for it.
 */
export function useMensaDishes(near?: RefObject<Element | null>): MenuDish[] | null {
  const [dishes, setDishes] = useState<MenuDish[] | null>(null);
  useEffect(() => {
    let alive = true;
    const start = () => load().then((d) => { if (alive) setDishes(d); });
    const el = near?.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      start();
      return () => { alive = false; };
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      start();
    }, { rootMargin: '200% 0px' });
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [near]);
  return dishes;
}
