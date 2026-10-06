// Single source of truth for DL application status display, replacing the
// three status maps previously duplicated (and drifted) across
// dashboard/page.jsx, apply/page.jsx, and apply/[id]/page.jsx.

export const STATUS_META = {
  submitted: { label: "Submitted", tone: "info" },
  staff_review: { label: "Under staff review", tone: "warning" },
  driving_school_enrolled: { label: "Driving school enrolled", tone: "purple" },
  driving_school_graduation: { label: "Graduation stage — Awaiting certificate", tone: "purple" },
  driving_school_certificate_ready: { label: "Driving school certificate ready", tone: "teal" },
  driving_school_graduated: { label: "Driving school complete", tone: "purple" },
  routed: { label: "Sent to agent", tone: "success" },
  agent_assigned: { label: "Agent assigned", tone: "success" },
  agent_accepted: { label: "Agent en route", tone: "success" },
  capture_scheduled: { label: "Biometric capture scheduled", tone: "indigo" },
  capturing_scheduled: { label: "Biometric capture scheduled", tone: "indigo" },
  scheduled: { label: "Biometric capture scheduled", tone: "indigo" },
  captured: { label: "Biometrics captured", tone: "teal" },
  capturing_completed: { label: "Biometrics captured", tone: "teal" },
  temp_licence_pending_review: { label: "Temporary licence under review", tone: "warning" },
  temp_licence_issued: { label: "Temporary licence issued", tone: "purple" },
  agent_completed: { label: "Processing complete", tone: "teal" },
  staff_final_review: { label: "Final review", tone: "warning" },
  in_review: { label: "Final review", tone: "warning" },
  in_process: { label: "In process", tone: "info" },
  // vehicle_particulars bundle-level statuses only — item-level detail
  // lives in ParticularsItemsSummary, not here.
  released_to_agents: { label: "Released to agents", tone: "success" },
  in_progress: { label: "Agents working on it", tone: "success" },
  ready_for_pickup: { label: "Ready for pickup", tone: "success" },
  awaiting_customer: { label: "Ready", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  needs_correction: { label: "Action required", tone: "warning" },
  staff_rejected: { label: "Rejected", tone: "danger" },
  failed: { label: "Rejected", tone: "danger" },
  expired: { label: "Expired", tone: "danger" },
  // Roadworthiness Express, Physical Condition Inspection and routing
  // statuses that previously fell through to a raw "visit scheduled" label.
  draft: { label: "Awaiting payment", tone: "neutral" },
  paid: { label: "Booked", tone: "success" },
  visit_scheduled: { label: "Inspection visit scheduled", tone: "indigo" },
  awaiting_mechanic_verdict: { label: "Inspection being graded", tone: "warning" },
  agent_declined: { label: "Finding another agent", tone: "warning" },
};

const TYPE_STATUS_OVERRIDES = {
  roadworthiness_express: { failed: { label: "Failed inspection", tone: "danger" }, awaiting_customer: { label: "Certificate ready", tone: "success" } },
};

// Sourced from the status-tone CSS vars wired in app/globals.css's
// @theme inline block (in turn mirroring lib/design-tokens.ts
// colors.status) rather than stock Tailwind palette colors — this is
// also what fixes danger, previously stock red instead of the
// deliberately desaturated "ink stamp" red used for rejections.
export const TONE_CLASSES = {
  info: "bg-status-info-bg text-status-info-text ring-status-info-border",
  warning: "bg-status-warning-bg text-status-warning-text ring-status-warning-border",
  danger: "bg-status-danger-bg text-status-danger-text ring-status-danger-border",
  success: "bg-status-success-bg text-status-success-text ring-status-success-border",
  purple: "bg-status-purple-bg text-status-purple-text ring-status-purple-border",
  indigo: "bg-status-indigo-bg text-status-indigo-text ring-status-indigo-border",
  teal: "bg-status-teal-bg text-status-teal-text ring-status-teal-border",
  neutral: "bg-status-neutral-bg text-status-neutral-text ring-status-neutral-border",
};

export const TONE_DOT = {
  info: "bg-status-info-dot",
  warning: "bg-status-warning-dot",
  danger: "bg-status-danger-dot",
  success: "bg-status-success-dot",
  purple: "bg-status-purple-dot",
  indigo: "bg-status-indigo-dot",
  teal: "bg-status-teal-dot",
  neutral: "bg-status-neutral-dot",
};

// Raw hex per tone, for SVG stroke / non-Tailwind consumers (progress rings).
export const TONE_HEX = {
  info: "#0EA5E9",
  warning: "#F59E0B",
  danger: "#B3452F",
  success: "#10B981",
  purple: "#8B5CF6",
  indigo: "#6366F1",
  teal: "#14B8A6",
  neutral: "#64748B",
};

export function statusMeta(status, applicationType) {
  const override = TYPE_STATUS_OVERRIDES[applicationType]?.[status];
  if (override) return override;
  return STATUS_META[status] || { label: (status || "Unknown").replace(/_/g, " "), tone: "neutral" };
}

const STATUS_DESCRIPTIONS = {
  submitted: "Application form and documents submitted; awaiting payment verification.",
  driving_school_enrolled: "Enrolled in driving school in accordance with statutory regulations (26 working days).",
  driving_school_graduation: "26-day driving school period complete. Awaiting certificate from staff.",
  driving_school_certificate_ready: "Driving school certificate ready.",
  driving_school_graduated: "Driving school certificate ready; transitioning to the next stage.",
  routed: "Verified and routed to an agent in your LGA.",
  agent_assigned: "An agent has accepted your file and is processing it.",
  agent_accepted: "An agent has accepted your file and is processing it.",
  capture_scheduled: "Biometric capture appointment booked.",
  capturing_scheduled: "Biometric capture appointment booked.",
  scheduled: "Biometric capture appointment booked.",
  captured: "Biometrics completed; licence card in production.",
  capturing_completed: "Biometrics completed; licence card in production.",
  temp_licence_pending_review: "Agent issued a temporary licence; awaiting staff approval.",
  temp_licence_issued: "Temporary licence approved — permanent card is being processed.",
  agent_completed: "Agent processing finished; undergoing quality assurance.",
  staff_final_review: "Undergoing final quality assurance check.",
  in_review: "Undergoing final quality assurance check.",
  in_process: "Your application is being processed.",
  ready_for_pickup: "Driver's licence card printed and ready for pickup.",
  awaiting_customer: "Card ready for handover.",
  completed: "Driver's licence application finished and closed.",
  needs_correction: "Flagged issue with uploaded documents.",
  staff_rejected: "Application formally rejected or disqualified.",
  failed: "Application formally rejected or disqualified.",
  expired: "Validity period has elapsed — apply for a renewal.",
};

// tinted_permit has no licence card and no driving-school leg — override the
// handful of descriptions that otherwise read as "driver's licence" copy.
const TINTED_STATUS_DESCRIPTIONS = {
  ready_for_pickup: "Tinted glass permit ready for pickup.",
  awaiting_customer: "Permit ready for handover.",
  completed: "Tinted glass permit application finished and closed.",
};

// number_plate_* shares tinted_permit's exact status machine shape — same
// override, plate-specific wording.
const NUMBER_PLATE_STATUS_DESCRIPTIONS = {
  ready_for_pickup: "Number plate ready for pickup.",
  awaiting_customer: "Plate ready for handover.",
  completed: "Number plate application finished and closed.",
};

export function isNumberPlateType(applicationType) {
  return Boolean(applicationType) && applicationType.startsWith("number_plate_");
}

// vehicle_particulars is a bundle — its own small status set (see
// VEHICLE_PARTICULARS_TRANSITIONS, app/modules/driver_licence/
// status_machine.py) has no biometrics/driving-school leg like tinted_permit/
// number_plate, but also no "routed"/"agent_assigned" (per-item routing is
// invisible at the bundle level — see ParticularsItemsSummary instead).
const PARTICULARS_STATUS_DESCRIPTIONS = {
  staff_review: "Staff are reviewing your request before it's released to agents.",
  released_to_agents: "Released to eligible agents — waiting for them to accept each document.",
  in_progress: "Agents are working on your documents.",
  awaiting_customer: "All documents are ready. Our team will confirm once they're with you.",
  completed: "Your vehicle particulars renewal is finished and closed.",
  staff_rejected: "Your request was rejected — review the reason below and edit your details to reapply.",
  expired: "One or more documents have expired — apply for a new renewal.",
};

// staff_review is the one status whose description actually differs by
// application type: only fresh applications go through driving-school
// assignment during staff review, renewal/reissue/IDP don't.
export function getStatusDescription(status, applicationType) {
  if (applicationType === "vehicle_particulars" && PARTICULARS_STATUS_DESCRIPTIONS[status]) {
    return PARTICULARS_STATUS_DESCRIPTIONS[status];
  }
  if (status === "staff_review") {
    return applicationType === "fresh"
      ? "Verifying background details & assigning driving school."
      : "Verifying your documents and background details.";
  }
  if (applicationType === "tinted_permit" && TINTED_STATUS_DESCRIPTIONS[status]) {
    return TINTED_STATUS_DESCRIPTIONS[status];
  }
  if (isNumberPlateType(applicationType) && NUMBER_PLATE_STATUS_DESCRIPTIONS[status]) {
    return NUMBER_PLATE_STATUS_DESCRIPTIONS[status];
  }
  return STATUS_DESCRIPTIONS[status] || "";
}

const NEXT_STEP_FRESH = {
  submitted: "Your application is waiting for staff to review it.",
  staff_review: "Staff are checking your documents now.",
  driving_school_enrolled: "Enrolled in driving school in accordance with the law (26 working days) — see countdown below.",
  driving_school_graduation: "Graduation stage: 26-day training complete! Staff are awaiting your certificate from the academy before moving to biometric capture.",
  driving_school_certificate_ready: "Certificate is ready. Your file is being routed to an agent.",
  routed: "An agent in your LGA has been offered your case.",
  agent_accepted: "An agent has accepted and will schedule your biometric capture soon.",
  capture_scheduled: "Your capture appointment is booked — check the date below.",
  capturing_scheduled: "Your capture appointment is booked — check the date below.",
  captured: "Capture's done. Your agent is finishing up processing.",
  capturing_completed: "Capture's done. Your agent is finishing up processing.",
  temp_licence_pending_review: "Your temporary licence has been submitted and is awaiting staff review.",
  temp_licence_issued: "Your temporary licence is ready — see below. Your permanent card is being processed.",
  agent_completed: "Processing is complete — staff are doing a final review.",
  staff_final_review: "Staff are doing a final review before your licence is dispatched.",
  ready_for_pickup: "Your licence is ready for pickup.",
  awaiting_customer: "Your licence is ready. Our team will confirm once it's with you.",
  completed: "Your licence is ready.",
  needs_correction: "One of your documents needs a re-upload — see below.",
  expired: "Your licence has expired — please apply for a renewal.",
};

// Renewal/reissue/IDP now pass through staff_review before routing, same as
// fresh applications — previously they skipped straight from submitted to
// routed. This map covers the states these types are confirmed to reach
// today. capture_scheduled/capturing_scheduled, captured, staff_final_review,
// and expired aren't mapped here yet — whether non-fresh applications can
// actually reach those states depends on the backend state machine and
// should be confirmed there before adding copy, rather than guessing.
const NEXT_STEP_NON_FRESH = {
  submitted: "We're waiting on your documents and payment before staff can review it.",
  staff_review: "Staff are reviewing your documents now.",
  routed: "Your application has been sent to an agent in your LGA.",
  agent_assigned: "An agent has accepted your case and is processing it.",
  agent_accepted: "An agent has accepted your case and is processing it.",
  capturing_completed: "Capture's done. Your agent is finishing up processing.",
  ready_for_pickup: "Your licence is ready for pickup.",
  needs_correction: "One of your documents needs a re-upload — see below.",
  agent_completed: "Processing is complete.",
  awaiting_customer: "Your licence is ready — our team will confirm receipt shortly.",
  completed: "Completed.",
};

// tinted_permit's status machine has no biometrics/driving-school leg and
// skips straight from agent processing to a final review — a distinct
// sequence from both fresh and the other non-fresh DL types, so it needs its
// own copy map rather than falling into NEXT_STEP_NON_FRESH.
const NEXT_STEP_TINTED = {
  submitted: "Your application is waiting for staff to review it.",
  staff_review: "Staff are checking your documents now.",
  routed: "Your application has been sent to an available agent.",
  agent_accepted: "An agent has accepted and is processing your permit.",
  agent_assigned: "An agent is processing your permit.",
  agent_completed: "Processing is complete — staff are doing a final review.",
  staff_final_review: "Staff are doing a final review before your permit is dispatched.",
  awaiting_customer: "Your permit is ready. Our team will confirm once it's with you.",
  completed: "Your permit is ready.",
  needs_correction: "One of your documents needs a re-upload — see below.",
  expired: "Your permit has expired — please submit a new application.",
};

// number_plate_* shares tinted_permit's exact sequence — same map, plate
// wording.
const NEXT_STEP_NUMBER_PLATE = {
  submitted: "Your application is waiting for staff to review it.",
  staff_review: "Staff are checking your documents now.",
  routed: "Your application has been sent to an available agent.",
  agent_accepted: "An agent has accepted and is processing your plate.",
  agent_assigned: "An agent is processing your plate.",
  agent_completed: "Processing is complete — staff are doing a final review.",
  staff_final_review: "Staff are doing a final review before your plate is dispatched.",
  awaiting_customer: "Your plate is ready. Our team will confirm once it's with you.",
  completed: "Your plate is ready.",
  needs_correction: "One of your documents needs a re-upload — see below.",
  expired: "Your plate application has expired — please submit a new application.",
};

// Mirrors VEHICLE_PARTICULARS_TRANSITIONS — the hard front gate means
// "submitted" never implies "about to be routed" the way it does for every
// other type, so this copy is deliberately explicit about staff review
// being a real, required step before release to agents.
const NEXT_STEP_PARTICULARS = {
  submitted: "We're waiting on your documents and payment before staff can review it.",
  staff_review: "Staff are reviewing your request before it's released to agents.",
  released_to_agents: "Released to eligible agents — waiting for them to accept each document.",
  in_progress: "Agents are working on your documents — see each one's status below.",
  awaiting_customer: "All documents are ready. Our team will confirm once they're with you.",
  completed: "Your vehicle particulars renewal is finished.",
  expired: "One or more documents have expired — apply for a new renewal.",
};

// Vehicle services (Vehicle Verification and Central Motor Registry share
// one state machine; Roadworthiness Express and Physical Condition
// Inspection have their own) — mirrors app/modules/driver_licence/
// status_machine.py so none of them reuse driver's-licence wording.
const NEXT_STEP_VERIFICATION = {
  submitted: "We're checking your payment and details before staff review it.",
  staff_review: "Staff are reviewing your request.",
  routed: "Your request has been sent to an available agent.",
  agent_accepted: "An agent is working on it.",
  agent_assigned: "An agent is working on it.",
  needs_correction: "The agent is redoing part of the work. Nothing for you to do.",
  agent_completed: "The agent has finished. Staff are doing a final check.",
  staff_final_review: "Staff are doing a final check before releasing your result.",
  awaiting_customer: "Your result is ready. Our team will confirm once it's with you.",
  completed: "Done. Your result is available below.",
  expired: "This has expired. Start a new request for an up-to-date result.",
};

const NEXT_STEP_RWX = {
  draft: "Pay to confirm your booking.",
  paid: "Your booking is confirmed. Staff will review it shortly.",
  staff_review: "Staff are reviewing your booking.",
  routed: "Your inspection has been assigned to an inspector.",
  agent_accepted: "An inspector will check your vehicle at the booked bay and time.",
  needs_correction: "The inspector is redoing part of the inspection. Nothing for you to do.",
  agent_completed: "The inspection is done. Staff are reviewing the result.",
  staff_final_review: "Staff are reviewing the inspection result.",
  awaiting_customer: "Your roadworthiness certificate is ready. Confirm you've received it below.",
  failed: "Your vehicle didn't pass this inspection. See the details and re-inspection options below.",
  completed: "Done. Your certificate is available below.",
  expired: "Your certificate has expired. Book a new inspection.",
};

const NEXT_STEP_PCI = {
  submitted: "We're checking your payment and details before staff review it.",
  staff_review: "Staff are reviewing your request and arranging the visit.",
  visit_scheduled: "A mechanic will inspect your vehicle at the scheduled time and place.",
  awaiting_mechanic_verdict: "The inspection is done and being graded.",
  staff_final_review: "Staff are finalising your inspection report.",
  awaiting_customer: "Your inspection report is ready. Our team will confirm once it's with you.",
  completed: "Done. Your inspection report is available below.",
  expired: "This report has expired. Book a new inspection for an up-to-date one.",
};

export function getNextStepCopy(application) {
  const status = application.status;
  const type = application.application_type;
  if (status === "staff_rejected") {
    return "This application was rejected — review the reason below and edit your details to reapply.";
  }
  if (type === "vehicle_particulars") {
    return NEXT_STEP_PARTICULARS[status] || "We'll update this as your request moves forward.";
  }
  if (type === "roadworthiness_express") return NEXT_STEP_RWX[status] || "We'll update this as your booking moves forward.";
  if (type === "physical_condition_inspection") return NEXT_STEP_PCI[status] || "We'll update this as your inspection moves forward.";
  if (type?.startsWith("vehicle_verification_") || type === "central_motor_registry") {
    return NEXT_STEP_VERIFICATION[status] || "We'll update this as your request moves forward.";
  }
  const map = type === "tinted_permit"
    ? NEXT_STEP_TINTED
    : isNumberPlateType(type)
    ? NEXT_STEP_NUMBER_PLATE
    : type === "fresh" ? NEXT_STEP_FRESH : NEXT_STEP_NON_FRESH;
  return map[status] || "We'll update this as your application moves forward.";
}

const STAGE_ORDER_FRESH = [
  "submitted", "staff_review", "driving_school_enrolled", "driving_school_graduation", "driving_school_certificate_ready",
  "driving_school_graduated", "routed", "agent_assigned", "agent_accepted", "capture_scheduled",
  "capturing_scheduled", "scheduled", "captured", "capturing_completed", "agent_completed",
  "staff_final_review", "in_review", "ready_for_pickup", "awaiting_customer", "completed",
];

// Same as STAGE_ORDER_FRESH minus the driving-school-only steps — renewal/
// reissue/IDP never enroll in driving school, so including those steps here
// made the progress ring appear to "jump" for those types.
const STAGE_ORDER_OTHER = [
  "submitted", "staff_review", "routed", "agent_assigned", "agent_accepted", "capture_scheduled",
  "capturing_scheduled", "scheduled", "captured", "capturing_completed", "agent_completed",
  "staff_final_review", "in_review", "ready_for_pickup", "awaiting_customer", "completed",
];

// Mirrors the backend's TINTED_PERMIT_TRANSITIONS exactly (app/modules/
// driver_licence/status_machine.py) — no capture/driving-school steps and no
// ready_for_pickup, which don't exist for this application type.
const STAGE_ORDER_TINTED = [
  "submitted", "staff_review", "routed", "agent_accepted", "agent_assigned",
  "agent_completed", "staff_final_review", "awaiting_customer", "completed",
];

// Mirrors VEHICLE_PARTICULARS_TRANSITIONS exactly — "released_to_agents"/
// "in_progress" replace "routed"/"agent_accepted" since routing is per-item,
// not per-bundle.
const STAGE_ORDER_PARTICULARS = [
  "submitted", "staff_review", "released_to_agents", "in_progress", "awaiting_customer", "completed",
];

const STAGE_ORDER_VERIFICATION = [
  "submitted", "staff_review", "routed", "agent_accepted", "agent_assigned", "agent_completed",
  "staff_final_review", "awaiting_customer", "completed",
];
const STAGE_ORDER_RWX = [
  "draft", "paid", "staff_review", "routed", "agent_accepted", "agent_completed",
  "staff_final_review", "awaiting_customer", "completed",
];
const STAGE_ORDER_PCI = [
  "submitted", "staff_review", "visit_scheduled", "awaiting_mechanic_verdict",
  "staff_final_review", "awaiting_customer", "completed",
];

export function getStageProgress(status, applicationType) {
  if (status === "completed") return 1;
  if (status === "staff_rejected" || status === "failed") return 0;
  const order = applicationType === "roadworthiness_express"
    ? STAGE_ORDER_RWX
    : applicationType === "physical_condition_inspection"
    ? STAGE_ORDER_PCI
    : applicationType?.startsWith("vehicle_verification_") || applicationType === "central_motor_registry"
    ? STAGE_ORDER_VERIFICATION
    : applicationType === "vehicle_particulars"
    ? STAGE_ORDER_PARTICULARS
    : applicationType === "tinted_permit" || isNumberPlateType(applicationType)
    ? STAGE_ORDER_TINTED
    : applicationType === "fresh" ? STAGE_ORDER_FRESH : STAGE_ORDER_OTHER;
  const idx = order.indexOf(status);
  if (idx === -1) return 0.05;
  return (idx + 1) / order.length;
}
