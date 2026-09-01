// "use client";

// import { Suspense, useMemo, useState } from "react";
// import { Header } from "@/components/layout/Header";
// import { useSidebar } from "@/context/SidebarContext";
// import { useAuth } from "@/context/AuthContext";
// import { getVendorDashboardApi } from "@/services/dashboard.service";
// import type { VendorDashboardData } from "@/types/dashboard.types";
// import { DashboardContent } from "@/components/features/dashboard/DashboardContent";
// import { DashboardSkeleton } from "@/components/features/dashboard/DashboardSkeleton";
// import { DashboardErrorBoundary } from "@/components/features/dashboard/DashboardErrorBoundary";

// async function fetchVendorDashboard(
//   token: string,
// ): Promise<VendorDashboardData> {
//   const res = await getVendorDashboardApi(token);
//   if (!res.success || !res.data) {
//     throw new Error(res.message || "Failed to load dashboard");
//   }
//   return res.data;
// }

// export default function DashboardPage() {
//   const { openSidebar } = useSidebar();
//   const { token } = useAuth();
//   const [attempt, setAttempt] = useState(0);

//   const dashboardPromise = useMemo(() => {
//     if (!token) return null;
//     return fetchVendorDashboard(token);
//   }, [token, attempt]);

//   return (
//     <>
//       <Header
//         title="Dashboard"
//         onMenuClick={openSidebar}
//         rightSlot={
//           <button className="relative p-2 bg-gray-50 rounded-full border border-gray-100 text-gray-600">
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
//               />
//             </svg>
//             <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
//           </button>
//         }
//       />

//       {!dashboardPromise ? (
//         <DashboardSkeleton />
//       ) : (
//         <DashboardErrorBoundary
//           resetKey={attempt}
//           fallback={({ error, retry }) => (
//             <main className="flex-1 px-5 pt-10">
//               <p className="text-sm text-red-500 text-center">
//                 {error.message}
//               </p>
//               <button
//                 onClick={() => {
//                   retry();
//                   setAttempt((a) => a + 1);
//                 }}
//                 className="mt-4 mx-auto block text-xs font-semibold text-brand-yellow-lg"
//               >
//                 Try again
//               </button>
//             </main>
//           )}
//         >
//           <Suspense fallback={<DashboardSkeleton />}>
//             <DashboardContent promise={dashboardPromise} />
//           </Suspense>
//         </DashboardErrorBoundary>
//       )}
//     </>
//   );
// }

"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { DashboardContent } from "@/components/features/dashboard/DashboardContent";
import { DashboardSkeleton } from "@/components/features/dashboard/DashboardSkeleton";
import {
  getVendorDashboardStatusApi,
  getVendorDashboardAttentionApi,
  getVendorDashboardStatsApi,
  getVendorDashboardFleetApi,
  getVendorDashboardRecentBookingsApi,
} from "@/services/dashboard.service";
import type {
  VendorDashboardStatus,
  VendorDashboardAttention,
  VendorDashboardStats,
  VendorDashboardFleet,
  VendorDashboardRecentBookings,
} from "@/types/dashboard.types";

// Unwraps the {success, message, data} envelope into a plain resolved/
// rejected promise — use() needs a promise that resolves straight to
// the data itself (or throws), not the envelope, so each section
// component can destructure typed fields without re-checking
// `.success` five separate times.
function unwrap<T>(
  promise: Promise<{ success: boolean; message: string; data?: T }>,
): Promise<T> {
  return promise.then((res) => {
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to load dashboard data");
    }
    return res.data;
  });
}

export default function DashboardPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();

  // Created once per token change (useMemo, not on every render) —
  // use() requires a stable promise identity across re-renders, or
  // React treats each new promise as a brand-new suspend/refetch.
  // All five requests fire in parallel here, not chained — each
  // section's Suspense boundary resolves the moment its OWN request
  // finishes, independent of the other four.
  const promises = useMemo(() => {
    if (!token) return null;
    return {
      status: unwrap<VendorDashboardStatus>(getVendorDashboardStatusApi(token)),
      attention: unwrap<VendorDashboardAttention>(
        getVendorDashboardAttentionApi(token),
      ),
      stats: unwrap<VendorDashboardStats>(getVendorDashboardStatsApi(token)),
      fleet: unwrap<VendorDashboardFleet>(getVendorDashboardFleetApi(token)),
      recentBookings: unwrap<VendorDashboardRecentBookings>(
        getVendorDashboardRecentBookingsApi(token),
      ),
    };
  }, [token]);

  return (
    <>
      <Header
        title="Dashboard"
        onMenuClick={openSidebar}
        rightSlot={
          <button className="relative p-2 bg-gray-50 rounded-full border border-gray-100 text-gray-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>
        }
      />
      {promises ? (
        <DashboardContent
          statusPromise={promises.status}
          attentionPromise={promises.attention}
          statsPromise={promises.stats}
          fleetPromise={promises.fleet}
          recentBookingsPromise={promises.recentBookings}
        />
      ) : (
        <DashboardSkeleton />
      )}
    </>
  );
}
