"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  POLICY_NOTE_FIELDS,
  useVendorTerms,
} from "@/components/features/settings/vendorTerms";

export default function VendorTermsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { data: terms, isLoading, error, refetch } = useVendorTerms(token);

  const goToEdit = () => router.push("/settings/terms/edit" as Route);
  const hasTerms = !!terms;

  return (
    <>
      <Header
        title="Terms & Conditions"
        onBack={() => router.back()}
        rightSlot={
          hasTerms && (
            <button
              onClick={goToEdit}
              className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm active:opacity-80 transition-opacity shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit
            </button>
          )
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-8 bg-brand-bg lg:px-page-narrow lg:pt-7">
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <div className="mt-2 rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-red-500">
              {error instanceof Error ? error.message : "Failed to load terms"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-yellow active:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        ) : !terms ? (
          <div className="mt-2 flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
              <DocumentIcon />
            </span>
            <p className="text-sm font-semibold text-font-main-sub">
              No terms added yet
            </p>
            <p className="mt-1 text-xs text-font-dim">
              Your terms are shown to customers on every listing. Add them so
              customers know your rules before they book.
            </p>
            <button
              onClick={goToEdit}
              className="mt-4 rounded-xl bg-brand-secondary px-4 py-2.5 text-sm font-semibold text-brand-yellow active:opacity-80 transition-opacity"
            >
              Add terms
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary */}
            <section className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
                <DocumentIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[15px] font-bold text-font-main-sub">
                  Your rental terms
                </p>
                <p className="text-xs text-font-dim">
                  Shown to customers on every listing
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-yellow/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-secondary">
                v{terms.version}
              </span>
            </section>

            {/* Terms items */}
            <section>
              <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                Terms · {terms.terms_items.length}
              </h2>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                {terms.terms_items.length === 0 ? (
                  <p className="px-1 py-1 text-sm text-font-dim">
                    No terms items added.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {terms.terms_items.map((item, i) => (
                      <li key={i} className="flex gap-3 px-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-[11px] font-bold text-brand-yellow">
                          {i + 1}
                        </span>
                        <p className="min-w-0 flex-1 whitespace-pre-line break-words pt-0.5 text-sm leading-relaxed text-font-main-sub">
                          {item}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>

            {/* Policy notes */}
            <section>
              <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                Policy notes
              </h2>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                {POLICY_NOTE_FIELDS.map((field) => {
                  const note = terms[field.key];
                  return (
                    <div
                      key={field.key}
                      className="mt-2 flex items-start gap-3 px-1 py-1.5 first:mt-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          {field.icon}
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-font-dim">{field.label}</p>
                        <p
                          className={`whitespace-pre-line break-words text-sm ${
                            note
                              ? "font-semibold text-font-main-sub"
                              : "text-font-dim/70"
                          }`}
                        >
                          {note || "Not added"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <p className="px-2 text-center text-xs text-font-dim">
              Each time you edit and save, a new version is created.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function DocumentIcon() {
  return (
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
