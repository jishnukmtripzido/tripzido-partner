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
//   "Vehicle & location",
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
//       <>
//         <Header
//           title="Add photos"
//           onBack={() => router.push("/fleet" as Route)}
//         />
//         <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
//           <PhotoUploadPanel
//             listingId={createdListingId}
//             token={token}
//             onDone={() =>
//               router.push(`/fleet/listing?id=${createdListingId}` as Route)
//             }
//           />
//         </main>
//       </>
//     );
//   }

//   return (
//     <>
//       <Header title="Add a bike" onBack={() => router.back()} />
//       <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
//         <div className="mb-6">
//           <div className="flex justify-between text-xs text-font-dim mb-2">
//             <span>
//               Step {draft.step} of {TOTAL_STEPS}
//             </span>
//             <span>{STEP_TITLES[draft.step - 1]}</span>
//           </div>
//           <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//             <div
//               className="h-full bg-brand-yellow transition-all"
//               style={{ width: `${(draft.step / TOTAL_STEPS) * 100}%` }}
//             />
//           </div>
//         </div>

//         {draft.step === 1 && (
//           <StepVehicleLocation
//             draft={draft}
//             update={update}
//             token={token}
//             onCreatePickupPoint={handleCreatePickupPoint}
//           />
//         )}
//         {draft.step === 2 && (
//           <StepSchedule
//             draft={draft}
//             update={update}
//             token={token}
//             onCreateNew={handleCreateScheduleTemplate}
//           />
//         )}
//         {draft.step === 3 && (
//           <StepPricing draft={draft} update={update} token={token} />
//         )}
//         {draft.step === 4 && <StepPolicies draft={draft} update={update} />}
//         {draft.step === 5 && (
//           <StepReview
//             draft={draft}
//             onSubmit={handleSubmit}
//             submitting={submitting}
//             error={submitError}
//           />
//         )}

//         {draft.step < TOTAL_STEPS && (
//           <div className="flex gap-3 mt-8">
//             {draft.step > 1 && (
//               <button
//                 onClick={goBack}
//                 className="flex-1 border-2 border-gray-200 rounded-xl py-3.5 text-sm font-bold text-font-dim"
//               >
//                 Back
//               </button>
//             )}
//             <button
//               onClick={goNext}
//               disabled={!canProceed}
//               className="flex-1 rounded-xl py-3.5 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-40 disabled:cursor-not-allowed"
//             >
//               Next
//             </button>
//           </div>
//         )}
//         {draft.step === TOTAL_STEPS && (
//           <button
//             onClick={goBack}
//             className="w-full border-2 border-gray-200 rounded-xl py-3.5 text-sm font-bold text-font-dim mt-4"
//           >
//             Back
//           </button>
//         )}
//       </main>
//     </>
//   );
// }

// // ── Step 1: Vehicle & location ──────────────────────────────────────────

// type ActiveSheet = "brand" | "vehicleType" | "city" | "pickupLocation" | null;

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

//   // Full, unpaginated list for the currently selected city — fetched
//   // once via useEffect below. The sheet filters THIS array client-side
//   // rather than re-hitting the network per keystroke, since
//   // get_by_city already returns everything in one call.
//   const [locations, setLocations] = useState<PickupLocationOption[]>([]);
//   const [locationsLoading, setLocationsLoading] = useState(false);
//   const [pickupLocationSheetItems, setPickupLocationSheetItems] = useState<
//     PickupLocationOption[]
//   >([]);

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

//   // No empty-query guard anymore — an empty search now fetches the
//   // full city list (page_size=100) instead of showing nothing until
//   // the vendor types something.
//   async function fetchCities(query: string) {
//     setCityLoading(true);
//     try {
//       const res = await searchCitiesApi(query);
//       setCityItems(res.data?.results ?? []);
//     } finally {
//       setCityLoading(false);
//     }
//   }

