import { apiFetch } from "./client";

/**
 * Customer-side Spare Parts marketplace — request submission, ranked bids,
 * bid selection (starts escrow checkout), delivery confirmation, disputes.
 * Requires `customer` role Bearer access token (except listCategories).
 */

/** GET /spare-parts/categories */
export async function sparePartsListCategories() {
  return apiFetch("/spare-parts/categories", { method: "GET" });
}

/** POST /spare-parts/requests */
export async function sparePartsCreateRequest({ vehicle_make, vehicle_model, vehicle_year, part_name, description, category_slug, photo_url, state_id }) {
  return apiFetch("/spare-parts/requests", {
    method: "POST",
    body: { vehicle_make, vehicle_model, vehicle_year, part_name, description, category_slug, photo_url, state_id },
  });
}

/** GET /spare-parts/requests */
export async function sparePartsListRequests() {
  return apiFetch("/spare-parts/requests", { method: "GET" });
}

/** GET /spare-parts/requests/{id} */
export async function sparePartsGetRequest(requestId) {
  return apiFetch(`/spare-parts/requests/${requestId}`, { method: "GET" });
}

/** Ranked bids with dealer rating/tier embedded. GET /spare-parts/requests/{id}/bids */
export async function sparePartsListBids(requestId) {
  return apiFetch(`/spare-parts/requests/${requestId}/bids`, { method: "GET" });
}

/** Re-attempts matching after zero dealers/zero bids. POST /spare-parts/requests/{id}/rematch */
export async function sparePartsRematch(requestId) {
  return apiFetch(`/spare-parts/requests/${requestId}/rematch`, { method: "POST" });
}

/**
 * Locks in a bid and starts the escrow checkout — no request body, bidId is
 * part of the path. Returns { authorization_url, reference, ... }; redirect
 * the customer to authorization_url to pay.
 * POST /spare-parts/requests/{id}/select-bid/{bidId}
 */
export async function sparePartsSelectBid(requestId, bidId) {
  return apiFetch(`/spare-parts/requests/${requestId}/select-bid/${bidId}`, { method: "POST" });
}

/**
 * Manual verify fallback — call after returning from the Monnify checkout
 * (or on a page that sees ?payment=complete) so the customer sees the
 * escrow flip to 'held' immediately instead of waiting on the webhook.
 * POST /spare-parts/requests/{id}/escrow/verify
 */
export async function sparePartsVerifyEscrow(requestId) {
  return apiFetch(`/spare-parts/requests/${requestId}/escrow/verify`, { method: "POST" });
}

/** POST /spare-parts/requests/{id}/confirm-delivery */
export async function sparePartsConfirmDelivery(requestId, { rating, note }) {
  return apiFetch(`/spare-parts/requests/${requestId}/confirm-delivery`, {
    method: "POST",
    body: { rating, note },
  });
}

/** POST /spare-parts/requests/{id}/dispute */
export async function sparePartsDispute(requestId, { reason, description, photo_url }) {
  return apiFetch(`/spare-parts/requests/${requestId}/dispute`, {
    method: "POST",
    body: { reason, description, photo_url },
  });
}
