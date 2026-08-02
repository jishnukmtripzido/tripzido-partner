"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { VehicleListItem } from "@/components/features/fleet/VehicleListItem";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { getFleetApi, type FleetListing } from "@/services/fleet.service";
import type { Vehicle } from "@/types/fleet.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

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
  };
}

export default function FleetPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const nextPageRef = useRef(1);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const loadNextPage = useCallback(async () => {
    if (!token || isLoading || !hasNext) return;
    const pageToLoad = nextPageRef.current;
    if (loadedPagesRef.current.has(pageToLoad)) return;
    loadedPagesRef.current.add(pageToLoad);

    setIsLoading(true);
    setError(null);
    try {
      const res = await getFleetApi(pageToLoad, token);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load fleet");
        setHasNext(false);
        loadedPagesRef.current.delete(pageToLoad);
        return;
      }
      setVehicles((prev) => [...prev, ...res.data!.results.map(toVehicle)]);
      setHasNext(res.data.pagination.next !== null);
      nextPageRef.current = pageToLoad + 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fleet");
      setHasNext(false);
      loadedPagesRef.current.delete(pageToLoad);
    } finally {
      setIsLoading(false);
    }
  }, [token, isLoading, hasNext]);

  useEffect(() => {
    if (token) loadNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  const isInitialLoad = isLoading && vehicles.length === 0 && !error;

  return (
    <>
      <Header
        title="Bikes"
        onMenuClick={openSidebar}
        rightSlot={
          <button
            onClick={() => router.push("/fleet/listing/new" as Route)}
            className="flex items-center gap-1 bg-brand-yellow text-brand-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors"
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

      {isInitialLoad ? (
        <PageLoader />
      ) : (
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <VehicleListItem
                key={vehicle.id}
                vehicle={vehicle}
                onClick={() =>
                  router.push(`/fleet/listing?id=${vehicle.id}` as Route)
                }
              />
            ))}
          </div>

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
