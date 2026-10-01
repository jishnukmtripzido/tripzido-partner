"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getScheduleTemplateDetailApi,
  updateScheduleTemplateApi,
} from "@/services/fleet.service";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import { ScheduleTemplateForm } from "@/components/features/settings/ScheduleTemplateForm";
import type { ScheduleTemplateDay } from "@/types/listing-create.types";

export default function EditScheduleTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const templateId = searchParams.get("id");

  // Same key as the details page, so opening Edit from there is instant.
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
    mutationFn: async ({
      name,
      days,
    }: {
      name: string;
      days: ScheduleTemplateDay[];
    }) => {
      const res = await updateScheduleTemplateApi(
        Number(templateId),
        name,
        days,
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
      // Back to the template's details page, which refetches the
      // invalidated detail and shows the saved hours.
      router.back();
    },
  });

  return (
    <>
      <Header title="Edit schedule template" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-page-narrow lg:pt-7">
        {detailQuery.isLoading ? (
          <PageLoader />
        ) : detailQuery.error || !detailQuery.data ? (
          <p className="rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-red-600 shadow-sm">
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Template not found"}
          </p>
        ) : (
          <>
            {detailQuery.data.listings_count > 0 && (
              <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
                Used by {detailQuery.data.listings_count} listing
                {detailQuery.data.listings_count === 1 ? "" : "s"} — changes
                apply to all of them.
              </p>
            )}
            <ScheduleTemplateForm
              initialName={detailQuery.data.name}
              initialDays={detailQuery.data.days}
              submitting={updateMutation.isPending}
              error={
                updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : null
              }
              submitLabel="Save changes"
              onSubmit={(name, days) => updateMutation.mutate({ name, days })}
              onCancel={() => router.back()}
            />
          </>
        )}
      </main>
    </>
  );
}
