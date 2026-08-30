// Maps a raw application_type string (from getMyApplications()) back to its
// owning service in app/services/_data.js's SERVICES catalog, and derives
// display copy from that mapping. application_type is NOT a mechanical
// transform of the service slug — verified case by case against the actual
// submit calls and status-config.js:
//   - DL: "fresh" | "renewal" | "reissue" | "international_permit" (no
//     shared prefix, and doesn't match the child slugs either — those are
//     hyphenated and "re-issue" is spelled differently)
//   - number_plate_*                                -> number-plate
//   - vehicle_particulars (exact)                    -> vehicle-particulars
//   - vehicle_verification_* (registration_history | -> vehicle-verification
//     customs_duty)
//   - physical_condition_inspection (exact)          -> physical-condition-inspection
//   - central_motor_registry (exact)                 -> central-motor-registry
//   - roadworthiness_express (exact)                 -> roadworthiness-express
//   - tinted_permit (exact)                          -> tinted-permit
import { SERVICES, getService } from "@/app/services/_data";
import { isNumberPlateType } from "@/app/dashboard/_shared/status-config";

const EXACT_TYPE_TO_SLUG = {
  fresh: "drivers-licence",
  renewal: "drivers-licence",
  reissue: "drivers-licence",
  international_permit: "drivers-licence",
  vehicle_particulars: "vehicle-particulars",
  physical_condition_inspection: "physical-condition-inspection",
  central_motor_registry: "central-motor-registry",
  roadworthiness_express: "roadworthiness-express",
  tinted_permit: "tinted-permit",
};

export function serviceSlugForApplicationType(applicationType) {
  if (!applicationType) return null;
  if (EXACT_TYPE_TO_SLUG[applicationType]) return EXACT_TYPE_TO_SLUG[applicationType];
  if (isNumberPlateType(applicationType)) return "number-plate";
  if (applicationType.startsWith("vehicle_verification_")) return "vehicle-verification";
  return null;
}

export function categoryForApplicationType(applicationType) {
  const slug = serviceSlugForApplicationType(applicationType);
  const service = slug ? getService(slug) : null;
  return service?.category || "Other documents"; // safe bucket for anything unrecognized
}

// Derived at runtime from SERVICES (not a hand-typed list) so this can't
// drift out of sync with app/services/_data.js. Order follows first
// appearance in the SERVICES array.
export const APPLICATION_CATEGORIES = [...new Set(SERVICES.map((s) => s.category))];

// Display label per application_type — including the 4 types that never had
// a list-page label before this page existed (Vehicle Verification's two
// check types, PCI, ECMR, RWX).
const TYPE_LABELS = {
  fresh: "Fresh driver's licence",
  renewal: "Driver's licence renewal",
  reissue: "Driver's licence re-issue",
  international_permit: "International driver's permit",
  tinted_permit: "Tinted permit application",
  number_plate_new: "New plate",
  number_plate_replacement: "Plate replacement",
  number_plate_change_of_ownership: "Change of ownership",
  number_plate_fancy: "Fancy plate",
  vehicle_verification_registration_history: "Registration history check",
  vehicle_verification_customs_duty: "Customs duty check",
  physical_condition_inspection: "Physical condition inspection",
  central_motor_registry: "ECMR registration",
  roadworthiness_express: "Roadworthiness Express (RWX)",
};

export function typeLabel(app) {
  if (app.application_type === "vehicle_particulars") {
    const n = (app.items || []).length;
    return `${n} document${n === 1 ? "" : "s"} selected`;
  }
  return TYPE_LABELS[app.application_type] || app.application_type?.replace(/_/g, " ") || "Application";
}

// Per-item chip labels/tones for vehicle_particulars bundles — relocated
// from app/dashboard/apply/vehicle-particulars/page.jsx (now a redirect
// stub) since ApplicationCard still needs these for the per-item chip row.
export const DOCUMENT_TYPE_LABELS = {
  vehicle_licence: "Vehicle Licence",
  road_worthiness: "Road Worthiness Certificate",
  proof_of_ownership: "Proof of Ownership",
  insurance_third_party: "Third-Party Insurance",
  hackney_permit: "Hackney Permit",
};

export const ITEM_STATUS_META = {
  pending_evidence: { label: "Awaiting evidence", tone: "text-amber-700" },
  evidence_submitted: { label: "Awaiting release", tone: "text-amber-700" },
  offered: { label: "Offered to agents", tone: "text-sky-700" },
  agent_accepted: { label: "In progress", tone: "text-sky-700" },
  agent_completed: { label: "Under staff review", tone: "text-amber-700" },
  rejected: { label: "Needs re-work", tone: "text-red-700" },
  needs_correction: { label: "Needs correction", tone: "text-red-700" },
  approved: { label: "Approved", tone: "text-emerald-700" },
};

// A correct per-type resolver for the "expired -> renew now" CTA. Replaces
// the old Driver's Licence list page's hardcoded /dashboard/apply?type=renewal
// (used for every expired application regardless of type — a real,
// pre-existing bug this fixes), built from the per-type table that already
// exists on the detail page.
const NUMBER_PLATE_QUERY_TYPE = {
  number_plate_new: "new",
  number_plate_replacement: "replacement",
  number_plate_change_of_ownership: "change-of-ownership",
  number_plate_fancy: "fancy",
};

export function renewHref(app) {
  const t = app.application_type;
  if (t === "tinted_permit") return "/dashboard/apply/tinted-permit/new";
  if (isNumberPlateType(t)) return `/dashboard/apply/number-plate/new?type=${NUMBER_PLATE_QUERY_TYPE[t] || "new"}`;
  if (t === "vehicle_particulars") return "/dashboard/apply/vehicle-particulars/new";
  if (t === "physical_condition_inspection") return "/dashboard/apply/physical-condition-inspection/new";
  if (t === "central_motor_registry") return "/dashboard/apply/central-motor-registry/new";
  if (t === "roadworthiness_express") return "/dashboard/apply/roadworthiness-express/new";
  if (t?.startsWith("vehicle_verification_")) return "/dashboard/apply/vehicle-verification/new";
  return "/dashboard/apply?type=renewal"; // DL: fresh | renewal | reissue | international_permit
}
