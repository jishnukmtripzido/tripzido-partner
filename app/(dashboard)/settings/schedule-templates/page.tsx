"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { queryKeys } from "@/lib/queryKeys";

export default function ScheduleTemplatesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<ScheduleTemplate | null>(
    null,
  );

  const queryKey = queryKeys.settings.scheduleTemplates(token);
  const {
    data: templates = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getScheduleTemplatesApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load schedule templates");
      }
      return res.data;
    },
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (template: ScheduleTemplate) => {
      const res = await deleteScheduleTemplateApi(template.id, token as string);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete template");
      }
      return template;
    },
    onSuccess: (template) => {
      queryClient.setQueryData<ScheduleTemplate[]>(queryKey, (prev) =>
        prev?.filter((t) => t.id !== template.id),
      );
      // Same backend resource is also read by the fleet feature's
      // listing forms — invalidate that cache entry too.
      queryClient.invalidateQueries({
        queryKey: queryKeys.fleet.scheduleTemplates(token),
      });
      setDeleteTarget(null);
    },
  });

  function handleCreateNew() {
    saveReturnTo("/settings/schedule-templates");
    router.push("/fleet/schedule-templates/new" as Route);
  }

  const deleteError =
    deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : null;

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
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start lg:content-start">
        {loading && <PageLoader />}
        {error && (
          <p className="text-sm text-red-500 text-center mt-10">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
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
                <h3 className=" font-bold text-font-main-sub text-base">
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
                      deleteMutation.reset();
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
          submitting={deleteMutation.isPending}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget)}
        />
      )}
    </>
  );
}
