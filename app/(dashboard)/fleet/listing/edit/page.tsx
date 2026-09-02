"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getListingDetailApi,
  getPackageTypesApi,
  getScheduleTemplatesApi,
  getPickupPointsApi,
  updateListingApi,
  uploadListingImagesApi,
  deleteListingImageApi,
} from "@/services/fleet.service";
import {
  searchCitiesApi,
  getPickupLocationsByCityApi,
} from "@/services/locations.service";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  saveReturnTo,
  editDraftKey,
} from "@/lib/listingDraft";
import { SearchPickerSheet } from "@/components/ui/SearchPickerSheet";
import type {
  City,
  PickupLocationOption,
  PackageTypeOption,
  ScheduleTemplate,
  PickupPoint,
  ListingUpdatePayload,
} from "@/types/listing-create.types";
import type { ListingDetail, ListingImage } from "@/types/listing-detail.types";

// ── Icons (same paths as the "Add a bike" wizard, for visual consistency) ──

const VEHICLE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h9l4 5h1a2 2 0 012 2v4h-2M9 17h6"
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

interface PricingPackageDraft {
  packageTypeId: number | null;
  price: string;
  payAtPickupEnabled: boolean;
  kmLimit: string;
}

interface EditFormState {
  cityId: number | null;
  cityName: string;
  pickupLocationId: number | null;
  pickupLocationName: string;
  pickupPointId: number | null;
  pickupPointLabel: string;
  scheduleTemplateId: number | null;
  scheduleTemplateName: string;
  pricingPackages: PricingPackageDraft[];
  availableCount: string;
  securityDepositAmount: string;
  kmLimitPerDay: string;
  excessChargePerKm: string;
  lateReturnPenaltyPerHour: string;
  doorstepDeliveryEnabled: boolean;
}

function detailToFormState(detail: ListingDetail): EditFormState {
  return {
    cityId: detail.pickup_location.city_id,
    cityName: detail.pickup_location.city_name,
    pickupLocationId: detail.pickup_location.id,
    pickupLocationName: detail.pickup_location.name,
    pickupPointId: detail.pickup_point?.id ?? null,
    pickupPointLabel:
      detail.pickup_point?.label || detail.pickup_point?.address || "",
    scheduleTemplateId: detail.schedule.id,
    scheduleTemplateName: detail.schedule.template_name ?? "",
    pricingPackages: detail.pricing_packages.map((pkg) => ({
      packageTypeId: pkg.package_type_id,
      price: pkg.price,
      payAtPickupEnabled: pkg.pay_at_pickup_enabled,
      kmLimit: pkg.km_limit != null ? String(pkg.km_limit) : "",
    })),
    availableCount: String(detail.available_count),
    securityDepositAmount: String(detail.policies.security_deposit_amount),
    kmLimitPerDay:
      detail.policies.km_limit_per_day != null
        ? String(detail.policies.km_limit_per_day)
        : "",
    excessChargePerKm:
      detail.policies.excess_charge_per_km != null
        ? String(detail.policies.excess_charge_per_km)
        : "0",
    lateReturnPenaltyPerHour:
      detail.policies.late_return_penalty_per_hour != null
        ? String(detail.policies.late_return_penalty_per_hour)
        : "0",
    doorstepDeliveryEnabled: detail.policies.doorstep_delivery_enabled,
  };
}

