// app/(dashboard)/profile/vendor-details/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { getVendorProfileApi } from "@/services/vendor.service";
import { queryKeys } from "@/lib/queryKeys";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  BANNED: "bg-gray-800 text-white",
};

export default function VendorDetailsPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();

  const {
    data: vendor,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.profile.vendorDetails(token),
    queryFn: async () => {
      const res = await getVendorProfileApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load vendor details");
      }
      return res.data;
    },
    enabled: !!token,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load"
    : null;

  return (
    <>
      <Header title="Vendor Details" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <button
          onClick={() => router.push("/profile")}
          className="text-sm font-semibold text-font-dim mb-4"
        >
          ← Back to profile
        </button>

        {loading ? (
          <p className="text-sm text-font-dim text-center py-10">Loading...</p>
        ) : error || !vendor ? (
          <p className="text-sm text-red-500 text-center py-10">
            {error || "Vendor details not found"}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg">
                    {vendor.business_name}
                  </h2>
                  <p className="text-sm text-font-dim mt-0.5">
                    {vendor.owner_name}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    STATUS_STYLES[vendor.status] ?? "bg-gray-100"
                  }`}
                >
                  {vendor.status_label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <Field label="Phone" value={vendor.phone_number} />
                <Field label="Email" value={vendor.email || "—"} />
                <Field label="GST" value={vendor.gst_number || "—"} />
                <Field
                  label="Joined"
                  value={new Date(vendor.created_at).toLocaleDateString()}
                />
              </div>
              <div className="mt-3">
                <p className="text-xs text-font-dim">Address</p>
                <p className="text-sm font-medium">{vendor.address}</p>
              </div>

              {vendor.status === "REJECTED" && vendor.rejection_reason && (
                <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg p-3">
                  Rejected: {vendor.rejection_reason}
                </p>
              )}
              {vendor.status === "SUSPENDED" && vendor.suspension_reason && (
                <p className="text-sm text-orange-600 mt-3 bg-orange-50 rounded-lg p-3">
                  Suspended: {vendor.suspension_reason}
                </p>
              )}
              {vendor.status === "BANNED" && vendor.ban_reason && (
                <p className="text-sm text-gray-700 mt-3 bg-gray-100 rounded-lg p-3">
                  Banned: {vendor.ban_reason}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-sm mb-3">
                Subscription
              </h3>
              {vendor.current_subscription ? (
                <div className="bg-brand-yellow/10 rounded-xl p-3">
                  <p className="text-sm font-semibold">
                    {vendor.current_subscription.plan_name}
                  </p>
                  <p className="text-xs text-font-dim mt-0.5">
                    {vendor.current_subscription.status}
                    {vendor.current_subscription.expires_at &&
                      ` • expires ${new Date(
                        vendor.current_subscription.expires_at,
                      ).toLocaleDateString()}`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-font-dim">No active subscription.</p>
              )}
            </div>

            <p className="text-xs text-font-dim text-center px-4">
              To update these details, contact support — business details are
              managed by the platform team.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-font-dim">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
