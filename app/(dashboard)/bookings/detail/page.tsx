"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorBookingDetailApi,
  updateVendorBookingStatusApi,
  cancelVendorBookingApi,
} from "@/services/booking.service";
import { ConfirmStatusChangeModal } from "@/components/features/bookings/ConfirmStatusChangeModal";
import { PinVerificationModal } from "@/components/features/bookings/PinVerificationModal";
import { VendorCancelBookingModal } from "@/components/features/bookings/VendorCancelBookingModal";
import { STATUS_BADGE_STYLES, STATUS_ACTION_CONFIG } from "@/lib/bookingStatus";
import type {
  BookingStatus,
  VendorCancellationReasonCode,
} from "@/types/booking.types";
import { queryKeys } from "@/lib/queryKeys";
import { PageLoader } from "@/components/ui/PageLoader";

// ── Icons — reusing the same vocabulary established elsewhere in this
// portal (calendar = schedule, clock = timing). ────────────────────────

const CLOCK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
const RECEIPT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
const PIN_ICON = (
  <>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </>
);
const TAG_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8A1 1 0 012 10.586V5a2 2 0 012-2z"
  />
);
const PHONE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.2l-1.9.95a11 11 0 005.2 5.2l.95-1.9a1 1 0 011.2-.5l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.27 21 3 14.73 3 7V5z"
  />
);
const HANDOVER_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M5 13l4 4L19 7"
  />
);

// Same date/time split as BookingListCard, so a booking reads the same
// in the list and on its detail page.
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(value: string): string {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

// "AUTOMATIC" → "Automatic", "ADVANCE_PAYMENT" → "Advance Payment".
function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return initials || "?";
}

