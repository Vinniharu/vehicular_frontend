"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Building2,
  Lock,
  RefreshCw,
  Users,
  Wallet,
  CreditCard,
  Eye,
  Pencil,
  ArrowDown,
  Check,
} from "lucide-react";
import {
  adminGetStaff,
  adminGetAgents,
  adminGetAgent,
  adminGetSupport,
  adminCreateStaff,
  adminCreateAgent,
  adminCreateSupport,
  adminDeactivateStaff,
  adminDeactivateAgent,
  adminDeactivateSupport,
  getAdminRelocationRequests,
  approveAgentRelocation,
  rejectAgentRelocation,
  getReferenceStates,
  getReferenceLgas,
  adminUpdateAgentEligibility,
} from "@/lib/api";
import { AGENT_APPLICATION_TYPES as APPLICATION_TYPE_OPTIONS } from "@/app/admin/_shared/agent-application-types";
import {
  Badge,
  Button,
  Card,
  DetailRow,
  EmptyState,
  Field,
  Input,
  Notice,
  PageHeader,
  Select,
  Sheet,
  SkeletonList,
} from "@/app/dashboard/_kit";
import { ConfirmSheet, ResponsiveTable, StatTile, Tabs, Toolbar } from "@/app/admin/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

const cx = (...parts) => parts.filter(Boolean).join(" ");

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
  return active ? <Badge tone="brand">Active</Badge> : <Badge>Deactivated</Badge>;
}

/* ─── Avatar ─── */
function Avatar({ name, tone = "neutral" }) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        tone === "brand" ? "bg-cx-brand-soft text-cx-brand-deep" : "bg-cx-sunken text-cx-ink-2"
      )}
      aria-hidden
    >
      {letter}
    </div>
  );
}

