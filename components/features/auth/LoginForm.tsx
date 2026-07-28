"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "./PhoneInput";
import {
  sendOtpApi,
  verifyOtpApi,
  getProfileApi,
} from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useTurnstile } from "@/hooks/useTurnstile";
import { useOtpInput } from "@/hooks/useOtpInput";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const {
    token: turnstileToken,
    tokenRef,
    reset: resetTurnstile,
  } = useTurnstile(step === "phone");

  const {
    otp,
    refs: otpRefs,
    handleChange: handleOtpChange,
    handleKeyDown: handleOtpKeyDown,
    reset: resetOtp,
  } = useOtpInput(step === "otp");

  const canSendOtp = phone.length === 10 && !!turnstileToken && !isSubmitting;
  const canVerify = otp.join("").length === 4 && !isSubmitting;

  async function handleSendOtp() {
    if (!canSendOtp) return;
    const token = tokenRef.current;
    if (!token) return;

    setIsSubmitting(true);
    setSendError(null);
    try {
      const data = await sendOtpApi(phone, token);
      if (!data.success) {
        setSendError(data.message || "Failed to send OTP");
        resetTurnstile();
        return;
      }
      setStep("otp");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send OTP");
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (!canVerify) return;
    setIsSubmitting(true);
    setOtpError(null);
    try {
      const code = otp.join("");
      const res = await verifyOtpApi(phone, code);

      if (!res.success || !res.data) {
        setOtpError(res.message || "Invalid OTP");
        resetOtp();
        return;
      }

      const { access_token, refresh_token } = res.data;

      // verify-otp returns tokens only — fetch profile for name/phone.
      let user = { phone_number: phone, first_name: "", last_name: "" };
      try {
        const profile = await getProfileApi(access_token);
        if (profile.success && profile.data) {
          user = {
            phone_number: profile.data.mobile_number,
            first_name: profile.data.first_name,
            last_name: profile.data.last_name,
          };
        }
      } catch {
        // Profile fetch failed — don't block login on it, just proceed
        // with the placeholder. Dashboard can refetch profile later.
      }

      login(user, access_token, refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Invalid OTP");
      resetOtp();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChangeNumber() {
    setStep("phone");
    setPhone("");
    resetOtp();
    setOtpError(null);
    setSendError(null);
  }

  function handleResend() {
    setStep("phone");
    resetOtp();
    setOtpError(null);
    setSendError(null);
  }

  return (
    <div className="pt-4">
      <h2 className="text-[32px] leading-tight font-heading font-extrabold mb-2 text-brand-secondary">
        Welcome back
      </h2>
      <p className="text-font-dim mb-8 text-sm font-medium">
        Manage your fleet, track earnings, and grow your business.
      </p>

      {step === "phone" ? (
        <>
          <div className="space-y-6">
            <PhoneInput value={phone} onChange={setPhone} />
            <div id="cf-turnstile-container" className="flex justify-center" />
          </div>

          {sendError && (
            <p className="text-sm text-red-500 font-medium mt-4">{sendError}</p>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={handleSendOtp}
              disabled={!canSendOtp}
              className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send OTP"}
            </button>
            <p className="text-center text-xs text-font-dim mt-4">
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="text-brand-yellow-lg font-semibold hover:underline"
              >
                Terms of Service
              </a>{" "}
              &{" "}
              <a
                href="#"
                className="text-brand-yellow-lg font-semibold hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
          <p className="text-sm font-medium text-font-dim mb-6">
            Enter the 4-digit code sent to{" "}
            <span className="font-semibold text-font-main-sub">
              +91 {phone}
            </span>
          </p>

          <div className="flex gap-2 mb-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-14 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                  otpError
                    ? "border-red-400 bg-red-50"
                    : digit
                      ? "border-brand-yellow bg-brand-yellow/5"
                      : "border-gray-200 bg-gray-50"
                } focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/20`}
              />
            ))}
          </div>

          {otpError && (
            <p className="text-sm text-red-500 font-medium mt-2">{otpError}</p>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={handleVerifyOtp}
              disabled={!canVerify}
              className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : "Verify & Continue"}
            </button>
            <div className="flex justify-between items-center pt-1">
              <button
                onClick={handleChangeNumber}
                className="text-sm font-semibold text-font-dim py-2"
              >
                Change mobile number
              </button>
              <button
                onClick={handleResend}
                className="text-sm font-semibold text-brand-yellow-lg py-2"
              >
                Resend OTP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}