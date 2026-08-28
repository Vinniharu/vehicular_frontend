"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
  MapPin,
  Calendar,
  Send,
} from "lucide-react";
import { getApplication, submitPciChecklistItem, submitPciChecklist, uploadApplicationFile, resolveMediaUrl } from "@/lib/api";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

const BRAND = "#28A745";

const RATINGS = [
  { value: "good", label: "Good", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "fair", label: "Fair", cls: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "poor", label: "Poor", cls: "border-orange-400 bg-orange-50 text-orange-700" },
  { value: "needs_attention", label: "Needs Attention", cls: "border-red-400 bg-red-50 text-red-700" },
];

// Mirrors PCI_CHECKLIST_SECTIONS in app/modules/driver_licence/router.py —
// keep in sync if the checklist itself ever changes. requiresEvidence flags
// (ac_function, electronics) match the backend's evidence_required booleans.
const PCI_SECTIONS = [
  {
    key: "exterior_body", label: "Exterior & Body",
    items: [
      { key: "body_panel_alignment", label: "Body panels, dents, panel-gap alignment", hint: "Accident signs", requiresEvidence: true },
      { key: "paint_consistency", label: "Paint consistency / respray evidence", requiresEvidence: true },
      { key: "glass_windscreen_mirrors", label: "Glass, windscreen, mirrors", requiresEvidence: true },
      { key: "lights", label: "Lights", hint: "Head, indicators, brake, fog", requiresEvidence: true },
      { key: "tyres", label: "Tyres", hint: "Tread depth each wheel, matching set, spare", requiresEvidence: true },
    ],
  },
  {
    key: "engine_bay", label: "Engine Bay",
    items: [
      { key: "oil_condition_level", label: "Oil condition & level", requiresEvidence: true },
      { key: "coolant_fluid_levels", label: "Coolant / fluid levels", requiresEvidence: true },
      { key: "leaks", label: "Leaks", hint: "Oil, coolant, transmission", requiresEvidence: true },
      { key: "belts_hoses", label: "Belts & hoses", requiresEvidence: true },
      { key: "battery_condition", label: "Battery condition", requiresEvidence: true },
    ],
  },
  {
    key: "underbody", label: "Underbody",
    items: [
      { key: "suspension_components", label: "Suspension components", requiresEvidence: true },
      { key: "exhaust_system", label: "Exhaust system", requiresEvidence: true },
      { key: "chassis_rust_structural_damage", label: "Chassis rust / structural damage", requiresEvidence: true },
      { key: "accident_repair_weld_signs", label: "Accident-repair / weld signs", requiresEvidence: true },
    ],
  },
  {
    key: "interior", label: "Interior",
    items: [
      { key: "dashboard_warning_lights", label: "Dashboard warning lights", hint: "With ignition on", requiresEvidence: true },
      { key: "ac_function", label: "Air conditioning function", requiresEvidence: false },
      { key: "electronics", label: "Electronics", hint: "Windows, locks, infotainment", requiresEvidence: false },
      { key: "seats_belts", label: "Seats & belts", requiresEvidence: true },
      { key: "odometer_reading", label: "Odometer reading", hint: "Photo of the actual reading", requiresEvidence: true },
    ],
  },
  {
    key: "road_test", label: "Road Test",
    items: [
      { key: "engine_performance_under_load", label: "Engine performance under load", requiresEvidence: true },
      { key: "transmission_gearbox", label: "Transmission / gearbox", hint: "Shifts, clutch", requiresEvidence: true },
      { key: "brakes", label: "Brakes", hint: "Stopping, pulling, noise", requiresEvidence: true },
      { key: "steering_alignment", label: "Steering & alignment", requiresEvidence: true },
      { key: "unusual_noises_vibrations", label: "Unusual noises / vibrations", requiresEvidence: true },
    ],
  },
];
const TOTAL_ITEMS = PCI_SECTIONS.reduce((n, s) => n + s.items.length, 0);

const RECOMMENDATIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "recommended_with_repairs", label: "Recommended with repairs" },
  { value: "not_recommended", label: "Not recommended" },
  { value: "further_inspection_needed", label: "Further inspection needed" },
];

