"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { BookingListCard } from "@/components/features/bookings/BookingListCard";
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Search box slides away once the list is scrolled and only comes
  // back at the very top. The search + filter row is an overlay that
  // moves with a GPU transform — the list underneath never changes
  // size, so nothing reflows mid-animation and the motion stays smooth.
  const [searchHidden, setSearchHidden] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const searchBlockRef = useRef<HTMLDivElement | null>(null);
  const [overlayHeight, setOverlayHeight] = useState(0);
  const [searchHeight, setSearchHeight] = useState(0);

  // Measured (and re-measured on resize, e.g. font load or rotation)
  // before paint, so the list's top padding always matches the overlay.
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const search = searchBlockRef.current;
    if (!overlay || !search) return;
    const measure = () => {
      setOverlayHeight(overlay.offsetHeight);
      setSearchHeight(search.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(overlay);
    observer.observe(search);
    return () => observer.disconnect();
  }, []);

  function handleListScroll(e: React.UIEvent<HTMLElement>) {
    const el = e.currentTarget;
    if (el.scrollTop <= 4) {
      setSearchHidden(false);
    } else if (
      el.scrollTop > 16 &&
      // Never hide it while the vendor is typing in it.
      document.activeElement !== searchInputRef.current
    ) {
      setSearchHidden(true);
    }
  }

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
      <Header title="Bookings" onMenuClick={openSidebar} />

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          ref={overlayRef}
          className="absolute inset-x-0 top-0 z-10 bg-brand-bg will-change-transform transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translate3d(0, ${searchHidden ? -searchHeight : 0}px, 0)`,
          }}
        >
          <div
            ref={searchBlockRef}
            aria-hidden={searchHidden}
            className={`px-5 pt-4 lg:px-8 lg:pt-6 transition-opacity duration-300 ease-out ${
              searchHidden ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="relative lg:max-w-xl">
              <svg
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-font-dim"
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
                ref={searchInputRef}
                type="text"
                tabIndex={searchHidden ? -1 : undefined}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search bookings"
                placeholder="Search name, phone, bike or ref"
                className="w-full bg-white border-2 border-transparent rounded-2xl pl-11 pr-11 py-3 text-sm font-medium text-font-main-sub placeholder:text-font-dim/70 shadow-sm focus:outline-none focus:border-brand-yellow transition-colors"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gray-100 text-font-dim flex items-center justify-center hover:bg-gray-200 active:bg-gray-200"
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

          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 pt-3 pb-2 lg:px-8">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-200 shadow-sm ${
                  tab === t.key
                    ? "bg-brand-secondary text-brand-yellow"
                    : "bg-white text-font-dim hover:bg-gray-100 active:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Soft fade so cards slide under the filter row instead of
              being cut off by a hard edge. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full h-4 bg-linear-to-b from-brand-bg to-transparent"
          />
        </div>

        {isInitialLoad ? (
          <div className="h-full flex flex-col" style={{ paddingTop: overlayHeight }}>
            <PageLoader />
          </div>
        ) : (
          <main
            onScroll={handleListScroll}
            className="h-full overflow-y-auto hide-scrollbar px-5 pb-6 lg:px-8"
            style={{ paddingTop: overlayHeight + 12 }}
          >
            <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-4 lg:items-start lg:content-start">
              {bookings.map((booking) => (
                <BookingListCard
                  key={booking.id}
                  booking={booking}
                  onClick={() =>
                    router.push(`/bookings/detail?id=${booking.id}` as Route)
                  }
                />
              ))}
            </div>

            {bookings.length === 0 && !isLoading && !error && (
              <div className="bg-white rounded-2xl shadow-sm px-6 py-10 mt-2 flex flex-col items-center text-center">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <p className="text-sm font-semibold text-font-main-sub">
                  {debouncedSearch ? "No matching bookings" : "No bookings here yet"}
                </p>
                <p className="text-xs text-font-dim mt-1">
                  {debouncedSearch
                    ? "Try a different reference, name, phone or vehicle."
                    : "Bookings in this category will show up here."}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-white rounded-2xl shadow-sm p-4 mt-2 text-center">
                <p className="text-sm text-red-500 font-medium">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load bookings"}
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
            {!hasNext && !error && bookings.length > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70 text-center mt-6">
                {bookings.length} booking(s)
              </p>
            )}

            <div ref={sentinelRef} className="h-1" />
            <div className="h-6" />
          </main>
        )}
      </div>
    </div>
  );
}
