"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getVehicleTypesApi,
  getPackageTypesApi,
  getScheduleTemplatesApi,
  createListingApi,
  uploadListingImagesApi,
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
} from "@/lib/listingDraft";
import type {
  VehicleTypeOption,
  City,
  PickupLocationOption,
  PackageTypeOption,
  ScheduleTemplate,
  ListingCreatePayload,
} from "@/types/listing-create.types";

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  "Vehicle & location",
  "Schedule",
  "Pricing",
  "Policies",
  "Review",
];

interface PricingPackageDraft {
  packageTypeId: number | null;
  price: string;
  payAtPickupEnabled: boolean;
  partialPaymentPercentage: string;
  kmLimit: string;
}

interface WizardDraft {
  step: number;
  vehicleTypeId: number | null;
  vehicleTypeLabel: string;
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

const EMPTY_DRAFT: WizardDraft = {
  step: 1,
  vehicleTypeId: null,
  vehicleTypeLabel: "",
  cityId: null,
  cityName: "",
  pickupLocationId: null,
  pickupLocationName: "",
  scheduleTemplateId: null,
  scheduleTemplateName: "",
  pricingPackages: [],
  availableCount: "1",
  securityDepositAmount: "0",
  kmLimitPerDay: "",
  excessChargePerKm: "",
  lateReturnPenaltyPerHour: "",
  doorstepDeliveryEnabled: false,
  operatingHoursStart: "",
  operatingHoursEnd: "",
};

export default function NewListingPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  // Restore any in-progress draft on mount — this is what makes the
  // "create a schedule template" round trip work without losing
  // everything the vendor already picked.
  useEffect(() => {
    const saved = loadDraft<WizardDraft>();
    if (saved) setDraft(saved);
    setHydrated(true);
  }, []);

