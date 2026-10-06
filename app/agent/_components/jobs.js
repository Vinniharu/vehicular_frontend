// Shared job logic for the agent portal: service names, which bucket a job
// sits in (to do / waiting / done) and the one next step the agent should
// take. Used by the offers page, the jobs list and the job page so they all
// say the same thing.

export const SERVICE_LABELS = {
  fresh: "New driver's licence",
  renewal: "Licence renewal",
  reissue: "Licence replacement",
  international_permit: "International driving permit",
  tinted_permit: "Tinted glass permit",
  number_plate_new: "New number plate",
  number_plate_replacement: "Replacement plate",
  number_plate_change_of_ownership: "Change of ownership",
  number_plate_fancy: "Custom plate",
  number_plate_dealership: "Dealership plates",
  vehicle_particulars: "Vehicle papers",
  vehicle_verification_registration_history: "Registration history check",
  vehicle_verification_customs_duty: "Customs duty check",
  central_motor_registry: "Central Motor Registry",
  roadworthiness_express: "Roadworthiness inspection",
};

export const PARTICULAR_DOC_LABELS = {
  vehicle_licence: "Vehicle licence",
  road_worthiness: "Roadworthiness certificate",
  proof_of_ownership: "Proof of ownership",
  insurance_third_party: "Third-party insurance",
  hackney_permit: "Hackney permit",
};

