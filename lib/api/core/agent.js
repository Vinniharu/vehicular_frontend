import { apiFetch } from "./client";

/**
 * Agent Operations — Offers, Capture, Completion, Banking & Payouts
 * Requires `agent` role Bearer access token.
 */

/**
 * List available job offers dispatched to this agent's LGA (auto-syncs newly-routed applications first).
 * GET /agent/offers
 */
export async function getAgentOffers() {
  return apiFetch("/agent/offers", { method: "GET" });
}

/**
 * Accept a routed offer. Requires a verified bank account on file first.
 * POST /agent/offers/{id}/accept
 */
export async function acceptOffer(offerId) {
  return apiFetch(`/agent/offers/${offerId}/accept`, { method: "POST" });
}

/**
 * Decline an offer so other agents in the LGA can accept it.
 * POST /agent/offers/{id}/decline
 */
export async function declineOffer(offerId, { reason } = {}) {
  return apiFetch(`/agent/offers/${offerId}/decline`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * List this agent's assigned applications with documents/events/payment_status embedded.
 * GET /agent/applications
 */
export async function getAgentApplications({ sort } = {}) {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return apiFetch(`/agent/applications${qs ? `?${qs}` : ""}`, { method: "GET" });
}

/**
 * Schedule biometric capture for an accepted application.
 * POST /agent/applications/{id}/schedule-capturing
 */
export async function scheduleCapturing(applicationId, { capturing_date, scheduled_at, centre_name, note } = {}) {
  return apiFetch(`/agent/applications/${applicationId}/schedule-capturing`, {
    method: "POST",
    body: { capturing_date, scheduled_at, centre_name, note },
  });
}

/**
 * Reassign the capture centre/date on an already-scheduled application (e.g. centre went down).
 * POST /agent/applications/{id}/reassign-capture-centre
 */
export async function reassignCaptureCentre(applicationId, { new_centre_name, new_scheduled_at, reason } = {}) {
  return apiFetch(`/agent/applications/${applicationId}/reassign-capture-centre`, {
    method: "POST",
    body: { new_centre_name, new_scheduled_at, reason },
  });
}

/**
 * Mark biometric capture as completed.
 * POST /agent/applications/{id}/capturing-completed
 */
export async function markCapturingCompleted(applicationId) {
  return apiFetch(`/agent/applications/${applicationId}/capturing-completed`, { method: "POST" });
}

/**
 * Flag a document issue on a renewal/reissue application, sending it back for customer correction.
 * POST /agent/applications/{id}/flag-document-issue
 */
export async function flagDocumentIssue(applicationId, { reason }) {
  return apiFetch(`/agent/applications/${applicationId}/flag-document-issue`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * Upload proof of the permanent licence card. Fresh applications move to `agent_completed`
 * (awaiting staff final review) and require `licence_number`/`expiry_date`; renewal/reissue
 * auto-chain to `awaiting_customer` and don't need those fields.
 * POST /agent/applications/{id}/upload-proof
 */
export async function uploadProof(applicationId, { proof_url, file_url, licence_number, expiry_date, issued_at }) {
  const url = proof_url || file_url || "";
  return apiFetch(`/agent/applications/${applicationId}/upload-proof`, {
    method: "POST",
    body: { proof_url: url, file_url: url, licence_number, expiry_date, issued_at },
  });
}

/**
 * Issue the customer's interim temporary licence (~30 days) right after capture — optional,
 * fresh applications only. Moves the application to `temp_licence_pending_review`, awaiting
 * staff approval before it becomes visible to the customer.
 * POST /agent/applications/{id}/upload-temporary-licence
 */
export async function uploadTemporaryLicence(applicationId, { file_url, licence_number, expiry_date, issued_at }) {
  return apiFetch(`/agent/applications/${applicationId}/upload-temporary-licence`, {
    method: "POST",
    body: { file_url, licence_number, expiry_date, issued_at },
  });
}

/**
 * vehicle_particulars-only job surface — kept separate from getAgentOffers/
 * getAgentApplications (both shaped one-row-per-DLApplication) since a
 * particulars bundle's own assigned_agent_id stays permanently NULL; the
 * real per-document assignment lives on ParticularsItem instead.
 * GET /agent/particulars-offers
 */
export async function getAgentParticularsOffers() {
  return apiFetch("/agent/particulars-offers", { method: "GET" });
}

/**
 * This agent's own accepted/completed/reviewed particulars items — the
 * per-item equivalent of getAgentApplications.
 * GET /agent/particulars-items
 */
export async function getAgentParticularsItems() {
  return apiFetch("/agent/particulars-items", { method: "GET" });
}

/**
 * Accept a particulars item offer. Requires a verified bank account, and
 * counts toward the shared MAX_ACTIVE_AGENT_JOBS cap along with regular
 * DL/tinted/number-plate jobs. Auto-expires sibling offers for THIS item
 * only — other items in the same bundle may still be live for other agents.
 * POST /agent/particulars-offers/{offerId}/accept
 */
export async function acceptParticularsOffer(offerId) {
  return apiFetch(`/agent/particulars-offers/${offerId}/accept`, { method: "POST" });
}

/**
 * Decline a particulars item offer.
 * POST /agent/particulars-offers/{offerId}/decline
 */
export async function declineParticularsOffer(offerId) {
  return apiFetch(`/agent/particulars-offers/${offerId}/decline`, { method: "POST" });
}

/**
 * Upload the finished renewed document for one accepted (or rejected,
 * for re-upload) item. expiry_date is required for every document type
 * except proof_of_ownership (never expires) — staff's final-review approval
 * confirms this date rather than computing its own.
 * POST /agent/particulars-items/{itemId}/upload-final
 */
export async function uploadParticularsItemFinal(itemId, { proof_url, file_url, expiry_date } = {}) {
  const url = proof_url || file_url || "";
  return apiFetch(`/agent/particulars-items/${itemId}/upload-final`, {
    method: "POST",
    body: { proof_url: url, file_url: url, expiry_date },
  });
}

/**
 * Get the agent's current settlement bank account, or {} if none is set.
 * GET /agent/bank-account
 */
export async function getAgentBankAccount() {
  return apiFetch("/agent/bank-account", { method: "GET" });
}

/**
 * Register or update the agent's settlement bank account. The server resolves the
 * account name via Monnify — do not send account_name.
 * POST /agent/bank-account
 */
export async function setAgentBankAccount({ bank_code, account_number }) {
  return apiFetch("/agent/bank-account", {
    method: "POST",
    body: { bank_code, account_number },
  });
}

/**
 * Relocate the agent's working state/LGA (e.g. after a real-world
 * reassignment). Updates both the free-text and id-based location fields
 * server-side so future job routing reflects the new location.
 * PATCH /agent/me/location
 */
export async function updateAgentLocation({ state_id, lga_id, vio_office }) {
  return apiFetch("/agent/location", {
    method: "PUT",
    body: { state_id, lga_id, vio_office },
  });
}

/**
 * Get the agent's internal earnings wallet — balance and transaction history.
 * GET /agent/wallet
 */
export async function getAgentWallet() {
  return apiFetch("/agent/wallet", { method: "GET" });
}

/**
 * List this agent's payout transfer history.
 * GET /agent/transfers
 */
export async function getAgentTransfers() {
  return apiFetch("/agent/transfers", { method: "GET" });
}

/**
 * Dev/debug log of every SMS/WhatsApp message sent to customers on this agent's cases.
 * GET /agent/notifications-log
 */
export async function getAgentNotificationsLog() {
  return apiFetch("/agent/notifications-log", { method: "GET" });
}

/**
 * Manually withdraw funds from the agent's wallet to their settlement bank account.
 * POST /agent/wallet/withdraw
 */
export async function withdrawAgentWallet({ amount_kobo }) {
  return apiFetch("/agent/wallet/withdraw", {
    method: "POST",
    body: { amount_kobo },
  });
}

/**
 * The CS<->agent chat thread for an application assigned to this agent.
 * Shows a generic "Support" label — never an individual CS staffer's identity.
 * GET /agent/applications/{id}/support-chat
 */
export async function getAgentSupportChat(applicationId) {
  return apiFetch(`/agent/applications/${applicationId}/support-chat`, { method: "GET" });
}

/**
 * Send a message to support on this application. Rejected with 400 if it
 * contains a phone number/email.
 * POST /agent/applications/{id}/support-chat/messages
 */
export async function sendAgentSupportChatMessage(applicationId, { body }) {
  return apiFetch(`/agent/applications/${applicationId}/support-chat/messages`, {
    method: "POST",
    body: { body },
  });
}

/**
 * Record ONE Roadworthiness Express checklist item's pass/fail + photo
 * evidence — call repeatedly, once per fixed item, as the agent works
 * through the physical checklist live at the bay. result and evidence_url
 * are always sent together (POST /agent/applications/{id}/roadworthiness-express/checklist/items/{itemKey}).
 */
export async function submitRwxChecklistItem(applicationId, itemKey, { result, evidence_url, notes } = {}) {
  return apiFetch(`/agent/applications/${applicationId}/roadworthiness-express/checklist/items/${itemKey}`, {
    method: "POST",
    body: { result, evidence_url, notes },
  });
}

/**
 * Completeness-gated final submit — 400s listing exactly which items are
 * still missing pass/fail + photo. Produces a DRAFT (agent_completed),
 * never a released certificate — only staff final-review can issue one.
 * (POST /agent/applications/{id}/roadworthiness-express/checklist/submit)
 */
export async function submitRwxChecklist(applicationId) {
  return apiFetch(`/agent/applications/${applicationId}/roadworthiness-express/checklist/submit`, {
    method: "POST",
  });
}

/**
 * Agent's Vehicle Verification checklist submission — produces a DRAFT
 * (agent_completed), never a released verdict; only staff final-review can
 * release it. Required evidence (doc_type "vv_registry_evidence" for
 * registration_history, "vv_customs_evidence" for customs_duty) must
 * already be uploaded via addApplicationDocument before this call, or the
 * backend 400s listing what's missing.
 * (POST /agent/applications/{id}/vehicle-verification/checklist)
 */
export async function submitVehicleVerificationChecklist(applicationId, { is_registered, reported_stolen, has_fines, fine_details, verdict, notes } = {}) {
  return apiFetch(`/agent/applications/${applicationId}/vehicle-verification/checklist`, {
    method: "POST",
    body: { is_registered, reported_stolen, has_fines, fine_details, verdict, notes },
  });
}

/**
 * Agent's ECMR completion submission — a
 * single document (doc_type "central_registry_certificate"), also always
 * a DRAFT (agent_completed); only staff final-review can release it.
 * (POST /agent/applications/{id}/central-motor-registry/complete)
 */
export async function completeCentralMotorRegistryApplication(applicationId, { doc_type = "central_registry_certificate", file_url } = {}) {
  return apiFetch(`/agent/applications/${applicationId}/central-motor-registry/complete`, {
    method: "POST",
    body: { doc_type, file_url },
  });
}
