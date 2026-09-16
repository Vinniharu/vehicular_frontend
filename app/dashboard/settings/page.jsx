"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, CheckCircle2,
  AlertCircle, Pencil, X, Save, ChevronDown, Loader2, KeyRound, Eye, EyeOff,
  MessageCircle, Send, Trash2, AlertTriangle,
} from "lucide-react";
import {
  authGetMe, authUpdateProfile, authChangePassword, getReferenceStates,
  getReferenceLgas, getCachedUser, createCustomerSupportTicket,
  authDeleteAccount, removeToken,
} from "@/lib/api";
import Modal from "@/app/dashboard/_shared/Modal";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";
const selectCls = `${inputCls} appearance-none`;

// Normalise a phone field to always start with +234
function normalisePhone(val) {
  if (!val) return "+234";
  const stripped = val.replace(/^\+?234/, "").replace(/^0/, "");
  return "+234" + stripped;
}

export default function SettingsPage() {
  const [user, setUser] = useState(() => getCachedUser());
  const [states, setStates] = useState([]);

  // Location section
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBasic, setEditingBasic] = useState(false);
  const [updatingBasic, setUpdatingBasic] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");

  // Basic info (name/phone) section
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileMiddleName, setProfileMiddleName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Contact Support section
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketError, setTicketError] = useState(null);

  // Delete account section
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [meRes, statesRes] = await Promise.all([authGetMe(), getReferenceStates()]);
      if (meRes.data) {
        setUser(meRes.data);
        const u = meRes.data;
        let fn = u.first_name || "";
        let mn = u.middle_name || "";
        let ln = u.last_name || "";
        if (!fn && !ln && u.name) {
          const parts = u.name.trim().split(/\s+/);
          if (parts.length === 1) {
            fn = parts[0];
          } else if (parts.length === 2) {
            fn = parts[0];
            ln = parts[1];
          } else if (parts.length >= 3) {
            fn = parts[0];
            mn = parts.slice(1, -1).join(" ");
            ln = parts[parts.length - 1];
          }
        }
        setProfileFirstName(fn);
        setProfileMiddleName(mn);
        setProfileLastName(ln);
        setProfilePhone(u.phone || "");
        setSelectedState(u.state_id ? String(u.state_id) : "");
        setSelectedLga(u.lga_id ? String(u.lga_id) : "");
      }
      if (statesRes.data && Array.isArray(statesRes.data)) {
        setStates(statesRes.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Load LGAs for the Location section
  useEffect(() => {
    async function loadLgas() {
      if (!selectedState) { setLgas([]); return; }
      const res = await getReferenceLgas(selectedState);
      setLgas(res.data && Array.isArray(res.data) ? res.data : []);
    }
    loadLgas();
  }, [selectedState]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSaveBasic = async (e) => {
    e.preventDefault();
    setUpdatingBasic(true);
    const res = await authUpdateProfile({
      state_id: selectedState ? parseInt(selectedState, 10) : null,
      lga_id: selectedLga ? parseInt(selectedLga, 10) : null,
    });
    setUpdatingBasic(false);
    if (res.error) {
      showToast("error", "Could not save your changes. Please try again.");
    } else if (res.data) {
      setUser(res.data);
      setEditingBasic(false);
      showToast("success", "Your profile has been updated successfully.");
    }
  };

  const handleCancelBasic = () => {
    setSelectedState(user?.state_id ? String(user.state_id) : "");
    setSelectedLga(user?.lga_id ? String(user.lga_id) : "");
    setEditingBasic(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      showToast("error", "First name and Surname are required.");
      return;
    }
    setUpdatingProfile(true);
    const res = await authUpdateProfile({
      first_name: profileFirstName.trim(),
      middle_name: profileMiddleName.trim() || undefined,
      last_name: profileLastName.trim(),
      phone: profilePhone.trim(),
    });
    setUpdatingProfile(false);
    if (res.error) {
      showToast("error", "Could not save your changes. Please try again.");
    } else if (res.data) {
      setUser(res.data);
      const u = res.data;
      setProfileFirstName(u.first_name || profileFirstName.trim());
      setProfileMiddleName(u.middle_name || profileMiddleName.trim());
      setProfileLastName(u.last_name || profileLastName.trim());
      setEditingProfile(false);
      showToast("success", "Your profile has been updated successfully.");
    }
  };

  const handleCancelProfile = () => {
    let fn = user?.first_name || "";
    let mn = user?.middle_name || "";
    let ln = user?.last_name || "";
    if (!fn && !ln && user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length === 1) {
        fn = parts[0];
      } else if (parts.length === 2) {
        fn = parts[0];
        ln = parts[1];
      } else if (parts.length >= 3) {
        fn = parts[0];
        mn = parts.slice(1, -1).join(" ");
        ln = parts[parts.length - 1];
      }
    }
    setProfileFirstName(fn);
    setProfileMiddleName(mn);
    setProfileLastName(ln);
    setProfilePhone(user?.phone || "");
    setEditingProfile(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword || !newPassword) {
      setPasswordError("Fill in both your current and new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    const res = await authChangePassword({ current_password: currentPassword, new_password: newPassword });
    setUpdatingPassword(false);

    if (res.error) {
      setPasswordError(res.error);
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      showToast("success", "Your password has been changed successfully.");
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setTicketError(null);
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketError("Please fill in both a subject and a message.");
      return;
    }
    setSubmittingTicket(true);
    const res = await createCustomerSupportTicket({
      subject: ticketSubject.trim(),
      initial_message: ticketMessage.trim(),
    });
    setSubmittingTicket(false);
    if (res.error) {
      setTicketError(res.error);
    } else {
      setTicketSubject("");
      setTicketMessage("");
      showToast("success", "Your message has been sent to our support team.");
    }
  };

  const isOAuthUser = Boolean(user?.oauth_provider && !user?.password_hash);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError(null);

    if (isOAuthUser) {
      if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
        setDeleteError("Please type DELETE to confirm account deletion.");
        return;
      }
    } else {
      if (!deletePassword) {
        setDeleteError("Please enter your current password to confirm.");
        return;
      }
    }

    setDeletingAccount(true);
    const res = await authDeleteAccount({
      password: deletePassword || undefined,
      confirmation: deleteConfirmText.trim().toUpperCase() || undefined,
    });
    setDeletingAccount(false);

    if (res.error) {
      setDeleteError(res.error);
    } else {
      removeToken();
      router.push("/auth/login?reason=account_deleted");
    }
  };


  if (loading && !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  const resolvedState = states.find((s) => s.id === user?.state_id);

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Toast */}
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

      {/* Header */}
      <div>
        <h1
          className="text-[28px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Settings &amp; profile
        </h1>
        <p className="text-sm text-[#7A7A7A] mt-1">Manage your account details.</p>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[#111111]">Basic Information</h2>
            <p className="text-sm text-slate-500 mt-0.5">Your registered contact and account details.</p>
          </div>
          {!editingProfile && (
            <button type="button" onClick={() => setEditingProfile(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
        {!editingProfile ? (
          <dl className="divide-y divide-slate-100">
            <InfoRow icon={User} label="First Name" value={user?.first_name || user?.name?.split(" ")[0]} />
            {Boolean(user?.middle_name) && (
              <InfoRow icon={User} label="Middle Name" value={user?.middle_name} />
            )}
            <InfoRow icon={User} label="Surname" value={user?.last_name || (user?.name?.split(" ")?.length > 1 ? user?.name?.split(" ").slice(1).join(" ") : "")} />
            <InfoRow icon={Mail} label="Email Address" value={user?.email} monospace />
            <InfoRow icon={Phone} label="Phone Number" value={user?.phone} monospace />
          </dl>
        ) : (
          <form onSubmit={handleSaveProfile} className="px-6 sm:px-8 py-6 space-y-5 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                <input type="text" value={profileFirstName} onChange={(e) => setProfileFirstName(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Middle Name <span className="text-xs text-slate-400 font-normal">(opt)</span></label>
                <input type="text" value={profileMiddleName} onChange={(e) => setProfileMiddleName(e.target.value)} className={inputCls} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Surname <span className="text-red-500">*</span></label>
                <input type="text" value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} className={inputCls} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" value={user?.email || ""} disabled className={`${inputCls} bg-slate-100 text-slate-400 cursor-not-allowed`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={updatingProfile} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
                <Save className="h-4 w-4" /> {updatingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={handleCancelProfile} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Location & Residence */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[#111111]">Location & Residence</h2>
            <p className="text-sm text-slate-500 mt-0.5">Your state and LGA is used to determine relevant VIO offices and services.</p>
          </div>
          {!editingBasic && (
            <button type="button" onClick={() => setEditingBasic(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
        <div className="px-6 sm:px-8 py-6">
          {!editingBasic ? (
            <dl className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <dt className="text-sm text-slate-500 w-36 shrink-0">State</dt>
                <dd className="text-sm font-medium text-[#111111]">{resolvedState ? resolvedState.name : <span className="text-slate-400 italic">Not set</span>}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <dt className="text-sm text-slate-500 w-36 shrink-0">Local Govt. Area</dt>
                <dd className="text-sm font-medium text-[#111111]">{user?.lga_id ? (lgas.find(l => l.id === user.lga_id)?.name || "—") : <span className="text-slate-400 italic">Not set</span>}</dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleSaveBasic} className="space-y-5 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State of Residence</label>
                <div className="relative">
                  <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(""); }} className={selectCls}>
                    <option value="" disabled>Choose your state...</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Local Government Area</label>
                <div className="relative">
                  <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} disabled={!selectedState || lgas.length === 0} className={selectCls}>
                    <option value="" disabled>{!selectedState ? "Select a state first" : "Choose your LGA..."}</option>
                    {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={updatingBasic} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
                  <Save className="h-4 w-4" /> {updatingBasic ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={handleCancelBasic} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <h2 className="font-display text-base font-semibold text-[#111111] flex items-center gap-2">
            <MessageCircle className="h-4 w-4" style={{ color: BRAND }} /> Contact Support
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Send a message to our customer support team.</p>
        </div>
        <form onSubmit={handleSubmitTicket} className="px-6 sm:px-8 py-6 space-y-5 max-w-lg">
          {ticketError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{ticketError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="What's this about?"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
            <textarea
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={submittingTicket} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
              <Send className="h-4 w-4" /> {submittingTicket ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <h2 className="font-display text-base font-semibold text-[#111111] flex items-center gap-2">
            <KeyRound className="h-4 w-4" style={{ color: BRAND }} /> Password
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Change your account password. You will need your current password.</p>
        </div>
        <form onSubmit={handleChangePassword} className="px-6 sm:px-8 py-6 space-y-5 max-w-lg">
          {passwordError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={updatingPassword} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
              <Save className="h-4 w-4" /> {updatingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-xs">
        <div className="px-6 sm:px-8 py-5 border-b border-red-100 flex items-center justify-between flex-wrap gap-3 bg-red-50/40">
          <div>
            <h2 className="font-display text-base font-semibold text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" /> Danger Zone
            </h2>
            <p className="text-sm text-red-700/80 mt-0.5">
              Permanently delete your Vehiculars account and service records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeletePassword("");
              setDeleteConfirmText("");
              setDeleteError(null);
              setDeleteModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Delete Account
          </button>
        </div>
        <div className="px-6 sm:px-8 py-5 text-sm text-slate-600">
          <p className="leading-relaxed">
            Deleting your account will permanently deactivate your profile, cancel any ongoing or in-flight applications, close your assigned Monnify dedicated virtual account, and forfeit any remaining wallet balance. This action is irreversible.
          </p>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!deletingAccount) setDeleteModalOpen(open);
        }}
        title="Delete Account Confirmation"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 max-h-[88vh] overflow-y-auto text-left">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Delete your account?</h3>
              <p className="text-xs text-red-600 font-medium">This action is permanent and cannot be undone</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Please carefully review the consequences of deleting your account before proceeding:
          </p>

          {/* Consequences List */}
          <div className="rounded-xl bg-red-50/80 border border-red-200/80 p-4 space-y-3 text-[13px] text-red-950 mb-4">
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 text-base leading-none">🚫</span>
              <p><strong>Immediate Sign-Out &amp; Access Revocation:</strong> You will be logged out instantly and will no longer be able to sign in with this email or linked Google account.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 text-base leading-none">📄</span>
              <p><strong>Active Applications Cancelled:</strong> Any pending or in-flight driver’s licence, vehicle particulars, or verification requests will be terminated.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 text-base leading-none">🗄️</span>
              <p><strong>Document Vault Inaccessible:</strong> All approved licences, vehicle documents, and certificates in your account will become permanently inaccessible.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 text-base leading-none">💳</span>
              <p><strong>Wallet &amp; Dedicated Account:</strong> Any remaining wallet balance will be forfeited. Your assigned Monnify virtual account number will be closed.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 text-base leading-none">🎁</span>
              <p><strong>Referral Code &amp; Rewards:</strong> Your referral code and any unredeemed referral reward balance will be permanently erased.</p>
            </div>
          </div>

          {deleteError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-100/80 p-3 text-sm text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <form onSubmit={handleDeleteAccount} className="space-y-4">
            {isOAuthUser ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  To confirm, please type <span className="font-mono text-red-600 font-bold">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className={inputCls}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enter your account password to confirm:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  className={inputCls}
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setDeleteModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Keep Account
              </button>
              <button
                type="submit"
                disabled={deletingAccount || (isOAuthUser ? deleteConfirmText.trim().toUpperCase() !== "DELETE" : !deletePassword)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors shadow-xs cursor-pointer"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Permanently Delete Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}


function InfoRow({ icon: Icon, label, value, monospace, empty = "Not provided" }) {
  return (
    <div className="flex items-start gap-4 px-6 sm:px-8 py-4 hover:bg-slate-50/50 transition-colors">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5">
        <Icon className="h-[15px] w-[15px] text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${value ? "text-[#111111]" : "text-slate-400 italic"} ${monospace && value ? "font-mono" : ""}`}>{value || empty}</p>
      </div>
    </div>
  );
}

