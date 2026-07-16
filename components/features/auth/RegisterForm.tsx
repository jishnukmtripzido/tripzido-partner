"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "./PhoneInput";
import { registerSendOtpApi, registerVerifyOtpApi } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSendOtp = firstName.trim().length > 0 && phone.length === 10 && !isSubmitting;
  const canVerify = otp.length === 6 && !isSubmitting;

  async function handleSendOtp() {
    if (!canSendOtp) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await registerSendOtpApi({
        phone_number: phone,
        first_name: firstName,
        last_name: lastName || undefined,
      });
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
      const res = await registerVerifyOtpApi(phone, otp);
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
        Create account
      </h2>
      <p className="text-font-dim mb-8 text-sm font-medium">
        Join in seconds — name and mobile number required
      </p>

      {step === "details" ? (
        <>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl py-3 px-4 outline-none font-medium placeholder-gray-400 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Last name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl py-3 px-4 outline-none font-medium placeholder-gray-400 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/20 transition-all"
                />
              </div>
            </div>

            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          {error && <p className="text-sm text-red-500 font-medium mt-4">{error}</p>}

          <div className="mt-8 pt-4">
            <button
              onClick={handleSendOtp}
              disabled={!canSendOtp}
              className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send OTP"}
            </button>
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
                setStep("details");
                setOtp("");
                setError(null);
              }}
              className="w-full text-sm font-semibold text-font-dim py-2"
            >
              Edit details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
