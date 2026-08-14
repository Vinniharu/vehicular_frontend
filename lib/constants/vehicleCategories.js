// Mirrors app/core/reference_helpers.py's VEHICLE_CATEGORIES/VEHICLE_CATEGORY_LABELS
// on the backend — keep the value/label pairs and the hackney-eligible set
// in sync with that file if either ever changes.
export const VEHICLE_CATEGORY_OPTIONS = [
  { value: "saloon_private", label: "Saloon/Car — Private" },
  { value: "saloon_commercial", label: "Saloon/Car — Commercial" },
  { value: "jeep_suv", label: "Jeep/SUV" },
  { value: "space_bus_private", label: "Space bus/Sienna — Private" },
  { value: "space_bus_commercial", label: "Space bus/Sienna — Commercial" },
  { value: "pickup_private", label: "Pick-Up/Hilux — Private" },
  { value: "pickup_commercial", label: "Pick-Up/Hilux — Commercial" },
  { value: "bus_18_seater_private", label: "18 passenger/Bus — Private" },
  { value: "bus_18_seater_commercial", label: "18 passenger/Bus — Commercial" },
  { value: "coaster_bus_private", label: "Coaster Bus — Private" },
  { value: "coaster_bus_commercial", label: "Coaster Bus — Commercial" },
  { value: "truck", label: "Truck" },
];

export const VEHICLE_CATEGORY_LABELS = Object.fromEntries(
  VEHICLE_CATEGORY_OPTIONS.map((c) => [c.value, c.label])
);

// Categories eligible for hackney_permit (for-hire/commercial carriage) —
// every explicitly "_commercial" category plus truck. jeep_suv has no
// private/commercial split given, so it's excluded rather than assumed
// either way — matches is_commercial_category on the backend exactly.
export const HACKNEY_ELIGIBLE_CATEGORY_VALUES = VEHICLE_CATEGORY_OPTIONS
  .map((c) => c.value)
  .filter((v) => v.endsWith("_commercial") || v === "truck");

export function isCommercialCategory(vehicleCategory) {
  return HACKNEY_ELIGIBLE_CATEGORY_VALUES.includes(vehicleCategory);
}
