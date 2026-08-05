"use client";

import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

// Placeholder — no profile mockup was provided yet. Swap this body
// out once you share the Profile screen design.
export default function ProfilePage() {
  const { openSidebar } = useSidebar();
  const { user, logout } = useAuth();

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
          onClick={logout}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-sm font-semibold text-red-500 text-center"
        >
          Log out
        </button>
      </main>
    </>
  );
}
