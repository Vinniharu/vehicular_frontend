"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { statusMeta, TONE_HEX, getStageProgress } from "@/app/dashboard/_shared/status-config";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

export function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// Mirrors the 30-day eligibility-cap window used everywhere else
// (PARTICULARS_RENEWAL_WINDOW_DAYS in app/core/payment_helpers.py) so
// "renews soon" here lines up with when a renewal actually opens up.
export const RENEWAL_WINDOW_DAYS = 30;

export function freshnessMeta(expiryDate) {
  if (!expiryDate) return null;
  const diffDays = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", tone: "danger" };
  if (diffDays <= RENEWAL_WINDOW_DAYS) return { label: "Renews soon", tone: "warning" };
  return { label: "Valid", tone: "success" };
}

export const errInputClass = (hasError) =>
  hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : "";

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] font-medium text-red-600">{message}</p>;
}

export function MiniProgressRing({ status, applicationType, size = 36 }) {
  const progress = getStageProgress(status, applicationType);
  const isRejected = status === "staff_rejected" || status === "failed";
  const isDone = status === "completed";
  const meta = statusMeta(status);
  const strokeColor = TONE_HEX[meta.tone] || TONE_HEX.neutral;

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

export function isApplicationPaid(app) {
  if (!app) return false;
  const s = app.payment_status || app.payment_options?.payment_status;
  return s === "success" || s === "paid";
}

export function paymentStatusMeta(app) {
  if (!app) return { label: "Payment Due", tone: "warning", needsRetry: false };
  const s = app.payment_status || app.payment_options?.payment_status;
  if (s === "success" || s === "paid") return { label: "Paid", tone: "success", needsRetry: false };
  if (s === "abandoned" || s === "failed") return { label: "Payment Failed / Retry", tone: "danger", needsRetry: true };
  return { label: "Payment Due", tone: "warning", needsRetry: false };
}

// Renders the reason a document/application type tile is disabled in an
// eligibility-gated picker (vehicle-particulars' document picker, the DL
// wizard's type picker). "unpriced" reuses the original vehicle_particulars
// copy verbatim; "in_flight"/"not_due"/"already_has_licence" are the
// renewal-history reasons shared across every eligibility check this
// session added (get_particulars_item_eligibility/get_tinted_permit_eligibility/
// get_dl_family_eligibility, app/core/payment_helpers.py on the backend).
export function IneligibilityNotice({ eligibility }) {
  if (!eligibility || eligibility.eligible) return null;
  if (eligibility.reason === "unpriced") {
    return <p className="mt-1 text-[11px] font-semibold text-amber-600">Not yet available for renewal</p>;
  }
  if (eligibility.reason === "in_flight") {
    return <p className="mt-1 text-[11px] font-semibold text-amber-600">Already in progress — check your existing requests</p>;
  }
  if (eligibility.reason === "already_has_licence") {
    return <p className="mt-1 text-[11px] font-semibold text-amber-600">You already have a licence — try Renewal or Reissue instead</p>;
  }
  if (eligibility.reason === "not_due") {
    const from = eligibility.eligible_from_date
      ? new Date(eligibility.eligible_from_date).toLocaleDateString("en-NG", { dateStyle: "medium" })
      : null;
    return (
      <p className="mt-1 text-[11px] font-semibold text-amber-600">
        {from ? `Renews from ${from}` : "Not due for renewal yet"}
      </p>
    );
  }
  return null;
}

/* Segmented step progress bar, shared by the DL wizard and the tinted-permit form */
export function StepProgress({ steps, current }) {
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
