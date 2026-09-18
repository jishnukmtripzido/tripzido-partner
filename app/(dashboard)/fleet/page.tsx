"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { VehicleListItem } from "@/components/features/fleet/VehicleListItem";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import {
  getFleetApi,
  toggleListingActiveApi,
  type FleetListing,
} from "@/services/fleet.service";
import { queryKeys } from "@/lib/queryKeys";
import type { Vehicle } from "@/types/fleet.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const FLEET_TABS = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

type FleetTab = (typeof FLEET_TABS)[number]["key"];

function toVehicleKind(vehicleType: string): Vehicle["kind"] {
  return vehicleType === "SCOOTER" ? "scooter" : "motorcycle";
}

function toVehicle(listing: FleetListing): Vehicle {
  return {
    id: String(listing.id),
    name: listing.name,
    quantity: listing.quantity,
    kind: toVehicleKind(listing.vehicle_type),
    imageUrl: listing.primary_image,
    locationName: listing.location_name,
    pickupPointLabel: listing.pickup_point_label ?? undefined,
    status: listing.status,
  };
}

export default function FleetPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<FleetTab>("active");

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const queryKey = queryKeys.fleet.list(token, { tab });

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await getFleetApi(pageParam, token as string, tab);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load fleet");
      }
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.next ? lastPage.pagination.page + 1 : undefined,
    enabled: !!token,
  });

  const vehicles = data?.pages.flatMap((page) => page.results.map(toVehicle)) ?? [];
  const hasNext = hasNextPage ?? false;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  async function handleToggleActive(vehicleId: string) {
    if (!token) return { success: false, message: "Not signed in" };
    try {
      const res = await toggleListingActiveApi(vehicleId, token);
      if (!res.success || !res.data) {
        return { success: false, message: res.message };
      }
      queryClient.setQueryData(
        queryKey,
        (prev: typeof data) =>
          prev && {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              results: page.results.filter(
                (v) => String(v.id) !== vehicleId,
              ),
            })),
          },
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to update status",
      };
    }
  }

  const isInitialLoad = isLoading && vehicles.length === 0 && !error;

  return (
    <>
      <Header
        title="Bikes"
        onMenuClick={openSidebar}
        rightSlot={
          <button
            onClick={() => router.push("/fleet/listing/new" as Route)}
            className="flex items-center gap-1.5 bg-brand-yellow text-brand-secondary px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            ADD BIKE
          </button>
        }
      />

      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-5 pt-4 pb-2 bg-brand-bg">
        {FLEET_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 border ${
              tab === t.key
                ? "bg-brand-yellow border-brand-yellow text-brand-secondary shadow-sm"
                : "bg-white border-gray-100 text-gray-500 shadow-sm hover:border-brand-yellow/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isInitialLoad ? (
        <PageLoader />
      ) : (
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-3 pb-6 bg-brand-bg">
          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] lg:gap-4 lg:items-start lg:content-start">
            {vehicles.map((vehicle) => (
              <VehicleListItem
                key={vehicle.id}
                vehicle={vehicle}
                onClick={() =>
                  router.push(`/fleet/listing?id=${vehicle.id}` as Route)
                }
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>

          {vehicles.length === 0 && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500">
                {tab === "active" ? "No active bikes yet" : "No inactive bikes"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {tab === "active"
                  ? 'Tap "Add Bike" to list your first vehicle.'
                  : "Bikes that are paused, pending, or rejected show up here."}
              </p>
            </div>
          )}

          {error && (
            <div className="text-center mt-4">
              <p className="text-sm text-red-500 font-medium">
                {error instanceof Error ? error.message : "Failed to load fleet"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm font-semibold text-brand-yellow-lg"
              >
                Retry
              </button>
            </div>
          )}
          {(isLoading || isFetchingNextPage) && !error && <InlineLoader />}
          {!hasNext && !error && vehicles.length > 0 && (
            <p className="text-xs text-font-dim text-center mt-4">
              {vehicles.length} of {vehicles.length} bikes
            </p>
          )}

          <div ref={sentinelRef} className="h-1" />
          <div className="h-6" />
        </main>
      )}
    </>
  );
}
