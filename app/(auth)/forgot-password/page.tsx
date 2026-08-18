"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneInput } from "@/components/features/auth/PhoneInput";
import {
  sendForgotPasswordOtpApi,
  resetPasswordApi,
} from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useOtpInput } from "@/hooks/useOtpInput";

type Step = "phone" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    otp,
    refs: otpRefs,
    handleChange: handleOtpChange,
    handleKeyDown: handleOtpKeyDown,
    reset: resetOtp,
  } = useOtpInput(step === "otp");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSendOtp = phone.length === 10 && !isSubmitting;
  const canVerifyOtp = otp.join("").length === 4 && !isSubmitting;
  const canReset =
    newPassword.length >= 8 && newPassword === confirmPassword && !isSubmitting;

  async function handleSendOtp() {
    if (!canSendOtp) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await sendForgotPasswordOtpApi(phone);
      if (!res.success) {
        setError(res.message || "Failed to send code");
        return;
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOtpContinue() {
    if (!canVerifyOtp) return;
    setStep("password");
    setError(null);
  }

  async function handleReset() {
    if (!canReset) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const code = otp.join("");
      const res = await resetPasswordApi(phone, code, newPassword);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to reset password");
        setStep("otp");
        resetOtp();
        return;
      }
      const { access_token, refresh_token } = res.data;
      login(
        { phone_number: phone, first_name: "", last_name: "" },
        access_token,
        refresh_token,
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="lg:max-w-md lg:mx-auto lg:w-full px-6 pt-10 pb-10">
      <h1 className="text-[28px] leading-tight font-extrabold mb-2 text-brand-secondary">
        Reset your password
      </h1>

      {step === "phone" && (
        <>
          <p className="text-font-dim mb-8 text-sm font-medium">
            Enter your registered phone number — we&rsquo;ll send a code to the
            email on file for that account.
          </p>
          <PhoneInput value={phone} onChange={setPhone} />
          {error && (
            <p className="text-sm text-red-500 font-medium mt-4">{error}</p>
          )}
          <button
            onClick={handleSendOtp}
            disabled={!canSendOtp}
            className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed mt-8"
          >
            {isSubmitting ? "Sending..." : "Send Code"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <p className="text-font-dim mb-8 text-sm font-medium">
            Enter the 4-digit code sent to the email registered to{" "}
            <span className="font-semibold text-font-main-sub">
              +91 {phone}
            </span>
            .
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
                className="w-14 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all border-gray-200 bg-gray-50 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/20"
              />
            ))}
          </div>
          {error && (
            <p className="text-sm text-red-500 font-medium mt-2 text-center">
              {error}
            </p>
          )}
          <button
            onClick={handleOtpContinue}
            disabled={!canVerifyOtp}
            className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed mt-8"
          >
            Continue
          </button>
          <button
            onClick={() => {
              setStep("phone");
              resetOtp();
              setError(null);
            }}
            className="w-full text-sm font-semibold text-font-dim py-3 mt-2"
          >
            Change phone number
          </button>
        </>
      )}

      {step === "password" && (
        <>
          <p className="text-font-dim mb-8 text-sm font-medium">
            Choose a new password (at least 8 characters).
          </p>
          <div className="space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-brand-yellow bg-gray-50"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-brand-yellow bg-gray-50"
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-500">
                Must be at least 8 characters.
              </p>
            )}
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">
                Passwords don&rsquo;t match.
              </p>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-500 font-medium mt-4">{error}</p>
          )}
          <button
            onClick={handleReset}
            disabled={!canReset}
            className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed mt-8"
          >
            {isSubmitting ? "Saving..." : "Reset Password & Sign In"}
          </button>
        </>
      )}

      <p className="text-center text-sm font-semibold text-font-dim mt-8">
        <Link href="/login" className="text-brand-yellow-lg hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
