'use client';

import { createContext, useContext, useState } from 'react';

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

  return (
    <Ctx.Provider value={{
      collapsed,
      mobileOpen,
      toggle: () => setCollapsed(c => !c),
      toggleMobile: () => setMobileOpen(o => !o),
      closeMobile: () => setMobileOpen(false),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSidebar = () => useContext(Ctx);
