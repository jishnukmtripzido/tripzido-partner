// app/(dashboard)/settings/bank-accounts/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorBankAccountsApi,
  createVendorBankAccountApi,
} from "@/services/vendor.service";
import { queryKeys } from "@/lib/queryKeys";
import type { VendorBankAccount } from "@/types/settings.types";

export default function BankAccountsPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);

  const queryKey = queryKeys.settings.bankAccounts(token);
  const {
    data: accounts = [],
    isLoading: loading,
    error,
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
      <Header title="Bank Account Details" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <button
          onClick={() => router.push("/settings")}
          className="text-sm font-semibold text-font-dim mb-4"
        >
          ← Back to settings
        </button>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-sm">
            Your Payout Account
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs font-bold text-brand-yellow-lg"
          >
            + Add account
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-font-dim text-center py-10">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-10">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        ) : (
          <div className="space-y-5">
            {/* Active account */}
            {activeAccount ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold">
                    {activeAccount.account_holder_name}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                    Active Payout Account
                  </span>
                </div>
                <p className="text-xs text-font-dim">
                  {activeAccount.bank_name || "—"} •{" "}
                  {activeAccount.account_number_masked} •{" "}
                  {activeAccount.ifsc_code}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <p className="text-sm text-font-dim">
                  No active payout account on file yet.
                </p>
              </div>
            )}

            {/* Pending review */}
            {pendingAccounts.length > 0 && (
              <div>
                <h3 className="font-heading font-bold text-sm mb-2">
                  Awaiting Review
                </h3>
                <div className="space-y-2">
                  {pendingAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {acc.account_holder_name}
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                          Pending Review
                        </span>
                      </div>
                      <p className="text-xs text-font-dim mt-0.5">
                        {acc.bank_name || "—"} • {acc.account_number_masked} •{" "}
                        {acc.ifsc_code}
                      </p>
                      <p className="text-[10px] text-font-dim mt-2">
                        Submitted{" "}
                        {new Date(acc.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History — rejected / superseded. Deliberately relabelled
                rather than trusting status_label verbatim: the VERIFIED
                choice's display text is "Verified – Active", which would
                misleadingly suggest one of these old records is still
                the active payout account when it isn't. */}
            {historyAccounts.length > 0 && (
              <div>
                <h3 className="font-heading font-bold text-sm mb-2">
                  Previous Submissions
                </h3>
                <div className="space-y-2">
                  {historyAccounts.map((acc) => {
                    const badge =
                      acc.status === "VERIFIED"
                        ? {
                            text: "Previously Active",
                            className: "bg-gray-100 text-gray-600",
                          }
                        : acc.status === "REJECTED"
                          ? {
                              text: "Rejected",
                              className: "bg-red-100 text-red-700",
                            }
                          : acc.status === "SUPERSEDED"
                            ? {
                                text: "Superseded",
                                className: "bg-gray-100 text-gray-600",
                              }
                            : {
                                text: acc.status_label,
                                className: "bg-gray-100 text-gray-600",
                              };
                    return (
                      <div
                        key={acc.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {acc.account_holder_name}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}
                          >
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-xs text-font-dim mt-0.5">
                          {acc.bank_name || "—"} • {acc.account_number_masked} •{" "}
                          {acc.ifsc_code}
                        </p>
                        {acc.status === "REJECTED" && acc.rejection_reason && (
                          <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-lg p-2">
                            Reason: {acc.rejection_reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {showAddForm && (
          <AddBankAccountModal
            token={token!}
            hasExistingAccount={accounts.length > 0}
            onClose={() => setShowAddForm(false)}
            onAdded={() => {
              setShowAddForm(false);
              queryClient.invalidateQueries({ queryKey });
            }}
          />
        )}
      </main>
    </>
  );
}

function AddBankAccountModal({
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
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  const canContinue =
    holderName.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    ifsc.trim().length > 0;

  const submitMutation = useMutation({
    mutationFn: async (): Promise<VendorBankAccount> => {
      const res = await createVendorBankAccountApi(
        {
          account_holder_name: holderName,
          account_number: accountNumber,
          ifsc_code: ifsc,
          bank_name: bankName,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        {step === "form" ? (
          <>
            <h3 className="font-heading font-bold text-base">
              Add bank account
            </h3>
            <input
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Account holder name"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account number"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="IFSC code"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Bank name (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!canContinue}
                className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-heading font-bold text-base">
              Make this your active bank account?
            </h3>
            <p className="text-sm text-font-dim">
              This account will be submitted for review by our team.{" "}
              {hasExistingAccount
                ? "Once approved, it will become your active payout account, replacing the one you use now."
                : "Once approved, it will become your active payout account."}
            </p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="font-semibold">{holderName}</p>
              <p className="text-xs text-font-dim mt-0.5">
                {bankName || "—"} • {accountNumber} • {ifsc}
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("form")}
                disabled={submitMutation.isPending}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Back
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
              >
                {submitMutation.isPending ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
