"use client";

import { useState } from "react";
import { GoogleMapPicker } from "@/components/ui/GoogleMapPicker";
import type {
  PickupPoint,
  PickupPointPayload,
} from "@/types/listing-create.types";

interface PickupPointFormProps {
  initial?: Partial<PickupPoint>;
  pickupLocationId: number | null;
  pickupLocationName?: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (data: PickupPointPayload) => void;
  submitLabel: string;
}

export function PickupPointForm({
  initial,
  pickupLocationId,
  pickupLocationName,
  submitting,
  error,
  onSubmit,
  submitLabel,
}: PickupPointFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [contacts, setContacts] = useState<string[]>(
    initial?.contact_numbers?.length ? initial.contact_numbers : [""],
  );
  const [lat, setLat] = useState<number | null>(
    initial?.latitude != null ? Number(initial.latitude) : null,
  );
  const [lng, setLng] = useState<number | null>(
    initial?.longitude != null ? Number(initial.longitude) : null,
  );
  const [mapsLink, setMapsLink] = useState(initial?.google_maps_link ?? "");

  function updateContact(i: number, v: string) {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? v : c)));
  }
  function addContact() {
    if (contacts.length < 3) setContacts((prev) => [...prev, ""]);
  }
  function removeContact(i: number) {
    if (contacts.length > 1)
      setContacts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    onSubmit({
      pickup_location: pickupLocationId,
      label: label.trim(),
      address: address.trim(),
      contact_numbers: contacts.map((c) => c.trim()).filter(Boolean),
      latitude: lat,
      longitude: lng,
      google_maps_link: mapsLink.trim(),
    });
  }

  const canSubmit =
    address.trim().length > 0 && contacts.some((c) => c.trim().length > 0);

  return (
    <div className="space-y-4">
      {pickupLocationName && (
        <p className="text-xs text-font-dim">
          Area:{" "}
          <span className="font-semibold text-font-main-sub">
            {pickupLocationName}
          </span>
        </p>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Main Shop"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Exact address
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Contact numbers (1–3)
        </label>
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="tel"
                value={c}
                onChange={(e) => updateContact(i, e.target.value)}
                placeholder="10-digit number"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
              {contacts.length > 1 && (
                <button
                  onClick={() => removeContact(i)}
                  className="text-red-500 text-sm font-bold px-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {contacts.length < 3 && (
          <button
            onClick={addContact}
            className="text-sm font-semibold text-brand-yellow-lg mt-2"
          >
            + Add another number
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Exact location on map
        </label>
        {/* <GoogleMapPicker
          latitude={lat}
          longitude={lng}
          onChange={(la, lo) => {
            setLat(Math.round(la * 1e6) / 1e6);
            setLng(Math.round(lo * 1e6) / 1e6);
          }}
        /> */}
        <GoogleMapPicker
          latitude={lat}
          longitude={lng}
          onChange={(la, lo) => {
            const roundedLat = Math.round(la * 1e6) / 1e6;
            const roundedLng = Math.round(lo * 1e6) / 1e6;
            setLat(roundedLat);
            setLng(roundedLng);
            // Auto-fill the link field from the pin the moment it's set, so
            // it doesn't sit visibly empty — vendor can still overwrite this
            // with a real pasted share-link afterward if they have one; this
            // only fills it in when it's currently blank, never overwrites a
            // link they've already typed/pasted.
            if (!mapsLink.trim()) {
              setMapsLink(
                `https://www.google.com/maps?q=${roundedLat},${roundedLng}`,
              );
            }
          }}
        />
        {lat != null && lng != null && (
          <p className="text-xs text-font-dim mt-1">
            Pin set: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Google Maps link (optional)
        </label>
        <input
          type="url"
          value={mapsLink}
          onChange={(e) => setMapsLink(e.target.value)}
          placeholder="https://maps.google.com/..."
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !canSubmit}
        className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
