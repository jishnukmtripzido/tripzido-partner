"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";

export default function SettingsPage() {
  const { openSidebar } = useSidebar();
  const router = useRouter();

  return (
    <>
      <Header title="Settings" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-3">
        <button
          onClick={() => router.push("/settings/terms" as Route)}
          className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
        >
          <div>
            <h3 className="font-heading font-bold text-font-main-sub text-base">
              Terms &amp; Conditions
            </h3>
            <p className="text-xs text-font-dim mt-0.5">
              Shown to customers on every listing
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <button
          onClick={() => router.push("/settings/schedule-templates" as Route)}
          className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
        >
          <div>
            <h3 className="font-heading font-bold text-font-main-sub text-base">
              Schedule Templates
            </h3>
            <p className="text-xs text-font-dim mt-0.5">
              Reusable weekly hours for your listings
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </main>
    </>
  );
}
