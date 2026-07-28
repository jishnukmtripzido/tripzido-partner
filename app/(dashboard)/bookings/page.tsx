"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { BookingListItem } from "@/components/features/bookings/BookingListItem";
import { ConfirmStatusChangeModal } from "@/components/features/bookings/ConfirmStatusChangeModal";
import {
  getVendorBookingsApi,
  updateVendorBookingStatusApi,
} from "@/services/booking.service";
import { FILTER_TABS } from "@/lib/bookingStatus";
import type {
  VendorBookingListItem,
  BookingStatus,
} from "@/types/booking.types";

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
  const nextPageRef = useRef(1);
  const loadedPagesRef = useRef<Set<string>>(new Set());

  const [actionTarget, setActionTarget] = useState<{
    bookingId: number;
    status: BookingStatus;
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // Reset pagination whenever the tab changes — a fresh status filter
  // is effectively a fresh list, not more pages of the old one.
  useEffect(() => {
    setBookings([]);
    setHasNext(true);
    setError(null);
    nextPageRef.current = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (token) loadNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

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

  function handleStatusAction(bookingId: number, target: BookingStatus) {
    setActionTarget({ bookingId, status: target });
    setActionError(null);
  }

  async function handleConfirmAction() {
    if (!actionTarget || !token) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      const res = await updateVendorBookingStatusApi(
        actionTarget.bookingId,
        actionTarget.status,
        token,
      );
      if (!res.success || !res.data) {
        setActionError(res.message || "Failed to update status");
        return;
      }
      const updated = res.data;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === updated.id
            ? {
                ...b,
                status: updated.status,
                status_label: updated.status_label,
                available_next_statuses: updated.available_next_statuses,
              }
            : b,
        ),
      );
      setActionTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Bookings"
        onMenuClick={openSidebar}
        rightSlot={
          // Decorative only, per request — no onClick, matches how
          // "Add Bike" looked before it was wired up.
          <button className="flex items-center gap-1 bg-brand-yellow text-brand-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors">
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

      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 pt-4 pb-2">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              tab === t.key
                ? "bg-brand-yellow text-brand-secondary"
                : "bg-gray-100 text-font-dim"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-2 pb-6">
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingListItem
              key={booking.id}
              booking={booking}
              onClick={() =>
                router.push(`/bookings/detail?id=${booking.id}` as Route)
              }
              onStatusAction={(target) =>
                handleStatusAction(booking.id, target)
              }
            />
          ))}
        </div>

        {bookings.length === 0 && !isLoading && !error && (
          <p className="text-sm text-font-dim text-center mt-10">
            No bookings in this category yet.
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
        {isLoading && !error && (
          <p className="text-sm text-font-dim text-center mt-4">Loading...</p>
        )}
        {!hasNext && !error && bookings.length > 0 && (
          <p className="text-xs text-font-dim text-center mt-4">
            {bookings.length} booking(s)
          </p>
        )}

        <div ref={sentinelRef} className="h-1" />
        <div className="h-6" />
      </main>

      {actionTarget && (
        <ConfirmStatusChangeModal
          targetStatus={actionTarget.status}
          submitting={actionSubmitting}
          error={actionError}
          onCancel={() => setActionTarget(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </>
  );
}
