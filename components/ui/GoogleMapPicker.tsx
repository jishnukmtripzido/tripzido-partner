"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  // When true, the map fills its parent's height instead of the fixed
  // h-56 used inline in the wizard. Pass this from a bounded flex
  // container (e.g. the full-screen map overlay) — the map div switches
  // from a fixed height to flex-1 so it actually stretches to fill it.
  fullHeight?: boolean;
}

// Last-resort fallback center — only used if the browser can't or won't
// provide the vendor's real location (geolocation unsupported, denied,
// or timed out). Arbitrary, just needs to put the map somewhere sensible.
const DEFAULT_CENTER = { lat: 11.6854, lng: 76.132 };

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleMapPicker({
  latitude,
  longitude,
  onChange,
  fullHeight = false,
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  // Lazy-init check: if a previous page already loaded the Maps script
  // this session, window.google.maps exists immediately on this fresh
  // mount, before any effect even runs — this is what makes the map
  // appear instantly on the second+ pickup-point page visited in one
  // session instead of only after the poll below catches up. Safe from
  // the hydration issue that bit AuthContext earlier: this can only
  // ever be true after an in-session client-side navigation, never
  // during the very first server-compared render, since a hard
  // reload/first load always starts with a clean window with no script
  // loaded yet.
  const [scriptLoaded, setScriptLoaded] = useState(
    () => typeof window !== "undefined" && !!window.google?.maps,
  );

  // Don't rely on next/script's onLoad prop alone. It's meant to fire
  // again for a fresh mount even when the script was already loaded by
  // an earlier page this session (Next dedupes by src), but in
  // practice this doesn't always happen reliably across client-side
  // route changes — which is exactly the "works on hard reload, not on
  // navigating to the page" symptom. Polling for window.google.maps
  // directly is independent of whether onLoad ever fires, so it covers
  // both a script that's already fully loaded and one that's still
  // mid-load from an earlier mount.
  useEffect(() => {
    if (scriptLoaded || typeof window === "undefined") return;
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.maps) {
        setScriptLoaded(true);
        clearInterval(interval);
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(interval), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scriptLoaded]);

  // Initial map + marker creation — runs once per mount, once the Maps
  // script is ready. If a pin was already passed in (editing an existing
  // pickup point, or a parent that's already resolved a location), we
  // build the map centered right there. Otherwise — a fresh "add pickup
  // point" flow — we try the browser's geolocation first, so vendors
  // start centered on where they actually are instead of a hardcoded
  // fallback. On success we also report it through onChange, same as the
  // explicit "use current location" button, so the parent's lat/lng
  // state and the visible marker never disagree. If geolocation is
  // unavailable, denied, or times out, we fall back to DEFAULT_CENTER
  // and leave the parent's state untouched — a guessed viewport is a
  // reasonable starting point, but not something we assert as the
  // chosen address.
  useEffect(() => {
    if (
      !scriptLoaded ||
      !mapRef.current ||
      mapInstanceRef.current ||
      !window.google
    )
      return;

    function buildMap(center: { lat: number; lng: number }, zoom: number) {
      const map = new window.google.maps.Map(mapRef.current!, {
        center,
        zoom,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
      });

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) onChange(pos.lat(), pos.lng());
      });
      map.addListener("click", (e: any) => {
        if (!e.latLng) return;
        marker.setPosition(e.latLng);
        onChange(e.latLng.lat(), e.latLng.lng());
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    // Build the map right away, synchronously — it must never sit blank
    // waiting on geolocation, which can take several seconds, get
    // silently blocked by a Permissions-Policy header with neither
    // callback ever firing, or throw immediately in some embedded/
    // webview contexts. If a pin was already passed in (editing an
    // existing pickup point), center there; otherwise start at
    // DEFAULT_CENTER and recenter below the moment a real location
    // resolves.
    const hasInitialPin = latitude != null && longitude != null;
    buildMap(
      hasInitialPin ? { lat: latitude, lng: longitude } : DEFAULT_CENTER,
      hasInitialPin ? 16 : 12,
    );

    if (!hasInitialPin) {
      try {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              // Routes through onChange -> parent state -> the lat/lng
              // sync effect below, which pans the map that's already on
              // screen rather than rebuilding anything.
              onChange(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              // Denied, unavailable, or timed out — the map is already
              // showing DEFAULT_CENTER. The vendor can still retry via
              // "Use my current location".
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
          );
        }
      } catch {
        // Some embedded contexts throw synchronously instead of
        // invoking the error callback (e.g. geolocation disallowed by a
        // Permissions-Policy header). The map is already built and
        // visible at DEFAULT_CENTER, so there's nothing to recover.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  // Keep the marker and map view in sync whenever lat/lng change from
  // OUTSIDE this particular map instance — e.g. the "use current
  // location" button, or (in the full-screen overlay) a second
  // GoogleMapPicker instance updating the same parent state. Dragging or
  // clicking on THIS map already updates these props via onChange, so
  // re-applying the same position here in that case is a harmless no-op.
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (latitude == null || longitude == null) return;
    const pos = { lat: latitude, lng: longitude };
    markerRef.current.setPosition(pos);
    mapInstanceRef.current.panTo(pos);
  }, [latitude, longitude]);

  return (
    <div className={fullHeight ? "h-full flex flex-col" : undefined}>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div
        ref={mapRef}
        className={
          fullHeight
            ? "w-full flex-1 min-h-0 border border-gray-200 bg-gray-50"
            : "w-full h-56 rounded-xl border border-gray-200 bg-gray-50"
        }
      />
      <p
        className={`text-xs text-font-dim mt-1 ${fullHeight ? "shrink-0 px-1" : ""}`}
      >
        Tap the map or drag the pin to set the exact location.
      </p>
    </div>
  );
}
