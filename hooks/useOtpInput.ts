"use client";

import { useState, useRef, useEffect } from "react";

export function useOtpInput(active: boolean) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // auto focus first box when OTP step becomes active
  useEffect(() => {
    if (active) {
      setTimeout(() => refs.current[0]?.focus(), 100);
    }
  }, [active]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 3) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const reset = () => setOtp(["", "", "", ""]);

  return { otp, refs, handleChange, handleKeyDown, reset };
}
