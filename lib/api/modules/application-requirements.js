import { apiFetch } from "../core/client";

/**
 * The "what will I need" catalog shown on the requirements-preview screen
 * before a customer starts an application wizard (unauthenticated backend
 * endpoint — no token needed, same trust level as reference data).
 */

/** GET /application-requirements/{applicationType} — single spec, or null if unknown. */
export async function getApplicationRequirements(applicationType) {
  return apiFetch(`/application-requirements/${encodeURIComponent(applicationType)}`, { method: "GET" });
}

/** GET /application-requirements — full catalog. */
export async function listApplicationRequirements() {
  return apiFetch("/application-requirements", { method: "GET" });
}
