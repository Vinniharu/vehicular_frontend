"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, CheckCircle2, AlertCircle, Pencil, X, Save,
  KeyRound, Eye, EyeOff, Loader2, MapPin, ChevronDown, Building2, Clock, Wallet,
} from "lucide-react";
import {
  authGetMe, authUpdateProfile, authChangePassword, getCachedUser, setCachedUser,
  getAgentWallet, updateAgentLocation, getReferenceStates, getReferenceLgas,
} from "@/lib/api";

const BRAND = "#28A745";
const inputBase =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50";

export default function AgentSettingsPage() {
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Basic info (name/phone)
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Work location
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedVioOffice, setSelectedVioOffice] = useState("");
  const [currentStateName, setCurrentStateName] = useState("");
  const [currentLgaName, setCurrentLgaName] = useState("");
  const [vioOffice, setVioOffice] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [meRes, walletRes, statesRes] = await Promise.all([
        authGetMe(),
        getAgentWallet(),
        getReferenceStates(),
      ]);

      if (meRes.data) {
        setUser(meRes.data);
        setProfileName(meRes.data.name || "");
        setProfilePhone(meRes.data.phone || "");
        
        if (meRes.data.agent_profile) {
          setSelectedState(meRes.data.agent_profile.state_id ? String(meRes.data.agent_profile.state_id) : "");
          setSelectedLga(meRes.data.agent_profile.lga_id ? String(meRes.data.agent_profile.lga_id) : "");
          setCurrentStateName(meRes.data.agent_profile.state || "");
          setCurrentLgaName(meRes.data.agent_profile.lga || "");
          setVioOffice(meRes.data.agent_profile.vio_office || "");
          setSelectedVioOffice(meRes.data.agent_profile.vio_office || "");
        }
      }
      if (statesRes.data) setStates(statesRes.data);

      if (walletRes.data) {
        setVioOffice(walletRes.data.vio_office || "");
        setCurrentStateName(walletRes.data.state || "");
        setCurrentLgaName(walletRes.data.lga || "");

        // The agent record only exposes state/lga as name strings here — match
        // them against the reference list to find the ids needed to prefill
        // the edit selects (same name->id matching pattern already used in
        // app/dashboard/settings/page.jsx for biodata's state of origin).
        if (walletRes.data.state && statesRes.data) {
          const matchedState = statesRes.data.find((s) => s.name === walletRes.data.state);
          if (matchedState) {
            setSelectedState(String(matchedState.id));
            const lgaRes = await getReferenceLgas(matchedState.id);
            if (lgaRes.data) {
              setLgas(lgaRes.data);
              const matchedLga = lgaRes.data.find((l) => l.name === walletRes.data.lga);
              if (matchedLga) setSelectedLga(String(matchedLga.id));
            }
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!editingLocation) return;
    if (!selectedState) { setLgas([]); return; }
    getReferenceLgas(selectedState).then((res) => {
      if (res.data) setLgas(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, editingLocation]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast("error", "Full name cannot be empty.");
      return;
    }
    setUpdatingProfile(true);
    // Deliberately omits state_id/lga_id — those live on the Agent record
    // and are updated separately via updateAgentLocation below, not here.
    const res = await authUpdateProfile({ name: profileName.trim(), phone: profilePhone.trim() });
    setUpdatingProfile(false);
    if (res.error) {
      showToast("error", "Could not save your changes. Please try again.");
    } else if (res.data) {
      setUser(res.data);
      setEditingProfile(false);
      showToast("success", "Your profile has been updated successfully.");
    }
  };

  const handleCancelProfile = () => {
    setProfileName(user?.name || "");
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

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setLocationError(null);
    if (!selectedState || !selectedLga || !selectedVioOffice.trim()) {
      setLocationError("Select a state, LGA, and provide a VIO office.");
      return;
    }
    setUpdatingLocation(true);
    const res = await updateAgentLocation({
      state_id: parseInt(selectedState, 10),
      lga_id: parseInt(selectedLga, 10),
      vio_office: selectedVioOffice.trim(),
    });
    setUpdatingLocation(false);
    if (res.error) {
      setLocationError(res.error);
    } else if (res.data) {
      setEditingLocation(false);
      setUser((prev) => {
        const next = prev ? { ...prev, agent_profile: res.data } : prev;
        if (next) setCachedUser(next);
        return next;
      });
      showToast("success", "Your relocation request has been submitted for admin approval.");
    }
  };

  const handleCancelLocation = () => {
    const matchedState = states.find((s) => s.name === currentStateName);
    setSelectedState(matchedState ? String(matchedState.id) : "");
    const matchedLga = lgas.find((l) => l.name === currentLgaName);
    setSelectedLga(matchedLga ? String(matchedLga.id) : "");
    setLocationError(null);
    setEditingLocation(false);
  };

  if (loading && !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
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
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your agent account and work location.</p>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-[15px] font-bold text-slate-900">Basic Information</h2>
          {!editingProfile && (
            <button type="button" onClick={() => setEditingProfile(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>

        {!editingProfile ? (
          <div className="space-y-3">
            <InfoRow icon={User} label="Full Name" value={user?.name} />
            <InfoRow icon={Mail} label="Email Address" value={user?.email} monospace />
            <InfoRow icon={Phone} label="Phone Number" value={user?.phone} monospace />
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className={fieldLabel}>Full Name</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className={fieldLabel}>Email Address</label>
              <input type="email" value={user?.email || ""} disabled className={`${inputBase} bg-slate-100 text-slate-400 cursor-not-allowed`} />
            </div>
            <div>
              <label className={fieldLabel}>Phone Number</label>
              <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className={`${inputBase} font-mono`} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={updatingProfile} className={btnPrimary} style={{ background: BRAND }}>
                <Save className="h-4 w-4" /> {updatingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={handleCancelProfile} className="px-5 py-3 rounded-xl text-[13.5px] font-medium text-slate-600 border border-slate-200">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Work location */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: BRAND }} /> Work Location
            </h2>
            <p className="mt-1 text-[12.5px] text-slate-500">
              Relocating? Update your state and LGA so new job offers route to your current area.
            </p>
          </div>
          {!editingLocation && user?.agent_profile?.relocation_status !== "pending" && (
            <button type="button" onClick={() => setEditingLocation(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
              <Pencil className="h-3.5 w-3.5" /> Relocate
            </button>
          )}
        </div>

        {locationError && !editingLocation && (
          <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-[13px] text-red-700 ring-1 ring-inset ring-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" /> {locationError}
          </div>
        )}

        {user?.agent_profile?.relocation_status === "pending" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm mb-4 flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-amber-900">Relocation Request Pending</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-800">Your request to relocate to <strong>{user.agent_profile.pending_vio_office}</strong> ({user.agent_profile.pending_lga}, {user.agent_profile.pending_state}) is pending admin approval. New job offers will keep routing to your current area until it's approved.</p>
            </div>
          </div>
        )}

        {user?.agent_profile?.relocation_status === "rejected" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm mb-4 flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-4.5 w-4.5 text-red-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-red-900">Relocation Request Rejected</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-red-800">Your recent relocation request was rejected by an admin. You can submit a new request if needed.</p>
            </div>
          </div>
        )}

        {!editingLocation ? (
          <div className="space-y-3">
            <InfoRow icon={Building2} label="VIO Office" value={vioOffice} />
            <InfoRow icon={MapPin} label="State" value={currentStateName} />
            <InfoRow icon={MapPin} label="Local Govt. Area" value={currentLgaName} />
          </div>
        ) : (
          <form onSubmit={handleSaveLocation} className="space-y-4">
            {locationError && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-[13px] text-red-700 ring-1 ring-inset ring-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" /> {locationError}
              </div>
            )}
            <div>
              <label className={fieldLabel}>State</label>
              <div className="relative">
                <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(""); }} className={`${inputBase} appearance-none pr-8`}>
                  <option value="" disabled>Select state</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Local Government Area</label>
              <div className="relative">
                <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} disabled={!selectedState || lgas.length === 0} className={`${inputBase} appearance-none pr-8 disabled:opacity-50`}>
                  <option value="" disabled>{!selectedState ? "Select a state first" : "Select LGA"}</option>
                  {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>VIO Office</label>
              <input type="text" value={selectedVioOffice} onChange={(e) => setSelectedVioOffice(e.target.value)} className={inputBase} placeholder="e.g. VIO Office Ikeja" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={updatingLocation} className={btnPrimary} style={{ background: BRAND }}>
                {updatingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {updatingLocation ? "Updating..." : "Save New Location"}
              </button>
              <button type="button" onClick={handleCancelLocation} className="px-5 py-3 rounded-xl text-[13.5px] font-medium text-slate-600 border border-slate-200">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Earnings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Wallet className="h-4 w-4" style={{ color: BRAND }} /> Earnings
        </h2>
        <InfoRow
          icon={Wallet}
          label="Your Commission"
          value={
            user?.agent_profile?.custom_commission_kobo !== null && user?.agent_profile?.custom_commission_kobo !== undefined
              ? `₦${(user.agent_profile.custom_commission_kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per completed job`
              : "Standard platform rate"
          }
        />
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-4 w-4" style={{ color: BRAND }} /> Password
          </h2>
          <p className="mt-1 text-[12.5px] text-slate-500">Change your account password. You'll need your current password.</p>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-[13px] text-red-700 ring-1 ring-inset ring-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}
          <div>
            <label className={fieldLabel}>Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputBase} pr-10`}
              />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={fieldLabel}>New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={inputBase}
            />
          </div>
          <div>
            <label className={fieldLabel}>Confirm New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={inputBase}
            />
          </div>
          <button type="submit" disabled={updatingPassword} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
            {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {updatingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, monospace }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-[15px] w-[15px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`text-[13.5px] font-medium ${value ? "text-slate-900" : "text-slate-400 italic"} ${monospace && value ? "font-mono" : ""}`}>
          {value || "Not set"}
        </p>
      </div>
    </div>
  );
}
