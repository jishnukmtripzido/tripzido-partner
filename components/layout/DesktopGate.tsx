"use client";

import type { ReactNode } from "react";

/**
 * No longer blocks desktop — the app is meant to render its
 * mobile-width layout centered on any screen size now (MobileShell
 * already handles that centering + gray side-padding on its own).
 * This component is kept as a thin pass-through rather than removed
 * outright, so nothing that imports/wraps with <DesktopGate> needs
 * to change.
 */
export function DesktopGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
