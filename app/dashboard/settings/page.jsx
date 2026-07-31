"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, MapPin, ShieldCheck, CheckCircle2,
  AlertCircle, Pencil, X, Save, Heart, Shield, Contact2, ChevronDown, Loader2, KeyRound, Eye, EyeOff
} from "lucide-react";
import {
  authGetMe, authUpdateProfile, authChangePassword, getReferenceStates,
  getReferenceLgas, getCachedUser, apiFetch
} from "@/lib/api";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

const AFRICAN_COUNTRIES = [
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cabo Verde",
  "Cameroon","Central African Republic","Chad","Comoros","Democratic Republic of the Congo",
  "Djibouti","Egypt","Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia",
  "Ghana","Guinea","Guinea-Bissau","Ivory Coast","Kenya","Lesotho","Liberia","Libya",
  "Madagascar","Malawi","Mali","Mauritania","Mauritius","Morocco","Mozambique","Namibia",
  "Niger","Nigeria","Republic of the Congo","Rwanda","São Tomé and Príncipe","Senegal",
  "Seychelles","Sierra Leone","Somalia","South Africa","South Sudan","Sudan","Tanzania",
  "Togo","Tunisia","Uganda","Zambia","Zimbabwe",
];

const NOK_RELATIONSHIPS = [
  "Spouse","Parent","Sibling","Child","Grandparent","Grandchild","Aunt / Uncle",
  "Niece / Nephew","Cousin","Friend","Guardian","Other",
];

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
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Biodata section
  const [editingBiodata, setEditingBiodata] = useState(false);
  const [updatingBiodata, setUpdatingBiodata] = useState(false);
  const [biodata, setBiodata] = useState({});
  
  // Biodata state / lga of residence
  const [biodataStates, setBiodataStates] = useState([]);
  const [biodataLgas, setBiodataLgas] = useState([]);
  const [biodataStateId, setBiodataStateId] = useState("");
  const [biodataLgaId, setBiodataLgaId] = useState("");

  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [meRes, statesRes] = await Promise.all([authGetMe(), getReferenceStates()]);
      if (meRes.data) {
        setUser(meRes.data);
        setProfileName(meRes.data.name || "");
        setProfilePhone(meRes.data.phone || "");
        setSelectedState(meRes.data.state_id ? String(meRes.data.state_id) : "");
        setSelectedLga(meRes.data.lga_id ? String(meRes.data.lga_id) : "");
        if (meRes.data.biodata) {
          const bd = meRes.data.biodata;
          setBiodata(bd);
          // Find state ID matching state_of_origin text for LGA dropdown
          if (bd.state_of_origin && statesRes.data) {
            const matchedState = statesRes.data.find((s) => s.name === bd.state_of_origin);
            if (matchedState) setBiodataStateId(String(matchedState.id));
          }
        }
      }
      if (statesRes.data && Array.isArray(statesRes.data)) {
        setStates(statesRes.data);
        setBiodataStates(statesRes.data);
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

  // Load LGAs for the Biodata section
  useEffect(() => {
    async function loadBiodataLgas() {
      if (!biodataStateId) { setBiodataLgas([]); setBiodataLgaId(""); return; }
      const res = await getReferenceLgas(biodataStateId);
      const list = res.data && Array.isArray(res.data) ? res.data : [];
      setBiodataLgas(list);
    }
    loadBiodataLgas();
  }, [biodataStateId]);

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

  const handleBiodataChange = (e) => {
    setBiodata(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveBiodata = async (e) => {
    e.preventDefault();
    setUpdatingBiodata(true);

    const stateObj = biodataStates.find((s) => String(s.id) === biodataStateId);
    const lgaObj = biodataLgas.find((l) => String(l.id) === biodataLgaId);

    const payload = {
      ...biodata,
      state_of_origin: stateObj?.name || biodata.state_of_origin || "",
      lga_of_origin: lgaObj?.name || biodata.lga_of_origin || "",
    };

    const res = await apiFetch("/customers/me/biodata", {
      method: "PUT",
      body: payload
    });
    setUpdatingBiodata(false);
    if (res.error) {
      showToast("error", "Could not save biodata. Please try again.");
    } else if (res.data) {
      setUser(prev => ({ ...prev, biodata: res.data }));
      setBiodata(res.data);
      setEditingBiodata(false);
      showToast("success", "Your biodata has been updated successfully.");
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
        <p className="text-sm text-[#7A7A7A] mt-1">Manage your account details and biodata.</p>
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

      {/* Biodata Section */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[#111111]">Personal Biodata</h2>
            <p className="text-sm text-slate-500 mt-0.5">Detailed personal information required for driver's licence applications.</p>
          </div>
          {!editingBiodata && (
            <button type="button" onClick={() => setEditingBiodata(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit Biodata
            </button>
          )}
        </div>
        
        <div className="px-6 sm:px-8 py-6">
          {!editingBiodata ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
               <BioView label="Surname" value={biodata.surname} />
               <BioView label="First Name" value={biodata.first_name} />
               <BioView label="Middle Name" value={biodata.middle_name} />
               <BioView label="Date of Birth" value={biodata.date_of_birth} />
               <BioView label="Gender" value={biodata.gender} />
               <BioView label="Nationality" value={biodata.nationality} />
               <BioView label="State of Origin" value={biodata.state_of_origin} />
               <BioView label="LGA of Origin" value={biodata.lga_of_origin} />
               <BioView label="Visa Status" value={biodata.visa_status} />
               <BioView label="Marital Status" value={biodata.marital_status} />
               <div className="md:col-span-2"><BioView label="Residential Address" value={biodata.residential_address} /></div>
               <BioView label="NIN" value={biodata.nin} />
               <BioView label="Blood Group" value={biodata.blood_group} />
               <BioView label="Genotype" value={biodata.genotype} />
               <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                 <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2"><Contact2 className="w-4 h-4 text-[#28A745]"/> Next of Kin Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <BioView label="Name" value={biodata.next_of_kin_name} />
                   <BioView label="Relationship" value={biodata.next_of_kin_relationship} />
                   <BioView label="Phone" value={biodata.next_of_kin_phone} />
                 </div>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSaveBiodata} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <BioInput label="Surname" name="surname" value={biodata.surname} onChange={handleBiodataChange} />
                <BioInput label="First Name" name="first_name" value={biodata.first_name} onChange={handleBiodataChange} />
                <BioInput label="Middle Name" name="middle_name" value={biodata.middle_name} onChange={handleBiodataChange} />
                
                <BioInput label="Date of Birth" type="date" name="date_of_birth" value={biodata.date_of_birth} onChange={handleBiodataChange} />
                <BioSelect label="Gender" name="gender" value={biodata.gender} onChange={handleBiodataChange} options={["Male", "Female", "Other"]} />
                <BioSelect label="Marital Status" name="marital_status" value={biodata.marital_status} onChange={handleBiodataChange} options={["Single", "Married", "Divorced", "Widowed"]} />
                
                <BioSelect label="Nationality" name="nationality" value={biodata.nationality} onChange={handleBiodataChange} options={AFRICAN_COUNTRIES} />
                <BioSelect label="Visa Status" name="visa_status" value={biodata.visa_status} onChange={handleBiodataChange} options={["Citizen", "Resident", "Visitor"]} />
                <div> {/* spacer */} </div>
              </div>

              {/* State & LGA of Origin — using API endpoints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">State of Origin</label>
                  <div className="relative">
                    <select
                      value={biodataStateId}
                      onChange={(e) => { setBiodataStateId(e.target.value); setBiodataLgaId(""); }}
                      className={selectCls}
                    >
                      <option value="" disabled>Choose state...</option>
                      {biodataStates.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">LGA of Origin</label>
                  <div className="relative">
                    <select
                      value={biodataLgaId}
                      onChange={(e) => setBiodataLgaId(e.target.value)}
                      disabled={!biodataStateId || biodataLgas.length === 0}
                      className={selectCls}
                    >
                      <option value="" disabled>{!biodataStateId ? "Select a state first" : "Choose LGA..."}</option>
                      {biodataLgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <BioInput label="National Identity Number (NIN)" name="nin" value={biodata.nin} onChange={handleBiodataChange} />
                <BioInput label="Residential Address" name="residential_address" value={biodata.residential_address} onChange={handleBiodataChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <BioSelect label="Blood Group" name="blood_group" value={biodata.blood_group} onChange={handleBiodataChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
                <BioSelect label="Genotype" name="genotype" value={biodata.genotype} onChange={handleBiodataChange} options={["AA", "AS", "SS", "AC"]} />
              </div>

              {/* Next of Kin */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
                  <Contact2 className="w-4 h-4" style={{ color: BRAND }} /> Next of Kin
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <BioInput label="Full Name" name="next_of_kin_name" value={biodata.next_of_kin_name} onChange={handleBiodataChange} />
                  <BioSelect label="Relationship" name="next_of_kin_relationship" value={biodata.next_of_kin_relationship} onChange={handleBiodataChange} options={NOK_RELATIONSHIPS} />
                  <PhoneInput label="Phone Number" name="next_of_kin_phone" value={biodata.next_of_kin_phone} onChange={(val) => setBiodata(prev => ({ ...prev, next_of_kin_phone: val }))} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button type="submit" disabled={updatingBiodata} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
                  <Save className="h-4 w-4" /> {updatingBiodata ? "Saving Biodata..." : "Save Biodata"}
                </button>
                <button type="button" onClick={() => setEditingBiodata(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <h2 className="font-display text-base font-semibold text-[#111111] flex items-center gap-2">
            <KeyRound className="h-4 w-4" style={{ color: BRAND }} /> Password
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Change your account password. You'll need your current password.</p>
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

function BioView({ label, value }) {
  return (
    <div>
      <span className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-1 block text-sm font-medium text-[#111111]">{value || <span className="text-slate-400 italic text-[13px]">Not set</span>}</span>
    </div>
  );
}

function BioInput({ label, type = "text", name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input type={type} name={name} value={value || ""} onChange={onChange} className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]" />
    </div>
  );
}

function BioSelect({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <select name={name} value={value || ""} onChange={onChange} className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745] appearance-none pr-9">
          <option value="">Select {label}...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}

// Phone input with enforced +234 prefix
function PhoneInput({ label, name, value, onChange }) {
  const [local, setLocal] = useState(() => {
    if (!value) return "";
    // Strip +234 or 0 prefix to show just the local digits
    return value.replace(/^\+?234/, "").replace(/^0/, "");
  });

  useEffect(() => {
    if (!value) { setLocal(""); return; }
    setLocal(value.replace(/^\+?234/, "").replace(/^0/, ""));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
    setLocal(raw);
    onChange("+234" + raw);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex rounded-xl border border-[#E5E5E5] bg-slate-50 overflow-hidden focus-within:border-[#28A745] focus-within:ring-1 focus-within:ring-[#28A745]">
        <span className="flex items-center pl-3.5 pr-2.5 text-sm font-semibold text-slate-500 select-none border-r border-[#E5E5E5] bg-slate-100">+234</span>
        <input
          type="tel"
          name={name}
          value={local}
          onChange={handleChange}
          placeholder="8012345678"
          className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-transparent outline-none text-[#111111]"
        />
      </div>
    </div>
  );
}
