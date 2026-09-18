// app/(dashboard)/settings/kyc-documents/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import {
  getVendorDocumentsApi,
  uploadVendorDocumentApi,
} from "@/services/vendor.service";
import { queryKeys } from "@/lib/queryKeys";
import type {
  VendorDocument,
  VendorDocumentType,
} from "@/types/settings.types";

const DOC_TYPE_OPTIONS: { value: VendorDocumentType; label: string }[] = [
  { value: "BUSINESS_REGISTRATION", label: "Business Registration" },
  { value: "ID_PROOF", label: "ID Proof" },
  { value: "GST_CERTIFICATE", label: "GST Certificate" },
  { value: "OTHER", label: "Other" },
];

// KYC document upload constraints, enforced client-side here and
// mirrored server-side (AdminVendorDocumentUploadSerializer, reused by
// the me/documents/ endpoint) — this is a UX convenience, not the
// source of truth.
const DOC_FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg";
const DOC_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const DOC_FILE_MAX_BYTES = 50 * 1024 * 1024; // 50MB
const DOC_FILE_HINT = "Accepted formats: PDF, PNG, JPEG • Max size: 50MB";

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

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function KycDocumentsPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);

  const queryKey = queryKeys.settings.kycDocuments(token);
  const {
    data: docs = [],
    isLoading: loading,
    error,
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

  return (
    <>
      <Header title="KYC Documents" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <button
          onClick={() => router.push("/settings")}
          className="text-sm font-semibold text-font-dim mb-4"
        >
          ← Back to settings
        </button>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-sm">
            Your Documents ({docs.length})
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs font-bold text-brand-yellow-lg"
          >
            + Add document
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-font-dim text-center py-10">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-10">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        ) : docs.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-font-dim">No documents submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{doc.doc_type_label}</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      STATUS_STYLES[doc.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {doc.status_label}
                  </span>
                </div>
                <a
                  href={doc.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-yellow-lg font-medium mt-1 block"
                >
                  {doc.original_filename}
                </a>
                {doc.status === "REJECTED" && doc.rejection_reason && (
                  <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-lg p-2">
                    Reason: {doc.rejection_reason}
                  </p>
                )}
                {doc.status === "PENDING" && (
                  <p className="text-xs text-font-dim mt-2">
                    Submitted, awaiting review.
                  </p>
                )}
                <p className="text-[10px] text-font-dim mt-2">
                  Submitted {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <AddDocumentModal
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
      </main>
    </>
  );
}

function AddDocumentModal({
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">Add document</h3>
        <p className="text-xs text-font-dim -mt-1">
          Submitted documents are reviewed by our team before they're verified.
        </p>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as VendorDocumentType)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {DOC_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div>
          <p className="text-xs text-font-dim mb-1">File</p>
          <input
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
            className="w-full text-sm"
          />
          <p className="text-[11px] text-font-dim mt-1">{DOC_FILE_HINT}</p>
        </div>
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploadMutation.isPending}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
          >
            Cancel
          </button>
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !file}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {uploadMutation.isPending ? "Uploading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
