"use client";

// Job page for driver's licences (fresh, renewal, replacement, IDP), tinted
// permits and number plates. All of these finish the same way: the agent
// uploads the finished document (upload-proof) and staff review it.

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileBadge,
  Fingerprint,
  Link2,
  Send,
  Upload,
} from "lucide-react";
import {
  addApplicationDocument,
  flagDocumentIssue,
  markCapturingCompleted,
  reassignCaptureCentre,
  resolveMediaUrl,
  scheduleCapturing,
  sendVerificationLink,
  uploadApplicationFile,
  uploadProof,
  uploadTemporaryDocuments,
  uploadTemporaryLicence,
} from "@/lib/api";
import { validateUploadFile } from "@/lib/utils/fileValidation";
import { Badge, Button, Card, Field, Input, Notice, Sheet, Textarea } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import AgentApplicationChatSection from "@/app/components/design/AgentApplicationChatSection";
import { AGENT_DELIVERABLE_DOC_TYPES, finishLabel, isDlRenewalFamily, isNumberPlate, isStaffRework } from "./jobs";
import { Collapsible, Info, InfoGrid, UploadBox } from "./ui";
import { ActionList, CustomerCard, DocumentsSection, JobHeader, NextStep, StaffNote, VehicleSection, reworkNote } from "./JobShell";

// Statuses in which the tinted-permit side steps are allowed (mirrors
// TINTED_WORK_STATUSES in the backend agent router).
const TINTED_WORK_STATUSES = ["agent_accepted", "agent_assigned", "needs_correction"];
const WORKING_STATUSES = ["agent_accepted", "agent_assigned", "in_progress", "in_process"];

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function yearsFromNow(validity) {
  const years = parseInt(validity || "", 10);
  if (!Number.isFinite(years) || years <= 0) return "";
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return isoDate(d);
}
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function deliverableNoun(type) {
  if (type === "fresh") return "permanent licence";
  if (type === "renewal") return "renewed licence";
  if (type === "reissue") return "replacement licence";
  if (type === "international_permit") return "international permit";
  if (type === "tinted_permit") return "finished permit";
  if (isNumberPlate(type)) return "finished plate";
  return "finished document";
}

function stepsFor(type, status, rework) {
  if (type === "fresh") {
    const steps = ["Accepted", "Capture", "Upload licence", "Staff review", "Delivered"];
    let current = 1;
    if (["captured", "capturing_completed", "temp_licence_pending_review", "temp_licence_issued"].includes(status) || rework) current = 2;
    if (["agent_completed", "staff_final_review"].includes(status)) current = 3;
    if (status === "awaiting_customer") current = 4;
    if (status === "completed") current = 5;
    return { steps, current };
  }
  const steps = ["Accepted", "Upload finished work", "Staff review", "Delivered"];
  let current = 1;
  if (["agent_completed", "staff_final_review"].includes(status)) current = 2;
  if (status === "awaiting_customer") current = 3;
  if (status === "completed") current = 4;
  return { steps, current };
}

