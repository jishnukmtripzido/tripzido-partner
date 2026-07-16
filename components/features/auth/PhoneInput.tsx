"use client";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** The flag + "+91" + number field reused on both Login and Register. */
export function PhoneInput({ value, onChange }: PhoneInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">
        Mobile number <span className="text-red-500">*</span>
      </label>
      <div className="flex border-2 border-brand-yellow rounded-xl overflow-hidden bg-white focus-within:ring-4 focus-within:ring-brand-yellow/20 transition-all">
        <div className="flex items-center gap-2 px-4 bg-white border-r border-gray-100">
          <span className="text-lg">🇮🇳</span>
          <span className="font-semibold text-gray-700">+91</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Phone Number"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          className="flex-1 py-3.5 px-4 outline-none font-medium placeholder-gray-400 w-full"
        />
      </div>
    </div>
  );
}
