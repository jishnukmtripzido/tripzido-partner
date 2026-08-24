"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { createPickupPointApi } from "@/services/fleet.service";
import { PickupPointForm } from "@/components/features/fleet/PickupPointForm";
import { loadReturnTo, clearReturnTo } from "@/lib/listingDraft";
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goBack() {
    router.push(loadReturnTo("/settings/pickup-points") as Route);
  }

  async function handleSubmit(data: PickupPointPayload) {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createPickupPointApi(data, token);
      if (!res.success) {
        setError(
          formatFieldErrors(res.errors) ||
            res.message ||
            "Failed to create pickup point",
        );
        return;
      }
      const returnTo = loadReturnTo("/settings/pickup-points");
      clearReturnTo();
      router.push(returnTo as Route);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create pickup point",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header title="New pickup point" onBack={goBack} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg">
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
