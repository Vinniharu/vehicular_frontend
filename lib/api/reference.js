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
