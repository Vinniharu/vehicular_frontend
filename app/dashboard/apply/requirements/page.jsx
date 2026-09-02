"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileText,
  Upload,
  ListChecks,
  Info,
} from "lucide-react";
import { getApplicationRequirements, getApplicationDraft, deleteApplicationDraft } from "@/lib/api";
import { btnPrimary, btnSecondary } from "@/app/dashboard/_shared/ui";
import { getStartUrl, getWizardKeyForApplicationType, getWizardKeyMeta } from "@/lib/draft-registry";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69, 0.08)";

function RequirementItem({ label, sub, required }) {
  return (
    <li className="flex items-start gap-2.5 py-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
      <div>
        <p className="text-[13.5px] text-[#111111]">
          {label}
          {!required && <span className="ml-1.5 text-[11px] font-medium text-slate-400">(optional)</span>}
        </p>
        {sub && <p className="mt-0.5 text-[12px] text-slate-500">{sub}</p>}
      </div>
    </li>
  );
}

function RequirementsPreviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationType = searchParams.get("type");

  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingDraft, setExistingDraft] = useState(null);
  const [checkingDraft, setCheckingDraft] = useState(true);

  useEffect(() => {
    if (!applicationType) {
      setError("No application type specified.");
      setLoading(false);
      return;
    }
    getApplicationRequirements(applicationType).then((res) => {
      if (res.data) {
        setSpec(res.data);
      } else {
        setError(res.error || "Could not load requirements for this service.");
      }
      setLoading(false);
    });

    const wizardKey = getWizardKeyForApplicationType(applicationType);
    getApplicationDraft(wizardKey).then((res) => {
      setExistingDraft(res.data || null);
      setCheckingDraft(false);
    });
  }, [applicationType]);

  const startUrl = applicationType ? getStartUrl(applicationType) : "/dashboard/applications";
  const wizardKey = applicationType ? getWizardKeyForApplicationType(applicationType) : null;
  const wizardMeta = wizardKey ? getWizardKeyMeta(wizardKey) : null;

  const handleStartFresh = async () => {
    if (existingDraft && wizardKey) {
      await deleteApplicationDraft(wizardKey);
    }
    router.push(startUrl);
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-[14px] text-slate-500">{error || "Something went wrong."}</p>
        <button type="button" onClick={() => router.push("/dashboard")} className={`${btnSecondary} mt-4`}>
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6 pb-20">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Before you start</span>
        </div>
        <h1
          className="mt-1.5 text-[28px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          {spec.title}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          Here's everything you'll need to have ready. Gathering these first makes the actual form quick to fill in.
        </p>
      </div>

      {!checkingDraft && existingDraft && (
        <div
          className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: BRAND, background: BRAND_TINT }}
        >
          <div>
            <p className="text-[13.5px] font-semibold text-[#111111]">You have an unfinished {spec.title.toLowerCase()} application</p>
            <p className="mt-0.5 text-[12px] text-slate-500">
              {existingDraft.step_label ? `You were on ${existingDraft.step_label}.` : "Pick up where you left off, or start over."}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => router.push(wizardMeta?.resumeUrl || startUrl)}
              className={btnPrimary}
              style={{ background: BRAND }}
            >
              Resume
            </button>
            <button type="button" onClick={handleStartFresh} className={btnSecondary}>
              Start over
            </button>
          </div>
        </div>
      )}

      {spec.fields?.length > 0 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-slate-400" />
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">Information you'll provide</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {spec.fields.map((f) => (
              <RequirementItem key={f.name} label={f.label} sub={f.condition || f.why} required={f.required} />
            ))}
          </ul>
        </section>
      )}

      {spec.uploads?.length > 0 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <Upload className="h-4 w-4 text-slate-400" />
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">Uploads</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {spec.uploads.map((u) => (
              <RequirementItem key={u.field} label={u.label} required={u.required} />
            ))}
          </ul>
        </section>
      )}

      {spec.documents?.length > 0 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">Documents</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {spec.documents.map((d) => (
              <RequirementItem key={d.doc_type} label={d.label} sub={d.condition} required={d.required} />
            ))}
          </ul>
        </section>
      )}

      {spec.notes?.length > 0 && (
        <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <h2 className="text-[11.5px] font-bold uppercase tracking-wide text-slate-400">Good to know</h2>
          </div>
          <ul className="space-y-1.5">
            {spec.notes.map((note, i) => (
              <li key={i} className="text-[12.5px] leading-relaxed text-slate-500">
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!existingDraft && (
        <button type="button" onClick={() => router.push(startUrl)} className={`${btnPrimary} w-full sm:w-auto`} style={{ background: BRAND }}>
          Start Application
        </button>
      )}
    </div>
  );
}

export default function RequirementsPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      }
    >
      <RequirementsPreviewInner />
    </Suspense>
  );
}
