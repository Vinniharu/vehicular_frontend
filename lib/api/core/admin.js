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
export async function adminCreateStaff({ name, email, phone, temp_password, first_name, middle_name, last_name }) {
  return apiFetch("/admin/staff", {
    method: "POST",
    body: { name, email, phone, temp_password, first_name, middle_name, last_name },
  });
}

/**
 * Provision a new field agent linked to a VIO office (`POST /admin/agents`).
 * Payload: { name, email, phone, temp_password, vio_office, state, lga, state_id, lga_id, capabilities, allowed_application_types, first_name, middle_name, last_name }
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
  first_name,
  middle_name,
  last_name,
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
      first_name,
      middle_name,
      last_name,
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
 * `from_date`/`to_date` (optional, ISO date strings) scope the revenue
 * figures to applications submitted in that window — user/status counts
 * are never date-scoped, same as the backend. Omit both for all-time.
 */
export async function adminGetMetricsOverview({ from_date, to_date } = {}) {
  const params = new URLSearchParams();
  if (from_date) params.set("from_date", from_date);
  if (to_date) params.set("to_date", to_date);
  const qs = params.toString();
  return apiFetch(`/admin/metrics/overview${qs ? `?${qs}` : ""}`, { method: "GET" });
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
  sort,
} = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (application_type) params.set("application_type", application_type);
  if (state) params.set("state", state);
  if (lga) params.set("lga", lga);
  if (staff_id !== undefined && staff_id !== null) params.set("staff_id", staff_id);
  if (sort) params.set("sort", sort);
  params.set("page", page);
  params.set("page_size", page_size);
  return apiFetch(`/admin/applications?${params.toString()}`, { method: "GET" });
}

/**
 * Reassign an application's claimed staff member, or unassign it back to
 * the open queue by passing `staffId: null` (`PATCH /admin/applications/{id}/staff`).
 */
export async function adminReassignStaff(applicationId, staffId) {
  return apiFetch(`/admin/applications/${applicationId}/staff`, {
    method: "PATCH",
    body: { staff_id: staffId },
  });
}

/**
 * Reassign an application to a different field agent, even if one is
 * already assigned (`POST /admin/applications/{id}/reassign-agent`).
 * `agentId` is Agent.id, not User.id.
 */
export async function adminReassignAgent(applicationId, agentId) {
  return apiFetch(`/admin/applications/${applicationId}/reassign-agent`, {
    method: "POST",
    body: { agent_id: agentId },
  });
}

/**
 * Fetch field agents eligible to handle a specific application,
 * filtered by task capabilities and active account status (`GET /admin/applications/{id}/eligible-agents`).
 */
