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
import { saveReturnTo } from "@/lib/listingDraft";

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
    <>
      <Header
        title={listing ? listing.vehicle_type.name : "Listing"}
        onBack={() => router.back()}
        rightSlot={
          listing && (
            <button
              onClick={() =>
                router.push(`/fleet/listing/edit?id=${listing.id}` as Route)
              }
              className="text-sm font-bold text-brand-secondary bg-brand-yellow px-3 py-1.5 rounded-lg hover:bg-brand-yellow-lg transition-colors shrink-0"
            >
              Edit
            </button>
          )
        }
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        {isLoading && <PageLoader />}

        {error && !isLoading && (
          <div className="text-center mt-10">
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        )}

        {listing && !isLoading && (
          <div className="space-y-5">
            <VehicleTypeHeroImage listing={listing} />

            <div>
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                  STATUS_STYLES[listing.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABELS[listing.status] ?? listing.status}
              </span>
              {listing.status === "REJECTED" && listing.rejection_reason && (
                <p className="text-sm text-red-600 mt-2">
                  {listing.rejection_reason}
                </p>
              )}
            </div>

            <Section title="Vehicle Details">
              <div className="grid grid-cols-2 gap-3">
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

            <Section title={`Photos (${listing.images.length})`}>
              <VendorUploadedPhotos listing={listing} />
            </Section>

            <Section title="Pickup Location">
              <p className="font-semibold text-font-main-sub">
                {listing.pickup_location.name}
              </p>
              <p className="text-sm text-font-dim mt-1">
                {listing.pickup_location.address ||
                  listing.pickup_location.city_name}
              </p>
            </Section>

            <Section title="Exact Pickup Address">
              <ExactPickupAddress listing={listing} />
            </Section>

            <Section
              title={`Pricing Packages (${listing.pricing_packages.length})`}
            >
              <div className="space-y-3">
                {listing.pricing_packages.map((pkg: ListingPackage) => (
                  <div
                    key={pkg.id}
                    className="border border-gray-100 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-font-main-sub">
                        {pkg.name}
                      </p>
                      <p className="text-xs text-font-dim mt-0.5">
                        {pkg.category} • {pkg.duration_hours}h
                        {pkg.km_limit
                          ? ` • ${pkg.km_limit} km limit`
                          : " • No km limit"}
                      </p>
                    </div>
                    <p className="font-bold text-brand-secondary">
                      ₹{pkg.price}
                    </p>
                  </div>
                ))}
                {listing.pricing_packages.length === 0 && (
                  <p className="text-sm text-font-dim">
                    No pricing packages set up yet.
                  </p>
                )}
              </div>
            </Section>

            <Section title="Weekly Schedule">
              {listing.schedule.has_schedule ? (
                <div className="space-y-1.5">
                  {listing.schedule.days.map((day: ListingScheduleDay) => (
                    <div
                      key={day.day_of_week}
                      className="flex justify-between text-sm py-1"
                    >
                      <span className="text-font-main-sub font-medium">
                        {day.day_name}
                      </span>
                      <span
                        className={
                          day.is_closed ? "text-red-500" : "text-font-dim"
                        }
                      >
                        {day.timing}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-font-dim">
                  No schedule assigned yet.
                </p>
              )}
            </Section>

            <Section title="Policies">
              <div className="space-y-2 text-sm">
                <PolicyRow
                  label="Security Deposit"
                  value={`₹${listing.policies.security_deposit_amount}`}
                />
                <PolicyRow
                  label="Distance Limit"
                  value={
                    listing.policies.km_limit_per_day
                      ? `${listing.policies.km_limit_per_day} km/day`
                      : "No limit"
                  }
                />
                {listing.policies.excess_charge_per_km != null && (
                  <PolicyRow
                    label="Excess Charge"
                    value={`₹${listing.policies.excess_charge_per_km}/km`}
                  />
                )}
                {listing.policies.late_return_penalty_per_hour != null && (
                  <PolicyRow
                    label="Late Return Penalty"
                    value={`₹${listing.policies.late_return_penalty_per_hour}/hr`}
                  />
                )}
                <PolicyRow
                  label="Doorstep Delivery"
                  value={
                    listing.policies.doorstep_delivery_enabled
                      ? "Enabled"
                      : "Not enabled"
                  }
                />
              </div>
            </Section>

            <div className="text-xs text-font-dim text-center pt-2">
              Fleet quantity at this location: {listing.available_count}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function VehicleTypeHeroImage({ listing }: { listing: ListingDetail }) {
  if (!listing.vehicle_type.primary_image) {
    return (
      <div className="w-full h-48 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-gray-300"
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
    <div className="w-full h-56 bg-gray-50 rounded-2xl border border-gray-100 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={listing.vehicle_type.primary_image}
        alt={listing.vehicle_type.name}
        className="w-full h-full object-contain"
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
    <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
      {images.map((img: ListingImage) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.image_url ?? undefined}
          alt={listing.vehicle_type.name}
          className="h-28 w-28 rounded-xl object-cover shrink-0 border border-gray-100"
        />
      ))}
    </div>
  );
}

function ExactPickupAddress({ listing }: { listing: ListingDetail }) {
  const pickupPoint = listing.pickup_point;

  if (pickupPoint === null || pickupPoint === undefined) {
    return (
      <p className="text-sm text-font-dim">
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
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-font-main-sub">{labelText}</p>
        <p className="text-sm text-font-dim mt-1">{pickupPoint.address}</p>
      </div>

      {pickupPoint.contact_numbers.length > 0 && (
        <div>
          <p className="text-xs text-font-dim mb-1">Contact numbers</p>
          <div className="flex flex-wrap gap-2">
            {pickupPoint.contact_numbers.map(function renderContact(num) {
              const telHref = "tel:" + num;
              return (
                <a
                  key={num}
                  href={telHref}
                  className="text-sm font-semibold text-brand-secondary bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5"
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
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-yellow-lg"
        >
          Open in Maps
        </a>
      )}
    </div>
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
      {children}
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-font-dim">{label}</p>
      <p className="text-sm font-semibold text-font-main-sub mt-0.5">{value}</p>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-font-dim">{label}</span>
      <span className="font-medium text-font-main-sub">{value}</span>
    </div>
  );
}
