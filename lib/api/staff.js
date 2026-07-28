import { apiFetch, API_BASE, getToken } from "./client";

/**
 * Staff Review, Verification & Dispatch Routing
 */

/**
 * Download an applicant's biodata as a PDF (`GET
 * /staff/applications/{id}/biodata-pdf`) and save it to the browser. Can't
 * use `apiFetch` here — it always parses the response as JSON/text — so this
 * does its own authenticated fetch and reads the response as a blob.
 */
export async function downloadStaffBiodataPdf(applicationId) {
  const token = getToken();
  const response = await fetch(`${API_BASE}/staff/applications/${applicationId}/biodata-pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Could not generate the biodata PDF (error ${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `biodata_${applicationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * List applications awaiting staff review (`GET /staff/applications`).
 * Optional `status` query parameter (e.g., "?status=submitted").
 * Note: Rejects renewals/reissues and unauthorized roles per verification policy.
 * Legacy, unpaginated, fresh-only. Prefer `getStaffQueue` for new work.
 */
export async function getStaffApplications({ status } = {}) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch(`/staff/applications${query}`, {
    method: "GET",
  });
}

/**
 * Paginated, filterable queue across all application types (`GET /staff/queue`).
 */
export async function getStaffQueue({ status, application_type, state, lga, staff_id, page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (application_type) params.set("application_type", application_type);
  if (state) params.set("state", state);
  if (lga) params.set("lga", lga);
  if (staff_id !== undefined && staff_id !== null) params.set("staff_id", staff_id);
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/staff/queue?${params.toString()}`, {
    method: "GET",
  });
}

/**
 * Retrieve single application details for staff review (`GET /applications/{id}`).
 */
export async function getStaffApplication(applicationId) {
  return apiFetch(`/applications/${applicationId}`, {
    method: "GET",
  });
}

/**
 * Claim an unclaimed application for the current staff member. Once claimed,
 * the application is marked with their staff ID and no other staff member
 * can see or act on it. 403s if it's already claimed by someone else.
 * (`POST /staff/applications/{id}/claim`)
 */
export async function staffClaimApplication(applicationId) {
  return apiFetch(`/staff/applications/${applicationId}/claim`, {
    method: "POST",
  });
}

/**
 * Move `fresh` application from `submitted`/`staff_review` to `staff_review` with verification notes.
 * (`POST /staff/applications/{id}/approve`)
 */
export async function staffApproveApplication(applicationId, { note }) {
  return apiFetch(`/staff/applications/${applicationId}/approve`, {
    method: "POST",
    body: { note },
  });
}

/**
 * Reject application (`-> staff_rejected`) requiring customer correction.
 * (`POST /staff/applications/{id}/reject`)
 */
export async function staffRejectApplication(applicationId, { reason }) {
  return apiFetch(`/staff/applications/${applicationId}/reject`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * Enroll `fresh` application in mandatory driving school (`-> driving_school_enrolled`).
 * The server computes `driving_school_target_date` itself (holiday-aware 26-business-day
 * countdown) — there is no way to pass a target date or driving school name to the backend,
 * only the verification image/screenshot of enrollment.
 * (`POST /staff/applications/{id}/enroll-driving-school`)
 */
export async function staffEnrollDrivingSchool(applicationId, { verification_image_url, screenshot_url, file_url }) {
  const imgUrl = verification_image_url || screenshot_url || file_url || "";
  return apiFetch(`/staff/applications/${applicationId}/enroll-driving-school`, {
    method: "POST",
    body: {
      screenshot_url: imgUrl,
    },
  });
}

/**
 * Upload graduation certificate (`-> driving_school_graduated`) making the application eligible for agent dispatch.
 * (`POST /staff/applications/{id}/upload-driving-school-certificate`)
 */
export async function staffUploadDrivingSchoolCertificate(applicationId, { certificate_url, screenshot_url, file_url }) {
  const certUrl = certificate_url || screenshot_url || file_url || "";
  return apiFetch(`/staff/applications/${applicationId}/upload-driving-school-certificate`, {
    method: "POST",
    body: {
      certificate_url: certUrl,
      file_url: certUrl,
      screenshot_url: certUrl,
    },
  });
}

/**
 * Confirm a driving school certificate the customer already uploaded at
 * submission (`staff_review -> driving_school_certificate_ready -> routed`),
 * skipping enrollment and the countdown entirely. 400s if no certificate
 * document exists on the application.
 * (`POST /staff/applications/{id}/confirm-driving-school-certificate`)
 */
export async function staffConfirmDrivingSchoolCertificate(applicationId) {
  return apiFetch(`/staff/applications/${applicationId}/confirm-driving-school-certificate`, {
    method: "POST",
  });
}

/**
 * Route `driving_school_certificate_ready` application (`-> routed`). Creates `DLRoutingOffer` rows for active agents in the exact same LGA.
 * (`POST /staff/applications/{id}/route`)
 */
export async function staffRouteApplication(applicationId) {
  return apiFetch(`/staff/applications/${applicationId}/route`, {
    method: "POST",
  });
}

/**
 * Record a decision on a single uploaded document, independent of application status.
 * (`POST /staff/documents/{doc_id}/review`)
 */
export async function staffReviewDocument(documentId, { decision, note }) {
  return apiFetch(`/staff/documents/${documentId}/review`, {
    method: "POST",
    body: { decision, note },
  });
}

/**
 * Final review of a completed job (`agent_completed -> staff_final_review -> awaiting_customer`).
 * (`POST /staff/applications/{id}/final-review`)
 */
export async function staffFinalReview(applicationId, { note, decision } = {}) {
  return apiFetch(`/staff/applications/${applicationId}/final-review`, {
    method: "POST",
    body: { note, decision },
  });
}

/**
 * Approve/reject the temporary licence the agent submitted
 * (`temp_licence_pending_review -> temp_licence_issued`, or reject back to `captured`).
 * Approval is what makes the temp licence visible to the customer.
 * (`POST /staff/applications/{id}/review-temporary-licence`)
 */
export async function staffReviewTemporaryLicence(applicationId, { decision, note }) {
  return apiFetch(`/staff/applications/${applicationId}/review-temporary-licence`, {
    method: "POST",
    body: { decision, note },
  });
}

/**
 * Record dispatch details and ensure the application is in `awaiting_customer`.
 * (`POST /staff/applications/{id}/push-to-customer`)
 */
export async function staffPushToCustomer(applicationId, { dispatched_by, tracking_note } = {}) {
  return apiFetch(`/staff/applications/${applicationId}/push-to-customer`, {
    method: "POST",
    body: { dispatched_by, tracking_note },
  });
}

/**
 * Mark the physical licence card ready for pickup and notify the customer
 * (SMS+WhatsApp) — moved here from the agent portal; only staff can trigger
 * this now. Pickup venue/contact still references the assigned agent's VIO
 * office since that's where the card physically is.
 * (`POST /staff/applications/{id}/ready-for-pickup`)
 */
export async function staffReadyForPickup(applicationId) {
  return apiFetch(`/staff/applications/${applicationId}/ready-for-pickup`, {
    method: "POST",
  });
}
