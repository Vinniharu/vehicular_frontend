// Single source of truth for the "Allowed Application Types" multi-select
// options shown on the agent create modal (app/admin/people/page.jsx) and
// the super-admin agent edit panel (app/components/superadmin/AccountsTable.jsx).
// Must mirror the backend's authoritative APPLICATION_TYPES list
// (app/core/reference_helpers.py, vehicular_backend) — this list has
// drifted out of sync between two independently hand-maintained copies
// twice before (most recently missing vehicle_verification_registration_history,
// vehicle_verification_customs_duty, and central_motor_registry entirely,
// meaning no admin could ever grant an agent eligibility for those 3 live
// services), so keep it here as the one place either file imports from.
//
// physical_condition_inspection is deliberately excluded — no platform
// agent role exists for that service at all (an off-platform field
// mechanic handles it), so it's not a real "allowed type" an agent can hold.
export const AGENT_APPLICATION_TYPES = [
  { value: "fresh", label: "Fresh" },
  { value: "renewal", label: "Renewal" },
  { value: "reissue", label: "Reissue" },
  { value: "international_permit", label: "International Permit" },
  { value: "tinted_permit", label: "Tinted Permit" },
  { value: "number_plate", label: "Number Plate" },
  { value: "vehicle_licence", label: "Vehicle Particulars — Vehicle Licence" },
  { value: "road_worthiness", label: "Vehicle Particulars — Road Worthiness" },
  { value: "proof_of_ownership", label: "Vehicle Particulars — Proof of Ownership" },
  { value: "insurance_third_party", label: "Vehicle Particulars — Third-Party Insurance" },
  { value: "hackney_permit", label: "Vehicle Particulars — Hackney Permit" },
  { value: "vehicle_verification_registration_history", label: "Vehicle Verification — Registration History" },
  { value: "vehicle_verification_customs_duty", label: "Vehicle Verification — Customs Duty" },
  { value: "roadworthiness_express", label: "Roadworthiness Express" },
  { value: "central_motor_registry", label: "Central Motor Registry (ECMR)" },
];
