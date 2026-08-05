import { apiFetch } from "../core/client";

/**
 * Customer Vehicles — reusable across vehicle-centric service applications
 * (starting with tinted_permit).
 */

/**
 * Register a new vehicle for the current customer (POST /vehicles).
 */
export async function createVehicle({ plate_number, make, model, colour, state_id }) {
  return apiFetch("/vehicles", {
    method: "POST",
    body: { plate_number, make, model, colour, state_id },
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
