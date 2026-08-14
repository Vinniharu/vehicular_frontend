"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Pencil, X, Save, Loader2, ChevronDown } from "lucide-react";
import { getAdminPricing, updateAdminPricing, getVehicleCategoryPricing, updateVehicleCategoryPricing } from "@/lib/api";
import { SERVICES, DARK_SERVICES } from "@/app/services/_data";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";

const BRAND = "#28A745";
const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";

// Driver's Licence and Tinted Permit already have their own dedicated apply
// flow — the "Other Services" section below covers everything else in the
// catalogue instead, sourced straight from the real service list so it can
// never drift out of sync with what customers actually see.
const DL_ROWS = [
  { key: "fresh:3 years", application_type: "fresh", validity_period: "3 years", label: "Fresh — 3 years" },
  { key: "fresh:5 years", application_type: "fresh", validity_period: "5 years", label: "Fresh — 5 years" },
  { key: "renewal:3 years", application_type: "renewal", validity_period: "3 years", label: "Renewal — 3 years (Reissue uses this price too)" },
  { key: "renewal:5 years", application_type: "renewal", validity_period: "5 years", label: "Renewal — 5 years (Reissue uses this price too)" },
  { key: "international_permit:null", application_type: "international_permit", validity_period: null, label: "International Permit" },
  { key: "tinted_permit:null", application_type: "tinted_permit", validity_period: null, label: "Tinted Glass Permit" },
  { key: "number_plate_new:null", application_type: "number_plate_new", validity_period: null, label: "Number Plate — New (standard states)" },
  { key: "number_plate_new:FCT", application_type: "number_plate_new", validity_period: "FCT", label: "Number Plate — New (FCT)" },
  { key: "number_plate_replacement:null", application_type: "number_plate_replacement", validity_period: null, label: "Number Plate — Replacement (standard states)" },
  { key: "number_plate_replacement:FCT", application_type: "number_plate_replacement", validity_period: "FCT", label: "Number Plate — Replacement (FCT)" },
  { key: "number_plate_change_of_ownership:null", application_type: "number_plate_change_of_ownership", validity_period: null, label: "Number Plate — Change of Ownership (standard states)" },
  { key: "number_plate_change_of_ownership:FCT", application_type: "number_plate_change_of_ownership", validity_period: "FCT", label: "Number Plate — Change of Ownership (FCT)" },
];
// number_plate_commercial_surcharge is retired — vehicle-category pricing
// (below) replaces the private/commercial surcharge mechanism entirely.
// The FCT rows above are unaffected — FCT is a separate, state-driven axis.

// Number Plate has its own real multi-row pricing above (base x FCT x
// service-type) — excluded here alongside the other two dedicated-flow
// services so it doesn't also show up as a single flat marketing price.
// vehicle-particulars is excluded too, for the same reason — its own
// multi-row (price + agent compensation, per document type) section below.
// Admin still needs to price "dark" (customer-hidden) services too — they
// still have service_prices rows, just no customer-facing listing right now.
const OTHER_SERVICES = [...SERVICES, ...DARK_SERVICES].filter(
  (s) => !["drivers-licence", "tinted-permit", "number-plate", "vehicle-particulars"].includes(s.slug)
);

// Vehicle Particulars — 5 document types, each independently priced. This
// is now the FALLBACK price only (used when a vehicle has no category, or
// its category has no price set in the Vehicle Category Pricing section
// below) — agent compensation lives entirely on the Compensation page now,
// never here. Unset blocks that document from being selectable in the
// customer wizard until an admin prices it (at least at this fallback tier).
const PARTICULARS_ROWS = [
  { document_type: "vehicle_licence", label: "Vehicle Licence" },
  { document_type: "road_worthiness", label: "Road Worthiness Certificate" },
  { document_type: "proof_of_ownership", label: "Proof of Ownership" },
  { document_type: "insurance_third_party", label: "Third-Party Insurance" },
  { document_type: "hackney_permit", label: "Hackney Permit" },
];

// The 8 services priced by vehicle category (the 5 particulars document
// types above + the 3 number-plate types) — mirrors
// VEHICLE_CATEGORY_PRICED_SERVICE_KEYS on the backend.
const VEHICLE_CATEGORY_SERVICES = [
  { service_key: "vehicle_licence", label: "Vehicle Licence" },
  { service_key: "road_worthiness", label: "Road Worthiness Certificate" },
  { service_key: "proof_of_ownership", label: "Proof of Ownership" },
  { service_key: "insurance_third_party", label: "Third-Party Insurance" },
  { service_key: "hackney_permit", label: "Hackney Permit" },
  { service_key: "number_plate_new", label: "Number Plate — New" },
  { service_key: "number_plate_replacement", label: "Number Plate — Replacement" },
  { service_key: "number_plate_change_of_ownership", label: "Number Plate — Change of Ownership" },
];

function keyFor(application_type, validity_period) {
  return `${application_type}:${validity_period ?? "null"}`;
}

