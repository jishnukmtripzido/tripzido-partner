"use client";

import { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;

export function useOtpInput(active: boolean) {
  const [otp, setOtp] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );

  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => {
      refs.current[0]?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [active]);

  // Spreads several digits across the boxes starting at `index` — used
  // for pasting the code, and for keyboards/autofill that drop the whole
  // code into a single box at once.
  function fillFrom(index: number, digits: string) {
    const next = [...otp];
    let last = index;
    for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) {
      next[index + i] = digits[i];
      last = index + i;
    }
    setOtp(next);
    refs.current[Math.min(last + 1, OTP_LENGTH - 1)]?.focus();
  }

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (value && !digits) return; // ignore non-digit input

    if (digits.length > 1) {
      fillFrom(index, digits);
      return;
    }

    const next = [...otp];
    next[index] = digits;
    setOtp(next);

    if (digits && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    // A full code always fills from the first box, wherever it's pasted.
    fillFrom(digits.length >= OTP_LENGTH ? 0 : index, digits);
  };

  const reset = () => {
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
  };

  return {
    otp,
    refs,
    handleChange,
    handleKeyDown,
    handlePaste,
    reset,
  };
}
