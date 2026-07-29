"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Lock,
  Search,
  X,
  RefreshCw,
  Users,
  Shield,
  ChevronDown,
  Wallet,
  CreditCard,
  Eye,
  Calendar,
  Clock,
  Pencil,
  ArrowRight,
} from "lucide-react";
import {
  adminGetStaff,
  adminGetAgents,
  adminGetAgent,
  adminCreateStaff,
  adminCreateAgent,
  adminDeactivateStaff,
  adminDeactivateAgent,
  getAdminRelocationRequests,
  approveAgentRelocation,
  rejectAgentRelocation,
  updateAgentCommission,
  bulkUpdateAgentCommission,
  getReferenceStates,
  getReferenceLgas,
  adminUpdateAgentEligibility,
} from "@/lib/api";

const APPLICATION_TYPE_OPTIONS = [
  { value: "fresh", label: "Fresh" },
  { value: "renewal", label: "Renewal" },
  { value: "reissue", label: "Reissue" },
  { value: "international_permit", label: "International Permit" },
];

/* ─── Helpers ─── */
function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Status Badge ─── */
function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Deactivated
    </span>
  );
}

/* ─── Avatar ─── */
function Avatar({ name, color = "slate" }) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  const bg = color === "green"
    ? "linear-gradient(135deg, #28A745, #0a7a56)"
    : "linear-gradient(135deg, #334155, #1e293b)";
  return (
    <div
      className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
      style={{ background: bg }}
    >
      {letter}
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ message }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Users className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-[14px] text-slate-500 font-medium">{message}</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("staff");
  const [staffList, setStaffList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [relocationRequests, setRelocationRequests] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAgentDetail, setSelectedAgentDetail] = useState(null);
  const [loadingAgentDetail, setLoadingAgentDetail] = useState(false);
  
  const [editingCommission, setEditingCommission] = useState(false);
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [customCommissionVal, setCustomCommissionVal] = useState("");

  const [bulkCommissionOpen, setBulkCommissionOpen] = useState(false);
  const [bulkCommissionVal, setBulkCommissionVal] = useState("");
  const [applyingBulkCommission, setApplyingBulkCommission] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("staff");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [confirmDeactivateTarget, setConfirmDeactivateTarget] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+234");
  const [tempPassword, setTempPassword] = useState("Vehiculars2026!");
  const [vioOffice, setVioOffice] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [allowedApplicationTypes, setAllowedApplicationTypes] = useState(
    APPLICATION_TYPE_OPTIONS.map((o) => o.value)
  );

  const [editingEligibility, setEditingEligibility] = useState(false);
  const [detailAllowedTypes, setDetailAllowedTypes] = useState([]);
  const [updatingEligibility, setUpdatingEligibility] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = async () => {
    const [staffRes, agentsRes, statesRes, relocRes] = await Promise.all([
      adminGetStaff(),
      adminGetAgents(),
      getReferenceStates(),
      getAdminRelocationRequests()
    ]);
    if (staffRes.data && Array.isArray(staffRes.data)) setStaffList(staffRes.data);
    if (agentsRes.data && Array.isArray(agentsRes.data)) setAgentsList(agentsRes.data);
    if (statesRes.data && Array.isArray(statesRes.data)) setStates(statesRes.data);
    if (relocRes.data && Array.isArray(relocRes.data)) setRelocationRequests(relocRes.data);
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    async function fetchLgas() {
      if (!selectedState) { setLgas([]); return; }
      const res = await getReferenceLgas(selectedState);
      setLgas(res.data && Array.isArray(res.data) ? res.data : []);
    }
    fetchLgas();
  }, [selectedState]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openProvisionModal = (type) => {
    setModalType(type);
    setName(""); setEmail(""); setPhone("+234"); setTempPassword("Vehiculars2026!");
    setVioOffice(""); setSelectedState(""); setSelectedLga(""); setModalError(null);
    setAllowedApplicationTypes(APPLICATION_TYPE_OPTIONS.map((o) => o.value));
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    const payload = { name: name.trim(), email: email.trim(), phone: phone.trim(), temp_password: tempPassword };

    if (modalType === "staff") {
      const res = await adminCreateStaff(payload);
      setSubmitting(false);
      if (res.error) { setModalError(res.error); return; }
      setStaffList([res.data, ...staffList]);
      setIsModalOpen(false);
      showToast("success", `${res.data.name} has been provisioned as a verification staff member.`);
    } else {
      if (!vioOffice.trim() || !selectedState || !selectedLga) {
        setSubmitting(false);
        setModalError("Please complete all VIO office details including state and LGA.");
        return;
      }
      const stateObj = states.find((s) => String(s.id) === String(selectedState));
      const lgaObj = lgas.find((l) => String(l.id) === String(selectedLga));
      const isUnrestricted = allowedApplicationTypes.length === APPLICATION_TYPE_OPTIONS.length;
      const res = await adminCreateAgent({
        ...payload,
        vio_office: vioOffice.trim(),
        state: stateObj?.name || "",
        lga: lgaObj?.name || "",
        state_id: parseInt(selectedState, 10),
        lga_id: parseInt(selectedLga, 10),
        capabilities: ["driver_licence", "roadworthiness"],
        allowed_application_types: isUnrestricted ? null : allowedApplicationTypes,
      });
      setSubmitting(false);
      if (res.error) { setModalError(res.error); return; }
      setAgentsList([res.data, ...agentsList]);
      setIsModalOpen(false);
      showToast("success", `${res.data.name} has been provisioned as a VIO field agent at ${vioOffice}.`);
    }
  };

  const handleDeactivate = async (id, role, accountName) => {
    setConfirmDeactivateTarget(null);
    const res = role === "staff" ? await adminDeactivateStaff(id) : await adminDeactivateAgent(id);
    if (res.error) {
      showToast("error", `Unable to deactivate account. Please try again.`);
    } else {
      if (role === "staff") setStaffList(staffList.map((i) => i.id === id ? { ...i, is_active: false } : i));
      else setAgentsList(agentsList.map((i) => i.id === id ? { ...i, is_active: false } : i));
      showToast("success", `${accountName}'s account has been deactivated.`);
    }
  };

  const handleViewAgent = async (agent) => {
    setSelectedAgentDetail(agent);
    setLoadingAgentDetail(true);
    setEditingCommission(false);
    setEditingEligibility(false);
    const res = await adminGetAgent(agent.id);
    if (res.data) {
      setSelectedAgentDetail(res.data);
      if (res.data.agent_profile?.custom_commission_kobo !== null && res.data.agent_profile?.custom_commission_kobo !== undefined) {
        setCustomCommissionVal((res.data.agent_profile.custom_commission_kobo / 100).toString());
      } else {
        setCustomCommissionVal("");
      }
      const allowedTypes = res.data.agent_profile?.allowed_application_types;
      setDetailAllowedTypes(
        allowedTypes && allowedTypes.length > 0 ? allowedTypes : APPLICATION_TYPE_OPTIONS.map((o) => o.value)
      );
    }
    setLoadingAgentDetail(false);
  };

  const handleSaveEligibility = async () => {
    setUpdatingEligibility(true);
    const isUnrestricted = detailAllowedTypes.length === APPLICATION_TYPE_OPTIONS.length;
    const val = isUnrestricted ? null : detailAllowedTypes;
    const res = await adminUpdateAgentEligibility(selectedAgentDetail.id, val);
    setUpdatingEligibility(false);
    if (res.error) {
      showToast("error", "Could not update agent's allowed application types.");
    } else {
      setSelectedAgentDetail({
        ...selectedAgentDetail,
        agent_profile: { ...selectedAgentDetail.agent_profile, allowed_application_types: val },
      });
      setAgentsList((list) => list.map((a) => a.id === selectedAgentDetail.id
        ? { ...a, agent_profile: { ...a.agent_profile, allowed_application_types: val } }
        : a));
      setEditingEligibility(false);
      showToast("success", "Agent's allowed application types updated.");
    }
  };

  const handleSaveCommission = async () => {
    setUpdatingCommission(true);
    let val = null;
    if (customCommissionVal !== "") {
      val = Math.round(parseFloat(customCommissionVal) * 100);
    }
    const res = await updateAgentCommission(selectedAgentDetail.id, val);
    setUpdatingCommission(false);
    if (res.error) {
      showToast("error", "Could not update agent commission.");
    } else {
      setSelectedAgentDetail({
        ...selectedAgentDetail,
        agent_profile: {
          ...selectedAgentDetail.agent_profile,
          custom_commission_kobo: val
        }
      });
      setAgentsList((list) => list.map((a) => a.id === selectedAgentDetail.id
        ? { ...a, agent_profile: { ...a.agent_profile, custom_commission_kobo: val } }
        : a));
      setEditingCommission(false);
      showToast("success", "Agent commission updated.");
    }
  };

  const handleApplyBulkCommission = async () => {
    let val = null;
    if (bulkCommissionVal !== "") {
      val = Math.round(parseFloat(bulkCommissionVal) * 100);
    }
    const label = val === null ? "reset every agent's commission to the system default" : `set every agent's commission to ${koboToNaira(val)}`;
    if (!window.confirm(`This will ${label}, overwriting any individual overrides already in place. Continue?`)) return;
    setApplyingBulkCommission(true);
    const res = await bulkUpdateAgentCommission(val);
    setApplyingBulkCommission(false);
    if (res.error) {
      showToast("error", "Could not update commission for all agents.");
    } else {
      setAgentsList((list) => list.map((a) => ({
        ...a,
        agent_profile: { ...a.agent_profile, custom_commission_kobo: val },
      })));
      setBulkCommissionOpen(false);
      setBulkCommissionVal("");
      showToast("success", `Commission updated for ${res.data?.updated_count ?? "all"} agents.`);
    }
  };

  const handleApproveRelocation = async (agentId) => {
    const res = await approveAgentRelocation(agentId);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Relocation request approved.");
      loadData();
    }
  };

  const handleRejectRelocation = async (agentId) => {
    if (!window.confirm("Are you sure you want to reject this relocation request?")) return;
    const res = await rejectAgentRelocation(agentId);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Relocation request rejected.");
      loadData();
    }
  };

  const q = searchQuery.toLowerCase();
  const filteredStaff = staffList.filter((p) =>
    p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
  );
  const filteredAgents = agentsList.filter((p) =>
    p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) ||
    p.agent_profile?.vio_office?.toLowerCase().includes(q) || p.phone?.includes(q)
  );

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ─── Toast ─── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 pl-4 pr-5 py-3.5 rounded-xl shadow-xl border text-[13px] font-medium max-w-sm transition-all ${
          toast.type === "success"
            ? "bg-white border-emerald-200 text-slate-800"
            : "bg-white border-red-200 text-slate-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#28A745]" />
            : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />}
          <span className="flex-1 leading-snug">{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Staff & Agent Directory</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Manage verification staff and VIO field agents operating across Nigeria.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""} text-slate-500`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openProvisionModal(activeTab === "staff" ? "staff" : "agent")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
            style={{ background: "#28A745" }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {activeTab === "staff" ? "Add Staff Member" : "Add Field Agent"}
          </button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Verification Staff", value: staffList.length, sub: `${staffList.filter((s) => s.is_active).length} active` },
          { label: "VIO Field Agents", value: agentsList.length, sub: `${agentsList.filter((a) => a.is_active).length} active` },
          { label: "States Covered", value: new Set(agentsList.map((a) => a.agent_profile?.state).filter(Boolean)).size || "—", sub: "Operational areas" },
          { label: "Inactive Accounts", value: [...staffList, ...agentsList].filter((x) => !x.is_active).length, sub: "Deactivated access" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
            <p className="text-[28px] font-bold text-slate-900 mt-1 leading-none">{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Tab Bar & Search ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 self-start overflow-x-auto">
            {[
              { key: "staff", label: "Internal Staff", count: staffList.length },
              { key: "agents", label: "Field Agents", count: agentsList.length },
              { key: "relocations", label: "Relocations", count: relocationRequests.length },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all"
                style={{
                  background: activeTab === tab.key ? "#fff" : "transparent",
                  color: activeTab === tab.key ? "#0f172a" : "#64748b",
                  boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {tab.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab.key ? "bg-slate-100 text-slate-600" : "bg-slate-200/60 text-slate-400"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {activeTab === "agents" && (
              <button
                type="button"
                onClick={() => { setBulkCommissionVal(""); setBulkCommissionOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold text-[#28A745] bg-[#28A745]/5 border border-[#28A745]/20 hover:bg-[#28A745]/10 transition-colors whitespace-nowrap"
              >
                <Wallet className="h-3.5 w-3.5" />
                Set Commission for All Agents
              </button>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
              />
            </div>
          </div>
        </div>

        {/* ─── Table ─── */}
        {loading ? (
          <div className="py-20 text-center text-[13px] text-slate-400">Loading directory data&hellip;</div>
        ) : activeTab === "staff" ? (
          filteredStaff.length === 0 ? (
            <EmptyState message={searchQuery ? "No staff members match your search." : "No staff members have been provisioned yet."} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="py-3 px-5 font-semibold">Staff Member</th>
                    <th className="py-3 px-5 font-semibold">Contact</th>
                    <th className="py-3 px-5 font-semibold">Status</th>
                    <th className="py-3 px-5 font-semibold">Password</th>
                    <th className="py-3 px-5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((person, idx) => (
                    <tr
                      key={person.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={person.name} />
                          <div>
                            <p className="text-[13px] font-semibold text-slate-900">{person.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID #{person.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[12px] text-slate-700">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{person.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{person.phone || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge active={person.is_active} />
                      </td>
                      <td className="py-3.5 px-5">
                        {person.must_change_password ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Lock className="h-3 w-3" />
                            Change required
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400">Set</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {person.is_active ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeactivateTarget({ id: person.id, role: "staff", accountName: person.name })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200 transition-colors"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="text-[12px] text-slate-300 italic">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === "agents" ? (
          filteredAgents.length === 0 ? (
            <EmptyState message={searchQuery ? "No agents match your search." : "No field agents have been provisioned yet."} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="py-3 px-5 font-semibold">Field Agent</th>
                    <th className="py-3 px-5 font-semibold">Assigned Office</th>
                    <th className="py-3 px-5 font-semibold">Settlement &amp; Wallet</th>
                    <th className="py-3 px-5 font-semibold">Capabilities</th>
                    <th className="py-3 px-5 font-semibold">Commission</th>
                    <th className="py-3 px-5 font-semibold">Status</th>
                    <th className="py-3 px-5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => {
                    const profile = agent.agent_profile || {};
                    const bank = agent.bank_account;
                    const wallet = agent.wallet || { balance_kobo: 0, currency: "NGN" };
                    return (
                      <tr
                        key={agent.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={agent.name} color="green" />
                            <div>
                              <p className="text-[13px] font-semibold text-slate-900">{agent.name}</p>
                              <p className="text-[11px] font-mono text-slate-400">{agent.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
                              <Building2 className="h-3.5 w-3.5 text-[#28A745] shrink-0" />
                              {profile.vio_office || "—"}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 font-mono">
                              <MapPin className="h-3 w-3" />
                              {profile.state && profile.lga ? `${profile.state} · ${profile.lga}` : "Location not set"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[12px]">
                              <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {bank ? (
                                <span className="font-semibold text-slate-800 truncate max-w-[150px]" title={bank.account_name}>
                                  {bank.account_number} <span className="text-slate-400 font-normal">({bank.bank_code})</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No bank set</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px]">
                              <Wallet className="h-3.5 w-3.5 text-[#28A745] shrink-0" />
                              <span className="font-bold text-slate-900">{koboToNaira(wallet.balance_kobo)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {(profile.capabilities || ["driver_licence", "roadworthiness"]).map((cap) => (
                              <span
                                key={cap}
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                {cap.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          {profile.custom_commission_kobo !== null && profile.custom_commission_kobo !== undefined ? (
                            <span className="text-[12.5px] font-semibold text-slate-900">{koboToNaira(profile.custom_commission_kobo)}</span>
                          ) : (
                            <span className="text-[12px] text-slate-400 italic">Default</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <StatusBadge active={agent.is_active} />
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewAgent(agent)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </button>
                            {agent.is_active ? (
                              <button
                                type="button"
                                onClick={() => setConfirmDeactivateTarget({ id: agent.id, role: "agent", accountName: agent.name })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <span className="text-[12px] text-slate-300 italic px-2">Inactive</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === "relocations" ? (
          relocationRequests.length === 0 ? (
            <EmptyState message="No pending relocation requests." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {relocationRequests.map((req) => (
                <div key={req.agent_id} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar name={req.name} color="green" />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-900 truncate">{req.name}</p>
                      <p className="text-[11.5px] text-slate-500 font-mono">{req.phone}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 rounded-xl bg-white border border-slate-100 p-3.5">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-slate-700 truncate">{req.current_vio_office || "—"}</p>
                        <p className="text-[11px] text-slate-400">{req.current_lga}, {req.current_state}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-3.5 w-3.5 text-amber-500 rotate-90" />
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-amber-800 truncate">{req.pending_vio_office || "—"}</p>
                        <p className="text-[11px] text-amber-600">{req.pending_lga}, {req.pending_state}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApproveRelocation(req.agent_id)}
                      className="flex-1 rounded-xl bg-[#28A745] text-white px-3 py-2 text-[12.5px] font-semibold hover:bg-[#218838] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRelocation(req.agent_id)}
                      className="flex-1 rounded-xl bg-white border border-red-200 text-red-600 px-3 py-2 text-[12.5px] font-semibold hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>

      {/* ─── Provisioning Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">
                  {modalType === "staff" ? "Provision Verification Staff" : "Provision VIO Field Agent"}
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {modalType === "staff"
                    ? "The new staff member will set their own password on first sign-in."
                    : "The field agent will be assigned to a physical VIO headquarters."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {modalError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emeka Adeyemi"
                  required
                  className="w-full px-3.5 py-2.5 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@vio.gov.ng"
                    required
                    className="w-full px-3.5 py-2.5 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348033334444"
                    required
                    className="w-full px-3.5 py-2.5 text-[13px] font-mono rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
                  />
                </div>
              </div>

              {/* Temp Password */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-[13px] font-mono rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  User must change this password upon first login.
                </p>
              </div>

              {/* VIO Agent Fields */}
              {modalType === "agent" && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VIO Office Assignment</p>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Office / Center Name</label>
                    <input
                      type="text"
                      value={vioOffice}
                      onChange={(e) => setVioOffice(e.target.value)}
                      placeholder="e.g. Ikeja VIO Headquarters"
                      required
                      className="w-full px-3.5 py-2.5 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">State</label>
                      <div className="relative">
                        <select
                          value={selectedState}
                          onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(""); }}
                          required
                          className="w-full appearance-none px-3.5 py-2.5 pr-8 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
                        >
                          <option value="" disabled>Select state</option>
                          {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">LGA</label>
                      <div className="relative">
                        <select
                          value={selectedLga}
                          onChange={(e) => setSelectedLga(e.target.value)}
                          disabled={!selectedState || lgas.length === 0}
                          required
                          className="w-full appearance-none px-3.5 py-2.5 pr-8 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all disabled:opacity-50"
                        >
                          <option value="" disabled>Select LGA</option>
                          {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Allowed Application Types</label>
                    <div className="flex flex-wrap gap-2">
                      {APPLICATION_TYPE_OPTIONS.map((opt) => {
                        const checked = allowedApplicationTypes.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAllowedApplicationTypes((prev) =>
                                checked ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                              checked
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Uncheck a type to prevent this agent from being offered that kind of application. All checked = unrestricted.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "#28A745" }}
                >
                  {submitting ? "Provisioning…" : modalType === "staff" ? "Provision Staff Member" : "Provision Field Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Agent Profile Details Modal (`GET /admin/agents/{id}`) ─── */}
      {selectedAgentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <Avatar name={selectedAgentDetail.name} color="green" />
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">{selectedAgentDetail.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-400">ID #{selectedAgentDetail.id}</span>
                    <span className="text-slate-300">·</span>
                    <StatusBadge active={selectedAgentDetail.is_active} />
                    {loadingAgentDetail && (
                      <span className="text-[11px] text-slate-400 italic">Updating…</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgentDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Wallet & Payout Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Wallet Balance</p>
                    <p className="text-[22px] font-bold text-slate-900 mt-1">
                      {koboToNaira(selectedAgentDetail.wallet?.balance_kobo || 0)}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center text-[#28A745]">
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Payout Bank Account</p>
                    {selectedAgentDetail.bank_account ? (
                      <div className="mt-1">
                        <p className="text-[13px] font-bold text-slate-900 truncate" title={selectedAgentDetail.bank_account.account_name}>
                          {selectedAgentDetail.bank_account.account_name}
                        </p>
                        <p className="text-[12px] font-mono text-slate-600 mt-0.5">
                          {selectedAgentDetail.bank_account.account_number} <span className="text-slate-400 font-sans">({selectedAgentDetail.bank_account.bank_code})</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[13px] text-slate-400 italic mt-2">Not registered yet</p>
                    )}
                  </div>
                  <div className="h-11 w-11 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                    VIO Office Assignment
                  </h4>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">VIO Office:</span>
                      <span className="font-semibold text-slate-900 text-right">{selectedAgentDetail.agent_profile?.vio_office || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">State:</span>
                      <span className="font-semibold text-slate-900">{selectedAgentDetail.agent_profile?.state || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">LGA:</span>
                      <span className="font-semibold text-slate-900">{selectedAgentDetail.agent_profile?.lga || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1.5">Assigned Capabilities:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedAgentDetail.agent_profile?.capabilities || ["driver_licence"]).map((c) => (
                          <span key={c} className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                            {c.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-500">Allowed Application Types:</span>
                        {!editingEligibility ? (
                          <button onClick={() => setEditingEligibility(true)} className="text-[#28A745] hover:text-[#218838] flex items-center gap-1 text-[11px] bg-[#28A745]/5 px-2 py-0.5 rounded">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        ) : null}
                      </div>
                      {!editingEligibility ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedAgentDetail.agent_profile?.allowed_application_types || APPLICATION_TYPE_OPTIONS.map((o) => o.value)).map((t) => (
                            <span key={t} className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                              {t.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {APPLICATION_TYPE_OPTIONS.map((opt) => {
                              const checked = detailAllowedTypes.includes(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setDetailAllowedTypes((prev) =>
                                      checked ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]
                                    );
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                                    checked
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                      : "bg-slate-50 text-slate-500 border-slate-200"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={handleSaveEligibility} disabled={updatingEligibility} className="px-3 py-1 bg-[#28A745] text-white rounded text-[11px] font-semibold disabled:opacity-70">
                              {updatingEligibility ? "Saving..." : "Save"}
                            </button>
                            <button onClick={() => setEditingEligibility(false)} disabled={updatingEligibility} className="px-3 py-1 border border-slate-200 text-slate-600 rounded text-[11px] font-medium">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Commission Override</span>
                    {!editingCommission ? (
                      <button onClick={() => setEditingCommission(true)} className="text-[#28A745] hover:text-[#218838] flex items-center gap-1 text-[11px] bg-[#28A745]/5 px-2 py-0.5 rounded">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    ) : null}
                  </h4>
                  <div className="space-y-2.5 text-[13px]">
                    {!editingCommission ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Custom Commission:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedAgentDetail.agent_profile?.custom_commission_kobo !== null && selectedAgentDetail.agent_profile?.custom_commission_kobo !== undefined
                            ? `₦${(selectedAgentDetail.agent_profile.custom_commission_kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "System Default"}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₦</span>
                          <input
                            type="number"
                            value={customCommissionVal}
                            onChange={(e) => setCustomCommissionVal(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-sm focus:border-[#28A745] focus:outline-none"
                            placeholder="e.g. 2000 (Empty for default)"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={handleSaveCommission} disabled={updatingCommission} className="px-3 py-1 bg-[#28A745] text-white rounded text-[11px] font-semibold disabled:opacity-70">
                            {updatingCommission ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingCommission(false)} disabled={updatingCommission} className="px-3 py-1 border border-slate-200 text-slate-600 rounded text-[11px] font-medium">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                    User Contact &amp; Metadata
                  </h4>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email Address:</span>
                      <span className="font-mono text-slate-900">{selectedAgentDetail.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone Number:</span>
                      <span className="font-mono text-slate-900">{selectedAgentDetail.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Password Status:</span>
                      <span className={selectedAgentDetail.must_change_password ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        {selectedAgentDetail.must_change_password ? "Change Required" : "Set & Verified"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Created:</span>
                      <span className="text-slate-700">{formatDate(selectedAgentDetail.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Updated:</span>
                      <span className="text-slate-700">{formatDate(selectedAgentDetail.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedAgentDetail(null)}
                className="px-5 py-2 rounded-lg text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Deactivate Modal ── */}
      {confirmDeactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">Deactivate Account?</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500 max-w-sm mx-auto">
                Are you sure you want to deactivate <strong className="text-slate-800">{confirmDeactivateTarget.accountName}</strong>? They will immediately lose access to the Vehiculars management system.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeactivateTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeactivate(confirmDeactivateTarget.id, confirmDeactivateTarget.role, confirmDeactivateTarget.accountName)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-[13.5px] font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98]"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bulk Commission Modal ─── */}
      {bulkCommissionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#28A745]">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-slate-900">Set Commission for All Agents</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  Applies one flat commission to every VIO field agent's next completed job,
                  overwriting any individual overrides already set on the Agents tab.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Commission Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">₦</span>
                <input
                  type="number"
                  value={bulkCommissionVal}
                  onChange={(e) => setBulkCommissionVal(e.target.value)}
                  placeholder="e.g. 2000 (leave empty to reset to system default)"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
                />
              </div>
            </div>
            <div className="pt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBulkCommissionOpen(false)}
                disabled={applyingBulkCommission}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkCommission}
                disabled={applyingBulkCommission}
                className="flex-1 rounded-xl px-4 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-70"
                style={{ background: "#28A745" }}
              >
                {applyingBulkCommission ? "Applying..." : "Apply to All Agents"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
