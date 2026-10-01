"use client";

interface OrdersOverviewChartProps {
  bars: number[]; // 0-100 heights, oldest first
  rangeLabel: string;
  /** e.g. ["Mon","Tue",...] — falls back to "Week N" if omitted, so
   * this stays backward compatible with any other caller. */
  dayLabels?: string[];
  /** Raw daily counts behind `bars`, for the week total + per-bar labels. */
  counts?: number[];
}

/** Last bar is today; it gets the solid yellow so "now" is easy to find. */
export function OrdersOverviewChart({
  bars,
  rangeLabel,
  dayLabels,
  counts,
}: OrdersOverviewChartProps) {
  const todayIndex = bars.length - 1;
  const weekTotal = counts?.reduce((sum, c) => sum + c, 0);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {weekTotal !== undefined && (
            <p className="font-heading text-2xl font-bold leading-none tabular-nums text-font-main-sub">
              {weekTotal}
              <span className="ml-1.5 text-sm font-semibold text-font-dim">
                order{weekTotal === 1 ? "" : "s"}
              </span>
            </p>
          )}
          <p className="mt-1 text-xs text-font-dim">Last 7 days</p>
        </div>
        <span className="rounded-lg bg-brand-bg px-2.5 py-1 text-[11px] font-semibold text-font-dim">
          {rangeLabel}
        </span>
      </div>

      <div
        className="flex h-32 items-end justify-between gap-2"
        role="img"
        aria-label={`Daily orders: ${
          dayLabels
            ?.map((d, i) => `${d} ${counts?.[i] ?? ""}`.trim())
            .join(", ") ?? "weekly intervals"
        }`}
      >
        {bars.map((height, i) => (
          <div
            key={i}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            aria-hidden="true"
          >
            <span className="h-3.5 text-[10px] font-bold leading-none tabular-nums text-font-main-sub">
              {counts && counts[i] > 0 ? counts[i] : ""}
            </span>
            {/* Bar area below the label, so a 100% bar never overflows. */}
            <div className="flex min-h-0 w-full flex-1 items-end justify-center">
              <div
                style={{ height: `${height}%` }}
                className={`w-full max-w-9 rounded-lg transition-colors ${
                  i === todayIndex
                    ? "bg-brand-yellow-lg"
                    : counts && counts[i] > 0
                      ? "bg-brand-yellow/45"
                      : "bg-gray-100"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {bars.map((_, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] ${
              i === todayIndex
                ? "font-bold text-font-main-sub"
                : "font-semibold text-font-dim"
            }`}
          >
            {i === todayIndex ? "Today" : (dayLabels?.[i] ?? `Week ${i + 1}`)}
          </span>
        ))}
      </div>
    </section>
  );
}
