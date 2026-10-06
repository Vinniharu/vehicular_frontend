"use client";

// Sections every agent job page shares: the header, the "next step" card,
// customer and vehicle details, and the documents gallery.

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Car,
  ChevronLeft,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Upload,
} from "lucide-react";
import { addApplicationDocument, downloadAgentBiodataPdf, resolveMediaUrl, uploadApplicationFile } from "@/lib/api";
import { validateUploadFile } from "@/lib/utils/fileValidation";
import { hasAgentUploadedAllDocuments } from "@/lib/utils/sla";
import { Badge, Button, Card, Notice } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { AGENT_DELIVERABLE_DOC_TYPES, applicantName, jobId, serviceLabel } from "./jobs";
import { Collapsible, CopyButton, Info, InfoGrid, ProgressSteps, SlaChip, StagePill } from "./ui";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function isPaid(app) {
  return app?.payment_status === "success" || app?.payment_options?.payment_status === "success";
}

/* ── Header ─────────────────────────────────────────────────────────── */

export function JobHeader({ application, stage, extra }) {
  const pushToast = useToast();
  const [downloading, setDownloading] = useState(false);
  const showSla = isPaid(application) && !hasAgentUploadedAllDocuments(application);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadAgentBiodataPdf(application.id);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Couldn't download the PDF",
        body: err?.message === "Failed to fetch" ? "Check your connection and try again." : err?.message,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="mb-5">
      <Link
        href="/agent/applications"
        className="cx-focus -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-cx px-2 text-sm font-medium text-cx-muted hover:text-cx-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        My jobs
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cx-muted">
            {serviceLabel(application.application_type)} · #{jobId(application)}
          </p>
          <h1 className="mt-0.5 font-display text-[26px] leading-tight text-cx-ink sm:text-[30px]">{applicantName(application)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StagePill stage={stage} />
            {showSla ? <SlaChip sla={application.sla} /> : null}
            {extra}
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={Download} loading={downloading} onClick={download}>
          {downloading ? "Preparing…" : "Biodata PDF"}
        </Button>
      </div>
    </header>
  );
}

/* ── Next step ──────────────────────────────────────────────────────── */

/**
 * The one thing the agent should do now. `action` is a Button; leave it out
 * when the job is waiting on someone else.
 */
export function NextStep({ stage, title, children, action, steps, current }) {
  const waiting = stage.bucket !== "todo";
  return (
    <Card className={cx("relative overflow-hidden", !waiting && "border-cx-brand/40")}>
      <span className={cx("absolute inset-y-0 left-0 w-1", waiting ? "bg-cx-line-strong" : stage.tone === "red" ? "bg-cx-red" : "bg-cx-brand")} aria-hidden />
      <p className="text-[13px] font-semibold text-cx-muted">{waiting ? "Status" : "Next step"}</p>
      <div className="mt-1 flex items-start gap-2.5">
        {waiting ? <Clock className="mt-1 h-5 w-5 shrink-0 text-cx-muted" aria-hidden /> : null}
        <h2 className="text-[19px] font-semibold leading-snug text-cx-ink">{title || stage.next}</h2>
      </div>
      {children ? <div className="mt-2 text-[15px] text-cx-ink-2">{children}</div> : null}
      {action ? <div className="mt-4 flex flex-col gap-2 sm:flex-row">{action}</div> : null}
      {steps ? (
        <div className="mt-5 border-t border-cx-line pt-4">
          <ProgressSteps steps={steps} current={current} />
        </div>
      ) : null}
    </Card>
  );
}

export function StaffNote({ title = "Staff asked for changes", note }) {
  return (
    <Notice tone="red" icon={AlertTriangle} title={title}>
      {note ? <p className="whitespace-pre-wrap">{note}</p> : "Fix the item below and submit it again."}
    </Notice>
  );
}

// The note staff left when they sent work back.
export function reworkNote(application, docTypes = []) {
  const rejected = (application.documents || []).find((d) => d.status === "rejected" && (!docTypes.length || docTypes.includes(d.doc_type)) && d.review_note);
  if (rejected) return rejected.review_note;
  if (application.review_note) return application.review_note;
  const ev = [...(application.events || [])].reverse().find((e) => (e.note || "").startsWith("Final review rejected:"));
  return ev ? ev.note.replace(/^Final review rejected:\s*/, "") : "";
}

/* ── Action list ────────────────────────────────────────────────────── */

