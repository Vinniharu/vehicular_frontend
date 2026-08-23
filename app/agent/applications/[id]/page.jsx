"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  Send,
  Fingerprint,
  Building2,
  Upload,
  Image as ImageIcon,
  X,
  Info,
  Phone,
  Mail,
  User as UserIcon,
  Globe2,
  HeartPulse,
  BadgeCheck,
  Copy,
  Check,
} from "lucide-react";
import {
  getApplication,
  koboToNaira,
  scheduleCapturing,
  reassignCaptureCentre,
  markCapturingCompleted,
  uploadProof,
  uploadTemporaryLicence,
  flagDocumentIssue,
  resolveMediaUrl,
  getAgentSupportChat,
  sendAgentSupportChatMessage,
  uploadApplicationFile,
  addApplicationDocument,
  submitVehicleVerificationChecklist,
} from "@/lib/api";
import { statusMeta, StatusBadge } from "../../_status";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import AgentChatPanel from "@/app/components/design/AgentChatPanel";

const BRAND = "#28A745";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]";
const inputBase =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";

function Field({ label, value, mono, capitalize, fallback = "—", valueClassName = "" }) {
  return (
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`mt-0.5 block text-[13.5px] font-semibold text-slate-900 ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""} ${valueClassName}`}>
        {value || fallback}
      </span>
    </div>
  );
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function guessPermanentLicenceExpiry(validityPeriod) {
  const years = parseInt(validityPeriod || "", 10);
  if (!Number.isFinite(years) || years <= 0) return "";
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return toDateInputValue(d);
}

function defaultTemporaryLicenceExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return toDateInputValue(d);
}

