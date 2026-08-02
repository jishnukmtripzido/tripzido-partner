"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Fallback center when no pin is set yet — arbitrary, just needs to
// put the map somewhere sensible before the vendor clicks/drags.
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
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (
      !scriptLoaded ||
      !mapRef.current ||
      mapInstanceRef.current ||
      !window.google
    )
      return;

    const center =
      latitude != null && longitude != null
        ? { lat: latitude, lng: longitude }
        : DEFAULT_CENTER;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: latitude != null ? 16 : 12,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  return (
    <div>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div
        ref={mapRef}
        className="w-full h-56 rounded-xl border border-gray-200 bg-gray-50"
      />
      <p className="text-xs text-font-dim mt-1">
        Tap the map or drag the pin to set the exact location.
      </p>
    </div>
  );
}