export default function BookingDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const bookingId = searchParams.get("id");

  const [actionStatus, setActionStatus] = useState<BookingStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQueryKey = queryKeys.bookings.detail(token, bookingId);

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: detailQueryKey,
    queryFn: async () => {
      const res = await getVendorBookingDetailApi(
        bookingId as string,
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Booking not found");
      }
      return res.data;
    },
    enabled: !!token && !!bookingId,
  });

  // Shared by every transition EXCEPT cancelling (needs a reason + the
  // refund accounting, see cancelMutation/handleCancelBooking) — that
  // one goes through a dedicated endpoint. Both plain status changes
  // (handleConfirmAction) and starting a trip (handleStartTrip, which
  // needs a PIN) hit the same status endpoint, so they share this
  // mutation and only differ in the fallback error message.
  const statusMutation = useMutation({
    mutationFn: async ({
      status,
      pin,
    }: {
      status: BookingStatus;
      pin?: string;
    }) => {
      const res = await updateVendorBookingStatusApi(
        bookingId as string,
        status,
        token as string,
        pin,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "");
      }
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(detailQueryKey, data);
      queryClient.invalidateQueries({ queryKey: ["bookings", "list"] });
      setActionStatus(null);
    },
  });

  // Vendor-initiated cancellation goes through the dedicated cancel
  // endpoint (CancellationService.cancel_booking_by_vendor), not the
  // generic status-update endpoint — that one only flips `status` and
  // skips the refund calc, BookingCancellation record, and staff
  // notification that this flow needs.
  const cancelMutation = useMutation({
    mutationFn: async ({
      reasonCode,
      reasonText,
    }: {
      reasonCode: VendorCancellationReasonCode;
      reasonText: string;
    }) => {
      const res = await cancelVendorBookingApi(
        bookingId as string,
        reasonCode,
        reasonText,
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "");
      }
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(detailQueryKey, data);
      queryClient.invalidateQueries({ queryKey: ["bookings", "list"] });
      setActionStatus(null);
    },
  });

  const actionSubmitting = statusMutation.isPending || cancelMutation.isPending;

  // Used for every transition EXCEPT starting a trip (needs a PIN, see
  // handleStartTrip) and cancelling (needs a reason + the refund
  // accounting, see handleCancelBooking) — those two get their own
  // handlers and their own modals below.
  function handleConfirmAction() {
    if (!actionStatus || !token || !bookingId) return;
    setActionError(null);
    statusMutation.mutate(
      { status: actionStatus },
      {
        onError: (err) =>
          setActionError(
            err instanceof Error && err.message
              ? err.message
              : "Failed to update status",
          ),
      },
    );
  }

  // Starting a trip requires the customer's 4-digit verification PIN
  // — the backend rejects the transition entirely if it's wrong, so
  // a mismatch here just surfaces the server's error inline rather
  // than closing the modal.
  function handleStartTrip(pin: string) {
    if (!token || !bookingId) return;
    setActionError(null);
    statusMutation.mutate(
      { status: "ONGOING", pin },
      {
        onError: (err) =>
          setActionError(
            err instanceof Error && err.message
              ? err.message
              : "Incorrect PIN. Please try again.",
          ),
      },
    );
  }

  function handleCancelBooking(
    reasonCode: VendorCancellationReasonCode,
    reasonText: string,
  ) {
    if (!token || !bookingId) return;
    setActionError(null);
    cancelMutation.mutate(
      { reasonCode, reasonText },
      {
        onError: (err) =>
          setActionError(
            err instanceof Error && err.message
              ? err.message
              : "Failed to cancel booking",
          ),
      },
    );
  }

  const remaining = booking ? Number(booking.remaining_amount) : 0;
  const hasDue = Number.isFinite(remaining) && remaining > 0;

  return (
    <div className="flex h-full flex-col bg-brand-bg">
      <Header
        title={booking ? booking.booking_reference : "Booking Detail"}
        onBack={() => router.back()}
      />

      <main className="min-h-0 flex-1 overflow-y-auto hide-scrollbar px-5 pb-8 pt-4 sm:px-6 sm:pt-6">
        {isLoading && <PageLoader />}

        {error && !isLoading && (
          <p className="mx-auto mt-6 max-w-xl rounded-2xl bg-white shadow-sm px-4 py-4 text-center text-sm font-semibold text-red-600">
            {error instanceof Error ? error.message : "Failed to load booking"}
          </p>
        )}

        {booking && !isLoading && (
          <div className="mx-auto max-w-4xl space-y-5">
            {/* Vehicle + status */}
            <section className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 p-1.5">
                  {booking.vehicle_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={booking.vehicle_image}
                      alt={booking.vehicle_name}
                      className="h-full w-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    <svg
                      className="h-8 w-8 text-font-dim/50"
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

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-font-dim truncate">
                    #{booking.booking_reference}
                  </p>
                  <h2 className="mt-0.5 truncate font-heading text-lg font-bold text-font-main-sub">
                    {booking.vehicle_name}
                  </h2>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      STATUS_BADGE_STYLES[booking.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {booking.status_label}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 px-0.5 pt-3">
                {[booking.transmission_type, booking.fuel_type]
                  .filter(Boolean)
                  .map((chip) => (
                    <span
                      key={chip}
                      className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-font-dim"
                    >
                      {toTitleCase(chip)}
                    </span>
                  ))}
                {booking.is_offline && (
                  <span className="rounded-lg bg-brand-secondary px-2.5 py-1 text-xs font-semibold text-brand-yellow">
                    Offline booking
                  </span>
                )}
              </div>
            </section>

            {/* Status actions */}
            {booking.available_next_statuses.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      className={`min-h-12 rounded-xl px-4 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary ${
                        config.destructive
                          ? "bg-white text-red-600 active:bg-red-50"
                          : "bg-brand-secondary text-brand-yellow active:opacity-80"
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Trip */}
            <Section title="Trip">
              <div className="rounded-xl bg-brand-bg p-3">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
                      Pickup
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold text-font-main-sub">
                      {formatDate(booking.start_date)}
                    </p>
                    <p className="text-xs text-font-dim">
                      {formatTime(booking.start_date)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-1 px-1">
                    {booking.duration && (
                      <span className="max-w-24 rounded-xl bg-white px-2 py-0.5 text-center text-[10px] font-bold leading-tight text-font-main-sub shadow-sm">
                        {booking.duration}
                      </span>
                    )}
                    <svg
                      className="h-4 w-4 text-brand-yellow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
                      Return
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold text-font-main-sub">
                      {formatDate(booking.end_date)}
                    </p>
                    <p className="text-xs text-font-dim">
                      {formatTime(booking.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              <IconRow
                icon={PIN_ICON}
                label={booking.pickup_location_name}
                hint={booking.pickup_location_address || undefined}
              />
              {booking.package_name && (
                <IconRow
                  icon={TAG_ICON}
                  label={booking.package_name}
                  hint="Package"
                />
              )}
              {booking.handed_over_at && (
                <IconRow
                  icon={HANDOVER_ICON}
                  label="Handed over"
                  hint={formatDateTime(booking.handed_over_at)}
                />
              )}
              {booking.returned_at && (
                <IconRow
                  icon={CLOCK_ICON}
                  label="Returned"
                  hint={formatDateTime(booking.returned_at)}
                />
              )}
            </Section>

            {/* Customer */}
            <Section title="Customer">
              <div className="flex items-center gap-3 px-1 py-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-secondary font-heading text-sm font-bold text-brand-yellow">
                  {getInitials(booking.customer_name ?? "")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-font-main-sub">
                    {booking.customer_name}
                  </p>
                  <p className="truncate text-xs text-font-dim">
                    {booking.customer_phone}
                  </p>
                </div>
                {booking.customer_phone && (
                  <a
                    href={`tel:${booking.customer_phone}`}
                    aria-label={`Call ${booking.customer_name}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary active:bg-brand-yellow transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {PHONE_ICON}
                    </svg>
                  </a>
                )}
              </div>
            </Section>

            {/* Payment */}
            <Section title="Payment">
              <div className="space-y-2.5 px-1 pt-1">
                <Row label="Mode" value={booking.payment_mode_label} />
                <Row label="Rent amount" value={`₹${booking.listing_amount}`} />
                <Row label="Paid" value={`₹${booking.advance_amount}`} />
              </div>
              <div
                className={`mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-3 ${
                  hasDue ? "bg-brand-yellow/25" : "bg-brand-bg"
                }`}
              >
                <span className="text-sm font-semibold text-font-main-sub">
                  {hasDue ? "Remaining to collect" : "Remaining"}
                </span>
                <span className="font-heading text-lg font-bold tabular-nums text-font-main-sub">
                  ₹{booking.remaining_amount}
                </span>
              </div>
              <IconRow
                icon={DEPOSIT_ICON}
                label="Security deposit"
                trailing={`₹${booking.security_deposit_amount}`}
              />
            </Section>

            {booking.payments.length > 0 && (
              <Section title="Payment history">
                {booking.payments.map((p) => (
                  <IconRow
                    key={p.id}
                    icon={RECEIPT_ICON}
                    label={`${toTitleCase(p.payment_type)} · ${toTitleCase(p.status)}`}
                    hint={
                      p.gateway_order_id
                        ? `Order ${p.gateway_order_id}`
                        : "Payment record"
                    }
                    trailing={`₹${p.amount}`}
                  />
                ))}
              </Section>
            )}

            {booking.cancellation && (
              <Section title="Cancellation" tone="red">
                <div className="flex gap-2.5 rounded-xl bg-red-50 p-3 text-red-700">
                  <svg
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {ALERT_ICON}
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {booking.cancellation.reason_label}
                    </p>
                    {booking.cancellation.reason_text && (
                      <p className="mt-0.5 text-sm text-red-700/90">
                        {booking.cancellation.reason_text}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5 px-1 pt-3 pb-1">
                  <Row
                    label="Refund"
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
                </div>
              </Section>
            )}
          </div>
        )}
      </main>

      {actionStatus === "ONGOING" && (
        <PinVerificationModal
          submitting={actionSubmitting}
          error={actionError}
          onCancel={() => setActionStatus(null)}
          onConfirm={handleStartTrip}
        />
      )}
      {actionStatus === "CANCELLED" && (
        <VendorCancelBookingModal
          submitting={actionSubmitting}
          error={actionError}
          onCancel={() => setActionStatus(null)}
          onConfirm={handleCancelBooking}
        />
      )}
      {actionStatus &&
        actionStatus !== "ONGOING" &&
        actionStatus !== "CANCELLED" && (
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

/**
 * Sidebar-style section: small uppercase title above a white card.
 */
function Section({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "red";
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`px-1 mb-2 text-[11px] font-bold uppercase tracking-wider ${
          tone === "red" ? "text-red-500" : "text-font-dim/70"
        }`}
      >
        {title}
      </h2>
      <div className="rounded-2xl bg-white p-3 shadow-sm">{children}</div>
    </section>
  );
}

function IconRow({
  icon,
  label,
  hint,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  trailing?: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-3 px-1 py-1.5 first:mt-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-font-main-sub">
          {label}
        </span>
        {hint && (
          <span className="block text-xs leading-relaxed text-font-dim">
            {hint}
          </span>
        )}
      </span>
      {trailing && (
        <span className="shrink-0 text-sm font-bold tabular-nums text-font-main-sub">
          {trailing}
        </span>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-font-dim">{label}</span>
      <span className="max-w-[68%] break-words text-right font-semibold text-font-main-sub">
        {value}
      </span>
    </div>
  );
}
