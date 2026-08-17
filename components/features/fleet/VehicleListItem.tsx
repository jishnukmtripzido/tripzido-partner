// "use client";

// import { useState } from "react";
// import type { Vehicle } from "@/types/fleet.types";
// import {
//   LISTING_STATUS_STYLES,
//   LISTING_STATUS_LABELS,
// } from "@/lib/listingStatus";

// const MOTORCYCLE_ICON = (
//   <>
//     <path d="M19.5 13.5A3.5 3.5 0 1 0 23 17a3.5 3.5 0 0 0-3.5-3.5ZM19.5 19A2 2 0 1 1 21.5 17 2 2 0 0 1 19.5 19ZM4.5 13.5A3.5 3.5 0 1 0 8 17a3.5 3.5 0 0 0-3.5-3.5ZM4.5 19A2 2 0 1 1 6.5 17 2 2 0 0 1 4.5 19Z" />
//     <path d="M15.5 8H13V6a1 1 0 0 0-2 0v2H8.5a.5.5 0 0 0-.5.5v1.944A4.52 4.52 0 0 0 9.873 14H14.5a.5.5 0 0 0 .5-.5V10.5A2.5 2.5 0 0 1 17.5 13H19a1 1 0 0 0 0-2h-1.5a.5.5 0 0 0-.5.5.5.5 0 0 0-.5.5v1H14.5v-2H16v-2h-.5z" />
//   </>
// );

// const SCOOTER_ICON = (
//   <path d="M18 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-12-6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.62-10h3.58l-1.39-3h-2.19l-3.3 5h3.04l.26-.5zm-6.02-3.12l-1.9 2.12h3.29l1.83-2.62-3.22.5zM11.66 12H6.94l.89-1h3.36l.47 1z" />
// );

// const LOCATION_ICON = (
//   <>
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2.5}
//       d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//     />
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2.5}
//       d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//     />
//   </>
// );

// interface ToggleResult {
//   success: boolean;
//   message?: string;
// }

// interface VehicleListItemProps {
//   vehicle: Vehicle;
//   onClick?: () => void;
//   // Only called when the switch is tappable (status is APPROVED or
//   // PAUSED). Parent owns the real status via its own fetch/state —
//   // this component just reports the tap and reflects whatever status
//   // comes back down through the vehicle prop afterward.
//   onToggleActive?: (vehicleId: string) => Promise<ToggleResult>;
// }

// export function VehicleListItem({
//   vehicle,
//   onClick,
//   onToggleActive,
// }: VehicleListItemProps) {
//   const [toggling, setToggling] = useState(false);
//   const [toggleError, setToggleError] = useState<string | null>(null);

//   const statusStyle = vehicle.status
//     ? (LISTING_STATUS_STYLES[vehicle.status] ?? "bg-[#F0F4FF] text-[#4A72FF]")
//     : null;
//   const statusLabel = vehicle.status
//     ? (LISTING_STATUS_LABELS[vehicle.status] ?? vehicle.status)
//     : null;

//   // Switch shows for both APPROVED and PAUSED — these are the two
//   // vendor-controllable "live cycle" states. PENDING/SUSPENDED/
//   // REJECTED are admin-controlled and get no switch at all.
//   const isToggleable =
//     vehicle.status === "APPROVED" || vehicle.status === "PAUSED";
//   const isActive = vehicle.status === "APPROVED";

//   async function handleToggle(e: React.MouseEvent) {
//     e.stopPropagation();
//     if (!onToggleActive || toggling) return;
//     setToggling(true);
//     setToggleError(null);
//     const res = await onToggleActive(vehicle.id);
//     if (!res.success) setToggleError(res.message || "Failed to update");
//     setToggling(false);
//   }

