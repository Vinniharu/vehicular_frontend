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
