"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Video,
} from "lucide-react";
import { getStaffApplication, confirmPciCompleteness, adminListPciReferenceImages, resolveMediaUrl } from "@/lib/api";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

const BRAND = "#28A745";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

// Mirrors PCI_CHECKLIST_SECTIONS in app/modules/driver_licence/router.py —
// keep in sync if the checklist itself ever changes. requiresEvidence flags
// match the backend's evidence_required booleans.
const PCI_SECTIONS = [
  { key: "exterior_body", label: "Exterior & Body", items: [
    ["body_panel_alignment", true], ["paint_consistency", true], ["glass_windscreen_mirrors", true], ["lights", true], ["tyres", true],
  ] },
  { key: "engine_bay", label: "Engine Bay", items: [
    ["oil_condition_level", true], ["coolant_fluid_levels", true], ["leaks", true], ["belts_hoses", true], ["battery_condition", true],
  ] },
  { key: "underbody", label: "Underbody", items: [
    ["suspension_components", true], ["exhaust_system", true], ["chassis_rust_structural_damage", true], ["accident_repair_weld_signs", true],
  ] },
  { key: "interior", label: "Interior", items: [
    ["dashboard_warning_lights", true], ["ac_function", false], ["electronics", false], ["seats_belts", true], ["odometer_reading", true],
  ] },
  { key: "road_test", label: "Road Test", items: [
    ["engine_performance_under_load", true], ["transmission_gearbox", true], ["brakes", true], ["steering_alignment", true], ["unusual_noises_vibrations", true],
  ] },
];

function isVideoUrl(url) {
  return /\.(mp4|mov|webm|m4v|3gp)(\?|$)/i.test(url || "");
}

function ratingBadgeClass(rating) {
  if (rating === "good") return "bg-emerald-100 text-emerald-700";
  if (rating === "fair") return "bg-amber-100 text-amber-700";
  if (rating === "poor") return "bg-orange-100 text-orange-700";
  if (rating === "needs_attention") return "bg-red-100 text-red-700";
  return "bg-slate-200 text-slate-500";
}

