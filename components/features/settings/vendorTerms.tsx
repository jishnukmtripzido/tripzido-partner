"use client";

import { useQuery } from "@tanstack/react-query";
import { getVendorTermsApi } from "@/services/settings.service";
import { queryKeys } from "@/lib/queryKeys";
import type { VendorTerms } from "@/types/settings.types";

// Terms content only changes through the edit page and rarely at
// that — a longer staleTime avoids refetching it on every visit.
const TERMS_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Shared by the Terms details page and the edit page, so both read
 * (and the edit page's save updates) the same cache entry.
 * Resolves to null when the vendor hasn't saved any terms yet.
 */
export function useVendorTerms(token: string | null) {
  return useQuery({
    queryKey: queryKeys.settings.terms(),
    queryFn: async () => {
      const res = await getVendorTermsApi(token as string);
      // No terms saved yet is a normal, non-error state (vendor hasn't
      // submitted any) — only a thrown/network error should surface as
      // an error state here. The backend sends `data: []` (not null) in
      // that case, and an empty array is truthy, so check for an actual
      // terms object rather than just a truthy `data`.
      if (res.success && isVendorTerms(res.data)) return res.data;
      return null;
    },
    enabled: !!token,
    staleTime: TERMS_STALE_TIME_MS,
  });
}

function isVendorTerms(data: unknown): data is VendorTerms {
  return (
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data) &&
    Array.isArray((data as VendorTerms).terms_items)
  );
}

type PolicyNoteKey = keyof Pick<
  VendorTerms,
  | "security_deposit_note"
  | "operating_hours_note"
  | "distance_limit_note"
  | "excess_charge_note"
  | "late_penalty_note"
>;

// Same icon mapping as Listing Detail's Policies section, for
// consistency between these pages and the listing display.
export const POLICY_NOTE_FIELDS: {
  key: PolicyNoteKey;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "security_deposit_note",
    label: "Security deposit",
    placeholder: "e.g. Refunded in full when the bike is returned undamaged",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"
      />
    ),
  },
  {
    key: "operating_hours_note",
    label: "Operating hours",
    placeholder: "e.g. Pickups and returns between 8am and 8pm",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    key: "distance_limit_note",
    label: "Distance limit",
    placeholder: "e.g. Each package includes the km limit shown on it",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    ),
  },
  {
    key: "excess_charge_note",
    label: "Excess charge",
    placeholder: "e.g. Extra kilometres are charged per km at return",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    key: "late_penalty_note",
    label: "Late return penalty",
    placeholder: "e.g. Late returns are charged per hour",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
];
