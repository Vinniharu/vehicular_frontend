"use client";

// Vehicle verification (registration history / customs duty) and Central
// Motor Registry jobs. Both finish with one submission: the checklist and
// evidence, or the registry certificate.

import { useState } from "react";
import { BadgeCheck, ClipboardCheck, Send, Upload } from "lucide-react";
import {
  addApplicationDocument,
  completeCentralMotorRegistryApplication,
  resolveMediaUrl,
  submitVehicleVerificationChecklist,
} from "@/lib/api";
import { Button, Card, Field, Notice, Sheet, Textarea } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import AgentApplicationChatSection from "@/app/components/design/AgentApplicationChatSection";
import { Info, InfoGrid, UploadBox } from "./ui";
import { CustomerCard, DocumentsSection, JobHeader, NextStep, StaffNote, reworkNote } from "./JobShell";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// Statuses in which the agent can (re)submit: after accepting, after a
// customer reapply (agent_assigned) and after staff send it back.
const EDITABLE = ["agent_accepted", "agent_assigned", "needs_correction"];

function stepsFor(status) {
  const steps = ["Accepted", "Submit result", "Staff review", "Released"];
  let current = 1;
  if (["agent_completed", "staff_final_review"].includes(status)) current = 2;
  if (status === "awaiting_customer") current = 3;
  if (status === "completed") current = 4;
  return { steps, current };
}

