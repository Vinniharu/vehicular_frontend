import { apiFetch, API_BASE, getToken } from "../core/client";

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
  // tinted_permit only — vehicle-centric, not LGA-specific. state is
  // derived server-side from the vehicle, never sent directly.
  vehicle_id, justification,
  // number_plate_* only — vehicle-centric like tinted_permit, but state_id
  // IS sent directly (not derived from the vehicle). use_type is accepted
  // for backward compatibility but IGNORED server-side for number_plate_*
  // — it's now derived from the vehicle's stored vehicle_category (see
  // getNumberPlateFee for the live, flat, state-aware price).
  use_type, previous_owner_details,
  // number_plate_new / number_plate_change_of_ownership / number_plate_fancy only.
  applicant_phone, former_registration_number,
  // number_plate_fancy only — always required for that type; sent
  // regardless of type but ignored server-side for every other one.
  fancy_plate_number,
  // number_plate_dealership only — no vehicle at all, a company/dealership
  // identity instead. applicant_email is shared with central_motor_registry
  // on the backend model (deliberately distinct from the customer's account
  // email/User.email).
  applicant_email, dealership_name, is_registered_company,
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
      vehicle_id, justification,
      use_type, previous_owner_details,
      applicant_phone, former_registration_number,
      fancy_plate_number,
      applicant_email, dealership_name, is_registered_company,
    },
  });
}

/**
 * Submit a Vehicle Particulars Renewal bundle (POST /applications/vehicle-particulars).
 * A genuinely different shape from submitDriverLicenceApplication — a
 * customer picks a SUBSET of document types to renew, each with its own
 * evidence uploads, summed into one payment. items: [{ document_type,
 * evidence_documents: [{ doc_type, file_url }] }]. No is_commercial_use
 * field — hackney_permit eligibility and pricing now derive entirely from
 * the selected vehicle's stored vehicle_category.
 */
export async function submitVehicleParticularsApplication({ vehicle_id, items }) {
  return apiFetch("/applications/vehicle-particulars", {
    method: "POST",
    body: { vehicle_id, items },
  });
}

/**
 * Submit an ECMR application
 * (POST /applications/central-motor-registry). Its own dedicated endpoint
 * (not routed through submitDriverLicenceApplication) — vehicle-centric
 * with category-based pricing, one required document, no location
 * restriction on which agent picks it up.
 */
export async function submitCentralMotorRegistryApplication({ vehicle_id, state_id, nin, applicant_email, vehicle_licence }) {
  return apiFetch("/applications/central-motor-registry", {
    method: "POST",
    body: { vehicle_id, state_id, nin, applicant_email, vehicle_licence },
  });
}

/**
 * Per-document renewal eligibility for one vehicle
 * (GET /applications/vehicle-particulars/eligibility?vehicle_id=...) — powers
 * the apply wizard's document picker. Unlike getParticularsItemPricing
 * (public, vehicle-less, just prices), this is authenticated and vehicle-
 * specific: it also reports whether each document type is blocked right now
 * because an earlier request for it is still in flight, or because it isn't
 * due for renewal yet, distinct from the "unpriced" reason. A document type
 * a customer has never had approved on this vehicle before is always
 * eligible (assuming priced) — the expiry gate only applies from the second
 * request onward.
 */
export async function getVehicleParticularsEligibility(vehicleId) {
  return apiFetch(`/applications/vehicle-particulars/eligibility?vehicle_id=${encodeURIComponent(vehicleId)}`, {
    method: "GET",
  });
}

/**
 * Book a Roadworthiness Express inspection (POST /applications/roadworthiness-express).
 * vehicle_category is deliberately NOT sent — it's read server-side from the
 * Vehicle row itself, same convention vehicle-particulars/tinted_permit use.
 * booking_date is a "YYYY-MM-DD" string. prior_application_id is set only
 * for a free re-inspection rebook (see the backend endpoint's docstring for
 * the exact eligibility check — an invalid/expired id silently falls
 * through to a normal paid booking, never an error).
 */
