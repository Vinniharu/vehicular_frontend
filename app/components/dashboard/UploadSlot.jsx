"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { uploadApplicationFile } from "@/lib/api";

const BRAND = "#28A745";

/* Shared document-upload card used across every apply wizard with a photo-
   thumbnail-style document slot (Number Plate, Tinted Permit, Vehicle
   Particulars, and — going forward — any new wizard). Was previously
   three byte-for-byte-identical copy-pasted components; consolidated here
   so the legibility fix below (and any future fix) only needs to ship
   once. */
export default function UploadSlot({ slot, value, onChange }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Upload failed. Please try again.");
      return;
    }
    onChange({ fileName: file.name, url: data.file_url });
  };

  const handleRemove = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onChange(null);
  };

  const bgStyle = (url) => ({
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: "#f8fafc",
  });

  if (!value?.url) {
    return (
      <label
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
        className="relative flex aspect-[4/3] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border-2 transition-all"
        style={{ borderColor: dragActive ? BRAND : "#E5E5E5", ...bgStyle(slot.image) }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/50" />
        <div className="relative z-[1] p-3.5">
          {/* Solid-enough backing behind the title/hint text — the gradient
              scrim + drop-shadow alone weren't reliably legible over
              light/busy document photos. */}
          <div className="inline-block max-w-full rounded-lg bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
            <p className="text-[13px] font-semibold text-white">{slot.title}</p>
            {slot.hint && <p className="mt-0.5 text-[11px] text-white/85">{slot.hint}</p>}
          </div>
        </div>
        <div className="relative z-[1] p-3.5">
          <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2.5">
            <Upload className="h-4 w-4 shrink-0" style={{ color: BRAND }} />
            <span className="text-[12px] font-semibold text-slate-700">
              {uploading ? "Uploading…" : "Click or drop a file here"}
            </span>
          </div>
          {error && <p className="mt-1.5 rounded-md bg-red-600/90 px-2 py-1 text-[11px] font-medium text-white">{error}</p>}
          <p className="mt-1.5 text-[10.5px] text-white/70 drop-shadow-sm">JPG, PNG, WEBP, HEIC, or PDF · up to 10 MB</p>
        </div>
        <input
          type="file"
          accept="image/*,application/pdf"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </label>
    );
  }

  return (
    <div
      className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl border-2"
      style={{ borderColor: BRAND, ...bgStyle(previewUrl) }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/40" />
      <div className="relative z-[1] p-3.5">
        <div className="inline-block max-w-full rounded-lg bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="text-[13px] font-semibold text-white">{slot.title}</p>
        </div>
      </div>
      <div className="relative z-[1] flex items-center justify-between gap-2 p-3.5">
        <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="truncate text-[12px] font-semibold text-[#111111]">{value.fileName}</p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="shrink-0 rounded-xl bg-white/95 px-3 py-2.5 text-[11px] font-semibold text-red-600 hover:bg-white"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
