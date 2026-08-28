"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { getStaffApplication, staffFinalReview, resolveMediaUrl } from "@/lib/api";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

const BRAND = "#28A745";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors";
const fieldLabel = "block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
const inputBase =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";

// Mirrors PCI_CHECKLIST_SECTIONS in app/modules/driver_licence/router.py —
// keep in sync if the checklist itself ever changes. Display order only;
// the backend's own constant is the single source of truth for validation.
const PCI_SECTIONS = [
  { key: "exterior_body", label: "Exterior & Body", items: ["body_panel_alignment", "paint_consistency", "glass_windscreen_mirrors", "lights", "tyres"] },
  { key: "engine_bay", label: "Engine Bay", items: ["oil_condition_level", "coolant_fluid_levels", "leaks", "belts_hoses", "battery_condition"] },
  { key: "underbody", label: "Underbody", items: ["suspension_components", "exhaust_system", "chassis_rust_structural_damage", "accident_repair_weld_signs"] },
  { key: "interior", label: "Interior", items: ["dashboard_warning_lights", "ac_function", "electronics", "seats_belts", "odometer_reading"] },
  { key: "road_test", label: "Road Test", items: ["engine_performance_under_load", "transmission_gearbox", "brakes", "steering_alignment", "unusual_noises_vibrations"] },
];

function gradeBadgeClass(grade) {
  if (grade === "good") return "bg-emerald-100 text-emerald-700";
  if (grade === "fair") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

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

function SectionBlock({ section, itemsByKey, onPreview }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="text-[13.5px] font-bold text-slate-800">{section.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          {section.items.map((itemKey) => {
            const item = itemsByKey[`${section.key}.${itemKey}`];
            return (
              <div key={itemKey} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[12.5px] font-semibold text-slate-800 capitalize">{itemKey.replace(/_/g, " ")}</p>
                  {item?.notes && <p className="text-[11px] text-slate-500">{item.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${item?.rating ? gradeBadgeClass(item.rating) : "bg-slate-200 text-slate-500"}`}>
                    {item?.rating?.replace(/_/g, " ") || "—"}
                  </span>
                  {item?.evidence_url && (
                    <button
                      type="button"
                      onClick={() => onPreview(resolveMediaUrl(item.evidence_url))}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <ImageIcon className="h-3 w-3" /> Evidence
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StaffPhysicalConditionInspectionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params?.id ? Number(params.id) : null;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const [decisionInput, setDecisionInput] = useState("approved");
  const [noteInput, setNoteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadDetail = async () => {
    setLoading(true);
    const res = await getStaffApplication(appId);
    if (res.error) setError(res.error);
    else if (res.data) setApplication(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const handleConfirm = async () => {
    if (decisionInput === "rejected" && !noteInput.trim()) {
      setSubmitError("A note is required when rejecting.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    const res = await staffFinalReview(appId, { note: noteInput.trim(), decision: decisionInput });
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
    router.push(`/staff/applications/${appId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-[13.5px] font-semibold text-red-600">{error || "Application not found."}</p>
        <Link href="/staff/applications" className={`${btnSecondary} mt-4 inline-flex`}>Back to applications</Link>
      </div>
    );
  }

  const detail = application.pci_detail || {};
  const itemsByKey = {};
  for (const item of application.pci_checklist_items || []) {
    itemsByKey[`${item.section_key}.${item.item_key}`] = item;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <DocumentPreviewModal isOpen={!!previewDocUrl} onClose={() => setPreviewDocUrl(null)} fileUrl={previewDocUrl} />

      <Link href={`/staff/applications/${appId}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to application
      </Link>

      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
          Physical Condition Inspection — Final Review <span className="font-mono text-[15px] text-slate-400">#{appId}</span>
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Confirm every section was recorded with matching evidence before releasing the graded report — not a re-decision of the inspector's ratings.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-slate-500">Booking</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Vehicle</span>
            <span className="mt-1 block text-[13.5px] font-bold text-slate-900">{detail.make} {detail.model} — {detail.plate_number}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <span className="mt-1 block text-[13.5px] font-bold capitalize text-slate-900">{detail.vehicle_category?.replace(/_/g, " ")}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Overall grade (inspector's)</span>
            <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[12px] font-bold uppercase ${gradeBadgeClass(detail.overall_grade)}`}>
              {detail.overall_grade?.replace(/_/g, " ") || "—"}
            </span>
          </div>
        </div>
        {detail.summary_notes && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-[12.5px] text-slate-600">{detail.summary_notes}</p>
        )}
      </div>

      {PCI_SECTIONS.map((section) => (
        <SectionBlock key={section.key} section={section} itemsByKey={itemsByKey} onPreview={setPreviewDocUrl} />
      ))}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
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
            placeholder={decisionInput === "rejected" ? "e.g. Engine bay photos don't match the vehicle on file." : "e.g. All sections verified against the evidence."}
            className={inputBase}
          />
        </div>
        {submitError && <p className="text-[12.5px] font-semibold text-red-600">{submitError}</p>}
        <button type="button" onClick={handleConfirm} disabled={submitting} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {submitting ? "Saving…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
