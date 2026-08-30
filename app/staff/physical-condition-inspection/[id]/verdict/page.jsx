"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XOctagon, Plus, X, Send } from "lucide-react";
import { getStaffApplication, submitPciVerdict, uploadApplicationFile, resolveMediaUrl } from "@/lib/api";

const BRAND = "#28A745";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const inputBase =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";

const VERDICTS = [
  { value: "buy", label: "Buy", hint: "Sound condition — recommend the purchase.", icon: CheckCircle2, cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "proceed_with_caution", label: "Proceed with caution", hint: "Buyable, but with known issues to weigh.", icon: AlertTriangle, cls: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "dont_buy", label: "Don't buy", hint: "Not recommended in its current condition.", icon: XOctagon, cls: "border-red-400 bg-red-50 text-red-700" },
];

const MAX_REPORT_IMAGES = 6;

export default function StaffPciVerdictPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params?.id ? Number(params.id) : null;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [verdict, setVerdict] = useState(null);
  const [reportText, setReportText] = useState("");
  const [images, setImages] = useState([]); // [{image_url, caption}]
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    getStaffApplication(appId).then((res) => {
      if (res.error) setError(res.error);
      else setApplication(res.data);
      setLoading(false);
    });
  }, [appId]);

  const handleAddImage = async (file) => {
    if (!file || images.length >= MAX_REPORT_IMAGES) return;
    setUploading(true);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setSubmitError(uploadError || "Upload failed — try again.");
      return;
    }
    setImages((imgs) => [...imgs, { image_url: data.file_url, caption: "" }]);
  };

  const handleCaptionChange = (idx, caption) => {
    setImages((imgs) => imgs.map((img, i) => (i === idx ? { ...img, caption } : img)));
  };

  const handleRemoveImage = (idx) => {
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  };

  const canSubmit = !!verdict && reportText.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitPciVerdict(appId, {
      verdict,
      report_text: reportText.trim(),
      report_images: images.map((img) => ({ image_url: img.image_url, caption: img.caption?.trim() || undefined })),
    });
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
        <Link href="/staff/applications" className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Back to applications</Link>
      </div>
    );
  }

  const detail = application.pci_detail || {};
  const notReady = application.status !== "awaiting_mechanic_verdict";

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-16">
      <Link href={`/staff/physical-condition-inspection/${appId}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to checklist
      </Link>

      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
          Record verdict <span className="font-mono text-[15px] text-slate-400">#{appId}</span>
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          {detail.make} {detail.model} — {detail.plate_number}. Informed by the reviewing mechanic's WhatsApp-relayed call — submitting this releases the report to the customer immediately.
        </p>
      </div>

      {notReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[13px] font-semibold text-amber-800">
          This application is at status "{application.status}" — a verdict can only be recorded once staff have confirmed checklist completeness.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Verdict</label>
            <div className="space-y-2">
              {VERDICTS.map((v) => {
                const Icon = v.icon;
                const active = verdict === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVerdict(v.value)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${active ? v.cls : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-[13.5px] font-bold">{v.label}</p>
                      <p className="mt-0.5 text-[12px] opacity-80">{v.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Written report</label>
            <textarea
              rows={6}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Explain the reasoning behind the verdict — what the mechanic found, what to negotiate on, and any risks the buyer should know about. This goes straight into the customer's PDF."
              className={inputBase}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Supporting photos (optional, up to {MAX_REPORT_IMAGES})</label>
            <div className="space-y-2">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <img src={resolveMediaUrl(img.image_url)} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                  <input
                    type="text"
                    value={img.caption}
                    onChange={(e) => handleCaptionChange(idx, e.target.value)}
                    placeholder="Caption (optional)"
                    className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-[#28A745]"
                  />
                  <button type="button" onClick={() => handleRemoveImage(idx)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {images.length < MAX_REPORT_IMAGES && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {uploading ? "Uploading…" : "Add photo"}
                <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleAddImage(e.target.files?.[0])} className="hidden" />
              </label>
            )}
          </div>

          {submitError && <p className="text-[13px] font-semibold text-red-600">{submitError}</p>}
          <button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Releasing…" : "Submit verdict & release report"}
          </button>
        </>
      )}
    </div>
  );
}
