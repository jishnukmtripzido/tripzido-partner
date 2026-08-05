"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { getVendorPayoutDetailApi } from "@/services/payment.service";
import { PAYOUT_STATUS_STYLES } from "@/lib/payoutStatus";
import { PageLoader } from "@/components/ui/PageLoader";
import type { VendorPayoutDetail } from "@/types/ledger.types";

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
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        {isLoading && <PageLoader />}
        {error && !isLoading && (
          <p className="text-sm text-red-500 text-center mt-10">{error}</p>
        )}

        {payout && !isLoading && (
          <div className="space-y-5">
            <div>
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                  PAYOUT_STATUS_STYLES[payout.status] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {payout.status_label}
              </span>
              <p className="text-3xl  font-extrabold text-font-main-sub mt-3">
                ₹
                {Number(payout.total_amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <Section title="Transfer details">
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
                <Section title="Bank account">
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
              <Section title="Note">
                <p className="text-sm text-font-dim">{payout.note}</p>
              </Section>
            )}

            <Section title={`Bookings covered (${payout.items.length})`}>
              <div className="space-y-3">
                {payout.items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-100 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-font-main-sub">
                        {item.vehicle_name}
                      </p>
                      <p className="text-xs text-font-dim mt-0.5">
                        #{item.booking_reference} • {item.pickup_date} to{" "}
                        {item.dropoff_date}
                      </p>
                    </div>
                    <p className="font-bold text-brand-secondary">
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
          </div>
        )}
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className=" font-bold text-sm text-font-main-sub mb-3">{title}</h2>
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
