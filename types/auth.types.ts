export interface SendOtpResponse {
  message: string;
  otp_expires_in?: number;
}

export interface VerifyOtpResponse {
  access_token: string;
  refresh_token: string;
  user: {
    phone_number: string;
    first_name: string;
    last_name?: string;
  };
}
