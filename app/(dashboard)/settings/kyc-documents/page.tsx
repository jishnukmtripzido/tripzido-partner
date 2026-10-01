"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorDocumentsApi,
  uploadVendorDocumentApi,
} from "@/services/vendor.service";
import { queryKeys } from "@/lib/queryKeys";
import { PageLoader } from "@/components/ui/PageLoader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { toAbsoluteMediaUrl } from "@/lib/mediaUrl";
import type {
  VendorDocument,
  VendorDocumentType,
} from "@/types/settings.types";

const DOC_TYPE_OPTIONS: {
  value: VendorDocumentType;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    value: "BUSINESS_REGISTRATION",
    label: "Business registration",
    hint: "Shop licence, incorporation",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    value: "ID_PROOF",
    label: "ID proof",
    hint: "Aadhaar, PAN, passport",
    icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
  },
  {
    value: "GST_CERTIFICATE",
    label: "GST certificate",
    hint: "GST registration",
    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
  },
  {
    value: "OTHER",
    label: "Other",
    hint: "Any other document",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

const DOC_PATH =
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

// KYC document upload constraints, enforced client-side here and
// mirrored server-side (AdminVendorDocumentUploadSerializer, reused by
// the me/documents/ endpoint) — this is a UX convenience, not the
// source of truth.
const DOC_FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg";
const DOC_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const DOC_FILE_MAX_BYTES = 50 * 1024 * 1024; // 50MB
const DOC_FILE_HINT = "PDF, PNG or JPEG · up to 50MB";

function validateDocFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!DOC_FILE_EXTENSIONS.includes(ext)) {
    return "Only PDF, PNG, or JPEG files are allowed.";
  }
  if (file.size > DOC_FILE_MAX_BYTES) {
    return "File must be 50MB or smaller.";
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, { badge: string; tile: string }> = {
  PENDING: {
    badge: "bg-yellow-100 text-yellow-700",
    tile: "bg-brand-yellow-lg text-brand-secondary",
  },
  VERIFIED: {
    badge: "bg-green-100 text-green-700",
    tile: "bg-green-100 text-green-700",
  },
  REJECTED: {
    badge: "bg-red-100 text-red-700",
    tile: "bg-red-100 text-red-700",
  },
};

export default function KycDocumentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);

  const queryKey = queryKeys.settings.kycDocuments(token);
  const {
    data: docs = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getVendorDocumentsApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load documents");
      }
      return res.data;
    },
    enabled: !!token,
  });

  const counts = {
    VERIFIED: docs.filter((d) => d.status === "VERIFIED").length,
    PENDING: docs.filter((d) => d.status === "PENDING").length,
    REJECTED: docs.filter((d) => d.status === "REJECTED").length,
  };

  return (
    <>
      <Header
        title="KYC Documents"
        onBack={() => router.back()}
        rightSlot={
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-page-narrow lg:pt-7">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <div className="mt-2 rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-red-500">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-yellow hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        ) : docs.length === 0 ? (
          <div className="mt-2 flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={DOC_PATH}
                />
              </svg>
            </span>
            <p className="text-sm font-semibold text-font-main-sub">
              No documents yet
            </p>
            <p className="mt-1 text-xs text-font-dim">
              Upload your business and ID documents so our team can verify your
              account.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 rounded-xl bg-brand-secondary px-4 py-2.5 text-sm font-semibold text-brand-yellow hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Add document
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl bg-white py-3 shadow-sm">
              {(
                [
                  ["VERIFIED", "Verified", "text-green-700"],
                  ["PENDING", "In review", "text-yellow-700"],
                  ["REJECTED", "Rejected", "text-red-700"],
                ] as const
              ).map(([key, label, color]) => (
                <div key={key} className="px-2 text-center">
                  <p
                    className={`font-heading text-xl font-bold leading-none ${
                      counts[key] > 0 ? color : "text-font-dim/50"
                    }`}
                  >
                    {counts[key]}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-font-dim">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <section>
              <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                Your documents · {docs.length}
              </h2>
              <div className="space-y-2.5">
                {docs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {showAddForm && (
        <AddDocumentSheet
          token={token!}
          onClose={() => setShowAddForm(false)}
          onAdded={(d) => {
            queryClient.setQueryData<VendorDocument[]>(queryKey, (prev) => [
              d,
              ...(prev ?? []),
            ]);
            setShowAddForm(false);
          }}
        />
      )}
    </>
  );
}

function DocumentCard({ doc }: { doc: VendorDocument }) {
  const style = STATUS_STYLES[doc.status] ?? {
    badge: "bg-gray-100 text-gray-600",
    tile: "bg-gray-100 text-font-dim",
  };
  const typeIcon =
    DOC_TYPE_OPTIONS.find((o) => o.value === doc.doc_type)?.icon ?? DOC_PATH;

  return (
    <article className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tile}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={typeIcon}
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-font-main-sub">
              {doc.doc_type_label}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
            >
              {doc.status_label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-font-dim">
            {doc.original_filename}
          </p>
          <p className="mt-1 text-[11px] text-font-dim/80">
            Submitted {formatDate(doc.created_at)}
            {doc.status === "PENDING" && " · awaiting review"}
            {doc.status === "VERIFIED" &&
              doc.reviewed_at &&
              ` · verified ${formatDate(doc.reviewed_at)}`}
          </p>
        </div>
      </div>

      {doc.status === "REJECTED" && doc.rejection_reason && (
        <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-semibold">Reason:</span> {doc.rejection_reason}
        </p>
      )}

      <a
        href={toAbsoluteMediaUrl(doc.file)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-bg py-2.5 text-xs font-semibold text-font-main-sub hover:bg-gray-100 active:bg-gray-100 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7z"
          />
        </svg>
        View document
      </a>
    </article>
  );
}

function AddDocumentSheet({
  token,
  onClose,
  onAdded,
}: {
  token: string;
  onClose: () => void;
  onAdded: (d: VendorDocument) => void;
}) {
  const [docType, setDocType] = useState<VendorDocumentType>(
    DOC_TYPE_OPTIONS[0].value,
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (): Promise<VendorDocument> => {
      if (!file) {
        throw new Error("Please choose a file to upload.");
      }
      const res = await uploadVendorDocumentApi(docType, file, token);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to submit document");
      }
      return res.data;
    },
    onSuccess: (d) => onAdded(d),
  });

  const error =
    fileError ??
    (uploadMutation.error instanceof Error
      ? uploadMutation.error.message
      : null);

  return (
    <BottomSheet
      title="Add document"
      subtitle="Reviewed by our team before it's verified"
      onClose={onClose}
    >
      {(dismiss) => (
        <div className="space-y-4">
          {/* Document type */}
          <div>
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
              Document type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPE_OPTIONS.map((opt) => {
                const selected = opt.value === docType;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDocType(opt.value)}
                    aria-pressed={selected}
                    className={`rounded-2xl p-3 text-left shadow-sm transition-colors ${
                      selected
                        ? "bg-brand-yellow/30 ring-2 ring-brand-yellow-lg"
                        : "bg-white hover:bg-gray-50 active:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-brand-yellow-lg text-brand-secondary"
                          : "bg-gray-100 text-font-dim"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={opt.icon}
                        />
                      </svg>
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-font-main-sub">
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-font-dim">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File */}
          <div>
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
              File
            </p>
            <label
              htmlFor="kyc-file-input"
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition-colors ${
                file
                  ? "border-brand-yellow-lg bg-white"
                  : "border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-50"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  file
                    ? "bg-brand-yellow-lg text-brand-secondary"
                    : "bg-gray-100 text-font-dim"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      file
                        ? DOC_PATH
                        : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    }
                  />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-font-main-sub">
                  {file ? (
                    file.name
                  ) : (
                    <>
                      <span className="lg:hidden">Tap</span>
                      <span className="hidden lg:inline">Click</span> to choose
                      a file
                    </>
                  )}
                </span>
                <span className="block text-xs text-font-dim">
                  {file ? (
                    <>
                      {formatBytes(file.size)} ·{" "}
                      <span className="lg:hidden">tap</span>
                      <span className="hidden lg:inline">click</span> to change
                    </>
                  ) : (
                    DOC_FILE_HINT
                  )}
                </span>
              </span>
              <input
                id="kyc-file-input"
                type="file"
                accept={DOC_FILE_ACCEPT}
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  if (!selected) {
                    setFile(null);
                    return;
                  }
                  const validationError = validateDocFile(selected);
                  if (validationError) {
                    setFileError(validationError);
                    setFile(null);
                    e.target.value = "";
                    return;
                  }
                  setFileError(null);
                  setFile(selected);
                }}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={dismiss}
              disabled={uploadMutation.isPending}
              className="rounded-xl bg-white py-3.5 text-sm font-semibold text-font-main-sub shadow-sm hover:bg-gray-100 active:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !file}
              className="rounded-xl bg-brand-secondary py-3.5 text-sm font-semibold text-brand-yellow shadow-sm hover:opacity-90 active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              {uploadMutation.isPending ? "Uploading..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
