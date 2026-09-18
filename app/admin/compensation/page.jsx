"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  Save,
  Loader2,
  Search,
  Wallet,
  Car,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Check,
  RefreshCw,
  Info,
  Sliders,
  Layers,
  ArrowRight,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  adminGetAgents,
  adminGetAgent,
  updateAgentCommission,
  bulkUpdateAgentCommission,
  getAdminCompensation,
  updateAdminCompensation,
  getAdminAgentCompensation,
  updateAdminAgentCompensation,
  syncAdminUndisbursedCompensation,
} from "@/lib/api";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";

const BRAND = "#28A745";
const inputCls =
  "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";

// Canonical list for global DL and non-vehicle services
const COMPENSATION_TYPE_OPTIONS = [
  { value: "fresh", label: "Fresh Driver's Licence" },
  { value: "renewal", label: "Renewal Driver's Licence" },
  { value: "reissue", label: "Reissue Driver's Licence" },
  { value: "international_permit", label: "International Permit" },
  { value: "tinted_permit", label: "Tinted Permit" },
  { value: "number_plate", label: "Number Plate (Global Fallback)" },
  { value: "vehicle_particulars", label: "Vehicle Particulars (All Documents Package / Bundle)" },
  { value: "vehicle_licence", label: "Vehicle Particulars — Vehicle Licence" },
  { value: "road_worthiness", label: "Vehicle Particulars — Road Worthiness" },
  { value: "proof_of_ownership", label: "Vehicle Particulars — Proof of Ownership" },
  { value: "insurance_third_party", label: "Vehicle Particulars — Third-Party Insurance" },
  { value: "hackney_permit", label: "Vehicle Particulars — Hackney Permit" },
];

const DL_AND_OTHER_SERVICES = [
  { key: "fresh", label: "Fresh Driver's Licence", desc: "First-time driver's licence application & biometric capture" },
  { key: "renewal", label: "Renewal Driver's Licence", desc: "Driver's licence renewal application" },
  { key: "reissue", label: "Reissue Driver's Licence", desc: "Replacement for lost, damaged, or defaced driver's licence" },
  { key: "international_permit", label: "International Driving Permit", desc: "International driving permit issuance" },
  { key: "tinted_permit", label: "Tinted Glass Permit", desc: "Police tinted glass permit verification & processing" },
  { key: "vehicle_particulars", label: "Vehicle Particulars (All Documents Bundle)", desc: "Fixed agent settlement when customer renews all documents together as a bundle" },
];

const PARTICULAR_DOC_TYPES = [
  { key: "vehicle_particulars", label: "All Documents Package (Full Bundle)", desc: "Settlement paid to agent when customer renews all documents as a complete package" },
  { key: "vehicle_licence", label: "Vehicle Licence", desc: "Annual vehicle licence registration & renewal" },
  { key: "road_worthiness", label: "Road Worthiness", desc: "Inspection & roadworthiness renewal certificate" },
  { key: "proof_of_ownership", label: "Proof of Ownership", desc: "Federal / State proof of vehicle ownership certificate" },
  { key: "insurance_third_party", label: "Third-Party Insurance", desc: "Statutory third-party motor insurance policy" },
  { key: "hackney_permit", label: "Hackney Permit", desc: "Commercial carriage permit for commercial vehicles" },
];

const NUMBER_PLATE_TYPES = [
  { key: "number_plate_new", label: "New Number Plate", desc: "Standard new private or commercial plate issuance" },
  { key: "number_plate_replacement", label: "Replacement Plate", desc: "Replacement for damaged, defaced, or lost plates" },
  { key: "number_plate_change_of_ownership", label: "Change of Ownership", desc: "Plate transfer and vehicle reassignment" },
  { key: "number_plate_fancy", label: "Fancy / Custom Plate", desc: "Personalized custom plate number issuance" },
  { key: "number_plate_dealership", label: "Dealership Plate", desc: "Special commercial auto-dealer temporary plates" },
];

function koboToNaira(kobo) {
  if (kobo == null) return "";
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function Avatar({ name }) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
      style={{ background: "linear-gradient(135deg, #28A745, #0a7a56)" }}
    >
      {letter}
    </div>
  );
}

