"use client";

import type { Vehicle } from "@/types/fleet.types";

const MOTORCYCLE_ICON = (
  <>
    <path d="M19.5 13.5A3.5 3.5 0 1 0 23 17a3.5 3.5 0 0 0-3.5-3.5ZM19.5 19A2 2 0 1 1 21.5 17 2 2 0 0 1 19.5 19ZM4.5 13.5A3.5 3.5 0 1 0 8 17a3.5 3.5 0 0 0-3.5-3.5ZM4.5 19A2 2 0 1 1 6.5 17 2 2 0 0 1 4.5 19Z" />
    <path d="M15.5 8H13V6a1 1 0 0 0-2 0v2H8.5a.5.5 0 0 0-.5.5v1.944A4.52 4.52 0 0 0 9.873 14H14.5a.5.5 0 0 0 .5-.5V10.5A2.5 2.5 0 0 1 17.5 13H19a1 1 0 0 0 0-2h-1.5a.5.5 0 0 0-.5.5.5.5 0 0 0-.5.5v1H14.5v-2H16v-2h-.5z" />
  </>
);

const SCOOTER_ICON = (
  <path d="M18 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-12-6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.62-10h3.58l-1.39-3h-2.19l-3.3 5h3.04l.26-.5zm-6.02-3.12l-1.9 2.12h3.29l1.83-2.62-3.22.5zM11.66 12H6.94l.89-1h3.36l.47 1z" />
);

interface VehicleListItemProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

export function VehicleListItem({ vehicle, onClick }: VehicleListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-brand-yellow transition-colors group text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-12 bg-gray-50 rounded-lg flex items-center justify-center p-2 border border-gray-100">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            {vehicle.kind === "scooter" ? SCOOTER_ICON : MOTORCYCLE_ICON}
          </svg>
        </div>
        <div>
          <h3 className="font-heading font-bold text-font-main-sub text-base">{vehicle.name}</h3>
          <p className="text-xs text-font-dim font-medium mt-0.5">
            Quantity: <span className="text-brand-secondary font-bold">{vehicle.quantity}</span>
          </p>
        </div>
      </div>
      <div className="text-gray-300 group-hover:text-brand-yellow transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
