"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getBrandsApi,
  getVehicleTypesApi,
  getPackageTypesApi,
  getScheduleTemplatesApi,
  getPickupPointsApi,
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
import { SearchPickerSheet } from "@/components/ui/SearchPickerSheet";
import type {
  BrandOption,
  VehicleTypeOption,
  City,
  PickupLocationOption,
  PackageTypeOption,
  ScheduleTemplate,
  PickupPoint,
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
  kmLimit: string;
}

interface WizardDraft {
  step: number;
  brandId: number | null;
  brandName: string;
  vehicleTypeId: number | null;
  vehicleTypeLabel: string;
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

const EMPTY_DRAFT: WizardDraft = {
  step: 1,
  brandId: null,
  brandName: "",
  vehicleTypeId: null,
  vehicleTypeLabel: "",
  cityId: null,
  cityName: "",
  pickupLocationId: null,
  pickupLocationName: "",
  pickupPointId: null,
  pickupPointLabel: "",
  scheduleTemplateId: null,
  scheduleTemplateName: "",
  pricingPackages: [],
  availableCount: "1",
  securityDepositAmount: "0",
  kmLimitPerDay: "",
  excessChargePerKm: "",
  lateReturnPenaltyPerHour: "",
  doorstepDeliveryEnabled: false,
};

export default function NewListingPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadDraft<WizardDraft>();
    if (saved) setDraft(saved);
    setHydrated(true);
  }, []);

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
        return (
          !!draft.vehicleTypeId &&
          !!draft.pickupLocationId &&
          !!draft.pickupPointId
        );
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
        pickup_point_id: draft.pickupPointId!,
        schedule_template_id: draft.scheduleTemplateId!,
        available_count: Number(draft.availableCount) || 1,
        security_deposit_amount: draft.securityDepositAmount || "0",
        km_limit_per_day: draft.kmLimitPerDay
          ? Number(draft.kmLimitPerDay)
          : null,
        excess_charge_per_km: draft.excessChargePerKm || null,
        late_return_penalty_per_hour: draft.lateReturnPenaltyPerHour || null,
        doorstep_delivery_enabled: draft.doorstepDeliveryEnabled,
        operating_hours_start: null,
        operating_hours_end: null,
        pricing_packages: draft.pricingPackages.map((p) => ({
          package_type_id: p.packageTypeId!,
          price: p.price,
          pay_at_pickup_enabled: p.payAtPickupEnabled,
          partial_payment_percentage: null,
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
    saveReturnTo("/fleet/listing/new");
    router.push("/fleet/schedule-templates/new" as Route);
  }

  function handleCreatePickupPoint() {
    saveReturnTo("/fleet/listing/new");
    const params = new URLSearchParams();
    if (draft.pickupLocationId)
      params.set("pickup_location_id", String(draft.pickupLocationId));
    if (draft.pickupLocationName)
      params.set("pickup_location_name", draft.pickupLocationName);
    router.push(`/fleet/pickup-points/new?${params.toString()}` as Route);
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
          <StepVehicleLocation
            draft={draft}
            update={update}
            token={token}
            onCreatePickupPoint={handleCreatePickupPoint}
          />
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

type ActiveSheet = "brand" | "vehicleType" | "city" | null;

function StepVehicleLocation({
  draft,
  update,
  token,
  onCreatePickupPoint,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  token: string;
  onCreatePickupPoint: () => void;
}) {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const [brandItems, setBrandItems] = useState<BrandOption[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);

  const [vehicleTypeItems, setVehicleTypeItems] = useState<VehicleTypeOption[]>(
    [],
  );
  const [vehicleTypeLoading, setVehicleTypeLoading] = useState(false);

  const [cityItems, setCityItems] = useState<City[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  const [locations, setLocations] = useState<PickupLocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupPointsLoading, setPickupPointsLoading] = useState(false);

  async function fetchBrands(query: string) {
    setBrandLoading(true);
    try {
      const res = await getBrandsApi(token, query);
      setBrandItems(res.data ?? []);
    } finally {
      setBrandLoading(false);
    }
  }

  async function fetchVehicleTypes(query: string) {
    if (!draft.brandId) return;
    setVehicleTypeLoading(true);
    try {
      const res = await getVehicleTypesApi(query, token, draft.brandId);
      setVehicleTypeItems(res.data?.results ?? []);
    } finally {
      setVehicleTypeLoading(false);
    }
  }

  async function fetchCities(query: string) {
    if (!query.trim()) {
      setCityItems([]);
      return;
    }
    setCityLoading(true);
    try {
      const res = await searchCitiesApi(query);
      setCityItems(res.data?.results ?? []);
    } finally {
      setCityLoading(false);
    }
  }

  useEffect(() => {
    if (!draft.pickupLocationId) return;
    let cancelled = false;
    (async () => {
      setPickupPointsLoading(true);
      try {
        const res = await getPickupPointsApi(token, draft.pickupLocationId!);
        if (!cancelled && res.success && res.data) setPickupPoints(res.data);
      } finally {
        if (!cancelled) setPickupPointsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft.pickupLocationId, token]);

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

  function openBrandSheet() {
    setActiveSheet("brand");
    fetchBrands("");
  }
  function openVehicleTypeSheet() {
    if (!draft.brandId) return;
    setActiveSheet("vehicleType");
    fetchVehicleTypes("");
  }
  function openCitySheet() {
    setActiveSheet("city");
    setCityItems([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Brand</label>
        <button
          onClick={openBrandSheet}
          className={`w-full text-left flex items-center justify-between border-2 rounded-xl px-4 py-3 text-sm ${
            draft.brandId
              ? "border-brand-yellow bg-brand-yellow/5 font-medium"
              : "border-gray-300 text-font-dim"
          }`}
        >
          {draft.brandName || "Select a brand"}
          <ChevronIcon />
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Vehicle type</label>
        <button
          onClick={openVehicleTypeSheet}
          disabled={!draft.brandId}
          className={`w-full text-left flex items-center justify-between border-2 rounded-xl px-4 py-3 text-sm transition-colors ${
            draft.vehicleTypeId
              ? "border-brand-yellow bg-brand-yellow/5 font-medium"
              : "border-gray-300 text-font-dim"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {draft.vehicleTypeLabel ||
            (draft.brandId ? "Select a vehicle type" : "Select a brand first")}
          <ChevronIcon />
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">City</label>
        <button
          onClick={openCitySheet}
          className={`w-full text-left flex items-center justify-between border-2 rounded-xl px-4 py-3 text-sm ${
            draft.cityId
              ? "border-brand-yellow bg-brand-yellow/5 font-medium"
              : "border-gray-300 text-font-dim"
          }`}
        >
          {draft.cityName || "Search for a city"}
          <ChevronIcon />
        </button>
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
                  pickupPointId: null,
                  pickupPointLabel: "",
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

      {draft.pickupLocationId && (
        <div>
          <label className="block text-sm font-semibold mb-2">
            Exact pickup address
          </label>
          {pickupPointsLoading ? (
            <p className="text-xs text-font-dim">
              Loading your saved addresses...
            </p>
          ) : pickupPoints.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-font-dim mb-3">
                No saved addresses in this area yet.
              </p>
              <button
                onClick={onCreatePickupPoint}
                className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
              >
                + Add pickup point
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pickupPoints.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      update({
                        pickupPointId: p.id,
                        pickupPointLabel: p.label || p.address,
                      })
                    }
                    className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm transition-colors ${
                      draft.pickupPointId === p.id
                        ? "border-brand-yellow bg-brand-yellow/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">{p.label || "Pickup point"}</p>
                    <p className="text-xs text-font-dim mt-0.5">{p.address}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={onCreatePickupPoint}
                className="text-sm font-semibold text-brand-yellow-lg mt-2"
              >
                + Add a new pickup point
              </button>
            </>
          )}
        </div>
      )}

      {activeSheet === "brand" && (
        <SearchPickerSheet
          title="Select brand"
          placeholder="Search brands..."
          items={brandItems}
          loading={brandLoading}
          getKey={(b) => b.id}
          renderItem={(b) => <span className="font-medium">{b.name}</span>}
          onQueryChange={fetchBrands}
          onSelect={(b) => {
            update({
              brandId: b.id,
              brandName: b.name,
              vehicleTypeId: null,
              vehicleTypeLabel: "",
            });
            setActiveSheet(null);
          }}
          onClose={() => setActiveSheet(null)}
          showAllByDefault
          emptyLabel="No brands found."
        />
      )}

      {activeSheet === "vehicleType" && (
        <SearchPickerSheet
          title="Select vehicle type"
          placeholder="Search by model..."
          items={vehicleTypeItems}
          loading={vehicleTypeLoading}
          getKey={(v) => v.id}
          renderItem={(v) => (
            <>
              <span className="font-medium">{v.name}</span>
              <span className="text-font-dim">
                {" "}
                ({v.make_year}, {v.transmission_type})
              </span>
            </>
          )}
          onQueryChange={fetchVehicleTypes}
          onSelect={(v) => {
            update({
              vehicleTypeId: v.id,
              vehicleTypeLabel: `${v.brand} ${v.name} (${v.make_year})`,
            });
            setActiveSheet(null);
          }}
          onClose={() => setActiveSheet(null)}
          showAllByDefault
          emptyLabel="No vehicle types found for this brand."
        />
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
          emptyLabel="Type to search for a city."
        />
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
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
          kmLimit: "",
        },
      ],
    });
  }
  function updatePackage(index: number, patch: Partial<PricingPackageDraft>) {
    update({
      pricingPackages: draft.pricingPackages.map((p, i) =>
        i === index ? { ...p, ...patch } : p,
      ),
    });
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
      <ReviewRow label="Pickup point" value={draft.pickupPointLabel} />
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

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import type { Route } from "next";
// import { Header } from "@/components/layout/Header";
// import { useAuth } from "@/context/AuthContext";
// import {
//   getBrandsApi,
//   getVehicleTypesApi,
//   getPackageTypesApi,
//   getScheduleTemplatesApi,
//   getPickupPointsApi,
//   createListingApi,
//   uploadListingImagesApi,
// } from "@/services/fleet.service";
// import {
//   searchCitiesApi,
//   getPickupLocationsByCityApi,
// } from "@/services/locations.service";
// import {
//   saveDraft,
//   loadDraft,
//   clearDraft,
//   saveReturnTo,
// } from "@/lib/listingDraft";
// import { SearchPickerSheet } from "@/components/ui/SearchPickerSheet";
// import type {
//   BrandOption,
//   VehicleTypeOption,
//   City,
//   PickupLocationOption,
//   PackageTypeOption,
//   ScheduleTemplate,
//   PickupPoint,
//   ListingCreatePayload,
// } from "@/types/listing-create.types";

// const TOTAL_STEPS = 5;
// const STEP_TITLES = [
//   "Vehicle & Location",
//   "Schedule",
//   "Pricing",
//   "Policies",
//   "Review",
// ];

// interface PricingPackageDraft {
//   packageTypeId: number | null;
//   price: string;
//   payAtPickupEnabled: boolean;
//   kmLimit: string;
// }

// interface WizardDraft {
//   step: number;
//   brandId: number | null;
//   brandName: string;
//   vehicleTypeId: number | null;
//   vehicleTypeLabel: string;
//   cityId: number | null;
//   cityName: string;
//   pickupLocationId: number | null;
//   pickupLocationName: string;
//   pickupPointId: number | null;
//   pickupPointLabel: string;
//   scheduleTemplateId: number | null;
//   scheduleTemplateName: string;
//   pricingPackages: PricingPackageDraft[];
//   availableCount: string;
//   securityDepositAmount: string;
//   kmLimitPerDay: string;
//   excessChargePerKm: string;
//   lateReturnPenaltyPerHour: string;
//   doorstepDeliveryEnabled: boolean;
// }

// const EMPTY_DRAFT: WizardDraft = {
//   step: 1,
//   brandId: null,
//   brandName: "",
//   vehicleTypeId: null,
//   vehicleTypeLabel: "",
//   cityId: null,
//   cityName: "",
//   pickupLocationId: null,
//   pickupLocationName: "",
//   pickupPointId: null,
//   pickupPointLabel: "",
//   scheduleTemplateId: null,
//   scheduleTemplateName: "",
//   pricingPackages: [],
//   availableCount: "1",
//   securityDepositAmount: "0",
//   kmLimitPerDay: "",
//   excessChargePerKm: "",
//   lateReturnPenaltyPerHour: "",
//   doorstepDeliveryEnabled: false,
// };

// export default function NewListingPage() {
//   const router = useRouter();
//   const { token } = useAuth();

//   const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
//   const [hydrated, setHydrated] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   const [createdListingId, setCreatedListingId] = useState<number | null>(null);

//   useEffect(() => {
//     const saved = loadDraft<WizardDraft>();
//     if (saved) setDraft(saved);
//     setHydrated(true);
//   }, []);

//   useEffect(() => {
//     if (hydrated) saveDraft(draft);
//   }, [draft, hydrated]);

//   function update(patch: Partial<WizardDraft>) {
//     setDraft((prev) => ({ ...prev, ...patch }));
//   }

//   function goNext() {
//     update({ step: Math.min(draft.step + 1, TOTAL_STEPS) });
//   }
//   function goBack() {
//     update({ step: Math.max(draft.step - 1, 1) });
//   }

//   const canProceed = (() => {
//     switch (draft.step) {
//       case 1:
//         return (
//           !!draft.vehicleTypeId &&
//           !!draft.pickupLocationId &&
//           !!draft.pickupPointId
//         );
//       case 2:
//         return !!draft.scheduleTemplateId;
//       case 3:
//         return (
//           draft.pricingPackages.length > 0 &&
//           draft.pricingPackages.every((p) => p.packageTypeId && p.price)
//         );
//       case 4:
//         return !!draft.availableCount;
//       default:
//         return true;
//     }
//   })();

//   async function handleSubmit() {
//     if (!token) return;
//     setSubmitting(true);
//     setSubmitError(null);
//     try {
//       const payload: ListingCreatePayload = {
//         vehicle_type_id: draft.vehicleTypeId!,
//         pickup_location_id: draft.pickupLocationId!,
//         pickup_point_id: draft.pickupPointId!,
//         schedule_template_id: draft.scheduleTemplateId!,
//         available_count: Number(draft.availableCount) || 1,
//         security_deposit_amount: draft.securityDepositAmount || "0",
//         km_limit_per_day: draft.kmLimitPerDay
//           ? Number(draft.kmLimitPerDay)
//           : null,
//         excess_charge_per_km: draft.excessChargePerKm || null,
//         late_return_penalty_per_hour: draft.lateReturnPenaltyPerHour || null,
//         doorstep_delivery_enabled: draft.doorstepDeliveryEnabled,
//         operating_hours_start: null,
//         operating_hours_end: null,
//         pricing_packages: draft.pricingPackages.map((p) => ({
//           package_type_id: p.packageTypeId!,
//           price: p.price,
//           pay_at_pickup_enabled: p.payAtPickupEnabled,
//           partial_payment_percentage: null,
//           km_limit: p.kmLimit ? Number(p.kmLimit) : null,
//         })),
//       };

//       const res = await createListingApi(payload, token);
//       if (!res.success || !res.data) {
//         setSubmitError(res.message || "Failed to create listing");
//         return;
//       }
//       clearDraft();
//       setCreatedListingId(res.data.id);
//     } catch (err) {
//       setSubmitError(
//         err instanceof Error ? err.message : "Failed to create listing",
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   function handleCreateScheduleTemplate() {
//     saveReturnTo("/fleet/listing/new");
//     router.push("/fleet/schedule-templates/new" as Route);
//   }

//   function handleCreatePickupPoint() {
//     saveReturnTo("/fleet/listing/new");
//     const params = new URLSearchParams();
//     if (draft.pickupLocationId)
//       params.set("pickup_location_id", String(draft.pickupLocationId));
//     if (draft.pickupLocationName)
//       params.set("pickup_location_name", draft.pickupLocationName);
//     router.push(`/fleet/pickup-points/new?${params.toString()}` as Route);
//   }

//   if (!hydrated || !token) return null;

//   if (createdListingId !== null) {
//     return (
//       <div className="bg-[#F4F2EE] min-h-screen flex flex-col">
//         <Header
//           title="Add photos"
//           onBack={() => router.push("/fleet" as Route)}
//         />
//         <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-8">
//           <PhotoUploadPanel
//             listingId={createdListingId}
//             token={token}
//             onDone={() =>
//               router.push(`/fleet/listing?id=${createdListingId}` as Route)
//             }
//           />
//         </main>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-[#F4F2EE] min-h-screen flex flex-col">
//       <Header title="Add a Bike" onBack={() => router.back()} />
//       <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-8">
//         {/* Progress Bar Card */}
//         <div className="mb-6 bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50">
//           <div className="flex justify-between items-center text-[12px] font-bold mb-3 uppercase tracking-wide">
//             <span className="text-gray-400">
//               Step {draft.step} of {TOTAL_STEPS}
//             </span>
//             <span className="text-gray-900">{STEP_TITLES[draft.step - 1]}</span>
//           </div>
//           <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//             <div
//               className="h-full bg-[#FFD166] transition-all duration-300 rounded-full"
//               style={{ width: `${(draft.step / TOTAL_STEPS) * 100}%` }}
//             />
//           </div>
//         </div>

//         {/* Form Container */}
//         <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 mb-6">
//           {draft.step === 1 && (
//             <StepVehicleLocation
//               draft={draft}
//               update={update}
//               token={token}
//               onCreatePickupPoint={handleCreatePickupPoint}
//             />
//           )}
//           {draft.step === 2 && (
//             <StepSchedule
//               draft={draft}
//               update={update}
//               token={token}
//               onCreateNew={handleCreateScheduleTemplate}
//             />
//           )}
//           {draft.step === 3 && (
//             <StepPricing draft={draft} update={update} token={token} />
//           )}
//           {draft.step === 4 && <StepPolicies draft={draft} update={update} />}
//           {draft.step === 5 && (
//             <StepReview
//               draft={draft}
//               onSubmit={handleSubmit}
//               submitting={submitting}
//               error={submitError}
//             />
//           )}
//         </div>

//         {/* Action Buttons */}
//         {draft.step < TOTAL_STEPS && (
//           <div className="flex gap-3 mt-4">
//             {draft.step > 1 && (
//               <button
//                 onClick={goBack}
//                 className="flex-1 border border-gray-200 bg-white rounded-xl py-3.5 text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
//               >
//                 Back
//               </button>
//             )}
//             <button
//               onClick={goNext}
//               disabled={!canProceed}
//               className="flex-1 rounded-xl py-3.5 text-[14px] font-bold bg-[#FFD166] text-[#242A38] hover:bg-[#ffc63b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
//             >
//               Next
//             </button>
//           </div>
//         )}
//         {draft.step === TOTAL_STEPS && (
//           <button
//             onClick={goBack}
//             className="w-full border border-gray-200 bg-white rounded-xl py-3.5 text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm mt-2"
//           >
//             Back
//           </button>
//         )}
//       </main>
//     </div>
//   );
// }

// // ── Step 1: Vehicle & location ──────────────────────────────────────────

// type ActiveSheet = "brand" | "vehicleType" | "city" | null;

// function StepVehicleLocation({
//   draft,
//   update,
//   token,
//   onCreatePickupPoint,
// }: {
//   draft: WizardDraft;
//   update: (patch: Partial<WizardDraft>) => void;
//   token: string;
//   onCreatePickupPoint: () => void;
// }) {
//   const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

//   const [brandItems, setBrandItems] = useState<BrandOption[]>([]);
//   const [brandLoading, setBrandLoading] = useState(false);

//   const [vehicleTypeItems, setVehicleTypeItems] = useState<VehicleTypeOption[]>(
//     [],
//   );
//   const [vehicleTypeLoading, setVehicleTypeLoading] = useState(false);

//   const [cityItems, setCityItems] = useState<City[]>([]);
//   const [cityLoading, setCityLoading] = useState(false);

//   const [locations, setLocations] = useState<PickupLocationOption[]>([]);
//   const [locationsLoading, setLocationsLoading] = useState(false);

//   const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
//   const [pickupPointsLoading, setPickupPointsLoading] = useState(false);

//   async function fetchBrands(query: string) {
//     setBrandLoading(true);
//     try {
//       const res = await getBrandsApi(token, query);
//       setBrandItems(res.data ?? []);
//     } finally {
//       setBrandLoading(false);
//     }
//   }

//   async function fetchVehicleTypes(query: string) {
//     if (!draft.brandId) return;
//     setVehicleTypeLoading(true);
//     try {
//       const res = await getVehicleTypesApi(query, token, draft.brandId);
//       setVehicleTypeItems(res.data?.results ?? []);
//     } finally {
//       setVehicleTypeLoading(false);
//     }
//   }

//   async function fetchCities(query: string) {
//     if (!query.trim()) {
//       setCityItems([]);
//       return;
//     }
//     setCityLoading(true);
//     try {
//       const res = await searchCitiesApi(query);
//       setCityItems(res.data?.results ?? []);
//     } finally {
//       setCityLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (!draft.pickupLocationId) return;
//     let cancelled = false;
//     (async () => {
//       setPickupPointsLoading(true);
//       try {
//         const res = await getPickupPointsApi(token, draft.pickupLocationId!);
//         if (!cancelled && res.success && res.data) setPickupPoints(res.data);
//       } finally {
//         if (!cancelled) setPickupPointsLoading(false);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, [draft.pickupLocationId, token]);

//   useEffect(() => {
//     if (!draft.cityId) {
//       setLocations([]);
//       return;
//     }
//     let cancelled = false;
//     (async () => {
//       setLocationsLoading(true);
//       try {
//         const res = await getPickupLocationsByCityApi(draft.cityId!);
//         if (!cancelled) setLocations(res.data ?? []);
//       } finally {
//         if (!cancelled) setLocationsLoading(false);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, [draft.cityId]);

//   function openBrandSheet() {
//     setActiveSheet("brand");
//     fetchBrands("");
//   }
//   function openVehicleTypeSheet() {
//     if (!draft.brandId) return;
//     setActiveSheet("vehicleType");
//     fetchVehicleTypes("");
//   }
//   function openCitySheet() {
//     setActiveSheet("city");
//     setCityItems([]);
//   }

//   const inputClass =
//     "w-full text-left flex items-center justify-between border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-[13px] font-medium outline-none transition-all";
//   const selectedClass = "border-[#FFD166] bg-[#FFF6E0] text-[#D4A33B]";
//   const unselectedClass = "text-gray-800 hover:border-gray-200";

//   return (
//     <div className="space-y-5">
//       <div>
//         <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
//           Brand
//         </label>
//         <button
//           onClick={openBrandSheet}
//           className={`${inputClass} ${
//             draft.brandId ? selectedClass : unselectedClass
//           }`}
//         >
//           {draft.brandName || "Select a brand"}
//           <ChevronIcon />
//         </button>
//       </div>

//       <div>
//         <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
//           Vehicle Type
//         </label>
//         <button
//           onClick={openVehicleTypeSheet}
//           disabled={!draft.brandId}
//           className={`${inputClass} ${
//             draft.vehicleTypeId ? selectedClass : unselectedClass
//           } disabled:opacity-50 disabled:cursor-not-allowed`}
//         >
//           {draft.vehicleTypeLabel ||
//             (draft.brandId ? "Select a vehicle type" : "Select a brand first")}
//           <ChevronIcon />
//         </button>
//       </div>

//       <div>
//         <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
//           City
//         </label>
//         <button
//           onClick={openCitySheet}
//           className={`${inputClass} ${
//             draft.cityId ? selectedClass : unselectedClass
//           }`}
//         >
//           {draft.cityName || "Search for a city"}
//           <ChevronIcon />
//         </button>
//       </div>

//       {draft.cityId && (
//         <div className="pt-2 border-t border-gray-50">
//           <label className="block text-[12px] font-semibold text-gray-600 mb-1.5 mt-2">
//             Pickup Location
//           </label>
//           {locationsLoading ? (
//             <p className="text-[12px] font-medium text-gray-400">
//               Loading locations...
//             </p>
//           ) : locations.length === 0 ? (
//             <p className="text-[12px] font-medium text-red-500 bg-red-50 p-3 rounded-lg">
//               No pickup locations exist in this city yet. Contact your admin to
//               add one.
//             </p>
//           ) : (
//             <select
//               value={draft.pickupLocationId ?? ""}
//               onChange={(e) => {
//                 const loc = locations.find(
//                   (l) => l.id === Number(e.target.value),
//                 );
//                 update({
//                   pickupLocationId: loc?.id ?? null,
//                   pickupLocationName: loc?.location_name ?? "",
//                   pickupPointId: null,
//                   pickupPointLabel: "",
//                 });
//               }}
//               className="w-full border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800"
//             >
//               <option value="">Select a pickup location</option>
//               {locations.map((loc) => (
//                 <option key={loc.id} value={loc.id}>
//                   {loc.location_name}
//                 </option>
//               ))}
//             </select>
//           )}
//         </div>
//       )}

//       {draft.pickupLocationId && (
//         <div>
//           <label className="block text-[12px] font-semibold text-gray-600 mb-2">
//             Exact Pickup Address
//           </label>
//           {pickupPointsLoading ? (
//             <p className="text-[12px] font-medium text-gray-400">
//               Loading your saved addresses...
//             </p>
//           ) : pickupPoints.length === 0 ? (
//             <div className="text-center py-6 border border-dashed border-gray-200 bg-gray-50/50 rounded-xl">
//               <p className="text-[12px] text-gray-500 font-medium mb-3">
//                 No saved addresses in this area yet.
//               </p>
//               <button
//                 onClick={onCreatePickupPoint}
//                 className="text-[12px] font-bold text-[#242A38] bg-[#FFD166] hover:bg-[#ffc63b] px-4 py-2 rounded-lg transition-colors shadow-sm"
//               >
//                 + Add Pickup Point
//               </button>
//             </div>
//           ) : (
//             <>
//               <div className="space-y-2.5">
//                 {pickupPoints.map((p) => (
//                   <button
//                     key={p.id}
//                     onClick={() =>
//                       update({
//                         pickupPointId: p.id,
//                         pickupPointLabel: p.label || p.address,
//                       })
//                     }
//                     className={`w-full text-left border rounded-xl px-4 py-3 transition-all duration-200 ${
//                       draft.pickupPointId === p.id
//                         ? "border-[#FFD166] bg-[#FFF6E0]"
//                         : "border-gray-100 bg-gray-50/30 hover:border-[#FFD166]/50 hover:bg-gray-50"
//                     }`}
//                   >
//                     <p
//                       className={`font-bold text-[14px] ${draft.pickupPointId === p.id ? "text-[#D4A33B]" : "text-gray-900"}`}
//                     >
//                       {p.label || "Pickup point"}
//                     </p>
//                     <p
//                       className={`text-[12px] mt-0.5 ${draft.pickupPointId === p.id ? "text-[#D4A33B]/80" : "text-gray-500"}`}
//                     >
//                       {p.address}
//                     </p>
//                   </button>
//                 ))}
//               </div>
//               <button
//                 onClick={onCreatePickupPoint}
//                 className="text-[13px] font-bold text-[#D4A33B] hover:text-[#242A38] mt-3 transition-colors"
//               >
//                 + Add a new pickup point
//               </button>
//             </>
//           )}
//         </div>
//       )}

//       {activeSheet === "brand" && (
//         <SearchPickerSheet
//           title="Select brand"
//           placeholder="Search brands..."
//           items={brandItems}
//           loading={brandLoading}
//           getKey={(b) => b.id}
//           renderItem={(b) => (
//             <span className="font-medium text-[14px]">{b.name}</span>
//           )}
//           onQueryChange={fetchBrands}
//           onSelect={(b) => {
//             update({
//               brandId: b.id,
//               brandName: b.name,
//               vehicleTypeId: null,
//               vehicleTypeLabel: "",
//             });
//             setActiveSheet(null);
//           }}
//           onClose={() => setActiveSheet(null)}
//           showAllByDefault
//           emptyLabel="No brands found."
//         />
//       )}

//       {activeSheet === "vehicleType" && (
//         <SearchPickerSheet
//           title="Select vehicle type"
//           placeholder="Search by model..."
//           items={vehicleTypeItems}
//           loading={vehicleTypeLoading}
//           getKey={(v) => v.id}
//           renderItem={(v) => (
//             <>
//               <span className="font-medium text-[14px]">{v.name}</span>
//               <span className="text-[13px] text-gray-500">
//                 {" "}
//                 ({v.make_year}, {v.transmission_type})
//               </span>
//             </>
//           )}
//           onQueryChange={fetchVehicleTypes}
//           onSelect={(v) => {
//             update({
//               vehicleTypeId: v.id,
//               vehicleTypeLabel: `${v.brand} ${v.name} (${v.make_year})`,
//             });
//             setActiveSheet(null);
//           }}
//           onClose={() => setActiveSheet(null)}
//           showAllByDefault
//           emptyLabel="No vehicle types found for this brand."
//         />
//       )}

//       {activeSheet === "city" && (
//         <SearchPickerSheet
//           title="Select city"
//           placeholder="Search for a city..."
//           items={cityItems}
//           loading={cityLoading}
//           getKey={(c) => c.id}
//           renderItem={(c) => (
//             <>
//               <span className="font-medium text-[14px]">{c.name}</span>,{" "}
//               <span className="text-[13px] text-gray-500">{c.state_name}</span>
//             </>
//           )}
//           onQueryChange={fetchCities}
//           onSelect={(c) => {
//             update({
//               cityId: c.id,
//               cityName: c.name,
//               pickupLocationId: null,
//               pickupLocationName: "",
//               pickupPointId: null,
//               pickupPointLabel: "",
//             });
//             setActiveSheet(null);
//           }}
//           onClose={() => setActiveSheet(null)}
//           emptyLabel="Type to search for a city."
//         />
//       )}
//     </div>
//   );
// }

// function ChevronIcon() {
//   return (
//     <svg
//       className="w-5 h-5 text-gray-400 shrink-0"
//       fill="none"
//       stroke="currentColor"
//       viewBox="0 0 24 24"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         strokeWidth={2}
//         d="M9 5l7 7-7 7"
//       />
//     </svg>
//   );
// }

// // ── Step 2: Schedule ─────────────────────────────────────────────────────

// function StepSchedule({
//   draft,
//   update,
//   token,
//   onCreateNew,
// }: {
//   draft: WizardDraft;
//   update: (patch: Partial<WizardDraft>) => void;
//   token: string;
//   onCreateNew: () => void;
// }) {
//   const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await getScheduleTemplatesApi(token);
//         if (!cancelled) {
//           if (res.success && res.data) setTemplates(res.data);
//           else setError(res.message || "Failed to load schedule templates");
//         }
//       } catch (err) {
//         if (!cancelled)
//           setError(err instanceof Error ? err.message : "Failed to load");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, [token]);

//   if (loading)
//     return (
//       <p className="text-[13px] font-medium text-gray-500 text-center py-4">
//         Loading your schedule templates...
//       </p>
//     );

//   return (
//     <div className="space-y-4">
//       {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}

//       {templates.length === 0 ? (
//         <div className="text-center py-8 border border-dashed border-gray-200 bg-gray-50/50 rounded-xl">
//           <p className="text-[13px] text-gray-500 font-medium mb-3">
//             You don&apos;t have any schedule templates yet.
//           </p>
//           <button
//             onClick={onCreateNew}
//             className="text-[12px] font-bold text-[#242A38] bg-[#FFD166] hover:bg-[#ffc63b] px-4 py-2 rounded-lg transition-colors shadow-sm"
//           >
//             + Create Schedule Template
//           </button>
//         </div>
//       ) : (
//         <>
//           <div className="space-y-3">
//             {templates.map((t) => (
//               <button
//                 key={t.id}
//                 onClick={() =>
//                   update({
//                     scheduleTemplateId: t.id,
//                     scheduleTemplateName: t.name,
//                   })
//                 }
//                 className={`w-full text-left border rounded-xl px-4 py-3.5 transition-all duration-200 ${
//                   draft.scheduleTemplateId === t.id
//                     ? "border-[#FFD166] bg-[#FFF6E0] text-[#D4A33B] font-bold shadow-sm"
//                     : "border-gray-100 bg-gray-50/30 text-gray-800 font-medium hover:bg-gray-50 hover:border-[#FFD166]/50"
//                 }`}
//               >
//                 {t.name}
//               </button>
//             ))}
//           </div>
//           <div className="pt-2">
//             <button
//               onClick={onCreateNew}
//               className="text-[13px] font-bold text-[#D4A33B] hover:text-[#242A38] transition-colors"
//             >
//               + Create a new schedule template
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ── Step 3: Pricing packages ─────────────────────────────────────────────

// function StepPricing({
//   draft,
//   update,
//   token,
// }: {
//   draft: WizardDraft;
//   update: (patch: Partial<WizardDraft>) => void;
//   token: string;
// }) {
//   const [packageTypes, setPackageTypes] = useState<PackageTypeOption[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         const res = await getPackageTypesApi(token);
//         if (!cancelled) setPackageTypes(res.data ?? []);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, [token]);

//   function addPackage() {
//     update({
//       pricingPackages: [
//         ...draft.pricingPackages,
//         {
//           packageTypeId: null,
//           price: "",
//           payAtPickupEnabled: false,
//           kmLimit: "",
//         },
//       ],
//     });
//   }
//   function updatePackage(index: number, patch: Partial<PricingPackageDraft>) {
//     update({
//       pricingPackages: draft.pricingPackages.map((p, i) =>
//         i === index ? { ...p, ...patch } : p,
//       ),
//     });
//   }
//   function removePackage(index: number) {
//     update({
//       pricingPackages: draft.pricingPackages.filter((_, i) => i !== index),
//     });
//   }

//   const usedIds = new Set(
//     draft.pricingPackages.map((p) => p.packageTypeId).filter(Boolean),
//   );

//   if (loading)
//     return (
//       <p className="text-[13px] font-medium text-gray-500 text-center py-4">
//         Loading package types...
//       </p>
//     );

//   return (
//     <div className="space-y-4">
//       {draft.pricingPackages.map((pkg, i) => {
//         const availableTypes = packageTypes.filter(
//           (pt) => pt.id === pkg.packageTypeId || !usedIds.has(pt.id),
//         );
//         return (
//           <div
//             key={i}
//             className="border border-gray-100 bg-gray-50/30 rounded-[1rem] p-4 space-y-4 shadow-sm"
//           >
//             <div className="flex justify-between items-center pb-2 border-b border-gray-100">
//               <label className="text-[13px] font-bold text-gray-800">
//                 Package #{i + 1}
//               </label>
//               <button
//                 onClick={() => removePackage(i)}
//                 className="text-[12px] text-red-500 hover:text-red-600 font-bold transition-colors"
//               >
//                 Remove
//               </button>
//             </div>

//             <div>
//               <label className="block text-[11px] uppercase tracking-wide font-bold text-gray-500 mb-1.5">
//                 Package Type
//               </label>
//               <select
//                 value={pkg.packageTypeId ?? ""}
//                 onChange={(e) =>
//                   updatePackage(i, {
//                     packageTypeId: Number(e.target.value) || null,
//                   })
//                 }
//                 className="w-full border border-gray-100 bg-white rounded-xl px-3.5 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800 shadow-sm"
//               >
//                 <option value="">Select a package type</option>
//                 {availableTypes.map((pt) => (
//                   <option key={pt.id} value={pt.id}>
//                     {pt.name} ({pt.category}, {pt.duration_hours}h)
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-[11px] uppercase tracking-wide font-bold text-gray-500 mb-1.5">
//                   Price (₹)
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   value={pkg.price}
//                   onChange={(e) => updatePackage(i, { price: e.target.value })}
//                   placeholder="e.g. 500"
//                   className="w-full border border-gray-100 bg-white rounded-xl px-3.5 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800 shadow-sm"
//                 />
//               </div>
//               <div>
//                 <label className="block text-[11px] uppercase tracking-wide font-bold text-gray-500 mb-1.5">
//                   Km Limit{" "}
//                   <span className="normal-case font-medium text-gray-400">
//                     (optional)
//                   </span>
//                 </label>
//                 <input
//                   type="number"
//                   min="1"
//                   value={pkg.kmLimit}
//                   onChange={(e) =>
//                     updatePackage(i, { kmLimit: e.target.value })
//                   }
//                   placeholder="No limit"
//                   className="w-full border border-gray-100 bg-white rounded-xl px-3.5 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800 shadow-sm"
//                 />
//               </div>
//             </div>
//             <div className="pt-1">
//               <label className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700 cursor-pointer select-none">
//                 <input
//                   type="checkbox"
//                   checked={pkg.payAtPickupEnabled}
//                   onChange={(e) =>
//                     updatePackage(i, { payAtPickupEnabled: e.target.checked })
//                   }
//                   className="w-4 h-4 text-[#FFD166] bg-white border-gray-300 rounded focus:ring-[#FFD166]"
//                 />
//                 Allow Pay at Pickup
//               </label>
//             </div>
//           </div>
//         );
//       })}

//       <button
//         onClick={addPackage}
//         className="w-full border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-xl py-3.5 text-[13px] font-bold text-gray-500 hover:border-[#FFD166] hover:text-[#D4A33B] hover:bg-[#FFF6E0]/50 transition-all"
//       >
//         + Add Pricing Package
//       </button>
//     </div>
//   );
// }

// // ── Step 4: Policies ──────────────────────────────────────────────────────

// function StepPolicies({
//   draft,
//   update,
// }: {
//   draft: WizardDraft;
//   update: (patch: Partial<WizardDraft>) => void;
// }) {
//   return (
//     <div className="space-y-4">
//       <Field label="Fleet quantity at this location" optional={false}>
//         <input
//           type="number"
//           min="1"
//           value={draft.availableCount}
//           onChange={(e) => update({ availableCount: e.target.value })}
//           className="w-full border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800"
//         />
//       </Field>
//       <Field label="Security deposit (₹)" optional={false}>
//         <input
//           type="number"
//           min="0"
//           value={draft.securityDepositAmount}
//           onChange={(e) => update({ securityDepositAmount: e.target.value })}
//           className="w-full border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800"
//         />
//       </Field>
//       <Field label="Km limit per day" optional={true}>
//         <input
//           type="number"
//           min="1"
//           value={draft.kmLimitPerDay}
//           onChange={(e) => update({ kmLimitPerDay: e.target.value })}
//           placeholder="No limit"
//           className="w-full border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800"
//         />
//       </Field>
//       <Field label="Excess charge per km (₹)" optional={true}>
//         <input
//           type="number"
//           min="0"
//           value={draft.excessChargePerKm}
//           onChange={(e) => update({ excessChargePerKm: e.target.value })}
//           placeholder="₹0"
//           className="w-full border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800"
//         />
//       </Field>
//       <Field label="Late return penalty per hour (₹)" optional={true}>
//         <input
//           type="number"
//           min="0"
//           value={draft.lateReturnPenaltyPerHour}
//           onChange={(e) => update({ lateReturnPenaltyPerHour: e.target.value })}
//           placeholder="₹0"
//           className="w-full border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-[13px] font-medium focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166] outline-none transition-all text-gray-800"
//         />
//       </Field>
//       <div className="pt-2">
//         <label className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700 cursor-pointer select-none">
//           <input
//             type="checkbox"
//             checked={draft.doorstepDeliveryEnabled}
//             onChange={(e) =>
//               update({ doorstepDeliveryEnabled: e.target.checked })
//             }
//             className="w-4 h-4 text-[#FFD166] bg-white border-gray-300 rounded focus:ring-[#FFD166]"
//           />
//           Offer Doorstep Delivery
//         </label>
//       </div>
//     </div>
//   );
// }

// function Field({
//   label,
//   optional,
//   children,
// }: {
//   label: string;
//   optional: boolean;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
//         {label}{" "}
//         {optional && (
//           <span className="font-medium text-gray-400 normal-case">
//             (optional)
//           </span>
//         )}
//       </label>
//       {children}
//     </div>
//   );
// }

// // ── Step 5: Review & submit ───────────────────────────────────────────────

// function StepReview({
//   draft,
//   onSubmit,
//   submitting,
//   error,
// }: {
//   draft: WizardDraft;
//   onSubmit: () => void;
//   submitting: boolean;
//   error: string | null;
// }) {
//   return (
//     <div className="space-y-4">
//       <h3 className=" font-bold text-[16px] text-gray-900 border-b border-gray-100 pb-3 mb-2">
//         Listing Summary
//       </h3>
//       <ReviewRow label="Vehicle" value={draft.vehicleTypeLabel} />
//       <ReviewRow
//         label="Location"
//         value={`${draft.pickupLocationName}, ${draft.cityName}`}
//       />
//       <ReviewRow label="Pickup Point" value={draft.pickupPointLabel} />
//       <ReviewRow label="Schedule" value={draft.scheduleTemplateName} />
//       <ReviewRow
//         label="Pricing Packages"
//         value={`${draft.pricingPackages.length} package(s)`}
//       />
//       <ReviewRow label="Fleet Quantity" value={draft.availableCount} />

//       {error && (
//         <p className="text-[13px] text-red-500 font-semibold bg-red-50 p-3 rounded-xl mt-4">
//           {error}
//         </p>
//       )}

//       <div className="pt-4 mt-2 border-t border-gray-100">
//         <button
//           onClick={onSubmit}
//           disabled={submitting}
//           className="w-full text-[14px] font-bold rounded-xl py-4 text-center bg-[#FFD166] text-[#242A38] hover:bg-[#ffc63b] transition-colors disabled:opacity-50 shadow-sm"
//         >
//           {submitting ? "Creating Listing..." : "Create Listing"}
//         </button>
//       </div>
//     </div>
//   );
// }

// function ReviewRow({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex justify-between items-start gap-4 text-[13px]">
//       <span className="text-gray-500 font-medium">{label}</span>
//       <span className="font-bold text-gray-900 text-right">{value}</span>
//     </div>
//   );
// }

// // ── Post-create: photo upload ─────────────────────────────────────────────

// function PhotoUploadPanel({
//   listingId,
//   token,
//   onDone,
// }: {
//   listingId: number;
//   token: string;
//   onDone: () => void;
// }) {
//   const [files, setFiles] = useState<File[]>([]);
//   const [previews, setPreviews] = useState<string[]>([]);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [uploaded, setUploaded] = useState(false);

//   function handleFiles(fileList: FileList | null) {
//     if (!fileList) return;
//     const arr = Array.from(fileList);
//     setFiles(arr);
//     setPreviews(arr.map((f) => URL.createObjectURL(f)));
//   }

//   useEffect(() => {
//     return () => previews.forEach((url) => URL.revokeObjectURL(url));
//   }, [previews]);

//   async function handleUpload() {
//     if (files.length === 0) return;
//     setUploading(true);
//     setError(null);
//     try {
//       await uploadListingImagesApi(listingId, files, token);
//       setUploaded(true);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Upload failed");
//     } finally {
//       setUploading(false);
//     }
//   }

//   return (
//     <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 space-y-5">
//       <div className="text-center">
//         <div className="w-16 h-16 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-3">
//           <svg
//             className="w-8 h-8 text-[#22C55E]"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2.5}
//               d="M5 13l4 4L19 7"
//             />
//           </svg>
//         </div>
//         <h3 className=" font-bold text-[18px] text-gray-900 mb-1">
//           Listing Created!
//         </h3>
//         <p className="text-[13px] font-medium text-gray-500">
//           Add a few photos now, or skip and add them later.
//         </p>
//       </div>

//       <div className="pt-2">
//         <label className="block w-full border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-xl p-6 text-center cursor-pointer hover:border-[#FFD166] transition-colors">
//           <svg
//             className="w-8 h-8 text-gray-400 mx-auto mb-2"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={1.5}
//               d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
//             />
//           </svg>
//           <span className="text-[13px] font-bold text-[#D4A33B]">
//             Click to select images
//           </span>
//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             onChange={(e) => handleFiles(e.target.files)}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {previews.length > 0 && (
//         <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1">
//           {previews.map((src, i) => (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img
//               key={i}
//               src={src}
//               alt="Preview"
//               className="h-24 w-24 object-cover rounded-xl border border-gray-100 shrink-0 shadow-sm"
//             />
//           ))}
//         </div>
//       )}

//       {error && (
//         <p className="text-[13px] text-red-500 font-semibold bg-red-50 p-3 rounded-lg text-center">
//           {error}
//         </p>
//       )}

//       {uploaded && (
//         <p className="text-[13px] text-[#22C55E] font-bold bg-[#F0FDF4] p-3 rounded-lg text-center">
//           Photos successfully uploaded.
//         </p>
//       )}

//       <div className="space-y-3 pt-2">
//         <button
//           onClick={handleUpload}
//           disabled={uploading || files.length === 0}
//           className="w-full text-[14px] font-bold rounded-xl py-3.5 text-center bg-[#FFD166] text-[#242A38] hover:bg-[#ffc63b] transition-colors disabled:opacity-50 shadow-sm"
//         >
//           {uploading ? "Uploading..." : "Upload Photos"}
//         </button>
//         <button
//           onClick={onDone}
//           className="w-full text-[13px] font-bold text-gray-500 hover:text-gray-700 py-2 transition-colors"
//         >
//           {uploaded ? "Continue to Details" : "Skip for now"}
//         </button>
//       </div>
//     </div>
//   );
// }
