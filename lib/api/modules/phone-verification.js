import { apiFetch } from "../core/client";

/** { valid, verified } for this number on the signed-in customer's account. */
export async function getPhoneVerificationStatus(phone) {
  return apiFetch(`/phone-verification/status?${new URLSearchParams({ phone }).toString()}`, { method: "GET" });
}

/** Sends one code by SMS and to the account email. Refused with a 429 inside the resend wait. */
export async function sendPhoneVerificationCode(phone) {
  return apiFetch("/phone-verification/send", { method: "POST", body: { phone } });
}

export async function confirmPhoneVerificationCode(phone, code) {
  return apiFetch("/phone-verification/confirm", { method: "POST", body: { phone, code } });
}
