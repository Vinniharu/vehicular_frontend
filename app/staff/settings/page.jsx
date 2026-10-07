"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, KeyRound, Pencil, UserRound } from "lucide-react";
import { authGetMe, authUpdateProfile, authChangePassword, getCachedUser } from "@/lib/api";
import { Button, Card, DetailRow, Field, Input, Notice, PageHeader } from "@/app/dashboard/_kit";
import { Spinner } from "@/app/components/portal/ui";
import { useToast } from "@/app/components/shared/ToastProvider";

function SectionHead({ icon: Icon, title, description, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold text-cx-ink">
          {Icon ? <Icon className="h-5 w-5 text-cx-muted" aria-hidden /> : null}
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-sm text-cx-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default function StaffSettingsPage() {
  const pushToast = useToast();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);

  const [editingProfile, setEditingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileMiddleName, setProfileMiddleName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    authGetMe().then((res) => {
      if (res.data) {
        setUser(res.data);
        const u = res.data;
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
      }
      setLoading(false);
    });
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      pushToast({ tone: "error", title: "First name and surname are required" });
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
      pushToast({ tone: "error", title: "Couldn't save your changes", body: "Please try again." });
    } else if (res.data) {
      setUser(res.data);
      const u = res.data;
      setProfileFirstName(u.first_name || profileFirstName.trim());
      setProfileMiddleName(u.middle_name || profileMiddleName.trim());
      setProfileLastName(u.last_name || profileLastName.trim());
      setEditingProfile(false);
      pushToast({ tone: "success", title: "Profile updated" });
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
      pushToast({ tone: "success", title: "Password changed" });
    }
  };

  if (loading && !user) return <Spinner label="Loading your profile…" />;

  const firstNameView = user?.first_name || user?.name?.split(" ")[0];
  const surnameView = user?.last_name || (user?.name?.split(" ")?.length > 1 ? user?.name?.split(" ").slice(1).join(" ") : "");
  const passwordType = showPasswords ? "text" : "password";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your staff account details." />

      <div className="space-y-4">
        <Card>
          <SectionHead
            icon={UserRound}
            title="Your details"
            description="Your registered contact and account details."
            action={!editingProfile ? <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditingProfile(true)}>Edit</Button> : null}
          />
          {!editingProfile ? (
            <dl className="divide-y divide-cx-line">
              <DetailRow label="First name" value={firstNameView || "Not provided"} />
              {user?.middle_name ? <DetailRow label="Middle name" value={user.middle_name} /> : null}
              <DetailRow label="Surname" value={surnameView || "Not provided"} />
              <DetailRow label="Email" value={user?.email || "Not provided"} />
              <DetailRow label="Phone" value={user?.phone || "Not provided"} />
            </dl>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="First name" required>
                  {(p) => <Input {...p} value={profileFirstName} onChange={(e) => setProfileFirstName(e.target.value)} required autoComplete="given-name" />}
                </Field>
                <Field label="Middle name" optional>
                  {(p) => <Input {...p} value={profileMiddleName} onChange={(e) => setProfileMiddleName(e.target.value)} autoComplete="additional-name" />}
                </Field>
                <Field label="Surname" required>
                  {(p) => <Input {...p} value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} required autoComplete="family-name" />}
                </Field>
              </div>
              <Field label="Email" hint="Your email can't be changed here.">
                {(p) => <Input {...p} type="email" value={user?.email || ""} disabled />}
              </Field>
              <Field label="Phone">
                {(p) => <Input {...p} type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} autoComplete="tel" />}
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={updatingProfile}>Save changes</Button>
                <Button variant="ghost" onClick={handleCancelProfile}>Cancel</Button>
              </div>
            </form>
          )}
        </Card>

        <Card as="form" onSubmit={handleChangePassword}>
          <SectionHead
            icon={KeyRound}
            title="Change password"
            description="You'll need your current password."
            action={
              <Button variant="ghost" size="sm" icon={showPasswords ? EyeOff : Eye} onClick={() => setShowPasswords(!showPasswords)} aria-pressed={showPasswords}>
                {showPasswords ? "Hide" : "Show"}
              </Button>
            }
          />
          <div className="space-y-4">
            {passwordError ? <Notice tone="red">{passwordError}</Notice> : null}
            <Field label="Current password">
              {(p) => <Input {...p} type={passwordType} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />}
            </Field>
            <Field label="New password" hint="At least 8 characters">
              {(p) => <Input {...p} type={passwordType} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />}
            </Field>
            <Field label="Type the new password again">
              {(p) => <Input {...p} type={passwordType} autoComplete="new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />}
            </Field>
            <Button type="submit" loading={updatingPassword}>Change password</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
