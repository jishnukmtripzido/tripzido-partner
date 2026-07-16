"use client";

interface PaginationProps {
  rangeLabel: string; // e.g. "1-4 of 4" or "1-10 of 171"
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

/** The "1-4 of 4" + chevron controls repeated at the bottom of every list screen. */
export function Pagination({
  rangeLabel,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-6 px-2">
      <span className="text-sm font-medium text-font-dim">{rangeLabel}</span>
      <div className="flex items-center gap-4">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={
            hasPrev
              ? "text-font-main-sub hover:text-brand-yellow transition-colors bg-white p-1 rounded-md shadow-sm border border-gray-100"
              : "text-gray-300 cursor-not-allowed"
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={
            hasNext
              ? "text-font-main-sub hover:text-brand-yellow transition-colors bg-white p-1 rounded-md shadow-sm border border-gray-100"
              : "text-gray-300 cursor-not-allowed"
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
