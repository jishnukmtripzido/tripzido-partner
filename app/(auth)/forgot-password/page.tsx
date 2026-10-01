"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneInput } from "@/components/features/auth/PhoneInput";
import { PasswordField } from "@/components/features/auth/PasswordField";
import {
  AuthScreen,
  AuthLabel,
  AuthError,
  AUTH_PRIMARY_BUTTON,
} from "@/components/features/auth/AuthScreen";
import {
  sendForgotPasswordOtpApi,
  resetPasswordApi,
} from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useOtpInput } from "@/hooks/useOtpInput";

type Step = "phone" | "otp" | "password";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const STEP_ORDER: Step[] = ["phone", "otp", "password"];
const STEP_TITLES: Record<Step, string> = {
  phone: "Reset password",
  otp: "Enter the code",
  password: "New password",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const {
    otp,
    refs: otpRefs,
    handleChange: handleOtpChange,
    handleKeyDown: handleOtpKeyDown,
    handlePaste: handleOtpPaste,
    reset: resetOtp,
  } = useOtpInput(step === "otp");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const canSendOtp =
    phone.length === 10 && !isSubmitting && resendSeconds === 0;

  const canVerifyOtp = otp.join("").length === OTP_LENGTH && !isSubmitting;

  const longEnough = newPassword.length >= 8;
  const matches = newPassword.length > 0 && newPassword === confirmPassword;
  const canReset = longEnough && matches && !isSubmitting;

  async function handleSendOtp() {
    if (!canSendOtp) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await sendForgotPasswordOtpApi(phone);

      if (!response.success) {
        setError(response.message || "Failed to send code.");
        return;
      }

      setStep("otp");
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      resetOtp();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send code. Please try again.",
      );
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
      const response = await resetPasswordApi(phone, code, newPassword);

      if (!response.success || !response.data) {
        setError(response.message || "Failed to reset password.");
        setStep("otp");
        resetOtp();
        return;
      }

      const { access_token, refresh_token } = response.data;

      login(
        {
          phone_number: phone,
          first_name: "",
          last_name: "",
        },
        access_token,
        refresh_token,
      );

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again.",
      );
      setStep("otp");
      resetOtp();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChangePhone() {
    setStep("phone");
    setPhone("");
    setResendSeconds(0);
    setError(null);
    resetOtp();
    setNewPassword("");
    setConfirmPassword("");
  }

  function handleChangeOtp() {
    setStep("otp");
    setError(null);
    setNewPassword("");
    setConfirmPassword("");
    resetOtp();
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <AuthScreen
      title={STEP_TITLES[step]}
      subtitle={
        step === "phone" ? (
          "We'll send a 6-digit code to the email on file for your account."
        ) : step === "otp" ? (
          <>
            Sent to the email registered to{" "}
            <span className="font-semibold text-brand-secondary">
              +91 {phone}
            </span>
          </>
        ) : (
          "Choose a new password for your account."
        )
      }
      heroExtra={
        <div className="mt-5">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEP_ORDER.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? "bg-brand-secondary" : "bg-brand-secondary/20"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-brand-secondary/60">
            Step {stepIndex + 1} of 3
          </p>
        </div>
      }
    >
      <div className="animate-fade-in space-y-4">
        {step === "phone" && (
          <>
            <PhoneInput value={phone} onChange={setPhone} />

            {error && <AuthError>{error}</AuthError>}

            <div className="pt-2">
              <button
                onClick={handleSendOtp}
                disabled={!canSendOtp}
                className={AUTH_PRIMARY_BUTTON}
              >
                {isSubmitting
                  ? "Sending..."
                  : resendSeconds > 0
                    ? `Send code again in ${resendSeconds}s`
                    : "Send code"}
              </button>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div>
              <AuthLabel>6-digit code</AuthLabel>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={OTP_LENGTH}
                    value={digit}
                    onChange={(event) =>
                      handleOtpChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={(event) => handleOtpPaste(index, event)}
                    aria-label={`Code digit ${index + 1}`}
                    className={`h-14 w-full min-w-0 rounded-xl border-2 text-center font-heading text-xl font-bold text-font-main-sub shadow-sm outline-none transition-colors ${
                      error
                        ? "border-red-300 bg-red-50"
                        : digit
                          ? "border-brand-yellow-lg bg-brand-yellow/20"
                          : "border-transparent bg-white"
                    } focus:border-brand-yellow`}
                  />
                ))}
              </div>
              <p className="mt-2 px-1 text-xs text-font-dim">
                The code is valid for 5 minutes. You can paste it straight
                from the email.
              </p>
            </div>

            {error && <AuthError>{error}</AuthError>}

            <div className="pt-2">
              <button
                onClick={handleOtpContinue}
                disabled={!canVerifyOtp}
                className={AUTH_PRIMARY_BUTTON}
              >
                Continue
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <span className="text-sm text-font-dim">
                Didn&apos;t get the code?
              </span>
              <button
                onClick={handleSendOtp}
                disabled={resendSeconds > 0 || isSubmitting}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-font-main-sub active:bg-gray-100 disabled:text-font-dim/60"
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend"}
              </button>
            </div>

            <button
              onClick={handleChangePhone}
              className="w-full py-2 text-sm font-semibold text-font-dim"
            >
              Change phone number
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <div>
              <AuthLabel htmlFor="new-password">New password</AuthLabel>
              <PasswordField
                id="new-password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <AuthLabel htmlFor="confirm-password">Confirm password</AuthLabel>
              <PasswordField
                id="confirm-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Type it again"
                autoComplete="new-password"
              />
            </div>

            <ul className="space-y-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <Requirement met={longEnough}>At least 8 characters</Requirement>
              <Requirement met={matches}>Both passwords match</Requirement>
            </ul>

            {error && <AuthError>{error}</AuthError>}

            <div className="pt-2">
              <button
                onClick={handleReset}
                disabled={!canReset}
                className={AUTH_PRIMARY_BUTTON}
              >
                {isSubmitting ? "Saving..." : "Reset password & sign in"}
              </button>
            </div>

            <button
              onClick={handleChangeOtp}
              disabled={isSubmitting}
              className="w-full py-2 text-sm font-semibold text-font-dim disabled:cursor-not-allowed"
            >
              Change verification code
            </button>
          </>
        )}

        <p className="pt-4 text-center text-sm text-font-dim">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-font-main-sub underline decoration-brand-yellow-lg decoration-2 underline-offset-2"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthScreen>
  );
}

function Requirement({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`flex items-center gap-2 text-sm ${
        met ? "text-green-700" : "text-font-dim"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          met ? "bg-green-100" : "bg-gray-100"
        }`}
        aria-hidden="true"
      >
        {met ? (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        )}
      </span>
      {children}
      <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
    </li>
  );
}
