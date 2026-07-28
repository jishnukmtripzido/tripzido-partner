"use client";

interface QuantityStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
}

/** The − / count / + control used on Block Bikes rows. */
export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max,
}: QuantityStepperProps) {
  const atMax = max !== undefined && value >= max;
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border border-gray-100 shadow-inner">
      <button
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="w-7 h-7 rounded bg-white text-gray-400 hover:text-brand-secondary shadow-sm flex items-center justify-center transition-colors border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
            d="M20 12H4"
          />
        </svg>
      </button>
      <span className="font-bold text-sm text-font-main-sub w-2 text-center">
        {value}
      </span>
      <button
        onClick={onIncrement}
        disabled={atMax}
        aria-label="Increase quantity"
        className="w-7 h-7 rounded bg-brand-yellow text-brand-secondary shadow-sm flex items-center justify-center transition-colors border border-brand-yellow disabled:opacity-50 disabled:cursor-not-allowed"
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
      </button>
    </div>
  );
}
