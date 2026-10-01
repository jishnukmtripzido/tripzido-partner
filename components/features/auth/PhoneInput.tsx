"use client";

import { AuthLabel } from "./AuthScreen";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** The flag + "+91" + number field reused on Login and Reset password. */
export function PhoneInput({ value, onChange }: PhoneInputProps) {
  return (
    <div>
      <AuthLabel htmlFor="phone-input">Mobile number</AuthLabel>
      <div className="flex overflow-hidden rounded-xl border-2 border-transparent bg-white shadow-sm transition-colors focus-within:border-brand-yellow">
        <div className="flex items-center gap-1.5 border-r border-gray-100 pl-4 pr-3">
          <span className="text-base" aria-hidden="true">
            🇮🇳
          </span>
          <span className="text-sm font-semibold text-font-main-sub">+91</span>
        </div>
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          className="w-full min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm font-medium tracking-wide text-font-main-sub placeholder:tracking-normal placeholder:text-font-dim/60 outline-none"
        />
      </div>
    </div>
  );
}
