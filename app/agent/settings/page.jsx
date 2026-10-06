"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, KeyRound, LogOut, MapPin, Pencil, Wallet } from "lucide-react";
import {
  authChangePassword,
  authGetMe,
  authUpdateProfile,
  getAgentWallet,
  getCachedUser,
  getReferenceLgas,
  getReferenceStates,
  removeToken,
  setCachedUser,
  updateAgentLocation,
} from "@/lib/api";
import { Button, Card, DetailRow, Field, Input, Notice, PageHeader, Select } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

function splitName(u) {
  let fn = u?.first_name || "";
  let mn = u?.middle_name || "";
  let ln = u?.last_name || "";
  if (!fn && !ln && u?.name) {
    const parts = u.name.trim().split(/\s+/);
    fn = parts[0] || "";
    if (parts.length === 2) ln = parts[1];
    if (parts.length >= 3) {
      mn = parts.slice(1, -1).join(" ");
      ln = parts[parts.length - 1];
    }
  }
  return { fn, mn, ln };
}

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

export default function AgentSettingsPage() {
  const router = useRouter();
  const pushToast = useToast();
  const [user, setUser] = useState(() => getCachedUser());

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [stateId, setStateId] = useState("");
  const [lgaId, setLgaId] = useState("");
  const [office, setOffice] = useState("");
  const [current, setCurrent] = useState({ state: "", lga: "", office: "" });
  const [editingLocation, setEditingLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const resetProfileFields = (u) => {
    const { fn, mn, ln } = splitName(u);
    setFirstName(fn);
    setMiddleName(mn);
    setLastName(ln);
    setPhone(u?.phone || "");
  };

  useEffect(() => {
    (async () => {
      const [meRes, walletRes, statesRes] = await Promise.all([authGetMe(), getAgentWallet(), getReferenceStates()]);
      if (meRes.data) {
        setUser(meRes.data);
        resetProfileFields(meRes.data);
        const ap = meRes.data.agent_profile;
        if (ap) {
          setStateId(ap.state_id ? String(ap.state_id) : "");
          setLgaId(ap.lga_id ? String(ap.lga_id) : "");
          setOffice(ap.vio_office || "");
          setCurrent({ state: ap.state || "", lga: ap.lga || "", office: ap.vio_office || "" });
        }
      }
      if (statesRes.data) setStates(statesRes.data);
      if (walletRes.data) {
        const w = walletRes.data;
        setCurrent({ state: w.state || "", lga: w.lga || "", office: w.vio_office || "" });
        // The wallet only has names; match them to ids to prefill the selects.
        const st = statesRes.data?.find((s) => s.name === w.state);
        if (st) {
          setStateId(String(st.id));
          const lgaRes = await getReferenceLgas(st.id);
          if (lgaRes.data) {
            setLgas(lgaRes.data);
            const lg = lgaRes.data.find((l) => l.name === w.lga);
            if (lg) setLgaId(String(lg.id));
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!editingLocation) return;
    if (!stateId) return setLgas([]);
    getReferenceLgas(stateId).then((res) => res.data && setLgas(res.data));
  }, [stateId, editingLocation]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return pushToast({ tone: "error", title: "First name and surname are required" });
    setSavingProfile(true);
    // state/lga live on the agent record and change through relocation below.
    const res = await authUpdateProfile({
      first_name: firstName.trim(),
      middle_name: middleName.trim() || undefined,
      last_name: lastName.trim(),
      phone: phone.trim(),
    });
    setSavingProfile(false);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't save your changes", body: res.error });
    setUser(res.data);
    resetProfileFields(res.data);
    setEditingProfile(false);
    pushToast({ tone: "success", title: "Profile updated" });
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword || !newPassword) return setPasswordError("Enter your current and new password.");
    if (newPassword.length < 8) return setPasswordError("Use at least 8 characters.");
    if (newPassword !== confirmPassword) return setPasswordError("The new passwords don't match.");
    setSavingPassword(true);
    const res = await authChangePassword({ current_password: currentPassword, new_password: newPassword });
    setSavingPassword(false);
    if (res.error) return setPasswordError(res.error);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    pushToast({ tone: "success", title: "Password changed" });
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    setLocationError(null);
    if (!stateId || !lgaId || !office.trim()) return setLocationError("Choose a state and LGA, and enter your VIO office.");
    setSavingLocation(true);
    const res = await updateAgentLocation({ state_id: parseInt(stateId, 10), lga_id: parseInt(lgaId, 10), vio_office: office.trim() });
    setSavingLocation(false);
    if (res.error) return setLocationError(res.error);
    setEditingLocation(false);
    setUser((prev) => {
      const next = prev ? { ...prev, agent_profile: res.data } : prev;
      if (next) setCachedUser(next);
      return next;
    });
    pushToast({ tone: "success", title: "Relocation request sent", body: "An admin needs to approve it." });
  };

  const signOut = () => {
    removeToken();
    router.push("/agent/login");
  };

  const ap = user?.agent_profile;
  const { fn, mn, ln } = splitName(user);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account" description="Your details, work location and password." />

      <div className="space-y-4">
        <Card>
          <SectionHead
            title="Your details"
            action={!editingProfile ? <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditingProfile(true)}>Edit</Button> : null}
          />
          {!editingProfile ? (
            <dl className="divide-y divide-cx-line">
              <DetailRow label="First name" value={fn} />
              {mn ? <DetailRow label="Middle name" value={mn} /> : null}
              <DetailRow label="Surname" value={ln} />
              <DetailRow label="Email" value={user?.email} />
              <DetailRow label="Phone" value={user?.phone} />
            </dl>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="First name" required>{(p) => <Input {...p} value={firstName} onChange={(e) => setFirstName(e.target.value)} />}</Field>
                <Field label="Middle name" optional>{(p) => <Input {...p} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />}</Field>
                <Field label="Surname" required>{(p) => <Input {...p} value={lastName} onChange={(e) => setLastName(e.target.value)} />}</Field>
              </div>
              <Field label="Email" hint="Contact support to change your email.">{(p) => <Input {...p} value={user?.email || ""} disabled />}</Field>
              <Field label="Phone">{(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
              <div className="flex gap-3">
                <Button type="submit" loading={savingProfile}>Save changes</Button>
                <Button variant="ghost" onClick={() => { resetProfileFields(user); setEditingProfile(false); }}>Cancel</Button>
              </div>
            </form>
          )}
        </Card>

        <Card>
          <SectionHead
            icon={MapPin}
            title="Work location"
            description="Offers come from this area. Moving? Request a relocation."
            action={!editingLocation && ap?.relocation_status !== "pending" ? <Button variant="secondary" size="sm" onClick={() => setEditingLocation(true)}>Relocate</Button> : null}
          />
          <div className="space-y-3">
            {ap?.relocation_status === "pending" ? (
              <Notice tone="amber" icon={Clock} title="Relocation waiting for approval">
                You asked to move to {ap.pending_vio_office} ({ap.pending_lga}, {ap.pending_state}). Offers keep coming from your current area until an admin approves it.
              </Notice>
            ) : null}
            {ap?.relocation_status === "rejected" ? (
              <Notice tone="red" title="Relocation request declined">An admin declined your last request. You can send a new one.</Notice>
            ) : null}
            {!editingLocation ? (
              <dl className="divide-y divide-cx-line">
                <DetailRow label="VIO office" value={current.office} />
                <DetailRow label="State" value={current.state} />
                <DetailRow label="LGA" value={current.lga} />
              </dl>
            ) : (
              <form onSubmit={saveLocation} className="space-y-4">
                {locationError ? <Notice tone="red">{locationError}</Notice> : null}
                <Field label="State">
                  {(p) => (
                    <Select {...p} value={stateId} onChange={(e) => { setStateId(e.target.value); setLgaId(""); }}>
                      <option value="" disabled>Choose a state</option>
                      {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="LGA">
                  {(p) => (
                    <Select {...p} value={lgaId} onChange={(e) => setLgaId(e.target.value)} disabled={!stateId || lgas.length === 0}>
                      <option value="" disabled>{stateId ? "Choose an LGA" : "Choose a state first"}</option>
                      {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="VIO office">{(p) => <Input {...p} value={office} onChange={(e) => setOffice(e.target.value)} placeholder="e.g. VIO Office Ikeja" />}</Field>
                <div className="flex gap-3">
                  <Button type="submit" loading={savingLocation}>Send request</Button>
                  <Button variant="ghost" onClick={() => { setLocationError(null); setEditingLocation(false); }}>Cancel</Button>
                </div>
              </form>
            )}
          </div>
        </Card>

        <Card>
          <SectionHead icon={Wallet} title="Commission" />
          <p className="text-[15px] text-cx-ink">
            {ap?.custom_commission_kobo !== null && ap?.custom_commission_kobo !== undefined
              ? `₦${(ap.custom_commission_kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per completed job`
              : "Standard platform rate"}
          </p>
        </Card>

        <Card as="form" onSubmit={savePassword}>
          <SectionHead icon={KeyRound} title="Change password" />
          <div className="space-y-4">
            {passwordError ? <Notice tone="red">{passwordError}</Notice> : null}
            <Field label="Current password">{(p) => <Input {...p} type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />}</Field>
            <Field label="New password" hint="At least 8 characters">{(p) => <Input {...p} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />}</Field>
            <Field label="Type the new password again">{(p) => <Input {...p} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />}</Field>
            <Button type="submit" loading={savingPassword}>Change password</Button>
          </div>
        </Card>

        <Button variant="secondary" size="lg" block icon={LogOut} onClick={signOut} className="text-cx-red">
          Sign out
        </Button>
      </div>
    </div>
  );
}
