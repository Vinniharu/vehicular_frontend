import { apiFetch } from "../core/client";

/**
 * Admin-set flat (non-category, state-specific -> general) prices — for
 * most of these (sponsor-a-service, etc.) purely marketing
 * display with no real backend checkout flow (see app/services/_data.js on
 * the frontend, app/models/pricing.py's ServicePrice on the backend), but
 * for "roadworthiness-express" and "central-motor-registry" this IS the
 * real, checkout-authoritative price (get_flat_service_price on the
 * backend) — both moved off the vehicle-category grid to one flat fee per
 * service. Driver's licence, permit, and number-plate pricing stays on
 * getDriverLicenceFeeSchedule() — not duplicated here.
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
 * The public counterpart of the admin vehicle-category price grid — all 60
 * cells (5 vehicle_particulars document types x 12 vehicle categories),
 * each already resolved server-side (category price if set, else the flat
 * fallback price). Number plate, roadworthiness_express, and
 * central_motor_registry are flat-priced now (getServicePricing/
 * getDriverLicenceFeeSchedule instead) and no longer appear in this grid.
 * Unauthenticated (GET /pricing/vehicle-categories). Powers the public
 * /pricing calculator and any wizard needing a live category-based quote.
 * A null amount_kobo means genuinely no price is configured anywhere for
 * that cell — render "Contact us for a price", never ₦0.
 * state_id is optional — omitted, resolves through the general tier.
 */
export async function getVehicleCategoryPricing(stateId) {
  const qs = stateId ? `?${new URLSearchParams({ state_id: stateId })}` : "";
  return apiFetch(`/pricing/vehicle-categories${qs}`, { method: "GET" });
}
