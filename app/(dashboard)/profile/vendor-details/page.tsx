"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { getVendorProfileApi } from "@/services/vendor.service";
import { queryKeys } from "@/lib/queryKeys";
import { VENDOR_STATUS_STYLES } from "@/lib/vendorStatus";
import { PageLoader } from "@/components/ui/PageLoader";

const STOREFRONT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
  />
);
const PHONE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.2l-1.9.95a11 11 0 005.2 5.2l.95-1.9a1 1 0 011.2-.5l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.27 21 3 14.73 3 7V5z"
  />
);
const MAIL_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
  />
);
const PIN_ICON = (
  <>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </>
);
const RECEIPT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
  />
);
const CALENDAR_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  />
);
const STAR_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
  />
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "ACTIVE" → "Active", "PAST_DUE" → "Past Due".
function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "V"
  );
}

export default function VendorDetailsPage() {
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

  // Whichever reason applies to the vendor's current status, if any.
  const statusReason = vendor
    ? vendor.status === "REJECTED"
      ? { title: "Rejection reason", text: vendor.rejection_reason, tone: "bg-red-50 text-red-700" }
      : vendor.status === "SUSPENDED"
        ? { title: "Suspension reason", text: vendor.suspension_reason, tone: "bg-orange-50 text-orange-700" }
        : vendor.status === "BANNED"
          ? { title: "Ban reason", text: vendor.ban_reason, tone: "bg-gray-100 text-gray-800" }
          : null
    : null;

  return (
    <>
      <Header title="Vendor Details" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-page-narrow lg:pt-7">
        {loading ? (
          <PageLoader />
        ) : error || !vendor ? (
          <p className="mt-6 rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-red-600 shadow-sm">
            {error || "Vendor details not found"}
          </p>
        ) : (
          <div className="space-y-5">
            {/* Business card */}
            <section className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-secondary font-heading text-xl font-bold text-brand-yellow">
                  {vendor.logo_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={vendor.logo_image}
                      alt=""
                      className="h-full w-full bg-white object-contain p-1"
                    />
                  ) : (
                    getInitials(vendor.business_name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-heading text-lg font-bold text-font-main-sub">
                    {vendor.business_name}
                  </h2>
                  <p className="truncate text-sm text-font-dim">
                    {vendor.owner_name}
                  </p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      VENDOR_STATUS_STYLES[vendor.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {vendor.status_label}
                  </span>
                </div>
              </div>

              {statusReason?.text && (
                <div className={`mt-3 rounded-xl p-3 ${statusReason.tone}`}>
                  <p className="text-xs font-bold uppercase tracking-wide">
                    {statusReason.title}
                  </p>
                  <p className="mt-0.5 text-sm">{statusReason.text}</p>
                </div>
              )}
            </section>

            {/* Contact */}
            <Section title="Contact">
              <IconRow
                icon={PHONE_ICON}
                label="Phone"
                value={vendor.phone_number}
              />
              <IconRow
                icon={MAIL_ICON}
                label="Email"
                value={vendor.email || "Not added"}
                muted={!vendor.email}
              />
              <IconRow
                icon={PIN_ICON}
                label="Address"
                value={vendor.address || "Not added"}
                muted={!vendor.address}
              />
            </Section>

            {/* Business */}
            <Section title="Business">
              <IconRow
                icon={RECEIPT_ICON}
                label="GST number"
                value={vendor.gst_number || "Not added"}
                muted={!vendor.gst_number}
              />
              <IconRow
                icon={CALENDAR_ICON}
                label="Partner since"
                value={formatDate(vendor.created_at)}
              />
            </Section>

            {/* Subscription */}
            <Section title="Subscription">
              {vendor.current_subscription ? (
                <div className="flex items-center gap-3 rounded-xl bg-brand-yellow/25 p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {STAR_ICON}
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-font-main-sub">
                      {vendor.current_subscription.plan_name}
                    </p>
                    <p className="text-xs text-font-dim">
                      {vendor.current_subscription.expires_at
                        ? `Valid until ${formatDate(vendor.current_subscription.expires_at)}`
                        : "No expiry date"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-secondary">
                    {toTitleCase(vendor.current_subscription.status)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-1 py-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {STAR_ICON}
                    </svg>
                  </span>
                  <p className="text-sm text-font-dim">No active subscription.</p>
                </div>
              )}
            </Section>

            <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {STOREFRONT_ICON}
                </svg>
              </span>
              <p className="text-xs leading-relaxed text-font-dim">
                Need to change these details? Contact support — business
                details are managed by the platform team.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/** Sidebar-style section: small uppercase title above a white card. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
        {title}
      </h3>
      <div className="rounded-2xl bg-white p-3 shadow-sm">{children}</div>
    </section>
  );
}

function IconRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="mt-2 flex items-center gap-3 px-1 py-1.5 first:mt-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-font-dim">{label}</span>
        <span
          className={`block break-words text-sm font-semibold ${
            muted ? "text-font-dim/70" : "text-font-main-sub"
          }`}
        >
          {value}
        </span>
      </span>
    </div>
  );
}
