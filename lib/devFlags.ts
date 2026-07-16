// Dev-only escape hatch for previewing every screen without wiring up
// a real backend yet. Set NEXT_PUBLIC_SKIP_AUTH=true in .env.local to
// bypass both the "must be logged in" guard (dashboard routes) and
// the "must be logged out" guard (login screen) at the same time.
//
// Remove this — or just leave it unset — before shipping a real build.
export const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
