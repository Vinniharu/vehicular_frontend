import { apiFetch } from "./client";

/**
 * Customer Support (CS) portal API client.
 */

/**
 * Full, unscoped oversight view of every application in the system —
 * same shape as adminGetApplications but adds customer contact info and
 * a redacted (id/state/lga only) assigned-agent view.
 * (`GET /support/applications`)
 */
export async function getSupportApplications({
  status,
  application_type,
  state,
  lga,
  staff_id,
  page = 1,
  page_size = 20,
} = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (application_type) params.set("application_type", application_type);
  if (state) params.set("state", state);
  if (lga) params.set("lga", lga);
  if (staff_id !== undefined && staff_id !== null) params.set("staff_id", staff_id);
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/support/applications?${params.toString()}`, { method: "GET" });
}

/**
 * Applications whose destination LGA currently has zero active agents.
 * (`GET /support/applications/unassigned`)
 */
export async function getSupportUnassignedApplications({ page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/support/applications/unassigned?${params.toString()}`, { method: "GET" });
}

/**
 * Full application detail: applicant details, assigned staff (full), and
 * assigned agent (redacted — id/state/lga only). (`GET /support/applications/{id}`)
 */
export async function getSupportApplication(applicationId) {
  return apiFetch(`/support/applications/${applicationId}`, { method: "GET" });
}

/**
 * Move an application to a different state/LGA — used when the current
 * one has no agents. Rejects with 400 if the application is already
 * assigned to an agent. (`POST /support/applications/{id}/redirect`)
 */
export async function redirectSupportApplication(applicationId, { state_id, lga_id }) {
  return apiFetch(`/support/applications/${applicationId}/redirect`, {
    method: "POST",
    body: { state_id, lga_id },
  });
}

/**
 * Dashboard aggregate stats. (`GET /support/metrics/overview`)
 */
export async function getSupportMetricsOverview() {
  return apiFetch("/support/metrics/overview", { method: "GET" });
}

/**
 * Ticket queue, defaulting to unclaimed + the caller's own claimed tickets.
 * (`GET /support/tickets`)
 */
export async function getSupportTickets({ status, claimed_by_id, page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (claimed_by_id !== undefined && claimed_by_id !== null) params.set("claimed_by_id", claimed_by_id);
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/support/tickets?${params.toString()}`, { method: "GET" });
}

/**
 * Accept an unclaimed ticket. 403s if already claimed by someone else.
 * (`POST /support/tickets/{id}/claim`)
 */
export async function claimSupportTicket(ticketId) {
  return apiFetch(`/support/tickets/${ticketId}/claim`, { method: "POST" });
}

/**
 * Close a ticket the caller has claimed. (`POST /support/tickets/{id}/close`)
 */
export async function closeSupportTicket(ticketId) {
  return apiFetch(`/support/tickets/${ticketId}/close`, { method: "POST" });
}

/**
 * List support accounts (`GET /admin/support`) — admin-only.
 */
export async function adminGetSupport() {
  return apiFetch("/admin/support", { method: "GET" });
}

/**
 * Create a support account (`POST /admin/support`) — admin-only.
 */
export async function adminCreateSupport({ name, email, phone, temp_password }) {
  return apiFetch("/admin/support", {
    method: "POST",
    body: { name, email, phone, temp_password },
  });
}

/**
 * Deactivate a support account (`PATCH /admin/support/{id}/deactivate`) — admin-only.
 */
export async function adminDeactivateSupport(id) {
  return apiFetch(`/admin/support/${id}/deactivate`, { method: "PATCH" });
}

/**
 * Create a support ticket as a customer (`POST /customers/support/tickets`).
 */
export async function createCustomerSupportTicket({ subject, initial_message, application_id }) {
  return apiFetch("/customers/support/tickets", {
    method: "POST",
    body: { subject, initial_message, application_id },
  });
}

/**
 * List the current customer's own support tickets (`GET /customers/support/tickets`).
 */
export async function getMyCustomerSupportTickets({ page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/customers/support/tickets?${params.toString()}`, { method: "GET" });
}

/**
 * CS-side ticket detail, including customer contact info. (`GET /support/tickets/{id}`)
 */
export async function getSupportTicket(ticketId) {
  return apiFetch(`/support/tickets/${ticketId}`, { method: "GET" });
}