export async function submitRoadworthinessApplication({
  vehicle_id, bay_id, slot_template_id, booking_date, papers, prior_application_id,
}) {
  return apiFetch("/applications/roadworthiness-express", {
    method: "POST",
    body: { vehicle_id, bay_id, slot_template_id, booking_date, papers, prior_application_id },
  });
}

/**
 * Submit a Vehicle Verification check (POST /applications/vehicle-verification).
 * Deliberately does NOT reference an owned Vehicle row -- make/model/year/
 * colour/plate are freeform, since a pre-purchase customer often doesn't own
 * the car yet. chassis_number and customs_duty_certificate are required by
 * the backend only when check_type is "customs_duty" (enforced server-side,
 * not duplicated here).
 */
export async function submitVehicleVerificationApplication({
  state_id, check_type, plate_number, make, model, year, colour, reason,
  chassis_number, customs_duty_certificate,
}) {
  return apiFetch("/applications/vehicle-verification", {
    method: "POST",
    body: { state_id, check_type, plate_number, make, model, year, colour, reason, chassis_number, customs_duty_certificate },
  });
}

/**
 * Download the released Vehicle Verification report as a PDF (`GET
 * /applications/{id}/vehicle-verification/report.pdf`) and save it to the
 * browser. Can't use apiFetch -- it always parses the response as JSON/
 * text -- so this does its own authenticated fetch and reads the response
 * as a blob, same pattern as downloadRwxCertificatePdf below.
 */
