"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneInput } from "./PhoneInput";
import { PasswordField } from "./PasswordField";
import { AuthLabel, AuthError, AUTH_PRIMARY_BUTTON } from "./AuthScreen";
import { passwordLoginApi, getProfileApi } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = phone.length === 10 && password.length > 0 && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await passwordLoginApi(phone, password);
      if (!res.success || !res.data) {
        setError(res.message || "Invalid phone number or password");
        return;
      }
      const { access_token, refresh_token } = res.data;

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
        // Profile fetch failed — don't block login on it.
      }

      login(user, access_token, refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid phone number or password",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhoneInput value={phone} onChange={setPhone} />

      <div>
        <div className="flex items-end justify-between">
          <AuthLabel htmlFor="login-password">Password</AuthLabel>
          <Link
            href="/forgot-password"
            className="mb-1.5 px-1 text-xs font-semibold text-font-main-sub underline decoration-brand-yellow-lg decoration-2 underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordField
          id="login-password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </div>

      {error && <AuthError>{error}</AuthError>}

      <div className="pt-2">
        <button type="submit" disabled={!canSubmit} className={AUTH_PRIMARY_BUTTON}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </div>

      <p className="px-4 pt-2 text-center text-xs leading-relaxed text-font-dim">
        By continuing, you agree to our{" "}
        <a href="#" className="font-semibold text-font-main-sub underline">
          Terms of Service
        </a>{" "}
        &{" "}
        <a href="#" className="font-semibold text-font-main-sub underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
