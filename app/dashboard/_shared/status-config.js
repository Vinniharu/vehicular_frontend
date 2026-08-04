// Single source of truth for DL application status display, replacing the
// three status maps previously duplicated (and drifted) across
// dashboard/page.jsx, apply/page.jsx, and apply/[id]/page.jsx.

export const STATUS_META = {
  submitted: { label: "Submitted", tone: "info" },
  staff_review: { label: "Under staff review", tone: "warning" },
  driving_school_enrolled: { label: "Driving school enrolled", tone: "purple" },
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
  ready_for_pickup: { label: "Ready for pickup", tone: "success" },
  awaiting_customer: { label: "Ready — confirm receipt", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  needs_correction: { label: "Action required", tone: "warning" },
  staff_rejected: { label: "Rejected", tone: "danger" },
  failed: { label: "Rejected", tone: "danger" },
  expired: { label: "Licence expired", tone: "danger" },
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

export function statusMeta(status) {
  return STATUS_META[status] || { label: (status || "Unknown").replace(/_/g, " "), tone: "neutral" };
}

const STATUS_DESCRIPTIONS = {
  submitted: "Application form and documents submitted; awaiting payment verification.",
  driving_school_enrolled: "Enrolled in accredited driving school training.",
  driving_school_certificate_ready: "Driving school completed and certificate ready.",
  driving_school_graduated: "Driving school training completed; transitioning to the next stage.",
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
  awaiting_customer: "Card ready; please confirm receipt upon pickup.",
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
  awaiting_customer: "Permit ready; please confirm receipt upon pickup.",
  completed: "Tinted glass permit application finished and closed.",
};

// staff_review is the one status whose description actually differs by
// application type: only fresh applications go through driving-school
// assignment during staff review, renewal/reissue/IDP don't.
export function getStatusDescription(status, applicationType) {
  if (status === "staff_review") {
    return applicationType === "fresh"
      ? "Verifying background details & assigning driving school."
      : "Verifying your documents and background details.";
  }
  if (applicationType === "tinted_permit" && TINTED_STATUS_DESCRIPTIONS[status]) {
    return TINTED_STATUS_DESCRIPTIONS[status];
  }
  return STATUS_DESCRIPTIONS[status] || "";
}

const NEXT_STEP_FRESH = {
  submitted: "Your application is waiting for staff to review it.",
  staff_review: "Staff are checking your documents now.",
  driving_school_enrolled: "You're enrolled in driving school — see your countdown below.",
  driving_school_certificate_ready: "School's done. Your file is being routed to an agent.",
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
  awaiting_customer: "Your licence is ready — please confirm you've received it below.",
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
  awaiting_customer: "Your permit is ready — please confirm you've received it below.",
  completed: "Your permit is ready.",
  needs_correction: "One of your documents needs a re-upload — see below.",
  expired: "Your permit has expired — please submit a new application.",
};

export function getNextStepCopy(application) {
  const status = application.status;
  const type = application.application_type;
  if (status === "staff_rejected") {
    return "This application was rejected — review the reason below and edit your details to reapply.";
  }
  const map = type === "tinted_permit" ? NEXT_STEP_TINTED : type === "fresh" ? NEXT_STEP_FRESH : NEXT_STEP_NON_FRESH;
  return map[status] || "We'll update this as your application moves forward.";
}

const STAGE_ORDER_FRESH = [
  "submitted", "staff_review", "driving_school_enrolled", "driving_school_certificate_ready",
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

export function getStageProgress(status, applicationType) {
  if (status === "completed") return 1;
  if (status === "staff_rejected" || status === "failed") return 0;
  const order = applicationType === "tinted_permit"
    ? STAGE_ORDER_TINTED
    : applicationType === "fresh" ? STAGE_ORDER_FRESH : STAGE_ORDER_OTHER;
  const idx = order.indexOf(status);
  if (idx === -1) return 0.05;
  return (idx + 1) / order.length;
}