export function serviceLabel(type) {
  if (!type) return "Service";
  return SERVICE_LABELS[type] || type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function jobId(app) {
  const raw = app?.raw_id ?? app?.id;
  return typeof raw === "string" ? raw.replace(/^app_/, "") : raw;
}

export function jobHref(app) {
  const id = jobId(app);
  return app?.application_type === "roadworthiness_express" ? `/agent/rwx/${id}` : `/agent/applications/${id}`;
}

export function applicantName(app) {
  const d = app?.applicant_details || {};
  return (
    app?.applicant_name ||
    d.account_name ||
    [app?.first_name || d.first_name, app?.middle_name || d.middle_name, app?.last_name || d.last_name].filter(Boolean).join(" ") ||
    "Customer"
  );
}

export const isNumberPlate = (type) => Boolean(type?.startsWith("number_plate_"));
export const isVerification = (type) => Boolean(type?.startsWith("vehicle_verification_"));
export const isDlRenewalFamily = (type) => ["renewal", "reissue", "international_permit"].includes(type);
const CUSTOMER_FIXABLE = (type) => isDlRenewalFamily(type) || type === "tinted_permit" || isNumberPlate(type);

// Document types an agent hands in as the finished work.
export const AGENT_DELIVERABLE_DOC_TYPES = [
  "finished_licence_card",
  "permanent_driver_licence",
  "vehicle_particulars_proof",
  "central_registry_certificate",
  "registration_history_evidence",
  "customs_duty_evidence",
  "vv_registry_evidence",
  "vv_customs_evidence",
];

const DONE_STATUSES = ["completed", "awaiting_customer", "ready_for_pickup", "expired", "failed", "cancelled", "staff_rejected"];
const REVIEW_STATUSES = ["agent_completed", "staff_final_review"];

// needs_correction means two different things: staff sent the agent's work
// back (the agent fixes it), or the agent flagged a customer document (the
// customer fixes it). The status alone can't tell them apart.
export function isStaffRework(app) {
  if (app?.status !== "needs_correction") return false;
  if (!CUSTOMER_FIXABLE(app.application_type)) return true;
  if ((app.documents || []).some((d) => AGENT_DELIVERABLE_DOC_TYPES.includes(d.doc_type) && d.status === "rejected")) return true;
  if (app.permanent_licence?.review_status === "rejected") return true;
  const events = [...(app.events || [])].reverse();
  const lastCorrection = events.find((e) => (e.new_status || e.to_status || e.status) === "needs_correction");
  return (lastCorrection?.note || "").startsWith("Final review rejected");
}

function particularsCounts(app) {
  const items = app.items || [];
  return {
    total: items.length,
    toUpload: items.filter((i) => ["agent_accepted", "evidence_submitted", "submitted", "pending_evidence", "rejected"].includes(i.status)).length,
    rejected: items.filter((i) => i.status === "rejected").length,
    approved: items.filter((i) => i.status === "approved").length,
  };
}

function finishLabel(type) {
  if (type === "fresh") return "Upload the permanent licence";
  if (type === "renewal") return "Upload the renewed licence";
  if (type === "reissue") return "Upload the replacement licence";
  if (type === "international_permit") return "Upload the international permit";
  if (type === "tinted_permit") return "Upload the finished permit";
  if (isNumberPlate(type)) return "Upload a photo of the finished plate";
  if (isVerification(type)) return "Submit the verification result";
  if (type === "central_motor_registry") return "Upload the registry certificate";
  if (type === "roadworthiness_express") return "Complete the inspection checklist";
  return "Upload the finished work";
}

/**
 * Where a job stands for the agent.
 *   bucket: "todo" | "waiting" | "done"
 *   label:  short status for chips
 *   next:   one sentence saying what happens next
 *   tone:   brand | amber | red | neutral (kit Badge tones)
 */
export function jobStage(app) {
  const type = app?.application_type || "";
  const status = app?.status || "";

  if (type === "vehicle_particulars") {
    const c = particularsCounts(app);
    if (c.rejected > 0) return { bucket: "todo", tone: "red", label: "Needs changes", next: `Staff sent back ${c.rejected} document${c.rejected > 1 ? "s" : ""}. Upload a corrected copy.` };
    if (c.toUpload > 0) return { bucket: "todo", tone: "amber", label: "To do", next: `Upload ${c.toUpload} finished document${c.toUpload > 1 ? "s" : ""}.` };
    if (c.total > 0 && c.approved === c.total) return { bucket: "done", tone: "brand", label: "Done", next: "All documents approved." };
    return { bucket: "waiting", tone: "neutral", label: "With staff", next: "Sent to staff for review." };
  }

  if (status === "completed") return { bucket: "done", tone: "brand", label: "Completed", next: "This job is complete." };
  if (status === "awaiting_customer" || status === "ready_for_pickup") return { bucket: "done", tone: "brand", label: "Delivered", next: "Approved by staff and released to the customer." };
  if (DONE_STATUSES.includes(status)) return { bucket: "done", tone: "neutral", label: status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()), next: "No further action needed." };
  if (REVIEW_STATUSES.includes(status)) return { bucket: "waiting", tone: "neutral", label: "With staff", next: "Sent to staff for review. You'll be told if anything needs changing." };

  const deliverableRejected =
    app.permanent_licence?.review_status === "rejected" ||
    (app.documents || []).some((d) => AGENT_DELIVERABLE_DOC_TYPES.includes(d.doc_type) && d.status === "rejected");
  if (type === "fresh" && deliverableRejected && ["captured", "capturing_completed", "temp_licence_issued"].includes(status)) {
    return { bucket: "todo", tone: "red", label: "Needs changes", next: `Staff asked for changes. ${finishLabel(type)} again.` };
  }

  if (status === "needs_correction") {
    if (isStaffRework(app)) return { bucket: "todo", tone: "red", label: "Needs changes", next: `Staff asked for changes. ${finishLabel(type)} again.` };
    return { bucket: "waiting", tone: "amber", label: "With customer", next: "Waiting for the customer to fix the document you flagged." };
  }

  if (type === "fresh") {
    if (["agent_accepted", "agent_assigned"].includes(status)) return { bucket: "todo", tone: "amber", label: "To do", next: "Schedule the customer's biometric capture." };
    if (["capture_scheduled", "capturing_scheduled"].includes(status)) return { bucket: "todo", tone: "amber", label: "Capture booked", next: "Mark the capture as done once the customer has been captured." };
    if (status === "temp_licence_pending_review") return { bucket: "todo", tone: "amber", label: "To do", next: "Temporary licence is with staff. Upload the permanent licence when it's ready." };
    return { bucket: "todo", tone: "amber", label: "To do", next: `${finishLabel(type)} when it's ready.` };
  }

  return { bucket: "todo", tone: "amber", label: "To do", next: `${finishLabel(type)}.` };
}

export { finishLabel };
