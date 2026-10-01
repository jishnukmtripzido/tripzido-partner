"use client";

import { useEffect, useState } from "react";
import { useDismissTransition } from "@/hooks/useDismissTransition";

interface SearchPickerSheetProps<T> {
  title: string;
  placeholder: string;
  items: T[];
  loading: boolean;
  error?: string | null;
  getKey: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  onQueryChange: (query: string) => void;
  onSelect: (item: T) => void;
  onClose: () => void;
  emptyLabel?: string;
  // Set true when the list doesn't need typing to show results (e.g.
  // a short static list like Brands) — search input still renders for
  // filtering, but items show immediately rather than waiting on a query.
  showAllByDefault?: boolean;
  /** Key of the currently chosen item, if any — highlighted + checked. */
  selectedKey?: string | number | null;
}

/**
 * Bottom sheet with a search box and a tappable result list — used for
 * Brand / Vehicle type / City / Pickup location and the Add block
 * listing picker. Visual language matches the app's other sheets:
 * cream sheet, white grouped list, selected row in soft yellow.
 */
export function SearchPickerSheet<T>({
  title,
  placeholder,
  items,
  loading,
  error,
  getKey,
  renderItem,
  onQueryChange,
  onSelect,
  onClose,
  emptyLabel = "No results found.",
  showAllByDefault = false,
  selectedKey = null,
}: SearchPickerSheetProps<T>) {
  const { phase, dismiss } = useDismissTransition(onClose);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onQueryChange(query), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const showEmpty =
    !loading &&
    !error &&
    items.length === 0 &&
    (query.trim() || showAllByDefault);
  const showPrompt =
    !loading && !error && items.length === 0 && !showEmpty;

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center">
      <div
        onClick={dismiss}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-panel modal-panel-${phase} relative mt-auto flex w-full flex-col rounded-t-3xl bg-brand-bg sm:mt-0 sm:max-w-md sm:rounded-3xl`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Header + search */}
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-font-main-sub">
              {title}
            </h2>
            <button
              onClick={dismiss}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-font-main-sub shadow-sm hover:bg-gray-100 active:bg-gray-100"
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

          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-font-dim"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="w-full rounded-xl border-2 border-transparent bg-white py-3 pl-11 pr-11 text-sm font-medium text-font-main-sub shadow-sm outline-none transition-colors placeholder:text-font-dim/60 focus:border-brand-yellow"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-font-dim hover:bg-gray-200 active:bg-gray-200"
              >
                <svg
                  className="h-4 w-4"
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
            )}
          </div>

          {!loading && !error && items.length > 0 && (
            <p className="mt-3 px-1 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
              {items.length} result{items.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar px-5 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
          {loading && (
            <div
              className="space-y-0.5 rounded-2xl bg-white p-1.5 shadow-sm"
              aria-label="Loading"
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3.5">
                  <div className="h-3.5 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-3.5 w-10 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-4 text-center text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {(showEmpty || showPrompt) && (
            <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
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
                    d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                  />
                </svg>
              </span>
              <p className="text-sm text-font-dim">
                {showEmpty ? emptyLabel : "Start typing to search."}
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-0.5 rounded-2xl bg-white p-1.5 shadow-sm">
              {items.map((item) => {
                const key = getKey(item);
                const selected = selectedKey !== null && key === selectedKey;
                return (
                  <button
                    key={key}
                    onClick={() => onSelect(item)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-font-main-sub transition-colors ${
                      selected ? "bg-brand-yellow/25" : "hover:bg-gray-100 active:bg-gray-100"
                    }`}
                  >
                    <span className="min-w-0 flex-1">{renderItem(item)}</span>
                    {selected ? (
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
                    ) : (
                      <svg
                        className="h-4 w-4 shrink-0 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
