"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { getListingDetailApi } from "@/services/fleet.service";
import { getListingReviewsApi } from "@/services/reviews.service";
import { queryKeys } from "@/lib/queryKeys";
import { PageLoader } from "@/components/ui/PageLoader";
import type {
  ListingDetail,
  ListingImage,
  ListingPackage,
  ListingScheduleDay,
} from "@/types/listing-detail.types";
import type { VehicleReviewsResponse } from "@/types/review.types";
import type { Route } from "next";

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PAUSED: "bg-gray-100 text-gray-600",
  SUSPENDED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Active",
  PENDING: "Pending Approval",
  PAUSED: "Paused",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
};

// ── Icons — same paths as the Add/Edit listing pages, plus a few new
// per-policy icons matching the customer portal's "Things to Remember"
// treatment, for consistency across the whole system. ──────────────────

const PIN_ICON = (
  <>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </>
);
const STOREFRONT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
  />
);
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
const TRUCK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 16V6a1 1 0 011-1h8a1 1 0 011 1v10m-10 0h10m-10 0a2 2 0 104 0m6 0a2 2 0 104 0m-4 0h4m0 0V9h3l3 4v3h-2"
  />
);

// "AUTOMATIC" → "Automatic", "PETROL_ENGINE" → "Petrol Engine".
// For the backend's enum-style values (transmission, fuel type).
function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Matches a schedule row to today by weekday name, so it works whatever
// numbering the backend uses for day_of_week.
function isToday(dayName: string): boolean {
  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  return today.slice(0, 3) === dayName.trim().toLowerCase().slice(0, 3);
}

