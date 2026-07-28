"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  FileText,
  MapPin,
  Info,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Wallet,
  Clock,
  X,
  Eye,
  Plus,
  Loader2,
  Calendar,
  UserCheck,
  Building,
  Phone,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  getCachedUser,
  authGetMe,
  getReferenceStates,
  getReferenceLgas,
  submitDriverLicenceApplication,
  uploadApplicationFile,
  getMyApplications,
  payFromWalletEndpoint,
  getWallet,
  resolveMediaUrl,
} from "@/lib/api";
import DocumentRing from "@/app/components/design/DocumentRing";
import PartialPayControls from "@/app/components/dashboard/PartialPayControls";

/* ────────────────────────────────────────────────────────────
   Design tokens — brand color is the only hardcoded value here.
   Everything else (spacing, radius, type scale) is expressed
   through consistent Tailwind classes below.
   ──────────────────────────────────────────────────────────── */
const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm shadow-emerald-900/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-slate-700 bg-white border border-[#E5E5E5] hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]";
const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors";
const inputBase =
  "w-full rounded-xl border border-[#E5E5E5] bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-[#111111] placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const label = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */
function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function ageFromDob(dobStr) {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const APPLICATION_TYPES = [
  { value: "fresh", label: "Fresh application", desc: "First-time licence — includes driving school enrollment." },
  { value: "renewal", label: "Renewal", desc: "Renew a licence that's expired or expiring soon." },
  { value: "reissue", label: "Reissue", desc: "Replace a lost, stolen, or damaged licence." },
  { value: "international_permit", label: "International Driver's Permit", desc: "Apply for an international driving permit." },
];

// Standard FRSC licence classes — required for fresh applications so the
// assigned agent knows what to process (app/schemas/application.py
// LICENCE_CLASSES enforces the same set server-side).
const LICENCE_CLASSES = [
  { value: "A", label: "Class A — Motorcycle" },
  { value: "B", label: "Class B — Private car (up to 8 seats)" },
  { value: "C", label: "Class C — Commercial / taxi" },
  { value: "D", label: "Class D — Articulated / heavy truck" },
  { value: "E", label: "Class E — Bus (8+ passengers)" },
  { value: "F", label: "Class F — Agricultural / tractor" },
  { value: "G", label: "Class G — Earth-moving equipment" },
  { value: "H", label: "Class H — Motorised wheelchair" },
];

const VALIDITY_PERIODS = ["3 years", "5 years"];

// Mirrors the backend's validators exactly (app/schemas/application.py
// NAME_RE, NIN_RE, _validate_dob_adult, _validate_height) so bad input is
// caught before submit instead of surfacing only as a 422 on step 5.
const NAME_RE = /^[A-Za-z' -]{2,50}$/;
const NIN_RE = /^\d{11}$/;
const MIN_APPLICANT_AGE = 18;
const errInputClass = (hasError) =>
  hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : "";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] font-medium text-red-600">{message}</p>;
}

// Mirrors the backend's FEE_SCHEDULE (app/core/payment_helpers.py) — only
// used for the pre-submission cost preview, before an application exists
// and a real payment_options response is available. Everywhere else in this
// app, amounts come straight from the backend.
const FEE_SCHEDULE_KOBO = {
  fresh: { "3 years": 3867500, "5 years": 4577500 },
  renewal: { "3 years": 3000000, "5 years": 3500000 },
};
function estimateFeeKobo(appType, period) {
  const bucket = appType === "fresh" ? FEE_SCHEDULE_KOBO.fresh : FEE_SCHEDULE_KOBO.renewal;
  return bucket[period] || bucket["5 years"];
}

// Ordered stages for the fresh-application journey — used to compute how
// far along an application is, independent of its current status label.
const STAGE_ORDER = [
  "submitted",
  "staff_review",
  "driving_school_enrolled",
  "driving_school_certificate_ready",
  "driving_school_graduated",
  "routed",
  "agent_assigned",
  "agent_accepted",
  "capture_scheduled",
  "capturing_scheduled",
  "scheduled",
  "captured",
  "capturing_completed",
  "agent_completed",
  "staff_final_review",
  "in_review",
  "ready_for_pickup",
  "awaiting_customer",
  "completed",
];

const STATUS_CONFIG = {
  // Initial & Routing States
  submitted: { label: "Submitted", tone: "info", desc: "Application form and documents submitted; awaiting payment verification." },
  staff_review: { label: "Under Staff Review", tone: "warning", desc: "Verifying background details & assigning driving school." },
  routed: { label: "Routed to LGA Agents", tone: "info", desc: "Verified and auto-routed to LGA VIO Processing Agents." },

  // Driving School States (Fresh Applications Only)
  driving_school_enrolled: { label: "Driving School Enrolled", tone: "purple", desc: "Enrolled in accredited driving school training." },
  driving_school_certificate_ready: { label: "Certificate Issued", tone: "purple", desc: "Driving school completed and certificate ready." },
  driving_school_graduated: { label: "School Complete", tone: "purple", desc: "Driving school training completed; transitioning to VIO." },

  // Processing Agent & Biometric Capture States
  agent_assigned: { label: "Processing at VIO Office", tone: "info", desc: "VIO processing agent accepted file at VIO office." },
  agent_accepted: { label: "Processing at VIO Office", tone: "info", desc: "VIO processing agent accepted file at VIO office." },
  capture_scheduled: { label: "Biometric Capture Scheduled", tone: "indigo", desc: "Biometric capture appointment booked at VIO center." },
  capturing_scheduled: { label: "Biometric Capture Scheduled", tone: "indigo", desc: "Biometric capture appointment booked at VIO center." },
  scheduled: { label: "Biometric Capture Scheduled", tone: "indigo", desc: "Biometric capture appointment booked at VIO center." },
  captured: { label: "Capture Completed - License in Production", tone: "teal", desc: "Biometrics completed; license card in production." },
  capturing_completed: { label: "Capture Completed - License in Production", tone: "teal", desc: "Biometrics completed; license card in production." },

  // Licence Issuance States (Fresh Applications Only)
  temp_licence_pending_review: { label: "Temporary Licence — Under Review", tone: "warning", desc: "Agent issued a temporary licence; awaiting staff approval." },
  temp_licence_issued: { label: "Temporary Licence Issued", tone: "purple", desc: "Temporary licence approved — permanent card is being processed." },

  // Final & Resolution States
  agent_completed: { label: "Final Verification & Quality Check", tone: "teal", desc: "Agent processing finished; undergoing staff quality assurance." },
  staff_final_review: { label: "Final Verification & Quality Check", tone: "warning", desc: "Undergoing internal quality assurance check." },
  in_review: { label: "Final Verification & Quality Check", tone: "warning", desc: "Undergoing internal quality assurance check." },
  ready_for_pickup: { label: "Ready for Pickup / Delivery", tone: "success", desc: "Driver's license card printed and ready for pickup." },
  awaiting_customer: { label: "Ready — Confirm Receipt", tone: "success", desc: "Card ready; please confirm receipt upon pickup." },
  completed: { label: "Completed", tone: "success", desc: "Driver's license application finished and closed." },

  // Exceptions & Corrections
  needs_correction: { label: "Action Required: Document Correction", tone: "warning", desc: "Flagged issue with uploaded documents." },
  staff_rejected: { label: "Application Rejected / Closed", tone: "danger", desc: "Application formally rejected or disqualified." },
  failed: { label: "Application Rejected / Closed", tone: "danger", desc: "Application formally rejected or disqualified." },
  expired: { label: "Licence Expired", tone: "danger", desc: "Validity period has elapsed — apply for a renewal." },
};

const TONE_CLASSES = {
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

const TONE_DOT = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  success: "bg-emerald-500",
  purple: "bg-violet-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  neutral: "bg-slate-400",
};

function statusMeta(status) {
  return STATUS_CONFIG[status] || { label: (status || "unknown").replace(/_/g, " "), tone: "neutral", desc: "" };
}

function stageProgress(status) {
  const idx = STAGE_ORDER.indexOf(status);
  if (idx === -1) return status === "completed" ? 1 : 0.05;
  return (idx + 1) / STAGE_ORDER.length;
}

function MiniProgressRing({ status, size = 36 }) {
  const progress = stageProgress(status);
  const isRejected = status === "staff_rejected" || status === "failed";
  const isDone = status === "completed";
  const meta = statusMeta(status);
  
  const toneColors = {
    info: "#0ea5e9", // sky-500
    warning: "#f59e0b", // amber-500
    danger: "#ef4444", // red-500
    success: "#10b981", // emerald-500
    purple: "#8b5cf6", // violet-500
    indigo: "#6366f1", // indigo-500
    teal: "#14b8a6", // teal-500
    neutral: "#94a3b8", // slate-400
  };
  const strokeColor = toneColors[meta.tone] || toneColors.neutral;

  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="#f1f5f9" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="round"
          stroke={isRejected ? "#ef4444" : strokeColor}
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#28A745" }} />
        ) : isRejected ? (
          <XCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: strokeColor }} />
        )}
      </div>
    </div>
  );
}

