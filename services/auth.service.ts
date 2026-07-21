import { api } from "@/lib/api";
import type {
  SendOtpResponse,
  VerifyOtpResponse,
  ProfileResponse,
} from "@/types/auth.types";

// These hit the same unified /api/users/ endpoints the customer app
// uses. There is no separate partner auth backend — see chat notes on
// the missing role check server-side before relying on this in prod.

export async function sendOtpApi(
  phone_number: string,
  turnstile_token: string,
) {
  return api.post<SendOtpResponse>("/api/users/vendor/send-otp/", {
    phone_number,
    turnstile_token,
  });
}

export async function verifyOtpApi(phone_number: string, otp: string) {
  return api.post<VerifyOtpResponse>("/api/users/vendor/verify-otp/", {
    phone_number,
    otp,
  });
}

// verify-otp only returns tokens — call this right after to get the
// user's name/phone for AuthContext.
export async function getProfileApi(
  accessToken: string,
): Promise<ProfileResponse> {
  return api.get<ProfileResponse>("/api/users/me/", { token: accessToken });
}

export async function logoutApi(
  accessToken: string,
  refreshToken: string,
): Promise<{ success: boolean; message: string }> {
  return api.post(
    "/api/users/logout/",
    { refresh_token: refreshToken },
    { token: accessToken },
  );
}