/* ─── Application type toggles ─── */
function TypeToggles({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {APPLICATION_TYPE_OPTIONS.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={checked}
            onClick={() => onChange(checked ? value.filter((v) => v !== opt.value) : [...value, opt.value])}
            className={cx(
              "cx-focus inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
              checked
                ? "border-cx-brand bg-cx-brand-soft text-cx-brand-deep"
                : "border-cx-line-strong bg-cx-surface text-cx-muted hover:bg-cx-sunken"
            )}
          >
            {checked ? <Check className="h-4 w-4" aria-hidden /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("staff");
  const [staffList, setStaffList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [supportList, setSupportList] = useState([]);
  const [relocationRequests, setRelocationRequests] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAgentDetail, setSelectedAgentDetail] = useState(null);
  const [loadingAgentDetail, setLoadingAgentDetail] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("staff");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [confirmDeactivateTarget, setConfirmDeactivateTarget] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const [confirmRejectRelocation, setConfirmRejectRelocation] = useState(null);
  const [rejectingRelocation, setRejectingRelocation] = useState(false);

  const pushToast = useToast();
  const showToast = (type, msg) => pushToast({ tone: type, title: msg });

  const loadData = async () => {
    const [staffRes, agentsRes, supportRes, statesRes, relocRes] = await Promise.all([
      adminGetStaff(),
      adminGetAgents(),
      adminGetSupport(),
      getReferenceStates(),
      getAdminRelocationRequests()
    ]);
    if (staffRes.data && Array.isArray(staffRes.data)) setStaffList(staffRes.data);
    if (agentsRes.data && Array.isArray(agentsRes.data)) setAgentsList(agentsRes.data);
    if (supportRes.data && Array.isArray(supportRes.data)) setSupportList(supportRes.data);
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
    setFirstName(""); setMiddleName(""); setLastName(""); setEmail(""); setPhone("+234"); setTempPassword("Vehiculars2026!");
    setVioOffice(""); setSelectedState(""); setSelectedLga(""); setModalError(null);
    setAllowedApplicationTypes(APPLICATION_TYPE_OPTIONS.map((o) => o.value));
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    const fn = firstName.trim();
    const mn = middleName.trim() || undefined;
    const ln = lastName.trim();
    const compositeName = [fn, mn, ln].filter(Boolean).join(" ");

    const payload = {
      first_name: fn,
      middle_name: mn,
      last_name: ln,
      name: compositeName,
      email: email.trim(),
      phone: phone.trim(),
      temp_password: tempPassword,
    };

    if (modalType === "staff" || modalType === "support") {
      const res = modalType === "support" ? await adminCreateSupport(payload) : await adminCreateStaff(payload);
      setSubmitting(false);
      if (res.error) { setModalError(res.error); return; }
      if (modalType === "support") setSupportList([res.data, ...supportList]);
      else setStaffList([res.data, ...staffList]);
      setIsModalOpen(false);
      showToast("success", `${res.data.name} has been provisioned as a ${modalType === "support" ? "customer support" : "verification staff"} member.`);
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
    const res = role === "staff" ? await adminDeactivateStaff(id) : role === "support" ? await adminDeactivateSupport(id) : await adminDeactivateAgent(id);
    if (res.error) {
      showToast("error", `Unable to deactivate account. Please try again.`);
    } else {
      if (role === "staff") setStaffList(staffList.map((i) => i.id === id ? { ...i, is_active: false } : i));
      else if (role === "support") setSupportList(supportList.map((i) => i.id === id ? { ...i, is_active: false } : i));
      else setAgentsList(agentsList.map((i) => i.id === id ? { ...i, is_active: false } : i));
      showToast("success", `${accountName}'s account has been deactivated.`);
    }
  };

  const handleViewAgent = async (agent) => {
    setSelectedAgentDetail(agent);
    setLoadingAgentDetail(true);
    setEditingEligibility(false);
    const res = await adminGetAgent(agent.id);
    if (res.data) {
      setSelectedAgentDetail(res.data);
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

  const handleApproveRelocation = async (agentId) => {
    const res = await approveAgentRelocation(agentId);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Relocation request approved.");
      loadData();
    }
  };

  const handleRejectRelocation = async (agentId) => {
    // Confirmed through the ConfirmSheet before this runs.
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
  const filteredSupport = supportList.filter((p) =>
    p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
  );

  const rowAction = "min-h-11 md:min-h-9";

  const personColumn = {
    key: "name",
    header: "Name",
    primary: true,
    render: (p) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={p.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-cx-ink">{p.name}</p>
          <p className="truncate text-[13px] font-normal text-cx-muted">ID #{p.id}</p>
        </div>
      </div>
    ),
  };

  const directoryColumns = (role) => [
    personColumn,
    {
      key: "contact",
      header: "Contact",
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate text-cx-ink">{p.email}</p>
          <p className="truncate text-[13px] text-cx-muted">{p.phone || "—"}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (p) => <StatusBadge active={p.is_active} /> },
    {
      key: "password",
      header: "Password",
      render: (p) =>
        p.must_change_password ? (
          <Badge tone="amber">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Change required
          </Badge>
        ) : (
          <span className="text-cx-muted">Set</span>
        ),
    },
    {
      key: "action",
      header: <span className="sr-only">Actions</span>,
      className: "md:text-right",
      render: (p) =>
        p.is_active ? (
          <Button
            variant="ghost"
            size="sm"
            className={cx(rowAction, "text-cx-red")}
            onClick={() => setConfirmDeactivateTarget({ id: p.id, role, accountName: p.name })}
          >
            Deactivate
          </Button>
        ) : (
          <span className="text-cx-muted">Inactive</span>
        ),
    },
  ];

  const agentColumns = [
    {
      key: "name",
      header: "Field agent",
      primary: true,
      render: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={a.name} tone="brand" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-cx-ink">{a.name}</p>
            <p className="truncate text-[13px] font-normal text-cx-muted">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "office",
      header: "Assigned office",
      render: (a) => {
        const profile = a.agent_profile || {};
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-cx-ink">{profile.vio_office || "—"}</p>
            <p className="truncate text-[13px] text-cx-muted">
              {profile.state && profile.lga ? `${profile.state} · ${profile.lga}` : "Location not set"}
            </p>
          </div>
        );
      },
    },
    {
      key: "wallet",
      header: "Bank and wallet",
      render: (a) => {
        const bank = a.bank_account;
        const wallet = a.wallet || { balance_kobo: 0, currency: "NGN" };
        return (
          <div className="min-w-0">
            <p className="truncate font-semibold text-cx-ink">{koboToNaira(wallet.balance_kobo)}</p>
            {bank ? (
              <p className="truncate text-[13px] text-cx-muted" title={bank.account_name}>
                {bank.account_number} ({bank.bank_code})
              </p>
            ) : (
              <p className="text-[13px] text-cx-muted">No bank set</p>
            )}
          </div>
        );
      },
    },
    { key: "status", header: "Status", render: (a) => <StatusBadge active={a.is_active} /> },
    {
      key: "action",
      header: <span className="sr-only">Actions</span>,
      className: "md:text-right",
      render: (a) => (
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button variant="secondary" size="sm" icon={Eye} className={rowAction} onClick={() => handleViewAgent(a)}>
            Details
          </Button>
          {a.is_active ? (
            <Button
              variant="ghost"
              size="sm"
              className={cx(rowAction, "text-cx-red")}
              onClick={() => setConfirmDeactivateTarget({ id: a.id, role: "agent", accountName: a.name })}
            >
              Deactivate
            </Button>
          ) : (
            <span className="self-center text-cx-muted">Inactive</span>
          )}
        </div>
      ),
    },
  ];

  const addLabel = activeTab === "staff" ? "Add staff member" : activeTab === "support" ? "Add support agent" : "Add field agent";
  const modalTitle = modalType === "staff" ? "Add verification staff" : modalType === "support" ? "Add support agent" : "Add VIO field agent";
  const modalDescription =
    modalType === "staff"
      ? "The new staff member will set their own password on first sign-in."
      : modalType === "support"
      ? "The new support agent will set their own password on first sign-in."
      : "The field agent will be assigned to a physical VIO office.";
  const submitLabel = modalType === "staff" ? "Add staff member" : modalType === "support" ? "Add support agent" : "Add field agent";

  const detail = selectedAgentDetail;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff and agents"
        description="Manage verification staff, support accounts and VIO field agents across Nigeria."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={refreshing} onClick={handleRefresh}>
              Refresh
            </Button>
            {activeTab !== "relocations" && (
              <Button
                icon={UserPlus}
                onClick={() => openProvisionModal(activeTab === "staff" ? "staff" : activeTab === "support" ? "support" : "agent")}
              >
                <span className="hidden sm:inline">{addLabel}</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </>
        }
      />

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Verification staff" value={staffList.length} hint={`${staffList.filter((s) => s.is_active).length} active`} />
        <StatTile label="Field agents" value={agentsList.length} hint={`${agentsList.filter((a) => a.is_active).length} active`} />
        <StatTile label="Support accounts" value={supportList.length} hint={`${supportList.filter((s) => s.is_active).length} active`} />
        <StatTile
          label="States covered"
          value={new Set(agentsList.map((a) => a.agent_profile?.state).filter(Boolean)).size || "—"}
          hint="Operational areas"
        />
        <StatTile
          label="Inactive accounts"
          value={[...staffList, ...agentsList, ...supportList].filter((x) => !x.is_active).length}
          hint="Deactivated access"
        />
      </div>

      {/* ─── Tabs & search ─── */}
      <Tabs
        label="Directory"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "staff", label: "Internal staff", count: staffList.length },
          { id: "agents", label: "Field agents", count: agentsList.length },
          { id: "support", label: "Support", count: supportList.length },
          { id: "relocations", label: "Relocations", count: relocationRequests.length },
        ]}
      />

      <div>
        {activeTab !== "relocations" && (
          <Toolbar search={searchQuery} onSearch={setSearchQuery} placeholder="Search by name, email or phone" />
        )}

        {loading ? (
          <SkeletonList rows={4} />
        ) : activeTab === "staff" ? (
          <ResponsiveTable
            columns={directoryColumns("staff")}
            rows={filteredStaff}
            rowKey={(p) => p.id}
            empty={searchQuery ? "No staff members match your search." : "No staff members have been added yet."}
          />
        ) : activeTab === "support" ? (
          <ResponsiveTable
            columns={directoryColumns("support")}
            rows={filteredSupport}
            rowKey={(p) => p.id}
            empty={searchQuery ? "No support accounts match your search." : "No support accounts have been added yet."}
          />
        ) : activeTab === "agents" ? (
          <ResponsiveTable
            columns={agentColumns}
            rows={filteredAgents}
            rowKey={(a) => a.id}
            empty={searchQuery ? "No agents match your search." : "No field agents have been added yet."}
          />
        ) : activeTab === "relocations" ? (
          relocationRequests.length === 0 ? (
            <EmptyState icon={Users} title="No relocation requests" description="Agent requests to move office will show up here." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {relocationRequests.map((req) => (
                <Card key={req.agent_id} className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <Avatar name={req.name} tone="brand" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-cx-ink">{req.name}</p>
                      <p className="text-[13px] text-cx-muted">{req.phone}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-cx bg-cx-sunken p-3">
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-cx-muted" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[13px] text-cx-muted">From</p>
                        <p className="truncate text-sm font-medium text-cx-ink-2">{req.current_vio_office || "—"}</p>
                        <p className="text-[13px] text-cx-muted">{req.current_lga}, {req.current_state}</p>
                      </div>
                    </div>
                    <ArrowDown className="ml-0.5 h-4 w-4 text-cx-amber" aria-hidden />
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-cx-amber" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[13px] text-cx-muted">To</p>
                        <p className="truncate text-sm font-semibold text-cx-ink">{req.pending_vio_office || "—"}</p>
                        <p className="text-[13px] text-cx-muted">{req.pending_lga}, {req.pending_state}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button block onClick={() => handleApproveRelocation(req.agent_id)}>
                      Approve
                    </Button>
                    <Button block variant="secondary" className="text-cx-red" onClick={() => setConfirmRejectRelocation(req)}>
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : null}
      </div>

      {/* ─── Provisioning sheet ─── */}
      <Sheet
        open={isModalOpen}
        onOpenChange={(o) => !submitting && setIsModalOpen(o)}
        title={modalTitle}
        description={modalDescription}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button block type="submit" form="provision-form" loading={submitting}>
              {submitLabel}
            </Button>
          </>
        }
      >
        <form id="provision-form" onSubmit={handleCreate} className="space-y-4">
          {modalError && <Notice tone="red">{modalError}</Notice>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="First name" required>
              {(p) => <Input {...p} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Emeka" required />}
            </Field>
            <Field label="Middle name" optional>
              {(p) => <Input {...p} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />}
            </Field>
            <Field label="Surname" required>
              {(p) => <Input {...p} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Adeyemi" required />}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" required>
              {(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@vio.gov.ng" required />}
            </Field>
            <Field label="Phone" required>
              {(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2348033334444" required />}
            </Field>
          </div>

          <Field label="Temporary password" required hint="They must change this password the first time they sign in.">
            {(p) => <Input {...p} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required />}
          </Field>

          {modalType === "agent" && (
            <div className="space-y-4 border-t border-cx-line pt-4">
              <h3 className="text-[15px] font-semibold text-cx-ink">VIO office</h3>

              <Field label="Office or centre name" required>
                {(p) => <Input {...p} value={vioOffice} onChange={(e) => setVioOffice(e.target.value)} placeholder="e.g. Ikeja VIO Headquarters" required />}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="State" required>
                  {(p) => (
                    <Select {...p} value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(""); }} required>
                      <option value="" disabled>Choose a state</option>
                      {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="LGA" required>
                  {(p) => (
                    <Select {...p} value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} disabled={!selectedState || lgas.length === 0} required>
                      <option value="" disabled>{selectedState ? "Choose an LGA" : "Choose a state first"}</option>
                      {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                  )}
                </Field>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-cx-ink">Allowed application types</p>
                <TypeToggles value={allowedApplicationTypes} onChange={setAllowedApplicationTypes} />
                <p className="text-[13px] text-cx-muted">
                  Turn a type off to stop this agent being offered that kind of application. All on means no restriction.
                </p>
              </div>
            </div>
          )}
        </form>
      </Sheet>

      {/* ─── Agent details sheet (`GET /admin/agents/{id}`) ─── */}
      <Sheet
        open={!!detail}
        onOpenChange={(o) => { if (!o) setSelectedAgentDetail(null); }}
        title={detail?.name || "Agent"}
        description={detail ? `ID #${detail.id}${loadingAgentDetail ? " · Updating…" : ""}` : undefined}
        size="lg"
        footer={
          <Button variant="secondary" block onClick={() => setSelectedAgentDetail(null)}>
            Close
          </Button>
        }
      >
        {detail && (
          <div className="space-y-5">
            <StatusBadge active={detail.is_active} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-cx-lg bg-cx-brand-soft p-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-cx-brand-deep">Wallet balance</p>
                  <p className="mt-1 text-[22px] font-semibold text-cx-ink">{koboToNaira(detail.wallet?.balance_kobo || 0)}</p>
                </div>
                <Wallet className="h-6 w-6 shrink-0 text-cx-brand-deep" aria-hidden />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-cx-lg bg-cx-sunken p-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-cx-muted">Payout bank account</p>
                  {detail.bank_account ? (
                    <div className="mt-1">
                      <p className="truncate text-sm font-semibold text-cx-ink" title={detail.bank_account.account_name}>
                        {detail.bank_account.account_name}
                      </p>
                      <p className="text-[13px] text-cx-ink-2">
                        {detail.bank_account.account_number} <span className="text-cx-muted">({detail.bank_account.bank_code})</span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-cx-muted">Not added yet</p>
                  )}
                </div>
                <CreditCard className="h-6 w-6 shrink-0 text-cx-muted" aria-hidden />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <h3 className="text-[15px] font-semibold text-cx-ink">VIO office</h3>
                <dl className="divide-y divide-cx-line">
                  <DetailRow label="Office" value={detail.agent_profile?.vio_office || "—"} />
                  <DetailRow label="State" value={detail.agent_profile?.state || "—"} />
                  <DetailRow label="LGA" value={detail.agent_profile?.lga || "—"} />
                </dl>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-cx-ink">Contact and account</h3>
                <dl className="divide-y divide-cx-line">
                  <DetailRow label="Email" value={detail.email} />
                  <DetailRow label="Phone" value={detail.phone || "—"} />
                  <DetailRow
                    label="Password"
                    value={
                      <span className={detail.must_change_password ? "text-cx-amber" : "text-cx-brand-deep"}>
                        {detail.must_change_password ? "Change required" : "Set"}
                      </span>
                    }
                  />
                  <DetailRow label="Created" value={formatDate(detail.created_at)} />
                  <DetailRow label="Last updated" value={formatDate(detail.updated_at)} />
                </dl>
              </div>
            </div>

            <div className="border-t border-cx-line pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-cx-ink">Allowed application types</h3>
                {!editingEligibility ? (
                  <Button variant="secondary" size="sm" icon={Pencil} className={rowAction} onClick={() => setEditingEligibility(true)}>
                    Edit
                  </Button>
                ) : null}
              </div>
              {!editingEligibility ? (
                <div className="flex flex-wrap gap-2">
                  {(detail.agent_profile?.allowed_application_types || APPLICATION_TYPE_OPTIONS.map((o) => o.value)).map((t) => (
                    <Badge key={t} tone="brand" className="capitalize">
                      {t.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <TypeToggles value={detailAllowedTypes} onChange={setDetailAllowedTypes} />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEligibility} loading={updatingEligibility}>
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingEligibility(false)} disabled={updatingEligibility}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── Confirm deactivate ─── */}
      <ConfirmSheet
        open={!!confirmDeactivateTarget}
        onOpenChange={(o) => { if (!o) setConfirmDeactivateTarget(null); }}
        title="Deactivate this account?"
        description={
          confirmDeactivateTarget
            ? `${confirmDeactivateTarget.accountName} will immediately lose access to Vehiculars.`
            : undefined
        }
        confirmLabel="Deactivate"
        tone="danger"
        onConfirm={() =>
          handleDeactivate(confirmDeactivateTarget.id, confirmDeactivateTarget.role, confirmDeactivateTarget.accountName)
        }
      />

      {/* ─── Confirm reject relocation ─── */}
      <ConfirmSheet
        open={!!confirmRejectRelocation}
        onOpenChange={(o) => { if (!o) setConfirmRejectRelocation(null); }}
        title="Reject this relocation request?"
        description={
          confirmRejectRelocation
            ? `${confirmRejectRelocation.name} stays at ${confirmRejectRelocation.current_vio_office || "their current office"}.`
            : undefined
        }
        confirmLabel="Reject request"
        tone="danger"
        loading={rejectingRelocation}
        onConfirm={async () => {
          setRejectingRelocation(true);
          await handleRejectRelocation(confirmRejectRelocation.agent_id);
          setRejectingRelocation(false);
          setConfirmRejectRelocation(null);
        }}
      />
    </div>
  );
}
