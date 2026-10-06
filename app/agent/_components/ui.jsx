"use client";

// Agent portal building blocks on top of the customer portal kit
// (app/dashboard/_kit). Same cx tokens, slightly denser layouts.

import { useState } from "react";
import { Check, ChevronDown, Copy, FileText, Loader2, Timer, Upload } from "lucide-react";
import { uploadApplicationFile } from "@/lib/api";
import { validateUploadFile } from "@/lib/utils/fileValidation";
import { Badge } from "@/app/dashboard/_kit";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── Status ─────────────────────────────────────────────────────────── */

export function StagePill({ stage, className }) {
  return (
    <Badge tone={stage.tone} className={className}>
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          stage.tone === "brand" ? "bg-cx-brand" : stage.tone === "amber" ? "bg-cx-amber" : stage.tone === "red" ? "bg-cx-red" : "bg-cx-muted"
        )}
        aria-hidden
      />
      {stage.label}
    </Badge>
  );
}

export function SlaChip({ sla, compact = false }) {
  if (!sla || sla.is_completed) return null;
  const tone = sla.is_breached ? "red" : sla.is_nearing ? "amber" : "neutral";
  const due = sla.target_deadline
    ? new Date(sla.target_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;
  return (
    <Badge tone={tone}>
      <Timer className="h-3.5 w-3.5" aria-hidden />
      {sla.is_breached ? "Overdue" : compact ? `${sla.days_remaining ?? "—"}d left` : `${sla.days_remaining ?? "—"} days left`}
      {!compact && due ? ` · due ${due}` : ""}
    </Badge>
  );
}

/* ── Details ────────────────────────────────────────────────────────── */

export function Info({ label, value, mono, copy, wide }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={cx("min-w-0", wide && "col-span-2")}>
      <dt className="text-[13px] text-cx-muted">{label}</dt>
      <dd className={cx("mt-0.5 flex items-center gap-1.5 break-words text-[15px] font-medium text-cx-ink", mono && "font-mono text-[14px]")}>
        <span className="min-w-0">{empty ? "—" : value}</span>
        {copy && !empty ? <CopyButton value={String(value)} label={label} /> : null}
      </dd>
    </div>
  );
}

export function InfoGrid({ children }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3">{children}</dl>;
}

export function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label || "value"}`}
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="cx-focus inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-cx-sm text-cx-muted hover:bg-cx-sunken hover:text-cx-ink"
    >
      {copied ? <Check className="h-4 w-4 text-cx-brand" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
    </button>
  );
}

// A card whose body can be collapsed. Secondary information lives in these
// so the next step stays at the top of the page on a phone.
export function Collapsible({ title, icon: Icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="cx-focus flex min-h-14 w-full items-center gap-3 rounded-cx-lg px-4 text-left sm:px-5"
      >
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-cx-muted" aria-hidden /> : null}
        <span className="flex-1 text-[16px] font-semibold text-cx-ink">
          {title}
          {count !== undefined ? <span className="ml-1.5 font-normal text-cx-muted">({count})</span> : null}
        </span>
        <ChevronDown className={cx("h-5 w-5 text-cx-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? <div className="border-t border-cx-line px-4 py-4 sm:px-5">{children}</div> : null}
    </section>
  );
}

/* ── Progress ───────────────────────────────────────────────────────── */

export function ProgressSteps({ steps, current }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Job progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={cx("h-1.5 rounded-full", done ? "bg-cx-brand" : active ? "bg-cx-brand/45" : "bg-cx-line")} aria-hidden />
            <span className={cx("truncate text-xs", active ? "font-semibold text-cx-ink" : done ? "text-cx-ink-2" : "text-cx-muted")}>
              {label}
              <span className="sr-only">{done ? " (done)" : active ? " (current step)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Upload ─────────────────────────────────────────────────────────── */

const isImage = (url) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url || "") || (url || "").startsWith("data:image");

/**
 * Large tap target that uploads one file and hands back its URL. Phones get
 * the camera or the file picker; PDFs are allowed unless `accept` says not.
 */
export function UploadBox({ label = "Add a photo or PDF", value, fileName, onUploaded, onError, accept = "image/*,application/pdf", capture, disabled, previewSrc }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handle = async (file) => {
    if (!file) return;
    setError(null);
    onError?.(null);
    const check = validateUploadFile(file, { maxSizeMb: 10 });
    if (!check.valid) {
      setError(check.error);
      onError?.(check.error);
      return;
    }
    setUploading(true);
    const { data, error: err } = await uploadApplicationFile(file);
    setUploading(false);
    if (err || !data?.file_url) {
      const msg = err || "Upload failed. Check your connection and try again.";
      setError(msg);
      onError?.(msg);
      return;
    }
    onUploaded?.({ url: data.file_url, fileName: file.name });
  };

  const thumb = previewSrc || value;
  return (
    <div className="space-y-1.5">
      <label
        className={cx(
          "flex min-h-[76px] cursor-pointer focus-within:ring-4 focus-within:ring-[color:var(--cx-focus)] items-center gap-3 rounded-cx border-2 border-dashed px-4 py-3 transition-colors",
          error ? "border-cx-red bg-cx-red-soft" : value ? "border-cx-brand/50 bg-cx-brand-soft/60" : "border-cx-line-strong bg-cx-surface hover:border-cx-brand/60",
          (uploading || disabled) && "cursor-not-allowed opacity-70"
        )}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-cx-sm bg-cx-sunken text-cx-muted">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : value && isImage(thumb) ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : value ? (
            <FileText className="h-5 w-5 text-cx-brand-deep" aria-hidden />
          ) : (
            <Upload className="h-5 w-5" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-cx-ink">
            {uploading ? "Uploading…" : value ? fileName || "File added" : label}
          </span>
          <span className="block text-[13px] text-cx-muted">
            {uploading ? "Keep this screen open" : value ? "Tap to replace" : "JPG, PNG or PDF, up to 10 MB"}
          </span>
        </span>
        <input
          type="file"
          accept={accept}
          capture={capture}
          disabled={uploading || disabled}
          className="sr-only"
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error ? <p className="text-[13px] font-medium text-cx-red">{error}</p> : null}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cx-brand-soft border-t-cx-brand" />
      <p className="text-sm text-cx-muted">{label}</p>
    </div>
  );
}
