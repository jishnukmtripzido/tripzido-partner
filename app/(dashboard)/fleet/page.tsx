"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

  const [tab, setTab] = useState<FleetTab>("active");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const nextPageRef = useRef(2); // page 1 is always handled by the tab effect below
  const loadedPagesRef = useRef<Set<string>>(new Set());

  // Synchronous, non-state guard against overlapping fetches. isLoading
  // (React state) can't be used for this: setIsLoading(true) only takes
  // effect on the NEXT render, so any effect or callback that reads it
  // in the same commit still sees the stale value. That's exactly what
  // let a fresh mount (empty list -> sentinel already in view ->
  // IntersectionObserver fires immediately) launch a page=2 request
  // concurrently with the page=1 request the tab-change effect had
  // just kicked off. A ref updates immediately, closing that window.
  const isFetchingRef = useRef(false);

  // Runs on every tab change (and on mount). Resets everything AND
  // fetches page 1 directly, in one effect.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    setVehicles([]);
    setHasNext(true);
    setError(null);
    nextPageRef.current = 2;
    loadedPagesRef.current.clear();
    loadedPagesRef.current.add(`${tab}:1`);
    isFetchingRef.current = true; // set BEFORE any other effect can run

    (async () => {
      setIsLoading(true);
      try {
        const res = await getFleetApi(1, token, tab);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load fleet");
          setHasNext(false);
          return;
        }
        setVehicles(res.data.results.map(toVehicle));
        setHasNext(res.data.pagination.next !== null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load fleet");
          setHasNext(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
        isFetchingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, token]);

  // Page 2+ only, triggered by scroll — page 1 is never reached here.
  const loadNextPage = useCallback(async () => {
    if (!token || isFetchingRef.current || !hasNext) return;
    const page = nextPageRef.current;
    const key = `${tab}:${page}`;
    if (loadedPagesRef.current.has(key)) return;
    loadedPagesRef.current.add(key);

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getFleetApi(page, token, tab);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load fleet");
        setHasNext(false);
        loadedPagesRef.current.delete(key);
        return;
      }
      setVehicles((prev) => [...prev, ...res.data!.results.map(toVehicle)]);
      setHasNext(res.data.pagination.next !== null);
      nextPageRef.current = page + 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fleet");
      setHasNext(false);
      loadedPagesRef.current.delete(key);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [token, hasNext, tab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNextPage();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadNextPage]);

  function handleRetry() {
    setError(null);
    setHasNext(true);
    loadNextPage();
  }

  async function handleToggleActive(vehicleId: string) {
    if (!token) return { success: false, message: "Not signed in" };
    try {
      const res = await toggleListingActiveApi(vehicleId, token);
      if (!res.success || !res.data) {
        return { success: false, message: res.message };
      }
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
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
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-semibold text-brand-yellow-lg"
              >
                Retry
              </button>
            </div>
          )}
          {isLoading && !error && <InlineLoader />}
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
