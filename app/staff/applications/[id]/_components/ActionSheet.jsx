"use client";

// One sheet per staff action (replaces the old 14-way modal). Every action
// calls the same API with the same payload as before.

import { useEffect, useState } from "react";
import { Eye, Image as ImageIcon } from "lucide-react";
import {
  resolveMediaUrl,
  staffApproveApplication,
  staffConfirmDrivingSchoolCertificate,
  staffConfirmReceipt,
  staffEnrollDrivingSchool,
  staffFinalReview,
  staffParticularsItemFinalReview,
  staffPushToCustomer,
  staffReadyForPickup,
  staffRejectApplication,
  staffReleaseParticularsToAgents,
  staffReplaceDrivingSchoolSlip,
  staffReviewTemporaryLicence,
  staffRouteApplication,
  staffUploadDrivingSchoolCertificate,
} from "@/lib/api";
import { Badge, Button, Field, Input, Notice, Sheet, Textarea } from "@/app/dashboard/_kit";
import { UploadBox } from "@/app/components/portal/ui";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const TITLES = {
  approve: "Approve application",
  reject: "Reject application",
  enroll: "Enroll in driving school",
  "replace-slip": "Replace verification slip",
  "upload-cert": "Upload driving school certificate",
  "confirm-cert": "Verify certificate and route",
  "review-temp-licence": "Review temporary licence",
  route: "Route to field agents",
  "final-review": "Final review",
  "push-to-customer": "Record dispatch",
  "ready-for-pickup": "Mark ready for pickup",
  "confirm-receipt": "Mark as received",
  "release-particulars": "Release to agents",
  "particulars-item-review": "Review document",
};

const CONFIRM_LABELS = {
  approve: "Approve",
  reject: "Reject application",
  enroll: "Enroll",
  "replace-slip": "Replace slip",
  "upload-cert": "Upload certificate",
  "confirm-cert": "Verify and route",
  route: "Route to agents",
  "push-to-customer": "Save dispatch details",
  "ready-for-pickup": "Notify customer",
  "confirm-receipt": "Mark as received",
  "release-particulars": "Release to agents",
};