//   return (
//     <div
//       role="button"
//       tabIndex={0}
//       onClick={onClick}
//       onKeyDown={(e) => {
//         if (e.key === "Enter" || e.key === " ") onClick?.();
//       }}
//       className="w-full bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 mb-4 cursor-pointer"
//     >
//       {/* Top Section: Image and Details */}
//       <div className="flex items-start gap-4 mb-4">
//         {/* 1. Image Container */}
//         <div className="w-[84px] h-[84px] rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
//           {vehicle.imageUrl ? (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img
//               src={vehicle.imageUrl}
//               alt={vehicle.name}
//               className="w-full h-full object-contain mix-blend-multiply"
//             />
//           ) : (
//             <svg
//               className="w-8 h-8 text-gray-300"
//               fill="currentColor"
//               viewBox="0 0 24 24"
//             >
//               {vehicle.kind === "scooter" ? SCOOTER_ICON : MOTORCYCLE_ICON}
//             </svg>
//           )}
//         </div>

//         {/* 2. Content Container */}
//         <div className="flex-1 min-w-0">
//           {/* Title and Status */}
//           <div className="flex items-start justify-between gap-2 mb-2">
//             <h3 className="font-heading font-bold text-[16px] text-gray-900 leading-tight">
//               {vehicle.name}
//             </h3>
//             {statusLabel && (
//               <span
//                 className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${statusStyle}`}
//               >
//                 {statusLabel}
//               </span>
//             )}
//           </div>

//           {/* Location and Unit Info */}
//           <div className="flex flex-col gap-1 text-[13px] text-gray-600">
//             {vehicle.locationName && (
//               <p className="flex items-start gap-1.5">
//                 <svg
//                   className="w-4 h-4 shrink-0 text-gray-400 mt-0.5"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   {LOCATION_ICON}
//                 </svg>
//                 <span className="truncate">
//                   Location:{" "}
//                   <span className="font-bold text-gray-900">
//                     {vehicle.locationName}
//                   </span>
//                 </span>
//               </p>
//             )}

//             {vehicle.pickupPointLabel && (
//               <p className="ml-[22px] truncate">
//                 Pickup Pnt:{" "}
//                 <span className="font-bold text-gray-900">
//                   {vehicle.pickupPointLabel}
//                 </span>
//               </p>
//             )}

//             <p className={vehicle.locationName ? "ml-[22px]" : ""}>
//               Total Units:{" "}
//               <span className="font-bold text-gray-900">
//                 {vehicle.quantity}
//               </span>
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Bottom Section: pause/resume switch (left) + chevron (right) */}
//       <div className="flex items-center justify-between pt-1">
//         {isToggleable ? (
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="flex items-center gap-2"
//           >
//             <button
//               type="button"
//               role="switch"
//               aria-checked={isActive}
//               aria-label={isActive ? "Pause listing" : "Activate listing"}
//               onClick={handleToggle}
//               disabled={toggling}
//               className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
//                 isActive ? "bg-[#D4A33B]" : "bg-gray-200"
//               }`}
//             >
//               <span
//                 className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
//                   isActive ? "translate-x-5" : "translate-x-0"
//                 }`}
//               />
//             </button>
//             <span className="text-xs font-semibold text-gray-600">
//               {isActive ? "Active" : "Paused"}
//             </span>
//             {toggleError && (
//               <span className="text-[10px] text-red-500">{toggleError}</span>
//             )}
//           </div>
//         ) : (
//           <span />
//         )}

//         <svg
//           className="w-5 h-5 text-gray-300 shrink-0"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M9 5l7 7-7 7"
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import type { Vehicle } from "@/types/fleet.types";
import {
  LISTING_STATUS_STYLES,
  LISTING_STATUS_LABELS,
} from "@/lib/listingStatus";

const MOTORCYCLE_ICON = (
  <>
    <path d="M19.5 13.5A3.5 3.5 0 1 0 23 17a3.5 3.5 0 0 0-3.5-3.5ZM19.5 19A2 2 0 1 1 21.5 17 2 2 0 0 1 19.5 19ZM4.5 13.5A3.5 3.5 0 1 0 8 17a3.5 3.5 0 0 0-3.5-3.5ZM4.5 19A2 2 0 1 1 6.5 17 2 2 0 0 1 4.5 19Z" />
    <path d="M15.5 8H13V6a1 1 0 0 0-2 0v2H8.5a.5.5 0 0 0-.5.5v1.944A4.52 4.52 0 0 0 9.873 14H14.5a.5.5 0 0 0 .5-.5V10.5A2.5 2.5 0 0 1 17.5 13H19a1 1 0 0 0 0-2h-1.5a.5.5 0 0 0-.5.5.5.5 0 0 0-.5.5v1H14.5v-2H16v-2h-.5z" />
  </>
);

