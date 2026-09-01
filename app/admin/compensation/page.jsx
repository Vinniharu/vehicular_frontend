"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Pencil, X, Save, Loader2, Search, Wallet } from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  adminGetAgents,
  adminGetAgent,
  updateAgentCommission,
  bulkUpdateAgentCommission,
} from "@/lib/api";

const BRAND = "#28A745";
const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";

// The complete canonical compensation-type list — 11 keys, covering every
// service that pays an agent (DL family + tinted permit + number plate +
// the 5 vehicle-particulars document types). Note: this fixes a real bug
// the old /admin/settings page had — it only listed 5 of these 11 keys,
// and its PATCH does a wholesale dict replace, so saving it silently wiped
// any global override ever set for tinted_permit or any particulars type.
const COMPENSATION_TYPE_OPTIONS = [
  { value: "fresh", label: "Fresh" },
  { value: "renewal", label: "Renewal" },
  { value: "reissue", label: "Reissue" },
  { value: "international_permit", label: "International Permit" },
  { value: "tinted_permit", label: "Tinted Permit" },
  { value: "number_plate", label: "Number Plate" },
  { value: "vehicle_licence", label: "Vehicle Particulars — Vehicle Licence" },
  { value: "road_worthiness", label: "Vehicle Particulars — Road Worthiness" },
  { value: "proof_of_ownership", label: "Vehicle Particulars — Proof of Ownership" },
  { value: "insurance_third_party", label: "Vehicle Particulars — Third-Party Insurance" },
  { value: "hackney_permit", label: "Vehicle Particulars — Hackney Permit" },
];

