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
import type {
  City,
  PickupLocationOption,
  PackageTypeOption,
  ScheduleTemplate,
  ListingUpdatePayload,
} from "@/types/listing-create.types";
import type { ListingDetail, ListingImage } from "@/types/listing-detail.types";
import { PageLoader } from "@/components/ui/PageLoader";

interface PricingPackageDraft {
  packageTypeId: number | null;
  price: string;
  payAtPickupEnabled: boolean;
  partialPaymentPercentage: string;
  kmLimit: string;
}

interface EditFormState {
  cityId: number | null;
  cityName: string;
  pickupLocationId: number | null;
  pickupLocationName: string;
  scheduleTemplateId: number | null;
  scheduleTemplateName: string;
  pricingPackages: PricingPackageDraft[];
  availableCount: string;
  securityDepositAmount: string;
  kmLimitPerDay: string;
  excessChargePerKm: string;
  lateReturnPenaltyPerHour: string;
  doorstepDeliveryEnabled: boolean;
  operatingHoursStart: string;
  operatingHoursEnd: string;
}

function detailToFormState(detail: ListingDetail): EditFormState {
  return {
    cityId: detail.pickup_location.city_id,
    cityName: detail.pickup_location.city_name,
    pickupLocationId: detail.pickup_location.id,
    pickupLocationName: detail.pickup_location.name,
    scheduleTemplateId: detail.schedule.id,
    scheduleTemplateName: detail.schedule.template_name ?? "",
    pricingPackages: detail.pricing_packages.map((pkg) => ({
      packageTypeId: pkg.package_type_id,
      price: pkg.price,
      payAtPickupEnabled: pkg.pay_at_pickup_enabled,
      partialPaymentPercentage: pkg.partial_payment_percentage ?? "",
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
        : "",
    lateReturnPenaltyPerHour:
      detail.policies.late_return_penalty_per_hour != null
        ? String(detail.policies.late_return_penalty_per_hour)
        : "",
    doorstepDeliveryEnabled: detail.policies.doorstep_delivery_enabled,
    operatingHoursStart: detail.policies.operating_hours_start ?? "",
    operatingHoursEnd: detail.policies.operating_hours_end ?? "",
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

  // Restore in-progress edits from sessionStorage (schedule-template
  // round trip) if present; otherwise load fresh from the API.
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
        // Only seed the form from the API if nothing was restored —
        // a saved draft means the vendor was mid-edit before
        // navigating away, and their in-progress changes should win.
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

  async function handleSubmit() {
    if (!token || !form || !listingId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: ListingUpdatePayload = {
        pickup_location_id: form.pickupLocationId!,
        schedule_template_id: form.scheduleTemplateId!,
        available_count: Number(form.availableCount) || 1,
        security_deposit_amount: form.securityDepositAmount || "0",
        km_limit_per_day: form.kmLimitPerDay
          ? Number(form.kmLimitPerDay)
          : null,
        excess_charge_per_km: form.excessChargePerKm || null,
        late_return_penalty_per_hour: form.lateReturnPenaltyPerHour || null,
        doorstep_delivery_enabled: form.doorstepDeliveryEnabled,
        operating_hours_start: form.operatingHoursStart || null,
        operating_hours_end: form.operatingHoursEnd || null,
        pricing_packages: form.pricingPackages.map((p) => ({
          package_type_id: p.packageTypeId!,
          price: p.price,
          pay_at_pickup_enabled: p.payAtPickupEnabled,
          partial_payment_percentage: p.payAtPickupEnabled
            ? p.partialPaymentPercentage || null
            : null,
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
          <PageLoader />
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

  return (
    <>
      <Header title="Edit listing" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-5">
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-xs text-font-dim">Vehicle type</p>
          <p className="text-sm font-semibold text-font-main-sub mt-0.5">
            {vehicleTypeLabel}
          </p>
          <p className="text-xs text-font-dim mt-1">
            Vehicle type can&apos;t be changed after creation.
          </p>
        </div>

        <Section title="Pickup location">
          <LocationPicker form={form} update={update} />
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
          disabled={submitting}
          className="w-full font-bold rounded-xl py-4 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
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
    <section className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className="font-heading font-bold text-sm text-font-main-sub mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Location ──────────────────────────────────────────────────────────

function LocationPicker({
  form,
  update,
}: {
  form: EditFormState;
  update: (patch: Partial<EditFormState>) => void;
}) {
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [locations, setLocations] = useState<PickupLocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  useEffect(() => {
    if (!cityQuery.trim()) {
      setCityResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchCitiesApi(cityQuery);
      setCityResults(res.data?.results ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

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

  function selectCity(city: City) {
    update({
      cityId: city.id,
      cityName: city.name,
      pickupLocationId: null,
      pickupLocationName: "",
    });
    setCityQuery("");
    setCityResults([]);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          City
        </label>
        <div className="flex items-center justify-between border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-2">
          <span>{form.cityName}</span>
          <button
            onClick={() => update({ cityId: null, cityName: "" })}
            className="text-xs font-semibold text-brand-yellow-lg"
          >
            Change
          </button>
        </div>
        {!form.cityId && (
          <>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Search for a city..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-yellow"
            />
            {cityResults.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {cityResults.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => selectCity(city)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50"
                  >
                    {city.name},{" "}
                    <span className="text-font-dim">{city.state_name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {form.cityId && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Pickup location
          </label>
          {locationsLoading ? (
            <PageLoader />
          ) : (
            <select
              value={form.pickupLocationId ?? ""}
              onChange={(e) => {
                const loc = locations.find(
                  (l) => l.id === Number(e.target.value),
                );
                update({
                  pickupLocationId: loc?.id ?? null,
                  pickupLocationName: loc?.location_name ?? "",
                });
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Select a pickup location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          )}
        </div>
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
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center disabled:opacity-50"
                aria-label="Delete photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
        className="block w-full text-sm"
      />
      {uploading && <p className="text-xs text-font-dim">Uploading...</p>}
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
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() =>
            update({ scheduleTemplateId: t.id, scheduleTemplateName: t.name })
          }
          className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
            form.scheduleTemplateId === t.id
              ? "border-brand-yellow bg-brand-yellow/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {t.name}
        </button>
      ))}
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
          payAtPickupEnabled: false,
          partialPaymentPercentage: "",
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
              <label className="text-xs font-semibold text-gray-600">
                Package type
              </label>
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
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={pkg.price}
                  onChange={(e) => updatePackage(i, { price: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Km limit (optional)
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pkg.payAtPickupEnabled}
                onChange={(e) =>
                  updatePackage(i, { payAtPickupEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-brand-yellow"
              />
              Allow pay at pickup
            </label>
            {pkg.payAtPickupEnabled && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Partial payment upfront (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pkg.partialPaymentPercentage}
                  onChange={(e) =>
                    updatePackage(i, {
                      partialPaymentPercentage: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            )}
          </div>
        );
      })}
      <button
        onClick={addPackage}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-semibold text-font-dim hover:border-brand-yellow hover:text-brand-secondary transition-colors"
      >
        + Add pricing package
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
      <Field label="Km limit per day (optional)">
        <input
          type="number"
          min="1"
          value={form.kmLimitPerDay}
          onChange={(e) => update({ kmLimitPerDay: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Excess charge per km (optional, ₹)">
        <input
          type="number"
          min="0"
          value={form.excessChargePerKm}
          onChange={(e) => update({ excessChargePerKm: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Late return penalty per hour (optional, ₹)">
        <input
          type="number"
          min="0"
          value={form.lateReturnPenaltyPerHour}
          onChange={(e) => update({ lateReturnPenaltyPerHour: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display hours start (optional)">
          <input
            type="time"
            value={form.operatingHoursStart}
            onChange={(e) => update({ operatingHoursStart: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Display hours end (optional)">
          <input
            type="time"
            value={form.operatingHoursEnd}
            onChange={(e) => update({ operatingHoursEnd: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>
      </div>
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