//   function filterPickupLocations(query: string) {
//     const q = query.trim().toLowerCase();
//     setPickupLocationSheetItems(
//       q
//         ? locations.filter((l) => l.location_name.toLowerCase().includes(q))
//         : locations,
//     );
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
//     fetchCities("");
//   }
//   function openPickupLocationSheet() {
//     if (locationsLoading || locations.length === 0) return;
//     setActiveSheet("pickupLocation");
//     setPickupLocationSheetItems(locations);
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <label className="block text-sm font-semibold mb-2">Brand</label>
//         <button
//           onClick={openBrandSheet}
//           className={`w-full text-left flex items-center justify-between border-2 rounded-xl px-4 py-3 text-sm ${
//             draft.brandId
//               ? "border-brand-yellow bg-brand-yellow/5 font-medium"
//               : "border-gray-300 text-font-dim"
//           }`}
//         >
//           {draft.brandName || "Select a brand"}
//           <ChevronIcon />
//         </button>
//       </div>

//       <div>
//         <label className="block text-sm font-semibold mb-2">Vehicle type</label>
//         <button
//           onClick={openVehicleTypeSheet}
//           disabled={!draft.brandId}
//           className={`w-full text-left flex items-center justify-between border-2 rounded-xl px-4 py-3 text-sm transition-colors ${
//             draft.vehicleTypeId
//               ? "border-brand-yellow bg-brand-yellow/5 font-medium"
//               : "border-gray-300 text-font-dim"
//           } disabled:opacity-40 disabled:cursor-not-allowed`}
//         >
//           {draft.vehicleTypeLabel ||
//             (draft.brandId ? "Select a vehicle type" : "Select a brand first")}
//           <ChevronIcon />
//         </button>
//       </div>

//       <div>
//         <label className="block text-sm font-semibold mb-2">City</label>
//         <button
//           onClick={openCitySheet}
//           className={`w-full text-left flex items-center justify-between border-2 rounded-xl px-4 py-3 text-sm ${
//             draft.cityId
//               ? "border-brand-yellow bg-brand-yellow/5 font-medium"
//               : "border-gray-300 text-font-dim"
//           }`}
//         >
//           {draft.cityName || "Select a city"}
//           <ChevronIcon />
//         </button>
//       </div>

//       {draft.cityId && (
//         <div>
//           <label className="block text-sm font-semibold mb-2">
//             Pickup location
//           </label>
//           {locationsLoading ? (
//             <p className="text-xs text-font-dim">Loading locations...</p>
//           ) : locations.length === 0 ? (
//             <p className="text-xs text-red-500">
//               No pickup locations exist in this city yet. Contact your admin to
//               add one.
//             </p>
//           ) : (
//             <button
//               onClick={openPickupLocationSheet}
//               className={`w-full text-left flex items-center justify-between border-2 rounded-xl px-4 py-3 text-sm ${
//                 draft.pickupLocationId
//                   ? "border-brand-yellow bg-brand-yellow/5 font-medium"
//                   : "border-gray-300 text-font-dim"
//               }`}
//             >
//               {draft.pickupLocationName || "Select a pickup location"}
//               <ChevronIcon />
//             </button>
//           )}
//         </div>
//       )}

//       {draft.pickupLocationId && (
//         <div>
//           <label className="block text-sm font-semibold mb-2">
//             Exact pickup address
//           </label>
//           {pickupPointsLoading ? (
//             <p className="text-xs text-font-dim">
//               Loading your saved addresses...
//             </p>
//           ) : pickupPoints.length === 0 ? (
//             <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
//               <p className="text-sm text-font-dim mb-3">
//                 No saved addresses in this area yet.
//               </p>
//               <button
//                 onClick={onCreatePickupPoint}
//                 className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
//               >
//                 + Add pickup point
//               </button>
//             </div>
//           ) : (
//             <>
//               <div className="space-y-2">
//                 {pickupPoints.map((p) => (
//                   <button
//                     key={p.id}
//                     onClick={() =>
//                       update({
//                         pickupPointId: p.id,
//                         pickupPointLabel: p.label || p.address,
//                       })
//                     }
//                     className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm transition-colors ${
//                       draft.pickupPointId === p.id
//                         ? "border-brand-yellow bg-brand-yellow/5"
//                         : "border-gray-200 hover:border-gray-300"
//                     }`}
//                   >
//                     <p className="font-medium">{p.label || "Pickup point"}</p>
//                     <p className="text-xs text-font-dim mt-0.5">{p.address}</p>
//                   </button>
//                 ))}
//               </div>
//               <button
//                 onClick={onCreatePickupPoint}
//                 className="text-sm font-semibold text-brand-yellow-lg mt-2"
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
//           renderItem={(b) => <span className="font-medium">{b.name}</span>}
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
//               <span className="font-medium">{v.name}</span>
//               <span className="text-font-dim">
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
//               {c.name}, <span className="text-font-dim">{c.state_name}</span>
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
//           showAllByDefault
//           emptyLabel="No cities found."
//         />
//       )}

