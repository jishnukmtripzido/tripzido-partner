"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { LedgerListItem } from "@/components/features/ledger/LedgerListItem";
import { getVendorPayoutsApi } from "@/services/payment.service";
import type { VendorPayout } from "@/types/ledger.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

export default function LedgerPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();

  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const nextPageRef = useRef(1);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const loadNextPage = useCallback(async () => {
    if (!token || isLoading || !hasNext) return;
    const page = nextPageRef.current;
    if (loadedPagesRef.current.has(page)) return;
    loadedPagesRef.current.add(page);

    setIsLoading(true);
    setError(null);
    try {
      const res = await getVendorPayoutsApi(page, token);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load ledger");
        setHasNext(false);
        loadedPagesRef.current.delete(page);
        return;
      }
      setPayouts((prev) => [...prev, ...res.data!.results]);
      setHasNext(res.data.pagination.next !== null);
      nextPageRef.current = page + 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger");
      setHasNext(false);
      loadedPagesRef.current.delete(page);
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

  const isInitialLoad = isLoading && payouts.length === 0 && !error;

  return (
    <>
      <Header
        title="Ledger"
        onMenuClick={openSidebar}
        rightSlot={
          // Decorative for now — no filter functionality wired yet,
          // same "button first, behavior later" pattern used earlier
          // for Add Bike / Offline Booking before those were built out.
          <button className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-600 hover:text-brand-secondary transition-colors">
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
          </button>
        }
      />

      {isInitialLoad ? (
        <PageLoader />
      ) : (
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
          <div className="space-y-4">
            {payouts.map((payout) => (
              <LedgerListItem
                key={payout.id}
                entry={payout}
                onClick={() =>
                  router.push(`/ledger/detail?id=${payout.id}` as Route)
                }
              />
            ))}
          </div>

          {payouts.length === 0 && !isLoading && !error && (
            <p className="text-sm text-font-dim text-center mt-10">
              No payouts yet.
            </p>
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
          {!hasNext && !error && payouts.length > 0 && (
            <p className="text-xs text-font-dim text-center mt-4">
              {payouts.length} payout(s)
            </p>
          )}

          <div ref={sentinelRef} className="h-1" />
          <div className="h-6" />
        </main>
      )}
    </>
  );
}
