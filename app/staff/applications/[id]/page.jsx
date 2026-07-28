"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ExternalLink,
  ArrowLeft,
  Building,
  X,
  Loader2,
  RefreshCw,
  Send,
  Eye,
  Upload,
  Image as ImageIcon,
  MapPin,
  Info,
  UserCheck,
} from "lucide-react";
import {
  getStaffApplication,
  staffApproveApplication,
  staffRejectApplication,
  staffEnrollDrivingSchool,
  staffUploadDrivingSchoolCertificate,
  staffConfirmDrivingSchoolCertificate,
  staffReviewTemporaryLicence,
  staffRouteApplication,
  staffFinalReview,
  staffPushToCustomer,
  staffReadyForPickup,
  staffReviewDocument,
  staffClaimApplication,
  getCachedUser,
  koboToNaira,
  resolveMediaUrl,
  downloadStaffBiodataPdf,
} from "@/lib/api";

const BRAND = "#28A745";

const STAFF_STATUS = {
  submitted: { label: "Awaiting review", tone: "info" },
  staff_review: { label: "Under verification", tone: "warning" },
  driving_school_enrolled: { label: "In driving school", tone: "purple" },
  driving_school_certificate_ready: { label: "School complete", tone: "teal" },
  routed: { label: "Routed to agent", tone: "success" },
  agent_assigned: { label: "Agent assigned", tone: "success" },
  agent_accepted: { label: "Agent en route", tone: "success" },
  capture_scheduled: { label: "Capture scheduled", tone: "success" },
  capturing_scheduled: { label: "Capture scheduled", tone: "success" },
  captured: { label: "Biometrics captured", tone: "teal" },
  capturing_completed: { label: "Biometrics captured", tone: "teal" },
  temp_licence_pending_review: { label: "Temp licence — needs review", tone: "warning" },
  temp_licence_issued: { label: "Temp licence issued", tone: "purple" },
  agent_completed: { label: "Awaiting final review", tone: "warning" },
  staff_final_review: { label: "In final review", tone: "warning" },
  ready_for_pickup: { label: "Ready for pickup", tone: "indigo" },
  awaiting_customer: { label: "Awaiting customer confirmation", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  staff_rejected: { label: "Rejected", tone: "danger" },
  needs_correction: { label: "Needs correction", tone: "warning" },
  expired: { label: "Licence expired", tone: "danger" },
};

const TONE_CLASSES = {
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};
const TONE_DOT = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  success: "bg-emerald-500",
  purple: "bg-violet-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
  neutral: "bg-slate-400",
};

function statusMeta(status) {
  return STAFF_STATUS[status] || { label: (status || "Unknown").replace(/_/g, " "), tone: "neutral" };
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${TONE_CLASSES[meta.tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} />
      {meta.label}
    </span>
  );
}

function toDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors";
const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700 hover:bg-red-100 transition-colors";
const fieldLabel = "block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
const inputBase =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";