function ChecklistRow({ sectionKey, item, existing, onSave, previewFn }) {
  const [rating, setRating] = useState(existing?.rating || null);
  const [evidenceUrl, setEvidenceUrl] = useState(existing?.evidence_url || null);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isComplete = !!existing?.rating && (!item.requiresEvidence || !!existing?.evidence_url);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Upload failed. Please try again.");
      return;
    }
    setEvidenceUrl(data.file_url);
  };

  const handleSave = async () => {
    if (!rating || (item.requiresEvidence && !evidenceUrl)) {
      setError(item.requiresEvidence ? "Pick a rating and attach evidence before saving." : "Pick a rating before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await onSave(sectionKey, item.key, { rating, evidence_url: evidenceUrl || undefined, notes: notes || undefined });
    setSaving(false);
    if (res?.error) setError(res.error);
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all ${isComplete ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-slate-900">
            {isComplete && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            {item.label}
          </p>
          {item.hint && <p className="text-[12px] text-slate-500">{item.hint}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRating(r.value)}
            className={`rounded-lg border-2 px-3 py-1.5 text-[12px] font-semibold transition-all ${rating === r.value ? r.cls : "border-slate-200 text-slate-500"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {item.requiresEvidence && (
        <div className="mt-2">
          {evidenceUrl ? (
            <button type="button" onClick={() => previewFn(resolveMediaUrl(evidenceUrl))} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600">
              <Camera className="h-3.5 w-3.5" /> Evidence attached
            </button>
          ) : (
            <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {uploading ? "Uploading…" : "Attach photo or video"}
              <input type="file" accept="image/*,video/*" capture="environment" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
            </label>
          )}
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={1}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-[#28A745]"
      />

      {error && <p className="mt-1.5 text-[11.5px] text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !rating || (item.requiresEvidence && !evidenceUrl)}
        className="mt-2 rounded-lg bg-[#28A745] px-3 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : isComplete ? "Update" : "Save item"}
      </button>
    </div>
  );
}

export default function AgentPciChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [grades, setGrades] = useState({
    exterior_grade: "", engine_bay_grade: "", underbody_grade: "",
    interior_grade: "", road_test_grade: "", overall_grade: "",
  });
  const [summaryNotes, setSummaryNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadApplication = useCallback(async () => {
    const res = await getApplication(appId);
    if (res.error) setError(res.error);
    else setApplication(res.data);
    setLoading(false);
  }, [appId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const itemsByKey = Object.fromEntries(
    (application?.pci_checklist_items || []).map((i) => [`${i.section_key}.${i.item_key}`, i])
  );
  const completedCount = PCI_SECTIONS.reduce(
    (n, s) => n + s.items.filter((it) => {
      const existing = itemsByKey[`${s.key}.${it.key}`];
      return existing?.rating && (!it.requiresEvidence || existing?.evidence_url);
    }).length,
    0
  );
  const allComplete = completedCount === TOTAL_ITEMS;
  const canEdit = application?.status === "agent_accepted" || application?.status === "needs_correction";
  const gradesFilled = Object.values(grades).every((g) => !!g) && !!summaryNotes.trim() && !!recommendation;

  const handleSaveItem = async (sectionKey, itemKey, payload) => {
    const res = await submitPciChecklistItem(appId, sectionKey, itemKey, payload);
    if (!res.error) await loadApplication();
    return res;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitPciChecklist(appId, {
      ...grades,
      summary_notes: summaryNotes.trim(),
      recommendation,
    });
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
    router.push("/agent/applications");
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading inspection…</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <span>{error || "Application not found."}</span>
      </div>
    );
  }

  const detail = application.pci_detail;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <DocumentPreviewModal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} fileUrl={previewUrl} />

      <button onClick={() => router.push("/agent/applications")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-[19px] font-bold tracking-tight text-slate-900">Physical Condition Inspection #{application.id}</h1>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Vehicle</span>
            <span className="mt-0.5 block text-[13px] font-semibold text-slate-800">{detail?.make} {detail?.model} — {detail?.plate_number}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Meet at</span>
            <span className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-slate-800"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {detail?.location_address || "—"}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Preferred date</span>
            <span className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-slate-800">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {detail?.preferred_date ? new Date(detail.preferred_date).toLocaleDateString() : "—"}
              {detail?.preferred_time ? ` (${detail.preferred_time})` : ""}
            </span>
          </div>
          {detail?.whose_vehicle === "other" && detail?.seller_name && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ask for</span>
              <span className="mt-0.5 block text-[13px] font-semibold text-slate-800">{detail.seller_name}</span>
            </div>
          )}
        </div>
        {!canEdit && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
            {application.status === "agent_completed" ? "Report already submitted — awaiting staff review." : `This job is at status "${application.status}" and can't be edited here.`}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
        <p className="text-[13px] font-semibold text-slate-700">
          {completedCount} of {TOTAL_ITEMS} items complete
        </p>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#28A745] transition-all" style={{ width: `${(completedCount / TOTAL_ITEMS) * 100}%` }} />
        </div>
      </div>

      {PCI_SECTIONS.map((section) => (
        <div key={section.key} className="space-y-2.5">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">{section.label}</h2>
          {section.items.map((item) => (
            <ChecklistRow
              key={item.key}
              sectionKey={section.key}
              item={item}
              existing={itemsByKey[`${section.key}.${item.key}`]}
              onSave={canEdit ? handleSaveItem : async () => ({ error: "This job can no longer be edited." })}
              previewFn={setPreviewUrl}
            />
          ))}
        </div>
      ))}

      {canEdit && allComplete && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[13.5px] font-bold text-slate-900">Finalize graded report</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["exterior_grade", "Exterior & Body"], ["engine_bay_grade", "Engine Bay"], ["underbody_grade", "Underbody"],
              ["interior_grade", "Interior"], ["road_test_grade", "Road Test"], ["overall_grade", "Overall"],
            ].map(([field, fieldLabel]) => (
              <div key={field}>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{fieldLabel}</label>
                <select
                  value={grades[field]}
                  onChange={(e) => setGrades((g) => ({ ...g, [field]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-900 outline-none focus:border-[#28A745]"
                >
                  <option value="">Select…</option>
                  {RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recommendation</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-900 outline-none focus:border-[#28A745]"
            >
              <option value="">Select…</option>
              {RECOMMENDATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Summary</label>
            <textarea
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="Overall condition summary and any advice for the buyer."
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-900 outline-none focus:border-[#28A745]"
            />
          </div>

          {submitError && <p className="text-[13px] font-medium text-red-600">{submitError}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!gradesFilled || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: BRAND }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting…" : "Submit inspection"}
          </button>
        </div>
      )}

      {canEdit && !allComplete && (
        <p className="text-center text-[12.5px] text-slate-500">Complete all {TOTAL_ITEMS} items to finalize the report.</p>
      )}
    </div>
  );
}