//       {activeSheet === "pickupLocation" && (
//         <SearchPickerSheet
//           title="Select pickup location"
//           placeholder="Search locations..."
//           items={pickupLocationSheetItems}
//           loading={false}
//           getKey={(l) => l.id}
//           renderItem={(l) => (
//             <span className="font-medium">{l.location_name}</span>
//           )}
//           onQueryChange={filterPickupLocations}
//           onSelect={(l) => {
//             update({
//               pickupLocationId: l.id,
//               pickupLocationName: l.location_name,
//               pickupPointId: null,
//               pickupPointLabel: "",
//             });
//             setActiveSheet(null);
//           }}
//           onClose={() => setActiveSheet(null)}
//           showAllByDefault
//           emptyLabel="No matching locations."
//         />
//       )}
//     </div>
//   );
// }

// function ChevronIcon() {
//   return (
//     <svg
//       className="w-5 h-5 text-gray-300 shrink-0"
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
//       <p className="text-sm text-font-dim">
//         Loading your schedule templates...
//       </p>
//     );

//   return (
//     <div className="space-y-4">
//       {error && <p className="text-sm text-red-500">{error}</p>}
//       {templates.length === 0 ? (
//         <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
//           <p className="text-sm text-font-dim mb-3">
//             You don&apos;t have any schedule templates yet.
//           </p>
//           <button
//             onClick={onCreateNew}
//             className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
//           >
//             + Create schedule template
//           </button>
//         </div>
//       ) : (
//         <>
//           <div className="space-y-2">
//             {templates.map((t) => (
//               <button
//                 key={t.id}
//                 onClick={() =>
//                   update({
//                     scheduleTemplateId: t.id,
//                     scheduleTemplateName: t.name,
//                   })
//                 }
//                 className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
//                   draft.scheduleTemplateId === t.id
//                     ? "border-brand-yellow bg-brand-yellow/5"
//                     : "border-gray-200 hover:border-gray-300"
//                 }`}
//               >
//                 {t.name}
//               </button>
//             ))}
//           </div>
//           <button
//             onClick={onCreateNew}
//             className="text-sm font-semibold text-brand-yellow-lg"
//           >
//             + Create a new schedule template
//           </button>
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
//     return <p className="text-sm text-font-dim">Loading package types...</p>;

