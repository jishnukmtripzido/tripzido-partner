export interface SendOtpResponse {
  success: boolean;
  message: string;
  data?: Record<string, never>;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
  };
}

// Shape of GET /api/users/me/ (ProfileSerializer)
export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string | null;
    mobile_number: string;
    mobile_verified: boolean;
    address: string;
  };
}