const SCOOTER_ICON = (
  <path d="M18 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-12-6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.62-10h3.58l-1.39-3h-2.19l-3.3 5h3.04l.26-.5zm-6.02-3.12l-1.9 2.12h3.29l1.83-2.62-3.22.5zM11.66 12H6.94l.89-1h3.36l.47 1z" />
);

const LOCATION_ICON = (
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

interface ToggleResult {
  success: boolean;
  message?: string;
}

interface VehicleListItemProps {
  vehicle: Vehicle;
  onClick?: () => void;
  onToggleActive?: (vehicleId: string) => Promise<ToggleResult>;
}

export function VehicleListItem({
  vehicle,
  onClick,
  onToggleActive,
}: VehicleListItemProps) {
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const statusStyle = vehicle.status
    ? (LISTING_STATUS_STYLES[vehicle.status] ?? "bg-[#F0F4FF] text-[#4A72FF]")
    : null;
  const statusLabel = vehicle.status
    ? (LISTING_STATUS_LABELS[vehicle.status] ?? vehicle.status)
    : null;

  const isToggleable =
    vehicle.status === "APPROVED" || vehicle.status === "PAUSED";
  const isActive = vehicle.status === "APPROVED";

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onToggleActive || toggling) return;
    setToggling(true);
    setToggleError(null);
    const res = await onToggleActive(vehicle.id);
    if (!res.success) setToggleError(res.message || "Failed to update");
    setToggling(false);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className="group relative flex w-full flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#D4A33B] hover:shadow-md sm:flex-row sm:items-center sm:gap-5 mb-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#D4A33B]"
    >
      {/* 1. Image Container */}
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2 transition-transform duration-200 group-hover:scale-105 border border-gray-100/50">
        {vehicle.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.imageUrl}
            alt={vehicle.name}
            className="h-full w-full object-contain mix-blend-multiply"
          />
        ) : (
          <svg
            className="h-10 w-10 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {vehicle.kind === "scooter" ? SCOOTER_ICON : MOTORCYCLE_ICON}
          </svg>
        )}
      </div>

      {/* 2. Main Content Container */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-bold text-gray-900 leading-tight truncate">
            {vehicle.name}
          </h3>
          {/* Status Badge */}
          {statusLabel && (
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${statusStyle}`}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* Location Details (Icon-driven) */}
        <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-gray-500">
          {vehicle.locationName && (
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {LOCATION_ICON}
              </svg>
              <span className="font-medium text-gray-700 truncate">
                {vehicle.locationName}
              </span>
            </div>
          )}

          {vehicle.pickupPointLabel && (
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {STOREFRONT_ICON}
              </svg>
              <span className="truncate">{vehicle.pickupPointLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Actions & Stats (Right aligned on desktop) */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4 sm:mt-0 sm:flex-col sm:items-end sm:justify-between sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:h-20">
        {/* Units */}
        <div className="text-left sm:text-right">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Total Units
          </span>
          <span className="text-xl font-black text-gray-900 leading-none">
            {vehicle.quantity}
          </span>
        </div>

        {/* Toggle Switch */}
        <div className="flex flex-col items-end">
          {isToggleable ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 sm:hidden">
                {isActive ? "Active" : "Paused"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                aria-label={isActive ? "Pause listing" : "Activate listing"}
                onClick={handleToggle}
                disabled={toggling}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#D4A33B] focus:ring-offset-2 ${
                  isActive ? "bg-[#D4A33B]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                    isActive ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ) : (
            <span className="h-6" /> /* Placeholder to maintain height if no toggle */
          )}
          {toggleError && (
            <span className="mt-1 text-[10px] text-red-500 max-w-[100px] text-right leading-tight">
              {toggleError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
