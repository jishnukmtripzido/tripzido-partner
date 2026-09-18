"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnreadNotificationCountApi } from "@/services/notifications.service";
import { queryKeys } from "@/lib/queryKeys";

const POLL_INTERVAL_MS = 25000;

export function useUnreadNotificationCount(token: string | null) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.notifications.unreadCount(token);

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getUnreadNotificationCountApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load unread count");
      }
      return res.data.count;
    },
    enabled: !!token,
    staleTime: POLL_INTERVAL_MS,
    // refetchIntervalInBackground defaults to false, so this pauses
    // while the tab is hidden and refetches on focus — same behavior
    // the old visibilitychange listener implemented by hand.
    refetchInterval: POLL_INTERVAL_MS,
  });

  return {
    count: data ?? 0,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
