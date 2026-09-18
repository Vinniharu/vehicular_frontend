import { apiFetch } from "../core/client";

/**
 * Fetch public Fast Track pricing & turnaround info for a specific service.
 */
export async function getFastTrackPricingPublic(service, stateId) {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (stateId) params.set("state", stateId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/pricing/fast-track${qs}`, { method: "GET" });
}

/**
 * Admin: Get all Fast Track pricing configurations
 */
export async function getAdminFastTrackPricing() {
  return apiFetch("/admin/fast-track/pricing", { method: "GET" });
}

/**
 * Admin: Update Fast Track pricing configurations
 */
export async function updateAdminFastTrackPricing(items) {
  return apiFetch("/admin/fast-track/pricing", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

/**
 * Admin: Get all Fast Track SLA configurations
 */
export async function getAdminFastTrackSLA() {
  return apiFetch("/admin/fast-track/sla", { method: "GET" });
}

/**
 * Admin: Update Fast Track SLA configurations
 */
export async function updateAdminFastTrackSLA(items) {
  return apiFetch("/admin/fast-track/sla", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

/**
 * Admin: Get all Fast Track agent bonus configurations
 */
export async function getAdminFastTrackBonus() {
  return apiFetch("/admin/fast-track/compensation", { method: "GET" });
}

/**
 * Admin: Update Fast Track agent bonus configurations
 */
export async function updateAdminFastTrackBonus(items) {
  return apiFetch("/admin/fast-track/compensation", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

/**
 * Admin: Send a Fast Track upgrade request to an existing application customer
 */
export async function sendAdminFastTrackRequest(applicationId) {
  return apiFetch(`/admin/applications/${applicationId}/send-fast-track-request`, {
    method: "POST",
  });
}

/**
 * Customer: Get current pending Fast Track upgrade request for an application
 */
export async function getApplicationFastTrackUpgrade(applicationId) {
  return apiFetch(`/applications/${applicationId}/fast-track-upgrade`, {
    method: "GET",
  });
}

/**
 * Customer: Accept a Fast Track upgrade offer
 */
export async function acceptFastTrackUpgrade(applicationId) {
  return apiFetch(`/applications/${applicationId}/fast-track-upgrade/accept`, {
    method: "POST",
  });
}

/**
 * Customer: Decline a Fast Track upgrade offer
 */
export async function declineFastTrackUpgrade(applicationId) {
  return apiFetch(`/applications/${applicationId}/fast-track-upgrade/decline`, {
    method: "POST",
  });
}

