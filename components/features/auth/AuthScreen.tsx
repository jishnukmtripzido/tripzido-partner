"use client";

import type { ReactNode } from "react";

/**
 * Shared frame for the sign-in screens: light brand-yellow hero (the
 * same yellow as the dashboard's View payouts button) with the logo,
 * title and subtitle, and a cream sheet that overlaps it and holds the
 * form.
 */
export function AuthScreen({
  title,
  subtitle,
  heroExtra,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  /** Optional content under the subtitle (e.g. a step indicator). */
  heroExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto hide-scrollbar">
      <div className="flex min-h-full flex-col lg:mx-auto lg:max-w-md">
        <div className="bg-brand-yellow px-6 pb-14 pt-[calc(2rem+env(safe-area-inset-top,0px))]">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-secondary">
              <svg
                className="h-5 w-5 text-brand-yellow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </span>
            <p className="font-heading text-xl font-extrabold tracking-tight text-brand-secondary">
              tripzido{" "}
              <span className="text-xs font-semibold tracking-normal text-brand-secondary/60">
                partner
              </span>
            </p>
          </div>

          <h1 className="mt-8 font-heading text-3xl font-bold leading-tight text-brand-secondary">
            {title}
          </h1>
          <div className="mt-1.5 text-sm text-brand-secondary/70">{subtitle}</div>
          {heroExtra}
        </div>

        <div className="-mt-8 flex-1 rounded-t-3xl bg-brand-bg px-5 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Uppercase field label, matching the rest of the app's forms. */
export function AuthLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block px-1 text-[11px] font-bold uppercase tracking-wider text-font-dim/70"
    >
      {children}
    </label>
  );
}

export const AUTH_PRIMARY_BUTTON =
  "w-full rounded-xl bg-brand-secondary py-4 text-center text-sm font-semibold text-brand-yellow shadow-sm active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed";

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
    >
      {children}
    </p>
  );
}
