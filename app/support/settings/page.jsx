"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, CheckCircle2, AlertCircle, Pencil, X, Save,
  KeyRound, Eye, EyeOff, Loader2,
} from "lucide-react";
import { authGetMe, authUpdateProfile, authChangePassword, getCachedUser } from "@/lib/api";

const BRAND = "#28A745";
const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";

export default function SupportSettingsPage() {
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);

  const [editingProfile, setEditingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    authGetMe().then((res) => {
      if (res.data) {
        setUser(res.data);
        setProfileName(res.data.name || "");
        setProfilePhone(res.data.phone || "");
      }
      setLoading(false);
    });
  }, []);

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

  if (loading && !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading your profile...</p>
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

      <div>
        <h1
          className="text-[28px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Settings
        </h1>
        <p className="text-sm text-[#7A7A7A] mt-1">Manage your support account details.</p>
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
            <InfoRow icon={User} label="Full Name" value={user?.name} />
            <InfoRow icon={Mail} label="Email Address" value={user?.email} monospace />
            <InfoRow icon={Phone} label="Phone Number" value={user?.phone} monospace />
          </dl>
        ) : (
          <form onSubmit={handleSaveProfile} className="px-6 sm:px-8 py-6 space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputCls} />
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
