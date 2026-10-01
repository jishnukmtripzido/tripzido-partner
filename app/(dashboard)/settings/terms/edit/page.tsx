"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { saveVendorTermsApi } from "@/services/settings.service";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import type { VendorTerms } from "@/types/settings.types";
import {
  POLICY_NOTE_FIELDS,
  useVendorTerms,
} from "@/components/features/settings/vendorTerms";

const INPUT_CLASS =
  "w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-medium text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors";

export default function EditVendorTermsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { data: terms, isLoading } = useVendorTerms(token);

  return (
    <>
      <Header
        title={terms ? "Edit terms" : "Add terms"}
        onBack={() => router.back()}
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-8 bg-brand-bg">
        {isLoading ? (
          <PageLoader />
        ) : (
          <TermsEditor
            token={token}
            initial={terms ?? null}
            onSaved={() => router.back()}
            onCancel={() => router.back()}
          />
        )}
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
  onSaved,
  onCancel,
}: {
  token: string | null;
  initial: VendorTerms | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();

  const [termsItems, setTermsItems] = useState<string[]>(
    initial && initial.terms_items.length > 0 ? initial.terms_items : [""],
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      POLICY_NOTE_FIELDS.map((f) => [f.key, initial?.[f.key] ?? ""]),
    ),
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await saveVendorTermsApi(
        {
          terms_items: termsItems.map((t) => t.trim()).filter(Boolean),
          security_deposit_note: notes.security_deposit_note,
          operating_hours_note: notes.operating_hours_note,
          distance_limit_note: notes.distance_limit_note,
          excess_charge_note: notes.excess_charge_note,
          late_penalty_note: notes.late_penalty_note,
        },
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to save terms");
      }
      return res.data;
    },
    onSuccess: (data) => {
      // The details page reads this same cache entry, so it shows the
      // new version as soon as we navigate back to it.
      queryClient.setQueryData(queryKeys.settings.terms(), data);
      onSaved();
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
  const filledItems = termsItems.filter((t) => t.trim()).length;

  return (
    <div className="space-y-5">
      {initial && (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </span>
          <p className="min-w-0 flex-1 text-xs text-font-dim">
            Editing <span className="font-semibold text-font-main-sub">v{initial.version}</span>.
            Saving creates v{initial.version + 1}.
          </p>
        </div>
      )}

      {/* Terms items */}
      <section>
        <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
          Terms · {filledItems}
        </h2>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="space-y-2.5">
            {termsItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-[11px] font-bold text-brand-yellow">
                  {i + 1}
                </span>
                <textarea
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                  placeholder="e.g. One day is 9am to 9am"
                  rows={2}
                  className={`${INPUT_CLASS} flex-1 resize-y`}
                />
                <button
                  onClick={() => removeItem(i)}
                  aria-label={`Remove term ${i + 1}`}
                  className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 active:bg-red-100 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-3 text-sm font-semibold text-font-main-sub active:bg-gray-50 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add term
          </button>
        </div>
      </section>

      {/* Policy notes */}
      <section>
        <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
          Policy notes
        </h2>
        <div className="space-y-4 rounded-2xl bg-white p-3 shadow-sm">
          {POLICY_NOTE_FIELDS.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="mb-1.5 flex items-center gap-2 px-1"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-font-dim">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {field.icon}
                  </svg>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                  {field.label}
                </span>
              </label>
              <textarea
                id={field.key}
                value={notes[field.key]}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCancel}
          disabled={saveMutation.isPending}
          className="rounded-xl bg-white py-3.5 text-sm font-semibold text-font-main-sub shadow-sm active:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="rounded-xl bg-brand-secondary py-3.5 text-sm font-semibold text-brand-yellow shadow-sm active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
