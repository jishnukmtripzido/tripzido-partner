"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";

export default function SettingsPage() {
  const { openSidebar } = useSidebar();
  const router = useRouter();

  return (
    <div className="bg-[#F4F2EE] min-h-screen flex flex-col">
      <Header title="Settings" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-8 space-y-3.5">
        <SettingsCard
          onClick={() => router.push("/settings/terms" as Route)}
          title="Terms & Conditions"
          subtitle="Shown to customers on every listing"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          }
        />

        <SettingsCard
          onClick={() => router.push("/settings/schedule-templates" as Route)}
          title="Schedule Templates"
          subtitle="Reusable weekly hours for your listings"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          }
        />

        <SettingsCard
          onClick={() => router.push("/settings/pickup-points" as Route)}
          title="Pickup Points"
          subtitle="Exact addresses & contacts for your listings"
          icon={
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </>
          }
        />
      </main>
    </div>
  );
}

function SettingsCard({
  onClick,
  title,
  subtitle,
  icon,
}: {
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-[1.25rem] p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 hover:border-[#FFD166]/60 hover:shadow-md transition-all duration-300 flex items-center gap-4 group"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FFF6E0] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#FFD166]/20">
        <svg
          className="w-6 h-6 text-[#D4A33B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className=" font-bold text-gray-900 text-[15px]">{title}</h3>
        <p className="text-[12px] font-medium text-gray-500 mt-0.5">
          {subtitle}
        </p>
      </div>
      <ChevronIcon />
    </button>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-300 shrink-0 transition-colors duration-300 group-hover:text-[#FFD166]"
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
  );
}