export default function StaffApplicationDetailsPage() {
  const params = useParams();
  const appId = params?.id ? Number(params.id) : null;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const currentUser = getCachedUser();

  const [modalType, setModalType] = useState(null); // approve | reject | enroll | upload-cert | route | final-review | push-to-customer | notice
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState(null);

  const [noteInput, setNoteInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [verifImageInput, setVerifImageInput] = useState("");
  const [verifFileName, setVerifFileName] = useState("");
  const [certUrlInput, setCertUrlInput] = useState("");
  const [certFileName, setCertFileName] = useState("");
  const [trackingNoteInput, setTrackingNoteInput] = useState("");
  const [dispatchedByInput, setDispatchedByInput] = useState("");
  const [decisionInput, setDecisionInput] = useState("approved"); // used by review-temp-licence & final-review

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  const loadDetail = async (isRefresh = false) => {
    if (!appId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getStaffApplication(appId);
    if (res.error) setError(res.error);
    else if (res.data) setApplication(res.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

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

  const openModal = (type) => {
    setActionError(null);
    setNoteInput("");
    setReasonInput("");
    setVerifImageInput("");
    setVerifFileName("");
    setCertUrlInput("");
    setCertFileName("");
    setTrackingNoteInput("");
    setDispatchedByInput("");
    setDecisionInput("approved");
    setModalType(type);
  };

  const handleConfirmAction = async () => {
    if (!application) return;
    setActionLoading(true);
    setActionError(null);

    let res = null;
    if (modalType === "approve") {
      res = await staffApproveApplication(application.id, { note: noteInput.trim() });
    } else if (modalType === "reject") {
      if (!reasonInput.trim()) {
        setActionError("A rejection reason is required — it will be shown to the applicant.");
        setActionLoading(false);
        return;
      }
      res = await staffRejectApplication(application.id, { reason: reasonInput.trim() });
    } else if (modalType === "enroll") {
      if (!verifImageInput.trim()) {
        setActionError("Attach the driving school verification slip before enrolling.");
        setActionLoading(false);
        return;
      }
      res = await staffEnrollDrivingSchool(application.id, {
        verification_image_url: verifImageInput,
        screenshot_url: verifImageInput,
        file_url: verifImageInput,
      });
    } else if (modalType === "upload-cert") {
      if (!certUrlInput.trim()) {
        setActionError("Attach the graduation certificate before continuing.");
        setActionLoading(false);
        return;
      }
      res = await staffUploadDrivingSchoolCertificate(application.id, {
        certificate_url: certUrlInput,
        screenshot_url: certUrlInput,
        file_url: certUrlInput,
      });
    } else if (modalType === "confirm-cert") {
      res = await staffConfirmDrivingSchoolCertificate(application.id);
    } else if (modalType === "review-temp-licence") {
      if (decisionInput === "rejected" && !noteInput.trim()) {
        setActionError("A note is required when rejecting the temporary licence.");
        setActionLoading(false);
        return;
      }
      res = await staffReviewTemporaryLicence(application.id, { decision: decisionInput, note: noteInput.trim() || undefined });
    } else if (modalType === "route") {
      res = await staffRouteApplication(application.id);
    } else if (modalType === "final-review") {
      if (decisionInput === "rejected" && !noteInput.trim()) {
        setActionError("A note is required when rejecting final review.");
        setActionLoading(false);
        return;
      }
      res = await staffFinalReview(application.id, { note: noteInput.trim(), decision: decisionInput });
    } else if (modalType === "push-to-customer") {
      res = await staffPushToCustomer(application.id, {
        dispatched_by: dispatchedByInput.trim(),
        tracking_note: trackingNoteInput.trim(),
      });
    } else if (modalType === "ready-for-pickup") {
      res = await staffReadyForPickup(application.id);
    }

    if (res?.error) {
      setActionError(res.error);
      setActionLoading(false);
      return;
    }
    setActionLoading(false);
    setModalType("notice");
    setNoticeMessage(`Application #${application.id} has been updated.`);
    await loadDetail(true);
  };

  const readFileAsDataUrl = (file, onDone) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onDone(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const [reviewingDocId, setReviewingDocId] = useState(null);
  const handleReviewDocument = async (docId, decision) => {
    setReviewingDocId(docId);
    const res = await staffReviewDocument(docId, { decision, note: decision === "rejected" ? "Flagged during document review." : undefined });
    setReviewingDocId(null);
    if (!res.error) await loadDetail(true);
  };

  const handleClaim = async () => {
    if (!application) return;
    setClaiming(true);
    setClaimError(null);
    const res = await staffClaimApplication(application.id);
    setClaiming(false);
    if (res.error) setClaimError(res.error);
    else await loadDetail(true);
  };

  const handleDownloadBiodataPdf = async () => {
    if (!application) return;
    setDownloadingPdf(true);
    setClaimError(null);
    try {
      await downloadStaffBiodataPdf(application.id);
    } catch (err) {
      setClaimError(err?.message || "Could not generate the biodata PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
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
        <Link href="/staff/applications" className={`${btnSecondary} mx-auto`}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to review queue
        </Link>
      </div>
    );
  }

  // Backend only ever emits "unpaid" | "pending" | "success" | "failed" for
  // payment_status — "paid" is never produced, so only "success" is checked.
  const isPaid = application.payment_status === "success" || application.payment_options?.payment_status === "success";
  const hasDrivingSchoolCertificate = application.documents?.some((d) => d.doc_type === "driving_school_certificate");
  const skipPathCertOnFile = hasDrivingSchoolCertificate && !application.driving_school_enrolled_at;
  const verifSlipUrl =
    application.driving_school?.verification_image_url ||
    application.documents?.find((d) => d.doc_type === "driving_school_verification_slip" || d.doc_type === "driving_school_enrollment_screenshot" || d.doc_type === "driving_school_screenshot")?.file_url;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-4">
          {application.passport_photo ? (
            <img
              src={resolveMediaUrl(application.passport_photo)}
              alt="Passport photo"
              className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <div>
            <Link
              href="/staff/applications"
              className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Review Queue
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
                {application.first_name} {application.last_name}
              </h1>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                #{application.id}
              </span>
              <StatusBadge status={application.status} />
              {application.assigned_staff ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#28A745]/30 bg-[#E9F7EC] px-2.5 py-1 text-[11.5px] font-semibold text-[#166B2C]">
                  <UserCheck className="h-3 w-3" />
                  {application.assigned_staff.user_id === currentUser?.id ? "Claimed by you" : application.assigned_staff.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700">
                  Unclaimed
                </span>
              )}
            </div>
            {claimError && (
              <p className="mt-2 max-w-lg text-[12.5px] font-medium text-red-600">{claimError}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleDownloadBiodataPdf} disabled={downloadingPdf} className={btnSecondary}>
            {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {downloadingPdf ? "Preparing PDF…" : "Download Biodata PDF"}
          </button>
          <button onClick={() => loadDetail(true)} className={btnSecondary}>
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>

          {!application.assigned_staff && (
            <button onClick={handleClaim} disabled={claiming} className={btnPrimary} style={{ background: BRAND }}>
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {claiming ? "Accepting…" : "Accept this application"}
            </button>
          )}

          {/* Sticky Actions based on status — only available once claimed */}
          {application.assigned_staff && application.status === "submitted" && (
            <>
              <button onClick={() => openModal("reject")} className={btnDanger}>
                <X className="h-4 w-4" /> Reject
              </button>
              <button 
                onClick={() => openModal("approve")} 
                disabled={!isPaid}
                className={btnPrimary} 
                style={{ background: isPaid ? BRAND : undefined }}
              >
                <CheckCircle2 className="h-4 w-4" /> {isPaid ? "Approve & verify" : "Awaiting payment"}
              </button>
            </>
          )}

          {application.assigned_staff && application.status === "staff_review" && (
            <>
              <button onClick={() => openModal("reject")} className={btnDanger}>
                <X className="h-4 w-4" /> Reject
              </button>
              {hasDrivingSchoolCertificate ? (
                <button onClick={() => openModal("confirm-cert")} disabled={!isPaid} className={btnPrimary} style={{ background: isPaid ? "#0d9488" : undefined }}>
                  <CheckCircle2 className="h-4 w-4" /> {isPaid ? "Certificate on file — verify & route" : "Awaiting payment"}
                </button>
              ) : (
                <button onClick={() => openModal("enroll")} disabled={!isPaid} className={btnPrimary} style={{ background: isPaid ? "#7c3aed" : undefined }}>
                  <Building className="h-4 w-4" /> {isPaid ? "Enroll in driving school" : "Awaiting payment"}
                </button>
              )}
            </>
          )}

          {application.assigned_staff && application.status === "driving_school_enrolled" && (
            <button onClick={() => openModal("upload-cert")} className={btnPrimary} style={{ background: "#0d9488" }}>
              <Upload className="h-4 w-4" /> Upload certificate
            </button>
          )}

          {application.assigned_staff && application.status === "driving_school_certificate_ready" && (
            <button onClick={() => openModal("route")} className={btnPrimary} style={{ background: BRAND }}>
              <Send className="h-4 w-4" /> Route to {application.lga || "agent"}
            </button>
          )}

          {application.assigned_staff && application.status === "temp_licence_pending_review" && (
            <button onClick={() => openModal("review-temp-licence")} className={btnPrimary} style={{ background: "#4338ca" }}>
              <ShieldCheck className="h-4 w-4" /> Review temporary licence
            </button>
          )}

          {application.assigned_staff && application.status === "agent_completed" && (
            <button onClick={() => openModal("final-review")} className={btnPrimary} style={{ background: "#7c3aed" }}>
              <ShieldCheck className="h-4 w-4" /> Final review
            </button>
          )}

          {application.assigned_staff && ["captured", "capturing_completed", "agent_completed"].includes(application.status) && (
            <button onClick={() => openModal("ready-for-pickup")} className={btnPrimary} style={{ background: "#4f46e5" }}>
              <Send className="h-4 w-4" /> Ready for pickup
            </button>
          )}

          {application.assigned_staff && application.status === "awaiting_customer" && (
            <button onClick={() => openModal("push-to-customer")} className={btnPrimary} style={{ background: BRAND }}>
              <Send className="h-4 w-4" /> Record dispatch
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Sticky Sidebar Navigation */}
        <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-24">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 text-[13.5px] font-semibold text-slate-600">
             <a href="#overview" className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">Overview</a>
             <a href="#personal" className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">Personal & Origin</a>
             <a href="#medical" className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">Medical Info</a>
             <a href="#licence" className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">Licence Details</a>
             <a href="#licence-issuance" className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">Licence Issuance</a>
             <a href="#documents" className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">Documents</a>
             <a href="#processing" className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">Processing</a>
          </nav>
        </aside>

        {/* Scrollable Main Content */}
        <div className="flex-1 min-w-0 space-y-10">
          
          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Application Type</span>
                <span className="mt-1 block text-[13.5px] font-bold text-slate-900 capitalize">{application.application_type || "fresh"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Service Fee</span>
                <span className="mt-1 flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: BRAND }}>
                  {application.payment_options ? koboToNaira(application.payment_options.amount_kobo) : "₦30,000.00"}
                  {isPaid && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Created At</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-700">
                  {new Date(application.created_at).toLocaleDateString()}
                </span>
              </div>
              {!isPaid && application.payment_options && (
                <>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Amount Paid</span>
                    <span className="mt-1 block text-[13.5px] font-bold text-slate-700">
                      {koboToNaira(application.payment_options.amount_paid_kobo || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Balance Owed</span>
                    <span className="mt-1 block text-[13.5px] font-bold text-red-600">
                      {koboToNaira(application.payment_options.remaining_kobo || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Payment Due</span>
                    <span className={`mt-1 flex items-center gap-1.5 text-[13.5px] font-bold ${application.payment_options.is_overdue ? "text-red-600" : "text-slate-700"}`}>
                      {application.payment_options.is_overdue && <AlertCircle className="h-3.5 w-3.5" />}
                      {application.payment_options.payment_due_date
                        ? new Date(application.payment_options.payment_due_date).toLocaleDateString()
                        : "—"}
                      {application.payment_options.is_overdue && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10.5px] font-bold text-red-700">Overdue</span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Personal & Origin */}
          <section id="personal" className="scroll-mt-24">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Personal & Origin</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Full Name</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.first_name} {application.middle_name} {application.last_name}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">DOB</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.date_of_birth || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sex / Gender</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900 capitalize">{application.gender || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">State / LGA of Origin</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.state_of_origin || "—"} / {application.lga_of_origin || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nationality</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.nationality || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Marital Status</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900 capitalize">{application.marital_status || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mother's Maiden Name</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.mothers_maiden_name || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Residential Address</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.residential_address || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">NIN</span>
                <span className="mt-1 block font-mono text-[13.5px] font-semibold text-slate-900">{application.nin || "—"}</span>
              </div>
            </div>
          </section>

          {/* Medical */}
          <section id="medical" className="scroll-mt-24">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Medical</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Blood Group</span>
                <span className="mt-1 block text-[13.5px] font-bold text-red-600">{application.blood_group || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Height</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.height_cm ? `${application.height_cm} cm` : "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Vision Acuity</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.vision_acuity_test || "Pending"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Facial Mark</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">
                  {application.has_facial_mark ? (application.facial_mark_description || "Yes") : "None"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Disability</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">
                  {application.has_disability ? (application.disability_description || "Yes") : "None"}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-3">Next of Kin</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</span>
                  <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.next_of_kin_name || "—"}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Relationship</span>
                  <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.next_of_kin_relationship || "—"}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</span>
                  <span className="mt-1 block font-mono text-[13.5px] font-semibold text-slate-900">{application.next_of_kin_phone || "—"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Licence Details */}
          <section id="licence" className="scroll-mt-24">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Licence Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Licence Class</span>
                <span className="mt-1 block text-[13.5px] font-bold text-slate-900">{application.licence_class || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Validity Period</span>
                <span className="mt-1 block text-[13.5px] font-semibold text-slate-900">{application.validity_period || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Driving School Cert</span>
                <span className="mt-1 block font-mono text-[13.5px] font-semibold text-slate-900">{application.driving_school_certificate_number || "—"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Processing State / LGA</span>
                <span className="mt-1 flex items-center gap-1 text-[13.5px] font-semibold text-slate-900">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {application.state_of_residence || "—"} / {application.lga || "—"}
                </span>
              </div>
            </div>
          </section>

          {/* Licence issuance — temp & permanent card tracking, fresh applications only */}
          {(application.temporary_licence || application.permanent_licence) && (
            <section id="licence-issuance" className="scroll-mt-24">
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Licence Issuance</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StaffLicenceCard title="Temporary licence" licence={application.temporary_licence} />
                <StaffLicenceCard title="Permanent licence" licence={application.permanent_licence} />
              </div>
            </section>
          )}

          {/* Documents */}
          <section id="documents" className="scroll-mt-24">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Documents ({application.documents?.length || 0})</h2>
            {!application.documents || application.documents.length === 0 ? (
              <p className="py-3 text-[13px] text-slate-400">Nothing uploaded on this file yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-2">
                {application.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-bold capitalize text-slate-900">
                          {doc.doc_type?.replace(/_/g, " ")}
                        </p>
                        <p className="text-[11.5px] text-slate-400">
                          {doc.uploaded_at && new Date(doc.uploaded_at).toLocaleString()}
                          {doc.status && doc.status !== "pending" && (
                            <span className={`ml-2 font-semibold ${doc.status === "approved" ? "text-emerald-600" : "text-red-500"}`}>
                              · {doc.status}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {doc.file_url && (
                        <a href={resolveMediaUrl(doc.file_url)} target="_blank" rel="noopener noreferrer" className={btnGhostLink}>
                          Preview <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleReviewDocument(doc.id, "approved")}
                        disabled={reviewingDocId === doc.id}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
                        title="Approve document"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReviewDocument(doc.id, "rejected")}
                        disabled={reviewingDocId === doc.id}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Reject document"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Processing Status */}
          <section id="processing" className="scroll-mt-24">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Processing Status</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="h-4 w-4 text-violet-600" />
                <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Driving school enrollment</h3>
              </div>
              
              {application.status === "submitted" && (
                <p className="text-[13.5px] leading-relaxed text-slate-600">
                  Verify the applicant's NIN and biodata against the national database before enrolling them in a driving school. Use the <strong>Approve</strong> button at the top to proceed.
                </p>
              )}

              {application.status === "staff_review" && !hasDrivingSchoolCertificate && (
                <p className="text-[13.5px] leading-relaxed text-slate-600">
                  Applicant is verified. Enroll them in an accredited driving school using the <strong>Enroll</strong> button at the top to attach the verification slip and start their countdown.
                </p>
              )}

              {application.status === "staff_review" && hasDrivingSchoolCertificate && (
                <p className="text-[13.5px] leading-relaxed text-slate-600">
                  Customer provided this certificate at submission — no enrollment or waiting period
                  needed. Review it in the <strong>Documents</strong> section below, then use{" "}
                  <strong>Certificate on file — verify &amp; route</strong> at the top.
                </p>
              )}

              {skipPathCertOnFile && (
                <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Driving school
                      </span>
                      <p className="mt-0.5 text-[14px] font-bold text-slate-900">
                        Certificate provided at submission
                      </p>
                      <p className="mt-1 text-[12.5px] text-slate-500">
                        {application.driving_school?.certificate_received_at
                          ? `Verified ${new Date(application.driving_school.certificate_received_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}.`
                          : "Awaiting staff verification — enrollment step skipped."}
                      </p>
                    </div>
                    {application.driving_school?.certificate_url ? (
                      <a
                        href={resolveMediaUrl(application.driving_school.certificate_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnSecondary}
                        style={{ padding: "0.4rem 0.75rem" }}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </a>
                    ) : null}
                  </div>
                </div>
              )}

              {(application.status === "driving_school_enrolled" ||
                application.status === "driving_school_certificate_ready" ||
                application.driving_school) &&
                application.driving_school_enrolled_at && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Academy card */}
                    <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Academy</span>
                          <p className="mt-0.5 text-[14px] font-bold text-slate-900">
                            {application.driving_school?.name || "Accredited driving academy"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/60 pt-4">
                        <div className="flex items-center gap-2.5">
                          <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[12.5px] font-semibold text-slate-800">Verification slip</p>
                            <p className="text-[11px] text-slate-400">Uploaded at enrollment</p>
                          </div>
                        </div>
                        {verifSlipUrl ? (
                          <a
                            href={resolveMediaUrl(verifSlipUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={btnSecondary}
                            style={{ padding: "0.4rem 0.75rem" }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </a>
                        ) : (
                          <span className="text-[11.5px] italic text-slate-400">Not attached</span>
                        )}
                      </div>
                    </div>

                    {/* Countdown */}
                    <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/50">
                      <div className="mb-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Countdown to graduation
                        </span>
                        <span className={timeLeft.expired ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>
                          {timeLeft.expired ? "Complete" : "In progress"}
                        </span>
                      </div>

                      {timeLeft.expired || application.status === "driving_school_certificate_ready" ? (
                        <div className="rounded-lg bg-emerald-50 p-4 text-center ring-1 ring-inset ring-emerald-200 shadow-sm">
                          <p className="text-[13.5px] font-bold text-emerald-800">Training period complete</p>
                          <p className="mt-1 text-[12px] text-emerald-700">Ready to route to a field agent.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              ["Days", timeLeft.days],
                              ["Hrs", timeLeft.hours],
                              ["Min", timeLeft.minutes],
                              ["Sec", timeLeft.seconds],
                            ].map(([lbl, val]) => (
                              <div key={lbl} className="rounded-xl bg-white border border-slate-200 py-2.5 shadow-sm">
                                <span className="block font-mono text-[20px] font-bold text-slate-900">{val}</span>
                                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  {lbl}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 text-center text-[12px] text-slate-500">
                            Target: <span className="font-mono font-bold text-slate-700">{new Date(application.driving_school_target_date || application.driving_school?.target_date || Date.now()).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                    <p className="text-[13px] text-slate-500">
                      {application.status === "driving_school_enrolled"
                        ? "Next: Upload the graduation certificate using the actions at the top."
                        : "Next: Route this application to a field agent using the actions at the top."}
                    </p>
                  </div>
                </div>
              )}

              {!["submitted", "staff_review", "driving_school_enrolled", "driving_school_certificate_ready"].includes(application.status) &&
                !application.driving_school && (
                  <p className="text-[13px] text-slate-500">
                    Not applicable — driving school enrollment doesn't apply to this application's current status (
                    {statusMeta(application.status).label.toLowerCase()}), or it's a renewal/reissue.
                  </p>
                )}

              {application.status === "temp_licence_pending_review" && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-[13.5px] leading-relaxed text-slate-600">
                  The assigned agent has issued a temporary licence and it's awaiting your review.
                  Check the card details in the <strong>Licence Issuance</strong> section above, then
                  use <strong>Review temporary licence</strong> at the top to approve or reject it.
                  Approving is what makes it visible to the customer.
                </p>
              )}
              {application.status === "temp_licence_issued" && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-[13.5px] leading-relaxed text-slate-600">
                  Temporary licence approved and visible to the customer. The agent can upload the
                  permanent card at any point from here.
                </p>
              )}
              {application.status === "agent_completed" && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-[13.5px] leading-relaxed text-slate-600">
                  The assigned agent has uploaded the permanent licence card. Check the card details
                  in the <strong>Licence Issuance</strong> section above, then use the{" "}
                  <strong>Final review</strong> button at the top to approve or reject it. Approving
                  moves this to
                  <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px]">awaiting_customer</code>.
                </p>
              )}
              {application.status === "expired" && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-[13.5px] leading-relaxed text-red-700">
                  This licence's validity period has elapsed. The customer has been prompted to apply
                  for a renewal — no further staff action needed on this application.
                </p>
              )}
              {application.status === "staff_final_review" && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-[13.5px] leading-relaxed text-slate-600">
                  Final review recorded — this application is finishing its transition to
                  <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px]">awaiting_customer</code>.
                  Refresh to check its latest status.
                </p>
              )}
              {application.status === "awaiting_customer" && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-[13.5px] leading-relaxed text-slate-600">
                  Awaiting the customer to confirm receipt of their physical licence. Use{" "}
                  <strong>Record dispatch</strong> at the top to log who dispatched it and any
                  tracking note for the customer.
                  {application.dispatched_at && (
                    <span className="mt-2 block text-[12.5px] text-slate-500">
                      Dispatched by <strong className="text-slate-700">{application.dispatched_by || "—"}</strong> on{" "}
                      {new Date(application.dispatched_at).toLocaleString()}.
                      {application.tracking_note && <> Note: {application.tracking_note}</>}
                    </span>
                  )}
                </p>
              )}
              {application.status === "completed" && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-[13.5px] leading-relaxed text-emerald-700">
                  Completed — the customer has confirmed receipt of their licence.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Action modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-[16px] font-bold text-slate-900">
                {modalType === "approve" && "Approve application"}
                {modalType === "reject" && "Reject application"}
                {modalType === "enroll" && "Enroll in driving school"}
                {modalType === "upload-cert" && "Upload certificate"}
                {modalType === "confirm-cert" && "Confirm driving school certificate"}
                {modalType === "review-temp-licence" && "Review temporary licence"}
                {modalType === "route" && "Route to field agent"}
                {modalType === "final-review" && "Final review"}
                {modalType === "push-to-customer" && "Push to customer"}
                {modalType === "ready-for-pickup" && "Mark ready for pickup"}
                {modalType === "notice" && "Done"}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {actionError}
              </div>
            )}

            {modalType === "approve" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-slate-500">
                  Confirm identity and NIN checks for{" "}
                  <strong className="text-slate-800">
                    {application.first_name} {application.last_name}
                  </strong>
                  .
                </p>
                <div>
                  <label className={fieldLabel}>Verification note</label>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="e.g. NIN and biodata checked against the national database, all fields match."
                    className={inputBase}
                  />
                </div>
              </div>
            )}

            {modalType === "reject" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-slate-500">The applicant will see this reason and can resubmit.</p>
                <div>
                  <label className={fieldLabel}>Reason (required)</label>
                  <textarea
                    rows={3}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g. NIN slip is blurry, date of birth doesn't match."
                    className={inputBase}
                  />
                </div>
              </div>
            )}

            {modalType === "enroll" && (
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3.5 text-[12.5px] text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    The graduation target date is calculated automatically — 26 business days from
                    today, excluding weekends and Nigerian public holidays.
                  </span>
                </div>
                <div>
                  <label className={fieldLabel}>Verification slip</label>
                  <UploadField
                    fileName={verifFileName}
                    hasValue={!!verifImageInput}
                    onChange={(file) => {
                      setVerifFileName(file?.name || "");
                      readFileAsDataUrl(file, setVerifImageInput);
                    }}
                  />
                </div>
              </div>
            )}

            {modalType === "upload-cert" && (
              <div>
                <label className={fieldLabel}>Graduation certificate</label>
                <UploadField
                  fileName={certFileName}
                  hasValue={!!certUrlInput}
                  onChange={(file) => {
                    setCertFileName(file?.name || "");
                    readFileAsDataUrl(file, setCertUrlInput);
                  }}
                />
              </div>
            )}

            {modalType === "confirm-cert" && (
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3.5 text-[12.5px] text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    The applicant already attached a driving school certificate at submission —
                    no enrollment or waiting period needed. Review it in the{" "}
                    <a href="#documents" onClick={() => setModalType(null)} className="font-semibold underline" style={{ color: BRAND }}>
                      Documents
                    </a>{" "}
                    section, then confirm to route this application straight to an agent in{" "}
                    <strong className="text-slate-800">{application.lga || "the applicant's LGA"}</strong>.
                  </span>
                </div>
              </div>
            )}

            {modalType === "route" && (
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3.5 text-[12.5px] text-slate-600 ring-1 ring-inset ring-slate-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  This offers the job to active agents in <strong className="text-slate-800">{application.lga || "this LGA"}</strong>.
                  Once one accepts, biometric capture scheduling begins.
                </span>
              </div>
            )}

            {modalType === "review-temp-licence" && (
              <div className="space-y-3.5">
                <p className="text-[12.5px] text-slate-500">
                  The agent submitted a temporary licence for this applicant. Approving makes it
                  visible on the customer's dashboard; rejecting sends the application back to the
                  agent to re-submit.
                </p>
                <LicenceSummary licence={application.temporary_licence} />
                <div>
                  <label className={fieldLabel}>Decision</label>
                  <DecisionToggle value={decisionInput} onChange={setDecisionInput} />
                </div>
                <div>
                  <label className={fieldLabel}>Note {decisionInput === "rejected" ? "(required)" : "(optional)"}</label>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={decisionInput === "rejected" ? "e.g. Licence number doesn't match the applicant's records." : "e.g. Verified against applicant details."}
                    className={inputBase}
                  />
                </div>
              </div>
            )}

            {modalType === "final-review" && (
              <div className="space-y-3.5">
                <p className="text-[12.5px] text-slate-500">
                  Confirm the completed job (the permanent licence card) checks out. Approving moves
                  the application to <strong className="text-slate-800">awaiting_customer</strong> —
                  the customer will be able to confirm receipt from their dashboard and see the card
                  details. Rejecting sends it back to the agent.
                </p>
                <LicenceSummary licence={application.permanent_licence} />
                <div>
                  <label className={fieldLabel}>Decision</label>
                  <DecisionToggle value={decisionInput} onChange={setDecisionInput} />
                </div>
                <div>
                  <label className={fieldLabel}>Note {decisionInput === "rejected" ? "(required)" : "(optional)"}</label>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={decisionInput === "rejected" ? "e.g. Card photo is blurry, re-upload needed." : "e.g. Finished card verified against application details."}
                    className={inputBase}
                  />
                </div>
              </div>
            )}

            {modalType === "push-to-customer" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-slate-500">
                  Record dispatch details for this licence — who dispatched it and any tracking note
                  for the customer to see.
                </p>
                <div>
                  <label className={fieldLabel}>Dispatched by</label>
                  <input
                    value={dispatchedByInput}
                    onChange={(e) => setDispatchedByInput(e.target.value)}
                    placeholder="e.g. Ikeja processing desk"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Tracking note</label>
                  <textarea
                    rows={3}
                    value={trackingNoteInput}
                    onChange={(e) => setTrackingNoteInput(e.target.value)}
                    placeholder="e.g. Available for collection at the Ikeja VIO office from Monday."
                    className={inputBase}
                  />
                </div>
              </div>
            )}

            {modalType === "ready-for-pickup" && (
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3.5 text-[12.5px] text-slate-600 ring-1 ring-inset ring-slate-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  This notifies the customer over SMS and WhatsApp that their physical licence card
                  is ready for pickup at the assigned agent's VIO office.
                </span>
              </div>
            )}

            {modalType === "notice" && <p className="text-[13px] text-slate-600">{noticeMessage}</p>}

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              {modalType !== "notice" ? (
                <>
                  <button onClick={() => setModalType(null)} disabled={actionLoading} className={btnSecondary}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmAction} disabled={actionLoading} className={btnPrimary} style={{ background: BRAND }}>
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {actionLoading ? "Saving…" : "Confirm"}
                  </button>
                </>
              ) : (
                <button onClick={() => setModalType(null)} className={btnPrimary} style={{ background: BRAND }}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnGhostLink =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0";

function DecisionToggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("approved")}
        className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
          value === "approved" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        }`}
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => onChange("rejected")}
        className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
          value === "rejected" ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        }`}
      >
        Reject
      </button>
    </div>
  );
}

function LicenceSummary({ licence }) {
  if (!licence) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-[12.5px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Licence number</span>
          <span className="font-mono font-semibold text-slate-800">{licence.licence_number || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Expiry date</span>
          <span className="font-semibold text-slate-800">{licence.expiry_date ? new Date(licence.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}</span>
        </div>
      </div>
      {licence.document_url && (
        <a href={resolveMediaUrl(licence.document_url)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold hover:underline" style={{ color: BRAND }}>
          <Eye className="h-3.5 w-3.5" /> View submitted card
        </a>
      )}
    </div>
  );
}

const LICENCE_REVIEW_TONE = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function StaffLicenceCard({ title, licence }) {
  if (!licence) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        <p className="mt-1 text-[13px] text-slate-400">Not issued yet.</p>
      </div>
    );
  }
  const tone = LICENCE_REVIEW_TONE[licence.review_status] || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        {licence.review_status && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize ring-1 ring-inset ${tone}`}>
            {licence.review_status}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-[14px] font-bold text-slate-900">{licence.licence_number || "—"}</p>
      <p className="mt-1 text-[12px] text-slate-500">
        {licence.expiry_date ? `Valid until ${new Date(licence.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : "No expiry date recorded"}
      </p>
      {licence.is_expired && <p className="mt-1 text-[11.5px] font-semibold text-red-600">Expired</p>}
      {licence.document_url && (
        <a href={resolveMediaUrl(licence.document_url)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold hover:underline" style={{ color: BRAND }}>
          <Eye className="h-3.5 w-3.5" /> View document
        </a>
      )}
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