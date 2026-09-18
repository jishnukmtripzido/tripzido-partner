"use client";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";

// One shared cache for the whole app: navigating between pages that
// need the same data (dashboard stats, bookings list, etc.) reuses
// what's already in the cache instead of refetching from scratch, and
// concurrent requests for the same key are deduped automatically.
// staleTime is deliberately non-zero — this backend has no realtime
// data other than notification count/balance, which set their own
// shorter staleTime/refetchInterval per query.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

// A browser-side singleton, never re-created across re-renders of
// this provider (which would happen once per navigation without it,
// wiping the cache every time). Guarded by isServer so SSR/build
// (`output: "export"`) still gets a fresh client per request instead
// of leaking one across requests.
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
