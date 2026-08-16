// "use client";

// import { useEffect } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
// import { MobileShell } from "@/components/layout/MobileShell";
// import { Sidebar } from "@/components/layout/Sidebar";
// import { BottomNav } from "@/components/layout/BottomNav";
// import { PageLoader } from "@/components/ui/PageLoader";
// import { SKIP_AUTH } from "@/lib/devFlags";

// const HIDE_BOTTOM_NAV_PREFIXES = [
//   "/fleet/listing",
//   "/fleet/schedule-templates",
//   "/fleet/pickup-points", // NEW
//   "/bookings/detail",
//   "/settings/terms",
//   "/settings/schedule-templates/edit",
//   "/settings/pickup-points/edit", // NEW
// ];

// function DashboardChrome({ children }: { children: React.ReactNode }) {
//   const { open, closeSidebar } = useSidebar();
//   const pathname = usePathname();
//   const showBottomNav = !HIDE_BOTTOM_NAV_PREFIXES.some((prefix) =>
//     pathname.startsWith(prefix),
//   );

//   return (
//     <MobileShell>
//       <Sidebar open={open} onClose={closeSidebar} />
//       <div
//         className={` flex-1 flex flex-col min-h-0 ${showBottomNav ? "pb-20" : ""}`}
//       >
//         {children}
//       </div>
//       {showBottomNav && <BottomNav />}
//     </MobileShell>
//   );
// }

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!SKIP_AUTH && !isAuthenticated) {
//       router.replace("/login");
//     }
//   }, [isAuthenticated, router]);

//   if (!SKIP_AUTH && !isAuthenticated) return <PageLoader fullScreen />;

//   return (
//     <SidebarProvider>
//       <DashboardChrome>{children}</DashboardChrome>
//     </SidebarProvider>
//   );
// }

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { MobileShell } from "@/components/layout/MobileShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLoader } from "@/components/ui/PageLoader";
import { SKIP_AUTH } from "@/lib/devFlags";

const HIDE_BOTTOM_NAV_PREFIXES = [
  "/fleet/listing",
  "/fleet/schedule-templates",
  "/bookings/detail",
  "/settings/terms",
  "/settings/schedule-templates/edit",
];

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { open, closeSidebar } = useSidebar();
  const pathname = usePathname();
  const showBottomNav = !HIDE_BOTTOM_NAV_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  return (
    <div className="flex w-full">
      <DesktopSidebar />
      <MobileShell>
        <Sidebar open={open} onClose={closeSidebar} />
        <div
          className={`flex-1 flex flex-col min-h-0 ${showBottomNav ? "pb-20 lg:pb-0" : ""}`}
        >
          {children}
        </div>
        {showBottomNav && (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}
      </MobileShell>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!SKIP_AUTH && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!SKIP_AUTH && !isAuthenticated) return <PageLoader fullScreen />;

  return (
    <SidebarProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </SidebarProvider>
  );
}
