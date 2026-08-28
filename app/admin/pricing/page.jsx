"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Pencil, X, Save, Loader2, ChevronDown, Trash2, Copy, Globe2 } from "lucide-react";
import {
  getAdminPricing, updateAdminPricing,
  deleteDlFeeScheduleRow, deleteServicePriceRow, deleteParticularsItemPriceRow,
  getAdminVehicleCategoryPricing, updateAdminVehicleCategoryPricing, deleteAdminVehicleCategoryPriceRow,
  clonePricing, getReferenceStates,
} from "@/lib/api";
import { SERVICES, DARK_SERVICES } from "@/app/services/_data";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import Modal from "@/app/dashboard/_shared/Modal";

const BRAND = "#28A745";
const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";
const smallInputCls = "w-full rounded-lg px-3 py-2 text-[13px] bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";

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
  { key: "vehicle_verification_registration_history:null", application_type: "vehicle_verification_registration_history", validity_period: null, label: "Vehicle Verification — Registration History" },
  { key: "vehicle_verification_customs_duty:null", application_type: "vehicle_verification_customs_duty", validity_period: null, label: "Vehicle Verification — Customs Duty" },
];
// Broken out of DL_ROWS into their own accordion/section (see the "dl" vs
// "number-plate" accordions below) — these used to live inside "Driver's
// Licence & Permits," a section with no relation to Number Plate. Still
// submitted through the exact same dl_fee_schedule PATCH payload as
// DL_ROWS (see handleSave). Each row is number-plate's ONLY price for that
// type (flat, state-aware, no vehicle-category dimension). Fancy Plate is
// its own standalone type now (number_plate_fancy) — no longer a surcharge
// added on top of New/Change of Ownership; the old number_plate_fancy_surcharge
// key is retired (still exists in the backend's fallback schedule for
// backward compatibility, but deliberately not shown here — same reason
// number_plate_commercial_surcharge isn't shown either).
const NUMBER_PLATE_FLAT_ROWS = [
  { key: "number_plate_new:null", application_type: "number_plate_new", validity_period: null, label: "Number Plate — New" },
  { key: "number_plate_replacement:null", application_type: "number_plate_replacement", validity_period: null, label: "Number Plate — Replacement" },
  { key: "number_plate_change_of_ownership:null", application_type: "number_plate_change_of_ownership", validity_period: null, label: "Number Plate — Change of Ownership" },
  { key: "number_plate_fancy:null", application_type: "number_plate_fancy", validity_period: null, label: "Number Plate — Fancy" },
];
// Vehicle Particulars has its own real category-priced grid below —
// excluded here alongside Driver's Licence/Tinted Permit/Number Plate so it
// doesn't also show up as a single flat marketing price. Vehicle
// Verification (priced via DL_ROWS above) is excluded for the same reason
// — a service_prices row saved here is never read by anything (the DL
// fee-schedule endpoint owns its real price instead), so leaving it in
// this list let an admin "successfully" price it here while the customer-
// facing price stayed unset/null forever — this is the exact bug behind
// "I set the price but it's stuck on Loading". Roadworthiness Express and
// ECMR are DELIBERATELY NOT excluded — unlike
// Vehicle Verification, a service_prices row for either of these IS the
// real, checkout-authoritative price (get_flat_service_price on the
// backend), so their cards here are exactly where an admin should price
// them; they used to be vehicle-category-priced instead (see
// VEHICLE_CATEGORY_SERVICES below), which is what this section replaces.
// Admin still needs to price "dark" (customer-hidden) services too — they
// still have service_prices rows, just no customer-facing listing right now.
const OTHER_SERVICES = [...SERVICES, ...DARK_SERVICES].filter(
  (s) => !["drivers-licence", "tinted-permit", "number-plate", "vehicle-particulars", "vehicle-verification"].includes(s.slug)
);

