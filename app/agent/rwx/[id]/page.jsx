"use client";

// Roadworthiness inspection: the agent records ten fixed checks (pass/fail
// plus a photo each) and submits them for staff review.

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Send, XCircle } from "lucide-react";
import { getApplication, resolveMediaUrl, submitRwxChecklist, submitRwxChecklistItem } from "@/lib/api";
import { Button, Card, ErrorState, Field, Notice, StickyActionBar, Textarea } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import AgentApplicationChatSection from "@/app/components/design/AgentApplicationChatSection";
import { jobStage } from "../../_components/jobs";
import { Info, InfoGrid, Spinner, UploadBox } from "../../_components/ui";
import { CustomerCard, JobHeader, NextStep, StaffNote, reworkNote } from "../../_components/JobShell";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// Mirrors RWX_CHECKLIST_ITEM_KEYS in the backend, in display order.
const CHECKLIST = [
  { key: "tyres", label: "Tyres", hint: "Tread depth and condition, all round" },
  { key: "brakes", label: "Brakes", hint: "They work properly" },
  { key: "lights", label: "Lights", hint: "Headlights, indicators, brake lights" },
  { key: "steering_suspension", label: "Steering and suspension" },
  { key: "windscreen_mirrors", label: "Windscreen and mirrors" },
  { key: "seatbelts", label: "Seatbelts" },
  { key: "horn", label: "Horn" },
  { key: "exhaust_emissions", label: "Exhaust and emissions" },
  { key: "chassis_body", label: "Chassis and body" },
  { key: "overall_verdict", label: "Overall result", hint: "Based on everything above", pass: "Roadworthy", fail: "Not roadworthy" },
];

