// "use client";

// import type { ReactNode } from "react";

// /**
//  * h-dvh (dynamic viewport height), not min-h-screen — min-height lets
//  * this container grow past the visible screen whenever a page's
//  * content is tall, which is exactly what was breaking BottomNav's
//  * "fixed" bottom bar: it's absolutely positioned relative to THIS
//  * container, so if the container can grow, the bar isn't actually
//  * pinned to the screen, it's pinned to the bottom of something taller
//  * than the screen. h-dvh locks this to the real visible viewport
//  * (correctly handling mobile browser address-bar show/hide, unlike
//  * 100vh/h-screen), so BottomNav's absolute positioning now always
//  * lands at the true bottom of the visible area. Each page's own
//  * <main overflow-y-auto> handles scrolling internally instead.
//  */
// export function MobileShell({ children }: { children: ReactNode }) {
//   return (
//     <div className="w-full flex justify-center h-dvh bg-gray-200">
//       <div className="w-full max-w-md bg-gray-50 h-dvh flex flex-col relative shadow-2xl overflow-hidden">
//         {children}
//       </div>
//     </div>
//   );
// }

// "use client";

// import type { ReactNode } from "react";

// /**
//  * Mobile behavior is completely unchanged: max-w-md, centered, gray
//  * side-padding. The only additions are lg: variants that let this
//  * column widen and sit flush next to DesktopSidebar instead of
//  * floating centered in empty space — none of the base (mobile)
//  * classes were touched.
//  */
// export function MobileShell({ children }: { children: ReactNode }) {
//   return (
//     <div className="w-full flex justify-center lg:justify-start h-dvh bg-gray-200 lg:bg-gray-50">
//       <div className="w-full max-w-md lg:max-w-2xl bg-gray-50 h-dvh flex flex-col relative shadow-2xl lg:shadow-none overflow-hidden">
//         {children}
//       </div>
//     </div>
//   );
// }

"use client";

import type { ReactNode } from "react";

/**
 * Mobile stays exactly the same (max-w-md, centered, gray padding,
 * shadow). At lg:, the width cap is now removed entirely
 * (lg:max-w-none) so content fills all remaining space next to
 * DesktopSidebar instead of staying capped at a fixed narrow column —
 * a deliberate widening from the original "narrow centered column"
 * approach, since a single card in a 768px-capped column looked too
 * sparse in practice.
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