export default function StandardJob({ application, vehicle, stage, onPreview, reload }) {
  const pushToast = useToast();
  const type = application.application_type || "fresh";
  const status = application.status;
  const isFresh = type === "fresh";
  const isTinted = type === "tinted_permit";
  const isPlate = isNumberPlate(type);
  const isRenewalFamily = isDlRenewalFamily(type);
  const needsCredentialFields = isFresh || isTinted || isRenewalFamily;
  const docs = application.documents || [];
  const isDeliverable = (d) => AGENT_DELIVERABLE_DOC_TYPES.includes(d.doc_type);
  const deliverableApproved = application.permanent_licence?.review_status === "approved" || status === "completed" || docs.some((d) => isDeliverable(d) && d.status === "approved");
  const deliverableRejected = application.permanent_licence?.review_status === "rejected" || docs.some((d) => isDeliverable(d) && d.status === "rejected");
  // Fresh licences go back to "captured" (not needs_correction) when staff reject them.
  const rework = isStaffRework(application) || (deliverableRejected && !deliverableApproved && stage.bucket === "todo");
  const tempRejected = application.temporary_licence?.review_status === "rejected" || docs.some((d) => d.doc_type === "temporary_driver_licence" && d.status === "rejected");
  const tempApproved = application.temporary_licence?.review_status === "approved" || docs.some((d) => d.doc_type === "temporary_driver_licence" && d.status === "approved");

  const canSchedule = isFresh && status === "agent_accepted";
  const canReassign = isFresh && ["capture_scheduled", "capturing_scheduled"].includes(status);
  const canMarkCaptured = isFresh && ["capture_scheduled", "capturing_scheduled", "agent_accepted"].includes(status);
  const canIssueTemp = isFresh && !tempApproved && (["captured", "capturing_completed"].includes(status) || tempRejected);
  const canUploadFinished =
    !deliverableApproved &&
    (["captured", "capturing_completed"].includes(status) ||
      (isFresh && ["temp_licence_pending_review", "temp_licence_issued"].includes(status)) ||
      (!isFresh && WORKING_STATUSES.includes(status)) ||
      status === "needs_correction");
  const canFlag = (isRenewalFamily || isTinted || isPlate) && ["agent_accepted", "agent_assigned"].includes(status);
  const canProgressPhoto = (isTinted || isPlate) && ["agent_accepted", "agent_assigned"].includes(status);
  const canTintedSteps = isTinted && TINTED_WORK_STATUSES.includes(status);

  /* ── Sheet state ─────────────────────────────────────────────────── */
  const [sheet, setSheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [centre, setCentre] = useState("");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [tempDocs, setTempDocs] = useState([{ url: "", name: "" }]);
  const [markingCaptured, setMarkingCaptured] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(false);
  const progressInput = useRef(null);

  const open = (name) => {
    setFormError(null);
    setFileUrl("");
    setFileName("");
    setNumber("");
    setCentre("");
    setWhen("");
    setNote("");
    setExpiry(name === "finish" && isFresh ? yearsFromNow(application.validity_period) : name === "temp-licence" ? daysFromNow(30) : "");
    if (name === "link") setLink(application.verification_link || "");
    if (name === "temp-permit") setTempDocs([{ url: "", name: "" }]);
    setSheet(name);
  };
  const close = () => !saving && setSheet(null);

  const done = async (title, body) => {
    setSaving(false);
    setSheet(null);
    pushToast({ tone: "success", title, body });
    await reload();
  };

  const submit = async () => {
    setFormError(null);
    let res;
    if (sheet === "finish") {
      if (!fileUrl) return setFormError(`Add a photo or scan of the ${deliverableNoun(type)}.`);
      if (needsCredentialFields && (!number.trim() || !expiry)) return setFormError(isTinted ? "Enter the permit number and expiry date." : "Enter the licence number and expiry date.");
      setSaving(true);
      res = await uploadProof(application.id, {
        proof_url: fileUrl,
        licence_number: needsCredentialFields ? number.trim() : undefined,
        expiry_date: needsCredentialFields ? expiry : undefined,
      });
      if (!res.error) return done("Sent to staff for review", "You'll be told if anything needs changing.");
    } else if (sheet === "schedule") {
      setSaving(true);
      res = await scheduleCapturing(application.id, { scheduled_at: when || undefined, centre_name: centre.trim() || undefined, note: note.trim() || undefined });
      if (!res.error) return done("Capture scheduled", "The customer has been told when and where.");
    } else if (sheet === "reassign") {
      if (!centre.trim()) return setFormError("Enter the new centre.");
      setSaving(true);
      res = await reassignCaptureCentre(application.id, { new_centre_name: centre.trim(), new_scheduled_at: when || undefined, reason: note.trim() || undefined });
      if (!res.error) return done("Capture centre changed", "The customer has been told.");
    } else if (sheet === "temp-licence") {
      if (!fileUrl) return setFormError("Add the temporary licence.");
      if (!number.trim() || !expiry) return setFormError("Enter the licence number and expiry date.");
      setSaving(true);
      res = await uploadTemporaryLicence(application.id, { file_url: fileUrl, licence_number: number.trim(), expiry_date: expiry });
      if (!res.error) return done("Temporary licence sent to staff", "The customer sees it once staff approve it.");
    } else if (sheet === "link") {
      if (!/^https?:\/\//i.test(link.trim())) return setFormError("Enter a full link starting with https://");
      setSaving(true);
      res = await sendVerificationLink(application.id, { verification_link: link.trim() });
      if (!res.error) return done("Link sent to the customer");
    } else if (sheet === "temp-permit") {
      const valid = tempDocs.filter((d) => d.url).map((d) => ({ file_url: d.url, doc_type: "temporary_tinted_permit" }));
      if (!valid.length) return setFormError("Add at least one temporary permit page.");
      setSaving(true);
      res = await uploadTemporaryDocuments(application.id, { documents: valid });
      if (!res.error) return done("Temporary permit shared", "The customer can now download it.");
    } else if (sheet === "flag") {
      if (!note.trim()) return setFormError("Tell the customer what's wrong.");
      setSaving(true);
      res = await flagDocumentIssue(application.id, { reason: note.trim() });
      if (!res.error) return done("Sent back to the customer", "The job continues once they fix it.");
    }
    setSaving(false);
    if (res?.error) setFormError(res.error);
  };

  const markCaptured = async () => {
    setMarkingCaptured(true);
    const res = await markCapturingCompleted(application.id);
    setMarkingCaptured(false);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't update the job", body: res.error });
    pushToast({ tone: "success", title: "Capture marked as done" });
    await reload();
  };

  const uploadProgress = async (file) => {
    if (!file) return;
    const check = validateUploadFile(file, { maxSizeMb: 10 });
    if (!check.valid) return pushToast({ tone: "error", title: check.error });
    setUploadingProgress(true);
    const up = await uploadApplicationFile(file);
    if (up.error || !up.data?.file_url) {
      setUploadingProgress(false);
      return pushToast({ tone: "error", title: "Upload failed", body: up.error });
    }
    const res = await addApplicationDocument(application.id, {
      doc_type: isPlate ? "plate_production_in_progress" : "tinted_permit_progress_evidence",
      file_url: up.data.file_url,
    });
    setUploadingProgress(false);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't save the photo", body: res.error });
    pushToast({ tone: "success", title: "Progress photo shared with the customer" });
    await reload();
  };

  /* ── Next step ───────────────────────────────────────────────────── */
  const { steps, current } = stepsFor(type, status, rework);
  let primary = null;
  let title = null;
  let body = null;
  if (canSchedule) {
    title = "Book the customer's biometric capture";
    body = "Pick the centre and time. The customer gets the details by SMS.";
    primary = <Button size="lg" icon={Fingerprint} onClick={() => open("schedule")}>Schedule capture</Button>;
  } else if (canReassign) {
    title = "Mark the capture as done once it's finished";
    body = application.capture_centre_name ? `Booked at ${application.capture_centre_name}${application.capture_scheduled_at ? `, ${new Date(application.capture_scheduled_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}` : ""}.` : null;
    primary = <Button size="lg" icon={CheckCircle2} loading={markingCaptured} onClick={markCaptured}>Mark capture as done</Button>;
  } else if (canUploadFinished && stage.bucket === "todo") {
    title = rework ? `Upload a corrected ${deliverableNoun(type)}` : finishLabel(type);
    body = isPlate
      ? "Take a clear photo of the finished plate. Staff check it before the customer is told."
      : `Add a photo or scan of the ${deliverableNoun(type)}${needsCredentialFields ? ` with its ${isTinted ? "permit" : "licence"} number and expiry date` : ""}. Staff check it before the customer sees it.`;
    primary = <Button size="lg" icon={Upload} onClick={() => open("finish")}>{rework ? "Upload corrected copy" : finishLabel(type)}</Button>;
  }

  const actions = [
    canMarkCaptured && !canReassign && { label: "Mark capture as done", description: "If the customer was captured without a booking", icon: CheckCircle2, onClick: markCaptured, loading: markingCaptured },
    canReassign && { label: "Change capture centre", description: "If the booked centre can't do it", icon: Building2, onClick: () => open("reassign") },
    canIssueTemp && { label: tempRejected ? "Upload a new temporary licence" : "Issue a temporary licence", description: "Optional, while the permanent card is made", icon: FileBadge, tone: tempRejected ? "red" : undefined, onClick: () => open("temp-licence") },
    canTintedSteps && { label: application.verification_link ? "Update image verification link" : "Send image verification link", description: "The customer opens it and uploads a screenshot", icon: Link2, onClick: () => open("link") },
    canTintedSteps && { label: "Share a temporary permit", description: "Lets the customer drive while the permit is processed", icon: FileBadge, onClick: () => open("temp-permit") },
    canProgressPhoto && {
      label: "Share a work-in-progress photo",
      description: "Shows the customer the job is moving",
      icon: Camera,
      loading: uploadingProgress,
      onClick: () => progressInput.current?.click(),
    },
    canUploadFinished && stage.bucket !== "todo" && { label: `Upload the ${deliverableNoun(type)}`, description: "If you already have it", icon: Upload, onClick: () => open("finish") },
    canFlag && { label: "Flag a problem with a customer document", description: "Sends the job back to the customer to fix", icon: AlertTriangle, tone: "red", onClick: () => open("flag") },
  ];

  const d = application.applicant_details || {};
  const pick = (k) => d[k] ?? application[k];

  return (
    <div className="mx-auto max-w-3xl">
      <JobHeader
        application={application}
        stage={stage}
        extra={isPlate && application.is_fancy_plate && application.fancy_plate_number ? <Badge tone="brand">Plate: {application.fancy_plate_number}</Badge> : null}
      />

      <div className="space-y-4">
        {rework ? <StaffNote note={reworkNote(application, [...AGENT_DELIVERABLE_DOC_TYPES, "temporary_driver_licence"])} /> : null}

        <NextStep stage={stage} title={title} action={primary} steps={steps} current={current}>
          {body}
        </NextStep>

        <ActionList actions={actions} />
        <input ref={progressInput} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { uploadProgress(e.target.files?.[0]); e.target.value = ""; }} />

        <CustomerCard application={application} />

        {isFresh && (application.temporary_licence || application.permanent_licence) ? (
          <Card>
            <h2 className="text-[16px] font-semibold text-cx-ink">Licences issued</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[["Temporary", application.temporary_licence], ["Permanent", application.permanent_licence]].map(([label, lic]) => (
                <div key={label} className="rounded-cx bg-cx-sunken p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-cx-ink-2">{label}</p>
                    {lic?.review_status ? <Badge tone={lic.review_status === "approved" ? "brand" : lic.review_status === "rejected" ? "red" : "amber"}>{lic.review_status}</Badge> : null}
                  </div>
                  <p className="mt-1 font-mono text-[15px] font-semibold text-cx-ink">{lic?.licence_number || "Not issued yet"}</p>
                  {lic?.expiry_date ? <p className="text-[13px] text-cx-muted">Valid until {new Date(lic.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p> : null}
                  {lic?.document_url ? (
                    <button type="button" onClick={() => onPreview(resolveMediaUrl(lic.document_url))} className="cx-focus mt-1 rounded text-sm font-semibold text-cx-brand-deep hover:underline">
                      View document
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <VehicleSection application={application} vehicle={vehicle} defaultOpen={isTinted || isPlate} />

        <Collapsible title="Application details" icon={ClipboardList}>
          <div className="space-y-5">
            {(application.justification || application.verification_link || application.use_type || application.is_fancy_plate || application.previous_owner_details || application.dealership_name) ? (
              <InfoGrid>
                {application.justification ? <Info label="Reason for tint" value={application.justification} wide /> : null}
                {application.verification_link ? (
                  <Info
                    label="Image verification link"
                    wide
                    value={<a href={application.verification_link} target="_blank" rel="noreferrer" className="break-all text-cx-brand-deep underline">{application.verification_link}</a>}
                  />
                ) : null}
                {application.use_type ? <Info label="Use" value={application.use_type} /> : null}
                {application.is_fancy_plate ? <Info label="Requested plate" value={application.fancy_plate_number} mono /> : null}
                {application.previous_owner_details ? <Info label="Previous owner" value={application.previous_owner_details} wide /> : null}
                {application.dealership_name ? <Info label="Dealership" value={application.dealership_name} /> : null}
                {application.is_registered_company !== null && application.is_registered_company !== undefined ? (
                  <Info label="Registered company" value={application.is_registered_company ? "Yes" : "No"} />
                ) : null}
              </InfoGrid>
            ) : null}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-cx-ink-2">Personal</h3>
              <InfoGrid>
                <Info label="Surname" value={pick("last_name")} />
                <Info label="First name" value={pick("first_name")} />
                <Info label="Middle name" value={pick("middle_name")} />
                <Info label="Date of birth" value={pick("date_of_birth")} />
                <Info label="Gender" value={pick("gender")} />
                <Info label="NIN" value={pick("nin")} mono copy />
                <Info label="Nationality" value={pick("nationality")} />
                <Info label="Marital status" value={pick("marital_status")} />
                <Info label="Mother's maiden name" value={pick("mothers_maiden_name")} />
                <Info label="Origin" value={[pick("state_of_origin"), pick("lga_of_origin")].filter(Boolean).join(" / ")} />
                <Info label="Address" value={pick("residential_address")} wide />
              </InfoGrid>
            </div>

            {isFresh || isRenewalFamily ? (
              <>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-cx-ink-2">Licence</h3>
                  <InfoGrid>
                    <Info label="Class" value={application.licence_class} />
                    <Info label="Validity" value={application.validity_period} />
                    <Info label="Driving school cert." value={application.driving_school_certificate_number} mono />
                  </InfoGrid>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-cx-ink-2">Medical</h3>
                  <InfoGrid>
                    <Info label="Blood group" value={d.blood_group} />
                    <Info label="Height" value={d.height_cm ? `${d.height_cm} cm` : null} />
                    <Info label="Vision" value={application.vision_acuity_test} />
                    <Info label="Facial mark" value={d.has_facial_mark ? d.facial_mark_description || "Yes" : "None"} />
                    <Info label="Disability" value={d.has_disability ? d.disability_description || "Yes" : "None"} />
                  </InfoGrid>
                </div>
                {pick("next_of_kin_name") ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-cx-ink-2">Next of kin</h3>
                    <InfoGrid>
                      <Info label="Name" value={pick("next_of_kin_name")} />
                      <Info label="Relationship" value={pick("next_of_kin_relationship")} />
                      <Info label="Phone" value={pick("next_of_kin_phone")} mono copy />
                    </InfoGrid>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </Collapsible>

        <DocumentsSection application={application} onPreview={onPreview} onChanged={reload} />

        <AgentApplicationChatSection application={application} />
      </div>

      {/* ── Sheets ─────────────────────────────────────────────────── */}
      <Sheet
        open={sheet === "finish"}
        onOpenChange={(o) => !o && close()}
        title={rework ? `Upload a corrected ${deliverableNoun(type)}` : finishLabel(type)}
        description="Staff review it before the customer is told."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>{saving ? "Sending…" : "Send for review"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          <Field label={isPlate ? "Photo of the finished plate" : `The ${deliverableNoun(type)}`} required>
            <UploadBox
              label={isPlate ? "Take or add a photo" : "Take a photo or add a scan"}
              accept={isPlate ? "image/*" : "image/*,application/pdf"}
              value={fileUrl}
              fileName={fileName}
              previewSrc={fileUrl ? resolveMediaUrl(fileUrl) : undefined}
              onUploaded={({ url, fileName: n }) => {
                setFileUrl(url);
                setFileName(n);
              }}
            />
          </Field>
          {needsCredentialFields ? (
            <>
              <Field label={isTinted ? "Permit number" : "Licence number"} required>
                {(p) => <Input {...p} value={number} onChange={(e) => setNumber(e.target.value)} placeholder={isTinted ? "e.g. TP-000123" : "e.g. LAG12345AA01"} autoCapitalize="characters" />}
              </Field>
              <Field label="Expiry date" required>
                {(p) => <Input {...p} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />}
              </Field>
            </>
          ) : null}
        </div>
      </Sheet>

      <Sheet
        open={sheet === "schedule" || sheet === "reassign"}
        onOpenChange={(o) => !o && close()}
        title={sheet === "reassign" ? "Change capture centre" : "Schedule biometric capture"}
        description="The customer is told by SMS."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
            <Button block icon={CalendarClock} loading={saving} onClick={submit}>{sheet === "reassign" ? "Save new centre" : "Schedule"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          <Field label="Capture centre" required={sheet === "reassign"} hint={sheet === "schedule" ? "Leave blank to use your VIO office" : undefined}>
            {(p) => <Input {...p} value={centre} onChange={(e) => setCentre(e.target.value)} placeholder="e.g. Ikeja VIO office" />}
          </Field>
          <Field label="Date and time" optional={sheet === "reassign"}>
            {(p) => <Input {...p} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}
          </Field>
          <Field label={sheet === "reassign" ? "Reason" : "Note for the customer"} optional>
            {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} placeholder={sheet === "reassign" ? "e.g. The centre is closed for maintenance" : "e.g. Bring your original ID"} />}
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "temp-licence"}
        onOpenChange={(o) => !o && close()}
        title="Issue a temporary licence"
        description="Optional. Staff approve it before the customer sees it."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>Send for review</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          <Field label="Temporary licence" required>
            <UploadBox value={fileUrl} fileName={fileName} previewSrc={fileUrl ? resolveMediaUrl(fileUrl) : undefined} onUploaded={({ url, fileName: n }) => { setFileUrl(url); setFileName(n); }} />
          </Field>
          <Field label="Licence number" required>
            {(p) => <Input {...p} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. LAG-TMP-00123456" />}
          </Field>
          <Field label="Expiry date" required hint="Usually 30 days from today">
            {(p) => <Input {...p} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />}
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "link"}
        onOpenChange={(o) => !o && close()}
        title={application.verification_link ? "Update image verification link" : "Send image verification link"}
        description="The customer gets it by SMS and email, opens it and uploads a screenshot."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>Send link</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          <Field label="Verification link" required>
            {(p) => <Input {...p} type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />}
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "temp-permit"}
        onOpenChange={(o) => !o && close()}
        title="Share a temporary permit"
        description="The customer can download and print it. This replaces any temporary permit shared before."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>Share with customer</Button>
          </>
        }
      >
        <div className="space-y-3">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          {tempDocs.map((doc, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-cx-ink">Page {i + 1}</p>
                {tempDocs.length > 1 ? (
                  <button type="button" className="cx-focus rounded text-sm font-semibold text-cx-red" onClick={() => setTempDocs(tempDocs.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                ) : null}
              </div>
              <UploadBox
                value={doc.url}
                fileName={doc.name}
                previewSrc={doc.url ? resolveMediaUrl(doc.url) : undefined}
                onUploaded={({ url, fileName: n }) => setTempDocs(tempDocs.map((x, j) => (j === i ? { url, name: n } : x)))}
              />
            </div>
          ))}
          <Button variant="ghost" onClick={() => setTempDocs([...tempDocs, { url: "", name: "" }])}>+ Add another page</Button>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "flag"}
        onOpenChange={(o) => !o && close()}
        title="Flag a problem with a customer document"
        description="The job goes back to the customer. It returns to you once they fix it."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
            <Button block variant="danger" loading={saving} onClick={submit}>Send to customer</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          <Field label="What needs fixing?" required hint="The customer sees exactly what you write">
            {(p) => <Textarea {...p} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The proof of ownership photo is blurry. Please upload a clear copy." />}
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
