import { apiFetch } from "../core/client";

/**
 * Customer Vehicles — reusable across vehicle-centric service applications
 * (starting with tinted_permit).
 */

/**
 * Register a new vehicle for the current customer (POST /vehicles).
 * plate_number is optional — a number_plate_new application has no plate
 * yet; year/chassis_number/engine_number are optional too, populated by
 * services that need them (number-plate). vehicle_category (one of
 * lib/constants/vehicleCategories.js's VEHICLE_CATEGORY_OPTIONS values) is
 * optional at this layer — tinted_permit's vehicle-creation form doesn't
 * collect it — but required client-side by the number-plate and
 * vehicle-particulars wizards, since it drives their pricing.
 */
export async function createVehicle({ plate_number, make, model, colour, year, chassis_number, engine_number, state_id, vehicle_category }) {
  return apiFetch("/vehicles", {
    method: "POST",
    body: { plate_number, make, model, colour, year, chassis_number, engine_number, state_id, vehicle_category },
  });
}

/**
 * List the current customer's own vehicles (GET /vehicles).
 */
export async function listVehicles() {
  return apiFetch("/vehicles", { method: "GET" });
}

/**
 * Get a single vehicle by id (GET /vehicles/{id}).
 */
export async function getVehicle(vehicleId) {
  return apiFetch(`/vehicles/${vehicleId}`, { method: "GET" });
}
