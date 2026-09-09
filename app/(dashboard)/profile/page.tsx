// "use client";

// import { Header } from "@/components/layout/Header";
// import { useSidebar } from "@/context/SidebarContext";
// import { useAuth } from "@/context/AuthContext";

// // Placeholder — no profile mockup was provided yet. Swap this body
// // out once you share the Profile screen design.
// export default function ProfilePage() {
//   const { openSidebar } = useSidebar();
//   const { user, logout } = useAuth();

//   return (
//     <>
//       <Header title="Profile" onMenuClick={openSidebar} />
//       <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
//         <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 mb-4">
//           <div className="w-14 h-14 rounded-full bg-brand-yellow/20 text-brand-secondary flex items-center justify-center  font-bold text-xl">
//             {user?.first_name?.[0]?.toUpperCase() ?? "P"}
//           </div>
//           <div>
//             <p className=" font-bold text-base">
//               {user
//                 ? `${user.first_name} ${user.last_name ?? ""}`.trim()
//                 : "Partner"}
//             </p>
//             <p className="text-xs text-font-dim">{user?.phone_number}</p>
//           </div>
//         </div>

//         <button
//           onClick={logout}
//           className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-sm font-semibold text-red-500 text-center"
//         >
//           Log out
//         </button>
//       </main>
//     </>
//   );
// }

// app/(dashboard)/profile/page.tsx
"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { openSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <>
      <Header title="Profile" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-brand-yellow/20 text-brand-secondary flex items-center justify-center  font-bold text-xl">
            {user?.first_name?.[0]?.toUpperCase() ?? "P"}
          </div>
          <div>
            <p className=" font-bold text-base">
              {user
                ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                : "Partner"}
            </p>
            <p className="text-xs text-font-dim">{user?.phone_number}</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/profile/vendor-details" as Route)}
          className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-brand-yellow hover:shadow-md transition-all duration-300 flex items-center gap-4 group mb-4"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-yellow/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-brand-yellow/20">
            <svg
              className="w-5 h-5 text-brand-yellow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M5 21H3m16 0h-5m-6 0h6M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v-3a1 1 0 011-1h0a1 1 0 011 1v3"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-gray-900 text-[15px]">
              Vendor Details
            </h3>
            <p className="text-[12px] font-medium text-gray-500 mt-0.5">
              Your business profile & account status
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-300 shrink-0 transition-colors duration-300 group-hover:text-brand-yellow-lg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <button
          onClick={logout}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-sm font-semibold text-red-500 text-center"
        >
          Log out
        </button>
      </main>
    </>
  );
}
