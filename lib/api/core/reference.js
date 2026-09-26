import { apiFetch } from "./client";

/**
 * Nigerian Administrative Reference Data Endpoints (ENDPOINTS.md Section 2)
 */

/**
 * Retrieve list of all 37 Nigerian states along with official 2-letter state code and capital (GET /reference/states).
 */
export async function getReferenceStates() {
  return apiFetch("/reference/states", { method: "GET" });
}

/**
 * Retrieve list of all Local Government Areas (LGAs) belonging to specified state_id (GET /reference/states/{state_id}/lgas).
 */
export async function getReferenceLgas(stateId) {
  if (!stateId) return { data: [], error: null, status: 200 };
  return apiFetch(`/reference/states/${stateId}/lgas`, { method: "GET" });
}

/**
 * Roadworthiness Express bay picker — active bays for a state, each with
 * its active slot templates (GET /reference/rwx/bays?state_id=).
 */
export async function getRwxBaysByState(stateId, lgaId) {
  if (!stateId) return { data: { items: [] }, error: null, status: 200 };
  const params = new URLSearchParams({ state_id: stateId });
  if (lgaId) params.set("lga_id", lgaId);
  return apiFetch(`/reference/rwx/bays?${params.toString()}`, { method: "GET" });
}

/**
 * Live remaining-capacity per slot template for a bay + date
 * (GET /reference/rwx/bays/{bay_id}/availability?booking_date=). date is a
 * "YYYY-MM-DD" string.
 */
export async function getRwxBayAvailability(bayId, bookingDate) {
  return apiFetch(`/reference/rwx/bays/${bayId}/availability?booking_date=${encodeURIComponent(bookingDate)}`, { method: "GET" });
}
