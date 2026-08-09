import { apiFetch } from "./client";

/**
 * Admin Management Endpoints — Staff & Agents Provisioning (ENDPOINTS.md Section 4)
 * Requires `admin` role Bearer JWT access token.
 */

/**
 * Retrieve all provisioned internal staff accounts (`GET /admin/staff`).
 */
export async function adminGetStaff() {
  return apiFetch("/admin/staff", { method: "GET" });
}

/**
 * Retrieve all provisioned field agent accounts (`GET /admin/agents`).
 */
export async function adminGetAgents() {
  return apiFetch("/admin/agents", { method: "GET" });
}

/**
 * Retrieve full details for a single agent (`GET /admin/agents/{id}`).
 */
export async function adminGetAgent(id) {
  return apiFetch(`/admin/agents/${id}`, { method: "GET" });
}

/**
 * Provision a new internal staff member (`POST /admin/staff`).
 * Payload: { name, email, phone, temp_password }
 */
export async function adminCreateStaff({ name, email, phone, temp_password }) {
  return apiFetch("/admin/staff", {
    method: "POST",
    body: { name, email, phone, temp_password },
  });
}

/**
 * Provision a new field agent linked to a VIO office (`POST /admin/agents`).
 * Payload: { name, email, phone, temp_password, vio_office, state, lga, state_id, lga_id, capabilities, allowed_application_types }
 */
export async function adminCreateAgent({
  name,
  email,
  phone,
  temp_password,
  vio_office,
  state,
  lga,
  state_id,
  lga_id,
  capabilities = ["driver_licence", "roadworthiness"],
  allowed_application_types = null,
}) {
  return apiFetch("/admin/agents", {
    method: "POST",
    body: {
      name,
      email,
      phone,
      temp_password,
      vio_office,
      state,
      lga,
      state_id,
      lga_id,
      capabilities,
      allowed_application_types,
    },
  });
}

/**
 * Restrict which application_type values (fresh/renewal/reissue/
 * international_permit) an agent may be routed/offered
 * (`PATCH /admin/agents/{agentId}/eligibility`). Reachable by both `admin`
 * and `super_admin`. Pass null/empty to lift all restrictions.
 */
export async function adminUpdateAgentEligibility(agentId, allowed_application_types) {
  return apiFetch(`/admin/agents/${agentId}/eligibility`, {
    method: "PATCH",
    body: { allowed_application_types },
  });
}

/**
 * Deactivate a staff account (`PATCH /admin/staff/{id}/deactivate`).
 */
export async function adminDeactivateStaff(id) {
  return apiFetch(`/admin/staff/${id}/deactivate`, { method: "PATCH" });
}

/**
 * Deactivate an agent account (`PATCH /admin/agents/{id}/deactivate`).
 */
export async function adminDeactivateAgent(id) {
  return apiFetch(`/admin/agents/${id}/deactivate`, { method: "PATCH" });
}

/**
 * Revenue summary — total inflow, platform profit, agent service fees /
 * payables, user counts, applications by status (`GET /admin/metrics/overview`).
 */
export async function adminGetMetricsOverview() {
  return apiFetch("/admin/metrics/overview", { method: "GET" });
}

/**
 * Application totals, by status and by type (`GET /admin/metrics/applications`).
 */
export async function adminGetMetricsApplications() {
  return apiFetch("/admin/metrics/applications", { method: "GET" });
}

/**
 * Per-agent jobs accepted/completed and lifetime earnings, unpaginated
 * (`GET /admin/metrics/agents`).
 */
export async function adminGetMetricsAgents() {
  return apiFetch("/admin/metrics/agents", { method: "GET" });
}

/**
 * Wallet counts, total balance, total funded, total spent
 * (`GET /admin/metrics/wallets`).
 */
export async function adminGetMetricsWallets() {
  return apiFetch("/admin/metrics/wallets", { method: "GET" });
}

/**
 * Active agents / pending applications per LGA (`GET /admin/metrics/lga-coverage`).
 * Expensive when called unfiltered (iterates every LGA nationally) — only
 * call this on demand, never on initial page load.
 */
export async function adminGetMetricsLgaCoverage({ state_name } = {}) {
  const params = state_name ? `?${new URLSearchParams({ state_name }).toString()}` : "";
  return apiFetch(`/admin/metrics/lga-coverage${params}`, { method: "GET" });
}

/**
 * Full, unscoped view of every application in the system regardless of
 * claim/ownership state — the admin oversight companion to the staff queue
 * (which hides applications another staff member has claimed). Each row
 * includes both `assigned_agent` and `assigned_staff`.
 * (`GET /admin/applications`)
 */
export async function adminGetApplications({
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
  return apiFetch(`/admin/applications?${params.toString()}`, { method: "GET" });
}

/**
 * Failed agent disbursements needing attention (`GET /admin/transfers/failed`).
 */
export async function adminGetFailedTransfers() {
  return apiFetch("/admin/transfers/failed", { method: "GET" });
}

/**
 * Paginated, filterable per-payment revenue log (`GET /admin/revenue/transactions`).
 */
export async function adminGetRevenueTransactions({
  page = 1,
  page_size = 20,
  status,
  application_type,
  from_date,
  to_date,
} = {}) {
  const params = new URLSearchParams({ page, page_size });
  if (status) params.set("status", status);
  if (application_type) params.set("application_type", application_type);
  if (from_date) params.set("from_date", from_date);
  if (to_date) params.set("to_date", to_date);
  return apiFetch(`/admin/revenue/transactions?${params.toString()}`, { method: "GET" });
}

export async function getAdminRelocationRequests() {
  return apiFetch("/admin/relocation-requests", { method: "GET" });
}

export async function approveAgentRelocation(agentId) {
  return apiFetch(`/admin/agents/${agentId}/approve-relocation`, { method: "POST" });
}

export async function rejectAgentRelocation(agentId) {
  return apiFetch(`/admin/agents/${agentId}/reject-relocation`, { method: "POST" });
}

export const adminRejectRelocation = async (agentId) => {
  return await apiFetch(`/admin/agents/${agentId}/reject-relocation`, {
    method: "POST",
  });
};

export const getAdminSettings = async () => {
  return await apiFetch("/admin/settings");
};

export const updateAdminSettings = async (data) => {
  return await apiFetch("/admin/settings", {
    method: "PATCH",
    body: data,
  });
};

export const getAdminPricing = async () => {
  return await apiFetch("/admin/pricing");
};

export const updateAdminPricing = async (data) => {
  return await apiFetch("/admin/pricing", {
    method: "PATCH",
    body: data,
  });
};

export const updateAgentCommission = async (agentId, commission_kobo, application_type = null) => {
  return await apiFetch(`/admin/agents/${agentId}/commission`, {
    method: "PATCH",
    body: { commission_kobo, application_type },
  });
};

export const bulkUpdateAgentCommission = async (commission_kobo, application_type = null) => {
  return await apiFetch(`/admin/agents/commission/bulk-all`, {
    method: "PATCH",
    body: { commission_kobo, application_type },
  });
};
