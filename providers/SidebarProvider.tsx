'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'pockyh_sidebar_collapsed';

interface SidebarCtx {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const Ctx = createContext<SidebarCtx>({
  collapsed: false,
  mobileOpen: false,
  toggle: () => {},
  toggleMobile: () => {},
  closeMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <Ctx.Provider value={{
      collapsed,
      mobileOpen,
      toggle,
      toggleMobile: () => setMobileOpen((o) => !o),
      closeMobile: () => setMobileOpen(false),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSidebar = () => useContext(Ctx);
