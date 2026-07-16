"use client";

import type { BlockEntry } from "@/types/fleet.types";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

interface BlockListItemProps {
  entry: BlockEntry;
  highlighted?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function BlockListItem({
  entry,
  highlighted = false,
  onIncrement,
  onDecrement,
}: BlockListItemProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
      {highlighted && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-yellow" />
      )}

      <div className={`text-xs text-gray-400 font-medium mb-3 border-b border-gray-50 pb-2 ${highlighted ? "pl-2" : ""}`}>
        Block ID {entry.blockId}
      </div>
      <div className={`flex justify-between items-start gap-2 ${highlighted ? "pl-2" : ""}`}>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-font-main-sub text-base mb-2 leading-tight pr-2">
            {entry.vehicleName}
          </h3>
          <div className="space-y-1.5 text-xs">
            <p className="text-font-dim">
              <span className="font-semibold text-gray-700">Start:</span> {entry.startLabel}
            </p>
            <p className="text-font-dim">
              <span className="font-semibold text-gray-700">End:</span> {entry.endLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <QuantityStepper value={entry.quantity} onIncrement={onIncrement} onDecrement={onDecrement} />
          <span className="text-[10px] text-gray-400 font-medium mr-1">
            (Available: {entry.availableCount})
          </span>
        </div>
      </div>
    </div>
  );
}
