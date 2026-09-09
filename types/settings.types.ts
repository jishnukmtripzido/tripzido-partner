export interface VendorTerms {
  vendor_id: number;
  version: number;
  terms_items: string[];
  security_deposit_note: string;
  operating_hours_note: string;
  distance_limit_note: string;
  excess_charge_note: string;
  late_penalty_note: string;
}

export interface VendorTermsResponse {
  success: boolean;
  message: string;
  data?: VendorTerms | null;
}

export interface VendorTermsUpdatePayload {
  terms_items: string[];
  security_deposit_note: string;
  operating_hours_note: string;
  distance_limit_note: string;
  excess_charge_note: string;
  late_penalty_note: string;
}

// ── Vendor profile (GET /api/vendors/me/) ────────────────────────────

export interface VendorSubscriptionSummary {
  id: number;
  plan_name: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
}

export type VendorStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "BANNED";

export interface VendorProfile {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  gst_number: string;
  logo_image: string | null;
  status: VendorStatus;
  status_label: string;
  rejection_reason: string;
  suspension_reason: string;
  ban_reason: string;
  current_subscription: VendorSubscriptionSummary | null;
  created_at: string;
}

export interface VendorProfileResponse {
  success: boolean;
  message: string;
  data?: VendorProfile;
}

// ── KYC documents (GET/POST /api/vendors/me/documents/) ──────────────
// View + submit only — no edit or delete from the vendor portal.
// Every submission lands PENDING and goes through the same admin
// review queue as admin-uploaded documents.

export type VendorDocumentType =
  | "BUSINESS_REGISTRATION"
  | "ID_PROOF"
  | "GST_CERTIFICATE"
  | "OTHER";

export type VendorDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface VendorDocument {
  id: number;
  doc_type: VendorDocumentType;
  doc_type_label: string;
  file: string;
  original_filename: string;
  status: VendorDocumentStatus;
  status_label: string;
  rejection_reason: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface VendorDocumentsResponse {
  success: boolean;
  message: string;
  data?: VendorDocument[];
}

export interface VendorDocumentResponse {
  success: boolean;
  message: string;
  data?: VendorDocument;
}

// ── Bank accounts (GET/POST /api/vendors/me/bank-accounts/) ──────────
// View + submit only — no edit or delete from the vendor portal. A
// submission never becomes the active payout account by itself: it
// lands PENDING and only becomes active once an admin verifies it.

export type VendorBankAccountStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUPERSEDED";

export interface VendorBankAccount {
  id: number;
  account_holder_name: string;
  account_number_masked: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  status: VendorBankAccountStatus;
  status_label: string;
  is_active_acc: boolean;
  rejection_reason: string;
  verified_at: string | null;
  submitted_at: string;
}

export interface VendorBankAccountsResponse {
  success: boolean;
  message: string;
  data?: VendorBankAccount[];
}

export interface VendorBankAccountResponse {
  success: boolean;
  message: string;
  data?: VendorBankAccount;
}

export interface VendorBankAccountCreatePayload {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name?: string;
  branch_name?: string;
}
