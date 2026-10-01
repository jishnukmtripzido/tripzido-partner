"use client";

import { useState } from "react";
import type { ScheduleTemplateDay } from "@/types/listing-create.types";

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const CALENDAR_PATH =
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";

/** "07:00" / "07:00:00" → "7:00 AM". */
export function formatClock(value: string | null): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Monday-first index (matching day_of_week) of today. */
export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

interface DayDraft {
  day_of_week: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
}

const DEFAULT_OPEN = "07:00";
const DEFAULT_CLOSE = "19:00";

const INPUT_CLASS =
  "w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-medium text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors";

// <input type="time"> wants HH:MM; the API may send HH:MM:SS.
const toInputTime = (value: string | null, fallback: string) =>
  value ? value.slice(0, 5) : fallback;

/**
 * Shared by the New and Edit schedule template pages. Owns the name +
 * per-day draft state; the pages own loading, saving and navigation.
 */
export function ScheduleTemplateForm({
  initialName = "",
  initialDays,
  submitting,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialName?: string;
  initialDays?: ScheduleTemplateDay[];
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (name: string, days: ScheduleTemplateDay[]) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [days, setDays] = useState<DayDraft[]>(() =>
    DAY_NAMES.map((_, i) => {
      const existing = initialDays?.find((d) => d.day_of_week === i);
      return {
        day_of_week: i,
        is_closed: existing?.is_closed ?? false,
        open_time: toInputTime(existing?.open_time ?? null, DEFAULT_OPEN),
        close_time: toInputTime(existing?.close_time ?? null, DEFAULT_CLOSE),
      };
    }),
  );

  function updateDay(index: number, patch: Partial<DayDraft>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  // Copies the first open day's hours to every other open day — the
  // common case is the same hours all week, set once.
  const firstOpen = days.find((d) => !d.is_closed);
  function copyHoursToAll() {
    if (!firstOpen) return;
    setDays((prev) =>
      prev.map((d) =>
        d.is_closed
          ? d
          : {
              ...d,
              open_time: firstOpen.open_time,
              close_time: firstOpen.close_time,
            },
      ),
    );
  }

  const invalidDay = days.find(
    (d) => !d.is_closed && d.open_time >= d.close_time,
  );
  const openCount = days.filter((d) => !d.is_closed).length;
  const canSubmit = !!name.trim() && !invalidDay && !submitting;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(
      name.trim(),
      days.map((d) => ({
        day_of_week: d.day_of_week,
        is_closed: d.is_closed,
        open_time: d.is_closed ? null : d.open_time,
        close_time: d.is_closed ? null : d.close_time,
      })),
    );
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <section>
        <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
          Template name
        </h2>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard hours"
            aria-label="Template name"
            className={INPUT_CLASS}
          />
        </div>
      </section>

      {/* Week */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
            Weekly hours · {openCount} open
          </h2>
          {firstOpen && openCount > 1 && (
            <button
              type="button"
              onClick={copyHoursToAll}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-font-main-sub underline decoration-brand-yellow-lg decoration-2 underline-offset-2 hover:bg-white active:bg-white"
            >
              Copy {DAY_NAMES[firstOpen.day_of_week].slice(0, 3)}&apos;s hours
              to all
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100 rounded-2xl bg-white px-3 shadow-sm">
          {days.map((day, i) => {
            const invalid = !day.is_closed && day.open_time >= day.close_time;
            return (
              <div key={day.day_of_week} className="py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      day.is_closed
                        ? "bg-gray-100 text-font-dim"
                        : "bg-brand-yellow-lg text-brand-secondary"
                    }`}
                  >
                    {DAY_NAMES[i].slice(0, 3)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-font-main-sub">
                      {DAY_NAMES[i]}
                    </span>
                    <span className="block text-xs text-font-dim">
                      {day.is_closed ? "Closed" : "Open"}
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!day.is_closed}
                    aria-label={`${DAY_NAMES[i]} open`}
                    onClick={() => updateDay(i, { is_closed: !day.is_closed })}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                      day.is_closed ? "bg-gray-300" : "bg-brand-yellow-lg"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                        day.is_closed ? "translate-x-1" : "translate-x-[26px]"
                      }`}
                    />
                  </button>
                </div>

                {!day.is_closed && (
                  <div className="mt-2.5 flex items-center gap-2 pl-12">
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(e) =>
                        updateDay(i, { open_time: e.target.value })
                      }
                      aria-label={`${DAY_NAMES[i]} opening time`}
                      className={`${INPUT_CLASS} py-2.5`}
                    />
                    <span className="shrink-0 text-xs text-font-dim">to</span>
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(e) =>
                        updateDay(i, { close_time: e.target.value })
                      }
                      aria-label={`${DAY_NAMES[i]} closing time`}
                      className={`${INPUT_CLASS} py-2.5`}
                    />
                  </div>
                )}
                {invalid && (
                  <p className="mt-1.5 pl-12 text-xs text-red-600">
                    Closing time must be after opening time.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl bg-white py-3.5 text-sm font-semibold text-font-main-sub shadow-sm hover:bg-gray-100 active:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl bg-brand-secondary py-3.5 text-sm font-semibold text-brand-yellow shadow-sm hover:opacity-90 active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
        {!name.trim() && (
          <p className="mt-2 px-1 text-center text-xs text-font-dim">
            Give the template a name to save it.
          </p>
        )}
      </div>
    </div>
  );
}
