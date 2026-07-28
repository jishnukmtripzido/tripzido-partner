"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getScheduleTemplateDetailApi,
  updateScheduleTemplateApi,
} from "@/services/fleet.service";
import { PageLoader } from "@/components/ui/PageLoader";

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

export default function EditScheduleTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const templateId = searchParams.get("id");

  const [name, setName] = useState("");
  const [days, setDays] = useState<DayDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !templateId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await getScheduleTemplateDetailApi(
          Number(templateId),
          token,
        );
        if (cancelled) return;
        if (!res.success || !res.data) {
          setLoadError(res.message || "Template not found");
          return;
        }
        setName(res.data.name);
        setDays(
          res.data.days.map((d) => ({
            day_of_week: d.day_of_week,
            is_closed: d.is_closed,
            open_time: d.open_time ?? "07:00",
            close_time: d.close_time ?? "19:00",
          })),
        );
      } catch (err) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, templateId]);

  function updateDay(index: number, patch: Partial<DayDraft>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  async function handleSubmit() {
    if (!token || !templateId || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = days.map((d) => ({
        day_of_week: d.day_of_week,
        is_closed: d.is_closed,
        open_time: d.is_closed ? null : d.open_time,
        close_time: d.is_closed ? null : d.close_time,
      }));
      const res = await updateScheduleTemplateApi(
        Number(templateId),
        name.trim(),
        payload,
        token,
      );
      if (!res.success) {
        setError(res.message || "Failed to save changes");
        return;
      }
      router.push("/settings/schedule-templates" as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Edit schedule" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <PageLoader />
        </main>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Header title="Edit schedule" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <p className="text-sm text-red-500 text-center">{loadError}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Edit schedule template" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Template name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </main>
    </>
  );
}