export default function AdminCompensationPage() {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("vehicle_type"); // "vehicle_type" | "global" | "agents"
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {toast && (
        <div
          className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border max-w-sm ${
            toast.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"
          }`}
        >
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
              toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111111]">{toast.type === "success" ? "Success" : "Error"}</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500 leading-relaxed">{toast.msg}</p>
          </div>
          <button type="button" onClick={() => setToast(null)} className="ml-1 shrink-0 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-[28px] tracking-tight text-[#111111]"
            style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
          >
            Compensation & Agent Settlement
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Configure agent payouts per completed job. Set per-vehicle-type settlement for particulars renewal and plate numbers, global fallbacks, and individual agent overrides.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSyncModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300/80 hover:bg-emerald-200/70 transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5 text-emerald-700" />
          Sync Undisbursed Compensations
        </button>
      </div>

      {/* Precedence Banner */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-[13px] text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-[#28A745] shrink-0" />
          <span>
            <strong className="text-emerald-800 font-semibold">Settlement Priority:</strong> Agent Specific Override &rarr;{" "}
            <strong>Vehicle Type Settlement</strong> &rarr; Agent Flat Override &rarr; Global Service Default &rarr; System Fallback
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 self-start overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("vehicle_type")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
          style={{
            background: activeTab === "vehicle_type" ? "#fff" : "transparent",
            color: activeTab === "vehicle_type" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "vehicle_type" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <Car className="w-4 h-4 text-[#28A745]" />
          Vehicle Type Settlement
          <span className="text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-[#28A745]/10 text-[#28A745]">
            10 Services
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("global")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
          style={{
            background: activeTab === "global" ? "#fff" : "transparent",
            color: activeTab === "global" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "global" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          Global Service Defaults
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("agents")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
          style={{
            background: activeTab === "agents" ? "#fff" : "transparent",
            color: activeTab === "agents" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "agents" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <Wallet className="w-4 h-4 text-slate-500" />
          Per-Agent Overrides
          <span className="text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-slate-200 text-slate-700">
            Full Grid
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "vehicle_type" && <VehicleTypeCompensationSection key={refreshKey} showToast={showToast} />}
      {activeTab === "global" && <GlobalDefaultsSection key={refreshKey} showToast={showToast} />}
      {activeTab === "agents" && <PerAgentOverrideSection key={refreshKey} showToast={showToast} triggerGlobalRefresh={triggerRefresh} />}

      {/* Global Sync Undisbursed Modal */}
      {syncModalOpen && (
        <SyncUndisbursedModal
          onClose={() => setSyncModalOpen(false)}
          showToast={showToast}
          onSuccess={() => {
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}

// ── 1. Global Sync Undisbursed Modal ──────────────────────────────────────────
function SyncUndisbursedModal({ onClose, showToast, onSuccess }) {
  const [resetNeverDisbursed, setResetNeverDisbursed] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    const res = await syncAdminUndisbursedCompensation({
      update_never_disbursed_agents: resetNeverDisbursed,
    });
    setSyncing(false);

    if (res.error) {
      showToast("error", "Sync failed: " + res.error);
      return;
    }

    if (res.data) {
      setResult(res.data);
      showToast("success", res.data.message || "Compensation synchronized successfully.");
      onSuccess?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#28A745]">
            <RefreshCw className={`h-6 w-6 ${syncing ? "animate-spin" : ""}`} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-slate-900">Sync Undisbursed Compensations</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Synchronize pending agent payouts and open application items with the latest compensation settings.
            </p>
          </div>
        </div>

        {!result ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-[12.5px] text-blue-900 space-y-2">
              <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" /> How Synchronization Works:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-blue-800">
                <li>
                  <strong>Outstanding Transfers:</strong> Any transfer currently in <code className="bg-white/80 px-1 rounded">pending</code> or <code className="bg-white/80 px-1 rounded">failed</code> status is recalculated against current compensation rates.
                </li>
                <li>
                  <strong>Agent Wallet Adjustment:</strong> Agent wallet balances are automatically credited or debited by the difference, with full ledger audit logging.
                </li>
                <li>
                  <strong>Open Application Items:</strong> Uncompleted particulars items will update to current compensation rates before agents accept them.
                </li>
                <li>
                  <strong>Disbursed Payouts Untouched:</strong> Already-disbursed transfers (<code className="bg-white/80 px-1 rounded">success</code>) are never altered.
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={resetNeverDisbursed}
                onChange={(e) => setResetNeverDisbursed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#28A745] focus:ring-[#28A745]"
              />
              <span className="text-[12.5px] leading-relaxed text-slate-600">
                <strong className="text-slate-900">Reset legacy flat default (₦10,000) on never-disbursed agents.</strong> Clears the legacy onboarding commission on agents who have never received a payout so they inherit the exact Vehicle Type Settlement rates configured above.
              </span>
            </label>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={syncing}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: "#28A745" }}
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {syncing ? "Synchronizing..." : "Run Synchronization"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-[13px] text-emerald-900">
              <p className="font-semibold text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                Synchronization Complete
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                  <span className="text-slate-500 block">Pending Transfers Updated</span>
                  <span className="text-base font-bold text-slate-900">{result.transfers_updated}</span>
                </div>
                <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                  <span className="text-slate-500 block">Net Wallet Delta</span>
                  <span className="text-base font-bold text-slate-900">
                    {result.transfers_total_delta_kobo >= 0 ? "+" : ""}
                    {koboToNaira(result.transfers_total_delta_kobo)}
                  </span>
                </div>
                <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                  <span className="text-slate-500 block">Particulars Items Updated</span>
                  <span className="text-base font-bold text-slate-900">{result.items_updated}</span>
                </div>
                <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                  <span className="text-slate-500 block">Never-Disbursed Agents Synced</span>
                  <span className="text-base font-bold text-slate-900">{result.agents_updated}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all"
                style={{ background: "#28A745" }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2. Vehicle Type Settlement Section (Vehicle Particulars & Number Plates) ──
function VehicleTypeCompensationSection({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [subFamily, setSubFamily] = useState("particulars"); // "particulars" | "plate"
  const [cellMap, setCellMap] = useState({}); // `${service_key}|${vehicle_category ?? ""}` -> kobo
  const [expandedKeys, setExpandedKeys] = useState(new Set(["vehicle_licence", "number_plate_new"]));
  const [editingServiceKey, setEditingServiceKey] = useState(null);
  const [draftValues, setDraftValues] = useState({});
  const [quickFillVal, setQuickFillVal] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCompensationData = async () => {
    setLoading(true);
    const res = await getAdminCompensation();
    if (res.data && Array.isArray(res.data.items)) {
      const mapping = {};
      for (const item of res.data.items) {
        const k = `${item.service_key}|${item.vehicle_category ?? ""}`;
        mapping[k] = item.compensation_kobo;
      }
      setCellMap(mapping);
    } else if (res.error) {
      showToast("error", "Could not load vehicle category compensation grid.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCompensationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startEditing = (serviceKey) => {
    setEditingServiceKey(serviceKey);
    setQuickFillVal("");
    const drafts = {};
    for (const cat of VEHICLE_CATEGORY_OPTIONS) {
      const k = `${serviceKey}|${cat.value}`;
      const kobo = cellMap[k];
      drafts[cat.value] = kobo != null ? (kobo / 100).toString() : "";
    }
    // Category-agnostic fallback
    const kNull = `${serviceKey}|`;
    const koboNull = cellMap[kNull];
    drafts[""] = koboNull != null ? (koboNull / 100).toString() : "";
    setDraftValues(drafts);
    setExpandedKeys((prev) => new Set([...prev, serviceKey]));
  };

  const cancelEditing = () => {
    setEditingServiceKey(null);
    setDraftValues({});
    setQuickFillVal("");
  };

  const handleApplyQuickFill = () => {
    if (quickFillVal === "") return;
    setDraftValues((prev) => {
      const updated = { ...prev };
      for (const cat of VEHICLE_CATEGORY_OPTIONS) {
        updated[cat.value] = quickFillVal;
      }
      return updated;
    });
  };

  const handleClearAllDrafts = () => {
    setDraftValues((prev) => {
      const updated = {};
      for (const cat of VEHICLE_CATEGORY_OPTIONS) {
        updated[cat.value] = "";
      }
      updated[""] = "";
      return updated;
    });
  };

  const handleSaveService = async (serviceKey) => {
    setSaving(true);
    const payloadItems = [
      ...VEHICLE_CATEGORY_OPTIONS.map((cat) => {
        const strVal = draftValues[cat.value];
        return {
          service_key: serviceKey,
          vehicle_category: cat.value,
          compensation_kobo: strVal !== "" && strVal != null ? Math.round(parseFloat(strVal) * 100) : null,
          is_active: true,
        };
      }),
      {
        service_key: serviceKey,
        vehicle_category: null,
        compensation_kobo: draftValues[""] !== "" && draftValues[""] != null ? Math.round(parseFloat(draftValues[""]) * 100) : null,
        is_active: true,
      },
    ];

    const res = await updateAdminCompensation(payloadItems);
    setSaving(false);

    if (res.error) {
      showToast("error", "Failed to save settlement changes: " + res.error);
      return;
    }

    if (res.data && Array.isArray(res.data.items)) {
      setCellMap((prev) => {
        const next = { ...prev };
        for (const item of res.data.items) {
          if (item.service_key === serviceKey) {
            const k = `${item.service_key}|${item.vehicle_category ?? ""}`;
            next[k] = item.compensation_kobo;
          }
        }
        return next;
      });
    }

    setEditingServiceKey(null);
    showToast("success", "Settlement rates updated for " + serviceKey);
  };

  const activeServices = subFamily === "particulars" ? PARTICULAR_DOC_TYPES : NUMBER_PLATE_TYPES;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] px-6 sm:px-8 py-12 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading vehicle category settlement rates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-family Switcher */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] p-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubFamily("particulars")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              subFamily === "particulars" ? "bg-[#28A745] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            Vehicle Particulars Renewal
            <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${subFamily === "particulars" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
              5 Docs + Bundle
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubFamily("plate")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              subFamily === "plate" ? "bg-[#28A745] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Car className="w-4 h-4" />
            Plate Number Issuance
            <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${subFamily === "plate" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
              5 Types
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 px-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            Customized rate
          </span>
          <span className="flex items-center gap-1.5 ml-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
            Inherits fallback
          </span>
        </div>
      </div>

      {/* Service Cards List */}
      <div className="space-y-4">
        {activeServices.map((svc) => {
          const isExpanded = expandedKeys.has(svc.key);
          const isEditing = editingServiceKey === svc.key;

          let customCount = 0;
          for (const cat of VEHICLE_CATEGORY_OPTIONS) {
            const k = `${svc.key}|${cat.value}`;
            if (cellMap[k] != null) customCount++;
          }
          const hasFallbackCustom = cellMap[`${svc.key}|`] != null;

          return (
            <div key={svc.key} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden transition-shadow hover:shadow-sm">
              {/* Card Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]">
                    {subFamily === "particulars" ? <FileText className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-display text-base font-semibold text-[#111111]">{svc.label}</h3>
                      {svc.key === "vehicle_particulars" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#28A745]/10 text-[#28A745] border border-[#28A745]/20">
                          Package Bundle
                        </span>
                      )}
                      {customCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" />
                          {customCount} of 12 categories customized
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                          All 12 inherit fallback
                        </span>
                      )}
                      {hasFallbackCustom && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          Base: {koboToNaira(cellMap[`${svc.key}|`])}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{svc.desc}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(svc.key)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#28A745] bg-[#28A745]/10 hover:bg-[#28A745]/15 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Rates
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(svc.key)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveService(svc.key)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#28A745] text-white hover:bg-[#218838] transition-colors disabled:opacity-60"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Rates
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body Grid */}
              {isExpanded && (
                <div className="px-6 sm:px-8 py-6 space-y-6">
                  {/* Quick Fill Tool in Edit Mode */}
                  {isEditing && (
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#28A745]" />
                        <span className="font-semibold text-emerald-900">Batch Fill:</span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="e.g. 5000"
                            value={quickFillVal}
                            onChange={(e) => setQuickFillVal(e.target.value)}
                            className="pl-6 pr-3 py-1.5 w-32 rounded-lg bg-white border border-emerald-200 text-xs focus:outline-none focus:border-[#28A745]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyQuickFill}
                          disabled={!quickFillVal}
                          className="px-3 py-1.5 rounded-lg bg-[#28A745] text-white font-semibold hover:bg-[#218838] disabled:opacity-50 transition-colors"
                        >
                          Apply to All 12 Categories
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearAllDrafts}
                        className="text-slate-500 hover:text-red-600 inline-flex items-center gap-1 font-medium transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset All to Fallback
                      </button>
                    </div>
                  )}

                  {/* 12 Vehicle Categories Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {VEHICLE_CATEGORY_OPTIONS.map((cat) => {
                      const cellKey = `${svc.key}|${cat.value}`;
                      const currentKobo = cellMap[cellKey];
                      const draftVal = isEditing ? draftValues[cat.value] : null;

                      return (
                        <div
                          key={cat.value}
                          className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 ${
                            isEditing
                              ? "bg-white border-slate-200 shadow-sm"
                              : currentKobo != null
                              ? "bg-emerald-50/40 border-emerald-200/80"
                              : "bg-slate-50/60 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-semibold text-slate-900 leading-snug">{cat.label}</span>
                            {!isEditing && currentKobo != null && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Custom rate active" />
                            )}
                          </div>

                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₦</span>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={draftVal || ""}
                                onChange={(e) =>
                                  setDraftValues((prev) => ({
                                    ...prev,
                                    [cat.value]: e.target.value,
                                  }))
                                }
                                placeholder="Uses fallback"
                                className="w-full pl-7 pr-7 py-1.5 rounded-lg text-[13px] bg-white border border-slate-200 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
                              />
                              {draftVal && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftValues((prev) => ({
                                      ...prev,
                                      [cat.value]: "",
                                    }))
                                  }
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {currentKobo != null ? (
                                <span className="inline-flex items-center text-[13.5px] font-bold text-emerald-800">
                                  {koboToNaira(currentKobo)}
                                </span>
                              ) : (
                                <span className="text-[12px] text-slate-400 italic">Uses fallback</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Category-Agnostic Fallback Card */}
                  <div className="pt-3 border-t border-dashed border-slate-200">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Category-Agnostic Baseline Fallback</span>
                        </div>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          Paid to agents for any vehicle category above that does not have its own custom rate configured.
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isEditing ? (
                          <div className="relative w-44">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₦</span>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={draftValues[""] || ""}
                              onChange={(e) =>
                                setDraftValues((prev) => ({
                                  ...prev,
                                  "": e.target.value,
                                }))
                              }
                              placeholder="System default"
                              className="w-full pl-7 pr-7 py-1.5 rounded-lg text-[13px] bg-white border border-blue-200 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
                            />
                            {draftValues[""] && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftValues((prev) => ({
                                    ...prev,
                                    "": "",
                                  }))
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            {cellMap[`${svc.key}|`] != null ? (
                              <span className="text-sm font-bold text-blue-900">{koboToNaira(cellMap[`${svc.key}|`])}</span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Inherits global default</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 3. Global Defaults Section (Service-type and flat defaults) ───────────────
function GlobalDefaultsSection({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const [globalCommissionKobo, setGlobalCommissionKobo] = useState("");
  const [byTypeCommission, setByTypeCommission] = useState(() =>
    Object.fromEntries(COMPENSATION_TYPE_OPTIONS.map((o) => [o.value, ""]))
  );

  const seedByTypeCommission = (byType) => {
    setByTypeCommission(
      Object.fromEntries(
        COMPENSATION_TYPE_OPTIONS.map((o) => {
          const kobo = byType?.[o.value];
          return [o.value, kobo !== null && kobo !== undefined ? (kobo / 100).toString() : ""];
        })
      )
    );
  };

  useEffect(() => {
    getAdminSettings().then((res) => {
      if (res.data) {
        setSystemSettings(res.data);
        setGlobalCommissionKobo(
          res.data.default_agent_commission_kobo != null ? (res.data.default_agent_commission_kobo / 100).toString() : ""
        );
        seedByTypeCommission(res.data.default_commission_by_type);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const val = globalCommissionKobo !== "" ? Math.round(parseFloat(globalCommissionKobo) * 100) : null;
    const default_commission_by_type = Object.fromEntries(
      Object.entries(byTypeCommission)
        .filter(([, v]) => v !== "")
        .map(([type, v]) => [type, Math.round(parseFloat(v) * 100)])
    );
    const res = await updateAdminSettings({ default_agent_commission_kobo: val, default_commission_by_type });
    setSaving(false);
    if (res.error) {
      showToast("error", "Could not save global compensation defaults.");
    } else if (res.data) {
      setSystemSettings(res.data);
      seedByTypeCommission(res.data.default_commission_by_type);
      setEditing(false);
      showToast("success", "Global compensation defaults updated.");
    }
  };

  const handleCancel = () => {
    setGlobalCommissionKobo(
      systemSettings?.default_agent_commission_kobo != null ? (systemSettings.default_agent_commission_kobo / 100).toString() : ""
    );
    seedByTypeCommission(systemSettings?.default_commission_by_type);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] px-6 sm:px-8 py-8 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading global defaults...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#111111]">Global Service Defaults</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Default compensation paid to agents per completed service type when no vehicle-type settlement or agent override applies.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {COMPENSATION_TYPE_OPTIONS.map((opt) => (
          <div key={opt.value}>
            <label className="block text-xs font-medium text-slate-500 mb-1">{opt.label}</label>
            {editing ? (
              <input
                type="number"
                value={byTypeCommission[opt.value]}
                onChange={(e) => setByTypeCommission((prev) => ({ ...prev, [opt.value]: e.target.value }))}
                className={inputCls}
                placeholder="Uses fallback below"
              />
            ) : (
              <p className="text-[15px] font-medium text-slate-800">
                {byTypeCommission[opt.value]
                  ? `₦${Number(byTypeCommission[opt.value]).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "Uses fallback"}
              </p>
            )}
          </div>
        ))}
        <div className="sm:col-span-2 pt-4 border-t border-dashed border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fallback (all other types, ₦)</label>
          {editing ? (
            <input
              type="number"
              value={globalCommissionKobo}
              onChange={(e) => setGlobalCommissionKobo(e.target.value)}
              className={inputCls}
              placeholder="e.g. 1500 (leave empty for the built-in default)"
            />
          ) : (
            <p className="text-[15px] font-medium text-slate-800">
              {globalCommissionKobo
                ? `₦${Number(globalCommissionKobo).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "Built-in default"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 4. Full Per-Agent Override Section (with complete 10-service vehicle-type matrix) ──
function PerAgentOverrideSection({ showToast, triggerGlobalRefresh }) {
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [query, setQuery] = useState("");

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentComp, setAgentComp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Sub-tabs for selected agent
  const [agentTab, setAgentTab] = useState("vehicle_type"); // "vehicle_type" | "licence" | "fallback"
  const [agentVehicleSubFamily, setAgentVehicleSubFamily] = useState("particulars"); // "particulars" | "plate"
  const [expandedServices, setExpandedServices] = useState(new Set(["vehicle_licence", "number_plate_new"]));

  // Editing state for vehicle type grid for this agent
  const [editingServiceKey, setEditingServiceKey] = useState(null);
  const [draftValues, setDraftValues] = useState({});
  const [quickFillVal, setQuickFillVal] = useState("");
  const [syncUndisbursedOnSave, setSyncUndisbursedOnSave] = useState(true);
  const [savingService, setSavingService] = useState(false);

  // Editing state for DL & non-vehicle services
  const [editingGeneralKey, setEditingGeneralKey] = useState(null);
  const [generalDraftVal, setGeneralDraftVal] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Editing state for flat fallback
  const [editingFlat, setEditingFlat] = useState(false);
  const [flatDraftVal, setFlatDraftVal] = useState("");
  const [savingFlat, setSavingFlat] = useState(false);

  // Per-agent sync undisbursed state
  const [syncingThisAgent, setSyncingThisAgent] = useState(false);

  // Bulk Compensation Modal state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkVal, setBulkVal] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [bulkOnlyNeverDisbursed, setBulkOnlyNeverDisbursed] = useState(false);
  const [applyingBulk, setApplyingBulk] = useState(false);

  const loadAgents = async () => {
    const res = await adminGetAgents();
    if (res.data && Array.isArray(res.data)) {
      setAgents(res.data);
    }
    setLoadingAgents(false);
  };

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAgentCompensation = async (agentId) => {
    setLoadingDetail(true);
    const res = await getAdminAgentCompensation(agentId);
    if (res.data) {
      setAgentComp(res.data);
    } else if (res.error) {
      showToast("error", "Could not load compensation details for this agent: " + res.error);
    }
    setLoadingDetail(false);
  };

  const handleSelectAgent = async (agent) => {
    setSelectedAgent(agent);
    setEditingServiceKey(null);
    setEditingGeneralKey(null);
    setEditingFlat(false);
    await loadAgentCompensation(agent.id);
  };

  // Map of cells: `${service_key}|${vehicle_category ?? ""}` -> AgentCompensationDetailItem
  const cellMap = useMemo(() => {
    if (!agentComp?.items) return {};
    const map = {};
    for (const item of agentComp.items) {
      const k = `${item.service_key}|${item.vehicle_category ?? ""}`;
      map[k] = item;
    }
    return map;
  }, [agentComp]);

  const toggleExpandService = (serviceKey) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceKey)) next.delete(serviceKey);
      else next.add(serviceKey);
      return next;
    });
  };

  // ── Vehicle Category Override Helpers for Agent ──
  const startEditingService = (serviceKey) => {
    setEditingServiceKey(serviceKey);
    setQuickFillVal("");
    setSyncUndisbursedOnSave(true);
    const drafts = {};
    for (const cat of VEHICLE_CATEGORY_OPTIONS) {
      const k = `${serviceKey}|${cat.value}`;
      const item = cellMap[k];
      drafts[cat.value] = item?.override_kobo != null ? (item.override_kobo / 100).toString() : "";
    }
    const kNull = `${serviceKey}|`;
    const itemNull = cellMap[kNull];
    drafts[""] = itemNull?.override_kobo != null ? (itemNull.override_kobo / 100).toString() : "";
    setDraftValues(drafts);
    setExpandedServices((prev) => new Set([...prev, serviceKey]));
  };

  const cancelEditingService = () => {
    setEditingServiceKey(null);
    setDraftValues({});
    setQuickFillVal("");
  };

  const handleApplyQuickFill = () => {
    if (quickFillVal === "") return;
    setDraftValues((prev) => {
      const updated = { ...prev };
      for (const cat of VEHICLE_CATEGORY_OPTIONS) {
        updated[cat.value] = quickFillVal;
      }
      return updated;
    });
  };

  const handleClearAllDrafts = () => {
    setDraftValues((prev) => {
      const updated = {};
      for (const cat of VEHICLE_CATEGORY_OPTIONS) {
        updated[cat.value] = "";
      }
      updated[""] = "";
      return updated;
    });
  };

  const handleSaveService = async (serviceKey) => {
    setSavingService(true);
    const payloadItems = [
      ...VEHICLE_CATEGORY_OPTIONS.map((cat) => {
        const strVal = draftValues[cat.value];
        return {
          service_key: serviceKey,
          vehicle_category: cat.value,
          compensation_kobo: strVal !== "" && strVal != null ? Math.round(parseFloat(strVal) * 100) : null,
          is_active: true,
        };
      }),
      {
        service_key: serviceKey,
        vehicle_category: null,
        compensation_kobo: draftValues[""] !== "" && draftValues[""] != null ? Math.round(parseFloat(draftValues[""]) * 100) : null,
        is_active: true,
      },
    ];

    const res = await updateAdminAgentCompensation(selectedAgent.id, {
      items: payloadItems,
      sync_undisbursed: syncUndisbursedOnSave,
    });
    setSavingService(false);

    if (res.error) {
      showToast("error", "Failed to update agent compensation: " + res.error);
      return;
    }

    if (res.data) {
      setAgentComp(res.data);
    }
    setEditingServiceKey(null);
    showToast("success", `Rates updated for ${agentComp?.agent_name || selectedAgent.name}`);
  };

  const handleRevertSingleCategory = async (serviceKey, vehicleCategory) => {
    const payloadItems = [
      {
        service_key: serviceKey,
        vehicle_category: vehicleCategory,
        compensation_kobo: null,
        is_active: true,
      },
    ];
    const res = await updateAdminAgentCompensation(selectedAgent.id, {
      items: payloadItems,
      sync_undisbursed: true,
    });
    if (res.data) {
      setAgentComp(res.data);
      showToast("success", "Category override reverted to general rate.");
    } else if (res.error) {
      showToast("error", res.error);
    }
  };

  // ── DL / General Overrides Helpers ──
  const startEditingGeneral = (key) => {
    const currentKobo = agentComp?.general_overrides?.[key];
    setGeneralDraftVal(currentKobo != null ? (currentKobo / 100).toString() : "");
    setEditingGeneralKey(key);
  };

  const handleSaveGeneral = async (key) => {
    setSavingGeneral(true);
    const val = generalDraftVal !== "" ? Math.round(parseFloat(generalDraftVal) * 100) : null;
    const res = await updateAdminAgentCompensation(selectedAgent.id, {
      general_overrides: { [key]: val },
      sync_undisbursed: true,
    });
    setSavingGeneral(false);

    if (res.error) {
      showToast("error", "Failed to update override: " + res.error);
      return;
    }
    if (res.data) {
      setAgentComp(res.data);
      setEditingGeneralKey(null);
      showToast("success", "Service override updated.");
    }
  };

  // ── Flat Fallback Helpers ──
  const handleSaveFlat = async (koboValue) => {
    setSavingFlat(true);
    const res = await updateAdminAgentCompensation(selectedAgent.id, {
      custom_commission_kobo: koboValue,
      sync_undisbursed: true,
    });
    setSavingFlat(false);

    if (res.error) {
      showToast("error", "Failed to update flat commission: " + res.error);
      return;
    }
    if (res.data) {
      setAgentComp(res.data);
      setEditingFlat(false);
      setAgents((list) =>
        list.map((a) => (a.id === selectedAgent.id ? { ...a, agent_profile: { ...a.agent_profile, custom_commission_kobo: koboValue } } : a))
      );
      showToast("success", "Flat fallback updated.");
    }
  };

  // ── Sync Undisbursed For Selected Agent ──
  const handleSyncThisAgent = async () => {
    setSyncingThisAgent(true);
    const res = await syncAdminUndisbursedCompensation({
      agent_id: selectedAgent.id,
      update_never_disbursed_agents: true,
    });
    setSyncingThisAgent(false);

    if (res.error) {
      showToast("error", "Sync failed: " + res.error);
      return;
    }
    if (res.data) {
      await loadAgentCompensation(selectedAgent.id);
      await loadAgents();
      showToast(
        "success",
        `Synced: ${res.data.transfers_updated} pending transfers (${koboToNaira(res.data.transfers_total_delta_kobo)} net delta) and ${res.data.items_updated} open items.`
      );
    }
  };

  // ── Bulk Apply ──
  const handleApplyBulk = async () => {
    const val = bulkVal !== "" ? Math.round(parseFloat(bulkVal) * 100) : null;
    const isAllTypes = bulkType === "";
    const onlyNeverDisbursed = isAllTypes && bulkOnlyNeverDisbursed;
    const typeLabel = isAllTypes ? "all types (flat override)" : COMPENSATION_TYPE_OPTIONS.find((o) => o.value === bulkType)?.label;
    const scope = onlyNeverDisbursed ? "every agent who has never yet been disbursed" : "every agent";
    const action =
      val === null
        ? `reset ${scope}'s ${typeLabel} compensation to the system default`
        : `set ${scope}'s ${typeLabel} compensation to ${koboToNaira(val)}`;
    const warning = onlyNeverDisbursed
      ? "agents who have already received at least one successful payout are left untouched, however low their current compensation is"
      : isAllTypes
      ? "overwriting any individual overrides already in place"
      : "individual flat overrides and other types are left untouched";
    if (!window.confirm(`This will ${action}, ${warning}. Continue?`)) return;
    setApplyingBulk(true);
    const res = await bulkUpdateAgentCommission(val, isAllTypes ? null : bulkType, onlyNeverDisbursed);
    setApplyingBulk(false);
    if (res.error) {
      showToast("error", "Could not update compensation for all agents.");
      return;
    }
    await loadAgents();
    if (selectedAgent) {
      await loadAgentCompensation(selectedAgent.id);
    }
    setBulkOpen(false);
    setBulkVal("");
    setBulkType("");
    setBulkOnlyNeverDisbursed(false);
    showToast("success", `Compensation updated for ${res.data?.updated_count ?? "all"} agents.`);
  };

  const q = query.toLowerCase();
  const filteredAgents = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.agent_profile?.vio_office?.toLowerCase().includes(q)
  );

  const activeServices = agentVehicleSubFamily === "particulars" ? PARTICULAR_DOC_TYPES : NUMBER_PLATE_TYPES;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#111111]">Per-Agent Compensation Overrides</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure agent-specific prices across all 10 vehicle services and licence types, and sync undisbursed payouts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setBulkVal("");
            setBulkType("");
            setBulkOnlyNeverDisbursed(false);
            setBulkOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold text-[#28A745] bg-[#28A745]/5 border border-[#28A745]/20 hover:bg-[#28A745]/10 transition-colors whitespace-nowrap shrink-0"
        >
          <Wallet className="h-3.5 w-3.5" />
          Set Flat Rate for All Agents
        </button>
      </div>

      {/* Search Header */}
      <div className="px-6 sm:px-8 py-4 border-b border-slate-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents by name, email, or office..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
        {/* Agent List Column */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-100 max-h-[700px] overflow-y-auto divide-y divide-slate-100">
          {loadingAgents ? (
            <div className="py-20 text-center text-[13px] text-slate-400">Loading agents&hellip;</div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-20 text-center text-[13px] text-slate-400">No agents match your search.</div>
          ) : (
            filteredAgents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              const hasFlat = agent.agent_profile?.custom_commission_kobo != null;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleSelectAgent(agent)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                    isSelected ? "bg-emerald-50/80 border-r-2 border-[#28A745]" : "hover:bg-slate-50"
                  }`}
                >
                  <Avatar name={agent.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{agent.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{agent.agent_profile?.vio_office || agent.email}</p>
                  </div>
                  {hasFlat && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                      {koboToNaira(agent.agent_profile.custom_commission_kobo)}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Selected Agent Details Column */}
        <div className="lg:col-span-8 p-6 sm:p-8">
          {!selectedAgent ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700">No Agent Selected</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Select an agent from the left to view or customize their compensation rates by vehicle type and sync undisbursed payouts.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="h-full flex items-center justify-center py-24 gap-3 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#28A745]" />
              Loading agent compensation profile...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agent Overview Header */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar name={agentComp?.agent_name || selectedAgent.name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 truncate">
                        {agentComp?.agent_name || selectedAgent.name}
                      </h3>
                      {agentComp?.has_been_disbursed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Disbursed ({agentComp.disbursed_count} payouts)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3" />
                          Never Disbursed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {agentComp?.agent_email || selectedAgent.email}
                      {selectedAgent.agent_profile?.vio_office ? ` · ${selectedAgent.agent_profile.vio_office}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSyncThisAgent}
                    disabled={syncingThisAgent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200/80 transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingThisAgent ? "animate-spin" : ""}`} />
                    Sync Undisbursed For This Agent
                  </button>
                </div>
              </div>

              {/* Legacy ₦10,000 Alert for Never-Disbursed Agents */}
              {agentComp?.custom_commission_kobo === 1000000 && !agentComp?.has_been_disbursed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-950">Legacy Default Flat Commission Detected (₦10,000)</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      This agent has the default onboarding ₦10,000 flat fallback. This may shadow lower vehicle-type rates. Clear this flat override to ensure the agent receives the exact rates from the Vehicle Type Settlement grid.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSaveFlat(null)}
                      disabled={savingFlat}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors disabled:opacity-60"
                    >
                      {savingFlat ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Clear Flat Override (Inherit Vehicle Type Grid)
                    </button>
                  </div>
                </div>
              )}

              {/* Agent Sub-Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setAgentTab("vehicle_type")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    agentTab === "vehicle_type" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  Vehicle Type Settlement
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/20">10 Services</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgentTab("licence")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    agentTab === "licence" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Licence & Other Services
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/20">5 Types</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgentTab("fallback")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    agentTab === "fallback" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Flat Fallback Override
                  {agentComp?.custom_commission_kobo != null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-500 text-white">Active</span>
                  )}
                </button>
              </div>

              {/* Sub-tab 1: Vehicle Type Settlement for this agent */}
              {agentTab === "vehicle_type" && (
                <div className="space-y-4">
                  {/* Category Filter Toggle */}
                  <div className="flex items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-xl">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAgentVehicleSubFamily("particulars")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          agentVehicleSubFamily === "particulars" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Vehicle Particulars (5 Docs)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgentVehicleSubFamily("plate")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          agentVehicleSubFamily === "plate" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Plate Numbers (5 Types)
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 px-2 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Agent Custom
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span> Inherits General
                      </span>
                    </div>
                  </div>

                  {/* Service Cards for this agent */}
                  <div className="space-y-3.5">
                    {activeServices.map((svc) => {
                      const isExpanded = expandedServices.has(svc.key);
                      const isEditing = editingServiceKey === svc.key;

                      let customCount = 0;
                      for (const cat of VEHICLE_CATEGORY_OPTIONS) {
                        const k = `${svc.key}|${cat.value}`;
                        if (cellMap[k]?.is_override) customCount++;
                      }
                      const fallbackItem = cellMap[`${svc.key}|`];

                      return (
                        <div key={svc.key} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                          {/* Card Header */}
                          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#28A745]/10 text-[#28A745] flex items-center justify-center shrink-0">
                                {agentVehicleSubFamily === "particulars" ? <FileText className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-[13.5px] font-semibold text-slate-900">{svc.label}</h4>
                                  {customCount > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800">
                                      {customCount} of 12 categories customized
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-500">
                                      Inheriting general rates
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditingService(svc.key)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#28A745] bg-[#28A745]/10 hover:bg-[#28A745]/15 transition-colors inline-flex items-center gap-1"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Edit Agent Rates
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandService(svc.key)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveService(svc.key)}
                                    disabled={savingService}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#28A745] text-white hover:bg-[#218838] transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
                                  >
                                    {savingService ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingService}
                                    disabled={savingService}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="p-5 space-y-4">
                              {/* Batch Fill Bar during Edit Mode */}
                              {isEditing && (
                                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#28A745]" />
                                    <span className="font-semibold text-emerald-950">Quick Fill:</span>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₦</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        placeholder="e.g. 2500"
                                        value={quickFillVal}
                                        onChange={(e) => setQuickFillVal(e.target.value)}
                                        className="pl-6 pr-3 py-1 w-28 rounded-lg bg-white border border-emerald-200 text-xs focus:outline-none focus:border-[#28A745]"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleApplyQuickFill}
                                      disabled={!quickFillVal}
                                      className="px-2.5 py-1 rounded-lg bg-[#28A745] text-white font-semibold hover:bg-[#218838] disabled:opacity-50 transition-colors"
                                    >
                                      Apply to 12 Categories
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleClearAllDrafts}
                                    className="text-slate-500 hover:text-red-600 inline-flex items-center gap-1 font-medium transition-colors"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset All to General
                                  </button>
                                </div>
                              )}

                              {/* 12 Vehicle Categories Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {VEHICLE_CATEGORY_OPTIONS.map((cat) => {
                                  const cellKey = `${svc.key}|${cat.value}`;
                                  const item = cellMap[cellKey];
                                  const draftVal = isEditing ? draftValues[cat.value] : null;

                                  return (
                                    <div
                                      key={cat.value}
                                      className={`rounded-xl border p-3 flex flex-col justify-between gap-2 transition-all ${
                                        isEditing
                                          ? "bg-white border-slate-200 shadow-2xs"
                                          : item?.is_override
                                          ? "bg-emerald-50/60 border-emerald-200/90"
                                          : "bg-slate-50/70 border-slate-200/60"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[12px] font-semibold text-slate-800 leading-snug truncate">
                                          {cat.label}
                                        </span>
                                        {!isEditing && item?.is_override && (
                                          <button
                                            type="button"
                                            title="Revert to general rate"
                                            onClick={() => handleRevertSingleCategory(svc.key, cat.value)}
                                            className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>

                                      {isEditing ? (
                                        <div className="relative">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₦</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            value={draftVal || ""}
                                            onChange={(e) =>
                                              setDraftValues((prev) => ({
                                                ...prev,
                                                [cat.value]: e.target.value,
                                              }))
                                            }
                                            placeholder={item?.effective_kobo != null ? `Inherits ₦${item.effective_kobo / 100}` : "Inherits"}
                                            className="w-full pl-6 pr-6 py-1 rounded-lg text-xs bg-white border border-slate-200 focus:outline-none focus:border-[#28A745]"
                                          />
                                          {draftVal && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setDraftValues((prev) => ({
                                                  ...prev,
                                                  [cat.value]: "",
                                                }))
                                              }
                                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-2">
                                          {item?.is_override ? (
                                            <>
                                              <span className="text-xs font-bold text-emerald-800">
                                                {koboToNaira(item.override_kobo)}
                                              </span>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800">
                                                Agent Custom
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-xs font-medium text-slate-600">
                                                {item?.effective_kobo != null ? koboToNaira(item.effective_kobo) : "Inherits"}
                                              </span>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-slate-200/80 text-slate-600">
                                                Inherits General
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Baseline Category-Agnostic Fallback Card */}
                              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                                    Agent Baseline Fallback
                                  </span>
                                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                                    Default paid to this agent for categories without custom prices.
                                  </p>
                                </div>

                                <div className="shrink-0">
                                  {isEditing ? (
                                    <div className="relative w-36">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₦</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={draftValues[""] || ""}
                                        onChange={(e) =>
                                          setDraftValues((prev) => ({
                                            ...prev,
                                            "": e.target.value,
                                          }))
                                        }
                                        placeholder="Inherits general"
                                        className="w-full pl-6 pr-6 py-1 rounded-lg text-xs bg-white border border-blue-200 focus:outline-none focus:border-[#28A745]"
                                      />
                                      {draftValues[""] && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDraftValues((prev) => ({
                                              ...prev,
                                              "": "",
                                            }))
                                          }
                                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      {fallbackItem?.is_override ? (
                                        <span className="text-xs font-bold text-emerald-800">
                                          {koboToNaira(fallbackItem.override_kobo)} (Custom)
                                        </span>
                                      ) : fallbackItem?.effective_kobo != null ? (
                                        <span className="text-xs font-medium text-slate-600">
                                          {koboToNaira(fallbackItem.effective_kobo)} (General)
                                        </span>
                                      ) : (
                                        <span className="text-xs text-slate-400 italic">Inherits general baseline</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Footer Option during Edit */}
                              {isEditing && (
                                <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={syncUndisbursedOnSave}
                                    onChange={(e) => setSyncUndisbursedOnSave(e.target.checked)}
                                    className="rounded border-slate-300 text-[#28A745] focus:ring-[#28A745]"
                                  />
                                  <span>Sync undisbursed transfers and items for this agent immediately upon saving</span>
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Licence & Other Services */}
              {agentTab === "licence" && (
                <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  <div className="bg-slate-50/70 px-5 py-3 text-xs font-semibold text-slate-700">
                    Driver's Licence & Document Application Overrides
                  </div>

                  {DL_AND_OTHER_SERVICES.map((svc) => {
                    const currentOverride = agentComp?.general_overrides?.[svc.key];
                    const isEditingThis = editingGeneralKey === svc.key;

                    return (
                      <div key={svc.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900">{svc.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{svc.desc}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isEditingThis ? (
                            <div className="flex items-center gap-1.5">
                              <div className="relative w-32">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₦</span>
                                <input
                                  type="number"
                                  autoFocus
                                  value={generalDraftVal}
                                  onChange={(e) => setGeneralDraftVal(e.target.value)}
                                  className="w-full pl-6 pr-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs focus:border-[#28A745] focus:outline-none"
                                  placeholder="Default"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveGeneral(svc.key)}
                                disabled={savingGeneral}
                                className="px-3 py-1 bg-[#28A745] text-white rounded text-xs font-semibold disabled:opacity-70"
                              >
                                {savingGeneral ? "…" : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGeneralKey(null)}
                                disabled={savingGeneral}
                                className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-xs"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {currentOverride != null ? (
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {koboToNaira(currentOverride)} (Custom)
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Inherits global default</span>
                              )}
                              <button
                                type="button"
                                onClick={() => startEditingGeneral(svc.key)}
                                className="text-[#28A745] hover:text-[#218838] p-1 rounded transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-tab 3: Flat Fallback Override */}
              {agentTab === "fallback" && (
                <div className="rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Agent Flat Fallback Commission</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      This flat amount applies when no vehicle-type settlement rate or service-specific override matches.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Current Setting:</span>
                      {agentComp?.custom_commission_kobo != null ? (
                        <span className="text-lg font-bold text-slate-900">{koboToNaira(agentComp.custom_commission_kobo)}</span>
                      ) : (
                        <span className="text-sm text-slate-500 italic">No flat override (Inherits system fallback)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {agentComp?.custom_commission_kobo != null && (
                        <button
                          type="button"
                          onClick={() => handleSaveFlat(null)}
                          disabled={savingFlat}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors disabled:opacity-60"
                        >
                          Remove Flat Override
                        </button>
                      )}

                      {!editingFlat ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFlatDraftVal(
                              agentComp?.custom_commission_kobo != null
                                ? (agentComp.custom_commission_kobo / 100).toString()
                                : ""
                            );
                            setEditingFlat(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#28A745] text-white text-xs font-semibold hover:bg-[#218838] transition-colors"
                        >
                          {agentComp?.custom_commission_kobo != null ? "Change Amount" : "Set Flat Override"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₦</span>
                            <input
                              type="number"
                              autoFocus
                              value={flatDraftVal}
                              onChange={(e) => setFlatDraftVal(e.target.value)}
                              placeholder="e.g. 3000"
                              className="w-full pl-6 pr-2 py-1 rounded bg-white border border-slate-200 text-xs focus:border-[#28A745] focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const val = flatDraftVal !== "" ? Math.round(parseFloat(flatDraftVal) * 100) : null;
                              handleSaveFlat(val);
                            }}
                            disabled={savingFlat}
                            className="px-3 py-1 bg-[#28A745] text-white rounded text-xs font-semibold disabled:opacity-70"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFlat(false)}
                            className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Compensation Modal */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#28A745]">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-slate-900">Set Flat Compensation for All Agents</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  Applies one compensation value to every agent's next completed job for the chosen type. Choose "All types" to set the flat fallback override, or pick a specific service type.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Compensation Type</label>
                <select
                  value={bulkType}
                  onChange={(e) => {
                    setBulkType(e.target.value);
                    if (e.target.value !== "") setBulkOnlyNeverDisbursed(false);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
                >
                  <option value="">All types (flat fallback override)</option>
                  {COMPENSATION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {bulkType === "" && (
                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkOnlyNeverDisbursed}
                    onChange={(e) => setBulkOnlyNeverDisbursed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#28A745] focus:ring-[#28A745]"
                  />
                  <span className="text-[12.5px] leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-800">Only agents never yet disbursed.</span> Leaves anyone who has already received at least one payout untouched.
                  </span>
                </label>
              )}
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Compensation Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">₦</span>
                  <input
                    type="number"
                    value={bulkVal}
                    onChange={(e) => setBulkVal(e.target.value)}
                    placeholder="e.g. 2000 (leave empty to reset to system default)"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
                  />
                </div>
              </div>
            </div>
            <div className="pt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                disabled={applyingBulk}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulk}
                disabled={applyingBulk}
                className="flex-1 rounded-xl px-4 py-3 text-[13.5px] font-semibold text-white transition-all disabled:opacity-70"
                style={{ background: "#28A745" }}
              >
                {applyingBulk ? "Applying..." : "Apply to All Agents"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
