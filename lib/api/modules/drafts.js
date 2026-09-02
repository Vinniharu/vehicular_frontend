import { apiFetch } from "../core/client";

/**
 * In-progress, not-yet-submitted application form data — backend-persisted
 * so a customer can resume on any device. Keyed by wizard_key (see
 * lib/draft-registry.js for the full list). Requires auth.
 */

/** PUT /application-drafts/{wizardKey} — upsert. */
export async function saveApplicationDraft(wizardKey, formData, stepLabel) {
  return apiFetch(`/application-drafts/${encodeURIComponent(wizardKey)}`, {
    method: "PUT",
    body: { form_data: formData, step_label: stepLabel ?? null },
  });
}

/** GET /application-drafts/{wizardKey} — single draft, or a 404 (returned as res.error, not thrown). */
export async function getApplicationDraft(wizardKey) {
  return apiFetch(`/application-drafts/${encodeURIComponent(wizardKey)}`, { method: "GET" });
}

/** GET /application-drafts — metadata-only list, for the dashboard indicator. */
export async function listApplicationDrafts() {
  return apiFetch("/application-drafts", { method: "GET" });
}

/** DELETE /application-drafts/{wizardKey}. */
export async function deleteApplicationDraft(wizardKey) {
  return apiFetch(`/application-drafts/${encodeURIComponent(wizardKey)}`, { method: "DELETE" });
}
