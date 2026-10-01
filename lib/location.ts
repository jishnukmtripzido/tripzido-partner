/**
 * Browser counterpart of the mobile app's Capacitor-based location
 * helper — same exports and messages, backed by navigator.geolocation
 * and the Permissions API.
 *
 * - "granted"  — we can read the location.
 * - "prompt"   — not decided yet; the browser asks on first use.
 * - "blocked"  — denied for this site; only the browser's site
 *                settings can re-enable it.
 * - "services-off" — permission is fine but the device can't provide
 *                a position (e.g. OS location turned off).
 */
export type LocationAccess = "granted" | "prompt" | "blocked" | "services-off";

const BLOCKED_MESSAGE =
  "Location access is blocked for this site. Click the lock icon in your browser's address bar, allow Location, then try again.";
const SERVICES_OFF_MESSAGE =
  "Your device's location is turned off. Turn on Location in your system settings, then try again.";

/** Current permission state, without showing any dialog. */
export async function checkLocationAccess(): Promise<LocationAccess> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "services-off";
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "granted") return "granted";
    if (status.state === "denied") return "blocked";
    return "prompt";
  } catch {
    // Browsers without the Permissions API: treat as undecided, the
    // browser will prompt on getCurrentPosition.
    return "prompt";
  }
}

/**
 * Browsers have no "ask now" API — the dialog appears when
 * getCurrentPosition runs — so this only reports the current state.
 */
export async function requestLocationAccess(): Promise<LocationAccess> {
  return checkLocationAccess();
}

export class LocationError extends Error {
  constructor(
    public reason: LocationAccess | "timeout" | "unavailable",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Returns the device's position, letting the browser ask for
 * permission if needed. Throws LocationError with a vendor-friendly
 * message on failure.
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  const access = await checkLocationAccess();
  if (access === "blocked") {
    throw new LocationError("blocked", BLOCKED_MESSAGE);
  }
  if (access === "services-off") {
    throw new LocationError("services-off", SERVICES_OFF_MESSAGE);
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new LocationError("blocked", BLOCKED_MESSAGE));
        } else if (err.code === err.TIMEOUT) {
          reject(
            new LocationError(
              "timeout",
              "Couldn't get a location fix in time. Try again, or drop the pin manually.",
            ),
          );
        } else {
          reject(
            new LocationError(
              "unavailable",
              "Couldn't get your current location. Try again, or drop the pin manually.",
            ),
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
