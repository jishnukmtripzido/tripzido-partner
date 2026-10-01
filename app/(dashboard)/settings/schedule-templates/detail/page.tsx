"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getScheduleTemplateDetailApi,
  deleteScheduleTemplateApi,
} from "@/services/fleet.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import type { ScheduleTemplate } from "@/types/listing-create.types";
import {
  CALENDAR_PATH,
  DAY_NAMES,
  formatClock,
  todayIndex,
} from "@/components/features/settings/ScheduleTemplateForm";

export default function ScheduleTemplateDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const templateId = searchParams.get("id");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.settings.scheduleTemplateDetail(token, templateId),
    queryFn: async () => {
      const res = await getScheduleTemplateDetailApi(
        Number(templateId),
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Template not found");
      }
      return res.data;
    },
    enabled: !!token && !!templateId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (t: ScheduleTemplate) => {
      const res = await deleteScheduleTemplateApi(t.id, token as string);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete template");
      }
      return t;
    },
    onSuccess: (t) => {
      queryClient.setQueryData<ScheduleTemplate[]>(
        queryKeys.settings.scheduleTemplates(token),
        (prev) => prev?.filter((x) => x.id !== t.id),
      );
      // Same backend resource is also read by the fleet feature's
      // listing forms — invalidate that cache entry too.
      queryClient.invalidateQueries({
        queryKey: queryKeys.fleet.scheduleTemplates(token),
      });
      setConfirmDelete(false);
      router.back();
    },
  });

  const today = todayIndex();
  const days = template
    ? DAY_NAMES.map(
        (_, i) =>
          template.days.find((d) => d.day_of_week === i) ?? {
            day_of_week: i,
            is_closed: true,
            open_time: null,
            close_time: null,
          },
      )
    : [];
  const openCount = days.filter((d) => !d.is_closed).length;
  const todayDay = days[today];

  return (
    <>
      <Header
        title={template ? template.name : "Schedule template"}
        onBack={() => router.back()}
        rightSlot={
          template && (
            <button
              onClick={() =>
                router.push(
                  `/settings/schedule-templates/edit?id=${template.id}` as Route,
                )
              }
              className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition-opacity shrink-0"
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit
            </button>
          )
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-page-narrow lg:pt-7">
        {isLoading ? (
          <PageLoader />
        ) : error || !template ? (
          <p className="rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-red-600 shadow-sm">
            {error instanceof Error ? error.message : "Template not found"}
          </p>
        ) : (
          <div className="space-y-5">
            {/* Summary */}
            <section className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
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
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-heading text-lg font-bold text-font-main-sub">
                    {template.name}
                  </h2>
                  <p className="text-xs text-font-dim">
                    {template.listings_count > 0
                      ? `Used by ${template.listings_count} listing${template.listings_count === 1 ? "" : "s"}`
                      : "Not used by any listing yet"}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 divide-x divide-black/5 rounded-xl bg-brand-bg py-3">
                <div className="px-2 text-center">
                  <p className="font-heading text-xl font-bold leading-none text-font-main-sub">
                    {openCount}
                    <span className="text-sm text-font-dim">/7</span>
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-font-dim">
                    Days open
                  </p>
                </div>
                <div className="px-2 text-center">
                  <p className="font-heading text-sm font-bold leading-5 text-font-main-sub">
                    {todayDay?.is_closed
                      ? "Closed"
                      : `${formatClock(todayDay?.open_time ?? null)} – ${formatClock(todayDay?.close_time ?? null)}`}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-font-dim">
                    Today
                  </p>
                </div>
              </div>
            </section>

            {/* Week */}
            <section>
              <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                Weekly hours
              </h2>
              <div className="space-y-0.5 rounded-2xl bg-white p-1.5 shadow-sm">
                {days.map((day, i) => {
                  const isToday = i === today;
                  return (
                    <div
                      key={day.day_of_week}
                      className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 ${
                        isToday ? "bg-brand-yellow/25" : ""
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          day.is_closed
                            ? "bg-gray-100 text-font-dim"
                            : "bg-brand-yellow-lg text-brand-secondary"
                        }`}
                      >
                        {DAY_NAMES[i].slice(0, 3)}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-font-main-sub">
                        {DAY_NAMES[i]}
                        {isToday && (
                          <span className="rounded-md bg-brand-yellow-lg px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-secondary">
                            Today
                          </span>
                        )}
                      </span>
                      {day.is_closed ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                          Closed
                        </span>
                      ) : (
                        <span className="text-xs font-semibold tabular-nums text-font-dim">
                          {formatClock(day.open_time)} –{" "}
                          {formatClock(day.close_time)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Delete */}
            <button
              onClick={() => {
                deleteMutation.reset();
                setConfirmDelete(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-2.5 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 active:bg-red-50 transition-colors"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </span>
              Delete template
            </button>
          </div>
        )}
      </main>

      {confirmDelete && template && (
        <ConfirmDialog
          title="Delete this schedule template?"
          message={
            template.listings_count > 0
              ? `This template is used by ${template.listings_count} listing(s). Deleting it will leave them with no schedule — they'll show as closed every day until you assign a new template.`
              : "This will permanently remove this template. This can't be undone."
          }
          confirmLabel="Delete template"
          destructive
          submitting={deleteMutation.isPending}
          error={
            deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : null
          }
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => deleteMutation.mutate(template)}
        />
      )}
    </>
  );
}
