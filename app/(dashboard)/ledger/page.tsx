"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { LedgerListItem } from "@/components/features/ledger/LedgerListItem";
import { getVendorPayoutsApi } from "@/services/payment.service";
import { queryKeys } from "@/lib/queryKeys";
import type { VendorPayout } from "@/types/ledger.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";
import { useMountTransition } from "@/hooks/useMountTransition";

type StatusFilter = "all" | VendorPayout["status"];

const FILTER_OPTIONS: {
  value: StatusFilter;
  label: string;
  hint: string;
  tile: string;
}[] = [
  {
    value: "all",
    label: "All payouts",
    hint: "Every payout to your account",
    tile: "bg-gray-100 text-font-dim",
  },
  {
    value: "PAID",
    label: "Paid",
    hint: "Sent to your bank",
    tile: "bg-green-100 text-green-700",
  },
  {
    value: "PENDING",
    label: "Pending",
    hint: "Being processed",
    tile: "bg-brand-yellow-lg text-brand-secondary",
  },
  {
    value: "FAILED",
    label: "Failed",
    hint: "Transfer didn't go through",
    tile: "bg-red-100 text-red-700",
  },
];

// Sidebar-style section heading per month, keyed on when the payout was
// paid (or created, while it's still pending).
function monthLabel(payout: VendorPayout): string {
  return new Date(payout.paid_at ?? payout.created_at).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" },
  );
}

export default function LedgerPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const activeOption =
    FILTER_OPTIONS.find((o) => o.value === statusFilter) ?? FILTER_OPTIONS[0];

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.ledger.list(token, statusFilter),
    queryFn: async ({ pageParam }) => {
      const res = await getVendorPayoutsApi(
        pageParam,
        token as string,
        statusFilter,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load ledger");
      }
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.next ? lastPage.pagination.page + 1 : undefined,
    enabled: !!token,
  });

  // The backend filters by status; this client-side pass is only a
  // safety net so an older backend that ignores ?status= can never
  // show, say, a pending payout under the "Paid" filter.
  const payouts = (data?.pages.flatMap((page) => page.results) ?? []).filter(
    (p) => statusFilter === "all" || p.status === statusFilter,
  );
  const hasNext = hasNextPage ?? false;
  const total = data?.pages[0]?.pagination.total;

  // Preserve the API's order (newest first) while grouping by month.
  const groups: { title: string; payouts: VendorPayout[] }[] = [];
  for (const payout of payouts) {
    const title = monthLabel(payout);
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.payouts.push(payout);
    else groups.push({ title, payouts: [payout] });
  }

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

  const isInitialLoad = isLoading && payouts.length === 0 && !error;

  return (
    <>
      <Header
        title="Ledger"
        onMenuClick={openSidebar}
        rightSlot={
          <button
            onClick={() => setFilterOpen(true)}
            aria-label={
              statusFilter === "all"
                ? "Filter payouts"
                : `Filter payouts (showing ${activeOption.label})`
            }
            aria-haspopup="dialog"
            className={`relative p-2 rounded-lg border transition-colors ${
              statusFilter === "all"
                ? "bg-gray-50 border-gray-100 text-gray-600 hover:text-brand-secondary"
                : "bg-brand-secondary border-brand-secondary text-brand-yellow"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {statusFilter !== "all" && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-yellow-lg border-2 border-white" />
            )}
          </button>
        }
      />

      {isInitialLoad ? (
        <PageLoader />
      ) : (
        <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-6">
          {statusFilter !== "all" && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-font-dim">Showing</span>
              <button
                onClick={() => setStatusFilter("all")}
                aria-label={`Clear ${activeOption.label} filter`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-secondary pl-3 pr-2 py-1.5 text-xs font-semibold text-brand-yellow active:opacity-80 transition-opacity"
              >
                {activeOption.label}
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {total != null && total > 0 && (
            <p className="px-1 mb-4 text-xs text-font-dim">
              {statusFilter === "all"
                ? `${total} payout${total === 1 ? "" : "s"} to your bank account.`
                : `${total} ${activeOption.label.toLowerCase()} payout${total === 1 ? "" : "s"}.`}{" "}
              Tap one to see the bookings it covers.
            </p>
          )}

          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.title}>
                <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                  {group.title}
                </h2>
                <div className="space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3">
                  {group.payouts.map((payout) => (
                    <LedgerListItem
                      key={payout.id}
                      entry={payout}
                      onClick={() =>
                        router.push(`/ledger/detail?id=${payout.id}` as Route)
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {payouts.length === 0 && !isLoading && !error && (
            <div className="bg-white rounded-2xl shadow-sm px-6 py-10 flex flex-col items-center text-center">
              <span className="h-12 w-12 rounded-xl bg-gray-100 text-font-dim flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"
                  />
                </svg>
              </span>
              <p className="text-sm font-semibold text-font-main-sub">
                {statusFilter === "all"
                  ? "No payouts yet"
                  : `No ${activeOption.label.toLowerCase()} payouts`}
              </p>
              <p className="text-xs text-font-dim mt-1">
                {statusFilter === "all"
                  ? "Payouts for completed bookings will show up here once they're sent to your bank."
                  : "Try another status, or show all payouts."}
              </p>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="mt-4 px-4 py-2.5 rounded-xl bg-brand-yellow-lg text-brand-secondary text-sm font-semibold active:bg-brand-yellow transition-colors"
                >
                  Show all payouts
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mt-2 text-center">
              <p className="text-sm text-red-500 font-medium">
                {error instanceof Error ? error.message : "Failed to load ledger"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 rounded-xl bg-brand-secondary text-brand-yellow text-sm font-semibold active:opacity-80 transition-opacity"
              >
                Retry
              </button>
            </div>
          )}
          {(isLoading || isFetchingNextPage) && !error && <InlineLoader />}
          {!hasNext && !error && payouts.length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70 text-center mt-6">
              That&apos;s all your payouts
            </p>
          )}

          <div ref={sentinelRef} className="h-1" />
          <div className="h-6" />
        </main>
      )}

      <FilterSheet
        open={filterOpen}
        value={statusFilter}
        onClose={() => setFilterOpen(false)}
        onSelect={(value) => {
          setStatusFilter(value);
          setFilterOpen(false);
        }}
      />
    </>
  );
}

/**
 * Bottom sheet opened from the header's filter icon. Options are
 * sidebar-style rows; picking one applies it immediately.
 */
function FilterSheet({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: StatusFilter;
  onClose: () => void;
  onSelect: (value: StatusFilter) => void;
}) {
  const { shouldRender, phase } = useMountTransition(open, 250);
  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        onClick={onClose}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter payouts"
        className={`modal-panel modal-panel-${phase} relative mt-auto w-full rounded-t-3xl bg-brand-bg px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]`}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <h2 className="font-heading text-lg font-bold text-font-main-sub">
              Filter payouts
            </h2>
            <p className="text-xs text-font-dim">Show payouts by status</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-font-main-sub shadow-sm active:bg-gray-100"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="rounded-2xl bg-white p-1.5 shadow-sm space-y-0.5">
          {FILTER_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                aria-pressed={selected}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                  selected ? "bg-brand-yellow/25" : "active:bg-gray-100"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${option.tile}`}
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
                      d="M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"
                    />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-font-main-sub">
                    {option.label}
                  </span>
                  <span className="block text-xs text-font-dim">
                    {option.hint}
                  </span>
                </span>
                {selected && (
                  <svg
                    className="h-5 w-5 shrink-0 text-brand-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
