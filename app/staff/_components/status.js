// Staff-facing status labels, shared by the review queue, dashboard and
// application page. Tones map to the kit Badge tones.

export const STAFF_STATUS = {
  submitted: { label: "Awaiting review", tone: "amber" },
  staff_review: { label: "Under verification", tone: "amber" },
  released_to_agents: { label: "Released to agents", tone: "brand" },
  in_progress: { label: "Agents working", tone: "brand" },
  driving_school_enrolled: { label: "In driving school", tone: "neutral" },
  driving_school_graduation: { label: "Awaiting school certificate", tone: "amber" },
  driving_school_certificate_ready: { label: "School complete", tone: "brand" },
  routed: { label: "Routed to agents", tone: "brand" },
  agent_assigned: { label: "Agent assigned", tone: "brand" },
  agent_accepted: { label: "Agent working", tone: "brand" },
  capture_scheduled: { label: "Capture scheduled", tone: "brand" },
  capturing_scheduled: { label: "Capture scheduled", tone: "brand" },
  captured: { label: "Biometrics captured", tone: "brand" },
  capturing_completed: { label: "Biometrics captured", tone: "brand" },
  temp_licence_pending_review: { label: "Temp licence to review", tone: "amber" },
  temp_licence_issued: { label: "Temp licence issued", tone: "brand" },
  agent_completed: { label: "Awaiting final review", tone: "amber" },
  visit_scheduled: { label: "Mechanic visit scheduled", tone: "neutral" },
  awaiting_mechanic_verdict: { label: "Awaiting mechanic's verdict", tone: "amber" },
  staff_final_review: { label: "In final review", tone: "amber" },
  ready_for_pickup: { label: "Ready for pickup", tone: "brand" },
  awaiting_customer: { label: "With customer", tone: "brand" },
  completed: { label: "Completed", tone: "neutral" },
  staff_rejected: { label: "Rejected", tone: "red" },
  needs_correction: { label: "Needs correction", tone: "amber" },
  expired: { label: "Licence expired", tone: "red" },
  approved: { label: "Approved", tone: "brand" },
  rejected: { label: "Rejected", tone: "red" },
};

export function statusMeta(status) {
  return STAFF_STATUS[status] || { label: (status || "Unknown").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()), tone: "neutral" };
}
