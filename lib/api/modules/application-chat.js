import { apiFetch } from "../core/client";

/**
 * Fetch the customer <-> agent live chat thread for an application.
 * Returns { chat_id, application_id, can_chat, status_message, agent_name, customer_name, messages }
 */
export async function getCustomerAgentChat(applicationId) {
  return apiFetch(`/applications/${applicationId}/customer-agent-chat`, {
    method: "GET",
  });
}

/**
 * Send a message in the customer <-> agent live chat thread for an application.
 */
export async function sendCustomerAgentChatMessage(applicationId, { body }) {
  return apiFetch(`/applications/${applicationId}/customer-agent-chat/messages`, {
    method: "POST",
    body: { body },
  });
}
