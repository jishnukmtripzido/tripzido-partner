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
import { SuspendedNotice } from "@/components/ui/SuspendedNotice";
import { useVendorStatus } from "@/hooks/useVendorStatus";

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
    brand: listing.brand,
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
  const { isSuspended } = useVendorStatus();
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

  const vehicles =
    data?.pages.flatMap((page) => page.results.map(toVehicle)) ?? [];
  const hasNext = hasNextPage ?? false;
  const total = data?.pages[0]?.pagination.total;

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
              results: page.results.filter((v) => String(v.id) !== vehicleId),
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
          !isSuspended && (
          <button
            onClick={() => router.push("/fleet/listing/new" as Route)}
            className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
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
            Add bike
          </button>
          )
        }
      />

      <div className="flex gap-2 overflow-x-auto hide-scrollbar bg-brand-bg px-5 pb-2 pt-4 lg:px-8 lg:pt-6">
        {FLEET_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`shrink-0 px-5 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-200 shadow-sm ${
              tab === t.key
                ? "bg-brand-secondary text-brand-yellow"
                : "bg-white text-font-dim hover:bg-gray-100 active:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isInitialLoad ? (
        <PageLoader />
      ) : (
        <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pb-6 pt-3 lg:px-8">
          {isSuspended && <SuspendedNotice className="mb-3" />}
          {total != null && total > 0 && (
            <p className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
              {total} {tab} bike{total === 1 ? "" : "s"}
            </p>
          )}
          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-4 lg:items-start lg:content-start">
            {vehicles.map((vehicle) => (
              <VehicleListItem
                key={vehicle.id}
                vehicle={vehicle}
                onClick={() =>
                  router.push(`/fleet/listing?id=${vehicle.id}` as Route)
                }
                onToggleActive={isSuspended ? undefined : handleToggleActive}
              />
            ))}
          </div>

          {vehicles.length === 0 && !isLoading && !error && (
            <div className="bg-white rounded-2xl shadow-sm px-6 py-10 mt-2 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-xl bg-gray-100 text-font-dim flex items-center justify-center mb-3">
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-font-main-sub">
                {tab === "active" ? "No active bikes yet" : "No inactive bikes"}
              </p>
              <p className="text-xs text-font-dim mt-1">
                {tab === "active"
                  ? "List your first vehicle to start getting bookings."
                  : "Bikes that are paused, pending, or rejected show up here."}
              </p>
              {tab === "active" && !isSuspended && (
                <button
                  onClick={() => router.push("/fleet/listing/new" as Route)}
                  className="mt-4 px-4 py-2.5 rounded-xl bg-brand-yellow-lg text-brand-secondary text-sm font-semibold hover:bg-brand-yellow active:bg-brand-yellow transition-colors"
                >
                  Add your first bike
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mt-2 text-center">
              <p className="text-sm text-red-500 font-medium">
                {error instanceof Error
                  ? error.message
                  : "Failed to load fleet"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 rounded-xl bg-brand-secondary text-brand-yellow text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Retry
              </button>
            </div>
          )}
          {(isLoading || isFetchingNextPage) && !error && <InlineLoader />}
          {!hasNext && !error && vehicles.length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70 text-center mt-6">
              That&apos;s all your {tab} bikes
            </p>
          )}

          <div ref={sentinelRef} className="h-1" />
          <div className="h-6" />
        </main>
      )}
    </>
  );
}
