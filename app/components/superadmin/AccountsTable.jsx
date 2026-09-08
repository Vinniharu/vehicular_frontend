"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Pencil,
  KeyRound,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Copy,
  Wallet,
  FileText,
} from "lucide-react";
import {
  superAdminGetUsers,
  superAdminUpdateUser,
  superAdminUpdateAgentProfile,
  superAdminSetUserPassword,
  superAdminGetUserDeletionSummary,
  superAdminDeleteUser,
  getReferenceStates,
  getReferenceLgas,
  getCachedUser,
  koboToNaira,
} from "@/lib/api";
import { AGENT_APPLICATION_TYPES } from "@/app/admin/_shared/agent-application-types";

// Sourced from the shared constant (also used by app/admin/people/page.jsx)
// so this list can't drift out of sync again — it previously did, twice.
const APPLICATION_TYPE_OPTIONS = AGENT_APPLICATION_TYPES.map((t) => t.value);

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
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

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

export default function AccountsTable({ role, title, description }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedLgaId, setSelectedLgaId] = useState("");

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordResult, setPasswordResult] = useState(null);

  const currentUser = getCachedUser();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSummary, setDeleteSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const openDeleteModal = async (account) => {
    setDeleteTarget(account);
    setConfirmEmail("");
    setConfirmCheckbox(false);
    setDeleteError(null);
    setLoadingSummary(true);
    setDeleteSummary(null);

    const res = await superAdminGetUserDeletionSummary(account.id);
    if (res?.data) {
      setDeleteSummary(res.data);
    } else {
      setDeleteError(res?.error?.detail || "Could not fetch account deletion summary.");
    }
    setLoadingSummary(false);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteSummary(null);
    setConfirmEmail("");
    setConfirmCheckbox(false);
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    if (!deleteTarget) return;
    if (confirmEmail.trim().toLowerCase() !== deleteTarget.email.toLowerCase()) {
      setDeleteError("Email does not match. Please enter the exact email address to confirm.");
      return;
    }
    if (!confirmCheckbox) {
      setDeleteError("Please check the box confirming you understand the permanent consequences.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    const res = await superAdminDeleteUser(deleteTarget.id);
    setDeleting(false);

    if (res?.error) {
      setDeleteError(res.error?.detail || res.error?.message || "Failed to delete account.");
    } else {
      const deletedEmail = deleteTarget.email;
      const count = res?.data?.deleted_applications_count || 0;
      closeDeleteModal();
      showToast("success", `Account ${deletedEmail} and ${count} connected application(s) were permanently deleted.`);
      loadAccounts();
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const loadAccounts = async () => {
    setLoading(true);
    const res = await superAdminGetUsers(role);
    if (res.data) setAccounts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
    if (role === "agent") {
      getReferenceStates().then((res) => {
        if (res.data) setStates(res.data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (!selectedStateId) { setLgas([]); return; }
    getReferenceLgas(selectedStateId).then((res) => {
      if (res.data) setLgas(res.data);
    });
  }, [selectedStateId]);

  const openEdit = (account) => {
    setEditTarget(account);
    setEditError(null);
    setEditForm({
      name: account.name || "",
      email: account.email || "",
      phone: account.phone || "",
      is_active: account.is_active,
      vio_office: account.agent_profile?.vio_office || "",
      allowed_application_types: account.agent_profile?.allowed_application_types?.length
        ? account.agent_profile.allowed_application_types
        : APPLICATION_TYPE_OPTIONS,
    });
    setSelectedStateId(account.agent_profile?.state_id ? String(account.agent_profile.state_id) : "");
    setSelectedLgaId(account.agent_profile?.lga_id ? String(account.agent_profile.lga_id) : "");
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditForm({});
    setEditError(null);
  };

  const toggleApplicationType = (type) => {
    setEditForm((p) => ({
      ...p,
      allowed_application_types: p.allowed_application_types.includes(type)
        ? p.allowed_application_types.filter((t) => t !== type)
        : [...p.allowed_application_types, type],
    }));
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setEditError(null);

    const baseRes = await superAdminUpdateUser(editTarget.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      is_active: editForm.is_active,
    });
    if (baseRes.error) {
      setSavingEdit(false);
      setEditError(baseRes.error);
      return;
    }

    if (role === "agent") {
      const agentUpdates = {
        vio_office: editForm.vio_office,
        allowed_application_types: editForm.allowed_application_types.length === APPLICATION_TYPE_OPTIONS.length
          ? null
          : editForm.allowed_application_types,
      };
      if (selectedStateId && selectedLgaId) {
        agentUpdates.state_id = parseInt(selectedStateId, 10);
        agentUpdates.lga_id = parseInt(selectedLgaId, 10);
      }

      const agentRes = await superAdminUpdateAgentProfile(editTarget.id, agentUpdates);
      if (agentRes.error) {
        setSavingEdit(false);
        setEditError(agentRes.error);
        return;
      }
    }

    setSavingEdit(false);
    closeEdit();
    showToast("success", `${editForm.name}'s account has been updated.`);
    loadAccounts();
  };

  const openPasswordModal = (account) => {
    setPasswordTarget(account);
    setNewPassword(generateTempPassword());
    setPasswordError(null);
    setPasswordResult(null);
  };

  const closePasswordModal = () => {
    setPasswordTarget(null);
    setNewPassword("");
    setPasswordResult(null);
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setSettingPassword(true);
    setPasswordError(null);
    const res = await superAdminSetUserPassword(passwordTarget.id, newPassword);
    setSettingPassword(false);
    if (res.error) {
      setPasswordError(res.error);
    } else {
      setPasswordResult(newPassword);
    }
  };

  const q = searchQuery.toLowerCase();
  const filtered = accounts.filter((a) =>
    a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.includes(q)
  );

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 pl-4 pr-5 py-3.5 rounded-xl shadow-xl border text-[13px] font-medium max-w-sm ${
          toast.type === "success" ? "bg-white border-emerald-200 text-slate-800" : "bg-white border-red-200 text-slate-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#28A745]" />
            : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />}
          <span className="flex-1 leading-snug">{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-[13px] text-slate-500 mt-1">{description}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full sm:w-72 text-[13px] rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[13px] text-slate-400">Loading accounts&hellip;</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[13px] text-slate-400">
            {searchQuery ? "No accounts match your search." : `No ${title.toLowerCase()} accounts found.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-5 font-semibold">Account</th>
                  <th className="py-3 px-5 font-semibold">Phone</th>
                  {role === "agent" && <th className="py-3 px-5 font-semibold">VIO Office</th>}
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => (
                  <tr key={account.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={account.name} />
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{account.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{account.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[12.5px] text-slate-600 font-mono">{account.phone}</td>
                    {role === "agent" && (
                      <td className="py-3.5 px-5 text-[12.5px] text-slate-600">{account.agent_profile?.vio_office || "—"}</td>
                    )}
                    <td className="py-3.5 px-5">
                      <StatusBadge active={account.is_active} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(account)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openPasswordModal(account)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#28A745] bg-[#28A745]/8 hover:bg-[#28A745]/15 transition-colors"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset Password
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(account)}
                          disabled={currentUser && currentUser.id === account.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={currentUser && currentUser.id === account.id ? "Cannot delete own account" : "Permanently delete account and all connected data"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Edit Modal ─── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h3 className="text-[15px] font-bold text-slate-900">Edit Account</h3>
              <button type="button" onClick={closeEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {editError && (
                <div className="rounded-xl p-3 flex items-start gap-2.5 text-[12.5px] bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[13.5px] focus:border-[#28A745] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[13.5px] focus:border-[#28A745] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[13.5px] font-mono focus:border-[#28A745] focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#28A745]"
                  />
                  <span className="text-[13px] font-medium text-slate-800">Account active</span>
                </label>
              </div>

              {role === "agent" && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 pt-3">Agent Profile</p>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">VIO Office</label>
                    <input
                      type="text"
                      value={editForm.vio_office}
                      onChange={(e) => setEditForm((p) => ({ ...p, vio_office: e.target.value }))}
                      className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[13.5px] focus:border-[#28A745] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">State</label>
                      <div className="relative">
                        <select
                          value={selectedStateId}
                          onChange={(e) => { setSelectedStateId(e.target.value); setSelectedLgaId(""); }}
                          className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[13.5px] appearance-none pr-8 focus:border-[#28A745] focus:outline-none"
                        >
                          <option value="">Select state</option>
                          {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">LGA</label>
                      <div className="relative">
                        <select
                          value={selectedLgaId}
                          onChange={(e) => setSelectedLgaId(e.target.value)}
                          disabled={!selectedStateId || lgas.length === 0}
                          className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[13.5px] appearance-none pr-8 disabled:opacity-50 focus:border-[#28A745] focus:outline-none"
                        >
                          <option value="">Select LGA</option>
                          {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Allowed Application Types</label>
                    <div className="flex flex-wrap gap-2">
                      {APPLICATION_TYPE_OPTIONS.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleApplicationType(type)}
                          className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold uppercase tracking-wide border transition-colors"
                          style={{
                            background: editForm.allowed_application_types?.includes(type) ? "rgba(40, 167, 69,0.1)" : "#fff",
                            borderColor: editForm.allowed_application_types?.includes(type) ? "#28A745" : "#e2e8f0",
                            color: editForm.allowed_application_types?.includes(type) ? "#28A745" : "#64748b",
                          }}
                        >
                          {type.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Uncheck a type to prevent this agent from being offered that kind of application. All checked = unrestricted.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex items-center gap-3 sticky bottom-0 bg-white">
              <button type="button" onClick={closeEdit} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-70"
                style={{ background: "#28A745" }}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Password Reset Modal ─── */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#28A745]">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Reset Password</h3>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Set a new password for <strong>{passwordTarget.name}</strong>. They'll be required to change it on next login.
                </p>
              </div>
            </div>

            {passwordResult ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Password updated. Share this with the account holder — it won&apos;t be shown again.</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <code className="flex-1 text-[13px] font-mono text-slate-800 select-all">{passwordResult}</code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(passwordResult)}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white"
                  style={{ background: "#28A745" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {passwordError && (
                  <div className="rounded-xl p-3 flex items-start gap-2.5 text-[12.5px] bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">New Password</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[13.5px] font-mono focus:border-[#28A745] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateTempPassword())}
                      className="shrink-0 rounded-lg border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button type="button" onClick={closePasswordModal} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPassword}
                    disabled={settingPassword}
                    className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-70"
                    style={{ background: "#28A745" }}
                  >
                    {settingPassword ? "Setting..." : "Set Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Delete Account Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-rose-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rose-100 px-6 py-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Delete User Account</h3>
                  <p className="text-[11.5px] text-rose-600 font-medium">Permanent & Irreversible Purge</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {deleteError && (
                <div className="rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] bg-rose-50 border border-rose-200 text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Target Account Pill */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <p className="text-[13px] font-bold text-slate-900 truncate">{deleteTarget.name}</p>
                  <p className="text-[11.5px] font-mono text-slate-500 truncate">{deleteTarget.email}</p>
                  {deleteTarget.phone && (
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{deleteTarget.phone}</p>
                  )}
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-slate-200 text-slate-700">
                  {deleteTarget.role}
                </span>
              </div>

              {loadingSummary ? (
                <div className="py-8 text-center text-slate-500 text-[13px] flex flex-col items-center gap-2">
                  <div className="h-6 w-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing account dependencies and applications...</span>
                </div>
              ) : deleteSummary ? (
                <>
                  {!deleteSummary.can_delete ? (
                    <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px] space-y-1">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertOctagon className="h-4 w-4 shrink-0" />
                        Account Cannot Be Deleted
                      </div>
                      <p>{deleteSummary.reason || "This account is protected and cannot be deleted."}</p>
                    </div>
                  ) : (
                    <>
                      {/* Impact Statistics */}
                      <div>
                        <p className="text-[12px] font-bold text-slate-700 uppercase tracking-wide mb-2">
                          Impact Summary & Connected Data
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                            <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold mb-1">
                              <FileText className="h-3.5 w-3.5" />
                              Applications
                            </div>
                            <p className="text-[18px] font-extrabold text-slate-900">
                              {deleteSummary.applications_count}
                            </p>
                            <p className="text-[10.5px] text-slate-500">Will be permanently deleted</p>
                          </div>

                          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                            <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold mb-1">
                              <Wallet className="h-3.5 w-3.5" />
                              Wallet Balance
                            </div>
                            <p className="text-[16px] font-extrabold text-slate-900 font-mono">
                              {koboToNaira(deleteSummary.wallet_balance_kobo)}
                            </p>
                            <p className="text-[10.5px] text-slate-500">Wallet will be destroyed</p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-semibold mb-1">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Support & Vehicles
                            </div>
                            <p className="text-[18px] font-extrabold text-slate-900">
                              {(deleteSummary.tickets_count || 0) + (deleteSummary.vehicles_count || 0)}
                            </p>
                            <p className="text-[10.5px] text-slate-500">Linked tickets & vehicles</p>
                          </div>
                        </div>
                      </div>

                      {/* Consequences Notice */}
                      <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-900 space-y-1.5">
                        <p className="text-[12px] font-bold flex items-center gap-1.5 text-rose-800">
                          <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
                          What will happen when you confirm:
                        </p>
                        <ul className="text-[11.5px] text-rose-800/90 space-y-1 list-disc list-inside">
                          <li>
                            <strong>{deleteSummary.applications_count} application(s)</strong> and all related inspection records, documents, payment history, and messages will be completely purged from the database.
                          </li>
                          <li>
                            The user login account, session tokens, vehicle records, and wallet balance will be destroyed.
                          </li>
                          <li>
                            <strong>This action cannot be undone.</strong> There is no recovery or undo feature.
                          </li>
                        </ul>
                      </div>

                      {/* Verification Input */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-[12px] font-semibold text-slate-700">
                          Type <span className="font-mono font-bold text-rose-600 select-all">{deleteTarget.email}</span> to confirm:
                        </label>
                        <input
                          type="text"
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          placeholder={deleteTarget.email}
                          disabled={deleting}
                          className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-[13px] font-mono focus:border-rose-500 focus:bg-white focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
                        <input
                          type="checkbox"
                          checked={confirmCheckbox}
                          onChange={(e) => setConfirmCheckbox(e.target.checked)}
                          disabled={deleting}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 shrink-0"
                        />
                        <span className="text-[12px] text-slate-700 font-medium leading-snug">
                          I acknowledge that I am permanently deleting this account and purging all associated applications and data without possibility of recovery.
                        </span>
                      </label>
                    </>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              {deleteSummary?.can_delete && (
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleting ||
                    loadingSummary ||
                    confirmEmail.trim().toLowerCase() !== deleteTarget.email.toLowerCase() ||
                    !confirmCheckbox
                  }
                  className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Permanently Delete Account
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