export async function downloadVehicleVerificationReportPdf(applicationId) {
  const token = getToken();
  const response = await fetch(`${API_BASE}/applications/${applicationId}/vehicle-verification/report.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Could not download the report (error ${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vehicle_verification_${applicationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Physical Condition Inspection booking (POST
 * /applications/physical-condition-inspection) — a full mechanical
 * inspection, distinct from Vehicle Verification's identity/papers check.
 * Unlike Vehicle Verification, lga_id is required (this service is
 * mobile-to-the-vehicle — a field mechanic travels to the vehicle via a
 * no-login link staff send them). Flat, state-tiered pricing (see
 * getServicePricing, slug "physical-condition-inspection") —
 * vehicle_category is collected but purely informational (helps the
 * mechanic know what to expect), not a pricing key.
 */
export async function submitPhysicalConditionInspectionApplication({
  state_id, lga_id, whose_vehicle, plate_number, make, model, year, mileage,
  vehicle_category, seller_name, seller_phone, location_address,
  preferred_date, preferred_time, reason, supporting_document,
}) {
  return apiFetch("/applications/physical-condition-inspection", {
    method: "POST",
    body: {
      state_id, lga_id, whose_vehicle, plate_number, make, model, year, mileage,
      vehicle_category, seller_name, seller_phone, location_address,
      preferred_date, preferred_time, reason, supporting_document,
    },
  });
}

/**
 * Download the released Physical Condition Inspection report as a PDF (GET
 * /applications/{id}/physical-condition-inspection/report.pdf) — same
 * blob-download pattern as downloadVehicleVerificationReportPdf above.
 */
export async function downloadPciReportPdf(applicationId) {
  const token = getToken();
  const response = await fetch(`${API_BASE}/applications/${applicationId}/physical-condition-inspection/report.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Could not download the report (error ${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `physical_condition_inspection_${applicationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * The customer's own path off staff_rejected for a Roadworthiness Express
 * booking (POST /applications/{id}/roadworthiness-express/reschedule) --
 * picks a new bay/slot/date and moves staff_rejected -> paid with no second
 * charge (the original payment stays valid). Only valid from staff_rejected.
 */
export async function rescheduleRoadworthinessApplication(applicationId, { bay_id, slot_template_id, booking_date }) {
  return apiFetch(`/applications/${applicationId}/roadworthiness-express/reschedule`, {
    method: "POST",
    body: { bay_id, slot_template_id, booking_date },
  });
}

/**
 * The customer's own confirm-receipt action for a RWX certificate
 * (POST /applications/{id}/roadworthiness-express/confirm-receipt) —
 * awaiting_customer -> completed. Deliberately separate from the shared
 * staff-only /applications/{id}/confirm-receipt used by every other type;
 * see the backend endpoint's docstring for why RWX doesn't reuse it.
 */
export async function confirmRwxCertificateReceipt(applicationId) {
  return apiFetch(`/applications/${applicationId}/roadworthiness-express/confirm-receipt`, {
    method: "POST",
  });
}

/**
 * Download the issued Roadworthiness certificate as a PDF (`GET
 * /applications/{id}/roadworthiness-express/certificate.pdf`) and save it
 * to the browser. Can't use apiFetch — it always parses the response as
 * JSON/text — so this does its own authenticated fetch and reads the
 * response as a blob, same pattern as downloadStaffBiodataPdf.
 */
export async function downloadRwxCertificatePdf(applicationId) {
  const token = getToken();
  const response = await fetch(`${API_BASE}/applications/${applicationId}/roadworthiness-express/certificate.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Could not download the certificate (error ${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rwx_certificate_${applicationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Vehicle-scoped renewal eligibility for tinted_permit
 * (GET /applications/tinted-permit/eligibility?vehicle_id=...) — same
 * first-time-exempt / in-flight / 30-day-window shape as
 * getVehicleParticularsEligibility, but a single {eligible, reason, ...}
 * object rather than a per-document-type list, since tinted_permit has no
 * document-type picker (it's one document).
 */
export async function getTintedPermitEligibility(vehicleId) {
  return apiFetch(`/applications/tinted-permit/eligibility?vehicle_id=${encodeURIComponent(vehicleId)}`, {
    method: "GET",
  });
}

/**
 * Customer-scoped eligibility for fresh/renewal/reissue/international_permit
 * (GET /applications/driver-licence/eligibility) — all four types in one
 * call, since the apply wizard's step-1 type picker renders all four tiles
 * at once. No vehicle_id — a driver's licence isn't tied to a vehicle.
 */
export async function getDriverLicenceEligibility() {
  return apiFetch("/applications/driver-licence/eligibility", { method: "GET" });
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
 * Attach an already-uploaded file (via uploadApplicationFile) to an
 * application as a document (POST /applications/{id}/documents). Customer-
 * or assigned-agent-callable — used by the agent portal for interim
 * progress evidence on types like tinted_permit that don't have a
 * dedicated interim-proof endpoint.
 */
export async function addApplicationDocument(applicationId, { doc_type, file_url }) {
  return apiFetch(`/applications/${applicationId}/documents`, {
    method: "POST",
    body: { doc_type, file_url },
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
export async function getMyApplications({ sort } = {}) {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return apiFetch(`/applications${qs ? `?${qs}` : ""}`, { method: "GET" });
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

/**
 * Published driver's licence price list (GET /applications/driver-licence/fee-schedule).
 * Unauthenticated - used by the Services page to resolve a live price for
 * the Driver's Licence card instead of hardcoding one, and by the apply
 * wizard's pre-submission cost preview once a state is selected.
 * state_id is optional - omitted, prices resolve through the general tier.
 */
export async function getDriverLicenceFeeSchedule({ state_id } = {}) {
  const params = state_id ? `?${new URLSearchParams({ state_id })}` : "";
  return apiFetch(`/applications/driver-licence/fee-schedule${params}`, { method: "GET" });
}

/**
 * Live, flat, state-aware price for one number_plate_* type (including
 * number_plate_fancy, its own standalone flat-priced type — no surcharge
 * parameter needed)
 * (GET /applications/number-plate/fee?application_type&vehicle_id&state_id).
 * Call this once both a vehicle and a state are selected in the wizard.
 */
export async function getNumberPlateFee({ application_type, vehicle_id, state_id }) {
  const params = new URLSearchParams({
    application_type,
    vehicle_id: String(vehicle_id),
    state_id: String(state_id),
  });
  return apiFetch(`/applications/number-plate/fee?${params.toString()}`, { method: "GET" });
}

