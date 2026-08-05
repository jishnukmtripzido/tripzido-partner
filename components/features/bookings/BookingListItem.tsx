// "use client";

// import type {
//   VendorBookingListItem,
//   BookingStatus,
// } from "@/types/booking.types";
// import { STATUS_BADGE_STYLES, STATUS_ACTION_CONFIG } from "@/lib/bookingStatus";

// interface BookingListItemProps {
//   booking: VendorBookingListItem;
//   onClick: () => void;
//   onStatusAction: (target: BookingStatus) => void;
// }

// export function BookingListItem({
//   booking,
//   onClick,
//   onStatusAction,
// }: BookingListItemProps) {
//   return (
//     <div className="w-full bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 mb-3">
//       <button
//         onClick={onClick}
//         className="w-full text-left flex items-start gap-4"
//       >
//         <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
//           {booking.vehicle_image ? (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img
//               src={booking.vehicle_image}
//               alt={booking.vehicle_name}
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <svg
//               className="w-6 h-6 text-gray-300"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={1.5}
//                 d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
//               />
//             </svg>
//           )}
//         </div>

//         <div className="flex-1 min-w-0">
//           <div className="flex items-start justify-between gap-2 mb-1">
//             <h3 className="font-heading font-bold text-[15px] text-gray-900 truncate">
//               {booking.vehicle_name}
//             </h3>
//             <span
//               className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-md ${
//                 STATUS_BADGE_STYLES[booking.status] ??
//                 "bg-[#F0F4FF] text-[#4A72FF]" // Default to soft blue
//               }`}
//             >
//               {booking.status_label}
//             </span>
//           </div>

//           <p className="text-xs text-gray-500 font-medium mt-0.5">
//             {booking.customer_name} • {booking.customer_phone}
//           </p>
//           <p className="text-xs text-gray-500 font-medium mt-0.5">
//             {booking.location_name}
//           </p>
//           <div className="flex items-center justify-between mt-1.5">
//             <p className="text-[11px] text-gray-400 font-medium">
//               {booking.booking_reference}
//             </p>
//             {booking.is_offline && (
//               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
//                 Offline
//               </span>
//             )}
//           </div>
//         </div>
//       </button>

//       {booking.available_next_statuses.length > 0 && (
//         <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
//           {booking.available_next_statuses.map((target) => {
//             const config = STATUS_ACTION_CONFIG[target];
//             if (!config) return null;

//             // Primary action gets solid background, secondary gets outline
//             const isPrimary = target !== "CANCELLED";

//             return (
//               <button
//                 key={target}
//                 onClick={() => onStatusAction(target)}
//                 className={`flex-1 text-[13px] font-bold py-2.5 rounded-full transition-all duration-200 border ${
//                   isPrimary
//                     ? "bg-[#FFD166] border-[#FFD166] text-[#242A38] hover:bg-[#ffc63b]"
//                     : "bg-transparent border-[#E5E7EB] text-gray-500 hover:bg-gray-50"
//                 } ${config.destructive ? "hover:text-red-500 hover:border-red-200" : ""}`}
//               >
//                 {config.label}
//               </button>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import type {
  VendorBookingListItem,
  BookingStatus,
} from "@/types/booking.types";
import { STATUS_BADGE_STYLES, STATUS_ACTION_CONFIG } from "@/lib/bookingStatus";

interface BookingListItemProps {
  booking: VendorBookingListItem;
  onClick: () => void;
  onStatusAction: (target: BookingStatus) => void;
}

export function BookingListItem({
  booking,
  onClick,
  onStatusAction,
}: BookingListItemProps) {
  return (
    <div className="w-full bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50 mb-3">
      <button
        onClick={onClick}
        className="w-full text-left flex items-start gap-4"
      >
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
          {booking.vehicle_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.vehicle_image}
              alt={booking.vehicle_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-6 h-6 text-gray-300"
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
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-heading font-bold text-[15px] text-gray-900 truncate">
              {booking.vehicle_name}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-md ${
                STATUS_BADGE_STYLES[booking.status] ??
                "bg-[#F0F4FF] text-[#4A72FF]" // Default to soft blue
              }`}
            >
              {booking.status_label}
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1 text-xs">
            <p className="text-gray-600">
              Location:{" "}
              <span className="font-bold text-gray-900">
                {booking.customer_name}
              </span>{" "}
              <span className="mx-1 text-gray-300">|</span> Contact:{" "}
              <span className="font-bold text-gray-900">
                {booking.customer_phone}
              </span>
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-gray-600">
                Pickup Point:{" "}
                <span className="font-bold text-gray-900">
                  {booking.location_name}
                </span>
              </p>
              {booking.is_offline && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {booking.available_next_statuses.length > 0 && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-gray-50">
          {booking.available_next_statuses.map((target) => {
            const config = STATUS_ACTION_CONFIG[target];
            if (!config) return null;

            // Primary action gets solid background, secondary gets outline
            const isPrimary = target !== "CANCELLED";

            return (
              <button
                key={target}
                onClick={() => onStatusAction(target)}
                className={`flex-1 text-[13px] font-bold py-2.5 rounded-full transition-all duration-200 border ${
                  isPrimary
                    ? "bg-[#FFD166] border-[#FFD166] text-[#242A38] hover:bg-[#ffc63b]"
                    : "bg-transparent border-[#E5E7EB] text-gray-500 hover:bg-gray-50"
                } ${config.destructive ? "hover:text-red-500 hover:border-red-200" : ""}`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
