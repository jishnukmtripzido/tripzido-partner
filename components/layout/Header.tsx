// "use client";

// import type { ReactNode } from "react";

// interface HeaderProps {
//   title: string;
//   /**
//    * Provide either onMenuClick (hamburger → opens the Sidebar drawer)
//    * or onBack (back arrow → router.back()), not both. Most dashboard
//    * screens use onMenuClick; drill-down/detail screens reached by
//    * tapping into a list (e.g. listing detail) use onBack instead.
//    */
//   onMenuClick?: () => void;
//   onBack?: () => void;
//   /** Right-side slot — the "ADD BIKE" button, filter icon, bell, Edit button, etc. */
//   rightSlot?: ReactNode;
// }

// /**
//  * Sticky top header shared by every dashboard screen. Left side is
//  * either hamburger+title (list/root screens) or back-arrow+title
//  * (drill-down screens); right side changes per page.
//  */
// export function Header({ title, onMenuClick, onBack, rightSlot }: HeaderProps) {
//   return (
//     <header className="bg-white sticky top-0 z-20 px-5 py-4 flex justify-between items-center shadow-sm pt-safe">
//       <div className="flex items-center gap-4 min-w-0">
//         {onBack ? (
//           <button
//             onClick={onBack}
//             aria-label="Go back"
//             className="p-1.5 -m-1.5 text-font-main-sub hover:text-brand-yellow-lg transition-colors shrink-0"
//           >
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 19l-7-7 7-7"
//               />
//             </svg>
//           </button>
//         ) : (
//           <button
//             onClick={onMenuClick}
//             aria-label="Open menu"
//             className="lg:hidden p-1.5 -m-1.5 text-font-main-sub hover:text-brand-yellow-lg transition-colors shrink-0"
//           >
//             <svg
//               className="w-7 h-7"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M4 6h16M4 12h16M4 18h16"
//               />
//             </svg>
//           </button>
//         )}
//         <h1 className="font-heading font-bold text-xl tracking-tight truncate">
//           {title}
//         </h1>
//       </div>

//       {rightSlot}
//     </header>
//   );
// }

"use client";

import type { ReactNode } from "react";
import { NotificationBell } from "@/components/features/notifications/NotificationBell";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export function Header({ title, onMenuClick, onBack, rightSlot }: HeaderProps) {
  return (
    <header className="bg-white sticky top-0 z-20 px-5 py-4 flex justify-between items-center shadow-sm pt-safe">
      <div className="flex items-center gap-4 min-w-0">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="p-1.5 -m-1.5 text-font-main-sub hover:text-brand-yellow-lg transition-colors shrink-0"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="lg:hidden p-1.5 -m-1.5 text-font-main-sub hover:text-brand-yellow-lg transition-colors shrink-0"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        <h1 className="font-heading font-bold text-xl tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightSlot}
        <NotificationBell />
      </div>
    </header>
  );
}
