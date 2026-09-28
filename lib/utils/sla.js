export const COMPLETED_STATUSES = [
  "completed",
  "delivered",
  "permanent_licence_issued",
  "issued",
  "verified",
  "passed",
  "failed",
  "staff_rejected",
  "ready_for_pickup",
  "awaiting_customer",
  "cancelled",
  "expired",
  "agent_completed",
  "staff_final_review",
];

export function hasAgentUploadedAllDocuments(app) {
  if (!app) return false;
  const status = (app.status || "").toLowerCase();
  if (COMPLETED_STATUSES.includes(status)) {
    return true;
  }
  const appType = (app.application_type || "").toLowerCase();
  const docs = app.documents || [];

  if (appType === "vehicle_particulars") {
    const items = app.items || [];
    if (items.length === 0) return false;
    // An item is uploaded if its status is agent_completed, approved, or rejected (revision requested after upload),
    // or if a final document has been uploaded for it
    return items.every((it) =>
      ["agent_completed", "approved", "rejected"].includes(it.status) ||
      docs.some((d) => d.doc_type === `${it.document_type}_final` || d.doc_type === "vehicle_particulars_proof")
    );
  }

  if (appType === "fresh") {
    // For fresh DL, agent uploads temp licence or permanent licence proof
    if (
      app.temporary_licence?.licence_number ||
      app.temporary_licence?.document_url ||
      app.permanent_licence?.licence_number ||
      app.permanent_licence?.document_url ||
      ["temp_licence_pending_review", "temp_licence_issued"].includes(status) ||
      docs.some((d) => ["temporary_licence", "finished_licence_card", "proof"].includes(d.doc_type))
    ) {
      return true;
    }
    return false;
  }

  if (appType === "central_motor_registry") {
    return docs.some((d) => d.doc_type === "central_motor_registry_certificate");
  }

  if (
    appType.includes("vehicle_verification") ||
    ["physical_condition_inspection", "vehicle_verification_registration_history", "vehicle_verification_customs_duty"].includes(appType)
  ) {
    return Boolean(app.verification_detail?.verdict || app.verification_detail?.completed_at);
  }

  if (appType === "roadworthiness_express" || appType.includes("roadworthiness")) {
    return Boolean(app.rwx_checklist_items && app.rwx_checklist_items.length > 0);
  }

  // All other types: tinted_permit, number_plate_*, renewal, reissue, international_permit, etc.
  if (
    app.permanent_licence?.licence_number ||
    app.permanent_licence?.document_url ||
    docs.some((d) => ["finished_licence_card", "proof", "tinted_permit_proof", "plate_proof"].includes(d.doc_type))
  ) {
    return true;
  }

  return false;
}
