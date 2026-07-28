"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DesktopBlocker } from "@/components/ui/DesktopBlocker";
import { PageLoader } from "@/components/ui/PageLoader";

const MOBILE_BREAKPOINT = 768; // px — matches Tailwind's `md`

/**
 * Wraps the whole app. On anything wider than a phone (tablet/desktop
 * browser) it shows a "use the app on mobile" screen instead of the
 * real UI. Uses a live media-query listener rather than user-agent
 * sniffing, since UA strings are unreliable inside webviews.
 */
export function DesktopGate({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);

    function update() {
      setIsDesktop(mql.matches);
      setIsChecking(false);
    }

    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (isChecking) return <PageLoader fullScreen />;

  return isDesktop ? <DesktopBlocker /> : <>{children}</>;
}