/**
 * Full bundled customer profile — personal info, every application ever
 * submitted, every payment (paid and pending), and wallet balance. Not to
 * be confused with the customer-facing `/customers/support/...` routes
 * below — this is the CS-side lookup of someone else's profile.
 * (`GET /support/customers/{id}`)
 */
export async function getSupportCustomer(customerId) {
  return apiFetch(`/support/customers/${customerId}`, { method: "GET" });
}

/**
 * Full message history for a ticket, oldest first. (`GET /support/tickets/{id}/messages`)
 */
export async function getSupportTicketMessages(ticketId) {
  return apiFetch(`/support/tickets/${ticketId}/messages`, { method: "GET" });
}

/**
 * CS sends a reply on a ticket they've claimed. (`POST /support/tickets/{id}/messages`)
 */
export async function sendTicketMessage(ticketId, { body, attachment_url } = {}) {
  return apiFetch(`/support/tickets/${ticketId}/messages`, {
    method: "POST",
    body: { body, attachment_url },
  });
}

/**
 * The customer's own current chat thread — bundles ticket status with
 * messages so a single poll covers both. (`GET /customers/support/messages`)
 */
export async function getMyChatThread() {
  return apiFetch("/customers/support/messages", { method: "GET" });
}

/**
 * Customer sends a message on the live chat widget. Lazily creates a
 * ticket if none is open. (`POST /customers/support/messages`)
 */
export async function sendCustomerChatMessage({ body, attachment_url } = {}) {
  return apiFetch("/customers/support/messages", {
    method: "POST",
    body: { body, attachment_url },
  });
}

/**
 * Which LGAs currently have active agents, so CS knows where they can/
 * can't redirect a customer. (`GET /support/lga-coverage`)
 */
export async function getSupportLgaCoverage({ state_name } = {}) {
  const params = state_name ? `?state_name=${encodeURIComponent(state_name)}` : "";
  return apiFetch(`/support/lga-coverage${params}`, { method: "GET" });
}

/**
 * The CS<->agent chat thread for an application (agent identity redacted
 * to id/state/lga only). (`GET /support/applications/{id}/agent-chat`)
 */
export async function getSupportAgentChat(applicationId) {
  return apiFetch(`/support/applications/${applicationId}/agent-chat`, { method: "GET" });
}

/**
 * Send a message to the assigned agent. Rejected with 400 if it contains
 * a phone number/email, or if no agent is assigned yet.
 * (`POST /support/applications/{id}/agent-chat/messages`)
 */
export async function sendSupportAgentChatMessage(applicationId, { body }) {
  return apiFetch(`/support/applications/${applicationId}/agent-chat/messages`, {
    method: "POST",
    body: { body },
  });
}

/**
 * Cross-customer, one row per (customer, category[, vehicle[, document_type]])
 * — only the CURRENT document in each group, sorted soonest-expiry-first.
 * (`GET /support/documents/expiring`)
 */
export async function getSupportExpiringDocuments({ category, search, page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/support/documents/expiring?${params.toString()}`, { method: "GET" });
}

/**
 * Every superseded (non-current) document for one customer.
 * (`GET /support/documents/archive`)
 */
export async function getSupportArchivedDocuments(customerId, { page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  params.set("customer_id", customerId);
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/support/documents/archive?${params.toString()}`, { method: "GET" });
}

/**
 * Update a document's expiry date. Reinstates an expired driver's-licence
 * application (flips it back to "completed") when the new date is in the
 * future. (`PATCH /support/documents/{kind}/{docId}/expiry`)
 */
export async function updateSupportDocumentExpiry(kind, docId, expiryDateIso) {
  return apiFetch(`/support/documents/${kind}/${docId}/expiry`, {
    method: "PATCH",
    body: { expiry_date: expiryDateIso },
  });
}

/**
 * Send an expiry-reminder notification to the customer. channels is a
 * subset of ["email", "text"] ("text" dual-sends SMS + WhatsApp).
 * (`POST /support/documents/{kind}/{docId}/notify`)
 */
export async function notifySupportDocumentExpiry(kind, docId, channels) {
  return apiFetch(`/support/documents/${kind}/${docId}/notify`, {
    method: "POST",
    body: { channels },
  });
}
