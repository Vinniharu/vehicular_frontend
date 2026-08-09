import { apiFetch } from "../core/client";

/**
 * Customer Vehicles — reusable across vehicle-centric service applications
 * (starting with tinted_permit).
 */

/**
 * Register a new vehicle for the current customer (POST /vehicles).
 * plate_number is optional — a number_plate_new application has no plate
 * yet; year/chassis_number/engine_number are optional too, populated by
 * services that need them (number-plate).
 */
export async function createVehicle({ plate_number, make, model, colour, year, chassis_number, engine_number, state_id }) {
  return apiFetch("/vehicles", {
    method: "POST",
    body: { plate_number, make, model, colour, year, chassis_number, engine_number, state_id },
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
