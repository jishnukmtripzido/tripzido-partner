"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/ui/Pagination";
import { VehicleListItem } from "@/components/features/fleet/VehicleListItem";
import { useSidebar } from "@/context/SidebarContext";
import { MOCK_VEHICLES } from "@/lib/mockData";

export default function FleetPage() {
  const { openSidebar } = useSidebar();
  const [vehicles] = useState(MOCK_VEHICLES);

  return (
    <>
      <Header
        title="Bikes"
        onMenuClick={openSidebar}
        rightSlot={
          <button className="flex items-center gap-1 bg-brand-yellow text-brand-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            ADD BIKE
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <VehicleListItem key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        <Pagination rangeLabel={`1-${vehicles.length} of ${vehicles.length}`} />
        <div className="h-6" />
      </main>
    </>
  );
}
