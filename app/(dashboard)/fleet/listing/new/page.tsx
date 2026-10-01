"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  checkListingDuplicateApi,
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
import { queryKeys } from "@/lib/queryKeys";
import { goBackOr } from "@/lib/navigation";
import { SearchPickerSheet } from "@/components/ui/SearchPickerSheet";
import type {
  BrandOption,
  VehicleTypeOption,
  City,
  PickupLocationOption,
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

// ── Icons (shared across the step indicator + field icons below) ──────────

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
const TAG_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8A1 1 0 012 10.586V5a2 2 0 012-2z"
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
const CHECK_CIRCLE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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

interface PricingPackageDraft {
  packageTypeId: number | null;
  packageTypeName?: string;
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
  // True when the currently-selected (vehicleTypeId, pickupLocationId)
  // pair already has a listing for this vendor. Checked as soon as
  // both fields are set — see the duplicate-check effect in
  // StepVehicleLocation — instead of only surfacing as a 409 at
  // final submit.
  pickupLocationConflict: boolean;
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
  pickupLocationConflict: false,
  pickupPointId: null,
  pickupPointLabel: "",
  scheduleTemplateId: null,
  scheduleTemplateName: "",
  pricingPackages: [],
  availableCount: "1",
  securityDepositAmount: "0",
  kmLimitPerDay: "",
  excessChargePerKm: "0",
  lateReturnPenaltyPerHour: "0",
  doorstepDeliveryEnabled: false,
};

function isValidNonNegativeAmount(value: string): boolean {
  const amount = Number(value);
  return value.trim() !== "" && Number.isFinite(amount) && amount >= 0;
}

function getStepRequirement(draft: WizardDraft): string {
  switch (draft.step) {
    case 1:
      if (!draft.brandId || !draft.vehicleTypeId)
        return "Select a brand and vehicle type to continue.";
      if (!draft.cityId || !draft.pickupLocationId)
        return "Select a city and pickup location to continue.";
      if (draft.pickupLocationConflict)
        return "This vehicle already has a listing at that location. Choose another location or vehicle.";
      if (!draft.pickupPointId)
        return "Select an exact pickup address to continue.";
      return "";
    case 2:
      return draft.scheduleTemplateId
        ? ""
        : "Choose a schedule template or create one to continue.";
    case 3:
      if (draft.pricingPackages.length === 0)
        return "Add at least one pricing package to continue.";
      if (draft.pricingPackages.some((pkg) => !pkg.packageTypeId))
        return "Choose a package type for each package.";
      if (
        draft.pricingPackages.some((pkg) => {
          const price = Number(pkg.price);
          return (
            pkg.price.trim() === "" || !Number.isFinite(price) || price <= 0
          );
        })
      )
        return "Enter a price greater than ₹0 for every package.";
      if (
        draft.pricingPackages.some((pkg) => {
          if (!pkg.kmLimit.trim()) return false;
          const limit = Number(pkg.kmLimit);
          return !Number.isInteger(limit) || limit < 1;
        })
      )
        return "Enter a whole-number kilometre limit, or leave it blank for unlimited distance.";
      return "";
    case 4: {
      const quantity = Number(draft.availableCount);
      if (
        draft.availableCount.trim() === "" ||
        !Number.isInteger(quantity) ||
        quantity < 1
      )
        return "Fleet quantity must be a whole number of at least 1.";
      if (!isValidNonNegativeAmount(draft.securityDepositAmount))
        return "Enter a valid security deposit of ₹0 or more.";
      if (!isValidNonNegativeAmount(draft.excessChargePerKm))
        return "Enter a valid excess charge of ₹0 or more per kilometre.";
      if (!isValidNonNegativeAmount(draft.lateReturnPenaltyPerHour))
        return "Enter a valid late-return penalty of ₹0 or more per hour.";
      return "";
    }
    default:
      return "";
  }
}

export default function NewListingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  // True only when we're deliberately leaving this page to continue the
  // SAME flow — e.g. "create a schedule template" / "add a pickup point" —
  // and expect to be routed back here afterward. Any other unmount (back
  // button, switching to a different page, closing the tab) means the
  // vendor is leaving the flow, so the draft should not survive that trip.
  const continuingFlowRef = useRef(false);

  useEffect(() => {
    const saved = loadDraft<WizardDraft>();
    if (saved) setDraft(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  // Wipe the persisted draft on any unmount that isn't a deliberate
  // continuation of this same flow, so returning to "Add a bike" later
  // via normal navigation always starts from a clean form.
  useEffect(() => {
    return () => {
      if (!continuingFlowRef.current) {
        clearDraft();
      }
    };
  }, []);

  function update(patch: Partial<WizardDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function goNext() {
    update({ step: Math.min(draft.step + 1, TOTAL_STEPS) });
  }
  function goBack() {
    update({ step: Math.max(draft.step - 1, 1) });
  }

  const stepRequirement = getStepRequirement(draft);
  const canProceed = !stepRequirement;

  const createMutation = useMutation({
    mutationFn: async (payload: ListingCreatePayload) => {
      const res = await createListingApi(payload, token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to create listing");
      }
      return res.data;
    },
    onSuccess: (created) => {
      clearDraft();
      setDraft(EMPTY_DRAFT);
      setCreatedListingId(created.id);
      // A brand-new listing shows up in the fleet list's "active" (or
      // "inactive", if pending) tab — invalidate by the shared prefix
      // so both tabs refresh rather than guessing which one it lands in.
      queryClient.invalidateQueries({ queryKey: ["fleet", "list", token] });
    },
  });

  const submitting = createMutation.isPending;
  const submitError =
    createMutation.error instanceof Error ? createMutation.error.message : null;

  function handleSubmit() {
    if (!token) return;
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
      excess_charge_per_km: draft.excessChargePerKm || "0",
      late_return_penalty_per_hour: draft.lateReturnPenaltyPerHour || "0",
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
    createMutation.mutate(payload);
  }

  function handleCreateScheduleTemplate() {
    continuingFlowRef.current = true;
    saveReturnTo("/fleet/listing/new");
    router.push("/fleet/schedule-templates/new" as Route);
  }

  function handleCreatePickupPoint() {
    continuingFlowRef.current = true;
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
          // The listing already exists at this point — leave the
          // wizard for wherever it was opened from (Fleet / Home).
          onBack={() => goBackOr(router, "/fleet")}
        />
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg lg:px-page-narrow lg:pt-7">
          <PhotoUploadPanel
            listingId={createdListingId}
            token={token}
            // replace, not push: the finished wizard shouldn't sit in
            // history under the new listing (back would reopen it).
            onDone={() =>
              router.replace(`/fleet/listing?id=${createdListingId}` as Route)
            }
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Add a bike" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg lg:px-page-narrow lg:pt-7">
        <StepIndicator currentStep={draft.step} />

        <div className="bg-white rounded-2xl shadow-sm p-4">
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
        </div>

        {draft.step < TOTAL_STEPS && (
          <div className="flex gap-3 mt-5">
            {draft.step > 1 && (
              <button
                onClick={goBack}
                className="flex-1 bg-white shadow-sm rounded-xl py-3.5 text-sm font-semibold text-font-main-sub active:bg-gray-100 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-semibold shadow-sm bg-brand-secondary text-brand-yellow active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              Next
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
        {draft.step < TOTAL_STEPS && stepRequirement && (
          <p
            role="status"
            className="mt-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-900"
          >
            {stepRequirement}
          </p>
        )}
        {draft.step === TOTAL_STEPS && (
          <button
            onClick={goBack}
            className="w-full bg-white shadow-sm rounded-xl py-3.5 text-sm font-semibold text-font-main-sub active:bg-gray-100 transition-colors mt-4"
          >
            Back
          </button>
        )}
      </main>
    </>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    VEHICLE_ICON,
    CALENDAR_ICON,
    TAG_ICON,
    SHIELD_ICON,
    CHECK_CIRCLE_ICON,
  ];

  return (
    <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {steps[currentStep - 1]}
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
          <p className="font-heading font-bold text-base text-font-main-sub truncate">
            {STEP_TITLES[currentStep - 1]}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i + 1 <= currentStep ? "bg-brand-yellow-lg" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Reusable picker field (Brand / Vehicle type / City / Pickup location) ──

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
      className={`w-full flex items-center gap-3 rounded-2xl p-2.5 text-left transition-colors ${
        filled ? "bg-brand-yellow/20" : "bg-brand-bg active:bg-gray-100"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          filled
            ? "bg-brand-yellow-lg text-brand-secondary"
            : "bg-white text-font-dim"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
          {label}
        </p>
        <p
          className={`text-sm truncate ${
            filled ? "font-semibold text-font-main-sub" : "text-font-dim"
          }`}
        >
          {value || placeholder}
        </p>
      </div>
      <ChevronIcon />
    </button>
  );
}

// ── Step 1: Vehicle & location ──────────────────────────────────────────

type ActiveSheet = "brand" | "vehicleType" | "city" | "pickupLocation" | null;

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

  // Full, unpaginated list for the currently selected city — fetched
  // once via useEffect below. The sheet filters THIS array client-side
  // rather than re-hitting the network per keystroke, since
  // get_by_city already returns everything in one call.
  const [locations, setLocations] = useState<PickupLocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [pickupLocationSheetItems, setPickupLocationSheetItems] = useState<
    PickupLocationOption[]
  >([]);

  // Fetched unfiltered and cached under the same key the edit-listing
  // page (and Settings > Pickup Points) use, then filtered to the
  // selected pickup location client-side below.
  const { data: allPickupPoints = [], isLoading: pickupPointsLoading } =
    useQuery({
      queryKey: queryKeys.fleet.pickupPoints(token),
      queryFn: async () => {
        const res = await getPickupPointsApi(token);
        return res.success && res.data ? res.data : [];
      },
      enabled: !!token && !!draft.pickupLocationId,
    });
  const pickupPoints = allPickupPoints.filter(
    (p) => p.pickup_location === draft.pickupLocationId,
  );

  // Whether the duplicate-listing check (vendor already has this
  // vehicle type at this pickup location) is currently in flight.
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

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

  // No empty-query guard anymore — an empty search now fetches the
  // full city list (page_size=100) instead of showing nothing until
  // the vendor types something.
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

  // Duplicate-listing check — fires as soon as BOTH a vehicle type and
  // a pickup location are selected, regardless of which was picked
  // second. This covers the normal flow (vehicle type first, then
  // pickup location) as well as a vendor going back and swapping the
  // vehicle type after a pickup location was already chosen.
  useEffect(() => {
    if (!draft.vehicleTypeId || !draft.pickupLocationId) {
      if (draft.pickupLocationConflict)
        update({ pickupLocationConflict: false });
      return;
    }
    let cancelled = false;
    (async () => {
      setCheckingDuplicate(true);
      try {
        const res = await checkListingDuplicateApi(
          token,
          draft.vehicleTypeId!,
          draft.pickupLocationId!,
        );
        if (cancelled) return;
        const isDuplicate = !!res.success && !!res.data?.exists;
        update({
          pickupLocationConflict: isDuplicate,
          // A stale pickup-point selection could otherwise let the
          // wizard slide past a conflict that just appeared — e.g.
          // the vendor went back and changed the vehicle type while a
          // pickup point from the old (non-conflicting) combination
          // was still selected.
          ...(isDuplicate ? { pickupPointId: null, pickupPointLabel: "" } : {}),
        });
      } catch {
        // If the check itself fails (network/server error), don't
        // block the wizard on it — the unique_together constraint on
        // the backend is still the authoritative backstop at submit
        // time, so a failed pre-check just means the vendor won't get
        // the early warning this time.
        if (!cancelled) update({ pickupLocationConflict: false });
      } finally {
        if (!cancelled) setCheckingDuplicate(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.vehicleTypeId, draft.pickupLocationId, token]);

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
    fetchCities("");
  }
  function openPickupLocationSheet() {
    if (locationsLoading || locations.length === 0) return;
    setActiveSheet("pickupLocation");
    setPickupLocationSheetItems(locations);
  }

  return (
    <div className="space-y-4">
      <PickerField
        icon={TAG_ICON}
        label="Brand"
        value={draft.brandName}
        placeholder="Select a brand"
        onClick={openBrandSheet}
      />

      <PickerField
        icon={VEHICLE_ICON}
        label="Vehicle type"
        value={draft.vehicleTypeLabel}
        placeholder={
          draft.brandId ? "Select a vehicle type" : "Select a brand first"
        }
        onClick={openVehicleTypeSheet}
        disabled={!draft.brandId}
      />

      <PickerField
        icon={PIN_ICON}
        label="City"
        value={draft.cityName}
        placeholder="Select a city"
        onClick={openCitySheet}
      />

      {draft.cityId && (
        <div>
          {locationsLoading ? (
            <p className="text-xs text-font-dim px-1">Loading locations...</p>
          ) : locations.length === 0 ? (
            <p className="text-xs text-red-500 px-1">
              No pickup locations exist in this city yet. Contact your admin to
              add one.
            </p>
          ) : (
            <PickerField
              icon={STOREFRONT_ICON}
              label="Pickup location"
              value={draft.pickupLocationName}
              placeholder="Select a pickup location"
              onClick={openPickupLocationSheet}
            />
          )}
        </div>
      )}

      {draft.cityId && draft.pickupLocationId && draft.vehicleTypeId && (
        <>
          {checkingDuplicate && (
            <p className="text-xs text-font-dim px-1">
              Checking this location...
            </p>
          )}
          {!checkingDuplicate && draft.pickupLocationConflict && (
            <p className="text-xs text-red-500 px-1">
              You already have a listing for this vehicle type at this pickup
              location. Choose a different pickup location or vehicle type to
              continue.
            </p>
          )}
        </>
      )}

      {draft.pickupLocationId && !draft.pickupLocationConflict && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-2 px-1">
            Exact pickup address
          </p>
          {pickupPointsLoading ? (
            <p className="text-xs text-font-dim px-1">
              Loading your saved addresses...
            </p>
          ) : pickupPoints.length === 0 ? (
            <div className="text-center py-6 px-4 bg-brand-bg rounded-2xl">
              <p className="text-sm text-font-dim mb-3">
                No saved addresses in this area yet.
              </p>
              <button
                onClick={onCreatePickupPoint}
                className="text-sm font-semibold text-brand-secondary bg-brand-yellow-lg px-4 py-2.5 rounded-xl active:bg-brand-yellow transition-colors"
              >
                + Add pickup point
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pickupPoints.map((p) => {
                  const selected = draft.pickupPointId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        update({
                          pickupPointId: p.id,
                          pickupPointLabel: p.label || p.address,
                        })
                      }
                      className={`w-full flex items-start gap-3 text-left rounded-2xl p-2.5 text-sm transition-colors ${
                        selected
                          ? "bg-brand-yellow/25 ring-2 ring-brand-yellow-lg"
                          : "bg-brand-bg active:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          selected
                            ? "bg-brand-yellow-lg text-brand-secondary"
                            : "bg-white text-font-dim"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {PIN_ICON}
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 self-center">
                        <p className="font-semibold text-font-main-sub">
                          {p.label || "Pickup point"}
                        </p>
                        <p className="text-xs text-font-dim mt-0.5">
                          {p.address}
                        </p>
                      </div>
                      {selected && (
                        <svg
                          className="w-5 h-5 shrink-0 text-brand-secondary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onCreatePickupPoint}
                className="inline-flex items-center rounded-xl bg-brand-bg px-3.5 py-2.5 text-sm font-semibold text-font-main-sub active:bg-gray-100 transition-colors mt-3"
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
          selectedKey={draft.brandId}
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
          selectedKey={draft.vehicleTypeId}
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
              pickupLocationConflict: false,
              pickupPointId: null,
              pickupPointLabel: "",
            });
            setActiveSheet(null);
          }}
          onClose={() => setActiveSheet(null)}
          selectedKey={draft.cityId}
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
              pickupLocationConflict: false,
              pickupPointId: null,
              pickupPointLabel: "",
            });
            setActiveSheet(null);
          }}
          onClose={() => setActiveSheet(null)}
          selectedKey={draft.pickupLocationId}
          showAllByDefault
          emptyLabel="No matching locations."
        />
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-400 shrink-0"
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
  const {
    data: templates = [],
    isLoading: loading,
    error: templatesError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.fleet.scheduleTemplates(token),
    queryFn: async () => {
      const res = await getScheduleTemplatesApi(token);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load schedule templates");
      }
      return res.data;
    },
    enabled: !!token,
  });
  const error = templatesError instanceof Error ? templatesError.message : null;

  if (loading)
    return (
      <p className="text-sm text-font-dim">
        Loading your schedule templates...
      </p>
    );

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="shrink-0 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}
      {templates.length === 0 ? (
        <div className="text-center py-8 px-4 bg-brand-bg rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-font-dim"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {CALENDAR_ICON}
            </svg>
          </div>
          <p className="text-sm text-font-dim mb-3">
            You don&apos;t have any schedule templates yet.
          </p>
          <button
            onClick={onCreateNew}
            className="text-sm font-semibold text-brand-secondary bg-brand-yellow-lg px-4 py-2.5 rounded-xl active:bg-brand-yellow transition-colors"
          >
            + Create schedule template
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {templates.map((t) => {
              const selected = draft.scheduleTemplateId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    update({
                      scheduleTemplateId: t.id,
                      scheduleTemplateName: t.name,
                    })
                  }
                  className={`w-full flex items-center gap-3 text-left rounded-2xl p-2.5 text-sm transition-colors ${
                    selected
                      ? "bg-brand-yellow/25 ring-2 ring-brand-yellow-lg"
                      : "bg-brand-bg active:bg-gray-100"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selected
                        ? "bg-brand-yellow-lg text-brand-secondary"
                        : "bg-white text-font-dim"
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
                  <span className="flex-1 font-semibold text-font-main-sub">
                    {t.name}
                  </span>
                  {selected && (
                    <svg
                      className="w-5 h-5 shrink-0 text-brand-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center rounded-xl bg-brand-bg px-3.5 py-2.5 text-sm font-semibold text-font-main-sub active:bg-gray-100 transition-colors"
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
  const {
    data: packageTypes = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.fleet.packageTypes(token),
    queryFn: async () => {
      const res = await getPackageTypesApi(token);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load package types");
      }
      return res.data;
    },
    enabled: !!token,
  });

  function addPackage() {
    update({
      pricingPackages: [
        ...draft.pricingPackages,
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

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700"
      >
        <span>
          {error instanceof Error
            ? error.message
            : "Failed to load package types."}
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          className="shrink-0 font-bold underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {draft.pricingPackages.map((pkg, i) => {
        const availableTypes = packageTypes.filter(
          (pt) => pt.id === pkg.packageTypeId || !usedIds.has(pt.id),
        );
        return (
          <div
            key={i}
            className="rounded-2xl border-2 border-gray-100 p-3 space-y-3 relative"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-secondary text-brand-yellow flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-font-main-sub">
                  Package {i + 1}
                </p>
              </div>
              <button
                onClick={() => removePackage(i)}
                className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 active:bg-red-100 transition-colors"
              >
                Remove
              </button>
            </div>
            <select
              value={pkg.packageTypeId ?? ""}
              onChange={(e) => {
                const packageTypeId = Number(e.target.value) || null;
                const selectedType = availableTypes.find(
                  (type) => type.id === packageTypeId,
                );
                updatePackage(i, {
                  packageTypeId,
                  packageTypeName: selectedType?.name ?? "",
                });
              }}
              className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
            >
              <option value="">Select a package type</option>
              {availableTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} ({pt.category}, {pt.duration_hours}h)
                </option>
              ))}
            </select>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-font-dim">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={pkg.price}
                    onChange={(e) =>
                      updatePackage(i, { price: e.target.value })
                    }
                    className="w-full bg-brand-bg border-2 border-transparent rounded-xl pl-8 pr-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
                  Km limit (blank = unlimited)
                </label>
                <input
                  type="number"
                  min="1"
                  value={pkg.kmLimit}
                  onChange={(e) =>
                    updatePackage(i, { kmLimit: e.target.value })
                  }
                  className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
                />
              </div>
            </div>
            <ToggleRow
              label="Allow pay at pickup"
              badge="Recommended"
              hint="Customers can pay the balance when they collect the bike"
              checked={pkg.payAtPickupEnabled}
              onChange={(checked) =>
                updatePackage(i, { payAtPickupEnabled: checked })
              }
            />
          </div>
        );
      })}
      <button
        onClick={addPackage}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-3.5 text-sm font-semibold text-font-main-sub active:bg-gray-50 transition-colors"
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
          className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
        />
      </Field>
      <Field label="Security deposit (₹)">
        <input
          type="number"
          min="0"
          value={draft.securityDepositAmount}
          onChange={(e) => update({ securityDepositAmount: e.target.value })}
          className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
        />
      </Field>
      {/* <Field label="Km limit per day (optional)">
        <input
          type="number"
          min="1"
          value={draft.kmLimitPerDay}
          onChange={(e) => update({ kmLimitPerDay: e.target.value })}
          className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
        />
      </Field> */}
      <Field label="Excess charge per km (₹)">
        <input
          type="number"
          min="0"
          value={draft.excessChargePerKm}
          onChange={(e) => update({ excessChargePerKm: e.target.value })}
          className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
        />
      </Field>
      <Field label="Late return penalty per hour (₹)">
        <input
          type="number"
          min="0"
          value={draft.lateReturnPenaltyPerHour}
          onChange={(e) => update({ lateReturnPenaltyPerHour: e.target.value })}
          className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
        />
      </Field>
      <ToggleRow
        label="Offer doorstep delivery"
        hint="Deliver the bike to the customer's address"
        checked={draft.doorstepDeliveryEnabled}
        onChange={(checked) => update({ doorstepDeliveryEnabled: checked })}
      />
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
      <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
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
    <div className="space-y-3">
      <div className="flex items-center gap-3 bg-brand-yellow/25 rounded-xl p-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-brand-yellow-lg text-brand-secondary flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {CHECK_CIRCLE_ICON}
          </svg>
        </div>
        <p className="text-sm font-semibold text-font-main-sub">
          Almost there — check the details below and publish.
        </p>
      </div>

      <ReviewRow
        icon={VEHICLE_ICON}
        label="Vehicle"
        value={draft.vehicleTypeLabel}
      />
      <ReviewRow
        icon={PIN_ICON}
        label="Location"
        value={`${draft.pickupLocationName}, ${draft.cityName}`}
      />
      <ReviewRow
        icon={STOREFRONT_ICON}
        label="Pickup point"
        value={draft.pickupPointLabel}
      />
      <ReviewRow
        icon={CALENDAR_ICON}
        label="Schedule"
        value={draft.scheduleTemplateName}
      />
      <ReviewRow
        icon={TAG_ICON}
        label="Pricing packages"
        value={`${draft.pricingPackages.length} package(s)`}
      />
      <div className="space-y-2 pl-[3.25rem]">
        {draft.pricingPackages.map((pkg, index) => (
          <div
            key={`${pkg.packageTypeId ?? "package"}-${index}`}
            className="flex items-start justify-between gap-3 rounded-xl bg-brand-bg px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-font-main-sub">
                {pkg.packageTypeName || `Package ${index + 1}`}
              </p>
              <p className="mt-0.5 text-[11px] text-font-dim">
                {pkg.kmLimit ? `${pkg.kmLimit} km limit` : "Unlimited distance"}
                {pkg.payAtPickupEnabled ? " · Pay at pickup" : " · Prepaid"}
              </p>
            </div>
            <p className="shrink-0 rounded-lg bg-brand-yellow/30 px-2 py-0.5 text-sm font-bold tabular-nums text-brand-secondary">
              ₹{pkg.price || "0"}
            </p>
          </div>
        ))}
      </div>
      <ReviewRow
        icon={SHIELD_ICON}
        label="Fleet quantity"
        value={draft.availableCount}
      />
      <ReviewRow
        icon={DEPOSIT_ICON}
        label="Security deposit"
        value={`₹${draft.securityDepositAmount}`}
      />
      <ReviewRow
        icon={DISTANCE_ICON}
        label="Excess charge"
        value={`₹${draft.excessChargePerKm}/km`}
      />
      <ReviewRow
        icon={CLOCK_ICON}
        label="Late return"
        value={`₹${draft.lateReturnPenaltyPerHour}/hour`}
      />
      <ReviewRow
        icon={TRUCK_ICON}
        label="Doorstep delivery"
        value={draft.doorstepDeliveryEnabled ? "Offered" : "Not offered"}
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full font-semibold rounded-xl py-4 text-center bg-brand-secondary text-brand-yellow active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {submitting ? "Creating listing..." : "Create listing"}
      </button>
    </div>
  );
}

function ReviewRow({
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
      <div className="w-10 h-10 rounded-xl bg-gray-100 text-font-dim flex items-center justify-center shrink-0">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <span className="text-sm text-font-dim shrink-0">{label}</span>
        <span className="text-sm font-semibold text-font-main-sub text-right truncate">
          {value}
        </span>
      </div>
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
      <div className="flex items-center gap-3 bg-white shadow-sm rounded-2xl p-3">
        <div className="w-10 h-10 rounded-xl bg-brand-yellow-lg text-brand-secondary flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {CHECK_CIRCLE_ICON}
          </svg>
        </div>
        <p className="text-sm font-semibold text-font-main-sub">
          Listing created! Add a few photos now, or skip and add them later.
        </p>
      </div>

      <label
        htmlFor="listing-photo-input"
        className="flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-2xl py-8 px-4 cursor-pointer active:bg-gray-50 transition-colors bg-white shadow-sm"
      >
        <div className="w-12 h-12 rounded-xl bg-brand-yellow-lg flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-brand-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {CAMERA_ICON}
          </svg>
        </div>
        <p className="text-sm font-semibold text-font-main-sub">
          <span className="lg:hidden">Tap</span>
          <span className="hidden lg:inline">Click</span> to choose photos
        </p>
        <p className="text-xs text-font-dim mt-1">
          {files.length > 0
            ? `${files.length} photo(s) selected`
            : "PNG or JPG, multiple allowed"}
        </p>
        <input
          id="listing-photo-input"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </label>

      {previews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="h-24 w-24 object-cover rounded-xl bg-gray-100 shrink-0"
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
          className="w-full font-semibold rounded-xl py-3.5 text-center shadow-sm bg-brand-secondary text-brand-yellow active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload photos"}
        </button>
        <button
          onClick={onDone}
          className="w-full bg-white shadow-sm rounded-xl py-3.5 text-sm font-semibold text-font-main-sub active:bg-gray-100 transition-colors"
        >
          {uploaded ? "Done" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}

/**
 * Sidebar-style row with a switch — replaces the plain checkboxes so
 * on/off settings read the same as the Live/Paused switch in the fleet
 * list.
 */
function ToggleRow({
  label,
  hint,
  badge,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  badge?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 rounded-xl bg-brand-bg px-3.5 py-3 text-left active:bg-gray-100 transition-colors"
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-font-main-sub">
          {label}
          {badge && (
            <span className="rounded-md bg-brand-yellow/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-secondary">
              {badge}
            </span>
          )}
        </span>
        {hint && (
          <span className="block text-xs text-font-dim mt-0.5">{hint}</span>
        )}
      </span>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-brand-yellow-lg" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-[26px]" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
