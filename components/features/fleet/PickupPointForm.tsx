"use client";

import { useState } from "react";
import { GoogleMapPicker } from "@/components/ui/GoogleMapPicker";
import type {
  PickupPoint,
  PickupPointPayload,
} from "@/types/listing-create.types";

// ── Icons — reusing the same vocabulary established across the rest of
// this portal, plus new icons for contact numbers, locating the user,
// expanding the map, and closing the full-screen view. ─────────────────

const TAG_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8A1 1 0 012 10.586V5a2 2 0 012-2z"
  />
);
const PIN_ICON = (
  <>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </>
);
const PHONE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
  />
);
const LINK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
  />
);
// Crosshair / "locate me" icon.
const CROSSHAIR_ICON = (
  <>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v3m0 12v3m9-9h-3M6 12H3"
    />
    <circle cx="12" cy="12" r="6" strokeWidth={2} />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </>
);
// Four-corner "expand to full screen" icon.
const EXPAND_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M4 9V4m0 0h5M4 4l6 6m10-1V4m0 0h-5m5 0l-6 6M4 15v5m0 0h5m-5 0l6-6m10 1v5m0 0h-5m5 0l-6-6"
  />
);
const CLOSE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M6 18L18 6M6 6l12 12"
  />
);

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

  // Full-screen map overlay toggle.
  const [mapFullscreen, setMapFullscreen] = useState(false);

  // "Use my current location" state — shared by the inline map card and
  // the full-screen overlay, since both call the same handler.
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  // Shared by: dragging/tapping the pin on the map (inline or
  // full-screen) and the "use my current location" button, so the
  // rounding + maps-link auto-fill logic lives in exactly one place.
  function applyLocation(la: number, lo: number) {
    const roundedLat = Math.round(la * 1e6) / 1e6;
    const roundedLng = Math.round(lo * 1e6) / 1e6;
    setLat(roundedLat);
    setLng(roundedLng);
    // Auto-fill the link field from the pin the moment it's set, so it
    // doesn't sit visibly empty — vendor can still overwrite this with a
    // real pasted share-link afterward if they have one; this only fills
    // it in when it's currently blank, never overwrites a link they've
    // already typed/pasted.
    if (!mapsLink.trim()) {
      setMapsLink(`https://www.google.com/maps?q=${roundedLat},${roundedLng}`);
    }
  }

  function useCurrentLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support automatic location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocation(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Enable it in your browser settings, or drop the pin manually."
            : "Couldn't get your current location. Try dropping the pin manually.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
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

  // Small reusable button so the inline card and the full-screen footer
  // don't drift out of sync with each other's copy/styling.
  function LocateMeButton({ variant }: { variant: "inline" | "fullscreen" }) {
    return (
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
          variant === "inline"
            ? "border-2 border-dashed border-gray-200 text-font-dim hover:border-brand-yellow hover:text-brand-secondary"
            : "border-2 border-gray-200 text-font-dim hover:border-brand-yellow hover:text-brand-secondary"
        }`}
      >
        <svg
          className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {CROSSHAIR_ICON}
        </svg>
        {locating ? "Finding your location..." : "Use my current location"}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {pickupLocationName && (
        <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {PIN_ICON}
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Area
            </p>
            <p className="text-sm font-semibold text-font-main-sub">
              {pickupLocationName}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow-lg flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {TAG_ICON}
            </svg>
          </div>
          <h2 className="font-heading font-bold text-sm text-font-main-sub">
            Point details
          </h2>
        </div>

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
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow-lg flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {PHONE_ICON}
            </svg>
          </div>
          <h2 className="font-heading font-bold text-sm text-font-main-sub">
            Contact numbers
          </h2>
        </div>
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-yellow/15 text-brand-yellow-lg flex items-center justify-center text-[11px] font-bold shrink-0">
                {i + 1}
              </div>
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
                  aria-label="Remove number"
                  className="w-8 h-8 shrink-0 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-lg font-bold flex items-center justify-center"
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
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-font-dim hover:border-brand-yellow hover:text-brand-secondary transition-colors mt-3"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add another number
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow-lg flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {PIN_ICON}
              </svg>
            </div>
            <h2 className="font-heading font-bold text-sm text-font-main-sub">
              Map location
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setMapFullscreen(true)}
            aria-label="Expand map to full screen"
            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-brand-secondary transition-colors flex items-center justify-center shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {EXPAND_ICON}
            </svg>
          </button>
        </div>

        <LocateMeButton variant="inline" />

        <div>
          <GoogleMapPicker
            latitude={lat}
            longitude={lng}
            onChange={applyLocation}
          />
          {lat != null && lng != null && (
            <p className="text-xs text-font-dim mt-1.5">
              Pin set: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          )}
          {locationError && (
            <p className="text-xs text-red-500 mt-1.5">{locationError}</p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {LINK_ICON}
              </svg>
            </div>
            <label className="text-xs font-semibold text-gray-600">
              Google Maps link (optional)
            </label>
          </div>
          <input
            type="url"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !canSubmit}
        className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>

      {/* Full-screen map overlay. Controlled/uncontrolled state (lat, lng,
          mapsLink) is shared with the inline card above via applyLocation,
          so closing this just returns to the form with the pin already
          applied — no separate "confirm" step is strictly needed, but we
          keep a "Use this location" button for a clear, deliberate exit. */}
      {mapFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <h2 className="font-heading font-bold text-sm text-font-main-sub">
              Set pickup location
            </h2>
            <button
              type="button"
              onClick={() => setMapFullscreen(false)}
              aria-label="Close full-screen map"
              className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {CLOSE_ICON}
              </svg>
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <GoogleMapPicker
              latitude={lat}
              longitude={lng}
              onChange={applyLocation}
              fullHeight
            />
          </div>

          <div className="shrink-0 border-t border-gray-100 p-4 space-y-2 bg-white">
            <LocateMeButton variant="fullscreen" />
            {locationError && (
              <p className="text-xs text-red-500 text-center">
                {locationError}
              </p>
            )}
            {lat != null && lng != null && (
              <p className="text-xs text-font-dim text-center">
                Pin set: {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            )}
            <button
              type="button"
              onClick={() => setMapFullscreen(false)}
              disabled={lat == null || lng == null}
              className="w-full font-bold rounded-xl py-3.5 text-center bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
            >
              Use this location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
