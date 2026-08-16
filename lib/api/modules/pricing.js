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
 * state_id is optional — omitted, resolves through the general tier.
 */
export async function getServicePricing(stateId) {
  const qs = stateId ? `?${new URLSearchParams({ state_id: stateId })}` : "";
  return apiFetch(`/pricing/services${qs}`, { method: "GET" });
}

/**
 * Live per-document prices for the vehicle_particulars bundle wizard —
 * unauthenticated (GET /pricing/particulars-items). Excludes agent
 * compensation (internal commission info); a null amount_kobo means that
 * document type isn't priced yet and should be shown as unselectable.
 * state_id is optional — omitted, resolves through the general tier.
 */
export async function getParticularsItemPricing(stateId) {
  const qs = stateId ? `?${new URLSearchParams({ state_id: stateId })}` : "";
  return apiFetch(`/pricing/particulars-items${qs}`, { method: "GET" });
}

/**
 * The public counterpart of the admin vehicle-category price grid — all 96
 * cells (5 vehicle_particulars document types + 3 number_plate_* types, x
 * 12 vehicle categories), each already resolved server-side (category price
 * if set, else the flat fallback price). Unauthenticated (GET /pricing/
 * vehicle-categories). Powers the public /pricing calculator. A null
 * amount_kobo means genuinely no price is configured anywhere for that
 * cell — render "Contact us for a price", never ₦0.
 * state_id is optional — omitted, resolves through the general tier.
 */
export async function getVehicleCategoryPricing(stateId) {
  const qs = stateId ? `?${new URLSearchParams({ state_id: stateId })}` : "";
  return apiFetch(`/pricing/vehicle-categories${qs}`, { method: "GET" });
}
