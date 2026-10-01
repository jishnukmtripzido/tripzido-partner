"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { createScheduleTemplateApi } from "@/services/fleet.service";
import { loadReturnTo, clearReturnTo } from "@/lib/listingDraft";
import { queryKeys } from "@/lib/queryKeys";
import { goBackOr } from "@/lib/navigation";
import { ScheduleTemplateForm } from "@/components/features/settings/ScheduleTemplateForm";
import type { ScheduleTemplateDay } from "@/types/listing-create.types";

export default function NewScheduleTemplatePage() {
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({
      name,
      days,
    }: {
      name: string;
      days: ScheduleTemplateDay[];
    }) => {
      const res = await createScheduleTemplateApi(name, days, token as string);
      if (!res.success) {
        throw new Error(res.message || "Failed to create schedule template");
      }
      return res.data;
    },
    onSuccess: () => {
      // Both the "Add a bike" wizard/edit-listing dropdown and
      // Settings > Schedule Templates read the vendor's schedule
      // templates — invalidate both so they pick up the new one.
      queryClient.invalidateQueries({
        queryKey: queryKeys.fleet.scheduleTemplates(token),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.scheduleTemplates(token),
      });
      // Pop this page off the stack — pushing the return page would
      // leave this form in history and loop on the next back press.
      const returnTo = loadReturnTo("/fleet/listing/new");
      clearReturnTo();
      goBackOr(router, returnTo);
    },
  });

  function goBack() {
    // Whichever page navigated here (create wizard, edit listing or
    // Settings) left its return path in sessionStorage — falls back to
    // the create wizard if that's somehow missing.
    goBackOr(router, loadReturnTo("/fleet/listing/new"));
  }

  return (
    <>
      <Header title="New schedule template" onBack={goBack} />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-page-narrow lg:pt-7">
        <p className="mb-4 px-1 text-xs text-font-dim">
          Set your opening hours once and reuse them across listings.
        </p>
        <ScheduleTemplateForm
          submitting={createMutation.isPending}
          error={
            createMutation.error instanceof Error
              ? createMutation.error.message
              : null
          }
          submitLabel="Save template"
          onSubmit={(name, days) => {
            if (!token) return;
            createMutation.mutate({ name, days });
          }}
          onCancel={goBack}
        />
      </main>
    </>
  );
}
