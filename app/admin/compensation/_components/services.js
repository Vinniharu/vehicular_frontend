// Services an agent can be paid for, grouped the way the pay screens show them.

export const PAPERS = [
  { key: "vehicle_particulars", label: "All documents (bundle)" },
  { key: "vehicle_licence", label: "Vehicle licence" },
  { key: "road_worthiness", label: "Roadworthiness certificate" },
  { key: "proof_of_ownership", label: "Proof of ownership" },
  { key: "insurance_third_party", label: "Third-party insurance" },
  { key: "hackney_permit", label: "Hackney permit" },
];

export const PLATES = [
  { key: "number_plate_new", label: "New number plate" },
  { key: "number_plate_replacement", label: "Replacement plate" },
  { key: "number_plate_change_of_ownership", label: "Change of ownership" },
  { key: "number_plate_fancy", label: "Custom plate" },
  { key: "number_plate_dealership", label: "Dealership plates" },
];

export const ECMR = [{ key: "central_motor_registry", label: "Central Motor Registry (ECMR)" }];

/** Services paid per vehicle type, grouped. */
export const VEHICLE_GROUPS = [
  { id: "papers", label: "Vehicle papers", services: PAPERS },
  { id: "plates", label: "Number plates", services: PLATES },
  { id: "ecmr", label: "ECMR", services: ECMR },
];

/** Per-agent pay for services not priced by vehicle type. */
export const OTHER_SERVICES = [
  { key: "fresh", label: "New driver's licence" },
  { key: "renewal", label: "Licence renewal" },
  { key: "reissue", label: "Licence replacement" },
  { key: "international_permit", label: "International driving permit" },
  { key: "tinted_permit", label: "Tinted glass permit" },
  { key: "vehicle_particulars", label: "Vehicle papers (bundle)" },
  { key: "central_motor_registry", label: "Central Motor Registry (ECMR)" },
];

/** Default pay per service type (system settings). */
export const DEFAULT_TYPES = [
  { key: "fresh", label: "New driver's licence" },
  { key: "renewal", label: "Licence renewal" },
  { key: "reissue", label: "Licence replacement" },
  { key: "international_permit", label: "International driving permit" },
  { key: "tinted_permit", label: "Tinted glass permit" },
  { key: "number_plate", label: "Number plates (all types)" },
  { key: "vehicle_particulars", label: "Vehicle papers (bundle)" },
  { key: "vehicle_licence", label: "Vehicle licence" },
  { key: "road_worthiness", label: "Roadworthiness certificate" },
  { key: "proof_of_ownership", label: "Proof of ownership" },
  { key: "insurance_third_party", label: "Third-party insurance" },
  { key: "hackney_permit", label: "Hackney permit" },
  { key: "central_motor_registry", label: "Central Motor Registry (ECMR)" },
];

export const cellId = (serviceKey, category) => `${serviceKey}|${category ?? ""}`;
