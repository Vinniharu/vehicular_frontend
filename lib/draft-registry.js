/**
 * Single source of truth mapping a draft's wizard_key (matches the
 * backend's ApplicationDraft.wizard_key exactly) to display metadata and
 * where "Resume" should navigate. wizard_key equals the raw application_type
 * for the 6 families whose subtype is picked before the wizard mounts;
 * it's the family slug for driver_licence/vehicle_verification, whose
 * subtype is chosen inside the already-mounted wizard (see
 * lib/hooks/useApplicationDraft.js's docstring and the backend's
 * app/models/application_draft.py for the same split explained in full).
 */
export const WIZARD_KEY_META = {
  driver_licence: { label: "Driver's Licence", resumeUrl: "/dashboard/apply" },
  number_plate_new: { label: "Number Plate (New)", resumeUrl: "/dashboard/apply/number-plate/new?type=new" },
  number_plate_replacement: { label: "Number Plate (Replacement)", resumeUrl: "/dashboard/apply/number-plate/new?type=replacement" },
  number_plate_change_of_ownership: { label: "Number Plate (Change of Ownership)", resumeUrl: "/dashboard/apply/number-plate/new?type=change-of-ownership" },
  number_plate_fancy: { label: "Fancy Plate", resumeUrl: "/dashboard/apply/number-plate/new?type=fancy" },
  number_plate_dealership: { label: "Dealership Plate", resumeUrl: "/dashboard/apply/number-plate/new?type=dealership" },
  vehicle_particulars: { label: "Vehicle Particulars & Renewals", resumeUrl: "/dashboard/apply/vehicle-particulars/new" },
  tinted_permit: { label: "Tinted Glass Permit", resumeUrl: "/dashboard/apply/tinted-permit/new" },
  vehicle_verification: { label: "Vehicle Verification", resumeUrl: "/dashboard/apply/vehicle-verification/new" },
  physical_condition_inspection: { label: "Physical Condition Inspection", resumeUrl: "/dashboard/apply/physical-condition-inspection/new" },
  central_motor_registry: { label: "ECMR Registration", resumeUrl: "/dashboard/apply/central-motor-registry/new" },
  roadworthiness_express: { label: "Roadworthiness Express", resumeUrl: "/dashboard/apply/roadworthiness-express/new" },
};

export function getWizardKeyMeta(wizardKey) {
  return WIZARD_KEY_META[wizardKey] || { label: wizardKey, resumeUrl: "/dashboard/applications" };
}

/**
 * Maps a specific application_type (finer-grained than wizard_key — e.g.
 * "fresh" and "renewal" are both driver_licence) to the exact URL the
 * requirements-preview page's "Start Application" CTA should send a
 * customer to. Kept separate from WIZARD_KEY_META's resumeUrl, which is
 * one level coarser (family-level for driver_licence/vehicle_verification).
 */
export const APPLICATION_TYPE_START_URL = {
  fresh: "/dashboard/apply?type=fresh",
  renewal: "/dashboard/apply?type=renewal",
  reissue: "/dashboard/apply?type=reissue",
  international_permit: "/dashboard/apply?type=international_permit",
  tinted_permit: "/dashboard/apply/tinted-permit/new",
  number_plate_new: "/dashboard/apply/number-plate/new?type=new",
  number_plate_replacement: "/dashboard/apply/number-plate/new?type=replacement",
  number_plate_change_of_ownership: "/dashboard/apply/number-plate/new?type=change-of-ownership",
  number_plate_fancy: "/dashboard/apply/number-plate/new?type=fancy",
  number_plate_dealership: "/dashboard/apply/number-plate/new?type=dealership",
  vehicle_particulars: "/dashboard/apply/vehicle-particulars/new",
  vehicle_verification_registration_history: "/dashboard/apply/vehicle-verification/new?type=registration_history",
  vehicle_verification_customs_duty: "/dashboard/apply/vehicle-verification/new?type=customs_duty",
  physical_condition_inspection: "/dashboard/apply/physical-condition-inspection/new",
  central_motor_registry: "/dashboard/apply/central-motor-registry/new",
  roadworthiness_express: "/dashboard/apply/roadworthiness-express/new",
};

/** application_type -> wizard_key (the draft table's grouping — see WIZARD_KEY_META's docstring). */
export const APPLICATION_TYPE_TO_WIZARD_KEY = {
  fresh: "driver_licence",
  renewal: "driver_licence",
  reissue: "driver_licence",
  international_permit: "driver_licence",
  tinted_permit: "tinted_permit",
  number_plate_new: "number_plate_new",
  number_plate_replacement: "number_plate_replacement",
  number_plate_change_of_ownership: "number_plate_change_of_ownership",
  number_plate_fancy: "number_plate_fancy",
  number_plate_dealership: "number_plate_dealership",
  vehicle_particulars: "vehicle_particulars",
  vehicle_verification_registration_history: "vehicle_verification",
  vehicle_verification_customs_duty: "vehicle_verification",
  physical_condition_inspection: "physical_condition_inspection",
  central_motor_registry: "central_motor_registry",
  roadworthiness_express: "roadworthiness_express",
};

export function getStartUrl(applicationType) {
  return APPLICATION_TYPE_START_URL[applicationType] || "/dashboard/applications";
}

export function getWizardKeyForApplicationType(applicationType) {
  return APPLICATION_TYPE_TO_WIZARD_KEY[applicationType] || applicationType;
}
