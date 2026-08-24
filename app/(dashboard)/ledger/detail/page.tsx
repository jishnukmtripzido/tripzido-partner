"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { getVendorPayoutDetailApi } from "@/services/payment.service";
import { PAYOUT_STATUS_STYLES } from "@/lib/payoutStatus";
import { PageLoader } from "@/components/ui/PageLoader";
import type { VendorPayoutDetail } from "@/types/ledger.types";

// ── Icons — reusing the same vocabulary established elsewhere in this
// portal (Booking Detail, Listing Detail), plus the clipboard icon
// LedgerListItem already uses, for continuity between list and detail. ──

const CLIPBOARD_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
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
const STOREFRONT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
  />
);
const RECEIPT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
  />
);
const VEHICLE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h9l4 5h1a2 2 0 012 2v4h-2M9 17h6"
  />
);

export default function LedgerDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const payoutId = searchParams.get("id");

  const [payout, setPayout] = useState<VendorPayoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !payoutId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getVendorPayoutDetailApi(payoutId, token);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setError(res.message || "Payout not found");
          return;
        }
        setPayout(res.data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load payout",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, payoutId]);

  return (
    <>
      <Header
        title={payout ? `Payout #${payout.id}` : "Payout"}
        onBack={() => router.back()}
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg space-y-4">
        {isLoading && <PageLoader />}
        {error && !isLoading && (
          <p className="text-sm text-red-500 text-center mt-10">{error}</p>
        )}

        {payout && !isLoading && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-yellow/15 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-brand-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {CLIPBOARD_ICON}
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-font-dim">Payout #{payout.id}</p>
                  <span
                    className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mt-0.5 ${
                      PAYOUT_STATUS_STYLES[payout.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {payout.status_label}
                  </span>
                </div>
              </div>
              <p className="text-3xl font-heading font-extrabold text-font-main-sub">
                ₹
                {Number(payout.total_amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <Section title="Transfer details" icon={DEPOSIT_ICON}>
              <Row
                label="UTR number"
                value={payout.utr_number || "Not recorded yet"}
              />
              <Row
                label="Paid on"
                value={
                  payout.paid_at
                    ? new Date(payout.paid_at).toLocaleString("en-IN")
                    : "Pending"
                }
              />
              {payout.period_start && payout.period_end && (
                <Row
                  label="Period"
                  value={`${payout.period_start} to ${payout.period_end}`}
                />
              )}
            </Section>

            {payout.bank_account_snapshot &&
              Object.keys(payout.bank_account_snapshot).length > 0 && (
                <Section title="Bank account" icon={STOREFRONT_ICON}>
                  {Object.entries(payout.bank_account_snapshot).map(
                    ([key, value]) => (
                      <Row
                        key={key}
                        label={key.replace(/_/g, " ")}
                        value={String(value)}
                      />
                    ),
                  )}
                </Section>
              )}

            {payout.note && (
              <Section title="Note" icon={RECEIPT_ICON}>
                <p className="text-sm text-font-dim">{payout.note}</p>
              </Section>
            )}

            <Section
              title={`Bookings covered (${payout.items.length})`}
              icon={VEHICLE_ICON}
            >
              <div className="space-y-3">
                {payout.items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-100 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {VEHICLE_ICON}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-font-main-sub truncate">
                        {item.vehicle_name}
                      </p>
                      <p className="text-xs text-font-dim mt-0.5">
                        #{item.booking_reference} • {item.pickup_date} to{" "}
                        {item.dropoff_date}
                      </p>
                    </div>
                    <p className="font-bold text-brand-secondary shrink-0">
                      ₹{item.amount}
                    </p>
                  </div>
                ))}
                {payout.items.length === 0 && (
                  <p className="text-sm text-font-dim">
                    No bookings attached yet.
                  </p>
                )}
              </div>
            </Section>
          </>
        )}
      </main>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow-lg flex items-center justify-center shrink-0">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
        </div>
        <h2 className="font-heading font-bold text-sm text-font-main-sub">
          {title}
        </h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-font-dim capitalize">{label}</span>
      <span className="font-medium text-font-main-sub text-right">{value}</span>
    </div>
  );
}
