import { apiFetch } from "./client";

/**
 * Customer Referral Program Endpoints
 * Requires `customer` role Bearer access token.
 */

/**
 * Retrieve the current customer's referral code, total rewards earned, and
 * the list of customers they've referred (with per-referral reward totals).
 * GET /customers/referrals
 */
export async function getReferralDashboard() {
  return apiFetch("/customers/referrals", { method: "GET" });
}
