"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { CompactBookingCard } from "@/components/features/bookings/CompactBookingCard";
import { getVendorBookingsApi } from "@/services/booking.service";
import { FILTER_TABS } from "@/lib/bookingStatus";
import { queryKeys } from "@/lib/queryKeys";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

export default function BookingsPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState("all");

  // Raw input updates instantly for a responsive box; debouncedSearch is
  // what actually drives the fetch, so we don't fire a request on every
  // keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.bookings.list(token, {
      status: tab,
      search: debouncedSearch,
    }),
    queryFn: async ({ pageParam }) => {
      const res = await getVendorBookingsApi(
        tab,
        pageParam,
        token as string,
        debouncedSearch,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load bookings");
      }
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.next ? lastPage.pagination.page + 1 : undefined,
    enabled: !!token,
  });

  const bookings = data?.pages.flatMap((page) => page.results) ?? [];
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

  const isInitialLoad = isLoading && bookings.length === 0 && !error;

  return (
    <div className="bg-brand-bg h-full flex flex-col">
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

      <div className="px-5 pt-4">
        <div className="relative">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by booking ref, customer name, phone, or vehicle"
            className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-9 py-2.5 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:border-brand-yellow"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-5 pt-3 pb-2">
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
              {debouncedSearch
                ? "No bookings match your search."
                : "No bookings in this category yet."}
            </p>
          )}

          {error && (
            <div className="text-center mt-6">
              <p className="text-sm text-red-500 font-medium">
                {error instanceof Error ? error.message : "Failed to load bookings"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm font-bold text-brand-yellow-lg hover:text-brand-secondary transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {(isLoading || isFetchingNextPage) && !error && <InlineLoader />}
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