function DecisionField({ value, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-cx-ink">Decision</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Decision">
        {[
          ["approved", "Approve"],
          ["rejected", "Reject"],
        ].map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cx(
              "cx-focus min-h-12 rounded-cx border text-[15px] font-semibold",
              value === v
                ? v === "approved"
                  ? "border-cx-brand bg-cx-brand-soft text-cx-brand-deep"
                  : "border-cx-red bg-cx-red-soft text-cx-red"
                : "border-cx-line-strong text-cx-ink-2 hover:bg-cx-sunken"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LicenceSummary({ licence, onPreview }) {
  if (!licence) return null;
  return (
    <div className="rounded-cx bg-cx-sunken p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[13px] text-cx-muted">Number</p>
          <p className="font-mono text-[15px] font-semibold text-cx-ink">{licence.licence_number || "—"}</p>
        </div>
        <div>
          <p className="text-[13px] text-cx-muted">Expires</p>
          <p className="text-[15px] font-semibold text-cx-ink">{licence.expiry_date ? new Date(licence.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}</p>
        </div>
      </div>
      {licence.document_url ? (
        <Button variant="ghost" size="sm" icon={Eye} className="-ml-2 mt-2" onClick={() => onPreview(resolveMediaUrl(licence.document_url))}>
          View submitted document
        </Button>
      ) : null}
    </div>
  );
}

function DocButtons({ docs, onPreview, label }) {
  if (!docs.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {docs.map((d, i) => (
        <Button key={i} variant="secondary" size="sm" icon={ImageIcon} onClick={() => onPreview(resolveMediaUrl(d.file_url))}>
          {label || `View ${d.doc_type.replace(/_/g, " ")}`}
        </Button>
      ))}
    </div>
  );
}

/**
 * type: one of the TITLES keys; item: particulars item for item review.
 * onDone(message) is called after a successful action.
 */
export default function ActionSheet({ type, item, application, onClose, onDone, onPreview }) {
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState("approved");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [dispatchedBy, setDispatchedBy] = useState("");
  const [trackingNote, setTrackingNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setNote("");
    setDecision("approved");
    setFileUrl("");
    setFileName("");
    setDispatchedBy("");
    setTrackingNote("");
    setError(null);
  }, [type, item]);

  if (!type) return null;
  const app = application;
  const appType = app.application_type || "";
  const isRwx = appType === "roadworthiness_express";
  const isVv = appType.startsWith("vehicle_verification_");
  const isCmr = appType === "central_motor_registry";
  const hasDecision = ["review-temp-licence", "final-review", "particulars-item-review"].includes(type);
  const applicant = `${app.first_name || app.applicant_details?.first_name || ""} ${app.last_name || app.applicant_details?.last_name || ""}`.trim() || "this applicant";
  const area = app.lga || app.state_of_residence || "the applicant's area";

  const confirm = async () => {
    setError(null);
    let res;
    const needNote = (what) => {
      if (decision === "rejected" && !note.trim()) {
        setError(`Add a note explaining why ${what} is being rejected.`);
        return true;
      }
      return false;
    };
    if (type === "reject" && !note.trim()) return setError("Add a reason — the applicant will see it.");
    if ((type === "enroll" || type === "replace-slip") && !fileUrl) return setError("Attach the driving school verification slip.");
    if (type === "upload-cert" && !fileUrl) return setError("Attach the graduation certificate.");
    if (type === "review-temp-licence" && needNote("the temporary licence")) return;
    if (type === "final-review" && needNote("this work")) return;
    if (type === "particulars-item-review" && needNote("this document")) return;

    setSaving(true);
    if (type === "approve") res = await staffApproveApplication(app.id, { note: note.trim() });
    else if (type === "reject") res = await staffRejectApplication(app.id, { reason: note.trim() });
    else if (type === "enroll") res = await staffEnrollDrivingSchool(app.id, { verification_image_url: fileUrl, screenshot_url: fileUrl, file_url: fileUrl });
    else if (type === "replace-slip") res = await staffReplaceDrivingSchoolSlip(app.id, { file_url: fileUrl });
    else if (type === "upload-cert") res = await staffUploadDrivingSchoolCertificate(app.id, { certificate_url: fileUrl, screenshot_url: fileUrl, file_url: fileUrl });
    else if (type === "confirm-cert") res = await staffConfirmDrivingSchoolCertificate(app.id);
    else if (type === "review-temp-licence") res = await staffReviewTemporaryLicence(app.id, { decision, note: note.trim() || undefined });
    else if (type === "route") res = await staffRouteApplication(app.id);
    else if (type === "final-review") res = await staffFinalReview(app.id, { note: note.trim(), decision });
    else if (type === "push-to-customer") res = await staffPushToCustomer(app.id, { dispatched_by: dispatchedBy.trim(), tracking_note: trackingNote.trim() });
    else if (type === "ready-for-pickup") res = await staffReadyForPickup(app.id);
    else if (type === "confirm-receipt") res = await staffConfirmReceipt(app.id);
    else if (type === "release-particulars") res = await staffReleaseParticularsToAgents(app.id);
    else if (type === "particulars-item-review") res = await staffParticularsItemFinalReview(item.id, { decision, note: note.trim() });
    setSaving(false);
    if (res?.error) return setError(res.error);
    onDone(hasDecision ? (decision === "approved" ? "Approved" : "Sent back") : TITLES[type]);
  };

  const confirmLabel = hasDecision ? (decision === "approved" ? "Approve" : "Reject and send back") : CONFIRM_LABELS[type] || "Confirm";
  const notePlaceholder = {
    "review-temp-licence": decision === "rejected" ? "e.g. Licence number doesn't match the applicant's records." : "e.g. Verified against applicant details.",
    "particulars-item-review": decision === "rejected" ? "e.g. Document is blurry, please re-upload." : "e.g. Verified against application details.",
  };

  let body = null;
  if (type === "approve") {
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">Confirm identity and NIN checks for <strong className="text-cx-ink">{applicant}</strong>.</p>
        <Field label="Verification note" optional>
          {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. NIN and biodata checked, all fields match." />}
        </Field>
      </>
    );
  } else if (type === "reject") {
    body = (
      <Field label="Reason" required hint="The applicant sees this and can fix and resubmit.">
        {(p) => <Textarea {...p} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. NIN slip is blurry, date of birth doesn't match." />}
      </Field>
    );
  } else if (type === "enroll" || type === "replace-slip" || type === "upload-cert") {
    body = (
      <>
        {type === "enroll" ? <Notice>The graduation date is set automatically: 26 business days from today, skipping weekends and public holidays.</Notice> : null}
        {type === "replace-slip" ? <Notice>Upload the correct slip. It replaces the one on file — the enrollment date and countdown stay the same.</Notice> : null}
        <Field label={type === "upload-cert" ? "Graduation certificate" : type === "replace-slip" ? "Correct verification slip" : "Verification slip"} required>
          <UploadBox value={fileUrl} fileName={fileName} previewSrc={fileUrl ? resolveMediaUrl(fileUrl) : undefined} onUploaded={({ url, fileName: n }) => { setFileUrl(url); setFileName(n); }} onError={setError} />
        </Field>
      </>
    );
  } else if (type === "confirm-cert") {
    body = (
      <p className="text-[15px] text-cx-ink-2">
        The applicant attached a driving school certificate when applying, so no enrollment or waiting period is needed. Check it in Documents, then confirm to route this application to agents in <strong className="text-cx-ink">{area}</strong>.
      </p>
    );
  } else if (type === "route") {
    body = (
      <p className="text-[15px] text-cx-ink-2">
        The job is offered to active agents in <strong className="text-cx-ink">{area}</strong>.{" "}
        {appType === "tinted_permit" ? "Once one accepts, they start on the permit." : appType.startsWith("number_plate_") ? "Once one accepts, they start on the plate." : "Once one accepts, biometric capture is scheduled."}
      </p>
    );
  } else if (type === "review-temp-licence") {
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">Approving shows it on the customer's dashboard. Rejecting sends it back to the agent.</p>
        <LicenceSummary licence={app.temporary_licence} onPreview={onPreview} />
      </>
    );
  } else if (type === "final-review" && isRwx) {
    const verdict = app.rwx_detail?.overall_verdict;
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">
          Check every item was recorded properly with a matching photo — this isn't a second pass/fail decision. The agent's verdict is{" "}
          <strong className={verdict === "roadworthy" ? "text-cx-brand-deep" : "text-cx-red"}>{verdict?.replace(/_/g, " ") || "—"}</strong>. Approving issues the certificate (or records the fail with a 7-day free re-inspection). Reject only if the submission itself looks wrong.
        </p>
        <ul className="divide-y divide-cx-line rounded-cx border border-cx-line">
          {(app.rwx_checklist_items || []).map((it) => (
            <li key={it.item_key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[15px] font-medium capitalize text-cx-ink">{it.item_key.replace(/_/g, " ")}</p>
                {it.notes ? <p className="text-[13px] text-cx-muted">{it.notes}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={it.result === "pass" ? "brand" : "red"}>{it.result || "—"}</Badge>
                {it.evidence_url ? (
                  <Button variant="ghost" size="sm" icon={ImageIcon} onClick={() => onPreview(resolveMediaUrl(it.evidence_url))}>Photo</Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  } else if (type === "final-review" && isVv) {
    const d = app.verification_detail || {};
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">
          Check the evidence supports the agent's verdict:{" "}
          <strong className={["clear", "legitimate_complete"].includes(d.verdict) ? "text-cx-brand-deep" : "text-cx-red"}>{d.verdict?.replace(/_/g, " ") || "—"}</strong>. Approving publishes the report to the customer.
        </p>
        <dl className="space-y-1.5 rounded-cx bg-cx-sunken p-3 text-[15px]">
          <div><dt className="inline text-cx-muted">Vehicle: </dt><dd className="inline text-cx-ink">{d.make} {d.model} — {d.plate_number}</dd></div>
          {d.check_type === "registration_history" ? (
            <>
              <div><dt className="inline text-cx-muted">Registered: </dt><dd className="inline text-cx-ink">{d.is_registered ? "Yes" : "No"}</dd></div>
              <div><dt className="inline text-cx-muted">Reported stolen: </dt><dd className="inline text-cx-ink">{d.reported_stolen ? "Yes" : "No"}</dd></div>
              <div><dt className="inline text-cx-muted">Outstanding fines: </dt><dd className="inline text-cx-ink">{d.has_fines ? "Yes" : "No"}</dd></div>
              {d.fine_details ? <div><dt className="inline text-cx-muted">Fine details: </dt><dd className="inline text-cx-ink">{d.fine_details}</dd></div> : null}
            </>
          ) : null}
          {d.notes ? <div><dt className="inline text-cx-muted">Agent notes: </dt><dd className="inline text-cx-ink">{d.notes}</dd></div> : null}
        </dl>
        <DocButtons docs={(app.documents || []).filter((x) => ["vv_registry_evidence", "vv_customs_evidence", "customs_duty_certificate"].includes(x.doc_type))} onPreview={onPreview} />
      </>
    );
  } else if (type === "final-review" && isCmr) {
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">Check the registry document shows the vehicle on the ECMR. Approving releases it to the customer; rejecting sends it back to the agent.</p>
        <DocButtons docs={(app.documents || []).filter((x) => x.doc_type === "central_registry_certificate")} onPreview={onPreview} label="View registry certificate" />
      </>
    );
  } else if (type === "final-review") {
    const what = appType === "tinted_permit" ? "the finished permit" : appType.startsWith("number_plate_") ? "the finished plate" : "the licence";
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">Check {what} the agent uploaded. Approving releases it to the customer; rejecting sends it back to the agent.</p>
        <LicenceSummary licence={app.permanent_licence} onPreview={onPreview} />
        <DocButtons docs={(app.documents || []).filter((x) => x.doc_type === "finished_licence_card" && !app.permanent_licence?.document_url)} onPreview={onPreview} label="View uploaded document" />
      </>
    );
  } else if (type === "push-to-customer") {
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">Who dispatched it, and a note the customer will see.</p>
        <Field label="Dispatched by">
          {(p) => <Input {...p} value={dispatchedBy} onChange={(e) => setDispatchedBy(e.target.value)} placeholder="e.g. Ikeja processing desk" />}
        </Field>
        <Field label="Tracking note">
          {(p) => <Textarea {...p} value={trackingNote} onChange={(e) => setTrackingNote(e.target.value)} placeholder="e.g. Ready for collection at the Ikeja VIO office from Monday." />}
        </Field>
      </>
    );
  } else if (type === "ready-for-pickup") {
    body = <p className="text-[15px] text-cx-ink-2">The customer gets an SMS and WhatsApp message that their licence card is ready to collect at the agent's VIO office.</p>;
  } else if (type === "confirm-receipt") {
    body = <p className="text-[15px] text-cx-ink-2">Confirms you have the finished document in hand and closes this application. The customer is told by SMS and WhatsApp.</p>;
  } else if (type === "release-particulars") {
    body = <p className="text-[15px] text-cx-ink-2">Each document in this request is offered to agents who handle that document type. Different documents can go to different agents.</p>;
  } else if (type === "particulars-item-review" && item) {
    const finalDoc = (app.documents || []).find((d) => d.doc_type === `${item.document_type}_final`);
    body = (
      <>
        <p className="text-[15px] text-cx-ink-2">
          Check the finished <strong className="text-cx-ink">{item.document_type?.replace(/_/g, " ")}</strong>. Approving counts it toward completing this request; it doesn't affect the other documents.
        </p>
        {finalDoc?.file_url ? <Button variant="secondary" size="sm" icon={Eye} onClick={() => onPreview(resolveMediaUrl(finalDoc.file_url))}>View submitted document</Button> : null}
      </>
    );
  }

  return (
    <Sheet
      open={!!type}
      onOpenChange={(o) => !o && !saving && onClose()}
      title={TITLES[type]}
      size={type === "final-review" && isRwx ? "lg" : "md"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button block variant={type === "reject" || (hasDecision && decision === "rejected") ? "danger" : "primary"} loading={saving} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Notice tone="red">{error}</Notice> : null}
        {body}
        {hasDecision ? (
          <>
            <DecisionField value={decision} onChange={setDecision} />
            <Field label="Note" required={decision === "rejected"} optional={decision !== "rejected"} hint={decision === "rejected" ? "The agent sees this." : undefined}>
              {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} placeholder={notePlaceholder[type] || (decision === "rejected" ? "e.g. Photo is blurry, re-upload needed." : "e.g. Verified against the application.")} />}
            </Field>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}
