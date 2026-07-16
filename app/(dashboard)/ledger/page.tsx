"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/ui/Pagination";
import { LedgerListItem } from "@/components/features/ledger/LedgerListItem";
import { useSidebar } from "@/context/SidebarContext";
import { MOCK_LEDGER } from "@/lib/mockData";

export default function LedgerPage() {
  const { openSidebar } = useSidebar();
  const [entries] = useState(MOCK_LEDGER);

  return (
    <>
      <Header
        title="Ledger"
        onMenuClick={openSidebar}
        rightSlot={
          <button className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-600 hover:text-brand-secondary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <LedgerListItem key={entry.id} entry={entry} highlighted={i === 1} />
          ))}
        </div>

        <Pagination rangeLabel="1-10 of 171" hasNext />
        <div className="h-6" />
      </main>
    </>
  );
}
