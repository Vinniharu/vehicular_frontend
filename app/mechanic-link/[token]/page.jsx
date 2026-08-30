"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Loader2, XCircle, CheckCircle2, Camera, Mic, Square, RotateCcw,
  MapPin, Calendar, Car, Palette, Eye, Lightbulb, CircleDot, Droplet, Wind,
  Cable, BatteryFull, Flame, AlertOctagon, Gauge, ShieldAlert, Snowflake, Cpu,
  Armchair, Hash, Zap, Settings2, Disc, Compass, Volume2, Video, Lock,
} from "lucide-react";
import {
  getPciChecklistByLink,
  submitPciChecklistItemByLink,
  uploadPciEvidenceByLink,
  markPciMechanicComplete,
  resolveMediaUrl,
} from "@/lib/api";

const BRAND = "#28A745";

// Mirrors PCI_CHECKLIST_SECTIONS in app/modules/driver_licence/router.py —
// keep in sync if the checklist itself ever changes. Icon-first, built for a
// field mechanic who may not read comfortably: every item leads with an
// icon, then a short label, then four big color-tap ratings — never a form
// field to type into unless they want to (notes/voice note are optional).
const PCI_SECTIONS = [
  {
    key: "exterior_body", label: "Exterior & Body",
    items: [
      { key: "body_panel_alignment", label: "Body panels & dents", icon: Car, requiresEvidence: true },
      { key: "paint_consistency", label: "Paint match", icon: Palette, requiresEvidence: true },
      { key: "glass_windscreen_mirrors", label: "Glass & mirrors", icon: Eye, requiresEvidence: true },
      { key: "lights", label: "Lights", icon: Lightbulb, requiresEvidence: true },
      { key: "tyres", label: "Tyres", icon: CircleDot, requiresEvidence: true },
    ],
  },
  {
    key: "engine_bay", label: "Engine Bay",
    items: [
      { key: "oil_condition_level", label: "Oil condition & level", icon: Droplet, requiresEvidence: true },
      { key: "coolant_fluid_levels", label: "Coolant & fluids", icon: Droplet, requiresEvidence: true },
      { key: "leaks", label: "Leaks", icon: AlertOctagon, requiresEvidence: true },
      { key: "belts_hoses", label: "Belts & hoses", icon: Cable, requiresEvidence: true },
      { key: "battery_condition", label: "Battery", icon: BatteryFull, requiresEvidence: true },
    ],
  },
  {
    key: "underbody", label: "Underbody",
    items: [
      { key: "suspension_components", label: "Suspension", icon: Settings2, requiresEvidence: true },
      { key: "exhaust_system", label: "Exhaust", icon: Flame, requiresEvidence: true },
      { key: "chassis_rust_structural_damage", label: "Rust / chassis damage", icon: AlertOctagon, requiresEvidence: true },
      { key: "accident_repair_weld_signs", label: "Accident repair / weld signs", icon: AlertOctagon, requiresEvidence: true },
    ],
  },
  {
    key: "interior", label: "Interior",
    items: [
      { key: "dashboard_warning_lights", label: "Dashboard warning lights", icon: ShieldAlert, requiresEvidence: true },
      { key: "ac_function", label: "Air conditioning", icon: Snowflake, requiresEvidence: false },
      { key: "electronics", label: "Electronics (windows, locks, radio)", icon: Cpu, requiresEvidence: false },
      { key: "seats_belts", label: "Seats & belts", icon: Armchair, requiresEvidence: true },
      { key: "odometer_reading", label: "Odometer reading", icon: Hash, requiresEvidence: true },
    ],
  },
  {
    key: "road_test", label: "Road Test",
    items: [
      { key: "engine_performance_under_load", label: "Engine performance", icon: Zap, requiresEvidence: true },
      { key: "transmission_gearbox", label: "Transmission / gearbox", icon: Settings2, requiresEvidence: true },
      { key: "brakes", label: "Brakes", icon: Disc, requiresEvidence: true },
      { key: "steering_alignment", label: "Steering & alignment", icon: Compass, requiresEvidence: true },
      { key: "unusual_noises_vibrations", label: "Unusual noises / vibrations", icon: Volume2, requiresEvidence: true },
    ],
  },
];
const TOTAL_ITEMS = PCI_SECTIONS.reduce((n, s) => n + s.items.length, 0);