//   return (
//     <div className="space-y-4">
//       {draft.pricingPackages.map((pkg, i) => {
//         const availableTypes = packageTypes.filter(
//           (pt) => pt.id === pkg.packageTypeId || !usedIds.has(pt.id),
//         );
//         return (
//           <div
//             key={i}
//             className="border border-gray-100 rounded-xl p-4 space-y-3"
//           >
//             <div className="flex justify-between items-center">
//               <label className="text-xs font-semibold text-gray-600">
//                 Package type
//               </label>
//               <button
//                 onClick={() => removePackage(i)}
//                 className="text-xs text-red-500 font-semibold"
//               >
//                 Remove
//               </button>
//             </div>
//             <select
//               value={pkg.packageTypeId ?? ""}
//               onChange={(e) =>
//                 updatePackage(i, {
//                   packageTypeId: Number(e.target.value) || null,
//                 })
//               }
//               className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
//             >
//               <option value="">Select a package type</option>
//               {availableTypes.map((pt) => (
//                 <option key={pt.id} value={pt.id}>
//                   {pt.name} ({pt.category}, {pt.duration_hours}h)
//                 </option>
//               ))}
//             </select>
//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-1">
//                   Price (₹)
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   value={pkg.price}
//                   onChange={(e) => updatePackage(i, { price: e.target.value })}
//                   className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-1">
//                   Km limit (optional)
//                 </label>
//                 <input
//                   type="number"
//                   min="1"
//                   value={pkg.kmLimit}
//                   onChange={(e) =>
//                     updatePackage(i, { kmLimit: e.target.value })
//                   }
//                   className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//                 />
//               </div>
//             </div>
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={pkg.payAtPickupEnabled}
//                 onChange={(e) =>
//                   updatePackage(i, { payAtPickupEnabled: e.target.checked })
//                 }
//                 className="w-4 h-4 accent-brand-yellow"
//               />
//               Allow pay at pickup
//             </label>
//           </div>
//         );
//       })}
//       <button
//         onClick={addPackage}
//         className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-semibold text-font-dim hover:border-brand-yellow hover:text-brand-secondary transition-colors"
//       >
//         + Add pricing package
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
//       <Field label="Fleet quantity at this location">
//         <input
//           type="number"
//           min="1"
//           value={draft.availableCount}
//           onChange={(e) => update({ availableCount: e.target.value })}
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//       </Field>
//       <Field label="Security deposit (₹)">
//         <input
//           type="number"
//           min="0"
//           value={draft.securityDepositAmount}
//           onChange={(e) => update({ securityDepositAmount: e.target.value })}
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//       </Field>
//       <Field label="Km limit per day (optional)">
//         <input
//           type="number"
//           min="1"
//           value={draft.kmLimitPerDay}
//           onChange={(e) => update({ kmLimitPerDay: e.target.value })}
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//       </Field>
//       <Field label="Excess charge per km (optional, ₹)">
//         <input
//           type="number"
//           min="0"
//           value={draft.excessChargePerKm}
//           onChange={(e) => update({ excessChargePerKm: e.target.value })}
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//       </Field>
//       <Field label="Late return penalty per hour (optional, ₹)">
//         <input
//           type="number"
//           min="0"
//           value={draft.lateReturnPenaltyPerHour}
//           onChange={(e) => update({ lateReturnPenaltyPerHour: e.target.value })}
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//       </Field>
//       <label className="flex items-center gap-2 text-sm">
//         <input
//           type="checkbox"
//           checked={draft.doorstepDeliveryEnabled}
//           onChange={(e) =>
//             update({ doorstepDeliveryEnabled: e.target.checked })
//           }
//           className="w-4 h-4 accent-brand-yellow"
//         />
//         Offer doorstep delivery
//       </label>
//     </div>
//   );
// }

// function Field({
//   label,
//   children,
// }: {
//   label: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-gray-600 mb-1">
//         {label}
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
//       <ReviewRow label="Vehicle" value={draft.vehicleTypeLabel} />
//       <ReviewRow
//         label="Location"
//         value={`${draft.pickupLocationName}, ${draft.cityName}`}
//       />
//       <ReviewRow label="Pickup point" value={draft.pickupPointLabel} />
//       <ReviewRow label="Schedule" value={draft.scheduleTemplateName} />
//       <ReviewRow
//         label="Pricing packages"
//         value={`${draft.pricingPackages.length} package(s)`}
//       />
//       <ReviewRow label="Fleet quantity" value={draft.availableCount} />

//       {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

//       <button
//         onClick={onSubmit}
//         disabled={submitting}
//         className="w-full font-bold rounded-xl py-4 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
//       >
//         {submitting ? "Creating listing..." : "Create listing"}
//       </button>
//     </div>
//   );
// }

