"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { createPickupPointApi } from "@/services/fleet.service";
import { PickupPointForm } from "@/components/features/fleet/PickupPointForm";
import { loadReturnTo, clearReturnTo } from "@/lib/listingDraft";
import { queryKeys } from "@/lib/queryKeys";
import { goBackOr } from "@/lib/navigation";
import type { PickupPointPayload } from "@/types/listing-create.types";

function formatFieldErrors(errors?: Record<string, string[]>): string {
  if (!errors) return "";
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(" ")}`)
    .join(" | ");
}

export default function NewPickupPointPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const pickupLocationId = searchParams.get("pickup_location_id");
  const pickupLocationName =
    searchParams.get("pickup_location_name") ?? undefined;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: PickupPointPayload) => {
      const res = await createPickupPointApi(data, token as string);
      if (!res.success) {
        throw new Error(
          formatFieldErrors(res.errors) ||
            res.message ||
            "Failed to create pickup point",
        );
      }
      return res.data;
    },
    onSuccess: () => {
      // Both pages that read the vendor's pickup points — the "Add a
      // bike" wizard/edit-listing dropdown and Settings > Pickup
      // Points — should see this new one on next visit.
      queryClient.invalidateQueries({
        queryKey: queryKeys.fleet.pickupPoints(token),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.pickupPoints(token),
      });
      // Pop this page off the stack (back to Add bike / Edit listing /
      // Settings) — pushing the return page would leave this form in
      // history and loop on the next back press.
      const returnTo = loadReturnTo("/settings/pickup-points");
      clearReturnTo();
      goBackOr(router, returnTo);
    },
  });

  const submitting = createMutation.isPending;
  const error =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : null;

  function goBack() {
    goBackOr(router, loadReturnTo("/settings/pickup-points"));
  }

  function handleSubmit(data: PickupPointPayload) {
    if (!token) return;
    createMutation.mutate(data);
  }

  return (
    <>
      <Header title="New pickup point" onBack={goBack} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-8 bg-brand-bg lg:px-page-narrow lg:pt-7">
        <PickupPointForm
          pickupLocationId={pickupLocationId ? Number(pickupLocationId) : null}
          pickupLocationName={pickupLocationName}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          submitLabel="Save pickup point"
        />
      </main>
    </>
  );
}
