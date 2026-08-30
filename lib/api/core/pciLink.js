import { API_BASE } from "./client";

/**
 * The field mechanic's no-login link surface (app/routers/pci_field_link.py)
 * is a completely separate credential model from every other page in this
 * app — the link token itself is the only auth, there is no session at all.
 * Deliberately does NOT go through apiFetch: that wrapper (a) always attaches
 * whatever session token happens to be sitting in localStorage (e.g. a staff
 * member testing this on the same device, or a stale customer session) as an
 * Authorization header the backend doesn't need and shouldn't see, and (b)
 * hard-navigates to a portal login page on ANY 401 — which would silently
 * strand a field mechanic with an invalid/expired link mid-inspection. This
 * file is a minimal, intentionally dumber fetch wrapper with neither
 * behavior.
 */
async function pciLinkFetch(path, { method = "GET", body } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = { Accept: "application/json" };
  if (body && !isFormData) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const detail = data?.detail;
      const errorMessage = typeof detail === "string" ? detail : `Error ${response.status}: Request failed`;
      return { data: null, error: errorMessage, status: response.status };
    }
    return { data, error: null, status: response.status };
  } catch {
    return { data: null, error: "Could not reach the server. Check your connection and try again.", status: 0 };
  }
}

/** GET /pci-link/{token} — whitelisted booking fields + all 24 checklist items + reference images. 404 on an unknown/garbage token. */
export async function getPciChecklistByLink(token) {
  return pciLinkFetch(`/pci-link/${token}`);
}

/** POST /pci-link/{token}/items/{section_key}/{item_key} — saves ONE item immediately (optimistic, not part of a final submit). 410s once staff have confirmed completeness. */
export async function submitPciChecklistItemByLink(token, sectionKey, itemKey, { rating, evidence_url, voice_note_url, notes } = {}) {
  return pciLinkFetch(`/pci-link/${token}/items/${sectionKey}/${itemKey}`, {
    method: "POST",
    body: { rating, evidence_url, voice_note_url, notes },
  });
}

/** POST /pci-link/{token}/upload — token-scoped mirror of the generic upload endpoint (that one requires a session the mechanic doesn't have). Accepts image or audio/video. */
export async function uploadPciEvidenceByLink(token, file) {
  const formData = new FormData();
  formData.append("file", file);
  return pciLinkFetch(`/pci-link/${token}/upload`, { method: "POST", body: formData });
}

/** POST /pci-link/{token}/mark-complete — the mechanic's own "I'm finished" signal. Informational only; staff's own completeness-confirm is the real gate that closes this link. */
export async function markPciMechanicComplete(token) {
  return pciLinkFetch(`/pci-link/${token}/mark-complete`, { method: "POST" });
}
