import { apiFetch, setToken, removeToken, setCachedUser } from "./client";

/**
 * Authentication & User Profile Endpoints (ENDPOINTS.md Section 3)
 */

/**
 * Public registration for customer accounts only (POST /auth/register).
 * Rejects attempts to self-register as staff, agent, or admin with 403 Forbidden.
 */
export async function authRegister({ name, email, phone, password, role = "customer" }) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: { name, email, phone, password, role },
  });
}

/**
 * Authenticate credentials and return Bearer JWT access token (POST /auth/login).
 * Rate Limited: Max 5 attempts/minute.
 */
export async function authLogin({ email, password }) {
  const result = await apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (result.data && result.data.access_token) {
    setToken(result.data.access_token);
  }
  return result;
}

/**
 * Mandatory first-login step for provisioned staff and agent accounts (POST /auth/set-password).
 */
export async function authSetPassword({ new_password }) {
  return apiFetch("/auth/set-password", {
    method: "POST",
    body: { new_password },
  });
}

/**
 * Retrieve current user profile (GET /auth/me).
 * Also accessible via GET /customers/me for customer sessions.
 */
export async function authGetMe() {
  const result = await apiFetch("/auth/me", {
    method: "GET",
  });
  if (result.data && (result.status === 200 || result.status === 201)) {
    setCachedUser(result.data);
  }
  return result;
}

/**
 * Update customer profile such as residence details (PATCH /auth/me or PATCH /customers/me).
 * Validates strictly that lga_id belongs to state_id.
 */
export async function authUpdateProfile({ state_id, lga_id, name, phone }) {
  const result = await apiFetch("/auth/me", {
    method: "PATCH",
    body: { state_id, lga_id, name, phone },
  });
  if (result.data && result.status === 200) {
    setCachedUser(result.data);
  }
  return result;
}

/**
 * Voluntary password change for an already-authenticated user, requires the
 * current password (POST /auth/change-password). Distinct from
 * authSetPassword, which is the forced first-login flow with no old-password
 * check.
 */
export async function authChangePassword({ current_password, new_password }) {
  return apiFetch("/auth/change-password", {
    method: "POST",
    body: { current_password, new_password },
  });
}

/**
 * Requests a password reset email (POST /auth/forgot-password). Always
 * returns a generic success message regardless of whether the email is
 * registered, to avoid leaking which emails have accounts.
 */
export async function authForgotPassword({ email }) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/**
 * Completes a password reset using the token from the emailed link
 * (POST /auth/reset-password).
 */
export async function authResetPassword({ token, new_password }) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: { token, new_password },
  });
}

/**
 * Client-side logout helper. Clears tokens and cached profile.
 */
export function authLogout() {
  removeToken();
}
