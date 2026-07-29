import { apiFetch } from "./client";

/**
 * Super Admin Endpoints — cross-role account management (require
 * `super_admin` role Bearer JWT access token).
 */

/**
 * List every account of a given role (`GET /admin/users?role=...`).
 * role: "customer" | "staff" | "agent" | "admin" | "super_admin"
 */
export async function superAdminGetUsers(role) {
  return apiFetch(`/admin/users?role=${encodeURIComponent(role)}`, { method: "GET" });
}

/**
 * Account counts per role, active/inactive (`GET /admin/users/stats`).
 */
export async function superAdminGetUserStats() {
  return apiFetch("/admin/users/stats", { method: "GET" });
}

/**
 * Single account detail, any role (`GET /admin/users/{id}`).
 */
export async function superAdminGetUser(id) {
  return apiFetch(`/admin/users/${id}`, { method: "GET" });
}

/**
 * Edit any account's core fields — name/email/phone/is_active
 * (`PATCH /admin/users/{id}`). Role is not editable.
 */
export async function superAdminUpdateUser(id, updates) {
  return apiFetch(`/admin/users/${id}`, { method: "PATCH", body: updates });
}

/**
 * Edit an agent's profile fields — VIO office, state/LGA, capabilities,
 * commission override (`PATCH /admin/users/{id}/agent-profile`).
 */
export async function superAdminUpdateAgentProfile(id, updates) {
  return apiFetch(`/admin/users/${id}/agent-profile`, { method: "PATCH", body: updates });
}

/**
 * Set any user's password without needing their email
 * (`POST /admin/users/{id}/set-password`). Forces must_change_password.
 */
export async function superAdminSetUserPassword(id, newPassword) {
  return apiFetch(`/admin/users/${id}/set-password`, {
    method: "POST",
    body: { new_password: newPassword },
  });
}
