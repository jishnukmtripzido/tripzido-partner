"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getScheduleTemplateDetailApi,
  updateScheduleTemplateApi,
} from "@/services/fleet.service";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import type { ScheduleTemplate } from "@/types/listing-create.types";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ── Icons — reusing the same vocabulary established elsewhere in this
// portal (calendar = schedule, clock = timing). ────────────────────────

const CALENDAR_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  />
);
const CLOCK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
  />
);

interface DayDraft {
  day_of_week: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
}

export default function EditScheduleTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const templateId = searchParams.get("id");

  const detailQuery = useQuery({
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

  const updateMutation = useMutation({
    mutationFn: async (payload: { name: string; days: DayDraft[] }) => {
      const dayPayload = payload.days.map((d) => ({
        day_of_week: d.day_of_week,
        is_closed: d.is_closed,
        open_time: d.is_closed ? null : d.open_time,
        close_time: d.is_closed ? null : d.close_time,
      }));
      const res = await updateScheduleTemplateApi(
        Number(templateId),
        payload.name,
        dayPayload,
        token as string,
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to save changes");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.scheduleTemplates(token),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.scheduleTemplateDetail(token, templateId),
      });
      // Same backend resource is also read by the fleet feature's
      // listing forms — keep that cache entry in sync too.
      queryClient.invalidateQueries({
        queryKey: queryKeys.fleet.scheduleTemplates(token),
      });
      router.push("/settings/schedule-templates" as Route);
    },
  });

  if (detailQuery.isLoading) {
    return (
      <>
        <Header title="Edit schedule" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <PageLoader />
        </main>
      </>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <>
        <Header title="Edit schedule" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <p className="text-sm text-red-500 text-center">
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Template not found"}
          </p>
        </main>
      </>
    );
  }

  return (
    <ScheduleTemplateEditor
      initial={detailQuery.data}
      submitting={updateMutation.isPending}
      error={
        updateMutation.error instanceof Error
          ? updateMutation.error.message
          : null
      }
      onSubmit={(payload) => updateMutation.mutate(payload)}
      onBack={() => router.back()}
    />
  );
}

// Mounted only once the template detail has loaded, so its local
// name/days state is seeded exactly once from `initial` — mirroring
// how the pickup-points edit page hands loaded data to PickupPointForm.
function ScheduleTemplateEditor({
  initial,
  submitting,
  error,
  onSubmit,
  onBack,
}: {
  initial: ScheduleTemplate;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: { name: string; days: DayDraft[] }) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [days, setDays] = useState<DayDraft[]>(
    initial.days.map((d) => ({
      day_of_week: d.day_of_week,
      is_closed: d.is_closed,
      open_time: d.open_time ?? "07:00",
      close_time: d.close_time ?? "19:00",
    })),
  );

  function updateDay(index: number, patch: Partial<DayDraft>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), days });
  }

  return (
    <>
      <Header title="Edit schedule template" onBack={onBack} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow-lg flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {CALENDAR_ICON}
              </svg>
            </div>
            <label className="text-sm font-semibold text-font-main-sub">
              Template name
            </label>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="space-y-3">
            {days.map((day, i) => (
              <div
                key={day.day_of_week}
                className={`border rounded-xl p-3 transition-colors ${
                  day.is_closed
                    ? "border-gray-100 bg-gray-50/50"
                    : "border-brand-yellow/40 bg-brand-yellow/5"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        day.is_closed
                          ? "bg-gray-100 text-gray-400"
                          : "bg-brand-yellow text-brand-secondary"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {CLOCK_ICON}
                      </svg>
                    </div>
                    <span className="text-sm font-semibold">
                      {DAY_NAMES[i]}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-font-dim">
                    <input
                      type="checkbox"
                      checked={day.is_closed}
                      onChange={(e) =>
                        updateDay(i, { is_closed: e.target.checked })
                      }
                      className="w-4 h-4 accent-brand-yellow"
                    />
                    Closed
                  </label>
                </div>
                {!day.is_closed && (
                  <div className="grid grid-cols-2 gap-2 pl-[42px]">
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(e) =>
                        updateDay(i, { open_time: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(e) =>
                        updateDay(i, { close_time: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim()}
          className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </main>
    </>
  );
}
