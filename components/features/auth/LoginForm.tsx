"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhoneInput } from "./PhoneInput";
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
    <form onSubmit={handleSubmit} className="pt-4">
      <h2 className="text-[32px] leading-tight font-extrabold mb-2 text-brand-secondary">
        Welcome back
      </h2>
      <p className="text-font-dim mb-8 text-sm font-medium">
        Manage your fleet, track earnings, and grow your business.
      </p>

      <div className="space-y-5">
        <PhoneInput value={phone} onChange={setPhone} />

        <div>
          <label className="block text-sm font-semibold text-font-main-sub mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-brand-yellow bg-gray-50"
          />
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-brand-yellow-lg hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium mt-4">{error}</p>
      )}

      <div className="mt-8 space-y-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full font-bold rounded-xl py-4 text-center transition-colors bg-gray-200 text-gray-400 enabled:bg-brand-yellow enabled:text-brand-secondary enabled:hover:bg-brand-yellow-lg disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
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
    </form>
  );
}
