"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextValue {
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

/**
 * Lets any page's <Header/> (which renders the hamburger button) open
 * the <Sidebar/> drawer that lives up in the dashboard route-group
 * layout, without prop-drilling through every page.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider
      value={{ open, openSidebar: () => setOpen(true), closeSidebar: () => setOpen(false) }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
