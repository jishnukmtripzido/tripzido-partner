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
