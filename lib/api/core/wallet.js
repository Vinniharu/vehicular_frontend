import { apiFetch } from "./client";

/**
 * Customer Wallet & Monnify Reserved (Virtual) Account Endpoints
 * Requires `customer` role Bearer access token.
 */

/**
 * Wallet balance in kobo and the customer's own Paystack account number
 * (`virtual_account`), when they have one. Without one, `dva_status` says
 * "pending" (being opened) or "needs_bvn" (call activateWallet).
 * GET /wallet
 */
export async function getWallet() {
  return apiFetch("/wallet", { method: "GET" });
}

/**
 * The BVN step for the customer's Paystack account number, only when the
 * wallet says dva_status === "needs_bvn": the BVN plus a bank account in the
 * customer's name. Forwarded to Paystack, not stored.
 * POST /wallet/activate
 */
export async function activateWallet({ bvn, bank_code, account_number } = {}) {
  return apiFetch("/wallet/activate", {
    method: "POST",
    body: { bvn, bank_code, account_number },
  });
}

/**
 * Initialize a deposit into the wallet using Monnify.
 * POST /wallet/deposit/initialize
 */
export async function depositIntoWalletInitialize({ amount_kobo }) {
  return apiFetch("/wallet/deposit/initialize", {
    method: "POST",
    body: { amount_kobo },
  });
}

/**
 * Verify a wallet deposit via Monnify reference.
 * POST /wallet/deposit/verify
 */
export async function verifyWalletDeposit({ reference }) {
  return apiFetch("/wallet/deposit/verify", {
    method: "POST",
    body: { reference },
  });
}

/**
 * Retrieve chronological ledger of all wallet transactions (credits vs debits).
 * GET /wallet/transactions
 */
export async function getWalletTransactions() {
  return apiFetch("/wallet/transactions", { method: "GET" });
}

/* ── Shared wallet with Spare Parts ───────────────────────────────────── */

/**
 * Link screen state: email verification, link status, shared balance and the
 * unlink warning text. GET /wallet/link
 */
export async function getWalletLink() {
  return apiFetch("/wallet/link", { method: "GET" });
}

/** Email a 6-digit code (valid 5 minutes) to verify the account email. */
export async function startEmailVerification() {
  return apiFetch("/wallet/link/email/verify/start", { method: "POST" });
}

/** Confirm the email code. Verification also tries an automatic link. */
export async function confirmEmailVerification({ code }) {
  return apiFetch("/wallet/link/email/verify/confirm", { method: "POST", body: { code } });
}

/** Send a code to a Spare Parts account (its email, or SMS to its phone). */
export async function startManualWalletLink({ identifier }) {
  return apiFetch("/wallet/link/manual/start", { method: "POST", body: { identifier } });
}

/** Confirm the code sent to the Spare Parts account and link the wallets. */
export async function confirmManualWalletLink({ code }) {
  return apiFetch("/wallet/link/manual/confirm", { method: "POST", body: { code } });
}

/** Unlink. The current shared balance stays on Vehiculars. */
export async function unlinkWallet() {
  return apiFetch("/wallet/link/unlink", { method: "POST" });
}
