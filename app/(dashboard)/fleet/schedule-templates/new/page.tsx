"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { createScheduleTemplateApi } from "@/services/fleet.service";
import { loadReturnTo, clearReturnTo } from "@/lib/listingDraft";
import type { ScheduleTemplateDay } from "@/types/listing-create.types";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface DayDraft {
  day_of_week: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
}

const DEFAULT_DAYS: DayDraft[] = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  is_closed: false,
  open_time: "07:00",
  close_time: "19:00",
}));

export default function NewScheduleTemplatePage() {
  const router = useRouter();
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [days, setDays] = useState<DayDraft[]>(DEFAULT_DAYS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(index: number, patch: Partial<DayDraft>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  function goBack() {
    // Whichever page navigated here (create wizard or edit page) left
    // its return path in sessionStorage — falls back to the create
    // wizard if that's somehow missing.
    router.push(loadReturnTo("/fleet/listing/new") as Route);
  }

  async function handleSubmit() {
    if (!token || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: ScheduleTemplateDay[] = days.map((d) => ({
        day_of_week: d.day_of_week,
        is_closed: d.is_closed,
        open_time: d.is_closed ? null : d.open_time,
        close_time: d.is_closed ? null : d.close_time,
      }));
      const res = await createScheduleTemplateApi(name.trim(), payload, token);
      if (!res.success) {
        setError(res.message || "Failed to create schedule template");
        return;
      }
      const returnTo = loadReturnTo("/fleet/listing/new");
      clearReturnTo();
      router.push(returnTo as Route);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create schedule template",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header title="New schedule template" onBack={goBack} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Template name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Hours"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
          />
        </div>

        <div className="space-y-3">
          {days.map((day, i) => (
            <div
              key={day.day_of_week}
              className="border border-gray-100 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{DAY_NAMES[i]}</span>
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
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={day.open_time}
                    onChange={(e) =>
                      updateDay(i, { open_time: e.target.value })
                    }
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={day.close_time}
                    onChange={(e) =>
                      updateDay(i, { close_time: e.target.value })
                    }
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim()}
          className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save schedule template"}
        </button>
      </main>
    </>
  );
}
