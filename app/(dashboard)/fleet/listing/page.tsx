"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { getListingDetailApi } from "@/services/fleet.service";
import { PageLoader } from "@/components/ui/PageLoader";
import type {
  ListingDetail,
  ListingImage,
  ListingPackage,
  ListingScheduleDay,
} from "@/types/listing-detail.types";
import type { Route } from "next";

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-green-50 text-green-600",
  PENDING: "bg-brand-yellow/10 text-brand-yellow-lg",
  PAUSED: "bg-gray-100 text-gray-600",
  SUSPENDED: "bg-red-50 text-red-600",
  REJECTED: "bg-red-50 text-red-600",
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

const VEHICLE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h9l4 5h1a2 2 0 012 2v4h-2M9 17h6"
  />
);
const CAMERA_ICON = (
  <>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 17a4 4 0 100-8 4 4 0 000 8z"
    />
  </>
);
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
const CALENDAR_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  />
);
const SHIELD_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
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
const TRUCK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 16V6a1 1 0 011-1h8a1 1 0 011 1v10m-10 0h10m-10 0a2 2 0 104 0m6 0a2 2 0 104 0m-4 0h4m0 0V9h3l3 4v3h-2"
  />
);

export default function ListingDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const listingId = searchParams.get("id");

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !listingId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getListingDetailApi(listingId, token);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setError(res.message || "Listing not found");
          return;
        }
        setListing(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load listing",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, listingId]);

  return (
    <div className="bg-brand-bg min-h-screen flex flex-col">
      <Header
        title={listing ? listing.vehicle_type.name : "Listing Details"}
        onBack={() => router.back()}
        rightSlot={
          listing && (
            <button
              onClick={() =>
                router.push(`/fleet/listing/edit?id=${listing.id}` as Route)
              }
              className="flex items-center gap-1.5 bg-brand-yellow text-brand-secondary px-4 py-2 rounded-xl text-[13px] font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors shrink-0"
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
              EDIT
            </button>
          )
        }
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-8">
        {isLoading && <PageLoader />}

        {error && !isLoading && (
          <p className="text-[13px] text-red-500 font-semibold text-center mt-10 bg-red-50 py-3 rounded-xl mx-4">
            {error}
          </p>
        )}

        {listing && !isLoading && (
          <div className="space-y-4">
            <VehicleTypeHeroImage listing={listing} />

            <div className="flex flex-col items-center mb-2">
              <span
                className={`inline-block text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg shadow-sm ${
                  STATUS_STYLES[listing.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABELS[listing.status] ?? listing.status}
              </span>
              {listing.status === "REJECTED" && listing.rejection_reason && (
                <p className="text-[12px] font-medium text-red-500 mt-3 bg-red-50 px-4 py-2 rounded-lg text-center w-full">
                  {listing.rejection_reason}
                </p>
              )}
            </div>

            <Section title="Vehicle Details" icon={VEHICLE_ICON}>
              <div className="grid grid-cols-2 gap-2.5">
                <Spec label="Brand" value={listing.vehicle_type.brand} />
                <Spec
                  label="Year"
                  value={String(listing.vehicle_type.make_year)}
                />
                <Spec
                  label="Transmission"
                  value={listing.vehicle_type.transmission_type}
                />
                <Spec
                  label="Fuel Type"
                  value={listing.vehicle_type.fuel_type}
                />
                <Spec
                  label="Seats"
                  value={String(listing.vehicle_type.seats)}
                />
                <Spec
                  label="Engine (cc)"
                  value={String(listing.vehicle_type.cc)}
                />
                {listing.vehicle_type.mileage_kmpl != null && (
                  <Spec
                    label="Mileage"
                    value={`${listing.vehicle_type.mileage_kmpl} km/l`}
                  />
                )}
                {listing.vehicle_type.top_speed_kmph != null && (
                  <Spec
                    label="Top Speed"
                    value={`${listing.vehicle_type.top_speed_kmph} km/h`}
                  />
                )}
              </div>
            </Section>

            <Section
              title={`Photos (${listing.images.length})`}
              icon={CAMERA_ICON}
            >
              <VendorUploadedPhotos listing={listing} />
            </Section>

            <Section title="Pickup Location" icon={PIN_ICON}>
              <p className="font-bold text-gray-900 text-[14px]">
                {listing.pickup_location.name}
              </p>
              <p className="text-[13px] font-medium text-gray-500 mt-1">
                {listing.pickup_location.address ||
                  listing.pickup_location.city_name}
              </p>
            </Section>

            <Section title="Exact Pickup Address" icon={STOREFRONT_ICON}>
              <ExactPickupAddress listing={listing} />
            </Section>

            <Section
              title={`Pricing Packages (${listing.pricing_packages.length})`}
              icon={TAG_ICON}
            >
              <div className="space-y-3">
                {listing.pricing_packages.map((pkg: ListingPackage) => (
                  <div
                    key={pkg.id}
                    className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between transition-colors hover:border-brand-yellow/50"
                  >
                    <div>
                      <p className="font-bold text-[14px] text-gray-900">
                        {pkg.name}
                      </p>
                      <p className="text-[12px] font-medium text-gray-500 mt-1">
                        {pkg.category} • {pkg.duration_hours}h
                        {pkg.km_limit
                          ? ` • ${pkg.km_limit} km limit`
                          : " • No km limit"}
                      </p>
                    </div>
                    <p className="font-bold text-[14px] text-brand-yellow-lg bg-brand-yellow/10 px-3 py-1.5 rounded-lg">
                      ₹{pkg.price}
                    </p>
                  </div>
                ))}
                {listing.pricing_packages.length === 0 && (
                  <p className="text-[13px] font-medium text-gray-500">
                    No pricing packages set up yet.
                  </p>
                )}
              </div>
            </Section>

            <Section title="Weekly Schedule" icon={CALENDAR_ICON}>
              {listing.schedule.has_schedule ? (
                <div className="space-y-2">
                  {listing.schedule.days.map((day: ListingScheduleDay) => (
                    <div
                      key={day.day_of_week}
                      className="flex justify-between items-center text-[13px] py-1.5 border-b border-gray-50 last:border-0 last:pb-0"
                    >
                      <span className="text-gray-900 font-bold">
                        {day.day_name}
                      </span>
                      <span
                        className={`font-semibold ${
                          day.is_closed
                            ? "text-red-500 bg-red-50 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wide"
                            : "text-gray-500"
                        }`}
                      >
                        {day.is_closed ? "Closed" : day.timing}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] font-medium text-gray-500">
                  No schedule assigned yet.
                </p>
              )}
            </Section>

            <Section title="Policies" icon={SHIELD_ICON}>
              <div className="space-y-3">
                <PolicyRow
                  icon={DEPOSIT_ICON}
                  label="Security Deposit"
                  value={`₹${listing.policies.security_deposit_amount}`}
                />
                <PolicyRow
                  icon={DISTANCE_ICON}
                  label="Distance Limit"
                  value={
                    listing.policies.km_limit_per_day
                      ? `${listing.policies.km_limit_per_day} km/day`
                      : "No limit"
                  }
                />
                {listing.policies.excess_charge_per_km != null && (
                  <PolicyRow
                    icon={ALERT_ICON}
                    label="Excess Charge"
                    value={`₹${listing.policies.excess_charge_per_km}/km`}
                  />
                )}
                {listing.policies.late_return_penalty_per_hour != null && (
                  <PolicyRow
                    icon={CLOCK_ICON}
                    label="Late Return Penalty"
                    value={`₹${listing.policies.late_return_penalty_per_hour}/hr`}
                  />
                )}
                <PolicyRow
                  icon={TRUCK_ICON}
                  label="Doorstep Delivery"
                  value={
                    listing.policies.doorstep_delivery_enabled
                      ? "Enabled"
                      : "Not enabled"
                  }
                />
              </div>
            </Section>

            <div className="flex items-center justify-center gap-3 bg-white border border-gray-100 rounded-2xl py-4 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-brand-yellow/15 text-brand-yellow-lg flex items-center justify-center shrink-0">
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {VEHICLE_ICON}
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Fleet quantity at this location
                </p>
                <p className="text-lg font-heading font-extrabold text-font-main-sub leading-tight">
                  {listing.available_count}
                </p>
              </div>
            </div>
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
      <div className="w-full h-56 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-12 h-12 text-gray-300"
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
    <div className="w-full h-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center justify-center">
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
      <p className="text-[13px] font-medium text-gray-500">
        No photos uploaded for this listing yet.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-2 px-2 pb-1">
      {images.map((img: ListingImage) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.image_url ?? undefined}
          alt={listing.vehicle_type.name}
          className="h-32 w-32 rounded-2xl object-cover shrink-0 border border-gray-100 shadow-sm"
        />
      ))}
    </div>
  );
}

function ExactPickupAddress({ listing }: { listing: ListingDetail }) {
  const pickupPoint = listing.pickup_point;

  if (pickupPoint === null || pickupPoint === undefined) {
    return (
      <p className="text-[13px] font-medium text-gray-500">
        No exact pickup point set for this listing yet, add one from Edit.
      </p>
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
    <div className="space-y-4">
      <div>
        <p className="font-bold text-[14px] text-gray-900">{labelText}</p>
        <p className="text-[13px] font-medium text-gray-500 mt-1">
          {pickupPoint.address}
        </p>
      </div>

      {pickupPoint.contact_numbers.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Contact numbers
          </p>
          <div className="flex flex-wrap gap-2.5">
            {pickupPoint.contact_numbers.map(function renderContact(num) {
              const telHref = "tel:" + num;
              return (
                <a
                  key={num}
                  href={telHref}
                  className="text-[13px] font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 hover:border-brand-yellow transition-colors"
                >
                  {num}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {hasMapLink && (
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-yellow-lg hover:text-brand-secondary transition-colors mt-1"
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
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Open in Maps
        </a>
      )}
    </div>
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
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-50">
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
        <h2 className="font-heading font-bold text-[15px] text-gray-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50/60 rounded-xl px-3 py-2.5">
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="text-[14px] font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function PolicyRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <div className="flex-1 flex items-center justify-between text-[13px]">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
