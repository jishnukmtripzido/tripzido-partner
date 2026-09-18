"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorTermsApi,
  saveVendorTermsApi,
} from "@/services/settings.service";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import type { VendorTerms } from "@/types/settings.types";

// Terms content is read-only aside from this editor and rarely
// changes — a longer staleTime avoids refetching it on every visit.
const TERMS_STALE_TIME_MS = 5 * 60 * 1000;

// ── Icons — same mapping as Listing Detail's Policies section, for
// consistency between the editor here and the read-only display there. ──

const TAG_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8A1 1 0 012 10.586V5a2 2 0 012-2z"
  />
);
const DEPOSIT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"
  />
);
const CALENDAR_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  />
);
const DISTANCE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
  />
);
const ALERT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  />
);
const CLOCK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
  />
);
const CHECK_CIRCLE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
  />
);

export default function VendorTermsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.settings.terms();
  const termsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getVendorTermsApi(token as string);
      // No terms saved yet is a normal, non-error state (vendor hasn't
      // submitted any) — only a thrown/network error should surface as
      // an error state here.
      if (res.success && res.data) return res.data;
      return null;
    },
    enabled: !!token,
    staleTime: TERMS_STALE_TIME_MS,
  });

  if (termsQuery.isLoading) {
    return (
      <>
        <Header title="Terms & Conditions" onBack={() => router.back()} />
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg space-y-4">
          <PageLoader />
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Terms & Conditions" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg space-y-4">
        <TermsEditor
          token={token}
          initial={termsQuery.data ?? null}
          queryClient={queryClient}
          queryKey={queryKey}
        />
      </main>
    </>
  );
}

// Mounted once the terms load has settled, so its local field state is
// seeded exactly once from `initial` (null when the vendor hasn't
// submitted terms yet).
function TermsEditor({
  token,
  initial,
  queryClient,
  queryKey,
}: {
  token: string | null;
  initial: VendorTerms | null;
  queryClient: QueryClient;
  queryKey: QueryKey;
}) {
  const [version, setVersion] = useState<number | null>(
    initial?.version ?? null,
  );
  const [termsItems, setTermsItems] = useState<string[]>(
    initial && initial.terms_items.length > 0 ? initial.terms_items : [""],
  );
  const [securityDepositNote, setSecurityDepositNote] = useState(
    initial?.security_deposit_note ?? "",
  );
  const [operatingHoursNote, setOperatingHoursNote] = useState(
    initial?.operating_hours_note ?? "",
  );
  const [distanceLimitNote, setDistanceLimitNote] = useState(
    initial?.distance_limit_note ?? "",
  );
  const [excessChargeNote, setExcessChargeNote] = useState(
    initial?.excess_charge_note ?? "",
  );
  const [latePenaltyNote, setLatePenaltyNote] = useState(
    initial?.late_penalty_note ?? "",
  );
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await saveVendorTermsApi(
        {
          terms_items: termsItems.map((t) => t.trim()).filter(Boolean),
          security_deposit_note: securityDepositNote,
          operating_hours_note: operatingHoursNote,
          distance_limit_note: distanceLimitNote,
          excess_charge_note: excessChargeNote,
          late_penalty_note: latePenaltyNote,
        },
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to save terms");
      }
      return res.data;
    },
    onMutate: () => setSaved(false),
    onSuccess: (data) => {
      setVersion(data.version);
      setSaved(true);
      queryClient.setQueryData(queryKey, data);
    },
  });

  function updateItem(index: number, value: string) {
    setTermsItems((prev) =>
      prev.map((item, i) => (i === index ? value : item)),
    );
  }
  function addItem() {
    setTermsItems((prev) => [...prev, ""]);
  }
  function removeItem(index: number) {
    setTermsItems((prev) => prev.filter((_, i) => i !== index));
  }

  const error =
    saveMutation.error instanceof Error ? saveMutation.error.message : null;

  return (
    <>
      {version !== null && (
        <div className="flex justify-end">
          <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
            Current version: v{version}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow-lg flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {TAG_ICON}
            </svg>
          </div>
          <h2 className="font-heading font-bold text-sm text-font-main-sub">
            Terms items
          </h2>
        </div>

        <div className="space-y-2.5">
          {termsItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-6 h-6 mt-1.5 rounded-full bg-brand-yellow/15 text-brand-yellow-lg flex items-center justify-center text-[11px] font-bold shrink-0">
                {i + 1}
              </div>
              <textarea
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder="e.g. One day is 9am to 9am"
                rows={2}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-y"
              />
              <button
                onClick={() => removeItem(i)}
                aria-label="Remove item"
                className="w-8 h-8 mt-1 shrink-0 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-lg font-bold flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-semibold text-font-dim hover:border-brand-yellow hover:text-brand-secondary transition-colors mt-3"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-heading font-bold text-sm text-font-main-sub">
          Policy notes
        </h2>

        <NoteField
          icon={DEPOSIT_ICON}
          label="Security deposit note"
          value={securityDepositNote}
          onChange={setSecurityDepositNote}
        />
        <NoteField
          icon={CALENDAR_ICON}
          label="Operating hours note"
          value={operatingHoursNote}
          onChange={setOperatingHoursNote}
        />
        <NoteField
          icon={DISTANCE_ICON}
          label="Distance limit note"
          value={distanceLimitNote}
          onChange={setDistanceLimitNote}
        />
        <NoteField
          icon={ALERT_ICON}
          label="Excess charge note"
          value={excessChargeNote}
          onChange={setExcessChargeNote}
        />
        <NoteField
          icon={CLOCK_ICON}
          label="Late penalty note"
          value={latePenaltyNote}
          onChange={setLatePenaltyNote}
        />
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
      {saved && (
        <div className="flex items-center gap-3 bg-brand-yellow/10 rounded-xl p-3.5">
          <div className="w-8 h-8 rounded-full bg-brand-yellow text-brand-secondary flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {CHECK_CIRCLE_ICON}
            </svg>
          </div>
          <p className="text-sm font-semibold text-font-main-sub">
            Saved as a new version.
          </p>
        </div>
      )}

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
      >
        {saveMutation.isPending ? "Saving..." : "Save"}
      </button>
    </>
  );
}

function NoteField({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-md bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
        </div>
        <label className="text-xs font-semibold text-gray-600">{label}</label>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
      />
    </div>
  );
}