function SectionBlock({ section, itemsByKey, referenceByKey, onPreview }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3.5 text-left">
        <span className="text-[13.5px] font-bold text-slate-800">{section.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          {section.items.map(([itemKey, requiresEvidence]) => {
            const item = itemsByKey[`${section.key}.${itemKey}`];
            const reference = referenceByKey[`${section.key}.${itemKey}`];
            const missingEvidence = requiresEvidence && !item?.evidence_url;
            return (
              <div key={itemKey} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800 capitalize">{itemKey.replace(/_/g, " ")}</p>
                    {item?.notes && <p className="text-[11px] text-slate-500">{item.notes}</p>}
                    {!item?.rating && <p className="text-[11px] font-semibold text-amber-600">Not yet rated</p>}
                    {item?.rating && missingEvidence && <p className="text-[11px] font-semibold text-amber-600">Missing required evidence</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${ratingBadgeClass(item?.rating)}`}>
                      {item?.rating?.replace(/_/g, " ") || "—"}
                    </span>
                    {item?.evidence_url && (
                      isVideoUrl(item.evidence_url) ? (
                        <a href={resolveMediaUrl(item.evidence_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">
                          <Video className="h-3 w-3" /> Video
                        </a>
                      ) : (
                        <button type="button" onClick={() => onPreview(resolveMediaUrl(item.evidence_url))} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">
                          <ImageIcon className="h-3 w-3" /> Evidence
                        </button>
                      )
                    )}
                  </div>
                </div>
                {item?.voice_note_url && (
                  <audio controls src={resolveMediaUrl(item.voice_note_url)} className="mt-2 h-8 w-full max-w-[260px]" />
                )}
                {reference?.image_url && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5">
                    <img src={resolveMediaUrl(reference.image_url)} alt="Reference" className="h-10 w-10 shrink-0 rounded object-cover" />
                    <p className="text-[10.5px] text-slate-400">{reference.caption || "Reference photo for this item"}</p>
                  </div>
                )}
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
  const [referenceImages, setReferenceImages] = useState([]);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [missingItems, setMissingItems] = useState(null);

  const pollRef = useRef(null);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    const res = await getStaffApplication(appId);
    if (res.error) setError(res.error);
    else if (res.data) setApplication(res.data);
    if (!silent) setLoading(false);
  }, [appId]);

  useEffect(() => {
    loadDetail();
    adminListPciReferenceImages().then((res) => { if (res.data) setReferenceImages(res.data); });
  }, [loadDetail]);

  // Poll while the visit is in progress so newly-saved items from the field
  // mechanic's link show up here without a manual reload.
  useEffect(() => {
    if (application?.status !== "visit_scheduled") return;
    pollRef.current = setInterval(() => loadDetail({ silent: true }), 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [application?.status, loadDetail]);

  const handleConfirmCompleteness = async () => {
    setConfirming(true);
    setConfirmError(null);
    setMissingItems(null);
    const res = await confirmPciCompleteness(appId);
    setConfirming(false);
    if (res.error) {
      setConfirmError(res.error);
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
        <Link href="/staff/applications" className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Back to applications</Link>
      </div>
    );
  }

  const detail = application.pci_detail || {};
  const itemsByKey = {};
  for (const item of application.pci_checklist_items || []) {
    itemsByKey[`${item.section_key}.${item.item_key}`] = item;
  }
  const referenceByKey = Object.fromEntries(referenceImages.map((r) => [`${r.section_key}.${r.item_key}`, r]));

  const missingCount = PCI_SECTIONS.reduce(
    (n, s) => n + s.items.filter(([itemKey, requiresEvidence]) => {
      const item = itemsByKey[`${s.key}.${itemKey}`];
      return !item?.rating || (requiresEvidence && !item?.evidence_url);
    }).length,
    0
  );
  const canConfirm = application.status === "visit_scheduled";
  const alreadyConfirmed = application.status && !["submitted", "staff_review", "visit_scheduled"].includes(application.status);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <DocumentPreviewModal isOpen={!!previewDocUrl} onClose={() => setPreviewDocUrl(null)} fileUrl={previewDocUrl} />

      <Link href={`/staff/applications/${appId}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to application
      </Link>

      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
          Physical Condition Inspection — Checklist <span className="font-mono text-[15px] text-slate-400">#{appId}</span>
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Confirm every item the field mechanic captured is properly recorded before sending evidence to the reviewing mechanic.
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
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Confirmed visit</span>
            <span className="mt-1 block text-[13.5px] font-bold text-slate-900">
              {detail.confirmed_visit_date ? new Date(detail.confirmed_visit_date).toLocaleDateString() : "Not scheduled"}
              {detail.confirmed_visit_time ? ` (${detail.confirmed_visit_time})` : ""}
            </span>
          </div>
        </div>
      </div>

      {alreadyConfirmed && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12.5px] font-semibold text-emerald-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Completeness already confirmed for this inspection — the field mechanic's link is closed.
          {application.status === "awaiting_mechanic_verdict" && (
            <Link href={`/staff/physical-condition-inspection/${appId}/verdict`} className="ml-auto shrink-0 underline">Record verdict →</Link>
          )}
        </div>
      )}

      {PCI_SECTIONS.map((section) => (
        <SectionBlock key={section.key} section={section} itemsByKey={itemsByKey} referenceByKey={referenceByKey} onPreview={setPreviewDocUrl} />
      ))}

      {canConfirm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          {missingCount > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {missingCount} item{missingCount === 1 ? "" : "s"} still need{missingCount === 1 ? "s" : ""} a rating or required evidence before this can be confirmed.
            </div>
          )}
          {confirmError && <p className="text-[12.5px] font-semibold text-red-600">{confirmError}</p>}
          <button
            type="button"
            onClick={handleConfirmCompleteness}
            disabled={confirming || missingCount > 0}
            className={`${btnPrimary} w-full`}
            style={{ background: BRAND }}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {confirming ? "Confirming…" : "Confirm checklist is properly captured"}
          </button>
        </div>
      )}
    </div>
  );
}