  // Persist on every change, but only once hydration has actually run
  // — otherwise the very first render's EMPTY_DRAFT would overwrite a
  // just-restored draft before the effect above gets to it.
  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  function update(patch: Partial<WizardDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function goNext() {
    update({ step: Math.min(draft.step + 1, TOTAL_STEPS) });
  }
  function goBack() {
    update({ step: Math.max(draft.step - 1, 1) });
  }

  const canProceed = (() => {
    switch (draft.step) {
      case 1:
        return !!draft.vehicleTypeId && !!draft.pickupLocationId;
      case 2:
        return !!draft.scheduleTemplateId;
      case 3:
        return (
          draft.pricingPackages.length > 0 &&
          draft.pricingPackages.every((p) => p.packageTypeId && p.price)
        );
      case 4:
        return !!draft.availableCount;
      default:
        return true;
    }
  })();

  async function handleSubmit() {
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: ListingCreatePayload = {
        vehicle_type_id: draft.vehicleTypeId!,
        pickup_location_id: draft.pickupLocationId!,
        schedule_template_id: draft.scheduleTemplateId!,
        available_count: Number(draft.availableCount) || 1,
        security_deposit_amount: draft.securityDepositAmount || "0",
        km_limit_per_day: draft.kmLimitPerDay
          ? Number(draft.kmLimitPerDay)
          : null,
        excess_charge_per_km: draft.excessChargePerKm || null,
        late_return_penalty_per_hour: draft.lateReturnPenaltyPerHour || null,
        doorstep_delivery_enabled: draft.doorstepDeliveryEnabled,
        operating_hours_start: draft.operatingHoursStart || null,
        operating_hours_end: draft.operatingHoursEnd || null,
        pricing_packages: draft.pricingPackages.map((p) => ({
          package_type_id: p.packageTypeId!,
          price: p.price,
          pay_at_pickup_enabled: p.payAtPickupEnabled,
          partial_payment_percentage: p.payAtPickupEnabled
            ? p.partialPaymentPercentage || null
            : null,
          km_limit: p.kmLimit ? Number(p.kmLimit) : null,
        })),
      };

      const res = await createListingApi(payload, token);
      if (!res.success || !res.data) {
        setSubmitError(res.message || "Failed to create listing");
        return;
      }
      clearDraft();
      setCreatedListingId(res.data.id);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create listing",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCreateScheduleTemplate() {
    // Draft is already persisted via the effect above — safe to leave.
    saveReturnTo("/fleet/listing/new");
    router.push("/fleet/schedule-templates/new" as Route);
  }

  if (!hydrated || !token) return null;

  if (createdListingId !== null) {
    return (
      <>
        <Header
          title="Add photos"
          onBack={() => router.push("/fleet" as Route)}
        />
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
          <PhotoUploadPanel
            listingId={createdListingId}
            token={token}
            onDone={() =>
              router.push(`/fleet/listing?id=${createdListingId}` as Route)
            }
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Add a bike" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-font-dim mb-2">
            <span>
              Step {draft.step} of {TOTAL_STEPS}
            </span>
            <span>{STEP_TITLES[draft.step - 1]}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-yellow transition-all"
              style={{ width: `${(draft.step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {draft.step === 1 && (
          <StepVehicleLocation draft={draft} update={update} token={token} />
        )}
        {draft.step === 2 && (
          <StepSchedule
            draft={draft}
            update={update}
            token={token}
            onCreateNew={handleCreateScheduleTemplate}
          />
        )}
        {draft.step === 3 && (
          <StepPricing draft={draft} update={update} token={token} />
        )}
        {draft.step === 4 && <StepPolicies draft={draft} update={update} />}
        {draft.step === 5 && (
          <StepReview
            draft={draft}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={submitError}
          />
        )}

        {draft.step < TOTAL_STEPS && (
          <div className="flex gap-3 mt-8">
            {draft.step > 1 && (
              <button
                onClick={goBack}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3.5 text-sm font-bold text-font-dim"
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="flex-1 rounded-xl py-3.5 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
        {draft.step === TOTAL_STEPS && (
          <button
            onClick={goBack}
            className="w-full border-2 border-gray-200 rounded-xl py-3.5 text-sm font-bold text-font-dim mt-4"
          >
            Back
          </button>
        )}
      </main>
    </>
  );
}

// ── Step 1: Vehicle & location ──────────────────────────────────────────

function StepVehicleLocation({
  draft,
  update,
  token,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  token: string;
}) {
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleResults, setVehicleResults] = useState<VehicleTypeOption[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  const [cityQuery, setCityQuery] = useState(draft.cityName);
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  const [locations, setLocations] = useState<PickupLocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  useEffect(() => {
    if (!vehicleQuery.trim()) {
      setVehicleResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setVehicleLoading(true);
      try {
        const res = await getVehicleTypesApi(vehicleQuery, token);
        setVehicleResults(res.data?.results ?? []);
      } finally {
        setVehicleLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [vehicleQuery, token]);

  useEffect(() => {
    if (!cityQuery.trim()) {
      setCityResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await searchCitiesApi(cityQuery);
        setCityResults(res.data?.results ?? []);
      } finally {
        setCityLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  useEffect(() => {
    if (!draft.cityId) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLocationsLoading(true);
      try {
        const res = await getPickupLocationsByCityApi(draft.cityId!);
        if (!cancelled) setLocations(res.data ?? []);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft.cityId]);

  function selectVehicleType(vt: VehicleTypeOption) {
    update({
      vehicleTypeId: vt.id,
      vehicleTypeLabel: `${vt.brand} ${vt.name} (${vt.make_year})`,
    });
    setVehicleQuery("");
    setVehicleResults([]);
  }

  function selectCity(city: City) {
    update({
      cityId: city.id,
      cityName: city.name,
      pickupLocationId: null,
      pickupLocationName: "",
    });
    setCityQuery(city.name);
    setCityResults([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Vehicle type</label>
        {draft.vehicleTypeId ? (
          <div className="flex items-center justify-between border-2 border-brand-yellow rounded-xl px-4 py-3 bg-brand-yellow/5">
            <span className="font-medium text-sm">
              {draft.vehicleTypeLabel}
            </span>
            <button
              onClick={() =>
                update({ vehicleTypeId: null, vehicleTypeLabel: "" })
              }
              className="text-xs font-semibold text-red-500"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Search by brand or model..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
            />
            {vehicleLoading && (
              <p className="text-xs text-font-dim mt-2">Searching...</p>
            )}
            {vehicleResults.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {vehicleResults.map((vt) => (
                  <button
                    key={vt.id}
                    onClick={() => selectVehicleType(vt)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium">
                      {vt.brand} {vt.name}
                    </span>
                    <span className="text-font-dim">
                      {" "}
                      ({vt.make_year}, {vt.transmission_type})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">City</label>
        {draft.cityId ? (
          <div className="flex items-center justify-between border-2 border-brand-yellow rounded-xl px-4 py-3 bg-brand-yellow/5">
            <span className="font-medium text-sm">{draft.cityName}</span>
            <button
              onClick={() => {
                update({
                  cityId: null,
                  cityName: "",
                  pickupLocationId: null,
                  pickupLocationName: "",
                });
                setCityQuery("");
              }}
              className="text-xs font-semibold text-red-500"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Search for a city..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
            />
            {cityLoading && (
              <p className="text-xs text-font-dim mt-2">Searching...</p>
            )}
            {cityResults.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {cityResults.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => selectCity(city)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
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

      {draft.cityId && (
        <div>
          <label className="block text-sm font-semibold mb-2">
            Pickup location
          </label>
          {locationsLoading ? (
            <p className="text-xs text-font-dim">Loading locations...</p>
          ) : locations.length === 0 ? (
            <p className="text-xs text-red-500">
              No pickup locations exist in this city yet. Contact your admin to
              add one.
            </p>
          ) : (
            <select
              value={draft.pickupLocationId ?? ""}
              onChange={(e) => {
                const loc = locations.find(
                  (l) => l.id === Number(e.target.value),
                );
                update({
                  pickupLocationId: loc?.id ?? null,
                  pickupLocationName: loc?.location_name ?? "",
                });
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow bg-white"
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

// ── Step 2: Schedule ─────────────────────────────────────────────────────

function StepSchedule({
  draft,
  update,
  token,
  onCreateNew,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  token: string;
  onCreateNew: () => void;
}) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getScheduleTemplatesApi(token);
        if (!cancelled) {
          if (res.success && res.data) setTemplates(res.data);
          else setError(res.message || "Failed to load schedule templates");
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading)
    return (
      <p className="text-sm text-font-dim">
        Loading your schedule templates...
      </p>
    );

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {templates.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-font-dim mb-3">
            You don&apos;t have any schedule templates yet.
          </p>
          <button
            onClick={onCreateNew}
            className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
          >
            + Create schedule template
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  update({
                    scheduleTemplateId: t.id,
                    scheduleTemplateName: t.name,
                  })
                }
                className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  draft.scheduleTemplateId === t.id
                    ? "border-brand-yellow bg-brand-yellow/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <button
            onClick={onCreateNew}
            className="text-sm font-semibold text-brand-yellow-lg"
          >
            + Create a new schedule template
          </button>
        </>
      )}
    </div>
  );
}

// ── Step 3: Pricing packages ─────────────────────────────────────────────

function StepPricing({
  draft,
  update,
  token,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
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
        ...draft.pricingPackages,
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
    const next = draft.pricingPackages.map((p, i) =>
      i === index ? { ...p, ...patch } : p,
    );
    update({ pricingPackages: next });
  }

  function removePackage(index: number) {
    update({
      pricingPackages: draft.pricingPackages.filter((_, i) => i !== index),
    });
  }

  const usedIds = new Set(
    draft.pricingPackages.map((p) => p.packageTypeId).filter(Boolean),
  );

  if (loading)
    return <p className="text-sm text-font-dim">Loading package types...</p>;

  return (
    <div className="space-y-4">
      {draft.pricingPackages.map((pkg, i) => {
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

// ── Step 4: Policies ──────────────────────────────────────────────────────

function StepPolicies({
  draft,
  update,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Fleet quantity at this location">
        <input
          type="number"
          min="1"
          value={draft.availableCount}
          onChange={(e) => update({ availableCount: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Security deposit (₹)">
        <input
          type="number"
          min="0"
          value={draft.securityDepositAmount}
          onChange={(e) => update({ securityDepositAmount: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Km limit per day (optional)">
        <input
          type="number"
          min="1"
          value={draft.kmLimitPerDay}
          onChange={(e) => update({ kmLimitPerDay: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Excess charge per km (optional, ₹)">
        <input
          type="number"
          min="0"
          value={draft.excessChargePerKm}
          onChange={(e) => update({ excessChargePerKm: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Late return penalty per hour (optional, ₹)">
        <input
          type="number"
          min="0"
          value={draft.lateReturnPenaltyPerHour}
          onChange={(e) => update({ lateReturnPenaltyPerHour: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.doorstepDeliveryEnabled}
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
            value={draft.operatingHoursStart}
            onChange={(e) => update({ operatingHoursStart: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Display hours end (optional)">
          <input
            type="time"
            value={draft.operatingHoursEnd}
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

// ── Step 5: Review & submit ───────────────────────────────────────────────

function StepReview({
  draft,
  onSubmit,
  submitting,
  error,
}: {
  draft: WizardDraft;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <ReviewRow label="Vehicle" value={draft.vehicleTypeLabel} />
      <ReviewRow
        label="Location"
        value={`${draft.pickupLocationName}, ${draft.cityName}`}
      />
      <ReviewRow label="Schedule" value={draft.scheduleTemplateName} />
      <ReviewRow
        label="Pricing packages"
        value={`${draft.pricingPackages.length} package(s)`}
      />
      <ReviewRow label="Fleet quantity" value={draft.availableCount} />

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full font-bold rounded-xl py-4 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
      >
        {submitting ? "Creating listing..." : "Create listing"}
      </button>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
      <span className="text-font-dim">{label}</span>
      <span className="font-medium text-font-main-sub text-right">{value}</span>
    </div>
  );
}

// ── Post-create: photo upload ─────────────────────────────────────────────

function PhotoUploadPanel({
  listingId,
  token,
  onDone,
}: {
  listingId: number;
  token: string;
  onDone: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await uploadListingImagesApi(listingId, files, token);
      setUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-font-dim">
        Your listing was created. Add a few photos now, or skip and add them
        later.
      </p>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm"
      />

      {previews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="h-24 w-24 object-cover rounded-xl border border-gray-100 shrink-0"
            />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
      {uploaded && (
        <p className="text-sm text-green-600 font-medium">Photos uploaded.</p>
      )}

      <div className="space-y-3">
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload photos"}
        </button>
        <button
          onClick={onDone}
          className="w-full text-sm font-semibold text-font-dim py-2"
        >
          {uploaded ? "Done" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