const RATINGS = [
  { value: "good", label: "Good", cls: "border-emerald-500 bg-emerald-500 text-white shadow-emerald-200" },
  { value: "fair", label: "Fair", cls: "border-amber-500 bg-amber-500 text-white shadow-amber-200" },
  { value: "poor", label: "Poor", cls: "border-orange-500 bg-orange-500 text-white shadow-orange-200" },
  { value: "needs_attention", label: "Needs attention", cls: "border-red-600 bg-red-600 text-white shadow-red-200" },
];

const MAX_VIDEO_BYTES = 950_000; // the backend's nginx client_max_body_size is ~1MB (infra config, not fixable from this repo) — this stays a hair under it so the error is ours, not a raw 413.

async function compressImageFile(file, maxDim = 1600, quality = 0.7) {
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], (file.name || "photo").replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // decode failed (unusual format) — fall back to the original file rather than block the mechanic
  }
}

function pickAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return candidates.find((c) => MediaRecorder.isTypeSupported?.(c)) ?? "";
}

function isVideoUrl(url) {
  return /\.(mp4|mov|webm|m4v|3gp)(\?|$)/i.test(url || "");
}

/**
 * Hold-to-record voice note — press and hold to record, release to stop.
 * Pointer Events (not separate touch/mouse handlers) so this works
 * identically whether the mechanic is on a phone or testing on desktop.
 * getUserMedia is requested lazily on the first press, never on page load —
 * a mechanic who never uses voice notes should never see a mic permission
 * prompt. Always stops every audio track on stop AND on unmount, or the
 * phone's mic-in-use indicator stays lit after leaving the page.
 */
function VoiceNoteRecorder({ existingUrl, onRecorded, disabled }) {
  const [phase, setPhase] = useState("idle"); // idle | recording | recorded | error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => {
    stopStream();
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopStream]);

  const startRecording = async (e) => {
    e.preventDefault();
    if (disabled || phase === "recording") return;
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("recorded");
        onRecorded(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(secs);
        if (secs >= 90) stopRecording();
      }, 250);
    } catch {
      setErrorMsg("Couldn't access the microphone — check the browser's microphone permission for this page.");
      setPhase("error");
    }
  };

  const stopRecording = (e) => {
    e?.preventDefault?.();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const reRecord = () => {
    setPreviewUrl(null);
    setPhase("idle");
  };

  if (disabled && !existingUrl) return null;

  const playbackUrl = previewUrl || (existingUrl ? resolveMediaUrl(existingUrl) : null);

  return (
    <div className="mt-2">
      {playbackUrl && phase !== "recording" && (
        <div className="mb-2 flex items-center gap-2">
          <audio controls src={playbackUrl} className="h-9 max-w-[220px]" />
          {!disabled && (
            <button type="button" onClick={reRecord} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600">
              <RotateCcw className="h-3 w-3" /> Re-record
            </button>
          )}
        </div>
      )}
      {!disabled && !playbackUrl && (
        <button
          type="button"
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerLeave={phase === "recording" ? stopRecording : undefined}
          onPointerCancel={stopRecording}
          style={{ touchAction: "none" }}
          className={`flex w-full select-none items-center justify-center gap-2 rounded-xl border-2 py-3 text-[13px] font-bold transition-all ${
            phase === "recording" ? "border-red-500 bg-red-50 text-red-700" : "border-dashed border-slate-300 text-slate-600 active:bg-slate-50"
          }`}
        >
          <Mic className={`h-4.5 w-4.5 ${phase === "recording" ? "animate-pulse" : ""}`} />
          {phase === "recording" ? `Recording… ${elapsed}s (release to stop)` : "Hold to record a voice note"}
        </button>
      )}
      {errorMsg && <p className="mt-1.5 text-[11.5px] text-red-600">{errorMsg}</p>}
    </div>
  );
}

function ReferenceCompare({ reference }) {
  if (!reference?.image_url) return null;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <img src={resolveMediaUrl(reference.image_url)} alt="Reference" className="h-14 w-14 shrink-0 rounded-md object-cover" />
      <p className="text-[11px] text-slate-500">
        {reference.caption || "Compare against this reference photo."}
      </p>
    </div>
  );
}

