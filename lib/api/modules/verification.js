import { apiFetch } from "../core/client";

/**
 * The platform's first public (no-login) verification endpoint — GET
 * /verify/physical-condition-inspection/{token}. Deliberately minimal
 * response (grades + basic vehicle identity + report date only — no
 * photos, no contact info, no chassis/engine numbers), matching the
 * discipline of the backend's verify endpoints. apiFetch works fine
 * unauthenticated (no token in localStorage just means no Authorization
 * header is sent), so no separate fetch wrapper is needed here.
 */
export async function getPublicPciVerification(token) {
  return apiFetch(`/verify/physical-condition-inspection/${encodeURIComponent(token)}`, { method: "GET" });
}
