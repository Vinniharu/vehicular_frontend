"use client";

import { useState, useEffect } from "react";
import { Camera, Loader2, CheckCircle2, AlertCircle, X, Upload } from "lucide-react";
import { adminListPciReferenceImages, adminUpsertPciReferenceImage, uploadApplicationFile, resolveMediaUrl } from "@/lib/api";

const BRAND = "#28A745";

// Display grouping only — the backend's PCI_CHECKLIST_SECTIONS
// (app/modules/driver_licence/router.py) is the source of truth for which
// (section_key, item_key) pairs are legal; this just needs matching labels.
const SECTION_LABELS = {
  exterior_body: "Exterior & Body",
  engine_bay: "Engine Bay",
  underbody: "Underbody",
  interior: "Interior",
  road_test: "Road Test",
};

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 pl-4 pr-5 py-3.5 rounded-xl shadow-xl border text-[13px] font-medium max-w-sm transition-all ${
      toast.type === "success" ? "bg-white border-emerald-200 text-slate-800" : "bg-white border-red-200 text-slate-800"
    }`}>
      {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#28A745]" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />}
      <span className="flex-1 leading-snug">{toast.msg}</span>
      <button type="button" onClick={onDismiss} className="ml-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
    </div>
  );
}

function ReferenceImageRow({ row, onUpdated, onError }) {
  const [caption, setCaption] = useState(row.caption || "");
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { data, error } = await uploadApplicationFile(file);
    if (error || !data?.file_url) {
      setUploading(false);
      onError(error || "Upload failed — try again.");
      return;
    }
    const res = await adminUpsertPciReferenceImage(row.section_key, row.item_key, { image_url: data.file_url, caption: caption.trim() || undefined });
    setUploading(false);
    if (res.error) {
      onError(res.error);
      return;
    }
    onUpdated(res.data);
  };

  const handleCaptionBlur = async () => {
    if (!row.image_url || caption === (row.caption || "")) return;
    const res = await adminUpsertPciReferenceImage(row.section_key, row.item_key, { image_url: row.image_url, caption: caption.trim() || undefined });
    if (res.error) onError(res.error);
    else onUpdated(res.data);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <label className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : row.image_url ? (
          <img src={resolveMediaUrl(row.image_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-5 w-5 text-slate-300" />
        )}
        <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
      </label>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold capitalize text-slate-800">{row.item_key.replace(/_/g, " ")}</p>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={handleCaptionBlur}
          placeholder="Caption (optional) — e.g. 'Healthy oil colour'"
          className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-[11.5px] outline-none focus:border-[#28A745]"
        />
      </div>
      {row.image_url && (
        <label className="shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
        </label>
      )}
    </div>
  );
}

export default function AdminPciReferenceImagesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    adminListPciReferenceImages().then((res) => {
      if (res.data) setRows(res.data);
      setLoading(false);
    });
  }, []);

  const showError = (msg) => setToast({ type: "error", msg });

  const handleUpdated = (updated) => {
    setRows((rs) => rs.map((r) => (r.section_key === updated.section_key && r.item_key === updated.item_key ? updated : r)));
    setToast({ type: "success", msg: "Saved." });
  };

  const sections = Object.entries(
    rows.reduce((acc, r) => {
      (acc[r.section_key] ||= []).push(r);
      return acc;
    }, {})
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">PCI Reference Photos</h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          "What does good look like?" comparison photos — shown to the field mechanic on their inspection link and to
          staff on the completeness dashboard, next to each checklist item. Ships empty; upload real photos here as
          they become available. An item with no photo simply shows nothing extra — never a placeholder.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        sections.map(([sectionKey, items]) => (
          <div key={sectionKey} className="space-y-2.5">
            <h2 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-500">{SECTION_LABELS[sectionKey] || sectionKey}</h2>
            <div className="space-y-2">
              {items.map((row) => (
                <ReferenceImageRow key={`${row.section_key}.${row.item_key}`} row={row} onUpdated={handleUpdated} onError={showError} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
