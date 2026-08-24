"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { CompactBookingCard } from "@/components/features/bookings/CompactBookingCard";
import { getVendorBookingsApi } from "@/services/booking.service";
import { FILTER_TABS } from "@/lib/bookingStatus";
import type { VendorBookingListItem } from "@/types/booking.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

export default function BookingsPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState("all");
  const [bookings, setBookings] = useState<VendorBookingListItem[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const nextPageRef = useRef(2); // page 1 is always handled by the tab effect below
  const loadedPagesRef = useRef<Set<string>>(new Set());

  // Runs on every tab change (and on mount). Resets everything AND
  // fetches page 1 directly, in one effect, so there's no separate
  // "reset" effect racing against a "fetch" effect with a stale
  // closure over hasNext/isLoading. Also clears loadedPagesRef
  // entirely — without this, revisiting a tab you'd already viewed
  // once would find its "tab:1" key still marked as loaded from the
  // earlier visit and skip fetching, which was the actual bug.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    setBookings([]);
    setHasNext(true);
    setError(null);
    nextPageRef.current = 2;
    loadedPagesRef.current.clear();
    loadedPagesRef.current.add(`${tab}:1`);

    (async () => {
      setIsLoading(true);
      try {
        const res = await getVendorBookingsApi(tab, 1, token);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load bookings");
          setHasNext(false);
          return;
        }
        setBookings(res.data.results);
        setHasNext(res.data.pagination.next !== null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load bookings",
          );
          setHasNext(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, token]);

  // Page 2+ only, triggered by scroll — page 1 is never reached here.
  const loadNextPage = useCallback(async () => {
    if (!token || isLoading || !hasNext) return;
    const page = nextPageRef.current;
    const key = `${tab}:${page}`;
    if (loadedPagesRef.current.has(key)) return;
    loadedPagesRef.current.add(key);

    setIsLoading(true);
    setError(null);
    try {
      const res = await getVendorBookingsApi(tab, page, token);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load bookings");
        setHasNext(false);
        loadedPagesRef.current.delete(key);
        return;
      }
      setBookings((prev) => [...prev, ...res.data!.results]);
      setHasNext(res.data.pagination.next !== null);
      nextPageRef.current = page + 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      setHasNext(false);
      loadedPagesRef.current.delete(key);
    } finally {
      setIsLoading(false);
    }
  }, [token, isLoading, hasNext, tab]);

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

  const isInitialLoad = isLoading && bookings.length === 0 && !error;

  return (
    <div className="bg-brand-bg min-h-screen flex flex-col">
      <Header
        title="Bookings"
        onMenuClick={openSidebar}
        rightSlot={
          <button className="flex items-center gap-1.5 bg-brand-yellow text-brand-secondary px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors">
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
            OFFLINE BOOKING
          </button>
        }
      />

      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-5 pt-4 pb-2">
        {FILTER_TABS.map((t) => (
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
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-3 pb-6">
          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] lg:gap-4 lg:items-start lg:content-start">
            {bookings.map((booking) => (
              <CompactBookingCard
                key={booking.id}
                booking={booking}
                variant="full"
                onClick={() =>
                  router.push(`/bookings/detail?id=${booking.id}` as Route)
                }
              />
            ))}
          </div>

          {bookings.length === 0 && !isLoading && !error && (
            <p className="text-sm text-gray-400 font-medium text-center mt-10">
              No bookings in this category yet.
            </p>
          )}

          {error && (
            <div className="text-center mt-6">
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-bold text-brand-yellow-lg hover:text-brand-secondary transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {isLoading && !error && <InlineLoader />}
          {!hasNext && !error && bookings.length > 0 && (
            <p className="text-xs text-gray-400 font-semibold text-center mt-6">
              {bookings.length} booking(s)
            </p>
          )}

          <div ref={sentinelRef} className="h-1" />
          <div className="h-6" />
        </main>
      )}
    </div>
  );
}
