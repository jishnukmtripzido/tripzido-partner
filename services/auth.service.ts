import { api } from "@/lib/api";
import type { SendOtpResponse, VerifyOtpResponse } from "@/types/auth.types";

// Partner-side mirror of the customer app's auth.service.ts. Point
// these at your real partner-auth endpoints once they exist.

export async function sendOtpApi(phone_number: string): Promise<SendOtpResponse> {
  return api.post<SendOtpResponse>("/api/partners/send-otp/", { phone_number });
}

export async function verifyOtpApi(
  phone_number: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>("/api/partners/verify-otp/", {
    phone_number,
    otp,
  });
}

export interface RegisterSendOtpPayload {
  phone_number: string;
  first_name: string;
  last_name?: string;
}

export async function registerSendOtpApi(
  payload: RegisterSendOtpPayload,
): Promise<SendOtpResponse> {
  return api.post<SendOtpResponse>("/api/partners/register/send-otp/", payload);
}

export async function registerVerifyOtpApi(
  phone_number: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>("/api/partners/register/verify-otp/", {
    phone_number,
    otp,
  });
}