function ChecklistItemCard({ token, sectionKey, item, existing, reference, linkClosed, onSaved }) {
  const [rating, setRating] = useState(existing?.rating || null);
  const [evidenceUrl, setEvidenceUrl] = useState(existing?.evidence_url || null);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState(existing?.voice_note_url || null);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const Icon = item.icon;
  const isComplete = !!rating && (!item.requiresEvidence || !!evidenceUrl);

  // The backend save endpoint fully replaces all four fields on every call
  // (no partial-field merge) — always send the complete current state, and
  // requires a rating (schema-enforced), so evidence/voice/notes captured
  // before a rating is picked stay local-only until one is tapped.
  const persist = async (next) => {
    if (!next.rating) return;
    setSaving(true);
    setError(null);
    const res = await submitPciChecklistItemByLink(token, sectionKey, item.key, {
      rating: next.rating,
      evidence_url: next.evidenceUrl || undefined,
      voice_note_url: next.voiceNoteUrl || undefined,
      notes: next.notes || undefined,
    });
    setSaving(false);
    if (res.error) {
      setError(res.status === 410 ? "This inspection has been submitted — no further changes can be saved." : res.error);
      return;
    }
    onSaved?.();
  };

  const handleRating = (value) => {
    setRating(value);
    persist({ rating: value, evidenceUrl, voiceNoteUrl, notes });
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
      setError(`This video is too large to upload (${(file.size / 1e6).toFixed(1)}MB) — try a shorter clip, or take a photo instead.`);
      return;
    }
    setUploading(true);
    const toUpload = file.type.startsWith("image/") ? await compressImageFile(file) : file;
    const { data, error: uploadError } = await uploadPciEvidenceByLink(token, toUpload);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Upload failed — try again.");
      return;
    }
    setEvidenceUrl(data.file_url);
    persist({ rating, evidenceUrl: data.file_url, voiceNoteUrl, notes });
  };

  const handleVoiceRecorded = async (blob) => {
    setError(null);
    setUploading(true);
    const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("aac") ? "aac" : "webm";
    const file = new File([blob], `voice-note.${ext}`, { type: blob.type });
    const { data, error: uploadError } = await uploadPciEvidenceByLink(token, file);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Voice note upload failed — try again.");
      return;
    }
    setVoiceNoteUrl(data.file_url);
    persist({ rating, evidenceUrl, voiceNoteUrl: data.file_url, notes });
  };

  const handleNotesBlur = () => {
    if (notes === (existing?.notes || "")) return;
    persist({ rating, evidenceUrl, voiceNoteUrl, notes });
  };

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all ${isComplete ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isComplete ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
          {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <p className="text-[14.5px] font-bold text-slate-900">{item.label}</p>
      </div>

      <ReferenceCompare reference={reference} />

      <div className="mt-3 grid grid-cols-2 gap-2">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={linkClosed}
            onClick={() => handleRating(r.value)}
            className={`rounded-xl border-2 py-3.5 text-[13px] font-bold transition-all disabled:opacity-50 ${
              rating === r.value ? `${r.cls} shadow-md` : "border-slate-200 bg-white text-slate-600 active:bg-slate-50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-2.5">
        {evidenceUrl ? (
          <div className="flex items-center gap-2">
            {isVideoUrl(evidenceUrl) ? (
              <a href={resolveMediaUrl(evidenceUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-600">
                <Video className="h-4 w-4" /> Video attached
              </a>
            ) : (
              <a href={resolveMediaUrl(evidenceUrl)} target="_blank" rel="noreferrer">
                <img src={resolveMediaUrl(evidenceUrl)} alt="Evidence" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
              </a>
            )}
            {!linkClosed && (
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600">
                <RotateCcw className="h-3 w-3" /> Replace
                <input type="file" accept="image/*,video/*" capture="environment" disabled={uploading || linkClosed} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
              </label>
            )}
          </div>
        ) : (
          !linkClosed && (
            <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3.5 text-[13px] font-bold transition-all ${item.requiresEvidence ? "border-slate-300 text-slate-600" : "border-slate-200 text-slate-400"}`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploading ? "Uploading…" : item.requiresEvidence ? "Take photo or video" : "Take photo or video (optional)"}
              <input type="file" accept="image/*,video/*" capture="environment" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
            </label>
          )
        )}
      </div>

      <VoiceNoteRecorder existingUrl={voiceNoteUrl} onRecorded={handleVoiceRecorded} disabled={linkClosed} />

      {!linkClosed && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Notes (optional — or just use the voice note above)"
          rows={1}
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-[#28A745]"
        />
      )}
      {!!notes && linkClosed && <p className="mt-2 text-[12px] text-slate-500">{notes}</p>}

      {!rating && (evidenceUrl || voiceNoteUrl) && !linkClosed && (
        <p className="mt-1.5 text-[11.5px] font-semibold text-amber-600">Pick a rating above to save this item.</p>
      )}
      {error && <p className="mt-1.5 text-[11.5px] text-red-600">{error}</p>}
      {saving && <p className="mt-1.5 text-[11px] text-slate-400">Saving…</p>}
    </div>
  );
}