// Vehicle Particulars — 5 document types, each independently priced. This
// is the FALLBACK price only (used when a vehicle has no category, or its
// category has no price set in the Vehicle Category Pricing section below)
// — agent compensation lives entirely on the Compensation page, never here.
// Unset blocks that document from being selectable in the customer wizard
// until an admin prices it (at least at this fallback tier).
const PARTICULARS_ROWS = [
  { document_type: "vehicle_licence", label: "Vehicle Licence" },
  { document_type: "road_worthiness", label: "Road Worthiness Certificate" },
  { document_type: "proof_of_ownership", label: "Proof of Ownership" },
  { document_type: "insurance_third_party", label: "Third-Party Insurance" },
  { document_type: "hackney_permit", label: "Hackney Permit" },
];

// The 5 vehicle_particulars document types priced by vehicle category —
// mirrors VEHICLE_CATEGORY_PRICED_SERVICE_KEYS on the backend. Note
// "road_worthiness" below is the unrelated existing Vehicle Particulars
// renewal-upload document, not Roadworthiness Express (the fast-track
// booking service — see app/core/reference_helpers.py's RWX_APPLICATION_TYPES
// for the naming-collision history). Number Plate, Roadworthiness Express,
// and ECMR used to be priced here too; each
// now has one flat price instead (Number Plate under "Number Plate" above,
// RWX/CMR under "Other Services" below) — one fee per service, not one per
// vehicle category.
const VEHICLE_CATEGORY_SERVICES = [
  { service_key: "vehicle_licence", label: "Vehicle Licence" },
  { service_key: "road_worthiness", label: "Road Worthiness Certificate" },
  { service_key: "proof_of_ownership", label: "Proof of Ownership" },
  { service_key: "insurance_third_party", label: "Third-Party Insurance" },
  { service_key: "hackney_permit", label: "Hackney Permit" },
  // Deliberately category-priced (unlike number-plate/RWX/CMR, which were
  // flattened) — a truck/bus inspection is materially more work than a
  // saloon's. Do NOT "helpfully" flatten this one.
  { service_key: "physical_condition_inspection", label: "Physical Condition Inspection" },
];

function keyFor(application_type, validity_period) {
  return `${application_type}:${validity_period ?? "null"}`;
}

