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

const STOREFRONT_PATH =
  "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4";

function mapsHref(p: PickupPoint): string | null {
  if (p.google_maps_link) return p.google_maps_link;
  if (p.latitude != null && p.longitude != null)
    return `https://www.google.com/maps?q=${p.latitude},${p.longitude}`;
  return null;
}

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
    refetch,
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

  // Sidebar-style sections, one per pickup area, in first-seen order.
  const groups: { area: string; points: PickupPoint[] }[] = [];
  for (const p of points) {
    const area = p.pickup_location_name || "Other";
    const group = groups.find((g) => g.area === area);
    if (group) group.points.push(p);
    else groups.push({ area, points: [p] });
  }

  return (
    <>
      <Header
        title="Pickup Points"
        onBack={() => router.back()}
        rightSlot={
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-8 lg:pt-7">
        {loading && <PageLoader />}

        {error && (
          <div className="mt-2 rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-red-500">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-yellow hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && points.length === 0 && (
          <div className="mt-2 flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={STOREFRONT_PATH}
                />
              </svg>
            </span>
            <p className="text-sm font-semibold text-font-main-sub">
              No pickup points yet
            </p>
            <p className="mt-1 text-xs text-font-dim">
              Add the exact address and contact numbers where customers
              collect your bikes.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 rounded-xl bg-brand-secondary px-4 py-2.5 text-sm font-semibold text-brand-yellow hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Add pickup point
            </button>
          </div>
        )}

        {!loading && !error && points.length > 0 && (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.area}>
                <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                  {group.area} · {group.points.length}
                </h2>
                <div className="space-y-2.5 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                  {group.points.map((p) => (
                    <PickupPointCard
                      key={p.id}
                      point={p}
                      onEdit={() =>
                        router.push(
                          `/settings/pickup-points/edit?id=${p.id}` as Route,
                        )
                      }
                      onDelete={() => {
                        deleteMutation.reset();
                        setDeleteTarget(p);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
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

function PickupPointCard({
  point,
  onEdit,
  onDelete,
}: {
  point: PickupPoint;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const href = mapsHref(point);
  const [firstNumber, ...otherNumbers] = point.contact_numbers;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex gap-3 p-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/30 text-brand-secondary">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={STOREFRONT_PATH}
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[15px] font-bold text-font-main-sub">
            {point.label || "Pickup point"}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-font-dim line-clamp-2">
            {point.address}
          </p>
          {firstNumber && (
            <p className="mt-1.5 truncate text-xs font-medium text-font-main-sub">
              {firstNumber}
              {otherNumbers.length > 0 && (
                <span className="text-font-dim">
                  {" "}
                  · {otherNumbers.join(" · ")}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
        <CardAction
          label="Map"
          href={href ?? undefined}
          external
          icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
        <CardAction
          label="Edit"
          onClick={onEdit}
          icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
        <CardAction
          label="Delete"
          onClick={onDelete}
          danger
          icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </div>
    </article>
  );
}

/**
 * One cell of the card's bottom action bar. Renders a link when given
 * `href`, a button when given `onClick`, and a disabled cell when
 * neither is available (e.g. no map pin set).
 */
function CardAction({
  label,
  icon,
  href,
  external = false,
  onClick,
  danger = false,
}: {
  label: string;
  icon: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  danger?: boolean;
}) {
  const className = `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
    danger
      ? "text-red-600 hover:bg-red-50 active:bg-red-50"
      : "text-font-main-sub hover:bg-gray-50 active:bg-gray-50"
  }`;
  const content = (
    <>
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={icon}
        />
      </svg>
      {label}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return (
    <span
      aria-disabled="true"
      className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-gray-300"
      title={`${label} unavailable`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={icon}
        />
      </svg>
      {label}
    </span>
  );
}