export default function MechanicLinkPage() {
  const params = useParams();
  const token = params?.token;

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [markedComplete, setMarkedComplete] = useState(false);

  const load = useCallback(async () => {
    const res = await getPciChecklistByLink(token);
    if (res.error || !res.data) {
      setNotFound(true);
    } else {
      setChecklist(res.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (notFound || !checklist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-3 text-[16px] font-bold text-slate-800">This link isn't valid</h1>
          <p className="mt-1.5 text-[13px] text-slate-500">Double check the link staff sent you, or ask them to resend it.</p>
        </div>
      </div>
    );
  }

  const itemsByKey = Object.fromEntries((checklist.items || []).map((i) => [`${i.section_key}.${i.item_key}`, i]));
  const referenceByKey = Object.fromEntries((checklist.reference_images || []).map((r) => [`${r.section_key}.${r.item_key}`, r]));
  const completedCount = PCI_SECTIONS.reduce(
    (n, s) => n + s.items.filter((it) => {
      const existing = itemsByKey[`${s.key}.${it.key}`];
      return existing?.rating && (!it.requiresEvidence || existing?.evidence_url);
    }).length,
    0
  );
  const linkClosed = checklist.is_closed;

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    const res = await markPciMechanicComplete(token);
    setMarkingComplete(false);
    if (!res.error) setMarkedComplete(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur">
        <p className="text-[15px] font-bold text-slate-900">{checklist.make} {checklist.model} — {checklist.plate_number}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
          {checklist.location_address && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {checklist.location_address}</span>
          )}
          {checklist.confirmed_visit_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(checklist.confirmed_visit_date).toLocaleDateString()}
              {checklist.confirmed_visit_time ? ` (${checklist.confirmed_visit_time})` : ""}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all" style={{ width: `${(completedCount / TOTAL_ITEMS) * 100}%`, background: BRAND }} />
          </div>
          <span className="shrink-0 text-[12px] font-bold text-slate-600">{completedCount}/{TOTAL_ITEMS}</span>
        </div>
      </div>

      {linkClosed && (
        <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-[12.5px] font-semibold text-slate-600">
          <Lock className="h-4 w-4 shrink-0" />
          This inspection has been submitted for review — it's now read-only.
        </div>
      )}

      <div className="space-y-5 px-4 py-5">
        {PCI_SECTIONS.map((section) => (
          <div key={section.key} className="space-y-2.5">
            <h2 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-500">{section.label}</h2>
            {section.items.map((item) => (
              <ChecklistItemCard
                key={item.key}
                token={token}
                sectionKey={section.key}
                item={item}
                existing={itemsByKey[`${section.key}.${item.key}`]}
                reference={referenceByKey[`${section.key}.${item.key}`]}
                linkClosed={linkClosed}
                onSaved={load}
              />
            ))}
          </div>
        ))}
      </div>

      {!linkClosed && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur">
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={markingComplete || markedComplete}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {markingComplete ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
            {markedComplete ? "Marked as done — staff will review" : markingComplete ? "Saving…" : "Mark inspection as done"}
          </button>
          {completedCount < TOTAL_ITEMS && (
            <p className="mt-2 text-center text-[11px] text-slate-400">{TOTAL_ITEMS - completedCount} item{TOTAL_ITEMS - completedCount === 1 ? "" : "s"} still need a rating.</p>
          )}
        </div>
      )}
    </div>
  );
}
