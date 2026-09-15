"use client";

import type { ReactNode } from "react";

/**
 * Mobile: max-w-md, centered, gray side-padding, shadow — the "phone
 * frame" look. At lg:, the width cap is removed entirely
 * (lg:max-w-none) so content fills all remaining space next to
 * DesktopSidebar instead of staying capped at a fixed narrow column.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full flex justify-center lg:justify-start h-dvh bg-gray-200 lg:bg-gray-50">
      <div className="w-full max-w-md lg:max-w-none bg-gray-50 h-dvh flex flex-col relative shadow-2xl lg:shadow-none overflow-hidden">
        {children}
      </div>
    </div>
  );
}
