"use client";

import type { ReactNode } from "react";

/**
 * The `max-w-md` centered, shadowed card from the HTML mockups. On an
 * actual phone (or inside Capacitor) the viewport is already ≤448px,
 * so this just renders edge-to-edge — the max-width only matters when
 * the app happens to be viewed in a slightly wider mobile browser.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full flex justify-center min-h-screen bg-gray-200">
      <div className="w-full max-w-md bg-gray-50 min-h-screen flex flex-col relative shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