// "24.00" → "1 day", "168.00" → "7 days", "6.00" → "6h".
function formatDuration(hours: string): string {
  const n = Number(hours);
  if (!Number.isFinite(n) || n <= 0) return `${hours}h`;
  if (n % 24 === 0) {
    const days = n / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${n}h`;
}

// Skips the category when it just repeats the package name
// (e.g. "Daily" / "Daily"), so the hint only adds new information.
function packageHint(pkg: ListingPackage): string {
  return [
    pkg.category.toLowerCase() !== pkg.name.toLowerCase() ? pkg.category : null,
    formatDuration(pkg.duration_hours),
    pkg.km_limit ? `${pkg.km_limit} km limit` : "No km limit",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function ListingDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const listingId = searchParams.get("id");

  const {
    data: listing,
    error: listingError,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.fleet.listing(token, listingId),
    queryFn: async () => {
      const res = await getListingDetailApi(
        listingId as string,
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Listing not found");
      }
      return res.data;
    },
    enabled: !!token && !!listingId,
  });
  const error = listingError
    ? listingError instanceof Error
      ? listingError.message
      : "Listing not found"
    : null;

  // Runs independently of the listing fetch above — only needs
  // listingId, not the loaded listing itself, so both requests fire
  // in parallel rather than one waiting on the other.
  const {
    data: reviews = null,
    error: reviewsErrorObj,
    isLoading: reviewsLoading,
  } = useQuery({
    queryKey: queryKeys.reviews.listing(listingId),
    queryFn: async () => {
      const res = await getListingReviewsApi(
        listingId as string,
        token ?? undefined,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load reviews");
      }
      return res.data;
    },
    enabled: !!listingId,
  });
  const reviewsError = reviewsErrorObj
    ? reviewsErrorObj instanceof Error
      ? reviewsErrorObj.message
      : "Failed to load reviews"
    : null;

  const averageRating =
    reviews &&
    typeof reviews.average_rating === "number" &&
    reviews.total_reviews
      ? reviews.average_rating.toFixed(1)
      : "—";

  return (
    <div className="flex h-full flex-col bg-brand-bg">
      <Header
        title={listing ? listing.vehicle_type.name : "Listing Details"}
        onBack={() => router.back()}
        rightSlot={
          listing && (
            <button
              onClick={() =>
                router.push(`/fleet/listing/edit?id=${listing.id}` as Route)
              }
              className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm active:opacity-80 transition-opacity shrink-0"
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit
            </button>
          )
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto hide-scrollbar px-5 pb-8 pt-4 sm:px-6 sm:pt-6">
        {isLoading && <PageLoader />}

        {error && !isLoading && (
          <p className="mx-auto mt-6 max-w-2xl rounded-2xl bg-white shadow-sm px-4 py-4 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        {listing && !isLoading && (
          <div className="mx-auto max-w-5xl space-y-5">
            {/* Hero */}
            <section className="rounded-2xl bg-white p-3 shadow-sm">
              <VehicleTypeHeroImage listing={listing} />
              <div className="px-1 pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                  {listing.vehicle_type.brand} · {listing.vehicle_type.make_year}
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <h2 className="min-w-0 truncate font-heading text-2xl font-bold text-font-main-sub">
                    {listing.vehicle_type.name}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      STATUS_STYLES[listing.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 px-1 pt-3">
                {[
                  toTitleCase(listing.vehicle_type.transmission_type),
                  toTitleCase(listing.vehicle_type.fuel_type),
                  `${listing.vehicle_type.seats} seats`,
                  `${listing.vehicle_type.cc} cc`,
                ]
                  .filter(Boolean)
                  .map((chip) => (
                    <span
                      key={chip}
                      className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-font-dim"
                    >
                      {chip}
                    </span>
                  ))}
              </div>

              {/* Key numbers — one strip inside the card instead of
                  separate tiles */}
              <div className="mt-4 grid grid-cols-3 divide-x divide-black/5 rounded-xl bg-brand-bg py-3">
                <HeroStat
                  value={String(listing.available_count)}
                  label="Available"
                />
                <HeroStat
                  value={String(listing.pricing_packages.length)}
                  label={
                    listing.pricing_packages.length === 1
                      ? "Package"
                      : "Packages"
                  }
                />
                <HeroStat
                  value={reviewsLoading ? "…" : averageRating}
                  label="Rating"
                  star={averageRating !== "—" && !reviewsLoading}
                />
              </div>

              {listing.status === "REJECTED" && listing.rejection_reason && (
                <div className="mt-3 flex gap-2.5 rounded-xl bg-red-50 p-3 text-red-700">
                  <svg
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {ALERT_ICON}
                  </svg>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide">
                      Rejection reason
                    </p>
                    <p className="mt-0.5 text-sm">{listing.rejection_reason}</p>
                  </div>
                </div>
              )}
            </section>

            <Section title="Pricing packages">
              {listing.pricing_packages.length === 0 ? (
                <EmptyRow text="No pricing packages set up yet." />
              ) : (
                listing.pricing_packages.map((pkg: ListingPackage) => (
                  <Row
                    key={pkg.id}
                    icon={TAG_ICON}
                    label={pkg.name}
                    hint={packageHint(pkg)}
                    trailing={
                      <span className="rounded-lg bg-brand-yellow/30 px-2.5 py-1 text-sm font-bold tabular-nums text-brand-secondary">
                        ₹{pkg.price}
                      </span>
                    }
                  />
                ))
              )}
            </Section>

            <Section title="Location">
              <Row
                icon={PIN_ICON}
                label={listing.pickup_location.name}
                hint={
                  listing.pickup_location.address ||
                  listing.pickup_location.city_name
                }
                wrapHint
              />
              <ExactPickupAddress listing={listing} />
            </Section>

            <Section title="Vehicle details" padded>
              <div className="grid grid-cols-2 gap-2">
                <Spec label="Brand" value={listing.vehicle_type.brand} />
                <Spec
                  label="Year"
                  value={String(listing.vehicle_type.make_year)}
                />
                <Spec
                  label="Transmission"
                  value={toTitleCase(listing.vehicle_type.transmission_type)}
                />
                <Spec
                  label="Fuel type"
                  value={toTitleCase(listing.vehicle_type.fuel_type)}
                />
                <Spec label="Seats" value={String(listing.vehicle_type.seats)} />
                <Spec label="Engine" value={`${listing.vehicle_type.cc} cc`} />
                {listing.vehicle_type.mileage_kmpl != null && (
                  <Spec
                    label="Mileage"
                    value={`${listing.vehicle_type.mileage_kmpl} km/l`}
                  />
                )}
                {listing.vehicle_type.top_speed_kmph != null && (
                  <Spec
                    label="Top speed"
                    value={`${listing.vehicle_type.top_speed_kmph} km/h`}
                  />
                )}
              </div>
            </Section>

            <Section title="Policies">
              <Row
                icon={DEPOSIT_ICON}
                label="Security deposit"
                trailing={
                  <Value>₹{listing.policies.security_deposit_amount}</Value>
                }
              />
              <Row
                icon={ALERT_ICON}
                label="Excess charge"
                trailing={
                  <Value>₹{listing.policies.excess_charge_per_km}/km</Value>
                }
              />
              <Row
                icon={CLOCK_ICON}
                label="Late return penalty"
                trailing={
                  <Value>
                    ₹{listing.policies.late_return_penalty_per_hour}/hr
                  </Value>
                }
              />
              <Row
                icon={TRUCK_ICON}
                label="Doorstep delivery"
                trailing={
                  listing.policies.doorstep_delivery_enabled ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700">
                      Enabled
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-font-dim">
                      Off
                    </span>
                  )
                }
              />
            </Section>

            <Section
              title={
                listing.schedule.template_name
                  ? `Weekly schedule · ${listing.schedule.template_name}`
                  : "Weekly schedule"
              }
            >
              {listing.schedule.has_schedule ? (
                listing.schedule.days.map((day: ListingScheduleDay) => {
                  const today = isToday(day.day_name);
                  return (
                    <div
                      key={day.day_of_week}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                        today ? "bg-brand-yellow/25" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-font-main-sub">
                        {day.day_name}
                        {today && (
                          <span className="rounded-md bg-brand-yellow-lg px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-secondary">
                            Today
                          </span>
                        )}
                      </span>
                      {day.is_closed ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                          Closed
                        </span>
                      ) : (
                        <span className="text-xs font-semibold tabular-nums text-font-dim">
                          {day.timing}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyRow text="No schedule assigned yet." />
              )}
            </Section>

            <Section title={`Photos · ${listing.images.length}`} padded>
              <VendorUploadedPhotos listing={listing} />
            </Section>

            <Section title="Reviews & ratings" padded>
              <ReviewsSummary
                reviews={reviews}
                loading={reviewsLoading}
                error={reviewsError}
              />
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Helper Components ---

function VehicleTypeHeroImage({ listing }: { listing: ListingDetail }) {
  if (!listing.vehicle_type.primary_image) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl bg-gray-100 p-5 sm:h-64">
        <svg
          className="w-12 h-12 text-font-dim/50"
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
      </div>
    );
  }

  return (
    <div className="flex h-52 w-full items-center justify-center rounded-xl bg-gray-100 p-4 sm:h-72">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={listing.vehicle_type.primary_image}
        alt={listing.vehicle_type.name}
        className="w-full h-full object-contain mix-blend-multiply"
      />
    </div>
  );
}

function VendorUploadedPhotos({ listing }: { listing: ListingDetail }) {
  const images: ListingImage[] = listing.images;

  if (images.length === 0) {
    return (
      <p className="text-sm text-font-dim">
        No photos uploaded for this listing yet.
      </p>
    );
  }

  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto hide-scrollbar px-1">
      {images.map((img: ListingImage) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.image_url ?? undefined}
          alt={listing.vehicle_type.name}
          className="h-28 w-36 shrink-0 rounded-xl bg-gray-100 object-cover sm:h-32 sm:w-40"
        />
      ))}
    </div>
  );
}

function ExactPickupAddress({ listing }: { listing: ListingDetail }) {
  const pickupPoint = listing.pickup_point;

  if (pickupPoint === null || pickupPoint === undefined) {
    return (
      <Row
        icon={STOREFRONT_ICON}
        label="No pickup point"
        hint="Add an exact pickup point from Edit."
        wrapHint
      />
    );
  }

  const hasMapLink =
    pickupPoint.latitude !== null || pickupPoint.google_maps_link.length > 0;
  const mapHref =
    pickupPoint.google_maps_link.length > 0
      ? pickupPoint.google_maps_link
      : "https://www.google.com/maps?q=" +
        pickupPoint.latitude +
        "," +
        pickupPoint.longitude;

  const labelText =
    pickupPoint.label.length > 0 ? pickupPoint.label : "Pickup point";

  return (
    <>
      <Row
        icon={STOREFRONT_ICON}
        label={labelText}
        hint={pickupPoint.address}
        wrapHint
      />

      {(pickupPoint.contact_numbers.length > 0 || hasMapLink) && (
        <div className="flex flex-wrap gap-2 px-2.5 pb-2 pt-1">
          {pickupPoint.contact_numbers.map(function renderContact(num) {
            const telHref = "tel:" + num;
            return (
              <a
                key={num}
                href={telHref}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-gray-100 px-3 text-sm font-semibold text-font-main-sub active:bg-gray-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow-lg"
              >
                <svg
                  className="h-4 w-4 text-font-dim"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.2l-1.9.95a11 11 0 005.2 5.2l.95-1.9a1 1 0 011.2-.5l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.27 21 3 14.73 3 7V5z"
                  />
                </svg>
                {num}
              </a>
            );
          })}
          {hasMapLink && (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-yellow-lg px-3 text-sm font-semibold text-brand-secondary active:bg-brand-yellow transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
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
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open in Maps
            </a>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Sidebar-style section: small uppercase title above a white card.
 * `padded` is for free-form content; without it the card is a tight
 * list container for <Row/>s, like the sidebar's link groups.
 */
function Section({
  title,
  padded = false,
  children,
}: {
  title: string;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
        {title}
      </h2>
      <div
        className={`rounded-2xl bg-white shadow-sm ${
          padded ? "p-3" : "p-1.5 space-y-0.5"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  hint,
  trailing,
  wrapHint = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  wrapHint?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-font-main-sub">
          {label}
        </span>
        {hint && (
          <span
            className={`block text-xs text-font-dim ${
              wrapHint ? "leading-relaxed" : "truncate"
            }`}
          >
            {hint}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-bold tabular-nums text-font-main-sub">
      {children}
    </span>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-2.5 py-3 text-sm text-font-dim">{text}</p>;
}

function HeroStat({
  value,
  label,
  star = false,
}: {
  value: string;
  label: string;
  star?: boolean;
}) {
  return (
    <div className="px-2 text-center">
      <p className="font-heading text-xl font-bold tabular-nums leading-none text-font-main-sub">
        {star && <span className="mr-0.5 text-brand-yellow-lg">★</span>}
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-semibold text-font-dim">{label}</p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-brand-bg px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-bold text-font-main-sub">
        {value}
      </p>
    </div>
  );
}

function ReviewsSummary({
  reviews,
  loading,
  error,
}: {
  reviews: VehicleReviewsResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <p className="text-sm text-font-dim">Loading reviews...</p>;
  }
  if (error) {
    return <p className="text-sm font-medium text-red-500">{error}</p>;
  }
  if (!reviews || !reviews.total_reviews) {
    return (
      <p className="text-sm text-font-dim">No reviews yet for this listing.</p>
    );
  }

  const averageRating =
    typeof reviews.average_rating === "number" ? reviews.average_rating : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl bg-brand-bg p-3">
        <div className="shrink-0 text-center px-1">
          <p className="font-heading text-3xl font-bold leading-none text-font-main-sub">
            {averageRating !== null ? averageRating.toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-font-dim">
            {reviews.total_reviews} review
            {reviews.total_reviews === 1 ? "" : "s"}
          </p>
        </div>
        {reviews.rating_breakdown?.length > 0 && (
          <div className="flex-1 space-y-1.5 border-l border-black/5 pl-4">
            {reviews.rating_breakdown.map((b) => (
              <div
                key={b.criterion}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-font-dim">{b.criterion_label}</span>
                <span className="font-bold text-font-main-sub">
                  {typeof b.average_score === "number"
                    ? b.average_score.toFixed(1)
                    : "—"}{" "}
                  <span className="text-brand-yellow-lg">★</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {reviews.results?.map((r) => (
          <div key={r.id} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-secondary font-heading text-xs font-bold text-brand-yellow">
              {r.author_name?.trim()?.[0]?.toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-font-main-sub">
                  {r.author_name}
                </p>
                {typeof r.rating === "number" && (
                  <span className="shrink-0 rounded-md bg-brand-yellow/30 px-1.5 py-0.5 text-[11px] font-bold text-brand-secondary">
                    {r.rating.toFixed(1)} ★
                  </span>
                )}
              </div>
              <p className="text-[11px] text-font-dim">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
              {r.comment && (
                <p className="mt-1.5 text-sm text-font-main-sub/90">
                  {r.comment}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.total_reviews > (reviews.results?.length ?? 0) && (
        <p className="text-[11px] font-semibold text-font-dim text-center">
          Showing {reviews.results?.length ?? 0} of {reviews.total_reviews}{" "}
          reviews
        </p>
      )}
    </div>
  );
}