export default function EditListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const listingId = searchParams.get("id");

  const [form, setForm] = useState<EditFormState | null>(null);
  const [vehicleTypeLabel, setVehicleTypeLabel] = useState("");
  const [images, setImages] = useState<ListingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const draftKey = listingId ? editDraftKey(listingId) : "";

  useEffect(() => {
    if (!token || !listingId) return;
    let cancelled = false;

    (async () => {
      const restored = loadDraft<EditFormState>(draftKey);
      if (restored && !cancelled) setForm(restored);

      setLoading(true);
      setLoadError(null);
      try {
        const res = await getListingDetailApi(listingId, token);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setLoadError(res.message || "Listing not found");
          return;
        }
        setVehicleTypeLabel(
          `${res.data.vehicle_type.brand} ${res.data.vehicle_type.name} (${res.data.vehicle_type.make_year})`,
        );
        setImages(res.data.images);
        if (!restored) setForm(detailToFormState(res.data));
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load listing",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, listingId, draftKey]);

  useEffect(() => {
    if (form && draftKey) saveDraft(form, draftKey);
  }, [form, draftKey]);

  function update(patch: Partial<EditFormState>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function handleCreateScheduleTemplate() {
    if (listingId) saveReturnTo(`/fleet/listing/edit?id=${listingId}`);
    router.push("/fleet/schedule-templates/new" as Route);
  }

  function handleCreatePickupPoint() {
    if (!listingId) return;
    saveReturnTo(`/fleet/listing/edit?id=${listingId}`);
    const params = new URLSearchParams();
    if (form?.pickupLocationId)
      params.set("pickup_location_id", String(form.pickupLocationId));
    if (form?.pickupLocationName)
      params.set("pickup_location_name", form.pickupLocationName);
    router.push(`/fleet/pickup-points/new?${params.toString()}` as Route);
  }

  async function handleSubmit() {
    if (!token || !form || !listingId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: ListingUpdatePayload = {
        pickup_location_id: form.pickupLocationId!,
        pickup_point_id: form.pickupPointId!,
        schedule_template_id: form.scheduleTemplateId!,
        available_count: Number(form.availableCount) || 1,
        security_deposit_amount: form.securityDepositAmount || "0",
        km_limit_per_day: form.kmLimitPerDay
          ? Number(form.kmLimitPerDay)
          : null,
        excess_charge_per_km: form.excessChargePerKm || "0",
        late_return_penalty_per_hour: form.lateReturnPenaltyPerHour || "0",
        doorstep_delivery_enabled: form.doorstepDeliveryEnabled,
        operating_hours_start: null,
        operating_hours_end: null,
        pricing_packages: form.pricingPackages.map((p) => ({
          package_type_id: p.packageTypeId!,
          price: p.price,
          pay_at_pickup_enabled: p.payAtPickupEnabled,
          partial_payment_percentage: null,
          km_limit: p.kmLimit ? Number(p.kmLimit) : null,
        })),
      };
      const res = await updateListingApi(listingId, payload, token);
      if (!res.success || !res.data) {
        setSubmitError(res.message || "Failed to save changes");
        return;
      }
      clearDraft(draftKey);
      setSaved(true);
      setTimeout(
        () => router.push(`/fleet/listing?id=${listingId}` as Route),
        900,
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save changes",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Edit listing" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <p className="text-sm text-font-dim text-center">Loading...</p>
        </main>
      </>
    );
  }

  if (loadError || !form || !listingId) {
    return (
      <>
        <Header title="Edit listing" onBack={() => router.back()} />
        <main className="flex-1 px-5 pt-10">
          <p className="text-sm text-red-500 text-center">
            {loadError || "Listing not found"}
          </p>
        </main>
      </>
    );
  }

  const policiesIncomplete =
    !form.securityDepositAmount ||
    !form.excessChargePerKm ||
    !form.lateReturnPenaltyPerHour;

  return (
    <>
      <Header title="Edit listing" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-4 bg-brand-bg">
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {VEHICLE_ICON}
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Vehicle type
            </p>
            <p className="text-sm font-semibold text-font-main-sub mt-0.5 truncate">
              {vehicleTypeLabel}
            </p>
          </div>
        </div>
        <p className="text-xs text-font-dim px-1 -mt-2">
          Vehicle type can&apos;t be changed after creation.
        </p>

        <Section title="Pickup location">
          <LocationPicker
            form={form}
            update={update}
            token={token!}
            onCreatePickupPoint={handleCreatePickupPoint}
          />
        </Section>

        <Section title="Photos">
          <PhotosManager
            listingId={listingId}
            images={images}
            setImages={setImages}
            token={token!}
          />
        </Section>

        <Section title="Schedule">
          <SchedulePicker
            form={form}
            update={update}
            token={token!}
            onCreateNew={handleCreateScheduleTemplate}
          />
        </Section>

        <Section title="Pricing packages">
          <PricingEditor form={form} update={update} token={token!} />
        </Section>

        <Section title="Policies">
          <PoliciesEditor form={form} update={update} />
        </Section>

        {submitError && (
          <p className="text-sm text-red-500 font-medium">{submitError}</p>
        )}
        {saved && (
          <p className="text-sm text-green-600 font-medium">
            Saved. Listing is pending re-approval.
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !form.pickupPointId || policiesIncomplete}
          className="w-full font-bold rounded-xl py-4 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
        {!form.pickupPointId && (
          <p className="text-xs text-red-500 text-center -mt-3">
            Select an exact pickup point before saving.
          </p>
        )}
        {form.pickupPointId && policiesIncomplete && (
          <p className="text-xs text-red-500 text-center -mt-3">
            Security deposit, excess charge, and late return penalty can&apos;t
            be blank — enter 0 if not applicable.
          </p>
        )}
        <p className="text-xs text-font-dim text-center">
          Saving sends this listing back for admin approval.
        </p>
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
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h2 className="font-heading font-bold text-sm text-font-main-sub mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Reusable picker field (City / Pickup location) ─────────────────────

function PickerField({
  icon,
  label,
  value,
  placeholder,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const filled = value.length > 0;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 border-2 rounded-xl px-3.5 py-3 text-left transition-colors ${
        filled ? "border-brand-yellow bg-brand-yellow/5" : "border-gray-200"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          filled
            ? "bg-brand-yellow text-brand-secondary"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p
          className={`text-sm truncate ${
            filled ? "font-semibold text-gray-900" : "text-font-dim"
          }`}
        >
          {value || placeholder}
        </p>
      </div>
      <svg
        className="w-5 h-5 text-gray-300 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}

// ── Location ──────────────────────────────────────────────────────────

function LocationPicker({
  form,
  update,
  token,
  onCreatePickupPoint,
}: {
  form: EditFormState;
  update: (patch: Partial<EditFormState>) => void;
  token: string;
  onCreatePickupPoint: () => void;
}) {
  const [activeSheet, setActiveSheet] = useState<
    "city" | "pickupLocation" | null
  >(null);

  const [cityItems, setCityItems] = useState<City[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  const [locations, setLocations] = useState<PickupLocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [pickupLocationSheetItems, setPickupLocationSheetItems] = useState<
    PickupLocationOption[]
  >([]);

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupPointsLoading, setPickupPointsLoading] = useState(false);

  async function fetchCities(query: string) {
    setCityLoading(true);
    try {
      const res = await searchCitiesApi(query);
      setCityItems(res.data?.results ?? []);
    } finally {
      setCityLoading(false);
    }
  }

  function filterPickupLocations(query: string) {
    const q = query.trim().toLowerCase();
    setPickupLocationSheetItems(
      q
        ? locations.filter((l) => l.location_name.toLowerCase().includes(q))
        : locations,
    );
  }

  useEffect(() => {
    if (!form.cityId) return;
    let cancelled = false;
    (async () => {
      setLocationsLoading(true);
      try {
        const res = await getPickupLocationsByCityApi(form.cityId!);
        if (!cancelled) setLocations(res.data ?? []);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.cityId]);

  useEffect(() => {
    if (!form.pickupLocationId) {
      setPickupPoints([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setPickupPointsLoading(true);
      try {
        const res = await getPickupPointsApi(token, form.pickupLocationId!);
        if (!cancelled && res.success && res.data) setPickupPoints(res.data);
      } finally {
        if (!cancelled) setPickupPointsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.pickupLocationId, token]);

  function openCitySheet() {
    setActiveSheet("city");
    fetchCities("");
  }
  function openPickupLocationSheet() {
    if (locationsLoading || locations.length === 0) return;
    setActiveSheet("pickupLocation");
    setPickupLocationSheetItems(locations);
  }

  return (
    <div className="space-y-3">
      <PickerField
        icon={PIN_ICON}
        label="City"
        value={form.cityName}
        placeholder="Select a city"
        onClick={openCitySheet}
      />

      {form.cityId && (
        <div>
          {locationsLoading ? (
            <p className="text-xs text-font-dim px-1">Loading...</p>
          ) : locations.length === 0 ? (
            <p className="text-xs text-red-500 px-1">
              No pickup locations exist in this city.
            </p>
          ) : (
            <PickerField
              icon={STOREFRONT_ICON}
              label="Pickup location"
              value={form.pickupLocationName}
              placeholder="Select a pickup location"
              onClick={openPickupLocationSheet}
            />
          )}
        </div>
      )}

      {form.pickupLocationId && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2 px-1">
            Exact pickup address
          </p>
          {pickupPointsLoading ? (
            <p className="text-xs text-font-dim px-1">
              Loading your saved addresses...
            </p>
          ) : pickupPoints.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-xs text-font-dim mb-2">
                No saved addresses in this area yet.
              </p>
              <button
                onClick={onCreatePickupPoint}
                className="text-xs font-bold text-brand-secondary bg-brand-yellow px-3 py-1.5 rounded-lg hover:bg-brand-yellow-lg transition-colors"
              >
                + Add pickup point
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pickupPoints.map((p) => {
                  const selected = form.pickupPointId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        update({
                          pickupPointId: p.id,
                          pickupPointLabel: p.label || p.address,
                        })
                      }
                      className={`w-full flex items-start gap-3 text-left border-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        selected
                          ? "border-brand-yellow bg-brand-yellow/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          selected
                            ? "bg-brand-yellow text-brand-secondary"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {PIN_ICON}
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {p.label || "Pickup point"}
                        </p>
                        <p className="text-xs text-font-dim mt-0.5">
                          {p.address}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onCreatePickupPoint}
                className="text-xs font-semibold text-brand-yellow-lg mt-2"
              >
                + Add a new pickup point
              </button>
            </>
          )}
        </div>
      )}

      {activeSheet === "city" && (
        <SearchPickerSheet
          title="Select city"
          placeholder="Search for a city..."
          items={cityItems}
          loading={cityLoading}
          getKey={(c) => c.id}
          renderItem={(c) => (
            <>
              {c.name}, <span className="text-font-dim">{c.state_name}</span>
            </>
          )}
          onQueryChange={fetchCities}
          onSelect={(c) => {
            update({
              cityId: c.id,
              cityName: c.name,
              pickupLocationId: null,
              pickupLocationName: "",
              pickupPointId: null,
              pickupPointLabel: "",
            });
            setActiveSheet(null);
          }}
          onClose={() => setActiveSheet(null)}
          showAllByDefault
          emptyLabel="No cities found."
        />
      )}

      {activeSheet === "pickupLocation" && (
        <SearchPickerSheet
          title="Select pickup location"
          placeholder="Search locations..."
          items={pickupLocationSheetItems}
          loading={false}
          getKey={(l) => l.id}
          renderItem={(l) => (
            <span className="font-medium">{l.location_name}</span>
          )}
          onQueryChange={filterPickupLocations}
          onSelect={(l) => {
            update({
              pickupLocationId: l.id,
              pickupLocationName: l.location_name,
              pickupPointId: null,
              pickupPointLabel: "",
            });
            setActiveSheet(null);
          }}
          onClose={() => setActiveSheet(null)}
          showAllByDefault
          emptyLabel="No matching locations."
        />
      )}
    </div>
  );
}

// ── Photos ────────────────────────────────────────────────────────────

function PhotosManager({
  listingId,
  images,
  setImages,
  token,
}: {
  listingId: string;
  images: ListingImage[];
  setImages: React.Dispatch<React.SetStateAction<ListingImage[]>>;
  token: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadListingImagesApi(
        listingId,
        Array.from(fileList),
        token,
      );
      const uploaded = (res.data as ListingImage[] | undefined) ?? [];
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: number) {
    setDeletingId(imageId);
    setError(null);
    try {
      await deleteListingImageApi(listingId, imageId, token);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
          {images.map((img) => (
            <div key={img.id} className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url ?? undefined}
                alt=""
                className="h-24 w-24 rounded-xl object-cover border border-gray-100"
              />
              <button
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center disabled:opacity-50 shadow-sm"
                aria-label="Delete photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        htmlFor="edit-listing-photo-input"
        className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 px-4 cursor-pointer hover:border-brand-yellow transition-colors bg-gray-50/50 ${
          uploading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {CAMERA_ICON}
        </svg>
        <span className="text-sm font-semibold text-gray-600">
          {uploading ? "Uploading..." : "Add more photos"}
        </span>
        <input
          id="edit-listing-photo-input"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Schedule ──────────────────────────────────────────────────────────

function SchedulePicker({
  form,
  update,
  token,
  onCreateNew,
}: {
  form: EditFormState;
  update: (patch: Partial<EditFormState>) => void;
  token: string;
  onCreateNew: () => void;
}) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getScheduleTemplatesApi(token);
        if (!cancelled) setTemplates(res.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading)
    return <p className="text-sm text-font-dim">Loading templates...</p>;

  return (
    <div className="space-y-2">
      {templates.map((t) => {
        const selected = form.scheduleTemplateId === t.id;
        return (
          <button
            key={t.id}
            onClick={() =>
              update({ scheduleTemplateId: t.id, scheduleTemplateName: t.name })
            }
            className={`w-full flex items-center gap-3 text-left border-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
              selected
                ? "border-brand-yellow bg-brand-yellow/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                selected
                  ? "bg-brand-yellow text-brand-secondary"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {CALENDAR_ICON}
              </svg>
            </div>
            {t.name}
          </button>
        );
      })}
      <button
        onClick={onCreateNew}
        className="text-sm font-semibold text-brand-yellow-lg"
      >
        + Create a new schedule template
      </button>
    </div>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────

function PricingEditor({
  form,
  update,
  token,
}: {
  form: EditFormState;
  update: (patch: Partial<EditFormState>) => void;
  token: string;
}) {
  const [packageTypes, setPackageTypes] = useState<PackageTypeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPackageTypesApi(token);
        if (!cancelled) setPackageTypes(res.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function addPackage() {
    update({
      pricingPackages: [
        ...form.pricingPackages,
        {
          packageTypeId: null,
          price: "",
          payAtPickupEnabled: true,
          kmLimit: "",
        },
      ],
    });
  }
  function updatePackage(index: number, patch: Partial<PricingPackageDraft>) {
    update({
      pricingPackages: form.pricingPackages.map((p, i) =>
        i === index ? { ...p, ...patch } : p,
      ),
    });
  }
  function removePackage(index: number) {
    update({
      pricingPackages: form.pricingPackages.filter((_, i) => i !== index),
    });
  }

  const usedIds = new Set(
    form.pricingPackages.map((p) => p.packageTypeId).filter(Boolean),
  );

  if (loading)
    return <p className="text-sm text-font-dim">Loading package types...</p>;

  return (
    <div className="space-y-4">
      {form.pricingPackages.map((pkg, i) => {
        const availableTypes = packageTypes.filter(
          (pt) => pt.id === pkg.packageTypeId || !usedIds.has(pt.id),
        );
        return (
          <div
            key={i}
            className="border border-gray-100 rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-yellow/15 text-brand-yellow-lg flex items-center justify-center text-[11px] font-bold shrink-0">
                  {i + 1}
                </div>
                <label className="text-xs font-semibold text-gray-600">
                  Package {i + 1}
                </label>
              </div>
              <button
                onClick={() => removePackage(i)}
                className="text-xs text-red-500 font-semibold"
              >
                Remove
              </button>
            </div>
            <select
              value={pkg.packageTypeId ?? ""}
              onChange={(e) =>
                updatePackage(i, {
                  packageTypeId: Number(e.target.value) || null,
                })
              }
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Select a package type</option>
              {availableTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} ({pt.category}, {pt.duration_hours}h)
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={pkg.price}
                    onChange={(e) =>
                      updatePackage(i, { price: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Km limit (blank = unlimited)
                </label>
                <input
                  type="number"
                  min="1"
                  value={pkg.kmLimit}
                  onChange={(e) =>
                    updatePackage(i, { kmLimit: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-3.5 py-3">
              <input
                type="checkbox"
                checked={pkg.payAtPickupEnabled}
                onChange={(e) =>
                  updatePackage(i, { payAtPickupEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-brand-yellow"
              />
              <span className="font-semibold text-font-main-sub">
                Allow pay at pickup
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-yellow-lg ml-auto">
                Recommended
              </span>
            </label>
          </div>
        );
      })}
      <button
        onClick={addPackage}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-semibold text-font-dim hover:border-brand-yellow hover:text-brand-secondary transition-colors"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add pricing package
      </button>
    </div>
  );
}

// ── Policies ──────────────────────────────────────────────────────────

function PoliciesEditor({
  form,
  update,
}: {
  form: EditFormState;
  update: (patch: Partial<EditFormState>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Fleet quantity at this location">
        <input
          type="number"
          min="1"
          value={form.availableCount}
          onChange={(e) => update({ availableCount: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Security deposit (₹)">
        <input
          type="number"
          min="0"
          value={form.securityDepositAmount}
          onChange={(e) => update({ securityDepositAmount: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      {/* <Field label="Km limit per day (optional)">
        <input
          type="number"
          min="1"
          value={form.kmLimitPerDay}
          onChange={(e) => update({ kmLimitPerDay: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field> */}
      <Field label="Excess charge per km (₹)">
        <input
          type="number"
          min="0"
          value={form.excessChargePerKm}
          onChange={(e) => update({ excessChargePerKm: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Late return penalty per hour (₹)">
        <input
          type="number"
          min="0"
          value={form.lateReturnPenaltyPerHour}
          onChange={(e) => update({ lateReturnPenaltyPerHour: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm bg-gray-50 rounded-xl px-3.5 py-3">
        <input
          type="checkbox"
          checked={form.doorstepDeliveryEnabled}
          onChange={(e) =>
            update({ doorstepDeliveryEnabled: e.target.checked })
          }
          className="w-4 h-4 accent-brand-yellow"
        />
        Offer doorstep delivery
      </label>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
