// Central query-key factory. Keeping every feature's keys in one place
// (rather than inlined per hook) is what lets a mutation in one file
// invalidate a query defined in another without guessing string shapes.
export const queryKeys = {
  dashboard: {
    status: (token: string | null) => ["dashboard", "status", token] as const,
    attention: (token: string | null) =>
      ["dashboard", "attention", token] as const,
    stats: (token: string | null) => ["dashboard", "stats", token] as const,
    fleet: (token: string | null) => ["dashboard", "fleet", token] as const,
    recentBookings: (token: string | null) =>
      ["dashboard", "recentBookings", token] as const,
  },
  notifications: {
    unreadCount: (token: string | null) =>
      ["notifications", "unreadCount", token] as const,
    list: (token: string | null, page: number) =>
      ["notifications", "list", token, page] as const,
  },
  bookings: {
    // No `page` here deliberately — useInfiniteQuery manages pages
    // itself via pageParam under this one key, so the key only needs
    // to change when the filters (tab/search) change.
    list: (token: string | null, params: { status: string; search: string }) =>
      ["bookings", "list", token, params] as const,
    detail: (token: string | null, id: string | null) =>
      ["bookings", "detail", token, id] as const,
  },
  fleet: {
    list: (token: string | null, params: { tab: string }) =>
      ["fleet", "list", token, params] as const,
    listing: (token: string | null, id: string | null) =>
      ["fleet", "listing", token, id] as const,
    // Vendor-wide list — same reasoning as bookings.list re: no `page`.
    blocks: (token: string | null) => ["fleet", "blocks", token] as const,
    pickupPoints: (token: string | null) =>
      ["fleet", "pickupPoints", token] as const,
    scheduleTemplates: (token: string | null) =>
      ["fleet", "scheduleTemplates", token] as const,
    packageTypes: (token: string | null) =>
      ["fleet", "packageTypes", token] as const,
    // Unpaginated (page_size=100) vendor-wide listing, used by the
    // "select a listing" dropdown in the Add Block modal — a different
    // shape/cache entry than fleet.list, which is infinite-query paged
    // and tab-filtered.
    options: (token: string | null) => ["fleet", "options", token] as const,
  },
  ledger: {
    // No `page` — same reasoning as bookings.list above.
    list: (token: string | null) => ["ledger", "list", token] as const,
    detail: (token: string | null, id: string | null) =>
      ["ledger", "detail", token, id] as const,
  },
  settings: {
    bankAccounts: (token: string | null) =>
      ["settings", "bankAccounts", token] as const,
    kycDocuments: (token: string | null) =>
      ["settings", "kycDocuments", token] as const,
    pickupPoints: (token: string | null) =>
      ["settings", "pickupPoints", token] as const,
    pickupPointDetail: (token: string | null, id: string | null) =>
      ["settings", "pickupPointDetail", token, id] as const,
    scheduleTemplates: (token: string | null) =>
      ["settings", "scheduleTemplates", token] as const,
    scheduleTemplateDetail: (token: string | null, id: string | null) =>
      ["settings", "scheduleTemplateDetail", token, id] as const,
    terms: () => ["settings", "terms"] as const,
  },
  profile: {
    me: (token: string | null) => ["profile", "me", token] as const,
    vendorDetails: (token: string | null) =>
      ["profile", "vendorDetails", token] as const,
  },
  reviews: {
    // Public (AllowAny) endpoint — same data regardless of which
    // vendor/token is viewing it, so token is deliberately not part of
    // this key.
    listing: (id: string | null) => ["reviews", "listing", id] as const,
  },
} as const;
