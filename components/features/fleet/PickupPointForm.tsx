"use client";

import { useEffect, useState } from "react";
import { GoogleMapPicker } from "@/components/ui/GoogleMapPicker";
import {
  checkLocationAccess,
  getCurrentLocation,
  requestLocationAccess,
  LocationError,
  type LocationAccess,
} from "@/lib/location";
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

  // Location permission state. Asked for as soon as the form opens, so
  // "Use my current location" is ready by the time the vendor needs it.
  const [access, setAccess] = useState<LocationAccess | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestLocationAccess().then((result) => {
      if (!cancelled) setAccess(result);
    });

    // The vendor may leave to the browser's site settings to allow
    // location — re-check when the tab becomes visible again so the
    // banner clears without reopening the form.
    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      checkLocationAccess().then((result) => {
        if (!cancelled) setAccess(result);
      });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  async function askForLocation() {
    setLocationError(null);
    setAccess(await requestLocationAccess());
  }

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

  // Asks for permission again if it isn't granted (see getCurrentLocation),
  // then drops the pin at the device's position.
  async function useCurrentLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      const { latitude, longitude } = await getCurrentLocation();
      applyLocation(latitude, longitude);
      setAccess("granted");
    } catch (err) {
      if (err instanceof LocationError) {
        setLocationError(err.message);
        if (err.reason !== "timeout" && err.reason !== "unavailable") {
          setAccess(err.reason);
        }
      } else {
        setLocationError(
          "Couldn't get your current location. Try again, or drop the pin manually.",
        );
      }
    } finally {
      setLocating(false);
    }
  }

  // Banner shown above the map while location can't be used. On the
  // web, "prompt" is normal (the browser asks on first use), so no banner.
  const accessBanner =
    access === "blocked"
      ? {
          title: "Location permission is blocked",
          text: "Click the lock icon in your browser's address bar, allow Location, then check again.",
          action: "Check again",
        }
      : access === "services-off"
        ? {
            title: "Your device's location is off",
            text: "Turn on Location in your system settings to use your current location.",
            action: "Check again",
          }
        : null;

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
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
          variant === "inline"
            ? "bg-brand-bg text-font-main-sub active:bg-gray-100"
            : "bg-gray-100 text-font-main-sub active:bg-gray-200"
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
    <div className="space-y-5">
      {pickupLocationName && (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {PIN_ICON}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
              Area
            </p>
            <p className="truncate text-sm font-semibold text-font-main-sub">
              {pickupLocationName}
            </p>
          </div>
        </div>
      )}

      {/* Point details */}
      <FormSection title="Point details" icon={TAG_ICON}>
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="pp-label">Label (optional)</FieldLabel>
            <input
              id="pp-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main Shop"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <FieldLabel htmlFor="pp-address">Exact address</FieldLabel>
            <textarea
              id="pp-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Building, street and landmark customers can find"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>
        </div>
      </FormSection>

      {/* Contact numbers */}
      <FormSection
        title={`Contact numbers · ${contacts.length} of 3`}
        icon={PHONE_ICON}
      >
        <div className="space-y-2.5">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-[11px] font-bold text-brand-yellow">
                {i + 1}
              </span>
              <input
                type="tel"
                inputMode="tel"
                value={c}
                onChange={(e) => updateContact(i, e.target.value)}
                placeholder="10-digit number"
                aria-label={`Contact number ${i + 1}`}
                className={`${INPUT_CLASS} flex-1`}
              />
              {contacts.length > 1 && (
                <button
                  onClick={() => removeContact(i)}
                  aria-label={`Remove number ${i + 1}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 active:bg-red-100 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {CLOSE_ICON}
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {contacts.length < 3 && (
          <button
            onClick={addContact}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-3 text-sm font-semibold text-font-main-sub active:bg-gray-50 transition-colors"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add another number
          </button>
        )}
      </FormSection>

      {/* Map location */}
      <FormSection title="Map location" icon={PIN_ICON}>
        <div className="space-y-3">
          {accessBanner && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {CROSSHAIR_ICON}
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-font-main-sub">
                  {accessBanner.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-font-dim">
                  {accessBanner.text}
                </p>
                <button
                  type="button"
                  onClick={askForLocation}
                  className="mt-2 rounded-lg bg-brand-secondary px-3 py-1.5 text-xs font-semibold text-brand-yellow active:opacity-80 transition-opacity"
                >
                  {accessBanner.action}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMapFullscreen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-2.5 text-sm font-semibold text-font-main-sub active:bg-gray-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {EXPAND_ICON}
              </svg>
              Open full-screen map
            </button>
            <LocateMeButton variant="inline" />
          </div>

          <div className="relative">
            <GoogleMapPicker
              latitude={lat}
              longitude={lng}
              onChange={applyLocation}
            />
            {/* Second, on-map way into full screen — a corner button
                over the map itself, where people look for it. */}
            <button
              type="button"
              onClick={() => setMapFullscreen(true)}
              aria-label="Open full-screen map"
              className="absolute right-2.5 top-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-font-main-sub shadow-md active:bg-gray-100 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {EXPAND_ICON}
              </svg>
            </button>
          </div>
          {lat != null && lng != null && (
            <p className="flex items-center gap-1.5 px-1 text-xs text-green-700">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Pin set: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          )}
          {locationError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              {locationError}
            </p>
          )}

          <div>
            <FieldLabel htmlFor="pp-link" icon={LINK_ICON}>
              Google Maps link (optional)
            </FieldLabel>
            <input
              id="pp-link"
              type="url"
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </FormSection>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          className="w-full rounded-xl bg-brand-secondary py-3.5 text-center text-sm font-semibold text-brand-yellow shadow-sm active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        {!canSubmit && (
          <p className="mt-2 px-1 text-center text-xs text-font-dim">
            Add the exact address and at least one contact number to save.
          </p>
        )}
      </div>

      {/* Full-screen map overlay. Controlled/uncontrolled state (lat, lng,
          mapsLink) is shared with the inline card above via applyLocation,
          so closing this just returns to the form with the pin already
          applied — no separate "confirm" step is strictly needed, but we
          keep a "Use this location" button for a clear, deliberate exit. */}
      {mapFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-brand-bg">
          <div className="flex shrink-0 items-center justify-between bg-white px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] shadow-sm">
            <div>
              <h2 className="font-heading text-lg font-bold text-font-main-sub">
                Set pickup location
              </h2>
              <p className="text-xs text-font-dim">
                <span className="lg:hidden">Tap</span>
                <span className="hidden lg:inline">Click</span> the map or drag
                the pin
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapFullscreen(false)}
              aria-label="Close full-screen map"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-font-main-sub active:bg-gray-200 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {CLOSE_ICON}
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1">
            <GoogleMapPicker
              latitude={lat}
              longitude={lng}
              onChange={applyLocation}
              fullHeight
            />
          </div>

          <div className="shrink-0 space-y-2.5 rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <LocateMeButton variant="fullscreen" />
            {locationError && (
              <p className="text-center text-xs text-red-600">
                {locationError}
              </p>
            )}
            {lat != null && lng != null && (
              <p className="text-center text-xs text-font-dim">
                Pin set: {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            )}
            <button
              type="button"
              onClick={() => setMapFullscreen(false)}
              disabled={lat == null || lng == null}
              className="w-full rounded-xl bg-brand-secondary py-3.5 text-center text-sm font-semibold text-brand-yellow active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400"
            >
              Use this location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const INPUT_CLASS =
  "w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-medium text-font-main-sub placeholder:text-font-dim/60 focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors";

/** Sidebar-style section: small uppercase title above a white card. */
function FormSection({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {icon}
          </svg>
          {title}
        </h2>
        {action}
      </div>
      <div className="rounded-2xl bg-white p-3 shadow-sm">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  icon,
  children,
}: {
  htmlFor: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-font-dim/70"
    >
      {icon && (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {icon}
        </svg>
      )}
      {children}
    </label>
  );
}
