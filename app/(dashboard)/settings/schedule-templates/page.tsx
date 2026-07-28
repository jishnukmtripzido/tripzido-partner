"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getScheduleTemplatesApi,
  deleteScheduleTemplateApi,
} from "@/services/fleet.service";
import { saveReturnTo } from "@/lib/listingDraft";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ScheduleTemplate } from "@/types/listing-create.types";
import { PageLoader } from "@/components/ui/PageLoader";

export default function ScheduleTemplatesPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleTemplate | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getScheduleTemplatesApi(token);
        if (!cancelled) {
          if (res.success && res.data) setTemplates(res.data);
          else setError(res.message || "Failed to load schedule templates");
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleCreateNew() {
    saveReturnTo("/settings/schedule-templates");
    router.push("/fleet/schedule-templates/new" as Route);
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteScheduleTemplateApi(deleteTarget.id, token);
      if (!res.success) {
        setDeleteError(res.message || "Failed to delete template");
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete template",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Header
        title="Schedule Templates"
        onBack={() => router.back()}
        rightSlot={
          <button
            onClick={handleCreateNew}
            className="text-sm font-bold text-brand-secondary bg-brand-yellow px-3 py-1.5 rounded-lg hover:bg-brand-yellow-lg transition-colors"
          >
            + New
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-3">
        {loading && <PageLoader />}
        {error && (
          <p className="text-sm text-red-500 text-center mt-10">{error}</p>
        )}
        {!loading && !error && templates.length === 0 && (
          <p className="text-sm text-font-dim text-center mt-10">
            No schedule templates yet.
          </p>
        )}

        {templates.map((t) => {
          const openDays = t.days.filter((d) => !d.is_closed).length;
          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-font-main-sub text-base">
                  {t.name}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      router.push(
                        `/settings/schedule-templates/edit?id=${t.id}` as Route,
                      )
                    }
                    className="text-xs font-bold text-brand-yellow-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(t);
                    }}
                    className="text-xs font-bold text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-xs text-font-dim mt-1">
                {openDays} day(s) open •{" "}
                {t.listings_count > 0
                  ? `used by ${t.listings_count} listing(s)`
                  : "not used by any listing yet"}
              </p>
            </div>
          );
        })}
      </main>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this schedule template?"
          message={
            deleteTarget.listings_count > 0
              ? `This template is used by ${deleteTarget.listings_count} listing(s). Deleting it will leave them with no schedule — they'll show as closed every day until you assign a new template.`
              : "This will permanently remove this template. This can't be undone."
          }
          confirmLabel="Delete template"
          destructive
          submitting={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