function Choice({ value, onChange, options, name }) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cx(
              "cx-focus flex min-h-12 items-center gap-3 rounded-cx border px-3.5 text-left text-[15px] font-medium transition-colors",
              selected ? "border-cx-brand bg-cx-brand-soft text-cx-brand-deep" : "border-cx-line-strong text-cx-ink hover:bg-cx-sunken"
            )}
          >
            <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-cx-brand" : "border-cx-line-strong")} aria-hidden>
              {selected ? <span className="h-2.5 w-2.5 rounded-full bg-cx-brand" /> : null}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-cx-ink">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          [true, "Yes"],
          [false, "No"],
        ].map(([v, text]) => (
          <button
            key={text}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={cx(
              "cx-focus min-h-11 rounded-cx border text-[15px] font-semibold",
              value === v ? "border-cx-brand bg-cx-brand-soft text-cx-brand-deep" : "border-cx-line-strong text-cx-ink-2 hover:bg-cx-sunken"
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

const CUSTOMS_VERDICTS = [
  { value: "legitimate_complete", label: "Legitimate and complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "fraudulent", label: "Fraudulent" },
  { value: "cannot_verify", label: "Can't verify" },
];
const REGISTRATION_VERDICTS = [
  { value: "clear", label: "Clear, no issues found" },
  { value: "flagged", label: "Flagged, see notes" },
  { value: "cannot_verify", label: "Can't verify" },
];

/* ── Vehicle verification ───────────────────────────────────────────── */

export function VerificationJob({ application, stage, onPreview, reload }) {
  const pushToast = useToast();
  const detail = application.verification_detail || {};
  const isCustoms = detail.check_type === "customs_duty" || application.application_type === "vehicle_verification_customs_duty";
  const evidenceType = isCustoms ? "vv_customs_evidence" : "vv_registry_evidence";
  const existing = (application.documents || []).find((d) => d.doc_type === evidenceType);
  const status = application.status;
  const canEdit = EDITABLE.includes(status) && status !== "completed";
  const rework = status === "needs_correction";

  const [open, setOpen] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState(existing?.file_url || "");
  const [evidenceName, setEvidenceName] = useState("");
  const [isRegistered, setIsRegistered] = useState(null);
  const [stolen, setStolen] = useState(null);
  const [fines, setFines] = useState(null);
  const [fineDetails, setFineDetails] = useState("");
  const [verdict, setVerdict] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const attachEvidence = async ({ url, fileName }) => {
    setError(null);
    const res = await addApplicationDocument(application.id, { doc_type: evidenceType, file_url: url });
    if (res.error) return setError(res.error);
    setEvidenceUrl(url);
    setEvidenceName(fileName);
  };

  const submit = async () => {
    setError(null);
    if (!evidenceUrl) return setError("Add a screenshot or photo of your records check.");
    if (!verdict) return setError("Choose the overall result.");
    setSaving(true);
    const res = await submitVehicleVerificationChecklist(application.id, {
      is_registered: isRegistered,
      reported_stolen: stolen,
      has_fines: fines,
      fine_details: fineDetails || undefined,
      verdict,
      notes: notes || undefined,
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    setOpen(false);
    pushToast({ tone: "success", title: "Sent to staff for review", body: "Staff release the result to the customer." });
    await reload();
  };

  const { steps, current } = stepsFor(status);
  return (
    <div className="mx-auto max-w-3xl">
      <JobHeader application={application} stage={stage} />
      <div className="space-y-4">
        {rework ? <StaffNote note={reworkNote(application, [evidenceType])} /> : null}
        <NextStep
          stage={stage}
          title={canEdit ? (rework ? "Recheck the records and submit again" : `Check the ${isCustoms ? "customs records" : "registration records"} and submit the result`) : null}
          action={canEdit ? <Button size="lg" icon={ClipboardCheck} onClick={() => { setError(null); setOpen(true); }}>{rework ? "Resubmit result" : "Submit verification result"}</Button> : null}
          steps={steps}
          current={current}
        >
          {canEdit ? "Attach evidence of your check and choose the overall result. Staff review it before the customer gets the report." : null}
        </NextStep>

        <Card>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-cx-ink">
            <BadgeCheck className="h-5 w-5 text-cx-muted" aria-hidden /> Vehicle to check
          </h2>
          <div className="mt-3">
            <InfoGrid>
              <Info label="Check" value={isCustoms ? "Customs duty" : "Registration history"} />
              <Info label="Plate number" value={detail.plate_number} mono copy />
              <Info label="Make / model" value={[detail.make, detail.model].filter(Boolean).join(" ")} />
              <Info label="Year / colour" value={[detail.year, detail.colour].filter(Boolean).join(" / ")} />
              {detail.chassis_number ? <Info label="Chassis / VIN" value={detail.chassis_number} mono copy wide /> : null}
              <Info label="Reason" value={detail.reason?.replace(/_/g, " ")} />
            </InfoGrid>
          </div>
        </Card>

        <CustomerCard application={application} />
        <DocumentsSection application={application} onPreview={onPreview} onChanged={reload} />
        <AgentApplicationChatSection application={application} />
      </div>

      <Sheet
        open={open}
        onOpenChange={(o) => !o && !saving && setOpen(false)}
        title="Verification result"
        description="Staff review this before the customer gets the report."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>Send for review</Button>
          </>
        }
      >
        <div className="space-y-5">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <Field label="Evidence of your check" required hint="A screenshot or photo of the records you checked">
            <UploadBox value={evidenceUrl} fileName={evidenceName || (evidenceUrl ? "Evidence added" : "")} previewSrc={evidenceUrl ? resolveMediaUrl(evidenceUrl) : undefined} onUploaded={attachEvidence} />
          </Field>
          {!isCustoms ? (
            <div className="space-y-4">
              <YesNo label="Is the vehicle registered?" value={isRegistered} onChange={setIsRegistered} />
              <YesNo label="Reported stolen?" value={stolen} onChange={setStolen} />
              <YesNo label="Outstanding fines?" value={fines} onChange={setFines} />
              {fines ? (
                <Field label="Fine details">
                  {(p) => <Textarea {...p} value={fineDetails} onChange={(e) => setFineDetails(e.target.value)} />}
                </Field>
              ) : null}
            </div>
          ) : null}
          <div>
            <p className="mb-1.5 text-sm font-medium text-cx-ink">Overall result <span className="text-cx-red">*</span></p>
            <Choice name="Overall result" value={verdict} onChange={setVerdict} options={isCustoms ? CUSTOMS_VERDICTS : REGISTRATION_VERDICTS} />
          </div>
          <Field label="Notes" optional>
            {(p) => <Textarea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
        </div>
      </Sheet>
    </div>
  );
}

/* ── Central Motor Registry ─────────────────────────────────────────── */

export function RegistryJob({ application, stage, onPreview, reload }) {
  const pushToast = useToast();
  const status = application.status;
  const canEdit = EDITABLE.includes(status);
  const rework = status === "needs_correction";

  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!fileUrl) return setError("Add the registry certificate.");
    setSaving(true);
    const res = await completeCentralMotorRegistryApplication(application.id, { file_url: fileUrl });
    setSaving(false);
    if (res.error) return setError(res.error);
    setOpen(false);
    pushToast({ tone: "success", title: "Sent to staff for review", body: "Staff release the certificate to the customer." });
    await reload();
  };

  const { steps, current } = stepsFor(status);
  return (
    <div className="mx-auto max-w-3xl">
      <JobHeader application={application} stage={stage} />
      <div className="space-y-4">
        {rework ? <StaffNote note={reworkNote(application, ["central_registry_certificate"])} /> : null}
        <NextStep
          stage={stage}
          title={canEdit ? (rework ? "Upload a corrected registry certificate" : "Register the vehicle and upload the certificate") : null}
          action={canEdit ? <Button size="lg" icon={Upload} onClick={() => { setError(null); setFileUrl(""); setFileName(""); setOpen(true); }}>{rework ? "Upload corrected certificate" : "Upload registry certificate"}</Button> : null}
          steps={steps}
          current={current}
        >
          {canEdit ? "Staff review it before the customer can download it." : null}
        </NextStep>

        <Card>
          <h2 className="text-[16px] font-semibold text-cx-ink">Registration details</h2>
          <div className="mt-3">
            <InfoGrid>
              <Info label="NIN" value={application.nin} mono copy />
              <Info label="Vehicle ID" value={application.vehicle_id} mono />
              <Info label="State" value={application.state_of_residence} />
            </InfoGrid>
          </div>
        </Card>

        <CustomerCard application={application} />
        <DocumentsSection application={application} onPreview={onPreview} onChanged={reload} />
        <AgentApplicationChatSection application={application} />
      </div>

      <Sheet
        open={open}
        onOpenChange={(o) => !o && !saving && setOpen(false)}
        title="Upload registry certificate"
        description="Staff review it before the customer can download it."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>Send for review</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <Field label="Registry certificate" required>
            <UploadBox value={fileUrl} fileName={fileName} previewSrc={fileUrl ? resolveMediaUrl(fileUrl) : undefined} onUploaded={({ url, fileName: n }) => { setFileUrl(url); setFileName(n); }} />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
