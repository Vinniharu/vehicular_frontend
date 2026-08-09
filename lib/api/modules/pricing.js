import { apiFetch } from "../core/client";

/**
 * Admin-set prices for the marketing-only catalogue services — the ones
 * with no real backend application/checkout flow (see app/services/_data.js
 * on the frontend, app/models/pricing.py on the backend). Driver's licence
 * and permit pricing stays on getDriverLicenceFeeSchedule() — not
 * duplicated here.
 *
 * Unauthenticated (GET /pricing/services) — used by the Services page to
 * resolve a live price for services that don't have one baked in.
 */
export async function getServicePricing() {
  return apiFetch("/pricing/services", { method: "GET" });
}

/**
 * Live per-document prices for the vehicle_particulars bundle wizard —
 * unauthenticated (GET /pricing/particulars-items). Excludes agent
 * compensation (internal commission info); a null amount_kobo means that
 * document type isn't priced yet and should be shown as unselectable.
 */
export async function getParticularsItemPricing() {
  return apiFetch("/pricing/particulars-items", { method: "GET" });
}
