// Monnify checkout always opens in the SAME tab. The old pattern —
// window.open(url, "_blank", "noopener,...") and then a location.href
// fallback when it returned null — always hit the fallback, because
// window.open returns null whenever "noopener" is set. Customers got two
// checkouts. Same-tab navigation also survives popup blockers, and
// /dashboard/payment/success handles the return.
//
// Before leaving, remember how much of the application was already paid, so
// the return page can recognise a part-payment (whose payment status stays
// "pending"/"partial" rather than "success").

const key = (applicationId) => `vh_checkout_${applicationId}`;

export function goToCheckout(url, { applicationId, amountPaidKobo } = {}) {
  if (!url) return;
  if (applicationId != null) {
    try {
      sessionStorage.setItem(
        key(applicationId),
        JSON.stringify({ amountPaidKobo: Number(amountPaidKobo) || 0, at: Date.now() })
      );
    } catch {
      // storage unavailable (private mode) — the return page falls back to the status alone
    }
  }
  window.location.assign(url);
}

/** What was paid before this checkout started, or null if unknown. */
export function readCheckoutBaseline(applicationId) {
  if (applicationId == null) return null;
  try {
    const raw = sessionStorage.getItem(key(applicationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // A baseline older than a day belongs to an abandoned checkout.
    if (!parsed || Date.now() - parsed.at > 24 * 60 * 60 * 1000) return null;
    return Number(parsed.amountPaidKobo) || 0;
  } catch {
    return null;
  }
}

export function clearCheckoutBaseline(applicationId) {
  try {
    sessionStorage.removeItem(key(applicationId));
  } catch {
    // ignore
  }
}
