"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorBookingDetailApi,
  updateVendorBookingStatusApi,
} from "@/services/booking.service";
import { ConfirmStatusChangeModal } from "@/components/features/bookings/ConfirmStatusChangeModal";
import { STATUS_BADGE_STYLES, STATUS_ACTION_CONFIG } from "@/lib/bookingStatus";
import type { VendorBookingDetail, BookingStatus } from "@/types/booking.types";
import { PageLoader } from "@/components/ui/PageLoader";

export default function BookingDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const bookingId = searchParams.get("id");

  const [booking, setBooking] = useState<VendorBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionStatus, setActionStatus] = useState<BookingStatus | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !bookingId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getVendorBookingDetailApi(bookingId, token);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setError(res.message || "Booking not found");
          return;
        }
        setBooking(res.data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load booking",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, bookingId]);

  async function handleConfirmAction() {
    if (!actionStatus || !token || !bookingId) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      const res = await updateVendorBookingStatusApi(
        bookingId,
        actionStatus,
        token,
      );
      if (!res.success || !res.data) {
        setActionError(res.message || "Failed to update status");
        return;
      }
      setBooking(res.data);
      setActionStatus(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <div className="bg-[#F4F2EE] min-h-screen flex flex-col">
      <Header
        // Removed the '#' prefix as requested
        title={booking ? booking.booking_reference : "Booking Detail"}
        onBack={() => router.back()}
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-8">
        {isLoading && <PageLoader />}

        {error && !isLoading && (
          <p className="text-[13px] text-red-500 font-semibold text-center mt-10 bg-red-50 py-3 rounded-xl mx-4">
            {error}
          </p>
        )}

        {booking && !isLoading && (
          <div className="space-y-4">
            {/* Main Vehicle Card */}
            <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center p-1.5">
                {booking.vehicle_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.vehicle_image}
                    alt={booking.vehicle_name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0 py-1">
                <h2 className=" font-bold text-[16px] text-gray-900 truncate mb-1">
                  {booking.vehicle_name}
                </h2>

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${
                      STATUS_BADGE_STYLES[booking.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {booking.status_label}
                  </span>
                </div>

                <p className="text-[12px] font-medium text-gray-500">
                  {booking.transmission_type} • {booking.fuel_type}
                </p>
              </div>
            </div>

            {booking.is_offline && (
              <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 flex items-center justify-between">
                <span className="text-[13px] font-bold text-gray-700">
                  Booking Type
                </span>
                <span className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 uppercase tracking-wide">
                  Offline
                </span>
              </div>
            )}

            <Section title="Customer">
              <div className="flex justify-between items-center">
                <p className="font-bold text-gray-900 text-[14px]">
                  {booking.customer_name}
                </p>
                <p className="text-[13px] font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                  {booking.customer_phone}
                </p>
              </div>
            </Section>

            <Section title="Trip Details">
              <Row
                label="Pickup"
                value={new Date(booking.start_date).toLocaleString()}
              />
              <Row
                label="Drop-off"
                value={new Date(booking.end_date).toLocaleString()}
              />
              <Row label="Duration" value={booking.duration} />
              <Row
                label="Location"
                value={
                  booking.pickup_location_address
                    ? `${booking.pickup_location_name}, ${booking.pickup_location_address}`
                    : booking.pickup_location_name
                }
              />
              {booking.package_name && (
                <Row label="Package" value={booking.package_name} />
              )}
            </Section>

            <Section title="Payment Summary">
              <Row label="Mode" value={booking.payment_mode_label} />
              <Row label="Rent amount" value={`₹${booking.listing_amount}`} />
              <Row label="Paid" value={`₹${booking.advance_amount}`} />
              <Row label="Remaining" value={`₹${booking.remaining_amount}`} />
              <div className="pt-2 mt-2 border-t border-gray-50">
                <Row
                  label="Security deposit"
                  value={`₹${booking.security_deposit_amount}`}
                />
              </div>
            </Section>

            {booking.payments.length > 0 && (
              <Section title="Payment History">
                <div className="space-y-3">
                  {booking.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-[13px] border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-bold text-gray-900 mb-0.5">
                          {p.payment_type} • {p.status}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500">
                          ID: {p.gateway_order_id}
                        </p>
                      </div>
                      <p className="font-bold text-[14px] text-[#D4A33B] bg-[#FFF6E0] px-3 py-1.5 rounded-lg">
                        ₹{p.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {booking.cancellation && (
              <Section title="Cancellation">
                <Row label="Reason" value={booking.cancellation.reason_label} />
                {booking.cancellation.reason_text && (
                  <Row
                    label="Details"
                    value={booking.cancellation.reason_text}
                  />
                )}
                <Row
                  label="Refund %"
                  value={`${booking.cancellation.refund_percentage}%`}
                />
                <Row
                  label="Refundable"
                  value={`₹${booking.cancellation.refundable_amount}`}
                />
                <Row
                  label="Forfeited"
                  value={`₹${booking.cancellation.forfeited_amount}`}
                />
              </Section>
            )}

            {/* Action Buttons */}
            {booking.available_next_statuses.length > 0 && (
              <div className="flex gap-3 pt-4">
                {booking.available_next_statuses.map((target) => {
                  const config = STATUS_ACTION_CONFIG[target];
                  if (!config) return null;
                  return (
                    <button
                      key={target}
                      onClick={() => {
                        setActionStatus(target);
                        setActionError(null);
                      }}
                      className={`flex-1 text-[13px] font-bold py-3.5 rounded-xl transition-all shadow-sm ${
                        config.destructive
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-[#FFD166] text-[#242A38] hover:bg-[#ffc63b]"
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {actionStatus && (
        <ConfirmStatusChangeModal
          targetStatus={actionStatus}
          submitting={actionSubmitting}
          error={actionError}
          onCancel={() => setActionStatus(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}

// --- Helper Components ---

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50">
      <h2 className=" font-bold text-[15px] text-gray-900 mb-4 pb-3 border-b border-gray-50">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-start gap-4 text-[13px]">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-bold text-gray-900 text-right">{value}</span>
    </div>
  );
}
