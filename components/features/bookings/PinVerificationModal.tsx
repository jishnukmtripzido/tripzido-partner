"use client";

import { useState, useRef } from "react";

interface PinVerificationModalProps {
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
}

export function PinVerificationModal({
  submitting,
  error,
  onCancel,
  onConfirm,
}: PinVerificationModalProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...pin];
    next[index] = value.slice(-1);
    setPin(next);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  const canSubmit = pin.join("").length === 4 && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onCancel} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5">
        <h3 className="font-heading font-bold text-base text-font-main-sub mb-1">
          Enter verification PIN
        </h3>
        <p className="text-sm text-font-dim mb-4">
          Ask the customer for their 4-digit PIN before starting the trip.
        </p>
        <div className="flex gap-2 justify-center mb-2">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                error
                  ? "border-red-400 bg-red-50"
                  : digit
                    ? "border-brand-yellow bg-brand-yellow/5"
                    : "border-gray-200 bg-gray-50"
              } focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/20`}
            />
          ))}
        </div>
        {error && (
          <p className="text-sm text-red-500 font-medium text-center mt-2">
            {error}
          </p>
        )}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(pin.join(""))}
            disabled={!canSubmit}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg disabled:opacity-50"
          >
            {submitting ? "Verifying..." : "Start trip"}
          </button>
        </div>
      </div>
    </div>
  );
}
