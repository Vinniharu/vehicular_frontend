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

export const TONE_CLASSES = {
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  // Retuned from stock Tailwind red to the design-tokens "ink stamp" red
  // (lib/design-tokens.ts colors.status.danger) — reads as an official
  // rejection stamp rather than a generic error color.
  danger: "bg-[#FBF1EE] text-[#8A3320] ring-[#E8C4B8]",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const TONE_DOT = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-[#B3452F]",
  success: "bg-emerald-500",
  purple: "bg-violet-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  neutral: "bg-slate-400",
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

// staff_review is the one status whose description actually differs by
// application type: only fresh applications go through driving-school
// assignment during staff review, renewal/reissue/IDP don't.
export function getStatusDescription(status, applicationType) {
  if (status === "staff_review") {
    return applicationType === "fresh"
      ? "Verifying background details & assigning driving school."
      : "Verifying your documents and background details.";
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

export function getNextStepCopy(application) {
  const status = application.status;
  const type = application.application_type;
  if (status === "staff_rejected") {
    return "This application was rejected — review the reason below and edit your details to reapply.";
  }
  const map = type === "fresh" ? NEXT_STEP_FRESH : NEXT_STEP_NON_FRESH;
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

export function getStageProgress(status, applicationType) {
  if (status === "completed") return 1;
  if (status === "staff_rejected" || status === "failed") return 0;
  const order = applicationType === "fresh" ? STAGE_ORDER_FRESH : STAGE_ORDER_OTHER;
  const idx = order.indexOf(status);
  if (idx === -1) return 0.05;
  return (idx + 1) / order.length;
}
