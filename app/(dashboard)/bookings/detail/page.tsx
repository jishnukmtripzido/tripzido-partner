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
    <>
      <Header
        title={booking ? `#${booking.booking_reference}` : "Booking"}
        onBack={() => router.back()}
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        {isLoading && (
          <p className="text-sm text-font-dim text-center mt-10">Loading...</p>
        )}
        {error && !isLoading && (
          <p className="text-sm text-red-500 text-center mt-10">{error}</p>
        )}

        {booking && !isLoading && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                {booking.vehicle_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.vehicle_image}
                    alt={booking.vehicle_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-7 h-7 text-gray-300"
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
              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-bold text-base text-font-main-sub truncate">
                  {booking.vehicle_name}
                </h2>
                <p className="text-xs text-font-dim">
                  {booking.transmission_type} • {booking.fuel_type}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                  STATUS_BADGE_STYLES[booking.status] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {booking.status_label}
              </span>
            </div>

            {booking.is_offline && (
              <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                Offline booking
              </span>
            )}

            <Section title="Customer">
              <p className="font-semibold text-font-main-sub text-sm">
                {booking.customer_name}
              </p>
              <p className="text-sm text-font-dim mt-0.5">
                {booking.customer_phone}
              </p>
            </Section>

            <Section title="Trip details">
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

            <Section title="Payment">
              <Row label="Mode" value={booking.payment_mode_label} />
              <Row label="Rent amount" value={`₹${booking.listing_amount}`} />
              <Row label="Paid" value={`₹${booking.advance_amount}`} />
              <Row label="Remaining" value={`₹${booking.remaining_amount}`} />
              <Row
                label="Security deposit"
                value={`₹${booking.security_deposit_amount}`}
              />
            </Section>

            {booking.payments.length > 0 && (
              <Section title="Payment history">
                <div className="space-y-2">
                  {booking.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-font-main-sub">
                          {p.payment_type} • {p.status}
                        </p>
                        <p className="text-xs text-font-dim">
                          {p.gateway_order_id}
                        </p>
                      </div>
                      <p className="font-bold text-brand-secondary">
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

            {booking.available_next_statuses.length > 0 && (
              <div className="flex gap-3 pt-2">
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
                      className={`flex-1 text-sm font-bold py-3 rounded-xl ${
                        config.destructive
                          ? "bg-red-50 text-red-600"
                          : "bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg"
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
      <h2 className="font-heading font-bold text-sm text-font-main-sub mb-3">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-font-dim">{label}</span>
      <span className="font-medium text-font-main-sub text-right">{value}</span>
    </div>
  );
}
