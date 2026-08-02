"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getPickupPointsApi,
  deletePickupPointApi,
} from "@/services/fleet.service";
import { saveReturnTo } from "@/lib/listingDraft";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/PageLoader";
import type { PickupPoint } from "@/types/listing-create.types";

export default function PickupPointsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PickupPoint | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPickupPointsApi(token);
        if (!cancelled) {
          if (res.success && res.data) setPoints(res.data);
          else setError(res.message || "Failed to load pickup points");
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleCreateNew() {
    saveReturnTo("/settings/pickup-points");
    router.push("/fleet/pickup-points/new" as Route);
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deletePickupPointApi(deleteTarget.id, token);
      if (!res.success) {
        setDeleteError(res.message || "Failed to delete");
        return;
      }
      setPoints((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

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
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-3">
        {loading && <PageLoader />}
        {error && (
          <p className="text-sm text-red-500 text-center mt-10">{error}</p>
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
              <h3 className="font-heading font-bold text-font-main-sub text-base">
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
                    setDeleteError(null);
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
          submitting={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
