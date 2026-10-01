"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { getScheduleTemplatesApi } from "@/services/fleet.service";
import { saveReturnTo } from "@/lib/listingDraft";
import type { ScheduleTemplate } from "@/types/listing-create.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import {
  CALENDAR_PATH,
  DAY_NAMES,
  formatClock,
} from "@/components/features/settings/ScheduleTemplateForm";

// "7:00 AM – 7:00 PM" when every open day shares the same hours,
// otherwise "Varies by day".
function hoursSummary(t: ScheduleTemplate): string {
  const open = t.days.filter((d) => !d.is_closed);
  if (open.length === 0) return "Closed all week";
  const first = open[0];
  const same = open.every(
    (d) => d.open_time === first.open_time && d.close_time === first.close_time,
  );
  return same
    ? `${formatClock(first.open_time)} – ${formatClock(first.close_time)}`
    : "Varies by day";
}

export default function ScheduleTemplatesPage() {
  const router = useRouter();
  const { token } = useAuth();

  const {
    data: templates = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.settings.scheduleTemplates(token),
    queryFn: async () => {
      const res = await getScheduleTemplatesApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load schedule templates");
      }
      return res.data;
    },
    enabled: !!token,
  });

  function handleCreateNew() {
    saveReturnTo("/settings/schedule-templates");
    router.push("/fleet/schedule-templates/new" as Route);
  }

  return (
    <>
      <Header
        title="Schedule Templates"
        onBack={() => router.back()}
        rightSlot={
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-8 lg:pt-7">
        {loading && <PageLoader />}

        {error && (
          <div className="mt-2 rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-red-500">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-yellow hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="mt-2 flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
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
                  d={CALENDAR_PATH}
                />
              </svg>
            </span>
            <p className="text-sm font-semibold text-font-main-sub">
              No schedule templates yet
            </p>
            <p className="mt-1 text-xs text-font-dim">
              Set your weekly opening hours once and reuse them on every
              listing.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 rounded-xl bg-brand-secondary px-4 py-2.5 text-sm font-semibold text-brand-yellow hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Add schedule template
            </button>
          </div>
        )}

        {!loading && !error && templates.length > 0 && (
          <>
            <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
              {templates.length} template{templates.length === 1 ? "" : "s"}
            </h2>
            <div className="space-y-2.5 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-3 lg:space-y-0">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onClick={() =>
                    router.push(
                      `/settings/schedule-templates/detail?id=${t.id}` as Route,
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function TemplateCard({
  template,
  onClick,
}: {
  template: ScheduleTemplate;
  onClick: () => void;
}) {
  const openCount = template.days.filter((d) => !d.is_closed).length;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-white p-3.5 text-left shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/30 text-brand-secondary">
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
              d={CALENDAR_PATH}
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[15px] font-bold text-font-main-sub">
            {template.name}
          </h3>
          <p className="truncate text-xs text-font-dim">
            {hoursSummary(template)} · {openCount} day
            {openCount === 1 ? "" : "s"} open
          </p>
        </div>
        <svg
          className="h-5 w-5 shrink-0 text-gray-400"
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
      </div>

      {/* Week strip: open days in yellow, closed days grey */}
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {DAY_NAMES.map((dayName, i) => {
          const day = template.days.find((d) => d.day_of_week === i);
          const open = day ? !day.is_closed : false;
          return (
            <span
              key={dayName}
              className={`flex h-7 flex-1 items-center justify-center rounded-lg text-[11px] font-bold ${
                open
                  ? "bg-brand-yellow-lg text-brand-secondary"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {dayName[0]}
            </span>
          );
        })}
      </div>

      <p className="mt-2.5 text-[11px] text-font-dim">
        {template.listings_count > 0
          ? `Used by ${template.listings_count} listing${template.listings_count === 1 ? "" : "s"}`
          : "Not used by any listing yet"}
      </p>
    </button>
  );
}