export default function AdminPricingPage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [dlPricesRaw, setDlPricesRaw] = useState(null); // last-loaded server state, for Cancel
  const [servicePricesRaw, setServicePricesRaw] = useState(null);
  const [particularsPricesRaw, setParticularsPricesRaw] = useState(null);

  // Both keyed by row key -> naira string ("" = not set, only valid for
  // Other Services rows — DL rows must always resolve to a real number).
  const [dlNaira, setDlNaira] = useState({});
  const [serviceNaira, setServiceNaira] = useState({});
  // Keyed by document_type -> naira string, optional ("" = not set).
  const [particularsPriceNaira, setParticularsPriceNaira] = useState({});

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const seedFromResponse = (data) => {
    setDlPricesRaw(data.dl_fee_schedule);
    setServicePricesRaw(data.service_prices);
    setParticularsPricesRaw(data.particulars_item_prices);
    setDlNaira(
      Object.fromEntries(
        data.dl_fee_schedule.map((r) => [keyFor(r.application_type, r.validity_period), (r.amount_kobo / 100).toString()])
      )
    );
    setServiceNaira(
      Object.fromEntries(
        data.service_prices.map((r) => [r.slug, r.amount_kobo != null ? (r.amount_kobo / 100).toString() : ""])
      )
    );
    setParticularsPriceNaira(
      Object.fromEntries(
        (data.particulars_item_prices || []).map((r) => [r.document_type, r.amount_kobo != null ? (r.amount_kobo / 100).toString() : ""])
      )
    );
  };

  useEffect(() => {
    getAdminPricing().then((res) => {
      if (res.data) seedFromResponse(res.data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    for (const row of DL_ROWS) {
      const val = dlNaira[row.key];
      if (!val || isNaN(parseFloat(val)) || parseFloat(val) <= 0) {
        showToast("error", `Enter a valid price for ${row.label}.`);
        return;
      }
    }

    setSaving(true);
    const dl_fee_schedule = DL_ROWS.map((row) => ({
      application_type: row.application_type,
      validity_period: row.validity_period,
      amount_kobo: Math.round(parseFloat(dlNaira[row.key]) * 100),
    }));
    const service_prices = Object.fromEntries(
      OTHER_SERVICES.map((s) => [
        s.slug,
        serviceNaira[s.slug] ? Math.round(parseFloat(serviceNaira[s.slug]) * 100) : null,
      ])
    );
    const particulars_item_prices = PARTICULARS_ROWS.map((row) => ({
      document_type: row.document_type,
      amount_kobo: particularsPriceNaira[row.document_type] ? Math.round(parseFloat(particularsPriceNaira[row.document_type]) * 100) : null,
    }));

    const res = await updateAdminPricing({ dl_fee_schedule, service_prices, particulars_item_prices });
    setSaving(false);
    if (res.error) {
      showToast("error", "Could not save pricing changes.");
    } else if (res.data) {
      seedFromResponse(res.data);
      setEditing(false);
      showToast("success", "Pricing updated successfully.");
    }
  };

  const handleCancel = () => {
    if (dlPricesRaw && servicePricesRaw) {
      seedFromResponse({ dl_fee_schedule: dlPricesRaw, service_prices: servicePricesRaw, particulars_item_prices: particularsPricesRaw || [] });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading pricing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {toast && (
        <div className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border max-w-sm ${toast.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
          <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111111]">{toast.type === "success" ? "Saved" : "Error"}</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500 leading-relaxed">{toast.msg}</p>
          </div>
          <button type="button" onClick={() => setToast(null)} className="ml-1 shrink-0 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[28px] tracking-tight text-[#111111]"
            style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
          >
            Pricing
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">Set the price for every service in the catalogue.</p>
        </div>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0">
            <Pencil className="h-3.5 w-3.5" /> Edit prices
          </button>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">Cancel</button>
          </div>
        )}
      </div>

      {/* Driver's Licence & Permits */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <h2 className="font-display text-base font-semibold text-[#111111]">Driver's Licence &amp; Permits</h2>
          <p className="text-sm text-slate-500 mt-0.5">These prices drive real checkout charges and the agent commission split.</p>
        </div>
        <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {DL_ROWS.map((row) => (
            <div key={row.key}>
              <label className="block text-xs font-medium text-slate-500 mb-1">{row.label}</label>
              {editing ? (
                <input
                  type="number"
                  min="1"
                  value={dlNaira[row.key] ?? ""}
                  onChange={(e) => setDlNaira((prev) => ({ ...prev, [row.key]: e.target.value }))}
                  className={inputCls}
                />
              ) : (
                <p className="text-[15px] font-medium text-slate-800">
                  {dlNaira[row.key] ? `₦${Number(dlNaira[row.key]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Particulars */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <h2 className="font-display text-base font-semibold text-[#111111]">Vehicle Particulars</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Fallback price per document — used for vehicles with no category, or categories with no price set below.
            Leave blank to keep a document unavailable for renewal. Agent compensation is set on the{" "}
            <a href="/admin/compensation" className="underline hover:no-underline">Compensation</a> page, not here.
          </p>
        </div>
        <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PARTICULARS_ROWS.map((row) => (
            <div key={row.document_type}>
              <label className="block text-xs font-medium text-slate-500 mb-1">{row.label}</label>
              {editing ? (
                <input
                  type="number"
                  min="1"
                  value={particularsPriceNaira[row.document_type] ?? ""}
                  onChange={(e) => setParticularsPriceNaira((prev) => ({ ...prev, [row.document_type]: e.target.value }))}
                  placeholder="Not set"
                  className={inputCls}
                />
              ) : (
                <p className="text-[15px] font-medium text-slate-800">
                  {particularsPriceNaira[row.document_type] ? `₦${Number(particularsPriceNaira[row.document_type]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Not set"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <VehicleCategoryPricingSection />

      {/* Other Services */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <h2 className="font-display text-base font-semibold text-[#111111]">Other Services</h2>
          <p className="text-sm text-slate-500 mt-0.5">Purely informational — leave blank to keep showing "Coming soon" / "Quote on request".</p>
        </div>
        <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {OTHER_SERVICES.map((s) => (
            <div key={s.slug}>
              <label className="block text-xs font-medium text-slate-500 mb-1">{s.title}</label>
              {editing ? (
                <input
                  type="number"
                  min="1"
                  value={serviceNaira[s.slug] ?? ""}
                  onChange={(e) => setServiceNaira((prev) => ({ ...prev, [s.slug]: e.target.value }))}
                  placeholder="Not set"
                  className={inputCls}
                />
              ) : (
                <p className="text-[15px] font-medium text-slate-800">
                  {serviceNaira[s.slug] ? `₦${Number(serviceNaira[s.slug]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Not set"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Self-contained: 96 cells (8 services x 12 categories) is a lot of state
// to fold into the page's main save flow, so this has its own load/edit/
// save cycle against the dedicated /admin/pricing/vehicle-categories
// endpoint. One collapsible panel per service keeps 96 inputs navigable.
function VehicleCategoryPricingSection() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [openService, setOpenService] = useState(null);
  const [pricesRaw, setPricesRaw] = useState(null);
  // Keyed by "service_key:category" -> naira string.
  const [naira, setNaira] = useState({});

  const cellKey = (service_key, vehicle_category) => `${service_key}:${vehicle_category}`;

  const seedFromResponse = (prices) => {
    setPricesRaw(prices);
    setNaira(
      Object.fromEntries(
        prices.map((r) => [cellKey(r.service_key, r.vehicle_category), r.amount_kobo != null ? (r.amount_kobo / 100).toString() : ""])
      )
    );
  };

  useEffect(() => {
    getVehicleCategoryPricing().then((res) => {
      if (res.data) seedFromResponse(res.data.prices);
      setLoading(false);
    });
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSave = async () => {
    const prices = [];
    for (const { service_key } of VEHICLE_CATEGORY_SERVICES) {
      for (const { value: vehicle_category } of VEHICLE_CATEGORY_OPTIONS) {
        const key = cellKey(service_key, vehicle_category);
        const val = naira[key];
        if (!val || isNaN(parseFloat(val)) || parseFloat(val) <= 0) {
          showToast("error", "Every category cell needs a valid price before saving.");
          return;
        }
        prices.push({ service_key, vehicle_category, amount_kobo: Math.round(parseFloat(val) * 100) });
      }
    }

    setSaving(true);
    const res = await updateVehicleCategoryPricing(prices);
    setSaving(false);
    if (res.error) {
      showToast("error", "Could not save vehicle category pricing.");
    } else if (res.data) {
      seedFromResponse(res.data.prices);
      setEditing(false);
      showToast("success", "Vehicle category pricing updated successfully.");
    }
  };

  const handleCancel = () => {
    if (pricesRaw) seedFromResponse(pricesRaw);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] px-6 sm:px-8 py-8 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading vehicle category pricing...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
      {toast && (
        <div className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border max-w-sm ${toast.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
          <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111111]">{toast.type === "success" ? "Saved" : "Error"}</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500 leading-relaxed">{toast.msg}</p>
          </div>
          <button type="button" onClick={() => setToast(null)} className="ml-1 shrink-0 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#111111]">Vehicle Category Pricing</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Price varies by vehicle category for Number Plate and Vehicle Particulars renewal — set a price for each of the 12 categories per service.
          </p>
        </div>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">Cancel</button>
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {VEHICLE_CATEGORY_SERVICES.map(({ service_key, label }) => {
          const isOpen = openService === service_key;
          return (
            <div key={service_key}>
              <button
                type="button"
                onClick={() => setOpenService(isOpen ? null : service_key)}
                className="w-full flex items-center justify-between px-6 sm:px-8 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-800">{label}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-6 sm:px-8 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {VEHICLE_CATEGORY_OPTIONS.map(({ value: vehicle_category, label: categoryLabel }) => {
                    const key = cellKey(service_key, vehicle_category);
                    return (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-500 mb-1">{categoryLabel}</label>
                        {editing ? (
                          <input
                            type="number"
                            min="1"
                            value={naira[key] ?? ""}
                            onChange={(e) => setNaira((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder="Not set"
                            className={inputCls}
                          />
                        ) : (
                          <p className="text-[15px] font-medium text-slate-800">
                            {naira[key] ? `₦${Number(naira[key]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Not set"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
