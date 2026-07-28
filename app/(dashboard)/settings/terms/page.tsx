"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorTermsApi,
  saveVendorTermsApi,
} from "@/services/settings.service";

export default function VendorTermsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [version, setVersion] = useState<number | null>(null);
  const [termsItems, setTermsItems] = useState<string[]>([]);
  const [securityDepositNote, setSecurityDepositNote] = useState("");
  const [operatingHoursNote, setOperatingHoursNote] = useState("");
  const [distanceLimitNote, setDistanceLimitNote] = useState("");
  const [excessChargeNote, setExcessChargeNote] = useState("");
  const [latePenaltyNote, setLatePenaltyNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getVendorTermsApi(token);
        if (cancelled) return;
        if (res.success && res.data) {
          setVersion(res.data.version);
          setTermsItems(
            res.data.terms_items.length > 0 ? res.data.terms_items : [""],
          );
          setSecurityDepositNote(res.data.security_deposit_note);
          setOperatingHoursNote(res.data.operating_hours_note);
          setDistanceLimitNote(res.data.distance_limit_note);
          setExcessChargeNote(res.data.excess_charge_note);
          setLatePenaltyNote(res.data.late_penalty_note);
        } else {
          setTermsItems([""]);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load terms");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function updateItem(index: number, value: string) {
    setTermsItems((prev) =>
      prev.map((item, i) => (i === index ? value : item)),
    );
  }
  function addItem() {
    setTermsItems((prev) => [...prev, ""]);
  }
  function removeItem(index: number) {
    setTermsItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await saveVendorTermsApi(
        {
          terms_items: termsItems.map((t) => t.trim()).filter(Boolean),
          security_deposit_note: securityDepositNote,
          operating_hours_note: operatingHoursNote,
          distance_limit_note: distanceLimitNote,
          excess_charge_note: excessChargeNote,
          late_penalty_note: latePenaltyNote,
        },
        token,
      );
      if (!res.success || !res.data) {
        setError(res.message || "Failed to save terms");
        return;
      }
      setVersion(res.data.version);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save terms");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header title="Terms & Conditions" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 space-y-5">
        {loading ? (
          <p className="text-sm text-font-dim text-center mt-10">Loading...</p>
        ) : (
          <>
            {version !== null && (
              <p className="text-xs text-font-dim">
                Current version: v{version}
              </p>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Terms items
              </label>
              <div className="space-y-2">
                {termsItems.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(i, e.target.value)}
                      placeholder="e.g. One day is 9am to 9am"
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                    />
                    <button
                      onClick={() => removeItem(i)}
                      className="text-red-500 text-sm font-bold px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                className="text-sm font-semibold text-brand-yellow-lg mt-2"
              >
                + Add item
              </button>
            </div>

            <Field label="Security deposit note">
              <textarea
                value={securityDepositNote}
                onChange={(e) => setSecurityDepositNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            </Field>
            <Field label="Operating hours note">
              <textarea
                value={operatingHoursNote}
                onChange={(e) => setOperatingHoursNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            </Field>
            <Field label="Distance limit note">
              <textarea
                value={distanceLimitNote}
                onChange={(e) => setDistanceLimitNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            </Field>
            <Field label="Excess charge note">
              <textarea
                value={excessChargeNote}
                onChange={(e) => setExcessChargeNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            </Field>
            <Field label="Late penalty note">
              <textarea
                value={latePenaltyNote}
                onChange={(e) => setLatePenaltyNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            </Field>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            {saved && (
              <p className="text-sm text-green-600 font-medium">
                Saved as a new version.
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        )}
      </main>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