export async function adminGetEligibleAgents(applicationId) {
  return apiFetch(`/admin/applications/${applicationId}/eligible-agents`, { method: "GET" });
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

export async function adminGetErrorEvents({
  page = 1,
  page_size = 50,
  category,
  severity,
  from_date,
  to_date,
} = {}) {
  const params = new URLSearchParams({ page, page_size });
  if (category) params.set("category", category);
  if (severity) params.set("severity", severity);
  if (from_date) params.set("from_date", from_date);
  if (to_date) params.set("to_date", to_date);
  return apiFetch(`/admin/error-events?${params.toString()}`, { method: "GET" });
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

// state_id is optional — omitted, resolves/edits the general (all-states)
// tier. Passed, resolves/edits that state's overrides (falling back to
// general per-row for display when no override exists there).
export const getAdminPricing = async (stateId) => {
  const qs = stateId ? `?${new URLSearchParams({ state_id: stateId })}` : "";
  return await apiFetch(`/admin/pricing${qs}`);
};

export const updateAdminPricing = async (data) => {
  return await apiFetch("/admin/pricing", {
    method: "PATCH",
    body: data,
  });
};

export const deleteDlFeeScheduleRow = async ({ application_type, validity_period, state_id }) => {
  const params = { application_type };
  if (validity_period != null) params.validity_period = validity_period;
  if (state_id != null) params.state_id = state_id;
  return await apiFetch(`/admin/pricing/dl-fee-schedule?${new URLSearchParams(params)}`, { method: "DELETE" });
};

export const deleteServicePriceRow = async ({ slug, state_id }) => {
  const params = { slug };
  if (state_id != null) params.state_id = state_id;
  return await apiFetch(`/admin/pricing/service-prices?${new URLSearchParams(params)}`, { method: "DELETE" });
};

export const deleteParticularsItemPriceRow = async ({ document_type, state_id }) => {
  const params = { document_type };
  if (state_id != null) params.state_id = state_id;
  return await apiFetch(`/admin/pricing/particulars-item-prices?${new URLSearchParams(params)}`, { method: "DELETE" });
};

export const clonePricing = async ({ source_state_id, target_state_id }) => {
  return await apiFetch("/admin/pricing/clone", {
    method: "POST",
    body: { source_state_id: source_state_id ?? null, target_state_id },
  });
};

// The 96-cell (8 service x 12 vehicle category) price grid for number-plate
// and vehicle-particulars renewal — separate from getAdminPricing/
// updateAdminPricing above (different shape, no agent-compensation field).
// Named getAdmin*/updateAdmin* (not the bare getVehicleCategoryPricing) to
// avoid colliding with the public counterpart of the same name exported
// from lib/api/modules/pricing.js — both are re-exported through the same
// "@/lib/api" barrel (lib/api/index.js), so an identical name there is
// ambiguous and can silently resolve to the wrong one.
export const getAdminVehicleCategoryPricing = async (stateId) => {
  const qs = stateId ? `?${new URLSearchParams({ state_id: stateId })}` : "";
  return await apiFetch(`/admin/pricing/vehicle-categories${qs}`);
};

export const updateAdminVehicleCategoryPricing = async (prices, stateId) => {
  return await apiFetch("/admin/pricing/vehicle-categories", {
    method: "PATCH",
    body: { prices, state_id: stateId ?? null },
  });
};

export const deleteAdminVehicleCategoryPriceRow = async ({ service_key, vehicle_category, state_id }) => {
  const params = { service_key, vehicle_category };
  if (state_id != null) params.state_id = state_id;
  return await apiFetch(`/admin/pricing/vehicle-categories?${new URLSearchParams(params)}`, { method: "DELETE" });
};

export const updateAgentCommission = async (agentId, commission_kobo, application_type = null) => {
  return await apiFetch(`/admin/agents/${agentId}/commission`, {
    method: "PATCH",
    body: { commission_kobo, application_type },
  });
};

export const bulkUpdateAgentCommission = async (commission_kobo, application_type = null, only_never_disbursed = false) => {
  return await apiFetch(`/admin/agents/commission/bulk-all`, {
    method: "PATCH",
    body: { commission_kobo, application_type, only_never_disbursed },
  });
};

/**
 * Roadworthiness Express bay directory — admin CRUD (`/admin/rwx/bays`).
 * No location/office concept existed anywhere before this; see
 * app/models/rwx.py (backend) for the full rationale.
 */
export async function adminListBays(stateId) {
  const qs = stateId ? `?${new URLSearchParams({ state_id: stateId })}` : "";
  return apiFetch(`/admin/rwx/bays${qs}`, { method: "GET" });
}

export async function adminCreateBay({ name, address, state_id, lga_id }) {
  return apiFetch("/admin/rwx/bays", { method: "POST", body: { name, address, state_id, lga_id } });
}

export async function adminUpdateBay(bayId, payload) {
  return apiFetch(`/admin/rwx/bays/${bayId}`, { method: "PATCH", body: payload });
}

export async function adminDeleteBay(bayId) {
  return apiFetch(`/admin/rwx/bays/${bayId}`, { method: "DELETE" });
}

export async function adminCreateBaySlot(bayId, { label, start_time, end_time, capacity }) {
  return apiFetch(`/admin/rwx/bays/${bayId}/slots`, { method: "POST", body: { label, start_time, end_time, capacity } });
}

export async function adminUpdateBaySlot(bayId, slotId, payload) {
  return apiFetch(`/admin/rwx/bays/${bayId}/slots/${slotId}`, { method: "PATCH", body: payload });
}

export async function adminDeleteBaySlot(bayId, slotId) {
  return apiFetch(`/admin/rwx/bays/${bayId}/slots/${slotId}`, { method: "DELETE" });
}

/** Replaces the FULL set of agents assigned to a bay. */
export async function adminUpdateBayAgents(bayId, agentIds) {
  return apiFetch(`/admin/rwx/bays/${bayId}/agents`, { method: "PATCH", body: { agent_ids: agentIds } });
}

/**
 * The 24 Physical Condition Inspection checklist keys, each left-joined
 * against whatever reference image an admin has already uploaded — a null
 * image_url means "no reference configured yet" (the documented default,
 * not an error). These are the "does your oil look like this 🟢 or this 🔴"
 * comparison photos shown to both the field mechanic (on their no-login
 * link) and staff (on the completeness dashboard).
 * (`GET /admin/pci/reference-images`)
 */
export async function adminListPciReferenceImages() {
  return apiFetch("/admin/pci/reference-images", { method: "GET" });
}

/**
 * Lazily creates or updates the reference image for one checklist key — 422s
 * if section_key/item_key isn't one of the fixed 24 (PCI_CHECKLIST_SECTIONS,
 * not admin-configurable). caption is optional.
 * (`PATCH /admin/pci/reference-images/{section_key}/{item_key}`)
 */
export async function adminUpsertPciReferenceImage(sectionKey, itemKey, { image_url, caption } = {}) {
  return apiFetch(`/admin/pci/reference-images/${sectionKey}/${itemKey}`, {
    method: "PATCH",
    body: { image_url, caption },
  });
}

/**
 * Full compensation grid for vehicle particulars renewal and plate number
 * (`GET /admin/compensation` and `PATCH /admin/compensation`).
 */
export async function getAdminCompensation() {
  return apiFetch("/admin/compensation", { method: "GET" });
}

export async function updateAdminCompensation(items) {
  return apiFetch("/admin/compensation", {
    method: "PATCH",
    body: { items },
  });
}

/**
 * Per-agent compensation grid and overrides
 * (`GET /admin/agents/{agent_id}/compensation` and `PATCH /admin/agents/{agent_id}/compensation`).
 */
export async function getAdminAgentCompensation(agentId) {
  return apiFetch(`/admin/agents/${agentId}/compensation`, { method: "GET" });
}

export async function updateAdminAgentCompensation(agentId, { items, general_overrides, custom_commission_kobo, sync_undisbursed } = {}) {
  return apiFetch(`/admin/agents/${agentId}/compensation`, {
    method: "PATCH",
    body: { items, general_overrides, custom_commission_kobo, sync_undisbursed },
  });
}

/**
 * Synchronize compensation for undisbursed items and agents
 * (`POST /admin/compensation/sync-undisbursed`).
 */
export async function syncAdminUndisbursedCompensation(payload = {}) {
  return apiFetch("/admin/compensation/sync-undisbursed", {
    method: "POST",
    body: payload,
  });
}

/**
 * Admin Service Net Profits configuration
 * (`GET /admin/revenue/service-profits` and `PATCH /admin/revenue/service-profits`).
 */
export async function adminGetServiceProfits() {
  return apiFetch("/admin/revenue/service-profits", { method: "GET" });
}

export async function adminUpdateServiceProfits(items) {
  return apiFetch("/admin/revenue/service-profits", {
    method: "PATCH",
    body: { items },
  });
}

/**
 * Admin Disbursements API
 */
export async function adminGetDisbursementStats() {
  return apiFetch("/admin/disbursements/stats", { method: "GET" });
}

export async function adminGetDisbursements({
  status,
  overdue_only,
  method,
  search,
  from_date,
  to_date,
  page = 1,
  page_size = 20,
} = {}) {
  const params = new URLSearchParams({ page, page_size });
  if (status) params.set("status", status);
  if (overdue_only !== undefined && overdue_only !== null) params.set("overdue_only", String(overdue_only));
  if (method) params.set("method", method);
  if (search) params.set("search", search);
  if (from_date) params.set("from_date", from_date);
  if (to_date) params.set("to_date", to_date);
  return apiFetch(`/admin/disbursements?${params.toString()}`, { method: "GET" });
}

export async function adminInitiateDisbursement(transferId) {
  return apiFetch(`/admin/disbursements/${transferId}/initiate`, { method: "POST" });
}

export async function adminManualDisburse(transferId, { receipt_url, notes } = {}) {
  return apiFetch(`/admin/disbursements/${transferId}/manual`, {
    method: "POST",
    body: { receipt_url, notes },
  });
}

export async function adminUploadDisbursementReceipt(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/admin/disbursements/upload-receipt", {
    method: "POST",
    body: formData,
  });
}

