"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getPickupPointDetailApi,
  updatePickupPointApi,
} from "@/services/fleet.service";
import { PickupPointForm } from "@/components/features/fleet/PickupPointForm";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import type { PickupPointPayload } from "@/types/listing-create.types";

function formatFieldErrors(errors?: Record<string, string[]>): string {
  if (!errors) return "";
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(" ")}`)
    .join(" | ");
}

export default function EditPickupPointPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const pointId = searchParams.get("id");

  const detailQuery = useQuery({
    queryKey: queryKeys.settings.pickupPointDetail(token, pointId),
    queryFn: async () => {
      const res = await getPickupPointDetailApi(Number(pointId), token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Not found");
      }
      return res.data;
    },
    enabled: !!token && !!pointId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PickupPointPayload) => {
      const res = await updatePickupPointApi(
        Number(pointId),
        data,
        token as string,
      );
      if (!res.success) {
        throw new Error(
          formatFieldErrors(res.errors) || res.message || "Failed to save",
        );
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.pickupPoints(token),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.pickupPointDetail(token, pointId),
      });
      // Same backend resource is also read by the fleet feature's
      // listing forms — keep that cache entry in sync too.
      queryClient.invalidateQueries({
        queryKey: queryKeys.fleet.pickupPoints(token),
      });
      router.push("/settings/pickup-points" as Route);
    },
  });

  if (detailQuery.isLoading) {
    return (
      <>
        <Header title="Edit pickup point" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <PageLoader />
        </main>
      </>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <>
        <Header title="Edit pickup point" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <p className="text-sm text-red-500 font-semibold text-center bg-red-50 py-3 rounded-xl mx-4">
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Not found"}
          </p>
        </main>
      </>
    );
  }

  const point = detailQuery.data;

  return (
    <>
      <Header title="Edit pickup point" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg">
        <PickupPointForm
          initial={point}
          pickupLocationId={point.pickup_location}
          pickupLocationName={point.pickup_location_name ?? undefined}
          submitting={updateMutation.isPending}
          error={
            updateMutation.error instanceof Error
              ? updateMutation.error.message
              : null
          }
          onSubmit={(data) => updateMutation.mutate(data)}
          submitLabel="Save changes"
        />
      </main>
    </>
  );
}
