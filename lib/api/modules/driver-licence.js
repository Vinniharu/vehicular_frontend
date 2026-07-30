import { apiFetch } from "../core/client";

/**
 * Customer Applications & Document Uploads (ENDPOINTS.md Section 5)
 */

/**
 * Submit a new Driver's Licence application (POST /applications/driver-licence).
 * Types: "fresh" | "renewal" | "reissue"
 * Auto-creates live payment_options on success.
 */
export async function submitDriverLicenceApplication({
  application_type,
  first_name, middle_name, last_name,
  date_of_birth, gender,
  state_of_origin, lga_of_origin, origin_state_id, origin_lga_id,
  nationality, marital_status, mothers_maiden_name,
  residential_address, city, country, nin, old_licence_number,
  blood_group, height_cm,
  has_facial_mark, facial_mark_description,
  has_disability, disability_description,
  passport_photo,
  driving_school_certificate_number, validity_period, licence_class,
  state_of_residence, lga, state_id, lga_id,
  next_of_kin_name, next_of_kin_relationship, next_of_kin_phone,
  id_document, driving_school_certificate, documents,
}) {
  return apiFetch("/applications/driver-licence", {
    method: "POST",
    body: {
      application_type,
      first_name, middle_name, last_name,
      date_of_birth, gender,
      state_of_origin, lga_of_origin, origin_state_id, origin_lga_id,
      nationality, marital_status, mothers_maiden_name,
      residential_address, city, country, nin, old_licence_number,
      blood_group, height_cm,
      has_facial_mark, facial_mark_description,
      has_disability, disability_description,
      passport_photo,
      driving_school_certificate_number, validity_period, licence_class,
      state_of_residence, lga, state_id, lga_id,
      next_of_kin_name, next_of_kin_relationship, next_of_kin_phone,
      id_document,
      driving_school_certificate,
      documents: documents || [],
    },
  });
}

/**
 * Upload a file to server-side storage (POST /applications/upload-file) and
 * get back a short URL — used before submission (no application id yet) for
 * passport photo / old licence photo uploads. Never store the raw file
 * contents (e.g. a FileReader base64 data URI) as a file_url value; the
 * backend column is sized for a short storage path, not raw image bytes.
 */
export async function uploadApplicationFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/applications/upload-file", {
    method: "POST",
    body: formData,
  });
}

/**
 * Reapply after a staff rejection (PATCH /applications/{id}/reapply).
 * Only callable when application.status === "staff_rejected".
 * All fields optional — send only what changed.
 */
export async function reapplyApplication(applicationId, payload = {}) {
  return apiFetch(`/applications/${applicationId}/reapply`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * Upload additional documents to an existing application (POST /applications/{id}/documents).
 */
export async function uploadApplicationDocument(applicationId, { doc_type, file_url, screenshot_url }) {
  const url = file_url || screenshot_url || "";
  return apiFetch(`/applications/${applicationId}/documents`, {
    method: "POST",
    body: { doc_type, file_url: url, screenshot_url: url },
  });
}

/**
 * Retrieve full application details (GET /applications/{id}).
 */
export async function getApplication(applicationId) {
  return apiFetch(`/applications/${applicationId}`, { method: "GET" });
}

/**
 * List all applications for the current customer (GET /applications).
 */
export async function getMyApplications() {
  return apiFetch("/applications", { method: "GET" });
}

/**
 * Pay from wallet (POST /applications/{id}/pay-from-wallet).
 */
export async function payFromWalletEndpoint(applicationId, { amount_kobo } = {}) {
  return apiFetch(`/applications/${applicationId}/pay-from-wallet`, {
    method: "POST",
    body: { amount_kobo },
  });
}

/**
 * Initialize a Monnify card checkout for an application's service fee
 * (POST /payments/{id}/initialize). Omit amount_kobo to charge the full
 * remaining balance (existing "Pay with card" behavior); pass it to charge
 * only a partial amount instead — validated server-side against the same
 * minimum/remaining-balance rules as pay-from-wallet. Returns
 * { authorization_url, reference, amount_kobo } — amount_kobo reflects what
 * this specific checkout actually charges.
 */
export async function initializeCardPayment(applicationId, { amount_kobo } = {}) {
  return apiFetch(`/payments/${applicationId}/initialize`, {
    method: "POST",
    body: amount_kobo ? { amount_kobo } : {},
  });
}

/**
 * Verify Monnify transaction (POST /payments/verify).
 */
export async function verifyPaymentTransaction({ reference, application_id } = {}) {
  return apiFetch("/payments/verify", {
    method: "POST",
    body: { reference, application_id },
  });
}

