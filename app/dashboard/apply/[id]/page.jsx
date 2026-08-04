"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  FileText,
  ExternalLink,
  Upload,
  Wallet,
  Building,
  X,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  AlertTriangle,
  Edit3,
  ChevronDown,
  Send,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import {
  getApplication,
  koboToNaira,
  payFromWalletEndpoint,
  initializeCardPayment,
  getWallet,
  uploadApplicationDocument,
  uploadApplicationFile,
  reapplyApplication,
  getReferenceStates,
  getReferenceLgas,
  resolveMediaUrl,
  getVehicle,
} from "@/lib/api";
import PartialPayControls, { MIN_PARTIAL_PAYMENT_KOBO } from "@/app/components/dashboard/PartialPayControls";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import StatusBadge from "@/app/dashboard/_shared/StatusBadge";
import { getNextStepCopy } from "@/app/dashboard/_shared/status-config";
import { btnPrimary, btnSecondary, inputBase, label as fieldLabel } from "@/app/dashboard/_shared/ui";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;
const BRAND_TINT = "rgba(40, 167, 69,0.08)";

// Mirrors the backend's FEE_SCHEDULE (app/core/payment_helpers.py) — only
// used as a fallback while payment_options hasn't loaded yet; the real
// amount always comes from the backend once available.
const FEE_SCHEDULE_KOBO = {
  fresh: { "3 years": 3867500, "5 years": 4577500 },
  renewal: { "3 years": 3000000, "5 years": 3500000 },
};
const TINTED_PERMIT_FEE_KOBO = 2_405_000;
function estimateFeeKobo(appType, period) {
  if (appType === "tinted_permit") return TINTED_PERMIT_FEE_KOBO;
  const bucket = appType === "fresh" ? FEE_SCHEDULE_KOBO.fresh : FEE_SCHEDULE_KOBO.renewal;
  return bucket[period] || bucket["5 years"];
}

// Exact doc_type strings the backend requires before a renewal/reissue
// application can pass staff review and route to a field agent
// (app/routers/applications.py check_missing_docs) — offered here so a
// customer can complete/fix these after initial submission, not just at
// apply time.
const REQUIRED_DOCS_BY_TYPE = {
  renewal: [
    { value: "old_driver_licence", label: "Old driver's licence" },
    { value: "nin_slip", label: "NIN slip" },
  ],
  reissue: [
    { value: "police_extract", label: "Police extract" },
    { value: "affidavit_of_loss", label: "Affidavit of loss" },
    { value: "nin_slip", label: "NIN slip" },
  ],
  tinted_permit: [
    { value: "proof_of_ownership", label: "Proof of ownership" },
    { value: "vehicle_licence", label: "Vehicle licence" },
    { value: "tinted_passport_photo", label: "Passport photograph" },
    { value: "vehicle_photo_front", label: "Vehicle photo — front" },
    { value: "vehicle_photo_back", label: "Vehicle photo — back" },
    { value: "vehicle_photo_side", label: "Vehicle photo — side" },
    { value: "vin_sticker_photo", label: "VIN sticker photo" },
  ],
};