function CheckItem({ item, index, existing, canEdit, onSave, onPreview }) {
  const [result, setResult] = useState(existing?.result || null);
  const [photo, setPhoto] = useState(existing?.evidence_url || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const saved = !!(existing?.result && existing?.evidence_url);
  const dirty = result !== (existing?.result || null) || photo !== (existing?.evidence_url || "") || notes !== (existing?.notes || "");

  const save = async () => {
    if (!result || !photo) return setError("Choose pass or fail and add a photo.");
    setSaving(true);
    setError(null);
    const res = await onSave(item.key, { result, evidence_url: photo, notes: notes || undefined });
    setSaving(false);
    if (res?.error) setError(res.error);
  };

  return (
    <li className={cx("rounded-cx-lg border bg-cx-surface p-4 shadow-cx", saved && !dirty ? "border-cx-brand/40" : "border-cx-line")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold text-cx-ink">
            <span className="mr-1.5 text-cx-muted">{index + 1}.</span>
            {item.label}
          </p>
          {item.hint ? <p className="text-[13px] text-cx-muted">{item.hint}</p> : null}
        </div>
        {saved && !dirty ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-cx-brand-deep">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Saved
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={`${item.label} result`}>
        {[
          ["pass", item.pass || "Pass", CheckCircle2],
          ["fail", item.fail || "Fail", XCircle],
        ].map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={result === value}
            disabled={!canEdit}
            onClick={() => setResult(value)}
            className={cx(
              "cx-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-cx border text-[15px] font-semibold disabled:opacity-70",
              result === value
                ? value === "pass"
                  ? "border-cx-brand bg-cx-brand-soft text-cx-brand-deep"
                  : "border-cx-red bg-cx-red-soft text-cx-red"
                : "border-cx-line-strong text-cx-ink-2 hover:bg-cx-sunken"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {canEdit ? (
          <UploadBox
            label="Take a photo"
            accept="image/*"
            capture="environment"
            value={photo}
            fileName={photo ? "Photo added" : ""}
            previewSrc={photo ? resolveMediaUrl(photo) : undefined}
            onUploaded={({ url }) => setPhoto(url)}
          />
        ) : photo ? (
          <Button variant="secondary" size="sm" onClick={() => onPreview(resolveMediaUrl(photo))}>View photo</Button>
        ) : null}
      </div>

      {canEdit ? (
        <>
          <Field label="Notes" optional className="mt-3">
            {(p) => <Textarea {...p} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
          {error ? <p className="mt-2 text-[13px] font-medium text-cx-red">{error}</p> : null}
          {dirty || !saved ? (
            <Button className="mt-3" variant={saved ? "secondary" : "soft"} loading={saving} disabled={!result || !photo} onClick={save}>
              {saved ? "Save changes" : "Save check"}
            </Button>
          ) : null}
        </>
      ) : existing?.notes ? (
        <p className="mt-2 text-sm text-cx-ink-2">{existing.notes}</p>
      ) : null}
    </li>
  );
}

export default function AgentRwxPage() {
  const { id: appId } = useParams();
  const router = useRouter();
  const pushToast = useToast();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    const res = await getApplication(appId);
    if (res.error) setError(res.error);
    else setApplication(res.data);
    setLoading(false);
  }, [appId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Loading inspection…" />;
  if (error || !application) return <ErrorState title="Inspection not found" message={error} onRetry={load} />;

  const byKey = Object.fromEntries((application.rwx_checklist_items || []).map((i) => [i.item_key, i]));
  const doneCount = CHECKLIST.filter((c) => byKey[c.key]?.result && byKey[c.key]?.evidence_url).length;
  const allDone = doneCount === CHECKLIST.length;
  const status = application.status;
  const canEdit = ["agent_accepted", "needs_correction"].includes(status);
  const rework = status === "needs_correction";
  const stage = jobStage(application);
  const detail = application.rwx_detail;

  const saveItem = async (key, payload) => {
    const res = await submitRwxChecklistItem(appId, key, payload);
    if (!res.error) await load();
    return res;
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitRwxChecklist(appId);
    setSubmitting(false);
    if (res.error) return setSubmitError(res.error);
    pushToast({ tone: "success", title: "Inspection sent to staff for review", body: "Staff issue the certificate if the vehicle passed." });
    router.push("/agent/applications");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <DocumentPreviewModal isOpen={!!preview} onClose={() => setPreview(null)} fileUrl={preview} />
      <JobHeader application={application} stage={stage} />

      <div className="space-y-4">
        {rework ? <StaffNote note={reworkNote(application)} /> : null}
        <NextStep stage={stage} title={canEdit ? (rework ? "Update the checks staff flagged and submit again" : "Inspect the vehicle and record all 10 checks") : null}>
          {canEdit ? (
            <div>
              <p>Each check needs pass or fail and a photo. Save each one as you go.</p>
              <div className="mt-3 flex items-center justify-between text-sm text-cx-muted">
                <span>{doneCount} of {CHECKLIST.length} checks saved</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cx-line">
                <div className="h-full rounded-full bg-cx-brand transition-all" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }} />
              </div>
            </div>
          ) : null}
        </NextStep>

        <Card>
          <h2 className="text-[16px] font-semibold text-cx-ink">Booking</h2>
          <div className="mt-3">
            <InfoGrid>
              <Info label="Bay" value={detail?.bay?.name ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-cx-muted" aria-hidden />{detail.bay.name}</span> : null} />
              <Info label="Slot" value={detail?.slot?.label ? <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-cx-muted" aria-hidden />{detail.slot.label}</span> : null} />
              <Info label="Vehicle category" value={detail?.vehicle_category?.replace(/_/g, " ")} />
            </InfoGrid>
          </div>
        </Card>

        <ol className="space-y-3">
          {CHECKLIST.map((item, i) => (
            <CheckItem key={item.key} item={item} index={i} existing={byKey[item.key]} canEdit={canEdit} onSave={saveItem} onPreview={setPreview} />
          ))}
        </ol>

        {canEdit ? (
          <StickyActionBar>
            <div className="w-full space-y-2">
              {submitError ? <Notice tone="red">{submitError}</Notice> : null}
              <Button size="lg" block icon={Send} loading={submitting} disabled={!allDone} onClick={submit}>
                {allDone ? (rework ? "Resubmit inspection" : "Submit inspection") : `Save all ${CHECKLIST.length} checks to submit (${doneCount}/${CHECKLIST.length})`}
              </Button>
            </div>
          </StickyActionBar>
        ) : null}

        <CustomerCard application={application} />
        <AgentApplicationChatSection application={application} />
      </div>
    </div>
  );
}
