"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "./PhoneInput";
import { sendOtpApi, verifyOtpApi } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";

/**
 * The mockup only shows a "Send OTP" button with no next step, so a
 * tap on it would be a dead end. This adds the OTP-entry step inline
 * (same card, no route change) so the flow actually completes.
 */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isHuman, setIsHuman] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSendOtp = phone.length === 10 && isHuman && !isSubmitting;
  const canVerify = otp.length === 6 && !isSubmitting;

  async function handleSendOtp() {
    if (!canSendOtp) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await sendOtpApi(phone);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (!canVerify) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await verifyOtpApi(phone, otp);
      login(res.user, res.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
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

            <label className="border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-gray-50/50 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isHuman}
                  onChange={(e) => setIsHuman(e.target.checked)}
                  className="w-5 h-5 accent-brand-yellow rounded border-gray-300"
                />
                <span className="text-sm font-medium">Verify you are human</span>
              </div>
              <div className="text-[10px] text-gray-400 text-right">
                <span className="font-bold block text-gray-500">CLOUDFLARE</span>
                Privacy • Help
              </div>
            </label>
          </div>

          {error && <p className="text-sm text-red-500 font-medium mt-4">{error}</p>}

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
              <a href="#" className="text-brand-yellow-lg font-semibold hover:underline">
                Terms of Service
              </a>{" "}
              &{" "}
              <a href="#" className="text-brand-yellow-lg font-semibold hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
          <p className="text-sm font-medium text-font-dim mb-6">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-font-main-sub">+91 {phone}</span>
          </p>

          <label className="block text-sm font-semibold mb-2">
            OTP <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full border-2 border-brand-yellow rounded-xl py-3.5 px-4 outline-none font-semibold text-center tracking-[0.5em] placeholder-gray-300 focus:ring-4 focus:ring-brand-yellow/20 transition-all"
          />

          {error && <p className="text-sm text-red-500 font-medium mt-4">{error}</p>}

          <div className="mt-8 space-y-3">
            <button
              onClick={handleVerifyOtp}
              disabled={!canVerify}
              className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : "Verify & Continue"}
            </button>
            <button
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              className="w-full text-sm font-semibold text-font-dim py-2"
            >
              Change mobile number
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