function CustomerLicenceCard({ title, licence, expired = false, onViewDoc }) {
  if (!licence) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E5E5] p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        <p className="mt-1 text-[13px] text-slate-400">Not issued yet.</p>
      </div>
    );
  }
  return (
    <div className={`rounded-xl border p-4 ${expired ? "border-red-200 bg-red-50/40" : "border-[#E5E5E5] bg-slate-50/60"}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
      <p className="mt-1 font-mono text-[15px] font-bold text-[#111111]">{licence.licence_number || "—"}</p>
      <p className={`mt-1 text-[12.5px] font-semibold ${expired ? "text-red-600" : "text-emerald-700"}`}>
        {licence.expiry_date
          ? `${expired ? "Expired" : "Valid until"} ${new Date(licence.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
          : "No expiry date recorded"}
      </p>
      {licence.document_url && (
        <button onClick={(e) => { e.preventDefault(); onViewDoc(resolveMediaUrl(licence.document_url)); }} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold hover:underline" style={{ color: BRAND }}>
          View <ExternalLink className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function PaymentProgressBar({ paidKobo, totalKobo }) {
  const pct = totalKobo > 0 ? Math.min(100, Math.round((paidKobo / totalKobo) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-semibold text-slate-700">
          {koboToNaira(paidKobo)} of {koboToNaira(totalKobo)} paid
        </span>
        <span className="font-mono font-semibold text-slate-500">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BRAND }} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Reapply Modal
   ────────────────────────────────────────────── */
function ReapplyModal({ application, onClose, onSuccess }) {
  // Renewal/reissue/international_permit reapply mirrors their own
  // simplified apply-form fields, not the full fresh biodata form.
  const isFresh = application.application_type === "fresh";
  const isIdp = application.application_type === "international_permit";
  // tinted_permit never routes here — it has its own TintedPermitReapplyModal
  // — but guard defensively since isFresh/isIdp are both false for it, which
  // would otherwise fall through to the renewal/reissue fields below.
  const isTinted = application.application_type === "tinted_permit";

  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedLgaId, setSelectedLgaId] = useState("");
  const [originLgas, setOriginLgas] = useState([]);
  const [selectedOriginStateId, setSelectedOriginStateId] = useState("");
  const [selectedOriginLgaId, setSelectedOriginLgaId] = useState("");

  const [form, setForm] = useState({
    first_name: application.first_name || "",
    middle_name: application.middle_name || "",
    last_name: application.last_name || "",
    date_of_birth: application.date_of_birth || "",
    gender: application.gender || "",
    nationality: application.nationality || "",
    marital_status: application.marital_status || "",
    mothers_maiden_name: application.mothers_maiden_name || "",
    residential_address: application.residential_address || "",
    nin: application.nin || "",
    old_licence_number: application.old_licence_number || "",
    validity_period: application.validity_period || "",
    blood_group: application.blood_group || "",
    height_cm: application.height_cm || "",
    has_facial_mark: application.has_facial_mark || false,
    facial_mark_description: application.facial_mark_description || "",
    has_disability: application.has_disability || false,
    disability_description: application.disability_description || "",
    next_of_kin_name: application.next_of_kin_name || "",
    next_of_kin_relationship: application.next_of_kin_relationship || "",
    next_of_kin_phone: application.next_of_kin_phone || "+234",
  });

  const [docType, setDocType] = useState("proof_of_identity");
  const [docUrl, setDocUrl] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docPreview, setDocPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Simplified (non-fresh) reapply: passport photo and the type-specific
  // document (old licence photo, or IDP identity document) upload through
  // the real /applications/upload-file endpoint — same as the initial apply
  // form's DocUploadSlot — rather than the legacy base64-inline pattern the
  // full fresh reapply form below still uses for its own document uploader.
  const [passportPhotoUrl, setPassportPhotoUrl] = useState(application.passport_photo || "");
  const [passportPhotoUploading, setPassportPhotoUploading] = useState(false);
  const [passportPhotoError, setPassportPhotoError] = useState(null);

  const simpleDocType = isIdp ? "international_passport" : "old_driver_licence";
  const [simpleDocUrl, setSimpleDocUrl] = useState("");
  const [simpleDocFileName, setSimpleDocFileName] = useState("");
  const [simpleDocUploading, setSimpleDocUploading] = useState(false);
  const [simpleDocError, setSimpleDocError] = useState(null);

  const handlePassportPhotoFile = async (file) => {
    if (!file) return;
    setPassportPhotoError(null);
    setPassportPhotoUploading(true);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setPassportPhotoUploading(false);
    if (uploadError || !data?.file_url) {
      setPassportPhotoError(uploadError || "Upload failed. Please try again.");
      return;
    }
    setPassportPhotoUrl(data.file_url);
  };

  const handleSimpleDocFile = async (file) => {
    if (!file) return;
    setSimpleDocError(null);
    setSimpleDocUploading(true);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setSimpleDocUploading(false);
    if (uploadError || !data?.file_url) {
      setSimpleDocError(uploadError || "Upload failed. Please try again.");
      return;
    }
    setSimpleDocUrl(data.file_url);
    setSimpleDocFileName(file.name);
  };

  // Load states on mount
  useEffect(() => {
    getReferenceStates().then((res) => {
      if (res.data) {
        setStates(res.data);
        // Pre-select state by matching state_of_residence text
        if (application.state_of_residence) {
          const match = res.data.find((s) => s.name === application.state_of_residence);
          if (match) setSelectedStateId(String(match.id));
        }
        // Pre-select origin state by matching state_of_origin text
        if (application.state_of_origin) {
          const originMatch = res.data.find((s) => s.name === application.state_of_origin);
          if (originMatch) setSelectedOriginStateId(String(originMatch.id));
        }
      }
    });
  }, [application.state_of_residence, application.state_of_origin]);

  // Load LGAs when state changes
  useEffect(() => {
    if (!selectedStateId) { setLgas([]); setSelectedLgaId(""); return; }
    getReferenceLgas(selectedStateId).then((res) => {
      if (res.data) {
        setLgas(res.data);
        if (application.lga) {
          const match = res.data.find((l) => l.name === application.lga);
          if (match) setSelectedLgaId(String(match.id));
        }
      }
    });
  }, [selectedStateId, application.lga]);

  // Load origin LGAs when origin state changes
  useEffect(() => {
    if (!selectedOriginStateId) { setOriginLgas([]); setSelectedOriginLgaId(""); return; }
    getReferenceLgas(selectedOriginStateId).then((res) => {
      if (res.data) {
        setOriginLgas(res.data);
        if (application.lga_of_origin) {
          const match = res.data.find((l) => l.name === application.lga_of_origin);
          if (match) setSelectedOriginLgaId(String(match.id));
        }
      }
    });
  }, [selectedOriginStateId, application.lga_of_origin]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setDocUrl(reader.result); setDocPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const stateObj = states.find((s) => String(s.id) === selectedStateId);
    const lgaObj = lgas.find((l) => String(l.id) === selectedLgaId);

    let payload;
    if (isFresh) {
      const originStateObj = states.find((s) => String(s.id) === selectedOriginStateId);
      const originLgaObj = originLgas.find((l) => String(l.id) === selectedOriginLgaId);
      payload = {
        ...form,
        height_cm: form.height_cm ? parseInt(form.height_cm, 10) : undefined,
        facial_mark_description: form.has_facial_mark && form.facial_mark_description.trim() ? form.facial_mark_description.trim() : undefined,
        disability_description: form.has_disability && form.disability_description.trim() ? form.disability_description.trim() : undefined,
        state_of_residence: stateObj?.name || application.state_of_residence || "",
        lga: lgaObj?.name || application.lga || "",
        state_id: selectedStateId ? parseInt(selectedStateId, 10) : undefined,
        lga_id: selectedLgaId ? parseInt(selectedLgaId, 10) : undefined,
        state_of_origin: originStateObj?.name || application.state_of_origin || undefined,
        lga_of_origin: originLgaObj?.name || application.lga_of_origin || undefined,
        origin_state_id: selectedOriginStateId ? parseInt(selectedOriginStateId, 10) : undefined,
        origin_lga_id: selectedOriginLgaId ? parseInt(selectedOriginLgaId, 10) : undefined,
      };
      if (docUrl) {
        payload.documents = [{ doc_type: docType, file_url: docUrl }];
      }
    } else {
      // Simplified reapply — only the same fields the renewal/reissue/
      // international_permit apply form itself asks for.
      payload = {
        nin: form.nin.trim() || undefined,
        old_licence_number: !isIdp ? (form.old_licence_number.trim() || undefined) : undefined,
        validity_period: !isIdp ? (form.validity_period || undefined) : undefined,
        passport_photo: passportPhotoUrl || undefined,
        state_of_residence: stateObj?.name || application.state_of_residence || "",
        lga: lgaObj?.name || application.lga || "",
        state_id: selectedStateId ? parseInt(selectedStateId, 10) : undefined,
        lga_id: selectedLgaId ? parseInt(selectedLgaId, 10) : undefined,
      };
      if (simpleDocUrl) {
        payload.documents = [{ doc_type: simpleDocType, file_url: simpleDocUrl }];
      }
    }

    const res = await reapplyApplication(application.id, payload);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      onSuccess(res.data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-[16px] font-bold text-[#111111]">Edit & Reapply</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Correct your details — application #{application.id} will be resubmitted.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Personal details — fresh applications only; renewal/reissue/
              international_permit never collected these on their own
              simplified apply form, so reapply doesn't ask for them either. */}
          {isFresh && (
          <section>
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Personal Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={fieldLabel}>First name *</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Middle name</label>
                  <input name="middle_name" value={form.middle_name} onChange={handleChange} className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Last name *</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required className={inputBase} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Date of birth *</label>
                  <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Gender *</label>
                  <div className="relative">
                    <select name="gender" value={form.gender} onChange={handleChange} required className={`${inputBase} appearance-none pr-8`}>
                      <option value="" disabled>Select...</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Nationality *</label>
                  <input name="nationality" value={form.nationality} onChange={handleChange} placeholder="Nigerian" required className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Marital status</label>
                  <div className="relative">
                    <select name="marital_status" value={form.marital_status} onChange={handleChange} className={`${inputBase} appearance-none pr-8`}>
                      <option value="">Select...</option>
                      <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className={fieldLabel}>NIN</label>
                <input name="nin" value={form.nin} onChange={handleChange} placeholder="12345678901" maxLength={11} className={`${inputBase} font-mono`} />
              </div>
              <div>
                <label className={fieldLabel}>Residential address</label>
                <input name="residential_address" value={form.residential_address} onChange={handleChange} placeholder="123 Example St, Lagos" className={inputBase} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Mother's maiden name</label>
                  <input name="mothers_maiden_name" value={form.mothers_maiden_name} onChange={handleChange} placeholder="e.g. Adeyemi" className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Height (cm)</label>
                  <input type="number" name="height_cm" value={form.height_cm} onChange={handleChange} placeholder="e.g. 170" min={100} max={250} className={`${inputBase} font-mono`} />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Blood group</label>
                <div className="relative">
                  <select name="blood_group" value={form.blood_group} onChange={handleChange} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select...</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => <option key={bg}>{bg}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Physical Characteristics</p>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.has_facial_mark}
                    onChange={(e) => setForm((p) => ({ ...p, has_facial_mark: e.target.checked, facial_mark_description: e.target.checked ? p.facial_mark_description : "" }))}
                    className="h-4 w-4 rounded accent-[#28A745]"
                  />
                  <span className="text-[13.5px] font-medium text-slate-800">Has facial mark</span>
                </label>
                {form.has_facial_mark && (
                  <input name="facial_mark_description" value={form.facial_mark_description} onChange={handleChange}
                    placeholder="Brief description of facial mark(s)" className={inputBase} />
                )}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.has_disability}
                    onChange={(e) => setForm((p) => ({ ...p, has_disability: e.target.checked, disability_description: e.target.checked ? p.disability_description : "" }))}
                    className="h-4 w-4 rounded accent-[#28A745]"
                  />
                  <span className="text-[13.5px] font-medium text-slate-800">Has any disability</span>
                </label>
                {form.has_disability && (
                  <input name="disability_description" value={form.disability_description} onChange={handleChange}
                    placeholder="Brief description of disability" className={inputBase} />
                )}
              </div>
            </div>
          </section>
          )}

          {/* State / LGA of Origin — fresh only, was never part of the
              simplified form either */}
          {isFresh && (
          <section>
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              State & LGA of Origin
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={fieldLabel}>State of origin</label>
                <div className="relative">
                  <select value={selectedOriginStateId} onChange={(e) => { setSelectedOriginStateId(e.target.value); setSelectedOriginLgaId(""); }} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>LGA of origin</label>
                <div className="relative">
                  <select value={selectedOriginLgaId} onChange={(e) => setSelectedOriginLgaId(e.target.value)} disabled={!selectedOriginStateId || originLgas.length === 0} className={`${inputBase} appearance-none pr-8 disabled:opacity-50`}>
                    <option value="">Select LGA</option>
                    {originLgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </section>
          )}

          {/* State / LGA of Residence */}
          <section>
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              State & LGA of Residence
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={fieldLabel}>State *</label>
                <div className="relative">
                  <select value={selectedStateId} onChange={(e) => { setSelectedStateId(e.target.value); setSelectedLgaId(""); }} required className={`${inputBase} appearance-none pr-8`}>
                    <option value="" disabled>Select state</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>LGA *</label>
                <div className="relative">
                  <select value={selectedLgaId} onChange={(e) => setSelectedLgaId(e.target.value)} disabled={!selectedStateId || lgas.length === 0} required className={`${inputBase} appearance-none pr-8 disabled:opacity-50`}>
                    <option value="" disabled>Select LGA</option>
                    {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Next of Kin — fresh only */}
          {isFresh && (
          <section>
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Next of Kin
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Full name</label>
                  <input name="next_of_kin_name" value={form.next_of_kin_name} onChange={handleChange} placeholder="Jane Doe" className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Relationship</label>
                  <div className="relative">
                    <select name="next_of_kin_relationship" value={form.next_of_kin_relationship} onChange={handleChange} className={`${inputBase} appearance-none pr-8`}>
                      <option value="">Select...</option>
                      {["Spouse","Parent","Sibling","Child","Grandparent","Cousin","Friend","Guardian","Other"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Phone number</label>
                <div className="flex rounded-xl border border-[#E5E5E5] bg-slate-50/60 overflow-hidden focus-within:border-[#28A745] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#28A745]/15">
                  <span className="flex items-center pl-3.5 pr-3 text-[13.5px] font-semibold text-slate-500 select-none border-r border-[#E5E5E5] bg-slate-100/80">+234</span>
                  <input
                    type="tel"
                    value={(form.next_of_kin_phone || "").replace(/^\+?234/, "").replace(/^0/, "")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
                      setForm((p) => ({ ...p, next_of_kin_phone: "+234" + raw }));
                    }}
                    placeholder="8012345678"
                    className="flex-1 min-w-0 px-3.5 py-2.5 text-[13.5px] bg-transparent outline-none text-[#111111] font-mono"
                  />
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Simplified renewal/reissue/international_permit fields — mirrors
              exactly what their own apply form asks for. */}
          {!isFresh && !isTinted && (
          <section>
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {application.application_type === "international_permit" ? "Permit Details" : "Renewal Details"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel}>NIN</label>
                  <input name="nin" value={form.nin} onChange={handleChange} placeholder="12345678901" maxLength={11} className={`${inputBase} font-mono`} />
                </div>
                {!isIdp && (
                  <div>
                    <label className={fieldLabel}>Validity period</label>
                    <div className="relative">
                      <select name="validity_period" value={form.validity_period} onChange={handleChange} className={`${inputBase} appearance-none pr-8`}>
                        <option value="">Select...</option>
                        <option value="3 years">3 years</option>
                        <option value="5 years">5 years</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
              {!isIdp && (
                <div>
                  <label className={fieldLabel}>Old licence number</label>
                  <input name="old_licence_number" value={form.old_licence_number} onChange={handleChange} placeholder="e.g. LAG-01-23456789" className={inputBase} />
                </div>
              )}

              <div>
                <label className={fieldLabel}>Passport photo</label>
                {!passportPhotoUrl ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-all hover:border-[#28A745]">
                    <Upload className="h-5 w-5" style={{ color: BRAND }} />
                    <p className="text-[12.5px] font-semibold text-slate-700">{passportPhotoUploading ? "Uploading…" : "Click to upload"}</p>
                    <input type="file" accept="image/*" disabled={passportPhotoUploading} onChange={(e) => handlePassportPhotoFile(e.target.files?.[0])} className="hidden" />
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E5] bg-slate-50/60 p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="truncate text-[12.5px] font-semibold text-[#111111]">Passport photo ready</p>
                    </div>
                    <button type="button" onClick={() => setPassportPhotoUrl("")} className="shrink-0 text-[11px] font-medium text-red-600 hover:underline">Remove</button>
                  </div>
                )}
                {passportPhotoError && <p className="mt-1.5 text-[11.5px] font-medium text-red-600">{passportPhotoError}</p>}
              </div>

              <div>
                <label className={fieldLabel}>
                  {isIdp ? "International Passport or Nigeria Driver's Licence" : "Front of your old licence"}
                </label>
                {!simpleDocUrl ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-all hover:border-[#28A745]">
                    <Upload className="h-5 w-5" style={{ color: BRAND }} />
                    <p className="text-[12.5px] font-semibold text-slate-700">{simpleDocUploading ? "Uploading…" : "Click to upload"}</p>
                    <input type="file" accept="image/*" disabled={simpleDocUploading} onChange={(e) => handleSimpleDocFile(e.target.files?.[0])} className="hidden" />
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E5] bg-slate-50/60 p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="truncate text-[12.5px] font-semibold text-[#111111]">{simpleDocFileName}</p>
                    </div>
                    <button type="button" onClick={() => { setSimpleDocUrl(""); setSimpleDocFileName(""); }} className="shrink-0 text-[11px] font-medium text-red-600 hover:underline">Remove</button>
                  </div>
                )}
                {simpleDocError && <p className="mt-1.5 text-[11.5px] font-medium text-red-600">{simpleDocError}</p>}
              </div>
            </div>
          </section>
          )}

          {/* New document upload — fresh only */}
          {isFresh && (
          <section>
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Replace / Add Document <span className="font-normal normal-case text-slate-400">(optional)</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className={fieldLabel}>Document type</label>
                <div className="relative">
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                    <option value="proof_of_identity">Proof of identity (NIN, passport, voter's card)</option>
                    <option value="proof_of_residence">Proof of residence</option>
                    <option value="passport_photo">Passport photograph</option>
                    <option value="eye_test_certificate">Vision / eye test</option>
                    <option value="medical_certificate">Medical fitness certificate</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {!docPreview ? (
                <label
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 transition-all hover:border-[#28A745] hover:bg-[rgba(40, 167, 69,0.04)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: BRAND_TINT, color: BRAND }}>
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-slate-800">Click to upload document</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">PNG, JPG, WEBP or PDF — up to 10MB</p>
                  </div>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                </label>
              ) : (
                <div className="space-y-2 rounded-xl border border-[#E5E5E5] bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#111111]">{docFileName}</p>
                        <p className="text-[11px] text-slate-400">Ready to attach</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setDocUrl(""); setDocFileName(""); setDocPreview(""); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  {docPreview && (
                    <div className="flex max-h-36 items-center justify-center overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
                      <img src={docPreview} alt="Preview" className="max-h-36 w-auto object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={submitting}
            className={`${btnPrimary} min-w-[160px]`}
            style={{ background: BRAND }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting…" : "Resubmit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

// tinted_permit correction payload is just { nin?, documents? } — the
// backend's DLApplicationReapply schema has no vehicle_id/justification
// field for this flow — so this stays a small, dedicated modal rather than
// forking the much larger DL ReapplyModal above.
const TINTED_DOC_TYPES = REQUIRED_DOCS_BY_TYPE.tinted_permit;

function TintedPermitReapplyModal({ application, onClose, onSuccess }) {
  const [nin, setNin] = useState(application.nin || "");
  const [docs, setDocs] = useState({});
  const [uploadingType, setUploadingType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (docType, file) => {
    if (!file) return;
    setError(null);
    setUploadingType(docType);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setUploadingType(null);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Upload failed. Please try again.");
      return;
    }
    setDocs((prev) => ({ ...prev, [docType]: { fileName: file.name, url: data.file_url } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const documents = Object.entries(docs).map(([doc_type, v]) => ({ doc_type, file_url: v.url }));
    const trimmedNin = nin.trim();
    const ninChanged = trimmedNin && trimmedNin !== application.nin;
    if (documents.length === 0 && !ninChanged) {
      setError("Upload at least one corrected document, or update your NIN.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {};
    if (ninChanged) payload.nin = trimmedNin;
    if (documents.length > 0) payload.documents = documents;
    const res = await reapplyApplication(application.id, payload);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSuccess(res.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-[16px] font-bold text-[#111111]">Fix &amp; Resubmit</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Re-upload the flagged document(s) for permit #{application.id}.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className={fieldLabel}>NIN</label>
            <input
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="11-digit National Identification Number"
              inputMode="numeric"
              className={`${inputBase} font-mono`}
            />
          </div>

          <div className="space-y-3">
            <p className={fieldLabel}>Re-upload document(s)</p>
            {TINTED_DOC_TYPES.map((d) => (
              <div key={d.value} className="rounded-xl border border-[#E5E5E5] p-3.5">
                <p className="text-[13px] font-semibold text-[#111111]">{d.label}</p>
                <div className="mt-2">
                  {!docs[d.value]?.url ? (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 transition-all hover:border-[#28A745]">
                      <Upload className="h-4 w-4" style={{ color: BRAND }} />
                      <span className="text-[12.5px] font-semibold text-slate-700">
                        {uploadingType === d.value ? "Uploading…" : "Click to upload"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        disabled={uploadingType === d.value}
                        onChange={(e) => handleFile(d.value, e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E5E5] bg-slate-50/60 p-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="truncate text-[12.5px] font-semibold text-[#111111]">{docs[d.value].fileName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDocs((prev) => { const next = { ...prev }; delete next[d.value]; return next; })}
                        className="shrink-0 text-[11px] font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className={btnPrimary} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Resubmitting…" : "Resubmit"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */
export default function CustomerApplicationDetailsPage() {
  const params = useParams();
  const appId = params?.id ? Number(params.id) : null;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [payingWallet, setPayingWallet] = useState(false);
  const [payingCard, setPayingCard] = useState(false);
  const payingWalletRef = useRef(false);
  const payingCardRef = useRef(false);
  const [notice, setNotice] = useState(null);

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docTypeInput, setDocTypeInput] = useState("proof_of_identity");
  const [docUrlInput, setDocUrlInput] = useState("");
  const [docFileName, setDocFileName] = useState("");

  const [showReapplyModal, setShowReapplyModal] = useState(false);
  const [showTintedReapplyModal, setShowTintedReapplyModal] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  const handleCustomerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => reader.result && setDocUrlInput(String(reader.result));
    reader.readAsDataURL(file);
  };

  const loadData = async (isRefresh = false) => {
    if (!appId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    const [appRes, walletRes] = await Promise.all([getApplication(appId), getWallet()]);
    if (appRes.error) setError(appRes.error);
    else if (appRes.data) setApplication(appRes.data);
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  useEffect(() => {
    if (application?.application_type === "tinted_permit" && application?.vehicle_id) {
      getVehicle(application.vehicle_id).then((res) => { if (res.data) setVehicle(res.data); });
    }
  }, [application?.application_type, application?.vehicle_id]);

  useEffect(() => {
    const rawTarget = application?.driving_school_target_date || application?.driving_school?.target_date;
    if (!rawTarget) return;
    let parseTarget = rawTarget;
    if (!parseTarget.includes("T")) parseTarget += "T23:59:59";
    const targetMs = new Date(parseTarget).getTime();
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
          expired: false,
        });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [application]);

  const handlePayFromWallet = async (amountKobo) => {
    if (!application || !amountKobo || payingWalletRef.current) return;
    payingWalletRef.current = true;
    setPayingWallet(true);
    setNotice(null);
    const res = await payFromWalletEndpoint(application.id, { amount_kobo: amountKobo });
    payingWalletRef.current = false;
    setPayingWallet(false);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      const message = res.data?.is_fully_paid
        ? `Paid ${koboToNaira(amountKobo)} from your wallet — application fully paid!`
        : `Paid ${koboToNaira(amountKobo)} from your wallet. ${koboToNaira(res.data?.remaining_kobo || 0)} still remaining.`;
      setNotice({ type: "success", message });
      await loadData(true);
    }
  };

  const handlePayPartialByCard = async (amountKobo) => {
    if (!application || !amountKobo || payingCardRef.current) return;
    payingCardRef.current = true;
    setPayingCard(true);
    setNotice(null);
    const res = await initializeCardPayment(application.id, { amount_kobo: amountKobo });
    payingCardRef.current = false;
    setPayingCard(false);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else if (res.data?.authorization_url) {
      window.open(res.data.authorization_url, "_blank", "noopener,noreferrer");
      setNotice({ type: "success", message: `Complete your ${koboToNaira(amountKobo)} payment in the new tab.` });
    }
  };

  const handleUploadAdditionalDoc = async (e) => {
    e.preventDefault();
    if (!application || !docUrlInput.trim()) return;
    setUploadingDoc(true);
    const res = await uploadApplicationDocument(application.id, {
      doc_type: docTypeInput,
      file_url: docUrlInput.trim(),
      screenshot_url: docUrlInput.trim(),
    });
    setUploadingDoc(false);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      setDocUrlInput("");
      setDocFileName("");
      setNotice({ type: "success", message: "Document uploaded and attached to your application." });
      await loadData(true);
    }
  };

  const handleReapplySuccess = async (updated) => {
    setShowReapplyModal(false);
    setShowTintedReapplyModal(false);
    setNotice({ type: "success", message: "Application resubmitted successfully! It's now back under staff review." });
    await loadData(true);
  };

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
        <p className="text-[13px] font-medium text-slate-500">Loading your application…</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="mx-auto mt-12 max-w-md space-y-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-red-500" />
        <h3 className="text-[17px] font-bold text-[#111111]">Application not found</h3>
        <p className="text-[13px] text-red-700">{error || "We couldn't load this application."}</p>
        <Link href="/dashboard/apply" className={`${btnSecondary} mx-auto`}>
          <ArrowLeft className="h-4 w-4" />
          Back to my applications
        </Link>
      </div>
    );
  }

  const isPaid = ["paid", "success"].includes(application.payment_status) || ["paid", "success"].includes(application.payment_options?.payment_status);
  const isPaymentFailed = application.payment_status === "failed" || application.payment_options?.payment_status === "failed";
  const amountKobo = application.payment_options?.amount_kobo || estimateFeeKobo(application.application_type, application.validity_period);
  const amountPaidKobo = application.payment_options?.amount_paid_kobo || 0;
  const remainingKobo = application.payment_options?.remaining_kobo ?? amountKobo;
  const checkoutUrl = application.payment_options?.checkout_url;
  const isTinted = application.application_type === "tinted_permit";
  const isRejected = application.status === "staff_rejected";
  const needsCorrection = application.status === "needs_correction";
  const inDrivingSchool =
    application.status === "driving_school_enrolled" ||
    application.status === "driving_school_certificate_ready" ||
    !!application.driving_school;
  const awaitingCustomer = application.status === "awaiting_customer";
  // Once the card is ready or delivered, the in-progress workflow widgets
  // (driving school countdown, capture appointment, upload form) are stale —
  // only the static record (details, documents, licence info) should show.
  const isReadyOrBeyond = ["ready_for_pickup", "awaiting_customer", "completed"].includes(application.status);

  // Find rejection/correction reason from events
  const rejectionEvent = [...(application.events || [])].reverse().find(
    (ev) => ev.status === "staff_rejected" || ev.new_status === "staff_rejected" || ev.new_status === "needs_correction"
  );
  const rejectionReason = rejectionEvent?.note || application.staff_note || null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <DocumentPreviewModal 
        isOpen={!!previewDocUrl} 
        onClose={() => setPreviewDocUrl(null)} 
        fileUrl={previewDocUrl} 
      />
      {/* Reapply modal */}
      {showReapplyModal && (
        <ReapplyModal
          application={application}
          onClose={() => setShowReapplyModal(false)}
          onSuccess={handleReapplySuccess}
        />
      )}
      {showTintedReapplyModal && (
        <TintedPermitReapplyModal
          application={application}
          onClose={() => setShowTintedReapplyModal(false)}
          onSuccess={handleReapplySuccess}
        />
      )}

      {/* Header */}
      <div>
        <Link
          href={isTinted ? "/dashboard/apply/tinted-permit" : "/dashboard/apply"}
          className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isTinted ? "My tinted permit applications" : "My applications"}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              className="text-[24px] tracking-tight text-[#111111]"
              style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
            >
              {isTinted ? "Tinted Permit" : "Driver's licence"} <span className="font-mono text-[15px] text-[#7A7A7A]">#{application.id}</span>
            </h1>
            <StatusBadge status={application.status} />
            <span className="rounded-md border border-[#E5E5E5] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
              {application.application_type || "fresh"}
            </span>
          </div>
          <button onClick={() => loadData(true)} className={btnSecondary} style={{ padding: "0.55rem 0.9rem" }}>
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
        <p className="mt-2 text-[13.5px] text-slate-500">{getNextStepCopy(application)}</p>
      </div>

      {/* tinted_permit only — the vehicle this application is for, in place
          of the licence-class/driving-school fields that don't apply. */}
      {isTinted && vehicle && (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-slate-500">Vehicle</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Make / Model</span>
              <span className="mt-1 block text-[13.5px] font-bold text-slate-900">{vehicle.make} {vehicle.model}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Colour</span>
              <span className="mt-1 block text-[13.5px] font-bold text-slate-900">{vehicle.colour}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Plate number</span>
              <span className="mt-1 block text-[13.5px] font-bold text-slate-900">{vehicle.plate_number}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Registration number</span>
              <span className="mt-1 block text-[13.5px] font-bold text-slate-900">{vehicle.registration_number}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">State</span>
              <span className="mt-1 block text-[13.5px] font-bold text-slate-900">{vehicle.state}</span>
            </div>
            {application.justification && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Justification</span>
                <span className="mt-1 block text-[13.5px] text-slate-700">{application.justification}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notice bar */}
      {notice && (
        <div className={`flex items-center gap-2.5 rounded-xl p-3.5 text-[13px] ${notice.type === "error" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 font-medium"}`}>
          {notice.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      {/* ── REJECTION / CORRECTION BANNER ── */}
      {(isRejected || needsCorrection) && (
        <div className={`rounded-2xl border-2 p-5 shadow-sm ${isRejected ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50" : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isRejected ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`text-[15px] font-bold ${isRejected ? "text-red-900" : "text-amber-900"}`}>
                  {isRejected ? "Application Rejected" : "Document Needs Correction"}
                </h3>
                {rejectionReason ? (
                  <div className={`mt-2 rounded-lg bg-white/70 border px-4 py-3 ${isRejected ? "border-red-100" : "border-amber-100"}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${isRejected ? "text-red-400" : "text-amber-500"}`}>
                      {isRejected ? "Reason from staff" : "Flagged by your agent"}
                    </p>
                    <p className="text-[13.5px] leading-relaxed text-slate-700">{rejectionReason}</p>
                  </div>
                ) : (
                  <p className={`mt-1.5 text-[13px] leading-relaxed ${isRejected ? "text-red-700/80" : "text-amber-700/80"}`}>
                    {isRejected
                      ? "Your application was reviewed and rejected. Please correct your details and reapply."
                      : "Your assigned agent flagged an issue with one of your documents. Re-upload it to continue."}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => (isTinted ? setShowTintedReapplyModal(true) : setShowReapplyModal(true))}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] sm:mt-0"
              style={{ background: isRejected ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" : "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" }}
            >
              <Edit3 className="h-4 w-4" />
              {isRejected ? "Edit & Reapply" : "Fix & Resubmit"}
            </button>
          </div>
          <p className={`mt-3 text-[11.5px] pl-14 ${isRejected ? "text-red-500/80" : "text-amber-600/80"}`}>
            {isRejected
              ? "Correcting your details creates a fresh submission under staff review — your application ID stays the same."
              : "Resubmitting sends this straight back to your assigned agent — your application ID stays the same."}
          </p>
        </div>
      )}

      {/* ── EXPIRED LICENCE BANNER ── */}
      {application.status === "expired" && (
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-red-900">{isTinted ? "Your permit has expired" : "Your licence has expired"}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-red-700/90">
                  {!isTinted && application.permanent_licence?.expiry_date
                    ? `It was valid until ${new Date(application.permanent_licence.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}. `
                    : ""}
                  {isTinted ? "Submit a new tinted permit application to get a new one." : "Apply for a renewal to get a new one."}
                </p>
              </div>
            </div>
            <Link
              href={isTinted ? "/dashboard/apply/tinted-permit/new" : "/dashboard/apply?type=renewal"}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}
            >
              <RefreshCw className="h-4 w-4" />
              {isTinted ? "Apply again" : "Apply for renewal"}
            </Link>
          </div>
        </div>
      )}

      {/* ── CAPTURE APPOINTMENT ── */}
      {!isReadyOrBeyond && (application.capture_scheduled_at || ["capture_scheduled", "capturing_scheduled", "captured", "capturing_completed"].includes(application.status)) && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
          <div className="mb-3 flex items-center gap-2.5 border-b border-indigo-100 pb-2.5">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-indigo-900">
              Biometric capture appointment
            </h3>
          </div>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Appointment schedule</span>
              <span className="font-semibold text-indigo-950">
                {application.capture_scheduled_at
                  ? new Date(application.capture_scheduled_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
                  : "Booked by VIO agent"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-slate-500">Capture centre</span>
              <span className="flex items-center gap-1.5 text-right font-semibold text-indigo-950">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                {application.capture_centre_name || application.assigned_agent?.vio_office || `${application.lga || "Designated"} FRSC/VIO Capture Centre`}
              </span>
            </div>
            {application.assigned_agent?.name && (
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-slate-500">Field agent</span>
                <span className="text-right font-semibold text-indigo-950">
                  {application.assigned_agent.name}
                  {application.assigned_agent.phone && ` · ${application.assigned_agent.phone}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── YOUR DRIVER'S LICENCE ── */}
      {(application.temporary_licence || application.permanent_licence) && (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <h3 className="mb-4 border-b border-[#E5E5E5] pb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
            Your driver's licence
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CustomerLicenceCard title="Temporary licence" licence={application.temporary_licence} onViewDoc={setPreviewDocUrl} />
            <CustomerLicenceCard
              title="Permanent licence"
              licence={application.permanent_licence}
              expired={application.status === "expired"}
              onViewDoc={setPreviewDocUrl}
            />
          </div>
        </div>
      )}

      {/* ── AWAITING RECEIPT BANNER (passive — staff now confirms receipt, not the customer) ── */}
      {awaitingCustomer && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-emerald-900">Your licence is ready</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-emerald-700/90">
                Your Driver's Licence document has been handed to our team — you'll be notified as
                soon as it's confirmed received and your application is marked complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment details (skip if rejected) */}
      {!isRejected && !needsCorrection && (
        isPaid ? (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#111111]">Payment successful</h3>
                <p className="mt-0.5 max-w-lg text-[13px] leading-relaxed text-slate-600">
                  You have paid <strong className="font-mono text-[#111111]">{koboToNaira(amountKobo)}</strong> for this application.
                </p>
              </div>
            </div>
          </div>
        ) : isPaymentFailed ? (
          <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50/60 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#111111]">Payment failed</h3>
                <p className="mt-0.5 max-w-lg text-[13px] leading-relaxed text-slate-600">
                  Your payment attempt failed. Pay bit by bit from your wallet below, or retry by card.
                </p>
              </div>
            </div>
            {amountPaidKobo > 0 && <PaymentProgressBar paidKobo={amountPaidKobo} totalKobo={amountKobo} />}
            <PartialPayControls
              remainingKobo={remainingKobo}
              walletBalanceKobo={walletBalance}
              payingWallet={payingWallet}
              onPay={handlePayFromWallet}
              payingCard={payingCard}
              onPayCard={handlePayPartialByCard}
            />
            {checkoutUrl ? (
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} w-fit`}>
                Pay {koboToNaira(remainingKobo)} with card <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-[12px] text-slate-500">
                Card payment is temporarily unavailable right now — pay from your wallet above, or check back shortly.
              </p>
            )}
            {walletBalance < Math.min(MIN_PARTIAL_PAYMENT_KOBO, remainingKobo) && (
              <p className="text-[12px] text-slate-500">
                Wallet balance: <span className="font-mono font-semibold text-slate-700">{koboToNaira(walletBalance)}</span> —{" "}
                <Link href="/dashboard/wallet" className="font-semibold underline" style={{ color: BRAND }}>fund your wallet</Link>{" "}or pay by card above.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#111111]">
                  {amountPaidKobo > 0 ? "Payment in progress" : "Payment pending"}
                </h3>
                <p className="mt-0.5 max-w-lg text-[13px] leading-relaxed text-slate-600">
                  Pay <strong className="font-mono text-[#111111]">{koboToNaira(remainingKobo)}</strong> to move this
                  application forward — pay it all at once, or bit by bit from your wallet, at least ₦10,000 at a time.
                </p>
              </div>
            </div>
            {amountPaidKobo > 0 && <PaymentProgressBar paidKobo={amountPaidKobo} totalKobo={amountKobo} />}
            <PartialPayControls
              remainingKobo={remainingKobo}
              walletBalanceKobo={walletBalance}
              payingWallet={payingWallet}
              onPay={handlePayFromWallet}
              payingCard={payingCard}
              onPayCard={handlePayPartialByCard}
            />
            {checkoutUrl ? (
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} w-fit`}>
                Pay {koboToNaira(remainingKobo)} with card <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-[12px] text-slate-500">
                Card payment is temporarily unavailable right now — pay from your wallet above, or check back shortly.
              </p>
            )}
            {walletBalance < Math.min(MIN_PARTIAL_PAYMENT_KOBO, remainingKobo) && (
              <p className="text-[12px] text-slate-500">
                Wallet balance: <span className="font-mono font-semibold text-slate-700">{koboToNaira(walletBalance)}</span> —{" "}
                <Link href="/dashboard/wallet" className="font-semibold underline" style={{ color: BRAND }}>fund your wallet</Link>{" "}or pay by card above.
              </p>
            )}
          </div>
        )
      )}

      {/* Driving school countdown */}
      {inDrivingSchool && !isReadyOrBeyond && (
        <div className="rounded-2xl border border-violet-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building className="h-4 w-4 text-violet-600" />
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Driving school</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h4 className="text-[16px] font-bold text-[#111111]">
                {application.driving_school?.name || "Accredited partner driving academy"}
              </h4>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                You're completing your required instruction with an accredited academy. Once your certificate is confirmed, your application routes straight to an agent in{" "}
                <strong className="text-slate-800">{application.lga || "your LGA"}</strong> to schedule your biometric capture.
              </p>
              {application.driving_school?.instructions && (
                <div className="mt-3 rounded-lg bg-violet-50 p-3 text-[12px] text-violet-800 ring-1 ring-inset ring-violet-200">
                  {application.driving_school.instructions}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-[#E5E5E5] p-4">
              <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Countdown</span>
                <span className={timeLeft.expired ? "text-emerald-600" : "text-slate-400"}>
                  {timeLeft.expired ? "Complete" : "In progress"}
                </span>
              </div>
              {timeLeft.expired || application.status === "driving_school_certificate_ready" ? (
                <div className="rounded-lg bg-emerald-50 p-3.5 text-center ring-1 ring-inset ring-emerald-200">
                  <p className="text-[13.5px] font-semibold text-emerald-800">Your training period is complete</p>
                  <p className="mt-0.5 text-[12px] text-emerald-700">We're confirming your certificate and routing your case to an agent now.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[["Days", timeLeft.days], ["Hrs", timeLeft.hours], ["Min", timeLeft.minutes], ["Sec", timeLeft.seconds]].map(([lbl, val]) => (
                      <div key={lbl} className="rounded-lg bg-slate-50 py-2.5">
                        <span className="block font-mono text-[20px] font-bold text-[#111111]">{val}</span>
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{lbl}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Target:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {new Date(application.driving_school_target_date || application.driving_school?.target_date || Date.now()).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-[#E5E5E5] bg-white p-5 lg:col-span-12">
          <h3 className="border-b border-slate-100 pb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
            Applicant details
          </h3>
          {application.passport_photo && (
            <img
              src={resolveMediaUrl(application.passport_photo)}
              alt="Passport photo"
              className="h-20 w-20 rounded-lg border border-[#E5E5E5] object-cover"
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">First name</span>
              <span className="mt-0.5 block text-[13.5px] font-semibold text-[#111111]">{application.first_name || "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Last name</span>
              <span className="mt-0.5 block text-[13.5px] font-semibold text-[#111111]">{application.last_name || "—"}</span>
            </div>
            {application.gender && (
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Gender</span>
                <span className="mt-0.5 block text-[13.5px] font-semibold text-[#111111] capitalize">{application.gender}</span>
              </div>
            )}
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Date of birth</span>
              <span className="mt-0.5 block font-mono text-[13.5px] font-semibold text-[#111111]">{application.date_of_birth || "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">State / LGA</span>
              <span className="mt-0.5 flex items-center gap-1 text-[13.5px] font-semibold text-[#111111]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {application.state_of_residence || "—"} · {application.lga || "—"}
              </span>
            </div>
            {application.nin && (
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">NIN</span>
                <span className="mt-0.5 block font-mono text-[13.5px] font-semibold text-[#111111]">{application.nin}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Next of kin</span>
              <span className="mt-0.5 block text-[13.5px] font-semibold text-[#111111]">
                {application.next_of_kin_name || "—"}
                {application.next_of_kin_relationship && (
                  <span className="ml-1.5 text-[12px] font-normal text-slate-500">({application.next_of_kin_relationship})</span>
                )}
                {application.next_of_kin_phone && (
                  <span className="ml-1.5 font-mono text-[12px] font-normal text-slate-500">{application.next_of_kin_phone}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      {application.events && application.events.length > 0 && (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
            <Clock className="h-3.5 w-3.5" style={{ color: BRAND }} />
            Timeline
          </h3>
          <div className="mt-4 space-y-4 border-l-2 border-slate-100 pl-4">
            {[...application.events].reverse().map((ev, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white" style={{ background: BRAND }} />
                <p className="text-[13px] font-semibold text-slate-800">
                  {ev.note || `Status updated to ${(ev.new_status || ev.status || "").replace(/_/g, " ")}`}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{new Date(ev.created_at).toLocaleString("en-NG")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents + upload */}
      <div className="space-y-5 rounded-2xl border border-[#E5E5E5] bg-white p-5">
        <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
          <FileText className="h-3.5 w-3.5" style={{ color: BRAND }} />
          Documents ({application.documents?.length || 0})
        </h3>

        {!application.documents || application.documents.length === 0 ? (
          <p className="text-[13px] text-slate-400">Nothing uploaded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {application.documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold capitalize text-[#111111]">{doc.doc_type?.replace(/_/g, " ")}</p>
                    {doc.uploaded_at && <p className="text-[11px] text-slate-400">{new Date(doc.uploaded_at).toLocaleString()}</p>}
                  </div>
                </div>
                {doc.file_url && (
                  <button onClick={(e) => { e.preventDefault(); setPreviewDocUrl(resolveMediaUrl(doc.file_url)); }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold hover:underline" style={{ color: BRAND }}>
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isRejected && !needsCorrection && !isReadyOrBeyond && (
          <form onSubmit={handleUploadAdditionalDoc} className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-[12.5px] font-semibold text-slate-700">Attach another document</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <select value={docTypeInput} onChange={(e) => setDocTypeInput(e.target.value)}
                className="rounded-xl border border-[#E5E5E5] bg-slate-50/60 px-3 py-2.5 text-[13px] text-[#111111] outline-none focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15">
                {REQUIRED_DOCS_BY_TYPE[application.application_type]?.map((d) => (
                  <option key={d.value} value={d.value}>{d.label} (required)</option>
                ))}
                <option value="proof_of_identity">Proof of identity</option>
                <option value="eye_test_certificate">Vision / eye test</option>
                <option value="medical_certificate">Medical fitness certificate</option>
                <option value="driving_school_certificate">Driving school certificate</option>
              </select>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5 text-[12.5px] text-slate-600 hover:border-[#28A745] hover:bg-white sm:col-span-1">
                <span className="truncate">{docFileName || "Choose a file…"}</span>
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold shadow-sm" style={{ color: BRAND }}>
                  <Upload className="h-3 w-3" /> Browse
                </span>
                <input type="file" accept="image/*,.pdf" onChange={handleCustomerFileChange} disabled={uploadingDoc} className="hidden" />
              </label>
              <button type="submit" disabled={uploadingDoc || !docUrlInput.trim()} className={btnPrimary} style={{ background: BRAND, padding: "0.6rem 1rem" }}>
                {uploadingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploadingDoc ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}