/**
 * Service Deadlines & SLA
 */
export async function adminGetDeadlines({ state_id } = {}) {
  const params = new URLSearchParams();
  if (state_id !== undefined && state_id !== null && state_id !== "") {
    params.set("state_id", state_id);
  }
  const qs = params.toString();
  return apiFetch(`/admin/deadlines${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function adminUpdateDeadline(deadlineId, data) {
  return apiFetch(`/admin/deadlines/${deadlineId}`, {
    method: "PUT",
    body: data,
  });
}

export async function adminCreateOrOverrideDeadline(data) {
  return apiFetch("/admin/deadlines", {
    method: "POST",
    body: data,
  });
}

export async function adminDeleteDeadlineOverride(deadlineId) {
  return apiFetch(`/admin/deadlines/${deadlineId}`, {
    method: "DELETE",
  });
}

export async function adminCloneDeadlines({ source_state_id, target_state_id }) {
  return apiFetch("/admin/deadlines/clone", {
    method: "POST",
    body: { source_state_id, target_state_id },
  });
}

export async function adminApplyDeadlinesToAll({ service_key, reset_overrides = true } = {}) {
  return apiFetch("/admin/deadlines/apply-to-all", {
    method: "POST",
    body: { service_key, reset_overrides },
  });
}

export async function adminResetDeadlines() {
  return apiFetch("/admin/deadlines/reset-defaults", { method: "POST" });
}

export async function adminGetSlaCountdown({ sla_status, service_key, search, page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  if (sla_status && sla_status !== "all") params.set("sla_status", sla_status);
  if (service_key && service_key !== "all") params.set("service_key", service_key);
  if (search) params.set("search", search);
  if (page) params.set("page", page);
  if (page_size) params.set("page_size", page_size);
  return apiFetch(`/admin/deadlines/countdown?${params.toString()}`, { method: "GET" });
}

/**
 * Permanently delete a single application and its associated records.
 * (`DELETE /admin/applications/{id}`)
 */
export async function adminDeleteApplication(applicationId) {
  return apiFetch(`/admin/applications/${applicationId}`, {
    method: "DELETE",
  });
}

/**
 * Permanently delete multiple applications and their associated records.
 * (`POST /admin/applications/bulk-delete`)
 */
export async function adminBulkDeleteApplications(applicationIds) {
  return apiFetch("/admin/applications/bulk-delete", {
    method: "POST",
    body: { application_ids: applicationIds },
  });
}

/**
 * Get the latest automated database backup status and metadata.
 * (`GET /admin/backup/status`)
 */
export async function adminGetBackupStatus() {
  return apiFetch("/admin/backup/status", { method: "GET" });
}

/**
 * Manually trigger an immediate database backup.
 * (`POST /admin/backup/trigger`)
 */
export async function adminTriggerBackup() {
  return apiFetch("/admin/backup/trigger", { method: "POST" });
}
