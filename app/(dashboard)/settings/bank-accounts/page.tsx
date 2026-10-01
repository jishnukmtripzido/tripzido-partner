"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorBankAccountsApi,
  createVendorBankAccountApi,
} from "@/services/vendor.service";
import { queryKeys } from "@/lib/queryKeys";
import { PageLoader } from "@/components/ui/PageLoader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { VendorBankAccount } from "@/types/settings.types";

const BANK_PATH =
  "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3";

// Standard Indian IFSC: 4 letters, a zero, then 6 letters/digits.
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const INPUT_CLASS =
  "w-full bg-white border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-medium text-font-main-sub placeholder:text-font-dim/60 shadow-sm focus:outline-none focus:border-brand-yellow transition-colors";

// The API field is named account_number_masked, but pending accounts
// have been seen coming back unmasked — mask here too so a full account
// number is never shown on screen. Already-masked values pass through.
function maskAccountNumber(value: string): string {
  const v = value.trim();
  if (/[*xX•]/.test(v) || v.length <= 4) return v;
  return `•••• ${v.slice(-4)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// History badges. Deliberately relabelled rather than trusting
// status_label verbatim: the VERIFIED choice's display text is
// "Verified – Active", which would misleadingly suggest one of these
// old records is still the active payout account when it isn't.
function historyBadge(acc: VendorBankAccount) {
  if (acc.status === "VERIFIED")
    return { text: "Previously active", className: "bg-gray-100 text-gray-600" };
  if (acc.status === "REJECTED")
    return { text: "Rejected", className: "bg-red-100 text-red-700" };
  if (acc.status === "SUPERSEDED")
    return { text: "Superseded", className: "bg-gray-100 text-gray-600" };
  return { text: acc.status_label, className: "bg-gray-100 text-gray-600" };
}

export default function BankAccountsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);

  const queryKey = queryKeys.settings.bankAccounts(token);
  const {
    data: accounts = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getVendorBankAccountsApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load bank accounts");
      }
      return res.data;
    },
    enabled: !!token,
  });

  const activeAccount = accounts.find((a) => a.is_active_acc);
  const pendingAccounts = accounts.filter((a) => a.status === "PENDING");
  const historyAccounts = accounts.filter(
    (a) => a !== activeAccount && a.status !== "PENDING",
  );

  return (
    <>
      <Header
        title="Bank Account"
        onBack={() => router.back()}
        rightSlot={
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm active:opacity-80 transition-opacity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <div className="mt-2 rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-red-500">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-yellow active:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Active payout account */}
            <section>
              <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                Payout account
              </h2>
              {activeAccount ? (
                <div className="relative overflow-hidden rounded-2xl bg-brand-secondary p-5 text-white shadow-md">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand-yellow/15" />
                  <div className="pointer-events-none absolute -bottom-16 -right-2 h-40 w-40 rounded-full bg-brand-yellow/10" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
                        Active payout account
                      </p>
                      <p className="mt-1 truncate font-heading text-lg font-bold">
                        {activeAccount.bank_name || "Bank account"}
                      </p>
                    </div>
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
                          d={BANK_PATH}
                        />
                      </svg>
                    </span>
                  </div>
                  <p className="relative mt-5 font-heading text-xl font-bold tracking-widest tabular-nums">
                    {maskAccountNumber(activeAccount.account_number_masked)}
                  </p>
                  <div className="relative mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">
                        Account holder
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {activeAccount.account_holder_name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">
                        IFSC
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {activeAccount.ifsc_code}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={BANK_PATH}
                      />
                    </svg>
                  </span>
                  <p className="text-sm font-semibold text-font-main-sub">
                    No active payout account yet
                  </p>
                  <p className="mt-1 text-xs text-font-dim">
                    {pendingAccounts.length > 0
                      ? "Your submitted account is being reviewed."
                      : "Add the bank account your payouts should be sent to."}
                  </p>
                  {pendingAccounts.length === 0 && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-4 rounded-xl bg-brand-secondary px-4 py-2.5 text-sm font-semibold text-brand-yellow active:opacity-80 transition-opacity"
                    >
                      Add bank account
                    </button>
                  )}
                </div>
              )}
            </section>

            {pendingAccounts.length > 0 && (
              <section>
                <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                  Awaiting review · {pendingAccounts.length}
                </h2>
                <div className="space-y-2.5">
                  {pendingAccounts.map((acc) => (
                    <AccountRow
                      key={acc.id}
                      account={acc}
                      badge={{
                        text: "Pending review",
                        className: "bg-yellow-100 text-yellow-700",
                      }}
                      tileClass="bg-brand-yellow-lg text-brand-secondary"
                      footnote={`Submitted ${formatDate(acc.submitted_at)}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {historyAccounts.length > 0 && (
              <section>
                <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                  Previous submissions · {historyAccounts.length}
                </h2>
                <div className="space-y-2.5">
                  {historyAccounts.map((acc) => (
                    <AccountRow
                      key={acc.id}
                      account={acc}
                      badge={historyBadge(acc)}
                      tileClass="bg-gray-100 text-font-dim"
                      footnote={`Submitted ${formatDate(acc.submitted_at)}`}
                      reason={
                        acc.status === "REJECTED"
                          ? acc.rejection_reason
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </span>
              <p className="text-xs leading-relaxed text-font-dim">
                New accounts are reviewed by our team before payouts are sent
                to them.
                {activeAccount &&
                  " Your current account stays active until then."}
              </p>
            </div>
          </div>
        )}
      </main>

      {showAddForm && (
        <AddBankAccountSheet
          token={token!}
          hasExistingAccount={accounts.length > 0}
          onClose={() => setShowAddForm(false)}
          onAdded={() => {
            setShowAddForm(false);
            queryClient.invalidateQueries({ queryKey });
          }}
        />
      )}
    </>
  );
}

function AccountRow({
  account,
  badge,
  tileClass,
  footnote,
  reason,
}: {
  account: VendorBankAccount;
  badge: { text: string; className: string };
  tileClass: string;
  footnote: string;
  reason?: string;
}) {
  return (
    <article className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tileClass}`}
        >
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
              d={BANK_PATH}
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-font-main-sub">
              {account.account_holder_name}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
            >
              {badge.text}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-font-dim">
            {account.bank_name || "Bank account"}
          </p>
          <p className="truncate text-xs font-medium tabular-nums text-font-main-sub">
            {maskAccountNumber(account.account_number_masked)}
            <span className="font-normal text-font-dim">
              {" "}
              · IFSC {account.ifsc_code}
            </span>
          </p>
          <p className="mt-1.5 text-[11px] text-font-dim/80">{footnote}</p>
        </div>
      </div>
      {reason && (
        <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-semibold">Reason:</span> {reason}
        </p>
      )}
    </article>
  );
}

function AddBankAccountSheet({
  token,
  hasExistingAccount,
  onClose,
  onAdded,
}: {
  token: string;
  hasExistingAccount: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmNumber, setConfirmNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  const numbersMatch = accountNumber.trim() === confirmNumber.trim();
  const ifscValid = IFSC_PATTERN.test(ifsc.trim());
  const canContinue =
    holderName.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    numbersMatch &&
    ifscValid;

  const submitMutation = useMutation({
    mutationFn: async (): Promise<VendorBankAccount> => {
      const res = await createVendorBankAccountApi(
        {
          account_holder_name: holderName.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifsc.trim(),
          bank_name: bankName.trim(),
        },
        token,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to submit bank account");
      }
      return res.data;
    },
    onSuccess: () => onAdded(),
  });

  const error =
    submitMutation.error instanceof Error
      ? submitMutation.error.message
      : null;

  return (
    <BottomSheet
      title={step === "form" ? "Add bank account" : "Confirm account"}
      subtitle={
        step === "form"
          ? "Where your payouts will be sent"
          : "Check the details before submitting"
      }
      onClose={onClose}
    >
      {(dismiss) =>
        step === "form" ? (
          <div className="space-y-3.5">
            <Field label="Account holder name">
              <input
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="As shown on your bank account"
                autoComplete="name"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Account number">
              <input
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\s/g, ""))
                }
                placeholder="Account number"
                inputMode="numeric"
                autoComplete="off"
                className={INPUT_CLASS}
              />
            </Field>
            <Field
              label="Re-enter account number"
              error={
                confirmNumber && !numbersMatch
                  ? "Account numbers don't match."
                  : undefined
              }
            >
              <input
                value={confirmNumber}
                onChange={(e) =>
                  setConfirmNumber(e.target.value.replace(/\s/g, ""))
                }
                placeholder="Type it again to confirm"
                inputMode="numeric"
                autoComplete="off"
                onPaste={(e) => e.preventDefault()}
                className={INPUT_CLASS}
              />
            </Field>
            <Field
              label="IFSC code"
              error={
                ifsc && !ifscValid
                  ? "IFSC is 11 characters, e.g. SBIN0001234."
                  : undefined
              }
            >
              <input
                value={ifsc}
                onChange={(e) =>
                  setIfsc(e.target.value.toUpperCase().replace(/\s/g, ""))
                }
                placeholder="e.g. SBIN0001234"
                maxLength={11}
                autoCapitalize="characters"
                className={`${INPUT_CLASS} tracking-wider`}
              />
            </Field>
            <Field label="Bank name (optional)">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India"
                className={INPUT_CLASS}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={dismiss}
                className="rounded-xl bg-white py-3.5 text-sm font-semibold text-font-main-sub shadow-sm active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!canContinue}
                className="rounded-xl bg-brand-secondary py-3.5 text-sm font-semibold text-brand-yellow shadow-sm active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
                {bankName.trim() || "Bank account"}
              </p>
              <p className="mt-1 font-heading text-lg font-bold tracking-wider tabular-nums text-font-main-sub">
                {accountNumber}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-font-dim/70">
                    Account holder
                  </p>
                  <p className="truncate text-sm font-semibold text-font-main-sub">
                    {holderName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-font-dim/70">
                    IFSC
                  </p>
                  <p className="text-sm font-semibold text-font-main-sub">
                    {ifsc}
                  </p>
                </div>
              </div>
            </div>

            <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
              This account will be reviewed by our team.{" "}
              {hasExistingAccount
                ? "Once approved, it becomes your active payout account and replaces the one you use now."
                : "Once approved, it becomes your active payout account."}
            </p>

            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep("form")}
                disabled={submitMutation.isPending}
                className="rounded-xl bg-white py-3.5 text-sm font-semibold text-font-main-sub shadow-sm active:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="rounded-xl bg-brand-secondary py-3.5 text-sm font-semibold text-brand-yellow shadow-sm active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )
      }
    </BottomSheet>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block px-1 text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
