"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getPickupPointDetailApi,
  updatePickupPointApi,
} from "@/services/fleet.service";
import { PickupPointForm } from "@/components/features/fleet/PickupPointForm";
import { PageLoader } from "@/components/ui/PageLoader";
import type {
  PickupPoint,
  PickupPointPayload,
} from "@/types/listing-create.types";

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
  const pointId = searchParams.get("id");

  const [point, setPoint] = useState<PickupPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !pointId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPickupPointDetailApi(Number(pointId), token);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setLoadError(res.message || "Not found");
          return;
        }
        setPoint(res.data);
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
  }, [token, pointId]);

  async function handleSubmit(data: PickupPointPayload) {
    if (!token || !pointId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await updatePickupPointApi(Number(pointId), data, token);
      if (!res.success) {
        setError(
          formatFieldErrors(res.errors) || res.message || "Failed to save",
        );
        return;
      }
      router.push("/settings/pickup-points" as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Edit pickup point" onBack={() => router.back()} />
        <PageLoader />
      </>
    );
  }

  if (loadError || !point) {
    return (
      <>
        <Header title="Edit pickup point" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <p className="text-sm text-red-500 text-center">{loadError}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Edit pickup point" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <PickupPointForm
          initial={point}
          pickupLocationId={point.pickup_location}
          pickupLocationName={point.pickup_location_name ?? undefined}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
        />
      </main>
    </>
  );
}