function isApplicationPaid(app) {
  if (!app) return false;
  const s = app.payment_status || app.payment_options?.payment_status;
  return s === "success" || s === "paid";
}

function paymentStatusMeta(app) {
  if (!app) return { label: "Payment Due", tone: "warning", needsRetry: false };
  const s = app.payment_status || app.payment_options?.payment_status;
  if (s === "success" || s === "paid") return { label: "Paid", tone: "success", needsRetry: false };
  if (s === "abandoned" || s === "failed") return { label: "Payment Failed / Retry", tone: "danger", needsRetry: true };
  return { label: "Payment Due", tone: "warning", needsRetry: false };
}

/* ────────────────────────────────────────────────────────────
   Status badge — dot + label, never color alone
   ──────────────────────────────────────────────────────────── */
function StatusBadge({ status, size = "md" }) {
  const meta = statusMeta(status);
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${pad} ${TONE_CLASSES[meta.tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} />
      {meta.label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Progress ring — a small, quiet callback to how far an
   application has travelled through its journey.
   ──────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────
   Segmented step progress bar for the application form
   ──────────────────────────────────────────────────────────── */
function StepProgress({ steps, current }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {steps.map((_, idx) => (
          <div key={idx} className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none"
              style={{
                width: idx + 1 <= current ? "100%" : "0%",
                background: BRAND,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Step {current} of {steps.length}
        </span>
        <span className="text-[13px] font-bold text-[#111111]">{steps[current - 1]}</span>
      </div>
    </div>
  );
}

function DocUploadSlot({ title, value, onChange, optional = false, hint }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Upload failed. Please try again.");
      return;
    }
    // file_url is the short server-side storage path (e.g. "/uploads/...")
    // returned by the real upload — never the raw file contents.
    onChange({ fileName: file.name, url: data.file_url });
  };

  return (
    <div>
      <label className={label}>
        {title}{" "}
        {optional ? (
          <span className="font-normal text-slate-400">(optional)</span>
        ) : (
          <span className="text-red-400">*</span>
        )}
      </label>
      {hint && <p className="mb-2 -mt-1 text-[12px] text-slate-500">{hint}</p>}
      {!value?.url ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all"
          style={{
            borderColor: dragActive ? BRAND : "#cbd5e1",
            background: dragActive ? BRAND_TINT : "#f8fafc",
          }}
        >
          <Upload className="h-5 w-5" style={{ color: BRAND }} />
          <p className="text-[12.5px] font-semibold text-slate-700">{uploading ? "Uploading…" : "Click or drop a file here"}</p>
          <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP — up to 10MB</p>
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
        </label>
      ) : (
        <div className="space-y-2 rounded-xl border border-[#E5E5E5] bg-slate-50/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="truncate text-[12.5px] font-semibold text-[#111111]">{value.fileName}</p>
              <span className="shrink-0 text-[11px] text-slate-400">Ready</span>
            </div>
            <button type="button" onClick={() => onChange(null)} className="shrink-0 text-[11px] font-medium text-red-600 hover:underline">
              Remove
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-[11.5px] font-medium text-red-600">{error}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────────────────────── */
export default function ApplyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(() => getCachedUser());
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [existingApplications, setExistingApplications] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const [view, setView] = useState("list"); // "list" | "form"
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [payingFromWallet, setPayingFromWallet] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const [step, setStep] = useState(1); // 1..5
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [applicationType, setApplicationType] = useState("fresh");
  const [licenceClass, setLicenceClass] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("Nigerian");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [mothersMaidenName, setMothersMaidenName] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [nin, setNin] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [hasFacialMark, setHasFacialMark] = useState(false);
  const [facialMarkDesc, setFacialMarkDesc] = useState("");
  const [hasDisability, setHasDisability] = useState(false);
  const [disabilityDesc, setDisabilityDesc] = useState("");
  const [passportPhoto, setPassportPhoto] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [originLgas, setOriginLgas] = useState([]);
  const [selectedOriginState, setSelectedOriginState] = useState("");
  const [selectedOriginLga, setSelectedOriginLga] = useState("");
  const [nokName, setNokName] = useState("");
  const [nokRelationship, setNokRelationship] = useState("");
  const [nokPhone, setNokPhone] = useState("+234");
  // Renewal/reissue required documents, keyed by exact backend doc_type
  // string (e.g. { old_driver_licence: { fileName, url } }).
  const [renewalDocs, setRenewalDocs] = useState({});
  const [oldLicenceNumber, setOldLicenceNumber] = useState("");

  useEffect(() => {
    Promise.all([authGetMe(), getReferenceStates(), getMyApplications(), getWallet()]).then(
      ([meRes, statesRes, appsRes, walletRes]) => {
        if (statesRes.data) setStates(statesRes.data);
        if (appsRes.data) setExistingApplications(appsRes.data);
        if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
        setLoadingExisting(false);

        if (meRes.data) {
          setUser(meRes.data);
          const bd = meRes.data.biodata || {};
          // Most recent past application is a strictly richer prefill source
          // than biodata alone (has city, height, disability/facial-mark,
          // passport photo, and real origin-state/LGA ids) — it wins field by
          // field when it has a value, biodata fills in the rest. NIN is the
          // one exception: the applications list endpoint redacts it (NDPA),
          // so it can only ever come from biodata.
          const latestApp = (appsRes.data && appsRes.data[0]) || {};
          const pick = (appVal, bdVal, fallback = "") =>
            appVal !== undefined && appVal !== null && appVal !== ""
              ? appVal
              : bdVal !== undefined && bdVal !== null && bdVal !== ""
              ? bdVal
              : fallback;

          setFirstName(pick(latestApp.first_name, bd.first_name, (meRes.data.name || "").split(" ")[0] || ""));
          setMiddleName(pick(latestApp.middle_name, bd.middle_name, ""));
          setLastName(pick(latestApp.last_name, bd.surname, (meRes.data.name || "").split(" ").slice(1).join(" ") || ""));
          setDob(pick(latestApp.date_of_birth, bd.date_of_birth, ""));
          setGender(pick(latestApp.gender, bd.gender, ""));
          setNationality(pick(latestApp.nationality, bd.nationality, "Nigerian"));
          setMaritalStatus(pick(latestApp.marital_status, bd.marital_status, ""));
          setMothersMaidenName(pick(latestApp.mothers_maiden_name, bd.mothers_maiden_name, ""));
          setResidentialAddress(pick(latestApp.residential_address, bd.residential_address, ""));
          setCity(latestApp.city || "");
          setCountry(latestApp.country || "Nigeria");
          setNin(bd.nin || "");
          setBloodGroup(pick(latestApp.blood_group, bd.blood_group, ""));
          setHeightCm(latestApp.height_cm != null ? String(latestApp.height_cm) : "");
          if (latestApp.has_facial_mark) {
            setHasFacialMark(true);
            setFacialMarkDesc(latestApp.facial_mark_description || "");
          }
          if (latestApp.has_disability) {
            setHasDisability(true);
            setDisabilityDesc(latestApp.disability_description || "");
          }
          setPassportPhoto(latestApp.passport_photo || "");
          setNokName(pick(latestApp.next_of_kin_name, bd.next_of_kin_name, ""));
          setNokRelationship(pick(latestApp.next_of_kin_relationship, bd.next_of_kin_relationship, ""));
          setNokPhone(pick(latestApp.next_of_kin_phone, bd.next_of_kin_phone, "+234"));
          if (meRes.data.state_id) setSelectedState(String(meRes.data.state_id));
          if (latestApp.origin_state_id) setSelectedOriginState(String(latestApp.origin_state_id));
        }
      }
    );

    // e.g. /dashboard/apply?type=renewal — used by the "Apply for renewal"
    // CTA shown once a fresh application's permanent licence has expired.
    const typeParam = searchParams.get("type");
    if (["fresh", "renewal", "reissue"].includes(typeParam)) {
      setApplicationType(typeParam);
      setView("form");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setLgas([]);
      setSelectedLga("");
      return;
    }
    getReferenceLgas(selectedState).then((res) => {
      if (res.data) {
        setLgas(res.data);
        if (user?.lga_id && !selectedLga) {
          const match = res.data.find((l) => String(l.id) === String(user.lga_id));
          if (match) setSelectedLga(String(match.id));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  useEffect(() => {
    if (!selectedOriginState) {
      setOriginLgas([]);
      setSelectedOriginLga("");
      return;
    }
    getReferenceLgas(selectedOriginState).then((res) => {
      if (res.data) {
        setOriginLgas(res.data);
        const originLgaId = existingApplications[0]?.origin_lga_id;
        if (originLgaId && !selectedOriginLga) {
          const match = res.data.find((l) => String(l.id) === String(originLgaId));
          if (match) setSelectedOriginLga(String(match.id));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOriginState]);

  const stateObj = states.find((s) => String(s.id) === String(selectedState));
  const lgaObj = lgas.find((l) => String(l.id) === String(selectedLga));
  const originStateObj = states.find((s) => String(s.id) === String(selectedOriginState));
  const originLgaObj = originLgas.find((l) => String(l.id) === String(selectedOriginLga));

  // Mirrors the backend's validators exactly (app/schemas/application.py) so
  // incomplete/invalid data is caught here instead of only surfacing as a
  // 422 after the user reaches the final review step.
  const validateStep = (n) => {
    const errors = {};
    if (n === 1) {
      if (applicationType !== "international_permit" && !validityPeriod) errors.validityPeriod = "Select a validity period.";
      if (applicationType === "fresh" && !licenceClass) errors.licenceClass = "Select a licence class.";
    }
    if (n === 2) {
      if (!selectedState) errors.selectedState = "Select your state of residence.";
      if (!selectedLga) errors.selectedLga = "Select your LGA.";
      
      if (applicationType === "fresh") {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const trimmedMaiden = mothersMaidenName.trim();
      if (!trimmedFirst) errors.firstName = "First name is required.";
      else if (!NAME_RE.test(trimmedFirst)) errors.firstName = "Use 2-50 letters, hyphens, apostrophes, or spaces only.";
      if (!trimmedLast) errors.lastName = "Last name is required.";
      else if (!NAME_RE.test(trimmedLast)) errors.lastName = "Use 2-50 letters, hyphens, apostrophes, or spaces only.";
      if (trimmedMaiden && !NAME_RE.test(trimmedMaiden)) errors.mothersMaidenName = "Use 2-50 letters, hyphens, apostrophes, or spaces only.";
      if (!dob) errors.dob = "Date of birth is required.";
      else {
        const age = ageFromDob(dob);
        if (age === null || age < MIN_APPLICANT_AGE) errors.dob = `Applicant must be at least ${MIN_APPLICANT_AGE} years old.`;
      }

      const trimmedNin = nin.trim();
      if (trimmedNin && !NIN_RE.test(trimmedNin)) errors.nin = "NIN must be exactly 11 digits.";
      if (heightCm && (Number(heightCm) < 100 || Number(heightCm) > 250)) errors.heightCm = "Height must be between 100 and 250 cm.";
      if (hasFacialMark && !facialMarkDesc.trim()) errors.facialMarkDesc = "Describe the facial mark, or uncheck this box.";
      if (hasDisability && !disabilityDesc.trim()) errors.disabilityDesc = "Describe the disability, or uncheck this box.";
      }
    }
    if (n === 3 && applicationType === "fresh") {
      if (!nokName.trim()) errors.nokName = "Next of kin's full name is required.";
      if (!nokPhone.trim() || nokPhone.trim() === "+234") errors.nokPhone = "Next of kin's phone number is required.";
    }
    if (n === 4 && applicationType === "fresh") {
      if (!passportPhoto) errors.passportPhoto = "Upload a passport photo to continue.";
    }
    if (n === 4 && applicationType !== "fresh") {
      if (applicationType === "international_permit") {
        if (!renewalDocs.id_document?.url) errors.documents = "Attach a photo of your International Passport or Nigeria Driver's Licence.";
      } else {
        if (!renewalDocs.old_driver_licence?.url) errors.documents = "Attach a photo of the front of your old licence.";
        if (!oldLicenceNumber.trim()) errors.oldLicenceNumber = "Enter your old licence number.";
      }
      const trimmedNin = nin.trim();
      if (!trimmedNin) errors.nin = "NIN is required.";
      else if (!NIN_RE.test(trimmedNin)) errors.nin = "NIN must be exactly 11 digits.";
      if (!passportPhoto) errors.passportPhoto = "Upload a passport photo to continue.";
    }
    return errors;
  };

  const handlePayFromWallet = async (appId, amountKobo) => {
    setPayingFromWallet(appId);
    const res = await payFromWalletEndpoint(appId, { amount_kobo: amountKobo });
    setPayingFromWallet(null);
    if (res.error) {
      showToast("error", res.error || "Insufficient wallet funds. Please top up your wallet or pay by card.");
      return;
    }
    showToast(
      "success",
      res.data?.is_fully_paid
        ? `Paid ${koboToNaira(amountKobo)} from your wallet — application fully paid!`
        : `Paid ${koboToNaira(amountKobo)} from your wallet. ${koboToNaira(res.data?.remaining_kobo || 0)} still remaining.`
    );
    const [appsRes, walletRes] = await Promise.all([getMyApplications(), getWallet()]);
    if (appsRes.data) {
      setExistingApplications(appsRes.data);
      if (successApp?.id === appId) {
        const updated = appsRes.data.find((a) => a.id === appId);
        if (updated) setSuccessApp(updated);
      }
    }
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
  };

  const handleSubmit = async () => {
    const allErrors = { ...validateStep(1), ...validateStep(2), ...validateStep(3), ...validateStep(4) };
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      const firstBadStep = [1, 2, 3, 4].find((s) => Object.keys(validateStep(s)).length > 0);
      if (firstBadStep) setStep(firstBadStep);
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setSubmitError(null);

    const res = applicationType === "fresh"
      ? await submitDriverLicenceApplication({
          application_type: applicationType,
          licence_class: licenceClass,
          validity_period: validityPeriod,
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob,
          gender,
          nationality,
          marital_status: maritalStatus,
          mothers_maiden_name: mothersMaidenName.trim() || undefined,
          state_of_origin: originStateObj?.name || undefined,
          lga_of_origin: originLgaObj?.name || undefined,
          origin_state_id: selectedOriginState ? parseInt(selectedOriginState, 10) : undefined,
          origin_lga_id: selectedOriginLga ? parseInt(selectedOriginLga, 10) : undefined,
          residential_address: residentialAddress.trim(),
          city: city.trim() || undefined,
          country,
          nin: nin.trim(),
          blood_group: bloodGroup,
          height_cm: heightCm ? parseInt(heightCm, 10) : undefined,
          has_facial_mark: hasFacialMark,
          facial_mark_description: hasFacialMark && facialMarkDesc.trim() ? facialMarkDesc.trim() : undefined,
          has_disability: hasDisability,
          disability_description: hasDisability && disabilityDesc.trim() ? disabilityDesc.trim() : undefined,
          passport_photo: passportPhoto,
          state_of_residence: stateObj?.name || "",
          lga: lgaObj?.name || "",
          state_id: parseInt(selectedState, 10),
          lga_id: parseInt(selectedLga, 10),
          next_of_kin_name: nokName.trim(),
          next_of_kin_relationship: nokRelationship,
          next_of_kin_phone: nokPhone.trim(),
          documents: [],
        })
      : await submitDriverLicenceApplication({
          application_type: applicationType,
          validity_period: validityPeriod,
          state_id: parseInt(selectedState, 10),
          lga_id: parseInt(selectedLga, 10),
          state_of_residence: states.find(s => s.id === parseInt(selectedState, 10))?.name || "",
          lga: lgas.find(l => l.id === parseInt(selectedLga, 10))?.name || "",
          old_licence_number: applicationType !== "international_permit" ? oldLicenceNumber.trim() : undefined,
          nin: nin.trim(),
          passport_photo: passportPhoto,
          id_document: applicationType === "international_permit" && renewalDocs.id_document?.url
            ? { doc_type: "international_passport", file_url: renewalDocs.id_document.url }
            : undefined,
          documents: applicationType !== "international_permit" && renewalDocs.old_driver_licence?.url
            ? [{ doc_type: "old_driver_licence", file_url: renewalDocs.old_driver_licence.url }]
            : [],
        });

    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
    } else {
      setSuccessApp(res.data);
      setExistingApplications([res.data, ...existingApplications]);
    }
  };

  const resetForm = () => {
    setStep(1);
    setApplicationType("fresh");
    setLicenceClass(""); setValidityPeriod("");
    setDob(""); setMiddleName(""); setGender(""); setNationality("Nigerian");
    setMaritalStatus(""); setMothersMaidenName("");
    setResidentialAddress(""); setCity(""); setCountry("Nigeria");
    setNin(""); setBloodGroup(""); setHeightCm("");
    setHasFacialMark(false); setFacialMarkDesc("");
    setHasDisability(false); setDisabilityDesc(""); setPassportPhoto("");
    setNokName(""); setNokRelationship(""); setNokPhone("+234");
    setOldLicenceNumber("");
    setRenewalDocs({});
    setSubmitError(null);
  };

  /* ── Success screen ── */
  if (successApp) {
    const payOpts = successApp.payment_options;
    const isPaid = isApplicationPaid(successApp);
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: BRAND_TINT }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: BRAND }} />
          </div>
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">Application submitted</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            Your {APPLICATION_TYPES.find((t) => t.value === successApp.application_type)?.label.toLowerCase()} is
            in — we'll walk you through every step from here.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">#{successApp.id}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={successApp.status} size="sm" />
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Amount due</span>
              <span className="font-mono font-bold text-[#111111]">
                {payOpts ? koboToNaira(payOpts.amount_kobo) : "—"}
              </span>
            </div>
          </div>

          {!isPaid && payOpts && (
            <div className="mt-5 space-y-2.5 text-left">
              <PartialPayControls
                remainingKobo={payOpts.remaining_kobo ?? payOpts.amount_kobo}
                walletBalanceKobo={walletBalance}
                payingWallet={payingFromWallet === successApp.id}
                onPay={(amountKobo) => handlePayFromWallet(successApp.id, amountKobo)}
              />
              {payOpts.checkout_url && (
                <a
                  href={payOpts.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnSecondary} w-full`}
                >
                  Pay with card or bank transfer
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {isPaid && (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-[13px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Application fee paid
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setSuccessApp(null);
                setView("list");
              }}
              className={`${btnPrimary} flex-1`}
              style={{ background: BRAND }}
            >
              View all applications
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessApp(null);
                resetForm();
              }}
              className={`${btnSecondary} flex-1`}
            >
              Start another
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Applications list ── */
  if (view === "list") {
    const totalApps = existingApplications.length;
    const paidApps = existingApplications.filter(isApplicationPaid).length;
    const pendingPaymentApps = totalApps - paidApps;

    return (
      <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Driver's licence
              </span>
            </div>
            <h1
              className="mt-1.5 text-[30px] tracking-tight text-[#111111]"
              style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
            >
              Your applications
            </h1>
            <p className="mt-1 text-[13.5px] text-slate-500">
              Track progress, handle payment, and see what's next for each one.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setView("form");
            }}
            className={btnPrimary}
            style={{ background: BRAND }}
          >
            <Plus className="h-4 w-4" />
            New application
          </button>
        </div>

        {/* Summary strip — one card, hairline dividers, not three boxes */}
        {totalApps > 0 && (
          <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-[#E5E5E5] bg-white">
            <div className="px-5 py-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total</span>
              <span className="mt-0.5 block text-[22px] font-bold text-[#111111]">{totalApps}</span>
            </div>
            <div className="px-5 py-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paid</span>
              <span className="mt-0.5 block text-[22px] font-bold text-emerald-600">{paidApps}</span>
            </div>
            <div className="px-5 py-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Awaiting payment
              </span>
              <span className="mt-0.5 block text-[22px] font-bold text-amber-600">{pendingPaymentApps}</span>
            </div>
          </div>
        )}

        {/* Applications — card list */}
        {loadingExisting ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
            ))}
          </div>
        ) : existingApplications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-white px-8 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-[16px] font-bold text-[#111111]">No applications yet</h3>
            <p className="mx-auto mt-1 max-w-xs text-[13px] text-slate-500">
              Start a fresh, renewal, or reissue application — it takes about five minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setView("form");
              }}
              className={`${btnPrimary} mt-5`}
              style={{ background: BRAND }}
            >
              <Plus className="h-4 w-4" />
              Start application
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {existingApplications.map((app) => {
              const payOpts = app.payment_options;
              const isPaid = isApplicationPaid(app);
              const payMeta = paymentStatusMeta(app);
              const amountKobo = payOpts?.amount_kobo || estimateFeeKobo(app.application_type, app.validity_period);
              const remainingKobo = payOpts?.remaining_kobo ?? amountKobo;

              return (
                <div
                  key={app.id}
                  onClick={() => router.push(`/dashboard/apply/${app.id}`)}
                  className="cursor-pointer rounded-2xl border border-[#E5E5E5] bg-white p-5 transition-all hover:border-[#28A745]/60 hover:shadow-md group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <MiniProgressRing status={app.status} size={40} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-bold capitalize text-[#111111] group-hover:text-[#28A745] transition-colors">
                            {app.application_type} application
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                            #{app.id}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(app.created_at)}
                          </span>
                          {(app.lga || app.state_of_residence) && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {app.lga}{app.state_of_residence ? `, ${app.state_of_residence}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5">
                          <StatusBadge status={app.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Paid {koboToNaira(amountKobo)}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${payMeta.needsRetry ? "text-red-600" : "text-amber-700"}`}>
                          {payMeta.needsRetry ? <RefreshCw className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          {payMeta.label} ({koboToNaira(remainingKobo)} left)
                        </span>
                      )}
                      {!isPaid && payOpts?.checkout_url && (
                        <a
                          href={payOpts.checkout_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={btnGhost}
                        >
                          Checkout
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    {!isPaid && (
                      <div className="mt-3.5 max-w-md">
                        <PartialPayControls
                          remainingKobo={remainingKobo}
                          walletBalanceKobo={walletBalance}
                          payingWallet={payingFromWallet === app.id}
                          onPay={(amt) => handlePayFromWallet(app.id, amt)}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {app.status === "expired" && (
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/apply?type=renewal")}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all active:scale-[0.98]"
                          style={{ background: "#dc2626" }}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Renew now
                        </button>
                      )}
                      <button type="button" onClick={() => router.push(`/dashboard/apply/${app.id}`)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-[#28A745] hover:text-white hover:border-[#28A745] transition-all shadow-sm">
                        <span>View Full Details & Status</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail panel */}
        {selectedAppDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E5E5E5] bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                <div>
                  <h3 className="text-[15px] font-bold capitalize text-[#111111]">
                    {selectedAppDetail.application_type} application
                  </h3>
                  <p className="mt-0.5 font-mono text-[11.5px] text-slate-400">#{selectedAppDetail.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAppDetail(null)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <MiniProgressRing status={selectedAppDetail.status} size={40} />
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Current status
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={selectedAppDetail.status} />
                    </div>
                    {statusMeta(selectedAppDetail.status).desc && (
                      <p className="mt-1.5 text-[12.5px] text-slate-600 leading-snug">
                        {statusMeta(selectedAppDetail.status).desc}
                      </p>
                    )}
                  </div>
                </div>

                {!isApplicationPaid(selectedAppDetail) && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-[14px] font-bold text-[#111111]">
                            {paymentStatusMeta(selectedAppDetail).needsRetry ? "Payment Failed / Retry Required" : "Service Fee Payment Due"}
                          </h4>
                          <span className="font-mono text-[14px] font-bold text-[#111111]">
                            {koboToNaira(selectedAppDetail.payment_options?.remaining_kobo ?? selectedAppDetail.payment_options?.amount_kobo ?? estimateFeeKobo(selectedAppDetail.application_type, selectedAppDetail.validity_period))} left
                          </span>
                        </div>
                        <p className="mt-1 text-[12.5px] text-slate-600 leading-relaxed">
                          {paymentStatusMeta(selectedAppDetail).needsRetry
                            ? "Your previous checkout attempt failed or was cancelled. Please retry below to verify fee and trigger VIO processing."
                            : "Your application has been submitted and is awaiting payment verification before entering staff review or VIO routing."}
                        </p>
                        <div className="mt-3 space-y-2.5">
                          <PartialPayControls
                            remainingKobo={selectedAppDetail.payment_options?.remaining_kobo ?? selectedAppDetail.payment_options?.amount_kobo ?? estimateFeeKobo(selectedAppDetail.application_type, selectedAppDetail.validity_period)}
                            walletBalanceKobo={walletBalance}
                            payingWallet={payingFromWallet === selectedAppDetail.id}
                            onPay={(amt) => handlePayFromWallet(selectedAppDetail.id, amt)}
                          />
                          {selectedAppDetail.payment_options?.checkout_url && (
                            <a
                              href={selectedAppDetail.payment_options.checkout_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              Pay with card or bank transfer
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppDetail.status === "needs_correction" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-[13.5px] font-bold text-amber-900">Action Required: Document Correction</h4>
                        <p className="mt-1 text-[12.5px] text-amber-800 leading-relaxed">
                          {selectedAppDetail.staff_note || "A processing agent flagged one or more uploaded verification documents. Please re-upload clearer copies below."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedAppDetail.status === "staff_rejected" || selectedAppDetail.status === "failed") && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-[13.5px] font-bold text-red-900">Application Rejected / Closed</h4>
                        <p className="mt-1 text-[12.5px] text-red-800 leading-relaxed">
                          {selectedAppDetail.staff_note || "This application was not approved during internal verification or VIO quality check. Please contact support desk."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppDetail.status === "ready_for_pickup" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                      <div>
                        <h4 className="text-[13.5px] font-bold text-emerald-900">Ready for Pickup / Delivery</h4>
                        <p className="mt-1 text-[12.5px] text-emerald-800 leading-relaxed">
                          {selectedAppDetail.pickup_instructions || "Your physical Driver's Licence card has been printed and verified. Please proceed to your assigned VIO office for collection or check courier dispatch tracking."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppDetail.status === "awaiting_customer" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                      <div>
                        <h4 className="text-[13.5px] font-bold text-emerald-900">Action Required: Confirm Receipt</h4>
                        <p className="mt-1 text-[12.5px] text-emerald-800 leading-relaxed">
                          Your physical card is ready. Once you receive your driver's licence, please confirm receipt to close out this file.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedAppDetail.assigned_agent || ["agent_assigned", "agent_accepted", "capture_scheduled", "capturing_scheduled", "scheduled", "captured", "capturing_completed", "agent_completed"].includes(selectedAppDetail.status)) && (
                  <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4.5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-2.5">
                      <UserCheck className="h-4 w-4" style={{ color: BRAND }} />
                      <h4 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-700">
                        Assigned VIO Processing Agent
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">Agent Name</span>
                        <span className="font-semibold text-slate-800">
                          {selectedAppDetail.assigned_agent?.name || "Assigned Officer"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">Phone Contact</span>
                        <span className="font-mono font-medium text-slate-800">
                          {selectedAppDetail.assigned_agent?.phone || "+234 ••• ••••"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400">VIO Office</span>
                        <span className="font-semibold text-slate-800">
                          {selectedAppDetail.assigned_agent?.vio_office || `${selectedAppDetail.lga || "LGA"} VIO Center`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!["ready_for_pickup", "awaiting_customer", "completed"].includes(selectedAppDetail.status) &&
                  (selectedAppDetail.capture_scheduled_at || ["capture_scheduled", "capturing_scheduled", "captured", "capturing_completed"].includes(selectedAppDetail.status)) && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4.5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3 border-b border-indigo-100 pb-2.5">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <h4 className="text-[12.5px] font-bold uppercase tracking-wide text-indigo-900">
                        Biometric Capture Appointment
                      </h4>
                    </div>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Appointment Schedule:</span>
                        <span className="font-semibold text-indigo-950">
                          {selectedAppDetail.capture_scheduled_at
                            ? new Date(selectedAppDetail.capture_scheduled_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
                            : "Booked by VIO Agent"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-slate-500 shrink-0">Capture Center:</span>
                        <span className="font-semibold text-indigo-950 text-right">
                          {selectedAppDetail.capture_centre_name || selectedAppDetail.assigned_agent?.vio_office || `${selectedAppDetail.lga || "Designated"} FRSC/VIO Capture Center`}
                        </span>
                      </div>
                      {selectedAppDetail.assigned_agent && (
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-slate-500 shrink-0">Field Agent:</span>
                          <span className="font-semibold text-indigo-950 text-right">
                            {selectedAppDetail.assigned_agent.name}
                            {selectedAppDetail.assigned_agent.phone && ` · ${selectedAppDetail.assigned_agent.phone}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!["ready_for_pickup", "awaiting_customer", "completed"].includes(selectedAppDetail.status) &&
                  (selectedAppDetail.driving_school || ["driving_school_enrolled", "driving_school_certificate_ready", "driving_school_graduated"].includes(selectedAppDetail.status)) && (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4.5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3 border-b border-purple-100 pb-2.5">
                      <Building className="h-4 w-4 text-purple-600" />
                      <h4 className="text-[12.5px] font-bold uppercase tracking-wide text-purple-900">
                        Driving School Enrollment
                      </h4>
                    </div>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Accredited Partner:</span>
                        <span className="font-semibold text-purple-950">
                          {selectedAppDetail.driving_school?.name || selectedAppDetail.driving_school_name || "Assigned Driving Academy"}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-purple-800 leading-relaxed pt-1">
                        {selectedAppDetail.driving_school?.instructions || "Please attend your scheduled training sessions to qualify for certificate issuance before VIO biometric capture."}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="mb-3 border-b border-slate-100 pb-2 text-[11.5px] font-bold uppercase tracking-wide text-slate-400">
                    Documents ({selectedAppDetail.documents?.length || 0})
                  </h4>
                  {!selectedAppDetail.documents || selectedAppDetail.documents.length === 0 ? (
                    <p className="text-[13px] text-slate-400">Nothing uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAppDetail.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 shrink-0" style={{ color: BRAND }} />
                            <div>
                              <p className="text-[13px] font-semibold capitalize text-[#111111]">
                                {doc.doc_type?.replace(/_/g, " ")}
                              </p>
                              {doc.uploaded_at && (
                                <p className="text-[11px] text-slate-400">{formatDate(doc.uploaded_at)}</p>
                              )}
                            </div>
                          </div>
                          {doc.file_url && (
                            <a
                              href={resolveMediaUrl(doc.file_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[12px] font-semibold hover:underline"
                              style={{ color: BRAND }}
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="mb-3 border-b border-slate-100 pb-2 text-[11.5px] font-bold uppercase tracking-wide text-slate-400">
                    History
                  </h4>
                  {!selectedAppDetail.events || selectedAppDetail.events.length === 0 ? (
                    <p className="text-[13px] text-slate-400">No history recorded yet.</p>
                  ) : (
                    <div className="space-y-4 border-l-2 border-slate-100 pl-4">
                      {selectedAppDetail.events.map((ev, idx) => (
                        <div key={idx} className="relative">
                          <div
                            className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white"
                            style={{ background: BRAND }}
                          />
                          <p className="text-[13px] font-semibold text-slate-800">
                            {ev.note || `Status updated to ${(ev.new_status || ev.status || "").replace(/_/g, " ")}`}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(ev.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button type="button" onClick={() => setSelectedAppDetail(null)} className={btnSecondary}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Application form ── */
  const activeSteps = applicationType === "fresh" ? [1, 2, 3, 4, 5] : [1, 2, 4, 5];
  const activeLabels = applicationType === "fresh"
    ? ["Application type", "Personal details", "Next of kin", "Document", "Review & submit"]
    : ["Application type", "Residence", "Details", "Review & submit"];
  const stepDisplayIndex = Math.max(1, activeSteps.indexOf(step) + 1);

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4 pb-16">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setView("list")}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1
            className="text-[21px] tracking-tight text-[#111111]"
            style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
          >
            New application
          </h1>
          <p className="text-[12.5px] text-[#7A7A7A]">
            {applicationType === "fresh" ? "Fresh application — five short steps." : "Renewal, reissue, or international permit — just a few details."}
          </p>
        </div>
      </div>

      <StepProgress steps={activeLabels} current={stepDisplayIndex} />

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4 p-6">
            <p className="text-[13px] text-slate-500">Choose the type of application you're submitting.</p>
            <div className="space-y-2.5">
              {APPLICATION_TYPES.map((t) => {
                const active = applicationType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setApplicationType(t.value)}
                    className="flex w-full items-start gap-3.5 rounded-xl border-2 p-4 text-left transition-all"
                    style={{
                      borderColor: active ? BRAND : "#e2e8f0",
                      background: active ? BRAND_TINT : "#fff",
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                      style={{ borderColor: active ? BRAND : "#cbd5e1" }}
                    >
                      {active && <div className="h-2 w-2 rounded-full" style={{ background: BRAND }} />}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#111111]">{t.label}</p>
                      <p className="mt-0.5 text-[12.5px] text-slate-500">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {applicationType === "fresh" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[12.5px] text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>Fresh applications include driving school enrollment before an agent is assigned to you.</span>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 ${applicationType === "fresh" ? "sm:grid-cols-2" : ""}`}>
              {applicationType === "fresh" && (
                <div>
                  <label className={label}>Licence class <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={licenceClass}
                      onChange={(e) => setLicenceClass(e.target.value)}
                      className={`${inputBase} appearance-none pr-8 ${errInputClass(!!fieldErrors.licenceClass)}`}
                    >
                      <option value="" disabled>Select licence class</option>
                      {LICENCE_CLASSES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.licenceClass} />
                </div>
              )}
              {applicationType !== "international_permit" && (
                <div>
                  <label className={label}>Validity period <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(e.target.value)}
                      className={`${inputBase} appearance-none pr-8 ${errInputClass(!!fieldErrors.validityPeriod)}`}
                    >
                      <option value="" disabled>Select validity period</option>
                      {VALIDITY_PERIODS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.validityPeriod} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
              <div>
                <h2 className="text-[13px] font-medium text-[#111111]">State &amp; LGA of residence</h2>
                <p className="text-[12px] text-[#7A7A7A]">This determines which capturing center processes your application.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>State of residence <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(""); }} className={`${inputBase} appearance-none pr-8 ${errInputClass(!!fieldErrors.selectedState)}`}>
                      <option value="" disabled>Select state</option>
                      {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.selectedState} />
                </div>
                <div>
                  <label className={label}>LGA <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} disabled={!selectedState || lgas.length === 0} className={`${inputBase} appearance-none pr-8 disabled:opacity-50 ${errInputClass(!!fieldErrors.selectedLga)}`}>
                      <option value="" disabled>Select LGA</option>
                      {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.selectedLga} />
                </div>
              </div>
            </div>

            {applicationType === "fresh" && (
              <>
                <p className="text-[13px] text-slate-500 mt-4">Pre-filled from your profile — check everything's correct.</p>
            {user && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: BRAND }}>
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#111111]">{user.name}</p>
                  <p className="truncate text-[11.5px] text-slate-500">{user.email} · {user.phone}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={label}>First name <span className="text-red-400">*</span></label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ada" className={`${inputBase} ${errInputClass(!!fieldErrors.firstName)}`} />
                <FieldError message={fieldErrors.firstName} />
              </div>
              <div>
                <label className={label}>Middle name</label>
                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="(optional)" className={inputBase} />
              </div>
              <div>
                <label className={label}>Last name <span className="text-red-400">*</span></label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Obi" className={`${inputBase} ${errInputClass(!!fieldErrors.lastName)}`} />
                <FieldError message={fieldErrors.lastName} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Date of birth <span className="text-red-400">*</span></label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                  max={new Date(Date.now() - MIN_APPLICANT_AGE * 365.25 * 86400000).toISOString().split("T")[0]}
                  className={`${inputBase} ${errInputClass(!!fieldErrors.dob)}`} />
                <FieldError message={fieldErrors.dob} />
              </div>
              <div>
                <label className={label}>Gender</label>
                <div className="relative">
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                    <option value="" disabled>Select gender</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Nationality</label>
                <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Nigerian" className={inputBase} />
              </div>
              <div>
                <label className={label}>Marital status</label>
                <div className="relative">
                  <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select...</option>
                    <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>NIN <span className="text-red-400">*</span></label>
                <input type="text" inputMode="numeric" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))} placeholder="12345678901" maxLength={11} className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.nin)}`} />
                <FieldError message={fieldErrors.nin} />
              </div>
              <div>
                <label className={label}>Residential address</label>
                <input type="text" value={residentialAddress} onChange={(e) => setResidentialAddress(e.target.value)} placeholder="123 Example Street, Lagos" className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Blood group</label>
                <div className="relative">
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select...</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>State of origin</label>
                <div className="relative">
                  <select value={selectedOriginState} onChange={(e) => { setSelectedOriginState(e.target.value); setSelectedOriginLga(""); }} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={label}>LGA of origin</label>
                <div className="relative">
                  <select value={selectedOriginLga} onChange={(e) => setSelectedOriginLga(e.target.value)} disabled={!selectedOriginState || originLgas.length === 0} className={`${inputBase} appearance-none pr-8 disabled:opacity-50`}>
                    <option value="">Select LGA</option>
                    {originLgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lagos, Kano, Abuja" className={inputBase} />
              </div>
              <div>
                <label className={label}>Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Nigeria" className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Mother's maiden name</label>
                <input type="text" value={mothersMaidenName} onChange={(e) => setMothersMaidenName(e.target.value)} placeholder="e.g. Adeyemi" className={`${inputBase} ${errInputClass(!!fieldErrors.mothersMaidenName)}`} />
                <FieldError message={fieldErrors.mothersMaidenName} />
              </div>
              <div>
                <label className={label}>Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 170" min={100} max={250} className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.heightCm)}`} />
                <FieldError message={fieldErrors.heightCm} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Physical Characteristics</p>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={hasFacialMark} onChange={(e) => { setHasFacialMark(e.target.checked); if (!e.target.checked) setFacialMarkDesc(""); }} className="h-4 w-4 rounded accent-[#28A745]" />
                <span className="text-[13.5px] font-medium text-slate-800">Has facial mark</span>
              </label>
              {hasFacialMark && (
                <div>
                  <input type="text" value={facialMarkDesc} onChange={(e) => setFacialMarkDesc(e.target.value)} placeholder="Brief description of facial mark(s)" className={`${inputBase} ${errInputClass(!!fieldErrors.facialMarkDesc)}`} />
                  <FieldError message={fieldErrors.facialMarkDesc} />
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={hasDisability} onChange={(e) => { setHasDisability(e.target.checked); if (!e.target.checked) setDisabilityDesc(""); }} className="h-4 w-4 rounded accent-[#28A745]" />
                <span className="text-[13.5px] font-medium text-slate-800">Has any disability</span>
              </label>
              {hasDisability && (
                <div>
                  <input type="text" value={disabilityDesc} onChange={(e) => setDisabilityDesc(e.target.value)} placeholder="Brief description of disability" className={`${inputBase} ${errInputClass(!!fieldErrors.disabilityDesc)}`} />
                  <FieldError message={fieldErrors.disabilityDesc} />
                </div>
              )}
            </div>
            </>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">Who should we contact in an emergency?</p>
            <div>
              <label className={label}>Full name <span className="text-red-400">*</span></label>
              <input type="text" value={nokName} onChange={(e) => setNokName(e.target.value)} placeholder="Emeka Obi" className={`${inputBase} ${errInputClass(!!fieldErrors.nokName)}`} />
              <FieldError message={fieldErrors.nokName} />
            </div>
            <div>
              <label className={label}>Relationship</label>
              <div className="relative">
                <select value={nokRelationship} onChange={(e) => setNokRelationship(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                  <option value="">Select relationship...</option>
                  {["Spouse","Parent","Sibling","Child","Grandparent","Grandchild","Aunt / Uncle","Niece / Nephew","Cousin","Friend","Guardian","Other"].map(r => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className={label}>Phone number <span className="text-red-400">*</span></label>
              <div className="flex rounded-xl border border-[#E5E5E5] bg-slate-50/60 overflow-hidden focus-within:border-[#28A745] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#28A745]/15">
                <span className="flex items-center pl-3.5 pr-3 text-[13.5px] font-semibold text-slate-500 select-none border-r border-[#E5E5E5] bg-slate-100/80">+234</span>
                <input type="tel" value={nokPhone.replace(/^\+?234/, "").replace(/^0/, "")} onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, ""); setNokPhone("+234" + raw); }} placeholder="8012345678" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13.5px] bg-transparent outline-none text-[#111111] font-mono" />
              </div>
              <FieldError message={fieldErrors.nokPhone} />
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && applicationType !== "fresh" && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">
              Your other details are carried over from your most recent application — we just need
              these things to process your {applicationType.replace("_", " ")}.
            </p>
            {applicationType === "international_permit" ? (
              <DocUploadSlot
                title="International Passport or Nigeria Driver's Licence"
                value={renewalDocs.id_document}
                onChange={(v) => setRenewalDocs((p) => ({ ...p, id_document: v }))}
              />
            ) : (
              <DocUploadSlot
                title="Front of your old licence"
                value={renewalDocs.old_driver_licence}
                onChange={(v) => setRenewalDocs((p) => ({ ...p, old_driver_licence: v }))}
              />
            )}
            <FieldError message={fieldErrors.documents} />
            {applicationType !== "international_permit" && (
              <div>
                <label className={label}>Old licence number <span className="text-red-400">*</span></label>
                <input type="text" value={oldLicenceNumber} onChange={(e) => setOldLicenceNumber(e.target.value)} placeholder="e.g. LAG-01-23456789" className={`${inputBase} ${errInputClass(!!fieldErrors.oldLicenceNumber)}`} />
                <FieldError message={fieldErrors.oldLicenceNumber} />
              </div>
            )}
            <div>
              <label className={label}>NIN <span className="text-red-400">*</span></label>
              <input type="text" inputMode="numeric" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))} placeholder="12345678901" maxLength={11} className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.nin)}`} />
              <FieldError message={fieldErrors.nin} />
            </div>
            <DocUploadSlot
              title="Passport photo"
              value={passportPhoto ? { fileName: "Passport photo", url: passportPhoto } : null}
              onChange={(v) => setPassportPhoto(v?.url || "")}
            />
            <FieldError message={fieldErrors.passportPhoto} />
          </div>
        )}

        {step === 4 && applicationType === "fresh" && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">
              Upload a clear passport photograph — this is required to submit your application.
            </p>
            <DocUploadSlot
              title="Passport photo"
              value={passportPhoto ? { fileName: "Passport photo", url: passportPhoto } : null}
              onChange={(v) => setPassportPhoto(v?.url || "")}
            />
            <FieldError message={fieldErrors.passportPhoto} />
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">Check everything below, then submit.</p>
            {submitError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[12.5px] font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{submitError}</span>
              </div>
            )}
            <div className="space-y-3">
              {(applicationType === "fresh"
                ? [
                    {
                      section: "Application",
                      rows: [
                        ["Type", APPLICATION_TYPES.find((t) => t.value === applicationType)?.label],
                        ["Licence class", LICENCE_CLASSES.find((c) => c.value === licenceClass)?.label || "—"],
                        ["Validity period", validityPeriod || "—"],
                      ],
                    },
                    {
                      section: "Personal details",
                      rows: [
                        ["Full name", [firstName, middleName, lastName].filter(Boolean).join(" ")],
                        ["Date of birth", dob],
                        ["Gender", gender || "—"],
                        ["NIN", nin || "—"],
                        ["Nationality", nationality || "—"],
                        ["Marital status", maritalStatus || "—"],
                        ["Blood group", bloodGroup || "—"],
                        ["Residential address", residentialAddress || "—"],
                        ["State / LGA", stateObj?.name && lgaObj?.name ? `${stateObj.name} / ${lgaObj.name}` : "—"],
                      ],
                    },
                    {
                      section: "Next of kin",
                      rows: [
                        ["Name", nokName || "—"],
                        ["Relationship", nokRelationship || "—"],
                        ["Phone", nokPhone || "—"],
                      ],
                    },
                    {
                      section: "Document",
                      rows: [
                        ["Passport photo", passportPhoto ? "Uploaded" : "Not provided"],
                      ],
                    },
                  ]
                : applicationType === "international_permit"
                  ? [
                      {
                        section: "Application",
                        rows: [
                          ["Type", APPLICATION_TYPES.find((t) => t.value === applicationType)?.label],
                          ["State / LGA", (selectedState && selectedLga) ? `${states.find(s => s.id === parseInt(selectedState, 10))?.name || ""} / ${lgas.find(l => l.id === parseInt(selectedLga, 10))?.name || ""}` : "—"],
                        ],
                      },
                      {
                        section: "Permit details",
                        rows: [
                          ["NIN", nin || "—"],
                          ["ID Document", renewalDocs.id_document?.fileName || "Not provided"],
                          ["Passport photo", passportPhoto ? "Uploaded" : "Not provided"],
                        ],
                      },
                    ]
                  : [
                      {
                        section: "Application",
                        rows: [
                          ["Type", APPLICATION_TYPES.find((t) => t.value === applicationType)?.label],
                          ["Validity period", validityPeriod || "—"],
                        ],
                      },
                      {
                        section: `${applicationType === "reissue" ? "Reissue" : "Renewal"} details`,
                        rows: [
                          ["Old licence number", oldLicenceNumber || "—"],
                          ["NIN", nin || "—"],
                          ["Old licence photo", renewalDocs.old_driver_licence?.fileName || "Not provided"],
                          ["Passport photo", passportPhoto ? "Uploaded" : "Not provided"],
                        ],
                      },
                    ]
              ).map(({ section, rows }) => (
                <div key={section} className="overflow-hidden rounded-xl border border-slate-100">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{section}</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {rows.map(([rowLabel, value]) => (
                      <div key={rowLabel} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[12px] text-slate-500">{rowLabel}</span>
                        <span className="max-w-[55%] truncate text-right text-[13px] font-semibold text-[#111111]">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="flex items-start gap-2.5 rounded-xl border p-3.5 text-[12.5px]"
              style={{ borderColor: "rgba(40, 167, 69,0.25)", background: BRAND_TINT, color: "#065f46" }}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
              <span>
                After you submit, a payment of <strong>{koboToNaira(estimateFeeKobo(applicationType, validityPeriod))}</strong> will
                be generated — pay by card, bank transfer, or straight from your Vehiculars wallet.
              </span>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          {activeSteps.indexOf(step) > 0 ? (
            <button
              type="button"
              onClick={() => setStep(activeSteps[activeSteps.indexOf(step) - 1])}
              className={btnSecondary}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {activeSteps.indexOf(step) < activeSteps.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                const errors = validateStep(step);
                if (Object.keys(errors).length > 0) {
                  setFieldErrors(errors);
                  return;
                }
                setFieldErrors({});
                setStep(activeSteps[activeSteps.indexOf(step) + 1]);
              }}
              className={btnPrimary}
              style={{ background: BRAND }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting} className={btnPrimary} style={{ background: BRAND }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          )}
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border transition-all max-w-sm ${
            toast.type === "error"
              ? "bg-white border-red-200 text-red-800"
              : "bg-white border-emerald-200 text-emerald-800"
          }`}
        >
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
              toast.type === "error" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {toast.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111111]">{toast.type === "error" ? "Payment Failed" : "Success"}</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500 leading-relaxed">{toast.msg}</p>
          </div>
          <button type="button" onClick={() => setToast(null)} className="ml-1 shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}