import { apiFetch } from "./client";

/**
 * Customer Wallet & Monnify Reserved (Virtual) Account Endpoints
 * Requires `customer` role Bearer access token.
 */

/**
 * Retrieve wallet balance in Kobo and the real Monnify reserved account, if
 * one has been activated. If `needs_identity_verification` is true, no
 * account exists yet — call activateWallet() with a BVN or NIN first.
 * GET /wallet
 */
export async function getWallet() {
  return apiFetch("/wallet", { method: "GET" });
}

/**
 * Activates the wallet by creating a real Monnify reserved account. Monnify
 * requires a BVN or NIN on every reserved-account creation — pass at least
 * one. Neither is stored by the backend, only forwarded to Monnify.
 * POST /wallet/activate
 */
export async function activateWallet({ bvn, nin } = {}) {
  return apiFetch("/wallet/activate", {
    method: "POST",
    body: { bvn, nin },
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