function nairaFmt(nairaStr) {
  return `₦${Number(nairaStr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Converts one API price item (DLFeeScheduleItem / ServicePriceItem /
// ParticularsItemPriceItem / AdminVehicleCategoryPriceItem — all share the
// PriceFinancingFields + is_active/priority/is_override shape) into the
// flat string-keyed row state every input in this page is controlled by.
function rowStateFromApiItem(item) {
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

function financingPayload(row) {
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

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };
  return [toast, show, () => setToast(null)];
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border max-w-sm ${toast.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
        {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#111111]">{toast.type === "success" ? "Saved" : "Error"}</p>
        <p className="mt-0.5 text-[12.5px] text-slate-500 leading-relaxed">{toast.msg}</p>
      </div>
      <button type="button" onClick={onClose} className="ml-1 shrink-0 text-slate-400 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// One dense card per price row — deliberately just two fields, Amount and
// Initial Deposit %. Priority and the 7 financing-detail fields
// (app/models/pricing.py PriceExtrasMixin) used to be editable here too,
// but nothing in checkout/payment ever reads them and they only added
// noise — removed from the UI. Their values aren't touched server-side
// (see admin.py's _apply_extras), so any row an admin set them on before
// keeps that value; this form just never edits it again. Shared by every
// section below (DL & Permits, Vehicle Particulars, Other Services,
// Vehicle Category grid) so all four pricing tables get an identical
// editing surface.
function PriceRowCard({ label, row, onChange, editing, amountPlaceholder = "Not set", amountRequired = false, onDelete, isGeneralScope }) {
  const set = (field, value) => onChange({ ...row, [field]: value });
  return (
    <div className="rounded-xl border border-[#E5E5E5] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {row.is_override && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                State override
              </span>
            )}
            {row.is_override && !row.is_active && (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Inactive — general price applies
              </span>
            )}
            {!row.is_override && !row.is_active && (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Inactive — fallback price applies
              </span>
            )}
          </div>
        </div>
        {editing && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => set("is_active", !row.is_active)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${row.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"}`}
            >
              {row.is_active ? "Active" : "Inactive"}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-slate-400 hover:text-red-600 transition-colors"
                title={isGeneralScope ? "Delete general price (removes fallback for everyone)" : "Delete override (reverts to general price)"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount (₦)</label>
          {editing ? (
            <input
              type="number" min={amountRequired ? "1" : "0"} value={row.amount} placeholder={amountPlaceholder}
              onChange={(e) => set("amount", e.target.value)} className={smallInputCls}
            />
          ) : (
            <p className="text-[14px] font-semibold text-slate-800">{row.amount ? nairaFmt(row.amount) : amountPlaceholder}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Initial Deposit (%)</label>
          {editing ? (
            <input
              type="number" min="0" max="100" value={row.initial_deposit_percent} placeholder="10"
              onChange={(e) => set("initial_deposit_percent", e.target.value)} className={smallInputCls}
            />
          ) : (
            <p className="text-[14px] text-slate-600">{row.initial_deposit_percent || "10"}%</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StateSelectorBar({ states, selectedStateId, setSelectedStateId, onOpenClone }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#28A745]/10 text-[#28A745]">
          <Globe2 className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Pricing scope</label>
          <select
            value={selectedStateId}
            onChange={(e) => setSelectedStateId(e.target.value)}
            className="appearance-none bg-transparent text-sm font-semibold text-[#111111] focus:outline-none pr-6"
          >
            <option value="">General (all states)</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenClone}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0"
      >
        <Copy className="h-3.5 w-3.5" /> Clone services
      </button>
    </div>
  );
}

function CloneServicesModal({ open, onClose, states, defaultTargetStateId, onCloned }) {
  const [sourceStateId, setSourceStateId] = useState("");
  const [targetStateId, setTargetStateId] = useState(defaultTargetStateId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setSourceStateId("");
      setTargetStateId(defaultTargetStateId || "");
      setError(null);
    }
  }, [open, defaultTargetStateId]);

  const handleClone = async () => {
    if (!targetStateId) {
      setError("Choose a target state.");
      return;
    }
    if ((sourceStateId || null) === (targetStateId || null)) {
      setError("Source and target must be different.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await clonePricing({
      source_state_id: sourceStateId ? parseInt(sourceStateId, 10) : null,
      target_state_id: parseInt(targetStateId, 10),
    });
    setSaving(false);
    if (res.error) {
      setError("Could not clone pricing. Please try again.");
      return;
    }
    onCloned(res.data, parseInt(targetStateId, 10));
  };

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} title="Clone services">
      <div className="w-[min(92vw,26rem)] rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-[#111111]">Clone services</h3>
        <p className="mt-1 text-sm text-slate-500">
          Copy every price row — amount, financing fields, status, and priority — from one pricing scope into another.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <select value={sourceStateId} onChange={(e) => setSourceStateId(e.target.value)} className={inputCls}>
              <option value="">General (all states)</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <select value={targetStateId} onChange={(e) => setTargetStateId(e.target.value)} className={inputCls}>
              <option value="">Select a state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-3 text-[12.5px] text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClone}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="h-4 w-4" />} Clone
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPricingPage() {
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(""); // "" = General
  const [cloneOpen, setCloneOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getReferenceStates().then((res) => {
      if (res.data) setStates(res.data);
    });
  }, []);

  const stateIdNum = selectedStateId ? parseInt(selectedStateId, 10) : null;

  const handleCloned = (data, targetStateId) => {
    setCloneOpen(false);
    if (targetStateId === stateIdNum) {
      setReloadKey((k) => k + 1);
    } else {
      setSelectedStateId(String(targetStateId));
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[28px] tracking-tight text-[#111111]"
            style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
          >
            Pricing
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Set the price for every service in the catalogue — optionally overridden per state.
          </p>
        </div>
      </div>

      <StateSelectorBar
        states={states}
        selectedStateId={selectedStateId}
        setSelectedStateId={setSelectedStateId}
        onOpenClone={() => setCloneOpen(true)}
      />

      <MainPricingSection stateId={stateIdNum} reloadKey={reloadKey} />
      <VehicleCategoryPricingSection stateId={stateIdNum} reloadKey={reloadKey} />

      <CloneServicesModal
        open={cloneOpen}
        onClose={() => setCloneOpen(false)}
        states={states}
        defaultTargetStateId={selectedStateId}
        onCloned={handleCloned}
      />
    </div>
  );
}

// Driver's Licence & Permits, Vehicle Particulars fallback, and Other
// Services all share one GET/PATCH /admin/pricing cycle on the backend
// (app/routers/admin.py), so they stay one section here too — three
// collapsible accordions inside a single load/edit/save flow.
function MainPricingSection({ stateId, reloadKey }) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, showToast, closeToast] = useToast();
  const [openAccordion, setOpenAccordion] = useState("dl");

  const [dlRows, setDlRows] = useState({});
  const [particularsRows, setParticularsRows] = useState({});
  const [serviceRows, setServiceRows] = useState({});

  const seedFromResponse = (data) => {
    setDlRows(Object.fromEntries(
      (data.dl_fee_schedule || []).map((r) => [keyFor(r.application_type, r.validity_period), rowStateFromApiItem(r)])
    ));
    setParticularsRows(Object.fromEntries(
      (data.particulars_item_prices || []).map((r) => [r.document_type, rowStateFromApiItem(r)])
    ));
    setServiceRows(Object.fromEntries(
      (data.service_prices || []).map((r) => [r.slug, rowStateFromApiItem(r)])
    ));
  };

  useEffect(() => {
    setLoading(true);
    setEditing(false);
    getAdminPricing(stateId).then((res) => {
      if (res.data) seedFromResponse(res.data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId, reloadKey]);

  const handleSave = async () => {
    // A row/cell left blank saves as unset (server defaults it to
    // DEFAULT_PRICE_KOBO, see app/core/price_resolution.py) rather than
    // blocking the whole save — an admin pricing 8 of 9 rows today
    // shouldn't have to fill in the 9th just to save the other 8. An
    // explicitly-entered non-positive number is still rejected server-side.
    setSaving(true);
    const dl_fee_schedule = [...DL_ROWS, ...NUMBER_PLATE_FLAT_ROWS].map((row) => ({
      application_type: row.application_type,
      validity_period: row.validity_period,
      amount_kobo: dlRows[row.key]?.amount ? Math.round(parseFloat(dlRows[row.key].amount) * 100) : null,
      ...financingPayload(dlRows[row.key] || {}),
    }));
    const service_prices = OTHER_SERVICES.map((s) => {
      const row = serviceRows[s.slug] || {};
      return {
        slug: s.slug,
        amount_kobo: row.amount ? Math.round(parseFloat(row.amount) * 100) : null,
        ...financingPayload(row),
      };
    });
    const particulars_item_prices = PARTICULARS_ROWS.map((row) => {
      const r = particularsRows[row.document_type] || {};
      return {
        document_type: row.document_type,
        amount_kobo: r.amount ? Math.round(parseFloat(r.amount) * 100) : null,
        ...financingPayload(r),
      };
    });

    const res = await updateAdminPricing({ dl_fee_schedule, service_prices, particulars_item_prices, state_id: stateId });
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
    setLoading(true);
    getAdminPricing(stateId).then((res) => {
      if (res.data) seedFromResponse(res.data);
      setLoading(false);
    });
    setEditing(false);
  };

  const handleDeleteDl = async (row) => {
    const isGeneral = stateId == null;
    const confirmMsg = isGeneral
      ? `Delete the general price for "${row.label}"? Every state without its own override will lose its fallback price.`
      : `Remove this state's override for "${row.label}"? It will revert to the general price.`;
    if (!window.confirm(confirmMsg)) return;
    const res = await deleteDlFeeScheduleRow({ application_type: row.application_type, validity_period: row.validity_period, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return;
    }
    seedFromResponse(res.data);
    showToast("success", "Price deleted.");
  };

  const handleDeleteParticulars = async (documentType, label) => {
    const isGeneral = stateId == null;
    const confirmMsg = isGeneral
      ? `Delete the general price for "${label}"? Every state without its own override will lose its fallback price.`
      : `Remove this state's override for "${label}"? It will revert to the general price.`;
    if (!window.confirm(confirmMsg)) return;
    const res = await deleteParticularsItemPriceRow({ document_type: documentType, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return;
    }
    seedFromResponse(res.data);
    showToast("success", "Price deleted.");
  };

  const handleDeleteService = async (slug, label) => {
    const isGeneral = stateId == null;
    const confirmMsg = isGeneral
      ? `Delete the general price for "${label}"? Every state without its own override will lose its fallback price.`
      : `Remove this state's override for "${label}"? It will revert to the general price.`;
    if (!window.confirm(confirmMsg)) return;
    const res = await deleteServicePriceRow({ slug, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return;
    }
    seedFromResponse(res.data);
    showToast("success", "Price deleted.");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] px-6 sm:px-8 py-10 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading pricing...</p>
      </div>
    );
  }

  const accordions = [
    {
      id: "dl",
      title: "Driver's Licence & Permits",
      subtitle: "These prices drive real checkout charges and the agent commission split.",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DL_ROWS.map((row) => (
            <PriceRowCard
              key={row.key}
              label={row.label}
              row={dlRows[row.key] || rowStateFromApiItem({})}
              onChange={(next) => setDlRows((prev) => ({ ...prev, [row.key]: next }))}
              editing={editing}
              amountRequired
              onDelete={editing ? () => handleDeleteDl(row) : null}
              isGeneralScope={stateId == null}
            />
          ))}
        </div>
      ),
    },
    {
      id: "number-plate",
      title: "Number Plate — Flat Fees",
      subtitle: "One flat, state-aware price per plate type — the only price for each, not a fallback under a category grid.",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NUMBER_PLATE_FLAT_ROWS.map((row) => (
            <PriceRowCard
              key={row.key}
              label={row.label}
              row={dlRows[row.key] || rowStateFromApiItem({})}
              onChange={(next) => setDlRows((prev) => ({ ...prev, [row.key]: next }))}
              editing={editing}
              amountRequired
              onDelete={editing ? () => handleDeleteDl(row) : null}
              isGeneralScope={stateId == null}
            />
          ))}
        </div>
      ),
    },
    {
      id: "particulars",
      title: "Vehicle Particulars",
      subtitle: "Fallback price per document — used for vehicles with no category, or categories with no price set below.",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PARTICULARS_ROWS.map((row) => (
            <PriceRowCard
              key={row.document_type}
              label={row.label}
              row={particularsRows[row.document_type] || rowStateFromApiItem({})}
              onChange={(next) => setParticularsRows((prev) => ({ ...prev, [row.document_type]: next }))}
              editing={editing}
              onDelete={editing ? () => handleDeleteParticulars(row.document_type, row.label) : null}
              isGeneralScope={stateId == null}
            />
          ))}
        </div>
      ),
    },
    {
      id: "other",
      title: "Other Services",
      subtitle: 'Roadworthiness Express and ECMR are real, chargeable flat prices — leave either blank and checkout blocks with "not yet priced." Every other row here is purely informational — leave blank to keep showing "Coming soon" / "Quote on request".',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OTHER_SERVICES.map((s) => (
            <PriceRowCard
              key={s.slug}
              label={s.title}
              row={serviceRows[s.slug] || rowStateFromApiItem({})}
              onChange={(next) => setServiceRows((prev) => ({ ...prev, [s.slug]: next }))}
              editing={editing}
              onDelete={editing ? () => handleDeleteService(s.slug, s.title) : null}
              isGeneralScope={stateId == null}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toast toast={toast} onClose={closeToast} />

      <div className="flex items-center justify-end gap-3">
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

      {accordions.map(({ id, title, subtitle, content }) => {
        const isOpen = openAccordion === id;
        return (
          <div key={id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenAccordion(isOpen ? null : id)}
              className="w-full flex items-center justify-between px-6 sm:px-8 py-5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <h2 className="font-display text-base font-semibold text-[#111111]">{title}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <div className="px-6 sm:px-8 pb-6 border-t border-slate-100 pt-6">{content}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Self-contained: 96 cells (8 services x 12 categories) is a lot of state
// to fold into MainPricingSection's save flow, so this keeps its own
// load/edit/save cycle against the dedicated /admin/pricing/vehicle-categories
// endpoint. One collapsible panel per service keeps 96 cards navigable.
function VehicleCategoryPricingSection({ stateId, reloadKey }) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, showToast, closeToast] = useToast();
  const [openService, setOpenService] = useState(null);
  const [rows, setRows] = useState({});

  const cellKey = (service_key, vehicle_category) => `${service_key}:${vehicle_category}`;

  const seedFromResponse = (prices) => {
    setRows(Object.fromEntries(
      prices.map((r) => [cellKey(r.service_key, r.vehicle_category), rowStateFromApiItem(r)])
    ));
  };

  useEffect(() => {
    setLoading(true);
    setEditing(false);
    getAdminVehicleCategoryPricing(stateId).then((res) => {
      if (res.data) seedFromResponse(res.data.prices);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId, reloadKey]);

  const handleSave = async () => {
    // A blank cell saves as unset (server defaults it to DEFAULT_PRICE_KOBO,
    // see app/core/price_resolution.py) rather than blocking the whole grid
    // save — pricing a handful of categories today shouldn't require filling
    // in all ~108 cells first. An explicitly-entered non-positive number is
    // still rejected server-side.
    const prices = [];
    for (const { service_key } of VEHICLE_CATEGORY_SERVICES) {
      for (const { value: vehicle_category } of VEHICLE_CATEGORY_OPTIONS) {
        const key = cellKey(service_key, vehicle_category);
        const row = rows[key] || rowStateFromApiItem({});
        prices.push({
          service_key, vehicle_category,
          amount_kobo: row.amount ? Math.round(parseFloat(row.amount) * 100) : null,
          ...financingPayload(row),
        });
      }
    }

    setSaving(true);
    const res = await updateAdminVehicleCategoryPricing(prices, stateId);
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
    setLoading(true);
    getAdminVehicleCategoryPricing(stateId).then((res) => {
      if (res.data) seedFromResponse(res.data.prices);
      setLoading(false);
    });
    setEditing(false);
  };

  const handleDelete = async (service_key, vehicle_category, label) => {
    const isGeneral = stateId == null;
    const confirmMsg = isGeneral
      ? `Delete the general price for "${label}"? Every state without its own override will lose its fallback price.`
      : `Remove this state's override for "${label}"? It will revert to the general price.`;
    if (!window.confirm(confirmMsg)) return;
    const res = await deleteAdminVehicleCategoryPriceRow({ service_key, vehicle_category, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return;
    }
    seedFromResponse(res.data.prices);
    showToast("success", "Price deleted.");
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
      <Toast toast={toast} onClose={closeToast} />

      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#111111]">Vehicle Category Pricing</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Price varies by vehicle category for Vehicle Particulars renewal and Physical Condition Inspection — set a price for each of the 12 categories per service.
            Number Plate is flat-priced (one price per type, no category dimension) — set above, in Number Plate — Flat Fees.
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
                <div className="px-6 sm:px-8 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VEHICLE_CATEGORY_OPTIONS.map(({ value: vehicle_category, label: categoryLabel }) => {
                    const key = cellKey(service_key, vehicle_category);
                    return (
                      <PriceRowCard
                        key={key}
                        label={categoryLabel}
                        row={rows[key] || rowStateFromApiItem({})}
                        onChange={(next) => setRows((prev) => ({ ...prev, [key]: next }))}
                        editing={editing}
                        amountRequired
                        onDelete={editing ? () => handleDelete(service_key, vehicle_category, categoryLabel) : null}
                        isGeneralScope={stateId == null}
                      />
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