// function ReviewRow({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
//       <span className="text-font-dim">{label}</span>
//       <span className="font-medium text-font-main-sub text-right">{value}</span>
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
//     <div className="space-y-4">
//       <p className="text-sm font-medium text-font-dim">
//         Your listing was created. Add a few photos now, or skip and add them
//         later.
//       </p>
//       <input
//         type="file"
//         accept="image/*"
//         multiple
//         onChange={(e) => handleFiles(e.target.files)}
//         className="block w-full text-sm"
//       />
//       {previews.length > 0 && (
//         <div className="flex gap-2 overflow-x-auto hide-scrollbar">
//           {previews.map((src, i) => (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img
//               key={i}
//               src={src}
//               alt=""
//               className="h-24 w-24 object-cover rounded-xl border border-gray-100 shrink-0"
//             />
//           ))}
//         </div>
//       )}
//       {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
//       {uploaded && (
//         <p className="text-sm text-green-600 font-medium">Photos uploaded.</p>
//       )}
//       <div className="space-y-3">
//         <button
//           onClick={handleUpload}
//           disabled={uploading || files.length === 0}
//           className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
//         >
//           {uploading ? "Uploading..." : "Upload photos"}
//         </button>
//         <button
//           onClick={onDone}
//           className="w-full text-sm font-semibold text-font-dim py-2"
//         >
//           {uploaded ? "Done" : "Skip for now"}
//         </button>
//       </div>
//     </div>
//   );
// }

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
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 bg-brand-bg">
        <StepIndicator currentStep={draft.step} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
                className="flex-1 border-2 border-gray-200 rounded-xl py-3.5 text-sm font-bold text-font-dim"
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-bold bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    <div className="mb-5">
      <div className="flex items-center">
        {steps.map((icon, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <div
              key={stepNum}
              className={`flex items-center ${stepNum < steps.length ? "flex-1" : ""}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? "bg-brand-yellow text-brand-secondary"
                    : isActive
                      ? "bg-brand-secondary text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {icon}
                  </svg>
                )}
              </div>
              {stepNum < steps.length && (
                <div
                  className={`flex-1 h-0.5 mx-1.5 rounded-full transition-colors ${
                    isDone ? "bg-brand-yellow" : "bg-gray-100"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center font-heading font-bold text-base text-font-main-sub mt-3">
        {STEP_TITLES[currentStep - 1]}
      </p>
      <p className="text-center text-xs text-font-dim mt-0.5">
        Step {currentStep} of {TOTAL_STEPS}
      </p>
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

      {draft.pickupLocationId && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2 px-1">
            Exact pickup address
          </p>
          {pickupPointsLoading ? (
            <p className="text-xs text-font-dim px-1">
              Loading your saved addresses...
            </p>
          ) : pickupPoints.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-font-dim mb-3">
                No saved addresses in this area yet.
              </p>
              <button
                onClick={onCreatePickupPoint}
                className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg hover:bg-brand-yellow-lg transition-colors"
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
                      className={`w-full flex items-start gap-3 text-left border-2 rounded-xl px-3.5 py-3 text-sm transition-colors ${
                        selected
                          ? "border-brand-yellow bg-brand-yellow/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
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
                          {PIN_ICON}
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
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
                className="text-sm font-semibold text-brand-yellow-lg mt-3"
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
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-300"
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
            className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg hover:bg-brand-yellow-lg transition-colors"
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
            className="border border-gray-100 rounded-xl p-4 space-y-3 relative"
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
      <label className="flex items-center gap-2 text-sm bg-gray-50 rounded-xl px-3.5 py-3">
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
      <div className="flex items-center gap-3 bg-brand-yellow/10 rounded-xl p-3.5 mb-1">
        <div className="w-9 h-9 rounded-full bg-brand-yellow text-brand-secondary flex items-center justify-center shrink-0">
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
      <ReviewRow
        icon={SHIELD_ICON}
        label="Fleet quantity"
        value={draft.availableCount}
      />

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
    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
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
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <span className="text-sm text-font-dim">{label}</span>
        <span className="font-semibold text-font-main-sub text-right truncate">
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
      <div className="flex items-center gap-3 bg-brand-yellow/10 rounded-xl p-3.5">
        <div className="w-9 h-9 rounded-full bg-brand-yellow text-brand-secondary flex items-center justify-center shrink-0">
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
        className="flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-2xl py-8 px-4 cursor-pointer hover:border-brand-yellow transition-colors bg-white"
      >
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {CAMERA_ICON}
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">
          Tap to choose photos
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