export function ActionList({ title = "Other actions", actions }) {
  const visible = actions.filter(Boolean);
  if (!visible.length) return null;
  return (
    <Card padded={false}>
      <h2 className="px-4 pb-1 pt-4 text-[16px] font-semibold text-cx-ink sm:px-5">{title}</h2>
      <ul className="divide-y divide-cx-line">
        {visible.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.label}>
              <button
                type="button"
                onClick={a.onClick}
                disabled={a.loading}
                className={cx(
                  "cx-focus flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-cx-sunken disabled:opacity-60 sm:px-5",
                  a.tone === "red" && "text-cx-red"
                )}
              >
                <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", a.tone === "red" ? "bg-cx-red-soft" : "bg-cx-sunken text-cx-ink-2")}>
                  {a.loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-[15px] font-semibold", a.tone === "red" ? "text-cx-red" : "text-cx-ink")}>{a.label}</span>
                  {a.description ? <span className="block text-[13px] text-cx-muted">{a.description}</span> : null}
                </span>
              </button>
              {a.after}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ── Customer ───────────────────────────────────────────────────────── */

export function CustomerCard({ application }) {
  const d = application.applicant_details || {};
  const phone = [d.phone, application.applicant_phone, application.phone_number, application.phone].find((p) => p && p !== "N/A");
  const email = [d.email, application.applicant_email, application.email].find((e) => e && e !== "N/A");
  const delivery = d.delivery_address || application.delivery_address;
  const area = [application.lga || d.lga, application.state_of_residence || d.state_of_residence].filter(Boolean).join(", ");

  return (
    <Card>
      <h2 className="text-[16px] font-semibold text-cx-ink">Customer</h2>
      <div className="mt-3 space-y-3">
        {phone ? (
          <div className="flex items-center gap-2">
            <a href={`tel:${phone}`} className="cx-focus inline-flex min-h-11 flex-1 items-center gap-2.5 rounded-cx text-[15px] font-medium text-cx-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep">
                <Phone className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-mono">{phone}</span>
            </a>
            <CopyButton value={phone} label="phone number" />
          </div>
        ) : null}
        {email ? (
          <div className="flex items-center gap-2">
            <a href={`mailto:${email}`} className="cx-focus inline-flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-cx text-[15px] font-medium text-cx-ink">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-sunken text-cx-ink-2">
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <span className="truncate">{email}</span>
            </a>
            <CopyButton value={email} label="email" />
          </div>
        ) : null}
        {area ? (
          <p className="flex items-center gap-2.5 text-[15px] text-cx-ink-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-sunken">
              <MapPin className="h-4 w-4" aria-hidden />
            </span>
            {area}
          </p>
        ) : null}
        {delivery ? (
          <div className="rounded-cx bg-cx-sunken p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold text-cx-ink-2">Deliver to</p>
                <p className="mt-0.5 text-[15px] font-medium text-cx-ink">{delivery}</p>
              </div>
              <CopyButton value={delivery} label="delivery address" />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

/* ── Vehicle ────────────────────────────────────────────────────────── */

export function VehicleSection({ application, vehicle, defaultOpen = false }) {
  const v = vehicle || application.vehicle;
  const make = v?.make || application.vehicle_make;
  const model = v?.model || application.vehicle_model;
  const year = v?.year || application.year_of_manufacture || application.manufacturing_year;
  const colour = v?.colour || v?.color || application.vehicle_colour;
  const chassis = v?.chassis_number || v?.vin || application.chassis_number;
  const plate = v?.plate_number || application.plate_number;
  const engine = v?.engine_number || application.engine_number;
  const vType = application.vehicle_type || v?.vehicle_type;
  const body = application.vehicle_body_type || v?.vehicle_category;
  if (!make && !model && !chassis && !plate && !application.vehicle_id) return null;

  return (
    <Collapsible title="Vehicle" icon={Car} defaultOpen={defaultOpen}>
      <p className="mb-3 text-[16px] font-semibold text-cx-ink">
        {[year, make, model].filter(Boolean).join(" ") || "Vehicle"}
        {colour ? <span className="font-normal capitalize text-cx-muted"> · {colour}</span> : null}
      </p>
      <InfoGrid>
        <Info label="Plate number" value={plate || "New plate"} mono copy={!!plate} />
        <Info label="Chassis / VIN" value={chassis} mono copy wide />
        {engine ? <Info label="Engine number" value={engine} mono copy /> : null}
        <Info label="Type" value={vType ? String(vType).replace(/_/g, " ") : null} />
        <Info label="Body" value={body ? String(body).replace(/_/g, " ") : null} />
        {application.former_registration_number ? <Info label="Former plate" value={application.former_registration_number} mono /> : null}
      </InfoGrid>
    </Collapsible>
  );
}

/* ── Documents ──────────────────────────────────────────────────────── */

const DOC_LABELS = {
  proof_of_ownership: "Proof of ownership",
  vehicle_licence: "Vehicle licence",
  tinted_passport_photo: "Applicant photo",
  vehicle_photo_front: "Vehicle — front",
  vehicle_photo_back: "Vehicle — rear",
  vehicle_photo_side: "Vehicle — side",
  vin_sticker_photo: "VIN / chassis sticker",
  face_verification_screenshot: "Face verification",
  temporary_tinted_permit: "Temporary permit",
  previous_licence: "Previous licence",
  old_driver_licence: "Old driver's licence",
  id_document: "ID document",
  proof_of_identity: "ID document",
  international_passport: "International passport",
  passport_photo: "Passport photo",
  driving_school_certificate: "Driving school certificate",
  cac_certificate: "CAC certificate",
  company_letterhead: "Company letterhead",
  police_report: "Police report",
  court_affidavit: "Court affidavit",
  tinted_permit_progress_evidence: "Work-in-progress photo",
  plate_production_in_progress: "Plate production photo",
  finished_licence_card: "Finished document (yours)",
  temporary_driver_licence: "Temporary licence (yours)",
  central_registry_certificate: "Registry certificate (yours)",
  vv_registry_evidence: "Verification evidence (yours)",
  vv_customs_evidence: "Verification evidence (yours)",
  customs_duty_certificate: "Customs duty certificate",
};

export const docLabel = (type) => DOC_LABELS[type] || (type || "Document").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const isImage = (url) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url || "") || (url || "").startsWith("data:image");

export function DocumentsSection({ application, onPreview, onChanged, defaultOpen = true, filter }) {
  const pushToast = useToast();
  const [busyType, setBusyType] = useState(null);

  const all = [
    ...(application.passport_photo ? [{ doc_type: "passport_photo", file_url: application.passport_photo }] : []),
    ...(application.documents || []),
  ];
  const seen = new Set();
  const docs = all.filter((d) => {
    if (filter && !filter(d)) return false;
    const key = `${d.doc_type}_${d.file_url || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Staff can reject a customer document; the agent may replace it here.
  const replace = async (docType, file) => {
    if (!file) return;
    const check = validateUploadFile(file, { maxSizeMb: 10 });
    if (!check.valid) return pushToast({ tone: "error", title: check.error });
    setBusyType(docType);
    const up = await uploadApplicationFile(file);
    if (up.error || !up.data?.file_url) {
      setBusyType(null);
      return pushToast({ tone: "error", title: "Upload failed", body: up.error });
    }
    const res = await addApplicationDocument(application.id, { doc_type: docType, file_url: up.data.file_url });
    setBusyType(null);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't save the document", body: res.error });
    pushToast({ tone: "success", title: "Document replaced", body: "Staff will review the new copy." });
    onChanged?.();
  };

  return (
    <Collapsible title="Documents" icon={FileText} count={docs.length} defaultOpen={defaultOpen}>
      {docs.length === 0 ? (
        <p className="text-sm text-cx-muted">No documents yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {docs.map((doc, i) => {
            const url = resolveMediaUrl(doc.file_url);
            return (
              <li key={`${doc.doc_type}-${i}`} className="flex flex-col overflow-hidden rounded-cx border border-cx-line bg-cx-surface">
                <button type="button" onClick={() => onPreview(url)} className="cx-focus group relative block aspect-[4/3] bg-cx-sunken" aria-label={`View ${docLabel(doc.doc_type)}`}>
                  {isImage(doc.file_url) ? (
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-cx-muted">
                      <FileText className="h-8 w-8" aria-hidden />
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-cx-surface/95 px-2 py-1 text-xs font-medium text-cx-ink shadow-cx">
                    <Eye className="h-3.5 w-3.5" aria-hidden /> View
                  </span>
                </button>
                <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                  <p className="text-sm font-medium leading-snug text-cx-ink">{docLabel(doc.doc_type)}</p>
                  {doc.status === "approved" ? <Badge tone="brand" className="self-start">Approved</Badge> : doc.status === "rejected" ? <Badge tone="red" className="self-start">Rejected</Badge> : null}
                  {doc.status === "rejected" && doc.review_note ? <p className="text-[13px] text-cx-red">{doc.review_note}</p> : null}
                  {/* The agent's own work is corrected through the finish step, not here. */}
                  {doc.status === "rejected" && doc.doc_type !== "passport_photo" && !AGENT_DELIVERABLE_DOC_TYPES.includes(doc.doc_type) && doc.doc_type !== "temporary_driver_licence" ? (
                    <label className="mt-auto inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-cx-sm border border-cx-line-strong text-sm font-semibold text-cx-ink focus-within:ring-4 focus-within:ring-[color:var(--cx-focus)] hover:bg-cx-sunken">
                      {busyType === doc.doc_type ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                      {busyType === doc.doc_type ? "Uploading…" : "Replace"}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        disabled={busyType === doc.doc_type}
                        onChange={(e) => {
                          replace(doc.doc_type, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Collapsible>
  );
}
