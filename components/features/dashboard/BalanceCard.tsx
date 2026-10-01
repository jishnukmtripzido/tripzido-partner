"use client";

import Link from "next/link";

interface BalanceCardProps {
  balance: number;
}

/** Dark "wallet" card — same visual family as the Bank Account card. */
export function BalanceCard({ balance }: BalanceCardProps) {
  const [whole, fraction] = balance
    .toLocaleString("en-IN", { minimumFractionDigits: 2 })
    .split(".");

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-brand-secondary p-5 text-white shadow-md">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand-yellow/15" />
      <div className="pointer-events-none absolute -bottom-16 right-6 h-36 w-36 rounded-full bg-brand-yellow/10" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
          Available balance
        </p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-brand-secondary">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"
            />
          </svg>
        </span>
      </div>

      <p className="relative -mt-2 flex items-baseline gap-1 font-heading tabular-nums">
        <span className="text-xl font-bold text-white/70">₹</span>
        <span className="break-all text-4xl font-bold">{whole}</span>
        <span className="text-lg font-bold text-white/60">.{fraction}</span>
      </p>
      <p className="relative mt-1 mb-5 text-xs text-white/50">
        Current partner account balance
      </p>

      <Link
        href="/ledger"
        className="relative mt-auto self-start inline-flex items-center gap-1.5 rounded-xl bg-brand-yellow px-3.5 py-2 text-sm font-semibold text-brand-secondary hover:opacity-90 active:opacity-80 transition-opacity"
      >
        View payouts
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </Link>
    </section>
  );
}
