import { api } from "@/lib/api";
import type {
  VendorTermsResponse,
  VendorTermsUpdatePayload,
  VendorProfileResponse,
  VendorDocumentsResponse,
  VendorDocumentResponse,
  VendorBankAccountsResponse,
  VendorBankAccountResponse,
  VendorBankAccountCreatePayload,
  VendorDocumentType,
} from "@/types/settings.types";

export async function getVendorTermsApi(
  accessToken: string,
): Promise<VendorTermsResponse> {
  return api.get<VendorTermsResponse>("/api/vendors/me/terms/", {
    token: accessToken,
  });
}

export async function saveVendorTermsApi(
  payload: VendorTermsUpdatePayload,
  accessToken: string,
): Promise<VendorTermsResponse> {
  return api.post<VendorTermsResponse>("/api/vendors/me/terms/", payload, {
    token: accessToken,
  });
}

// ── Vendor profile ─────────────────────────────────────────────────

export async function getVendorProfileApi(
  accessToken: string,
): Promise<VendorProfileResponse> {
  return api.get<VendorProfileResponse>("/api/vendors/me/", {
    token: accessToken,
  });
}

// ── KYC documents — view + submit only, no edit/delete ──────────────

export async function getVendorDocumentsApi(
  accessToken: string,
): Promise<VendorDocumentsResponse> {
  return api.get<VendorDocumentsResponse>("/api/vendors/me/documents/", {
    token: accessToken,
  });
}

export async function uploadVendorDocumentApi(
  docType: VendorDocumentType,
  file: File,
  accessToken: string,
): Promise<VendorDocumentResponse> {
  const formData = new FormData();
  formData.append("doc_type", docType);
  formData.append("file", file);
  return api.post<VendorDocumentResponse>(
    "/api/vendors/me/documents/",
    formData,
    { token: accessToken },
  );
}

// ── Bank accounts — view + submit only, no edit/delete ───────────────
// A submission always lands PENDING; it only becomes the active
// payout account once an admin verifies it.

export async function getVendorBankAccountsApi(
  accessToken: string,
): Promise<VendorBankAccountsResponse> {
  return api.get<VendorBankAccountsResponse>("/api/vendors/me/bank-accounts/", {
    token: accessToken,
  });
}

export async function createVendorBankAccountApi(
  payload: VendorBankAccountCreatePayload,
  accessToken: string,
): Promise<VendorBankAccountResponse> {
  return api.post<VendorBankAccountResponse>(
    "/api/vendors/me/bank-accounts/",
    payload,
    { token: accessToken },
  );
}
