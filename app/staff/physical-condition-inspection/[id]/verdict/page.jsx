"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, XOctagon, Plus, X, Send } from "lucide-react";
import { getStaffApplication, submitPciVerdict, uploadApplicationFile, resolveMediaUrl } from "@/lib/api";
import { Button, Card, ErrorState, Field, Input, Notice, PageHeader, StickyActionBar, Textarea } from "@/app/dashboard/_kit";
import { Spinner } from "@/app/components/portal/ui";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const VERDICTS = [
  { value: "buy", label: "Buy", hint: "Sound condition — recommend the purchase.", icon: CheckCircle2, active: "border-cx-brand bg-cx-brand-soft", iconCls: "text-cx-brand-deep" },
  { value: "proceed_with_caution", label: "Proceed with caution", hint: "Buyable, but with known issues to weigh.", icon: AlertTriangle, active: "border-cx-amber bg-cx-amber-soft", iconCls: "text-cx-amber" },
  { value: "dont_buy", label: "Don't buy", hint: "Not recommended in its current condition.", icon: XOctagon, active: "border-cx-red bg-cx-red-soft", iconCls: "text-cx-red" },
];

const MAX_REPORT_IMAGES = 6;

export default function StaffPciVerdictPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id ? String(params.id).replace(/^app_/, "") : null;
  const appId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : rawId;

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
    if (!appId) {
      setLoading(false);
      return;
    }
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

  if (loading) return <Spinner label="Loading inspection…" />;

  if (error || !application) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Record verdict" backHref="/staff/applications" backLabel="Back to applications" />
        <ErrorState title="Application not found" message={error || "This application doesn't exist or you can't see it."} />
      </div>
    );
  }

  const detail = application.pci_detail || {};
  const notReady = application.status !== "awaiting_mechanic_verdict";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        backHref={`/staff/physical-condition-inspection/${appId}`}
        backLabel="Back to checklist"
        title={<>Record verdict <span className="font-mono text-[17px] text-cx-muted">#{appId}</span></>}
        description={`${detail.make || ""} ${detail.model || ""} — ${detail.plate_number || ""}. Based on the reviewing mechanic's call relayed over WhatsApp. Submitting this releases the report to the customer straight away.`}
      />

      {notReady ? (
        <Notice tone="amber" title="Not ready for a verdict yet">
          This application is at status &ldquo;{application.status}&rdquo;. A verdict can only be recorded once staff have confirmed the checklist is complete.
        </Notice>
      ) : (
        <div className="space-y-4">
          <Card>
            <h2 className="text-[16px] font-semibold text-cx-ink">Verdict</h2>
            <div className="mt-3 grid gap-2.5" role="radiogroup" aria-label="Verdict">
              {VERDICTS.map((v) => {
                const Icon = v.icon;
                const active = verdict === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setVerdict(v.value)}
                    className={cx(
                      "cx-focus flex min-h-16 w-full items-start gap-3 rounded-cx-lg border-2 p-4 text-left transition-colors",
                      active ? v.active : "border-cx-line bg-cx-surface hover:bg-cx-sunken"
                    )}
                  >
                    <Icon className={cx("mt-0.5 h-6 w-6 shrink-0", active ? v.iconCls : "text-cx-muted")} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold text-cx-ink">{v.label}</span>
                      <span className="mt-0.5 block text-sm text-cx-ink-2">{v.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <Field label="Written report" required hint="This goes straight into the customer's PDF.">
              {(p) => (
                <Textarea
                  {...p}
                  rows={6}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Explain the reasoning behind the verdict — what the mechanic found, what to negotiate on, and any risks the buyer should know about."
                />
              )}
            </Field>
          </Card>

          <Card>
            <h2 className="text-[16px] font-semibold text-cx-ink">Supporting photos</h2>
            <p className="mt-0.5 text-[13px] text-cx-muted">Optional, up to {MAX_REPORT_IMAGES}. {images.length} added.</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {images.map((img, idx) => (
                <li key={idx} className="overflow-hidden rounded-cx border border-cx-line bg-cx-sunken">
                  <div className="relative aspect-[4/3] w-full">
                    <img src={resolveMediaUrl(img.image_url)} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label={`Remove photo ${idx + 1}`}
                      className="cx-focus absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-cx-surface text-cx-ink-2 shadow-cx hover:text-cx-red"
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <Input
                      value={img.caption}
                      onChange={(e) => handleCaptionChange(idx, e.target.value)}
                      placeholder="Caption (optional)"
                      aria-label={`Caption for photo ${idx + 1}`}
                    />
                  </div>
                </li>
              ))}
              {images.length < MAX_REPORT_IMAGES ? (
                <li>
                  <label
                    className={cx(
                      "flex min-h-[76px] h-full cursor-pointer items-center justify-center gap-2 rounded-cx border-2 border-dashed border-cx-line-strong bg-cx-surface px-4 py-3 text-[15px] font-semibold text-cx-ink-2 transition-colors hover:border-cx-brand/60 focus-within:ring-4 focus-within:ring-[color:var(--cx-focus)]",
                      uploading && "cursor-not-allowed opacity-70"
                    )}
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Plus className="h-5 w-5" aria-hidden />}
                    {uploading ? "Uploading…" : "Add photo"}
                    <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleAddImage(e.target.files?.[0])} className="sr-only" />
                  </label>
                </li>
              ) : null}
            </ul>
          </Card>

          <StickyActionBar edge>
            <div className="w-full space-y-2">
              {submitError ? <Notice tone="red">{submitError}</Notice> : null}
              {!canSubmit ? <p className="text-[13px] text-cx-muted">Choose a verdict and write the report to submit.</p> : null}
              <Button size="lg" block icon={Send} loading={submitting} disabled={!canSubmit} onClick={handleSubmit}>
                {submitting ? "Releasing…" : "Submit verdict and release report"}
              </Button>
            </div>
          </StickyActionBar>
        </div>
      )}
    </div>
  );
}
