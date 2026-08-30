// Mechanism-agnostic row-state <-> API-item conversion helpers, shared by
// every pricing card regardless of which backend table its rows come from
// (dl_fee_schedule / service_prices / particulars_item_prices /
// vehicle_category_prices — all four share the PriceFinancingFields +
// is_active/priority/is_override shape on the backend).

export function keyFor(application_type, validity_period) {
  return `${application_type}:${validity_period ?? "null"}`;
}

export function cellKey(service_key, vehicle_category) {
  return `${service_key}:${vehicle_category}`;
}

export function nairaFmt(nairaStr) {
  return `₦${Number(nairaStr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function rowStateFromApiItem(item) {
  return {
    amount: item.amount_kobo != null ? (item.amount_kobo / 100).toString() : "",
    priority: String(item.priority ?? 0),
    is_active: item.is_active !== false,
    is_override: !!item.is_override,
    financing_amount_kobo: item.financing_amount_kobo != null ? (item.financing_amount_kobo / 100).toString() : "",
    interest_percent: item.interest_percent != null ? String(item.interest_percent) : "",
    initial_deposit_amount_kobo: item.initial_deposit_amount_kobo != null ? (item.initial_deposit_amount_kobo / 100).toString() : "",
    initial_deposit_percent: item.initial_deposit_percent != null ? String(item.initial_deposit_percent) : "10",
    duration_days: item.duration_days != null ? String(item.duration_days) : "",
    price_lock_percent: item.price_lock_percent != null ? String(item.price_lock_percent) : "",
    va_price_kobo: item.va_price_kobo != null ? (item.va_price_kobo / 100).toString() : "",
    va_duration: item.va_duration != null ? String(item.va_duration) : "",
  };
}

export function financingPayload(row) {
  return {
    financing_amount_kobo: row.financing_amount_kobo ? Math.round(parseFloat(row.financing_amount_kobo) * 100) : null,
    interest_percent: row.interest_percent !== "" && row.interest_percent != null ? parseFloat(row.interest_percent) : null,
    initial_deposit_amount_kobo: row.initial_deposit_amount_kobo ? Math.round(parseFloat(row.initial_deposit_amount_kobo) * 100) : null,
    initial_deposit_percent: row.initial_deposit_percent !== "" && row.initial_deposit_percent != null ? parseFloat(row.initial_deposit_percent) : null,
    duration_days: row.duration_days !== "" && row.duration_days != null ? parseInt(row.duration_days, 10) : null,
    price_lock_percent: row.price_lock_percent !== "" && row.price_lock_percent != null ? parseFloat(row.price_lock_percent) : null,
    va_price_kobo: row.va_price_kobo ? Math.round(parseFloat(row.va_price_kobo) * 100) : null,
    va_duration: row.va_duration !== "" && row.va_duration != null ? parseInt(row.va_duration, 10) : null,
    is_active: row.is_active !== false,
    priority: row.priority !== "" && row.priority != null ? (parseInt(row.priority, 10) || 0) : 0,
  };
}

export function amountKoboFromRow(row) {
  return row?.amount ? Math.round(parseFloat(row.amount) * 100) : null;
}