function koboToNaira(kobo) {
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
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

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

      <div>
        <h1
          className="text-[28px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Compensation
        </h1>
        <p className="text-sm text-[#7A7A7A] mt-1">
          Set what agents earn per completed job — a global default for all agents, plus per-agent overrides. Not connected to pricing.
        </p>
      </div>

      <GlobalDefaultsSection showToast={showToast} />
      <PerAgentOverrideSection showToast={showToast} />
    </div>
  );
}

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
    // Always send the complete 11-key dict -- the backend PATCH does a
    // wholesale replace, so sending a partial dict would silently wipe
    // whatever keys are omitted.
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
    setGlobalCommissionKobo(systemSettings?.default_agent_commission_kobo != null ? (systemSettings.default_agent_commission_kobo / 100).toString() : "");
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
          <h2 className="font-display text-base font-semibold text-[#111111]">Global Defaults</h2>
          <p className="text-sm text-slate-500 mt-0.5">What every agent earns per completed job, unless they have their own override below.</p>
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
                {byTypeCommission[opt.value] ? `₦${Number(byTypeCommission[opt.value]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Uses fallback"}
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
              {globalCommissionKobo ? `₦${Number(globalCommissionKobo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Built-in default"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PerAgentOverrideSection({ showToast }) {
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [query, setQuery] = useState("");

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [editingType, setEditingType] = useState(null); // null | "flat" | one of COMPENSATION_TYPE_OPTIONS' values
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkVal, setBulkVal] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [bulkOnlyNeverDisbursed, setBulkOnlyNeverDisbursed] = useState(false);
  const [applyingBulk, setApplyingBulk] = useState(false);

  const loadAgents = async () => {
    const res = await adminGetAgents();
    if (res.data && Array.isArray(res.data)) setAgents(res.data);
    setLoadingAgents(false);
  };

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.toLowerCase();
  const filteredAgents = agents.filter(
    (a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.agent_profile?.vio_office?.toLowerCase().includes(q)
  );

  const handleSelectAgent = async (agent) => {
    setSelectedAgent(agent);
    setEditingType(null);
    setLoadingDetail(true);
    const res = await adminGetAgent(agent.id);
    if (res.data) setSelectedAgent(res.data);
    setLoadingDetail(false);
  };

  const startEditing = (type) => {
    const profile = selectedAgent?.agent_profile;
    const currentKobo = type === "flat" ? profile?.custom_commission_kobo : profile?.custom_commission_by_type?.[type];
    setEditVal(currentKobo != null ? (currentKobo / 100).toString() : "");
    setEditingType(type);
  };

  const handleSaveOverride = async () => {
    setSaving(true);
    const val = editVal !== "" ? Math.round(parseFloat(editVal) * 100) : null;
    const isFlat = editingType === "flat";
    const res = await updateAgentCommission(selectedAgent.id, val, isFlat ? null : editingType);
    setSaving(false);
    if (res.error) {
      showToast("error", "Could not update this agent's compensation.");
      return;
    }
    const applyUpdate = (profile) => {
      if (isFlat) return { ...profile, custom_commission_kobo: val };
      const byType = { ...(profile.custom_commission_by_type || {}) };
      if (val === null) delete byType[editingType];
      else byType[editingType] = val;
      return { ...profile, custom_commission_by_type: byType };
    };
    setSelectedAgent((prev) => ({ ...prev, agent_profile: applyUpdate(prev.agent_profile) }));
    setAgents((list) => list.map((a) => (a.id === selectedAgent.id ? { ...a, agent_profile: applyUpdate(a.agent_profile) } : a)));
    setEditingType(null);
    showToast("success", "Agent compensation updated.");
  };

  const handleApplyBulk = async () => {
    const val = bulkVal !== "" ? Math.round(parseFloat(bulkVal) * 100) : null;
    const isAllTypes = bulkType === "";
    const onlyNeverDisbursed = isAllTypes && bulkOnlyNeverDisbursed;
    const typeLabel = isAllTypes ? "all types (flat override)" : COMPENSATION_TYPE_OPTIONS.find((o) => o.value === bulkType)?.label;
    const scope = onlyNeverDisbursed ? "every agent who has never yet been disbursed" : "every agent";
    const action = val === null ? `reset ${scope}'s ${typeLabel} compensation to the system default` : `set ${scope}'s ${typeLabel} compensation to ${koboToNaira(val)}`;
    const warning = onlyNeverDisbursed
      ? "agents who have already received at least one successful payout are left untouched, however low their current compensation is"
      : isAllTypes ? "overwriting any individual overrides already in place" : "individual flat overrides and other types are left untouched";
    if (!window.confirm(`This will ${action}, ${warning}. Continue?`)) return;
    setApplyingBulk(true);
    const res = await bulkUpdateAgentCommission(val, isAllTypes ? null : bulkType, onlyNeverDisbursed);
    setApplyingBulk(false);
    if (res.error) {
      showToast("error", "Could not update compensation for all agents.");
      return;
    }
    // A filtered ("only never-disbursed") bulk save can leave some agents
    // untouched, so we can't optimistically apply the new value to every
    // row in local state the way the unfiltered path can — reload from the
    // server instead to reflect exactly which agents actually changed.
    if (onlyNeverDisbursed) {
      await loadAgents();
    } else {
      setAgents((list) =>
        list.map((a) => {
          if (isAllTypes) return { ...a, agent_profile: { ...a.agent_profile, custom_commission_kobo: val } };
          const byType = { ...(a.agent_profile?.custom_commission_by_type || {}) };
          if (val === null) delete byType[bulkType];
          else byType[bulkType] = val;
          return { ...a, agent_profile: { ...a.agent_profile, custom_commission_by_type: byType } };
        })
      );
    }
    setBulkOpen(false);
    setBulkVal("");
    setBulkType("");
    setBulkOnlyNeverDisbursed(false);
    showToast("success", `Compensation updated for ${res.data?.updated_count ?? "all"} agents.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#111111]">Per-Agent Override</h2>
          <p className="text-sm text-slate-500 mt-0.5">Pick an agent to set a compensation override just for them.</p>
        </div>
        <button
          type="button"
          onClick={() => { setBulkVal(""); setBulkType(""); setBulkOnlyNeverDisbursed(false); setBulkOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold text-[#28A745] bg-[#28A745]/5 border border-[#28A745]/20 hover:bg-[#28A745]/10 transition-colors whitespace-nowrap shrink-0"
        >
          <Wallet className="h-3.5 w-3.5" />
          Set Compensation for All Agents
        </button>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Agent list */}
        <div className="border-b lg:border-b-0 lg:border-r border-slate-100 max-h-[420px] overflow-y-auto">
          {loadingAgents ? (
            <div className="py-16 text-center text-[13px] text-slate-400">Loading agents&hellip;</div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-slate-400">No agents match your search.</div>
          ) : (
            filteredAgents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => handleSelectAgent(agent)}
                className={`w-full flex items-center gap-3 px-6 sm:px-8 py-3 text-left transition-colors ${selectedAgent?.id === agent.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}
              >
                <Avatar name={agent.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{agent.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{agent.agent_profile?.vio_office || agent.email}</p>
                </div>
                {agent.agent_profile?.custom_commission_kobo != null && (
                  <span className="text-[11px] font-semibold text-emerald-700 shrink-0">{koboToNaira(agent.agent_profile.custom_commission_kobo)}</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Selected agent's override panel */}
        <div className="px-6 sm:px-8 py-6">
          {!selectedAgent ? (
            <div className="h-full flex items-center justify-center py-16 text-center text-[13px] text-slate-400">
              Select an agent to view or edit their compensation override.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <Avatar name={selectedAgent.name} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900 truncate">{selectedAgent.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{selectedAgent.email}{loadingDetail ? " · Loading…" : ""}</p>
                </div>
              </div>

              {COMPENSATION_TYPE_OPTIONS.map((opt) => {
                const rowVal = selectedAgent.agent_profile?.custom_commission_by_type?.[opt.value];
                const isEditingRow = editingType === opt.value;
                return (
                  <div key={opt.value} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-slate-500 shrink-0">{opt.label}:</span>
                    {!isEditingRow ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{rowVal != null ? koboToNaira(rowVal) : "System Default"}</span>
                        <button onClick={() => startEditing(opt.value)} className="text-[#28A745] hover:text-[#218838]">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">₦</span>
                          <input
                            type="number"
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            className="w-28 pl-5 pr-2 py-1 rounded bg-slate-50 border border-slate-200 text-[12px] focus:border-[#28A745] focus:outline-none"
                            placeholder="Default"
                          />
                        </div>
                        <button onClick={handleSaveOverride} disabled={saving} className="px-2 py-1 bg-[#28A745] text-white rounded text-[11px] font-semibold disabled:opacity-70">
                          {saving ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditingType(null)} disabled={saving} className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-[11px] font-medium">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-dashed border-slate-200 text-[13px]">
                <span className="text-slate-500 shrink-0">Fallback (all other types):</span>
                {editingType !== "flat" ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {selectedAgent.agent_profile?.custom_commission_kobo != null ? koboToNaira(selectedAgent.agent_profile.custom_commission_kobo) : "System Default"}
                    </span>
                    <button onClick={() => startEditing("flat")} className="text-[#28A745] hover:text-[#218838]">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">₦</span>
                      <input
                        type="number"
                        autoFocus
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        className="w-28 pl-5 pr-2 py-1 rounded bg-slate-50 border border-slate-200 text-[12px] focus:border-[#28A745] focus:outline-none"
                        placeholder="Default"
                      />
                    </div>
                    <button onClick={handleSaveOverride} disabled={saving} className="px-2 py-1 bg-[#28A745] text-white rounded text-[11px] font-semibold disabled:opacity-70">
                      {saving ? "…" : "Save"}
                    </button>
                    <button onClick={() => setEditingType(null)} disabled={saving} className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-[11px] font-medium">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
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
                <h3 className="text-[17px] font-bold text-slate-900">Set Compensation for All Agents</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  Applies one compensation value to every agent's next completed job for the chosen type. Choose
                  "All types" to overwrite the flat fallback override, or pick a specific type to set just that
                  one without touching flat overrides or other types.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Compensation Type</label>
                <select
                  value={bulkType}
                  onChange={(e) => { setBulkType(e.target.value); if (e.target.value !== "") setBulkOnlyNeverDisbursed(false); }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
                >
                  <option value="">All types (flat override)</option>
                  {COMPENSATION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    <span className="font-semibold text-slate-800">Only agents never yet disbursed.</span> Leaves anyone
                    who has already received at least one successful payout untouched, no matter how low their
                    current compensation is.
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
              <button type="button" onClick={() => setBulkOpen(false)} disabled={applyingBulk} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={handleApplyBulk} disabled={applyingBulk} className="flex-1 rounded-xl px-4 py-3 text-[13.5px] font-semibold text-white transition-all disabled:opacity-70" style={{ background: "#28A745" }}>
                {applyingBulk ? "Applying..." : "Apply to All Agents"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
