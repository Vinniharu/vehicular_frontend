"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Camera,
  MapPin,
  Clock,
  Car,
  Send,
} from "lucide-react";
import { getApplication, submitRwxChecklistItem, submitRwxChecklist, uploadApplicationFile, resolveMediaUrl } from "@/lib/api";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

const BRAND = "#28A745";

// The 10 fixed checklist items, in display order — mirrors
// RWX_CHECKLIST_ITEM_KEYS (app/modules/driver_licence/router.py) exactly.
// Not admin-configurable, per the spec's fixed checklist.
const CHECKLIST_ITEMS = [
  { key: "tyres", label: "Tyres", hint: "Tread depth and condition, all round" },
  { key: "brakes", label: "Brakes", hint: "Function" },
  { key: "lights", label: "Lights", hint: "Headlights, indicators, brake lights" },
  { key: "steering_suspension", label: "Steering and suspension", hint: "" },
  { key: "windscreen_mirrors", label: "Windscreen and mirrors", hint: "" },
  { key: "seatbelts", label: "Seatbelts", hint: "" },
  { key: "horn", label: "Horn", hint: "" },
  { key: "exhaust_emissions", label: "Exhaust / emissions", hint: "" },
  { key: "chassis_body", label: "Chassis and body condition", hint: "" },
  { key: "overall_verdict", label: "Overall verdict", hint: "Roadworthy or not roadworthy, based on everything above" },
];

function ChecklistRow({ item, existing, onSave, previewFn }) {
  const [result, setResult] = useState(existing?.result || null);
  const [evidenceUrl, setEvidenceUrl] = useState(existing?.evidence_url || null);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isComplete = !!(existing?.result && existing?.evidence_url);

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
    if (!result || !evidenceUrl) {
      setError("Pick pass/fail and attach a photo before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await onSave(item.key, { result, evidence_url: evidenceUrl, notes: notes || undefined });
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
        <button
          type="button"
          onClick={() => setResult("pass")}
          className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
            result === "pass" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Pass
        </button>
        <button
          type="button"
          onClick={() => setResult("fail")}
          className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
            result === "fail" ? "border-red-400 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" /> Fail
        </button>

        {evidenceUrl ? (
          <button type="button" onClick={() => previewFn(resolveMediaUrl(evidenceUrl))} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600">
            <Camera className="h-3.5 w-3.5" /> Photo attached
          </button>
        ) : (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {uploading ? "Uploading…" : "Attach photo"}
            <input type="file" accept="image/*" capture="environment" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
          </label>
        )}
      </div>

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
        disabled={saving || !result || !evidenceUrl}
        className="mt-2 rounded-lg bg-[#28A745] px-3 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : isComplete ? "Update" : "Save item"}
      </button>
    </div>
  );
}

export default function AgentRwxChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadApplication = useCallback(async () => {
    const res = await getApplication(appId);
    if (res.error) setError(res.error);
    else setApplication(res.data);
    setLoading(false);
  }, [appId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const itemsByKey = Object.fromEntries((application?.rwx_checklist_items || []).map((i) => [i.item_key, i]));
  const completedCount = CHECKLIST_ITEMS.filter((c) => itemsByKey[c.key]?.result && itemsByKey[c.key]?.evidence_url).length;
  const allComplete = completedCount === CHECKLIST_ITEMS.length;
  const canEdit = application?.status === "agent_accepted";

  const handleSaveItem = async (itemKey, payload) => {
    const res = await submitRwxChecklistItem(appId, itemKey, payload);
    if (!res.error) await loadApplication();
    return res;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitRwxChecklist(appId);
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

  const detail = application.rwx_detail;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <DocumentPreviewModal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} fileUrl={previewUrl} />

      <button onClick={() => router.push("/agent/applications")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-[19px] font-bold tracking-tight text-slate-900">Roadworthiness inspection #{application.id}</h1>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bay</span>
            <span className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-slate-800"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {detail?.bay?.name || "—"}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Slot</span>
            <span className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-slate-800"><Clock className="h-3.5 w-3.5 text-slate-400" /> {detail?.slot?.label || "—"}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <span className="mt-0.5 block text-[13px] font-semibold capitalize text-slate-800">{detail?.vehicle_category?.replace(/_/g, " ") || "—"}</span>
          </div>
        </div>
        {!canEdit && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
            {application.status === "agent_completed" ? "Checklist already submitted — awaiting staff confirmation." : `This job is at status "${application.status}" and can't be edited here.`}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
        <p className="text-[13px] font-semibold text-slate-700">
          {completedCount} of {CHECKLIST_ITEMS.length} items complete
        </p>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#28A745] transition-all" style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => (
          <ChecklistRow
            key={item.key}
            item={item}
            existing={canEdit ? itemsByKey[item.key] : itemsByKey[item.key]}
            onSave={canEdit ? handleSaveItem : async () => ({ error: "This job can no longer be edited." })}
            previewFn={setPreviewUrl}
          />
        ))}
      </div>

      {canEdit && (
        <div className="space-y-2">
          {submitError && <p className="text-[13px] font-medium text-red-600">{submitError}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allComplete || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: BRAND }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting…" : allComplete ? "Submit inspection" : `Complete all ${CHECKLIST_ITEMS.length} items to submit`}
          </button>
        </div>
      )}
    </div>
  );
}
