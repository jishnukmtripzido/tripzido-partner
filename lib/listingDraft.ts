// Temporary in-progress form state — sessionStorage, not
// localStorage, since this should NOT survive an app close like login
// tokens do. Keyed so the create wizard and the edit page (for
// whichever listing) never collide with each other's in-progress
// state.
const DEFAULT_DRAFT_KEY = "tripzido_listing_draft";
const RETURN_TO_KEY = "tripzido_schedule_template_return_to";

export function saveDraft(state: unknown, key: string = DEFAULT_DRAFT_KEY) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — not fatal
    // for a single uninterrupted session.
  }
}

export function loadDraft<T>(key: string = DEFAULT_DRAFT_KEY): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string = DEFAULT_DRAFT_KEY) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

// Where the schedule-template creation page sends the vendor back to
// once saved — the create wizard and the edit page both set this
// before navigating away, so schedule-templates/new never needs to
// hardcode a single destination.
export function saveReturnTo(path: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    // ignore
  }
}

export function loadReturnTo(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.sessionStorage.getItem(RETURN_TO_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

export function clearReturnTo() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RETURN_TO_KEY);
}

export function editDraftKey(listingId: string | number): string {
  return `tripzido_listing_edit_draft_${listingId}`;
}
