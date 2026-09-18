"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getPickupPointsApi,
  deletePickupPointApi,
} from "@/services/fleet.service";
import { saveReturnTo } from "@/lib/listingDraft";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import type { PickupPoint } from "@/types/listing-create.types";

export default function PickupPointsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<PickupPoint | null>(null);

  const queryKey = queryKeys.settings.pickupPoints(token);
  const {
    data: points = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getPickupPointsApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load pickup points");
      }
      return res.data;
    },
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (point: PickupPoint) => {
      const res = await deletePickupPointApi(point.id, token as string);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete");
      }
      return point;
    },
    onSuccess: (point) => {
      queryClient.setQueryData<PickupPoint[]>(queryKey, (prev) =>
        prev?.filter((p) => p.id !== point.id),
      );
      // Same backend resource (/api/vehicles/vendor/pickup-points/) is
      // also read by the fleet feature's listing forms — invalidate
      // that cache entry too so it doesn't keep showing a deleted point.
      queryClient.invalidateQueries({
        queryKey: queryKeys.fleet.pickupPoints(token),
      });
      setDeleteTarget(null);
    },
  });

  function handleCreateNew() {
    saveReturnTo("/settings/pickup-points");
    router.push("/fleet/pickup-points/new" as Route);
  }

  const deleteError =
    deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : null;

  return (
    <>
      <Header
        title="Pickup Points"
        onBack={() => router.back()}
        rightSlot={
          <button
            onClick={handleCreateNew}
            className="text-sm font-bold text-brand-secondary bg-brand-yellow px-3 py-1.5 rounded-lg hover:bg-brand-yellow-lg transition-colors"
          >
            + New
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start lg:content-start">
        {loading && <PageLoader />}
        {error && (
          <p className="text-sm text-red-500 text-center mt-10">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        )}
        {!loading && !error && points.length === 0 && (
          <p className="text-sm text-font-dim text-center mt-10">
            No pickup points yet.
          </p>
        )}

        {points.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <h3 className=" font-bold text-font-main-sub text-base">
                {p.label || p.pickup_location_name || "Pickup point"}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/settings/pickup-points/edit?id=${p.id}` as Route,
                    )
                  }
                  className="text-xs font-bold text-brand-yellow-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    deleteMutation.reset();
                    setDeleteTarget(p);
                  }}
                  className="text-xs font-bold text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-xs text-font-dim mt-1">{p.address}</p>
            <p className="text-xs text-font-dim mt-1">
              {p.contact_numbers.join(", ")}
            </p>
          </div>
        ))}
      </main>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this pickup point?"
          message="Listings using this pickup point will keep working but lose this exact-address reference. This can't be undone."
          confirmLabel="Delete"
          destructive
          submitting={deleteMutation.isPending}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget)}
        />
      )}
    </>
  );
}
