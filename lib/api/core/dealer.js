import { apiFetch } from "./client";

/**
 * Dealer Portal — Application, Profile, Banking, Wallet, Matched Requests & Bidding.
 * Requires `dealer` role Bearer access token (except dealerApply, which is public).
 */

/** Public spare-part category list. GET /dealers/categories */
export async function dealerListCategories() {
  return apiFetch("/dealers/categories", { method: "GET" });
}

/** Public dealer signup. POST /dealers/apply */
export async function dealerApply({ name, email, phone, password, business_name, registration_number, categories, market_state_id, additional_market_state_ids }) {
  return apiFetch("/dealers/apply", {
    method: "POST",
    body: { name, email, phone, password, business_name, registration_number, categories, market_state_id, additional_market_state_ids },
  });
}

/** GET /dealers/me */
export async function dealerGetMe() {
  return apiFetch("/dealers/me", { method: "GET" });
}

/** PATCH /dealers/me */
export async function dealerUpdateMe({ categories, market_state_id, additional_market_state_ids } = {}) {
  return apiFetch("/dealers/me", {
    method: "PATCH",
    body: { categories, market_state_id, additional_market_state_ids },
  });
}

/** GET /dealers/bank-account */
export async function dealerGetBankAccount() {
  return apiFetch("/dealers/bank-account", { method: "GET" });
}

/** POST /dealers/bank-account */
export async function dealerSetBankAccount({ bank_code, account_number }) {
  return apiFetch("/dealers/bank-account", { method: "POST", body: { bank_code, account_number } });
}

/** GET /dealers/wallet */
export async function dealerGetWallet() {
  return apiFetch("/dealers/wallet", { method: "GET" });
}

/** POST /dealers/wallet/withdraw */
export async function dealerWithdrawWallet({ amount_kobo }) {
  return apiFetch("/dealers/wallet/withdraw", { method: "POST", body: { amount_kobo } });
}

/** Requests matched to this dealer's categories/market. GET /dealers/matched-requests */
export async function dealerListMatchedRequests() {
  return apiFetch("/dealers/matched-requests", { method: "GET" });
}

/** Single matched request + this dealer's own bid on it (if any). GET /dealers/matched-requests/{requestId} */
export async function dealerGetMatchedRequest(requestId) {
  return apiFetch(`/dealers/matched-requests/${requestId}`, { method: "GET" });
}

/** Requests where this dealer's bid was selected (an actual order). GET /dealers/orders */
export async function dealerListOrders() {
  return apiFetch("/dealers/orders", { method: "GET" });
}

/** POST /dealers/matched-requests/{requestId}/bids */
export async function dealerSubmitBid(requestId, { price_kobo, delivery_timeline_days, condition, is_oem, warranty_note, notes, photo_url }) {
  return apiFetch(`/dealers/matched-requests/${requestId}/bids`, {
    method: "POST",
    body: { price_kobo, delivery_timeline_days, condition, is_oem, warranty_note, notes, photo_url },
  });
}

/** PATCH /dealers/bids/{bidId} */
export async function dealerAmendBid(bidId, fields) {
  return apiFetch(`/dealers/bids/${bidId}`, { method: "PATCH", body: fields });
}

/** Marks an order shipped — only allowed once escrow is 'held'. POST /dealers/matched-requests/{requestId}/ship */
export async function dealerShipOrder(requestId) {
  return apiFetch(`/dealers/matched-requests/${requestId}/ship`, { method: "POST" });
}
