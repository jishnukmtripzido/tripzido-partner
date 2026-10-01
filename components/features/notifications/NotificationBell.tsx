"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { useMountTransition } from "@/hooks/useMountTransition";
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "@/services/notifications.service";
import { queryKeys } from "@/lib/queryKeys";
import { HEADER_ICON_BUTTON } from "@/components/layout/headerStyles";
import type { NotificationItem } from "@/types/notification.types";

type Filter = "all" | "unread";

const BELL_PATH =
  "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";

// Picks an icon from keywords in notification_type, so new backend
// types still get a sensible icon without a code change.
function iconPathFor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("booking") || t.includes("trip"))
    return "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
  if (
    t.includes("payment") ||
    t.includes("payout") ||
    t.includes("refund") ||
    t.includes("ledger")
  )
    return "M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z";
  if (
    t.includes("listing") ||
    t.includes("vehicle") ||
    t.includes("fleet") ||
    t.includes("block")
  )
    return "M8 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h9l4 5h1a2 2 0 012 2v4h-2M9 17h6";
  if (t.includes("kyc") || t.includes("document") || t.includes("account"))
    return "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";
  return BELL_PATH;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Sidebar-style section headings for the list.
function dayGroup(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  return "Earlier";
}

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function NotificationBell() {
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { count, refetch: refetchCount } = useUnreadNotificationCount(token);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const { shouldRender, phase } = useMountTransition(open, 250);

  const listQueryKey = queryKeys.notifications.list(token, 1);
  const {
    data: items = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      const res = await getNotificationsApi(token as string, 1);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load notifications");
      }
      return res.data.results;
    },
    enabled: open && !!token,
    staleTime: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationReadApi(token as string, id),
    onMutate: (id: number) => {
      queryClient.setQueryData<NotificationItem[]>(listQueryKey, (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    },
    onSettled: () => refetchCount(),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsReadApi(token as string),
    onMutate: () => {
      queryClient.setQueryData<NotificationItem[]>(listQueryKey, (prev) =>
        prev?.map((n) => ({ ...n, is_read: true })),
      );
    },
    onSettled: () => refetchCount(),
  });

  // Escape closes the panel (desktop / hardware keyboards).
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleItemClick(item: NotificationItem) {
    if (!token) return;
    if (!item.is_read) markReadMutation.mutate(item.id);
    setOpen(false);
    if (item.link) router.push(item.link as never);
  }

  function handleMarkAllRead() {
    if (!token) return;
    markAllReadMutation.mutate();
  }

  const unreadInList = items.filter((item) => !item.is_read).length;
  const visible =
    filter === "unread" ? items.filter((item) => !item.is_read) : items;

  // Preserve the API's order (newest first) while grouping by day.
  const groups: { title: string; items: NotificationItem[] }[] = [];
  for (const item of visible) {
    const title = dayGroup(item.created_at);
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(item);
    else groups.push({ title, items: [item] });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={
          count > 0 ? `Notifications, ${count} unread` : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        className={HEADER_ICON_BUTTON}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={BELL_PATH}
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-white text-[9px] font-bold leading-[14px] text-white text-center tabular-nums">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Portaled to <body>: the Header is sticky with its own z-index,
          which would otherwise trap this full-screen panel beneath
          anything stacked above the header (e.g. the bottom nav).
          Full-screen on phones; a right-hand slide-over with a
          click-to-close backdrop at lg:. */}
      {shouldRender &&
        createPortal(
          <>
            <div
              onClick={() => setOpen(false)}
              className={`modal-backdrop modal-backdrop-${phase} fixed inset-0 z-50 hidden bg-black/40 lg:block`}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
              className={`modal-panel modal-panel-${phase} fixed inset-0 z-50 flex flex-col bg-brand-bg lg:left-auto lg:w-[26rem] lg:shadow-2xl`}
            >
              {/* Top bar */}
              <header className="bg-white shadow-sm pt-safe">
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-bold tracking-tight text-font-main-sub">
                      Notifications
                    </h2>
                    <p className="text-xs text-font-dim">
                      {count > 0
                        ? `${count} unread update${count === 1 ? "" : "s"}`
                        : "You're all caught up"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-font-main-sub active:bg-gray-200 transition-colors"
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
              </header>

              {/* Filters + mark all read */}
              <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                {(["all", "unread"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm transition-colors ${
                      filter === key
                        ? "bg-brand-secondary text-brand-yellow"
                        : "bg-white text-font-dim active:bg-gray-100"
                    }`}
                  >
                    {key === "all" ? "All" : "Unread"}
                    {key === "unread" && unreadInList > 0 && (
                      <span className="ml-1.5 tabular-nums">
                        {unreadInList}
                      </span>
                    )}
                  </button>
                ))}
                {unreadInList > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markAllReadMutation.isPending}
                    className="ml-auto shrink-0 rounded-xl px-3 py-2 text-[13px] font-semibold text-font-main-sub active:bg-white transition-colors disabled:opacity-50"
                  >
                    {markAllReadMutation.isPending
                      ? "Updating..."
                      : "Mark all read"}
                  </button>
                )}
              </div>

              {/* List */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar px-5 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
                {loading ? (
                  <div
                    className="space-y-2.5"
                    aria-label="Loading notifications"
                  >
                    {[0, 1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="flex animate-pulse gap-3 rounded-2xl bg-white p-3 shadow-sm"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100" />
                        <div className="flex-1">
                          <div className="h-3 w-2/3 rounded bg-gray-100" />
                          <div className="mt-2 h-3 w-full rounded bg-gray-100" />
                          <div className="mt-2 h-2.5 w-16 rounded bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div
                    className="mt-2 rounded-2xl bg-white px-6 py-8 text-center shadow-sm"
                    role="alert"
                  >
                    <p className="text-sm font-semibold text-font-main-sub">
                      Notifications couldn&apos;t load
                    </p>
                    <p className="mt-1 text-xs text-font-dim">
                      {error instanceof Error
                        ? error.message
                        : "Check your connection and try again."}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-4 rounded-xl bg-brand-secondary px-4 py-2.5 text-sm font-semibold text-brand-yellow active:opacity-80 transition-opacity"
                    >
                      Try again
                    </button>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="mt-2 flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
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
                          d={BELL_PATH}
                        />
                      </svg>
                    </span>
                    <p className="mt-3 text-sm font-semibold text-font-main-sub">
                      {filter === "unread"
                        ? "No unread notifications"
                        : "You're all caught up"}
                    </p>
                    <p className="mt-1 text-xs text-font-dim">
                      {filter === "unread"
                        ? "Everything has been read."
                        : "Updates about bookings, payouts and your listings will appear here."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {groups.map((group) => (
                      <section key={group.title}>
                        <h3 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                          {group.title}
                        </h3>
                        <ul className="space-y-2.5">
                          {group.items.map((item) => (
                            <li key={item.id}>
                              <NotificationCard
                                item={item}
                                onClick={() => handleItemClick(item)}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function NotificationCard({
  item,
  onClick,
}: {
  item: NotificationItem;
  onClick: () => void;
}) {
  const unread = !item.is_read;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-2xl p-3 text-left shadow-sm transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow-lg ${
        unread ? "bg-white ring-2 ring-brand-yellow/60" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            unread
              ? "bg-brand-yellow-lg text-brand-secondary"
              : "bg-gray-100 text-font-dim"
          }`}
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
              d={iconPathFor(item.notification_type)}
            />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`min-w-0 flex-1 text-sm leading-snug text-font-main-sub ${
                unread ? "font-bold" : "font-semibold"
              }`}
            >
              {item.title}
            </p>
            <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
              <time
                dateTime={item.created_at}
                className="text-[11px] text-font-dim"
              >
                {timeAgo(item.created_at)}
              </time>
              {unread && (
                <span
                  className="h-2 w-2 rounded-full bg-red-500"
                  aria-label="Unread"
                />
              )}
            </span>
          </div>
          {item.message && (
            <p className="mt-1 whitespace-normal break-words text-xs leading-relaxed text-font-dim line-clamp-3">
              {item.message}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-font-dim">
              {toTitleCase(item.notification_type)}
            </span>
            {item.link && (
              <span className="text-xs font-semibold text-font-main-sub">
                View <span aria-hidden="true">→</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