const REVIEW_STATUS_TONE = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function LicenceCard({ title, licence, onViewDoc }) {
  if (!licence) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        <p className="mt-1 text-[13px] text-slate-400">Not issued yet.</p>
      </div>
    );
  }
  const reviewTone = REVIEW_STATUS_TONE[licence.review_status] || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        {licence.review_status && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize ring-1 ring-inset ${reviewTone}`}>
            {licence.review_status}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-[14px] font-bold text-slate-900">{licence.licence_number || "—"}</p>
      <p className="mt-1 text-[12px] text-slate-500">
        {licence.expiry_date ? `Valid until ${new Date(licence.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : "No expiry date recorded"}
      </p>
      {licence.is_expired && (
        <p className="mt-1 text-[11.5px] font-semibold text-red-600">Expired</p>
      )}
      {licence.document_url && (
        <button onClick={(e) => { e.preventDefault(); onViewDoc(resolveMediaUrl(licence.document_url)); }} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold hover:underline" style={{ color: BRAND }}>
          View document <ExternalLink className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// Consistent action-button color system — replaces the previous per-button
// ad-hoc inline hex colors with one small named lookup, reused everywhere.
const ACTION_VARIANTS = {
  primary: { filled: true, bg: BRAND },
  success: { filled: true, bg: "#0d9488" },
  accent: { filled: true, bg: "#7c3aed" },
  info: { filled: false, color: "#4338ca", border: "#c7d2fe" },
  danger: { filled: false, color: "#b91c1c", border: "#fecaca" },
};

function ActionButton({ variant = "primary", icon: Icon, onClick, disabled, loading, children }) {
  const v = ACTION_VARIANTS[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={v.filled ? btnPrimary : btnSecondary}
      style={v.filled ? { background: v.bg } : { color: v.color, borderColor: v.border }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// Consistent section-card wrapper — replaces ~8 hand-rolled, near-identical
// white-card blocks (icon + uppercase label + border-b header) with one
// shared component supporting the two tinted variants already in use
// (emerald for contact, indigo for capture info).
const SECTION_TONE = {
  white: { wrap: "border-slate-200 bg-white", header: "border-slate-100 text-slate-500" },
  emerald: { wrap: "border-emerald-200 bg-emerald-50/40", header: "border-emerald-100 text-emerald-800" },
  indigo: { wrap: "border-indigo-200 bg-indigo-50/40", header: "border-indigo-100 text-slate-500" },
};

function Section({ title, icon: Icon, iconColor = BRAND, tone = "white", className = "", children }) {
  const t = SECTION_TONE[tone];
  return (
    <div className={`rounded-2xl border p-5 ${t.wrap} ${className}`}>
      <h3 className={`mb-4 flex items-center gap-1.5 border-b pb-2.5 text-[12px] font-bold uppercase tracking-wide ${t.header}`}>
        {Icon && <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function UploadField({ fileName, hasValue, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${hasValue ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
          <ImageIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-slate-800">
            {hasValue ? fileName || "File attached" : "Nothing attached yet"}
          </p>
          <p className="text-[11px] text-slate-400">{hasValue ? "Ready to submit" : "Required to continue"}</p>
        </div>
      </div>
      <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-[12px] font-semibold text-white hover:bg-slate-700">
        <Upload className="h-3.5 w-3.5" />
        {hasValue ? "Replace" : "Upload"}
        <input type="file" accept="image/*,.pdf" onChange={(e) => onChange(e.target.files?.[0])} className="hidden" />
      </label>
    </div>
  );
}

const REGISTRY_EVIDENCE_DOC_TYPE = "vv_registry_evidence";
const CUSTOMS_EVIDENCE_DOC_TYPE = "vv_customs_evidence";

const CUSTOMS_VERDICT_OPTIONS = [
  { value: "legitimate_complete", label: "Legitimate and complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "fraudulent", label: "Fraudulent" },
  { value: "cannot_verify", label: "Cannot verify" },
];
const REGISTRATION_VERDICT_OPTIONS = [
  { value: "clear", label: "Clear — no issues found" },
  { value: "flagged", label: "Flagged — see notes" },
  { value: "cannot_verify", label: "Cannot verify" },
];

// Vehicle Verification's agent flow is a single checklist submission (one
// overall verdict + evidence), not the DL biodata/capture-appointment shape
// the rest of this page is built around — kept as its own compact
// self-contained view rather than threading `isVehicleVerification`
// branches through every DL-specific section below.
function VehicleVerificationChecklist({ application, onSubmitted, onViewDoc }) {
  const detail = application.verification_detail || {};
  const isCustomsDuty = detail.check_type === "customs_duty";
  const evidenceDocType = isCustomsDuty ? CUSTOMS_EVIDENCE_DOC_TYPE : REGISTRY_EVIDENCE_DOC_TYPE;
  const existingEvidence = (application.documents || []).find((d) => d.doc_type === evidenceDocType);

  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState(existingEvidence?.file_url || null);
  const [isRegistered, setIsRegistered] = useState(null);
  const [reportedStolen, setReportedStolen] = useState(null);
  const [hasFines, setHasFines] = useState(null);
  const [fineDetails, setFineDetails] = useState("");
  const [verdict, setVerdict] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canEdit = application.status === "agent_accepted";

  const handleEvidenceUpload = async (file) => {
    if (!file) return;
    setUploadingEvidence(true);
    setError(null);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    if (uploadError || !data?.file_url) {
      setUploadingEvidence(false);
      setError(uploadError || "Upload failed. Please try again.");
      return;
    }
    const res = await addApplicationDocument(application.id, { doc_type: evidenceDocType, file_url: data.file_url });
    setUploadingEvidence(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEvidenceUrl(data.file_url);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!evidenceUrl) {
      setError("Upload your evidence before submitting.");
      return;
    }
    if (!verdict) {
      setError("Select an overall verdict before submitting.");
      return;
    }
    if (!isCustomsDuty && (isRegistered === null || reportedStolen === null || hasFines === null)) {
      setError("Answer all three registry questions before submitting.");
      return;
    }
    setSubmitting(true);
    const res = await submitVehicleVerificationChecklist(application.id, {
      is_registered: isCustomsDuty ? undefined : isRegistered,
      reported_stolen: isCustomsDuty ? undefined : reportedStolen,
      has_fines: isCustomsDuty ? undefined : hasFines,
      fine_details: !isCustomsDuty && hasFines ? fineDetails.trim() || undefined : undefined,
      verdict,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSubmitted();
  };

  const BoolToggle = ({ value, onChange, trueLabel = "Yes", falseLabel = "No" }) => (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)} className={`rounded-lg border-2 px-3 py-1.5 text-[12.5px] font-semibold transition-all ${value === true ? "border-red-400 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>{trueLabel}</button>
      <button type="button" onClick={() => onChange(false)} className={`rounded-lg border-2 px-3 py-1.5 text-[12.5px] font-semibold transition-all ${value === false ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>{falseLabel}</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-16">
      <Link href="/agent/applications" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> My applications
      </Link>

      <Section title="Vehicle Verification" icon={BadgeCheck}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Check type" value={detail.check_type?.replace(/_/g, " ")} capitalize />
          <Field label="Make / Model" value={`${detail.make || ""} ${detail.model || ""}`.trim()} />
          <Field label="Plate number" value={detail.plate_number} mono />
          <Field label="Year / Colour" value={[detail.year, detail.colour].filter(Boolean).join(" / ")} />
          <Field label="Reason" value={detail.reason?.replace(/_/g, " ")} capitalize />
          {detail.chassis_number && <Field label="Chassis / VIN" value={detail.chassis_number} mono />}
        </div>
        {isCustomsDuty && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {(application.documents || []).filter((d) => d.doc_type === "customs_duty_certificate").map((d, i) => (
              <button key={i} type="button" onClick={(e) => { e.preventDefault(); onViewDoc(resolveMediaUrl(d.file_url)); }} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold hover:underline" style={{ color: BRAND }}>
                View customer's duty certificate <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}
      </Section>

      {!canEdit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          {application.status === "agent_completed" ? "Checklist already submitted — awaiting staff confirmation." : `This job is at status "${application.status}" and can't be edited here.`}
        </div>
      )}

      <Section title="Evidence" icon={ImageIcon}>
        <p className="mb-3 text-[12.5px] text-slate-500">
          {isCustomsDuty ? "Attach a screenshot/photo of your customs records verification." : "Attach a screenshot/photo of your registry check."}
        </p>
        {evidenceUrl ? (
          <button type="button" onClick={() => onViewDoc(resolveMediaUrl(evidenceUrl))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600">
            <ImageIcon className="h-3.5 w-3.5" /> Evidence attached — view
          </button>
        ) : canEdit ? (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400">
            {uploadingEvidence ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingEvidence ? "Uploading…" : "Click to upload"}
            <input type="file" accept="image/*,application/pdf" disabled={uploadingEvidence} onChange={(e) => handleEvidenceUpload(e.target.files?.[0])} className="hidden" />
          </label>
        ) : (
          <p className="text-[12.5px] text-slate-400">No evidence attached.</p>
        )}
      </Section>

      {!isCustomsDuty && (
        <Section title="Registry check">
          <div className="space-y-3.5">
            <div>
              <p className={fieldLabel}>Is it registered?</p>
              <BoolToggle value={isRegistered} onChange={canEdit ? setIsRegistered : () => {}} />
            </div>
            <div>
              <p className={fieldLabel}>Reported stolen?</p>
              <BoolToggle value={reportedStolen} onChange={canEdit ? setReportedStolen : () => {}} />
            </div>
            <div>
              <p className={fieldLabel}>Outstanding fines?</p>
              <BoolToggle value={hasFines} onChange={canEdit ? setHasFines : () => {}} />
              {hasFines && (
                <textarea rows={2} value={fineDetails} onChange={(e) => setFineDetails(e.target.value)} placeholder="Fine details" disabled={!canEdit} className={`${inputBase} mt-2`} />
              )}
            </div>
          </div>
        </Section>
      )}

      <Section title="Overall verdict">
        <div className="space-y-2">
          {(isCustomsDuty ? CUSTOMS_VERDICT_OPTIONS : REGISTRATION_VERDICT_OPTIONS).map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!canEdit}
              onClick={() => setVerdict(opt.value)}
              className={`flex w-full items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all disabled:opacity-60 ${verdict === opt.value ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" disabled={!canEdit} className={`${inputBase} mt-3`} />
      </Section>

      {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}

      {canEdit && (
        <button type="button" onClick={handleSubmit} disabled={submitting} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Submitting…" : "Submit checklist"}
        </button>
      )}
    </div>
  );
}

export default function AgentApplicationDetailPage() {
  const params = useParams();
  const appId = params?.id ? Number(params.id) : null;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const [modalType, setModalType] = useState(null); // schedule | reassign | upload-proof | flag-issue

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [centreNameInput, setCentreNameInput] = useState("");
  const [scheduledAtInput, setScheduledAtInput] = useState("");
  const [scheduleNoteInput, setScheduleNoteInput] = useState("");
  const [reassignReasonInput, setReassignReasonInput] = useState("");
  const [proofUrlInput, setProofUrlInput] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [flagReasonInput, setFlagReasonInput] = useState("");
  const [licenceNumberInput, setLicenceNumberInput] = useState("");
  const [licenceExpiryInput, setLicenceExpiryInput] = useState("");

  const [markCapturedLoading, setMarkCapturedLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // tinted_permit progress evidence — interim "work is underway" uploads,
  // distinct from the terminal finished-permit proof (which still goes
  // through the existing upload-proof flow below).
  const progressEvidenceInputRef = useRef(null);
  const [uploadingProgressEvidence, setUploadingProgressEvidence] = useState(false);

  const handleCopy = (field, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const loadDetail = async (isRefresh = false) => {
    if (!appId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getApplication(appId);
    if (res.error) setError(res.error);
    else if (res.data) setApplication(res.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const loadChatThread = useCallback(() => getAgentSupportChat(appId), [appId]);
  const sendChatMessage = useCallback((body) => sendAgentSupportChatMessage(appId, { body }), [appId]);

  const openModal = (type) => {
    setActionError(null);
    setCentreNameInput("");
    setScheduledAtInput("");
    setScheduleNoteInput("");
    setReassignReasonInput("");
    setProofUrlInput("");
    setProofFileName("");
    setFlagReasonInput("");
    setLicenceNumberInput("");
    if (type === "issue-temp-licence") {
      setLicenceExpiryInput(defaultTemporaryLicenceExpiry());
    } else if (type === "upload-proof" && application?.application_type === "fresh") {
      setLicenceExpiryInput(guessPermanentLicenceExpiry(application?.validity_period));
    } else {
      setLicenceExpiryInput("");
    }
    setModalType(type);
  };

  const readFileAsDataUrl = (file, onDone) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onDone(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleConfirmAction = async () => {
    if (!application) return;
    setActionLoading(true);
    setActionError(null);

    let res = null;
    if (modalType === "schedule") {
      res = await scheduleCapturing(application.id, {
        scheduled_at: scheduledAtInput || undefined,
        centre_name: centreNameInput.trim() || undefined,
        note: scheduleNoteInput.trim() || undefined,
      });
    } else if (modalType === "reassign") {
      if (!centreNameInput.trim()) {
        setActionError("Please provide the new centre name.");
        setActionLoading(false);
        return;
      }
      res = await reassignCaptureCentre(application.id, {
        new_centre_name: centreNameInput.trim(),
        new_scheduled_at: scheduledAtInput || undefined,
        reason: reassignReasonInput.trim() || undefined,
      });
    } else if (modalType === "upload-proof") {
      if (!proofUrlInput.trim()) {
        setActionError("Attach proof of the finished card before continuing.");
        setActionLoading(false);
        return;
      }
      const isFresh = application.application_type === "fresh";
      const isTinted = application.application_type === "tinted_permit";
      const isRenewalOrReissueLocal = ["renewal", "reissue", "international_permit"].includes(application.application_type);
      const requiresCredentialFields = isFresh || isTinted || isRenewalOrReissueLocal;
      if (requiresCredentialFields && (!licenceNumberInput.trim() || !licenceExpiryInput)) {
        setActionError(isTinted ? "Permit number and expiry date are required for the finished document." : "Licence number and expiry date are required for the permanent card.");
        setActionLoading(false);
        return;
      }
      res = await uploadProof(application.id, {
        proof_url: proofUrlInput,
        licence_number: requiresCredentialFields ? licenceNumberInput.trim() : undefined,
        expiry_date: requiresCredentialFields ? licenceExpiryInput : undefined,
      });
    } else if (modalType === "issue-temp-licence") {
      if (!proofUrlInput.trim()) {
        setActionError("Attach the temporary licence card before continuing.");
        setActionLoading(false);
        return;
      }
      if (!licenceNumberInput.trim() || !licenceExpiryInput) {
        setActionError("Licence number and expiry date are required.");
        setActionLoading(false);
        return;
      }
      res = await uploadTemporaryLicence(application.id, {
        file_url: proofUrlInput,
        licence_number: licenceNumberInput.trim(),
        expiry_date: licenceExpiryInput,
      });
    } else if (modalType === "flag-issue") {
      if (!flagReasonInput.trim()) {
        setActionError("Describe the document issue — the customer will see this.");
        setActionLoading(false);
        return;
      }
      res = await flagDocumentIssue(application.id, { reason: flagReasonInput.trim() });
    }

    if (res?.error) {
      setActionError(res.error);
      setActionLoading(false);
      return;
    }
    setActionLoading(false);
    setModalType(null);
    setNotice({ type: "success", message: "Updated successfully." });
    await loadDetail(true);
  };

  const handleUploadProgressEvidence = async (file) => {
    if (!file || !application) return;
    setUploadingProgressEvidence(true);
    setNotice(null);
    const uploaded = await uploadApplicationFile(file);
    if (uploaded.error || !uploaded.data?.file_url) {
      setUploadingProgressEvidence(false);
      setNotice({ type: "error", message: uploaded.error || "Upload failed. Please try again." });
      return;
    }
    const progressDocType = application.application_type?.startsWith("number_plate_")
      ? "plate_production_in_progress"
      : "tinted_permit_progress_evidence";
    const res = await addApplicationDocument(application.id, {
      doc_type: progressDocType,
      file_url: uploaded.data.file_url,
    });
    setUploadingProgressEvidence(false);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
      return;
    }
    setNotice({ type: "success", message: "Progress evidence uploaded." });
    await loadDetail(true);
  };

  const handleMarkCaptured = async () => {
    if (!application) return;
    setMarkCapturedLoading(true);
    setNotice(null);
    const res = await markCapturingCompleted(application.id);
    setMarkCapturedLoading(false);
    if (res.error) setNotice({ type: "error", message: res.error });
    else {
      setNotice({ type: "success", message: "Marked as captured." });
      await loadDetail(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
        <p className="text-[13px] font-medium text-slate-500">Loading application…</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="mx-auto mt-10 max-w-md space-y-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <h3 className="text-[16px] font-bold text-slate-900">Application not found</h3>
        <p className="text-[13px] text-red-700">{error || "Could not retrieve this record."}</p>
        <Link href="/agent/applications" className={`${btnSecondary} mx-auto`}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to my applications
        </Link>
      </div>
    );
  }

  if (application.application_type?.startsWith("vehicle_verification_")) {
    return (
      <>
        <DocumentPreviewModal isOpen={!!previewDocUrl} onClose={() => setPreviewDocUrl(null)} fileUrl={previewDocUrl} />
        <VehicleVerificationChecklist
          application={application}
          onViewDoc={setPreviewDocUrl}
          onSubmitted={async () => {
            setNotice({ type: "success", message: "Checklist submitted — awaiting staff confirmation." });
            await loadDetail(true);
          }}
        />
      </>
    );
  }

  const applicant = application.applicant_details || {};
  const isRenewalOrReissue = ["renewal", "reissue", "international_permit"].includes(application.application_type);
  // Biometric capture is a fresh-only concept — renewal/reissue's state
  // machine has no capture_scheduled/captured leg at all (confirmed against
  // RENEWAL_REISSUE_TRANSITIONS: agent_accepted has no legal transition to
  // any capture-related status), so these three actions never apply to them.
  const canSchedule = !isRenewalOrReissue && application.status === "agent_accepted";
  const canReassign = !isRenewalOrReissue && ["capture_scheduled", "capturing_scheduled"].includes(application.status);
  const canMarkCaptured = !isRenewalOrReissue && ["capture_scheduled", "capturing_scheduled", "agent_accepted"].includes(application.status);
  const isFreshApp = application.application_type === "fresh";
  // Optional step for fresh apps only: issue the interim temp licence any
  // time right after capture. Skippable — the permanent-card upload stays
  // reachable below regardless of whether this happens.
  const canIssueTempLicence = isFreshApp && ["captured", "capturing_completed"].includes(application.status);
  // Fresh must go through capture first (the temp-licence detour is
  // optional, so this stays reachable through its pending/issued states
  // too); renewal/reissue can go straight from acceptance (or after a
  // customer correction) to proof upload — no capture step.
  const isTintedPermit = application.application_type === "tinted_permit";
  const isNumberPlate = Boolean(application.application_type?.startsWith("number_plate_"));
  // tinted_permit and number_plate_* have no biometric-capture leg at all —
  // proof (interim progress evidence, then the finished document/plate) is
  // reachable straight from acceptance, same shape as renewal/reissue.
  const canUploadProof = ["captured", "capturing_completed"].includes(application.status)
    || (isFreshApp && ["temp_licence_pending_review", "temp_licence_issued"].includes(application.status))
    || (isRenewalOrReissue && ["agent_accepted", "agent_assigned"].includes(application.status))
    || ((isTintedPermit || isNumberPlate) && ["agent_accepted", "agent_assigned"].includes(application.status));
  const canFlagIssue = (isRenewalOrReissue || isTintedPermit || isNumberPlate) && ["agent_accepted", "agent_assigned"].includes(application.status);
  const canUploadProgressEvidence = (isTintedPermit || isNumberPlate) && ["agent_accepted", "agent_assigned"].includes(application.status);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <DocumentPreviewModal 
        isOpen={!!previewDocUrl} 
        onClose={() => setPreviewDocUrl(null)} 
        fileUrl={previewDocUrl} 
      />
      {/* Header */}
      <div>
        <Link href="/agent/applications" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-3.5 w-3.5" />
          My applications
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {application.passport_photo ? (
              <img
                src={resolveMediaUrl(application.passport_photo)}
                alt="Passport photo"
                className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300">
                <ImageIcon className="h-4.5 w-4.5" />
              </div>
            )}
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
              {application.first_name} {application.last_name} <span className="font-mono text-slate-400">#{application.id}</span>
            </h1>
            <StatusBadge status={application.status} appType={application.application_type} />
            <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
              {(application.application_type || "fresh").replace(/_/g, " ")}
            </span>
            {isNumberPlate && application.is_fancy_plate && application.fancy_plate_number && (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                Fancy plate: {application.fancy_plate_number}
              </span>
            )}
          </div>
          <button onClick={() => loadDetail(true)} className={btnSecondary} style={{ padding: "0.55rem 0.9rem" }}>
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {application.state_of_residence || "—"} · {application.lga || "—"}
        </p>
      </div>

      {notice && (
        <div className={`flex items-center gap-2.5 rounded-xl p-3.5 text-[13px] ${notice.type === "error" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 font-medium"}`}>
          {notice.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      {/* Capture info */}
      {(application.capture_centre_name || canReassign) && (
        <Section title="Capture appointment" icon={Building2} iconColor="#4f46e5" tone="indigo">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-slate-700">
            <span>Centre: <strong>{application.capture_centre_name || "Not yet set"}</strong></span>
            {application.capture_scheduled_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {new Date(application.capture_scheduled_at).toLocaleString("en-NG")}
              </span>
            )}
          </div>
        </Section>
      )}

      {/* Actions panel */}
      <Section title="Actions">
        <div className="flex flex-wrap gap-2.5">
          {canSchedule && (
            <ActionButton variant="primary" icon={Fingerprint} onClick={() => openModal("schedule")}>
              Schedule capture
            </ActionButton>
          )}
          {canReassign && (
            <ActionButton variant="info" icon={Building2} onClick={() => openModal("reassign")}>
              Reassign centre
            </ActionButton>
          )}
          {canMarkCaptured && (
            <ActionButton variant="success" icon={CheckCircle2} loading={markCapturedLoading} disabled={markCapturedLoading} onClick={handleMarkCaptured}>
              Mark captured
            </ActionButton>
          )}
          {canIssueTempLicence && (
            <ActionButton variant="info" icon={FileText} onClick={() => openModal("issue-temp-licence")}>
              Issue temporary licence
            </ActionButton>
          )}
          {canUploadProgressEvidence && (
            <>
              <input
                type="file"
                ref={progressEvidenceInputRef}
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => { handleUploadProgressEvidence(e.target.files?.[0]); e.target.value = ""; }}
              />
              <ActionButton
                variant="info"
                icon={Upload}
                loading={uploadingProgressEvidence}
                disabled={uploadingProgressEvidence}
                onClick={() => progressEvidenceInputRef.current?.click()}
              >
                Upload evidence work is underway
              </ActionButton>
            </>
          )}
          {canUploadProof && (
            <ActionButton variant="accent" icon={Upload} onClick={() => openModal("upload-proof")}>
              {isFreshApp ? "Upload permanent licence" : isTintedPermit ? "Upload the finished permit" : isNumberPlate ? "Upload the finished plate" : (application.application_type === "international_permit" ? "Upload International Permit Document" : "Upload proof")}
            </ActionButton>
          )}
          {canFlagIssue && (
            <ActionButton variant="danger" icon={AlertTriangle} onClick={() => openModal("flag-issue")}>
              Flag document issue
            </ActionButton>
          )}
          {!canSchedule && !canReassign && !canMarkCaptured && !canIssueTempLicence && !canUploadProof && !canFlagIssue && (
            <p className="text-[13px] text-slate-400">No agent actions available for this application's current status ({statusMeta(application.status).label.toLowerCase()}).</p>
          )}
        </div>
      </Section>

      {/* Contact — the most actionable info for an agent, up front */}
      <Section title="Applicant contact" icon={UserIcon} iconColor="#059669" tone="emerald">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Full name</span>
            <span className="mt-0.5 block text-[15px] font-bold text-slate-900">{applicant.account_name || `${application.first_name || ""} ${application.last_name || ""}`.trim() || "—"}</span>
          </div>
          {applicant.phone && applicant.phone !== "N/A" && (
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</span>
              <div className="mt-0.5 flex items-center gap-2">
                <a href={`tel:${applicant.phone}`} className="flex items-center gap-1.5 font-mono text-[14px] font-semibold text-slate-900 hover:underline">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  {applicant.phone}
                </a>
                <button onClick={() => handleCopy("phone", applicant.phone)} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600" title="Copy phone number">
                  {copiedField === "phone" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
          {applicant.email && applicant.email !== "N/A" && (
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Email</span>
              <div className="mt-0.5 flex items-center gap-2">
                <a href={`mailto:${applicant.email}`} className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-900 hover:underline">
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  {applicant.email}
                </a>
                <button onClick={() => handleCopy("email", applicant.email)} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600" title="Copy email">
                  {copiedField === "email" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Personal & origin */}
      <Section title="Personal & origin" icon={BadgeCheck}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Date of birth" value={applicant.date_of_birth || application.date_of_birth} mono />
          <Field label="Gender" value={applicant.gender} capitalize />
          <Field label="Nationality" value={applicant.nationality} />
          <Field label="Marital status" value={applicant.marital_status} capitalize />
          <Field label="Mother's maiden name" value={applicant.mothers_maiden_name} />
          <Field label="NIN" value={applicant.nin} mono />
          <Field label="State / LGA of origin" value={[applicant.state_of_origin, applicant.lga_of_origin].filter(Boolean).join(" / ")} />
          <Field label="State / LGA of residence" value={[applicant.state_of_residence || application.state_of_residence, applicant.lga || application.lga].filter(Boolean).join(" / ")} />
          <div className="col-span-2 sm:col-span-3">
            <Field label="Residential address" value={applicant.residential_address} />
          </div>
        </div>
      </Section>

      {/* Medical */}
      <Section title="Medical" icon={HeartPulse} iconColor="#ef4444">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Blood group" value={applicant.blood_group} valueClassName="text-red-600" />
          <Field label="Height" value={applicant.height_cm ? `${applicant.height_cm} cm` : null} />
          <Field label="Vision acuity" value={application.vision_acuity_test} fallback="Not recorded" />
          <Field label="Facial mark" value={applicant.has_facial_mark ? (applicant.facial_mark_description || "Yes") : "None"} />
          <Field label="Disability" value={applicant.has_disability ? (applicant.disability_description || "Yes") : "None"} />
        </div>
      </Section>

      {/* Licence details */}
      <Section title="Licence details" icon={Globe2}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Licence class" value={application.licence_class} />
          <Field label="Validity period" value={application.validity_period} />
          <Field label="Driving school cert." value={application.driving_school_certificate_number} mono />
        </div>
      </Section>

      {/* Licence issuance — temp & permanent card tracking */}
      {(application.temporary_licence || application.permanent_licence) && (
        <Section title="Licence issuance" icon={BadgeCheck}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LicenceCard title="Temporary licence" licence={application.temporary_licence} onViewDoc={setPreviewDocUrl} />
            <LicenceCard title="Permanent licence" licence={application.permanent_licence} onViewDoc={setPreviewDocUrl} />
          </div>
        </Section>
      )}

      {/* Next of kin */}
      <Section title="Next of kin">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Name" value={applicant.next_of_kin_name || application.next_of_kin_name} />
          <Field label="Relationship" value={applicant.next_of_kin_relationship || application.next_of_kin_relationship} />
          <Field label="Phone" value={applicant.next_of_kin_phone || application.next_of_kin_phone} mono />
        </div>
      </Section>

      {/* Documents */}
      <Section title={`Documents (${(application.documents?.length || 0) + (application.passport_photo ? 1 : 0)})`} icon={FileText}>
        {(!application.documents || application.documents.length === 0) && !application.passport_photo ? (
          <p className="text-[13px] text-slate-400">Nothing uploaded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {application.passport_photo && (
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <p className="text-[13.5px] font-semibold capitalize text-slate-900">Passport Photograph</p>
                </div>
                <button onClick={(e) => { e.preventDefault(); setPreviewDocUrl(resolveMediaUrl(application.passport_photo)); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold hover:underline" style={{ color: BRAND }}>
                  View <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {application.documents?.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <p className="text-[13.5px] font-semibold capitalize text-slate-900">{doc.doc_type?.replace(/_/g, " ")}</p>
                </div>
                {doc.file_url && (
                  <button onClick={(e) => { e.preventDefault(); setPreviewDocUrl(resolveMediaUrl(doc.file_url)); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold hover:underline" style={{ color: BRAND }}>
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Support chat — no attachments, contact-info blocked both ways */}
      <AgentChatPanel
        myRole="agent"
        headerLabel="Chat with Support"
        loadThread={loadChatThread}
        sendMessage={sendChatMessage}
      />

      {/* Action modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-[16px] font-bold text-slate-900">
                {modalType === "schedule" && "Schedule biometric capture"}
                {modalType === "reassign" && "Reassign capture centre"}
                {modalType === "issue-temp-licence" && "Issue temporary licence"}
                {modalType === "upload-proof" && (isFreshApp ? "Upload permanent licence" : isTintedPermit ? "Upload the finished permit" : isNumberPlate ? "Upload the finished plate" : (application.application_type === "international_permit" ? "Upload International Permit Document" : "Upload proof of finished card"))}
                {modalType === "flag-issue" && "Flag document issue"}
              </h3>
              <button onClick={() => setModalType(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {actionError}
              </div>
            )}

            {modalType === "schedule" && (
              <div className="space-y-3.5">
                <div>
                  <label className={fieldLabel}>Capture centre</label>
                  <input value={centreNameInput} onChange={(e) => setCentreNameInput(e.target.value)} placeholder="Defaults to your VIO office if left blank" className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Date & time</label>
                  <input type="datetime-local" value={scheduledAtInput} onChange={(e) => setScheduledAtInput(e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Note (optional)</label>
                  <textarea rows={2} value={scheduleNoteInput} onChange={(e) => setScheduleNoteInput(e.target.value)} placeholder="e.g. Bring original ID and payment receipt." className={inputBase} />
                </div>
              </div>
            )}

            {modalType === "reassign" && (
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3.5 text-[12.5px] text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>Use this if the originally scheduled centre becomes unavailable. The customer is notified automatically.</span>
                </div>
                <div>
                  <label className={fieldLabel}>New centre name *</label>
                  <input value={centreNameInput} onChange={(e) => setCentreNameInput(e.target.value)} placeholder="e.g. Alausa Backup Centre" className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>New date & time (optional)</label>
                  <input type="datetime-local" value={scheduledAtInput} onChange={(e) => setScheduledAtInput(e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Reason (optional)</label>
                  <textarea rows={2} value={reassignReasonInput} onChange={(e) => setReassignReasonInput(e.target.value)} placeholder="e.g. Original centre offline for maintenance." className={inputBase} />
                </div>
              </div>
            )}

            {modalType === "issue-temp-licence" && (
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3.5 text-[12.5px] text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    Optional interim card while the permanent licence is produced. Staff must
                    approve this before the customer can see it.
                  </span>
                </div>
                <div>
                  <label className={fieldLabel}>Temporary licence card</label>
                  <UploadField
                    fileName={proofFileName}
                    hasValue={!!proofUrlInput}
                    onChange={(file) => {
                      setProofFileName(file?.name || "");
                      readFileAsDataUrl(file, setProofUrlInput);
                    }}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Licence number *</label>
                  <input value={licenceNumberInput} onChange={(e) => setLicenceNumberInput(e.target.value)} placeholder="e.g. LAG-TMP-00123456" className={inputBase} />
                </div>
                <div>
                  <label className={fieldLabel}>Expiry date *</label>
                  <input type="date" value={licenceExpiryInput} onChange={(e) => setLicenceExpiryInput(e.target.value)} className={inputBase} />
                  <p className="mt-1 text-[11px] text-slate-400">Defaults to 30 days from today — adjust if needed.</p>
                </div>
              </div>
            )}

            {modalType === "upload-proof" && (
              <div className="space-y-3.5">
                <div>
                  <label className={fieldLabel}>{isFreshApp ? "Permanent licence card" : isTintedPermit ? "Finished permit document" : isNumberPlate ? "Finished plate photo" : (application.application_type === "international_permit" ? "International Permit Document" : "Finished card proof")}</label>
                  <UploadField
                    fileName={proofFileName}
                    hasValue={!!proofUrlInput}
                    onChange={(file) => {
                      setProofFileName(file?.name || "");
                      readFileAsDataUrl(file, setProofUrlInput);
                    }}
                  />
                </div>
                {(isFreshApp || isTintedPermit || isRenewalOrReissue) && (
                  <>
                    <div>
                      <label className={fieldLabel}>{isTintedPermit ? "Permit number *" : "Licence number *"}</label>
                      <input value={licenceNumberInput} onChange={(e) => setLicenceNumberInput(e.target.value)} placeholder={isTintedPermit ? "e.g. TP-000123" : "e.g. LAG-00123456"} className={inputBase} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Expiry date *</label>
                      <input type="date" value={licenceExpiryInput} onChange={(e) => setLicenceExpiryInput(e.target.value)} className={inputBase} />
                    </div>
                  </>
                )}
              </div>
            )}

            {modalType === "flag-issue" && (
              <div>
                <label className={fieldLabel}>Reason (required — the customer will see this)</label>
                <textarea rows={3} value={flagReasonInput} onChange={(e) => setFlagReasonInput(e.target.value)} placeholder="e.g. Old licence photo doesn't match applicant." className={inputBase} />
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button onClick={() => setModalType(null)} disabled={actionLoading} className={btnSecondary}>
                Cancel
              </button>
              <button onClick={handleConfirmAction} disabled={actionLoading} className={btnPrimary} style={{ background: BRAND }}>
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {actionLoading ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
